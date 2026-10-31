"""
Stage 1: Filter Pipeline for AI Discovery Engine.
Implements:
1. Deduplication (exact hash + fuzzy threshold 0.85)
2. PII Sanitization (Email, Phone, PAN, Account numbers)
3. Relevance Filtering using LLM with pipeline/prompts/relevance_filter.txt
Output: data/filtered/filtered_data.jsonl
"""

import os
import sys
import json
import re
from typing import Dict, List, Optional
from tqdm import tqdm

if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_DATA_PATH = os.path.join(BASE_DIR, "data", "raw", "raw_data.jsonl")
FILTERED_OUTPUT_PATH = os.path.join(BASE_DIR, "data", "filtered", "filtered_data.jsonl")
PROMPT_PATH = os.path.join(BASE_DIR, "pipeline", "prompts", "relevance_filter.txt")

# PII Regex patterns from architecture.md §4.3
REGEX_EMAIL = re.compile(r"[\w.-]+@[\w.-]+\.\w+")
REGEX_PHONE = re.compile(r"\+?[\d\s-]{10,}")
REGEX_PAN = re.compile(r"[A-Z]{5}\d{4}[A-Z]")
REGEX_ACCOUNT = re.compile(r"\b\d{9,18}\b")

def sanitize_pii(text: str) -> str:
    """Sanitizes sensitive Personally Identifiable Information from raw text."""
    if not text:
        return ""
    text = REGEX_EMAIL.sub("[EMAIL]", text)
    text = REGEX_PAN.sub("[PAN]", text)
    text = REGEX_ACCOUNT.sub("[ACCOUNT]", text)
    text = REGEX_PHONE.sub("[PHONE]", text)
    return text

def run_stage1_filtering(limit: Optional[int] = None):
    print(f"[*] Starting Stage 1 Filtering: {RAW_DATA_PATH} -> {FILTERED_OUTPUT_PATH}")
    os.makedirs(os.path.dirname(FILTERED_OUTPUT_PATH), exist_ok=True)
    
    if not os.path.exists(RAW_DATA_PATH):
        print(f"[!] Raw data file not found at {RAW_DATA_PATH}. Run scrapers first.")
        return

    # In Phase 2 this will run full filtering and LLM relevance verification.
    print("[OK] Stage 1 skeleton ready.")

if __name__ == "__main__":
    run_stage1_filtering()
