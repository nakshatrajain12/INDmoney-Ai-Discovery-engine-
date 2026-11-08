"""
Unified LLM Client for AI Discovery Engine.
Supports Anthropic Claude (Claude 3.5 Haiku & Sonnet), Groq LPU (multi-key rotation), and OpenAI.
Implements:
- Claude 3.5 Haiku as default bulk model (if ANTHROPIC_API_KEY set)
- Automatic fallback to Claude 3.5 Sonnet when analysis_confidence < 0.70
- Groq fallback with multi-key rotation (GROQ_API_KEY, GROQ_API_KEY_2, GROQ_API_KEY_3)
- Rate limiting (5 req/s) with exponential backoff
- 3 retries with failure logging to data/failed_extractions.json
"""

import os
import sys
import json
import time
import re
from typing import Any, Dict, Optional, Tuple
from datetime import datetime, timezone
from dotenv import load_dotenv

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

load_dotenv()

FAILED_LOG_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "data", "failed_extractions.json"
)

def _clean_json_markdown(text: str) -> str:
    """Strip markdown code fence if LLM wraps JSON response in ```json ... ```"""
    text = text.strip()
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text, re.IGNORECASE)
    if match:
        return match.group(1).strip()
    return text

class LLMClient:
    def __init__(self, provider: Optional[str] = None):
        """
        Initializes LLM client.
        Provider priority if not explicitly specified:
        1. anthropic (if ANTHROPIC_API_KEY set and valid)
        2. groq (if GROQ_API_KEY set and valid)
        3. openai (if OPENAI_API_KEY set and valid)
        """
        self.anthropic_key = os.getenv("ANTHROPIC_API_KEY")
        self.openai_key = os.getenv("OPENAI_API_KEY")
        
        # Collect Groq keys for automatic rotation
        self.groq_keys = []
        for key_name in ["GROQ_API_KEY", "GROQ_API_KEY_2", "GROQ_API_KEY_3"]:
            val = os.getenv(key_name)
            if val and "your_" not in val.lower() and len(val.strip()) > 10:
                self.groq_keys.append(val.strip())
        
        self.groq_idx = 0
        self.groq_clients = []
        
        # Determine provider
        if provider:
            self.provider = provider.lower()
        elif self.anthropic_key and "your_" not in self.anthropic_key.lower():
            self.provider = "anthropic"
        elif self.groq_keys:
            self.provider = "groq"
        elif self.openai_key and "your_" not in self.openai_key.lower():
            self.provider = "openai"
        else:
            raise ValueError(
                "[!] No valid API key found. Please set ANTHROPIC_API_KEY or GROQ_API_KEY in .env"
            )

        # Rate limiting state (max 5 requests per second = min 0.2s between calls)
        self.min_interval = 0.2
        self.last_call_time = 0.0

        # Initialize underlying client(s)
        self._init_clients()
        print(f"[OK] LLM Client initialized with provider: '{self.provider}'")

    def _init_clients(self):
        if self.provider == "anthropic":
            import anthropic
            self.anthropic_client = anthropic.Anthropic(api_key=self.anthropic_key)
            self.default_model = "claude-3-5-haiku-20241022"
            self.fallback_model = "claude-3-5-sonnet-20241022"

        elif self.provider == "groq":
            from groq import Groq
            self.groq_clients = [Groq(api_key=k) for k in self.groq_keys]
            self.default_model = "openai/gpt-oss-120b"
            self.fallback_model = "qwen/qwen3.8-27b"

        elif self.provider == "openai":
            from openai import OpenAI
            self.openai_client = OpenAI(api_key=self.openai_key)
            self.default_model = "gpt-4o-mini"
            self.fallback_model = "gpt-4o"

    def rotate_groq_key(self):
        """Public method to rotate Groq keys proactively across requests."""
        if len(self.groq_clients) > 1:
            prev = self.groq_idx
            self.groq_idx = (self.groq_idx + 1) % len(self.groq_clients)

    def _rotate_groq_key(self):
        self.rotate_groq_key()
        if len(self.groq_clients) > 1:
            print(f"[*] Rotated Groq API key: -> {self.groq_idx+1}")

    def _enforce_rate_limit(self):
        elapsed = time.time() - self.last_call_time
        if elapsed < self.min_interval:
            time.sleep(self.min_interval - elapsed)
        self.last_call_time = time.time()

    def _log_failure(self, prompt: str, error: str, metadata: Optional[Dict] = None):
        """Append failed extraction payload to data/failed_extractions.json"""
        os.makedirs(os.path.dirname(FAILED_LOG_PATH), exist_ok=True)
        failure_record = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "provider": self.provider,
            "error": error,
            "prompt_preview": prompt[:300] if prompt else "",
            "metadata": metadata or {}
        }
        
        existing_failures = []
        if os.path.exists(FAILED_LOG_PATH):
            try:
                with open(FAILED_LOG_PATH, "r", encoding="utf-8") as f:
                    existing_failures = json.load(f)
                    if not isinstance(existing_failures, list):
                        existing_failures = []
            except Exception:
                existing_failures = []
        
        existing_failures.append(failure_record)
        with open(FAILED_LOG_PATH, "w", encoding="utf-8") as f:
            json.dump(existing_failures, f, indent=2)

    def _call_raw(self, system_prompt: str, user_prompt: str, model: str) -> str:
        self._enforce_rate_limit()

        if self.provider == "anthropic":
            response = self.anthropic_client.messages.create(
                model=model,
                max_tokens=2048,
                temperature=0.1,
                system=system_prompt,
                messages=[{"role": "user", "content": user_prompt}]
            )
            return response.content[0].text

        elif self.provider == "groq":
            client = self.groq_clients[self.groq_idx]
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.1
            )
            return response.choices[0].message.content

        elif self.provider == "openai":
            response = self.openai_client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.1
            )
            return response.choices[0].message.content

        raise ValueError(f"Unknown provider: {self.provider}")

    def call_json(
        self,
        system_prompt: str,
        user_prompt: str,
        model: Optional[str] = None,
        retries: int = 3,
        metadata: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Executes LLM call with JSON parsing.
        Retries 3x with exponential backoff.
        Automatically escalates to fallback model if analysis_confidence < 0.70.
        Logs permanent failures to data/failed_extractions.json.
        """
        active_model = model or self.default_model
        last_error = None

        for attempt in range(1, retries + 1):
            try:
                raw_text = self._call_raw(system_prompt, user_prompt, active_model)
                cleaned = _clean_json_markdown(raw_text)
                parsed = json.loads(cleaned)

                # Check confidence for automatic escalation if confidence is available
                confidence = parsed.get("analysis_confidence")
                if (
                    isinstance(confidence, (int, float))
                    and confidence < 0.70
                    and active_model == self.default_model
                    and self.fallback_model != self.default_model
                ):
                    print(f"[*] Confidence {confidence:.2f} < 0.70. Escalating to {self.fallback_model}...")
                    return self.call_json(
                        system_prompt,
                        user_prompt,
                        model=self.fallback_model,
                        retries=2,
                        metadata=metadata
                    )

                return parsed

            except Exception as e:
                last_error = str(e)
                print(f"[!] {self.provider.upper()} Call Error (Attempt {attempt}/{retries}): {last_error}")
                
                if self.provider == "groq" and ("rate_limit" in last_error.lower() or "429" in last_error):
                    self._rotate_groq_key()
                    time.sleep(1.0)
                else:
                    time.sleep(1.5 * attempt)

        # If primary failed after retries and fallback model differs, try fallback
        if active_model != self.fallback_model:
            print(f"[*] Primary model failed. Attempting fallback model: {self.fallback_model}...")
            try:
                raw_text = self._call_raw(system_prompt, user_prompt, self.fallback_model)
                cleaned = _clean_json_markdown(raw_text)
                return json.loads(cleaned)
            except Exception as e:
                last_error = f"Fallback error: {str(e)}"

        # Final failure: Log to data/failed_extractions.json
        print(f"[ERROR] Extraction failed completely after retries. Logging to {FAILED_LOG_PATH}...")
        self._log_failure(user_prompt, last_error or "Unknown error", metadata=metadata)
        raise RuntimeError(f"All LLM retry attempts failed: {last_error}")

    def test_connection(self) -> Tuple[bool, Any]:
        """Runs a verification ping to confirm API connectivity and JSON parsing."""
        try:
            res = self.call_json(
                system_prompt="You are a JSON assistant. Respond with: {\"status\": \"connected\", \"provider\": \"active\"}",
                user_prompt="Ping test. Return valid JSON only."
            )
            return True, res
        except Exception as e:
            return False, str(e)


if __name__ == "__main__":
    client = LLMClient()
    success, res = client.test_connection()
    print("Verification Result:", "SUCCESS" if success else "FAILED")
    print("Response:", res)
