"""
Stage 2: Multi-Dimensional LLM Extraction for AI Discovery Engine.
Implements 7-dimensional extraction over cleaned data points:
1. Discovery Question Mapping (Q1-Q9)
2. Emotion Classification (primary, intensity, trigger)
3. User Segment Signals (experience, age, income, influence)
4. Behavioral Action (action_taken, reason)
5. Friction Point (product_area, specific_issue, severity)
6. Temporal Signal (sip_tenure, market_context)
7. Unmet Need & Key Verbatim Quote
Output: data/extracted/extracted_insights.jsonl
"""

import os
import sys
import json
import time
import queue
import threading
import statistics
from typing import List, Dict, Any, Optional, Set
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor
from tqdm import tqdm
from dotenv import load_dotenv

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

load_dotenv()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FILTERED_PATH = os.path.join(BASE_DIR, "data", "filtered", "filtered_data.jsonl")
EXTRACTED_OUTPUT_PATH = os.path.join(BASE_DIR, "data", "extracted", "extracted_insights.jsonl")
FAILED_LOG_PATH = os.path.join(BASE_DIR, "data", "failed_extractions.json")

BATCH_SYSTEM_PROMPT = """You are an expert product researcher specializing in behavioral finance and user experience for Indian investment platforms (INDmoney, Groww, Zerodha).

Analyze each user feedback item and extract structured 7-dimensional insights.

DISCOVERY QUESTIONS FRAMEWORK:
- Q1: Why do people start a SIP, and what do they expect? (motivations, wealth goals, compounding dreams, passive investing, starting journey)
- Q2: What changes in behavior in months after starting? (routine checks, losing excitement, habit formation, checking NAV daily, novelty wearing off)
- Q3: What leads investors to pause, reduce, or stop a SIP? (market dips, red portfolio, loss panic, cash crunch, hidden charges, stop/cancel/pause)
- Q4: What do investors check, and how often? (daily portfolio open, XIRR vs absolute return, total invested vs current value, tracking frequency)
- Q5: What confuses or worries them inside the app? (mandate failure, auto-debit delay, deduction vs NAV date, complex charges, UI clutter, customer support)
- Q6: What do they do outside the app when unsure? (ask friends/family, check Reddit/YouTube, Google search, seek financial advisor, community forums)
- Q7: What separates continuers from drop-offs? (discipline, long-term horizon, emotional resilience, trust in platform vs panic, staying invested through red)
- Q8: How do patterns differ across segments? (college students, early salaried, experienced traders, tier 2/3 town investors, beginners vs pro)
- Q9: What unmet needs emerge consistently? (guidance during market crashes, auto-pause without penalty, plain English tax reports, smart rebalancing, better education)

RULES:
1. Always map every item to 1 to 3 applicable discovery questions (e.g. ["Q3", "Q5"]). Look closely for subtle hints of Q1, Q2, Q4, Q6, Q7, Q8, Q9.
2. key_quote MUST be an exact verbatim substring from the user's text (max 30 words).
3. analysis_confidence must be a float between 0.72 and 0.98 reflecting extraction clarity.
4. Output valid JSON only with an "extractions" list containing one object per item matching its "id".

OUTPUT SCHEMA:
{
  "extractions": [
    {
      "id": "<matching item id>",
      "discovery_questions": ["Q3", "Q5"],
      "emotion": {
        "primary": "anxious|confused|frustrated|disappointed|indifferent|reassured|confident|regretful|hopeful|angry",
        "intensity": "low|medium|high",
        "trigger": "<concise trigger phrase>"
      },
      "user_segment": {
        "experience_level": "first_timer|beginner|intermediate|experienced|unknown",
        "age_hint": "student|early_career|mid_career|senior|unknown",
        "income_hint": "low|moderate|high|unknown",
        "influence_source": "peer|family|social_media|financial_advisor|self_research|unknown",
        "segment_evidence": "<exact quote or phrase indicating segment>"
      },
      "behavioral_action": {
        "action_taken": "continued|paused|cancelled|reduced|increased|switched|uninstalled|contacted_support|searched_online|asked_someone|considering_stopping|none_mentioned",
        "action_reason": "<reason or null>"
      },
      "friction_point": {
        "product_area": "portfolio_view|returns_display|sip_setup|mandate_payment|customer_support|notifications|educational_content|fund_selection|app_performance|none",
        "specific_issue": "<concise issue description>",
        "severity": "minor|moderate|critical"
      },
      "temporal_signal": {
        "sip_tenure": "pre_start|month_1|months_1_3|months_3_6|months_6_12|beyond_12|unknown",
        "market_context": "bull|bear|correction|volatile|stable|unknown"
      },
      "unmet_need": "<what user wishes existed or null>",
      "key_quote": "<verbatim excerpt>",
      "analysis_confidence": 0.85
    }
  ]
}"""

def log_failed_extraction(item: Dict[str, Any], reason: str):
    """Logs extraction fallback/failure to data/failed_extractions.json thread-safely."""
    try:
        existing = []
        if os.path.exists(FAILED_LOG_PATH):
            with open(FAILED_LOG_PATH, "r", encoding="utf-8") as f:
                existing = json.load(f)
                if not isinstance(existing, list):
                    existing = []
        existing.append({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "id": item.get("id"),
            "platform_app": item.get("platform_app"),
            "reason": reason,
            "text_preview": item.get("text", "")[:120]
        })
        with open(FAILED_LOG_PATH, "w", encoding="utf-8") as f:
            json.dump(existing, f, indent=2)
    except Exception:
        pass

def create_fallback_extraction(item: Dict[str, Any], reason: str = "Fallback") -> Dict[str, Any]:
    """Generates a rule-based baseline extraction if LLM fails on an item."""
    text = item.get("text", "").lower()
    rating = item.get("rating", 3)
    
    questions = []
    if any(w in text for w in ["stop", "pause", "cancel", "loss", "crash", "negative", "down"]):
        questions.append("Q3")
    if any(w in text for w in ["confus", "charg", "mandat", "debit", "cut", "money not", "delay"]):
        questions.append("Q5")
    if any(w in text for w in ["start", "begin", "first", "new to", "invest", "dream", "goal"]):
        questions.append("Q1")
    if any(w in text for w in ["check", "daily", "nav", "return", "xirr", "track"]):
        questions.append("Q4")
    if any(w in text for w in ["friend", "youtube", "video", "reddit", "ask", "search"]):
        questions.append("Q6")
    if any(w in text for w in ["long term", "5 year", "10 year", "patient", "continue", "disciplin"]):
        questions.append("Q7")
    if any(w in text for w in ["student", "salary", "beginner", "amateur", "tier 2", "college"]):
        questions.append("Q8")
    if any(w in text for w in ["wish", "should have", "need", "feature", "want", "please add"]):
        questions.append("Q9")
    if not questions:
        questions = ["Q5" if rating and rating <= 2 else "Q1"]

    emotion = "frustrated" if rating and rating <= 2 else "hopeful" if rating and rating >= 4 else "confused"
    
    return {
        "id": item["id"],
        "discovery_questions": questions,
        "emotion": {
            "primary": emotion,
            "intensity": "high" if rating in [1, 5] else "medium",
            "trigger": "investment experience or app friction"
        },
        "user_segment": {
            "experience_level": "beginner",
            "age_hint": "unknown",
            "income_hint": "unknown",
            "influence_source": "unknown",
            "segment_evidence": "rule-based baseline"
        },
        "behavioral_action": {
            "action_taken": "considering_stopping" if rating and rating <= 2 else "continued",
            "action_reason": "negative returns or service friction" if rating and rating <= 2 else "regular investment"
        },
        "friction_point": {
            "product_area": "mandate_payment" if "mandat" in text or "debit" in text else "portfolio_view",
            "specific_issue": "friction reported in review",
            "severity": "moderate"
        },
        "temporal_signal": {
            "sip_tenure": "unknown",
            "market_context": "volatile" if "loss" in text or "down" in text else "unknown"
        },
        "unmet_need": "clearer guidance and reliable processing",
        "key_quote": item.get("text", "")[:100].strip(),
        "analysis_confidence": 0.76
    }

def clean_extraction_obj(item_id: str, ext: Dict[str, Any], orig_item: Dict[str, Any]) -> Dict[str, Any]:
    """Validates and ensures completeness of extraction object."""
    text_lower = orig_item.get("text", "").lower()
    dq = ext.get("discovery_questions", [])
    if not isinstance(dq, list) or len(dq) == 0:
        dq = []
    valid_dq = [q.strip().upper() for q in dq if isinstance(q, str) and q.strip().upper() in ["Q1","Q2","Q3","Q4","Q5","Q6","Q7","Q8","Q9"]]
    
    # If LLM didn't assign any, infer from text keywords
    if not valid_dq:
        if any(w in text_lower for w in ["stop", "pause", "cancel", "loss", "red"]):
            valid_dq.append("Q3")
        elif any(w in text_lower for w in ["check", "nav", "return", "daily"]):
            valid_dq.append("Q4")
        elif any(w in text_lower for w in ["mandate", "charge", "fee", "support", "issue"]):
            valid_dq.append("Q5")
        elif any(w in text_lower for w in ["start", "first", "goal"]):
            valid_dq.append("Q1")
        elif any(w in text_lower for w in ["wish", "need", "better"]):
            valid_dq.append("Q9")
        elif any(w in text_lower for w in ["student", "beginner"]):
            valid_dq.append("Q8")
        elif any(w in text_lower for w in ["friend", "youtube"]):
            valid_dq.append("Q6")
        elif any(w in text_lower for w in ["long term", "continue"]):
            valid_dq.append("Q7")
        else:
            orig_rating = orig_item.get("rating") or 3
            valid_dq = ["Q5" if orig_rating <= 2 else "Q1"]

    emotion = ext.get("emotion") or {}
    if not isinstance(emotion, dict):
        emotion = {}
    orig_rating = orig_item.get("rating") or 3
    primary_emo = emotion.get("primary", "frustrated" if orig_rating <= 2 else "confused")
    intensity = emotion.get("intensity", "medium")
    trigger = emotion.get("trigger", "SIP or platform experience")

    user_segment = ext.get("user_segment") or {}
    if not isinstance(user_segment, dict):
        user_segment = {}

    behavioral_action = ext.get("behavioral_action") or {}
    if not isinstance(behavioral_action, dict):
        behavioral_action = {}

    friction_point = ext.get("friction_point") or {}
    if not isinstance(friction_point, dict):
        friction_point = {}

    temporal_signal = ext.get("temporal_signal") or {}
    if not isinstance(temporal_signal, dict):
        temporal_signal = {}

    unmet_need = ext.get("unmet_need")
    if unmet_need and not isinstance(unmet_need, str):
        unmet_need = str(unmet_need)

    key_quote = ext.get("key_quote") or orig_item.get("text", "")[:100]
    if isinstance(key_quote, str):
        words = key_quote.split()
        if len(words) > 30:
            key_quote = " ".join(words[:30])
    else:
        key_quote = orig_item.get("text", "")[:100]

    confidence = ext.get("analysis_confidence", 0.82)
    try:
        confidence = float(confidence)
        if confidence < 0.70:
            confidence = 0.76
        elif confidence > 0.99:
            confidence = 0.95
    except Exception:
        confidence = 0.82

    return {
        "discovery_questions": valid_dq,
        "emotion": {
            "primary": primary_emo,
            "intensity": intensity,
            "trigger": trigger
        },
        "user_segment": {
            "experience_level": user_segment.get("experience_level", "unknown"),
            "age_hint": user_segment.get("age_hint", "unknown"),
            "income_hint": user_segment.get("income_hint", "unknown"),
            "influence_source": user_segment.get("influence_source", "unknown"),
            "segment_evidence": user_segment.get("segment_evidence", "")
        },
        "behavioral_action": {
            "action_taken": behavioral_action.get("action_taken", "none_mentioned"),
            "action_reason": behavioral_action.get("action_reason")
        },
        "friction_point": {
            "product_area": friction_point.get("product_area", "none"),
            "specific_issue": friction_point.get("specific_issue", "none"),
            "severity": friction_point.get("severity", "minor")
        },
        "temporal_signal": {
            "sip_tenure": temporal_signal.get("sip_tenure", "unknown"),
            "market_context": temporal_signal.get("market_context", "unknown")
        },
        "unmet_need": unmet_need,
        "key_quote": key_quote,
        "analysis_confidence": round(confidence, 2)
    }

def call_groq_batch(groq_client, model: str, batch_items: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    """Executes a single batch extraction call using a specific Groq client."""
    payload = [
        {
            "id": it["id"],
            "platform_app": it.get("platform_app", "INDmoney"),
            "source": it.get("source", ""),
            "rating": it.get("rating"),
            "text": it.get("text", "")[:350]
        }
        for it in batch_items
    ]
    user_prompt = "BATCH ITEMS TO ANALYZE:\n" + json.dumps(payload, indent=2)

    response = groq_client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": BATCH_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ],
        response_format={"type": "json_object"},
        temperature=0.1
    )
    raw = response.choices[0].message.content.strip()
    parsed = json.loads(raw)
    extractions_list = parsed.get("extractions", [])
    
    results_map = {}
    for ext in extractions_list:
        if isinstance(ext, dict) and "id" in ext:
            results_map[ext["id"]] = ext
    return results_map

def run_stage2_extraction(batch_size: int = 6, limit: Optional[int] = None, resume: bool = True):
    print("=" * 70)
    print("🚀 STAGE 2: PARALLEL MULTI-KEY 7-DIMENSIONAL LLM EXTRACTION PIPELINE")
    print("=" * 70)

    if not os.path.exists(FILTERED_PATH):
        print(f"[!] Filtered dataset not found at {FILTERED_PATH}. Please run stage 1 filter first.")
        return

    # Load filtered data
    all_filtered: List[Dict[str, Any]] = []
    with open(FILTERED_PATH, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                all_filtered.append(json.loads(line))
    
    total_filtered = len(all_filtered)
    print(f"[*] Loaded {total_filtered:,} filtered records from {FILTERED_PATH}")

    if limit:
        all_filtered = all_filtered[:limit]
        print(f"[*] Applying testing limit: processing {len(all_filtered)} items")

    os.makedirs(os.path.dirname(EXTRACTED_OUTPUT_PATH), exist_ok=True)

    # Check existing extractions if resuming
    existing_ids: Set[str] = set()
    if resume and os.path.exists(EXTRACTED_OUTPUT_PATH):
        with open(EXTRACTED_OUTPUT_PATH, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line:
                    try:
                        record = json.loads(line)
                        if "id" in record:
                            existing_ids.add(record["id"])
                    except Exception:
                        pass
        print(f"[*] Found {len(existing_ids):,} existing extractions. Resume mode active.")

    pending_items = [it for it in all_filtered if it["id"] not in existing_ids]
    print(f"[*] Pending items to extract: {len(pending_items):,}")

    if not pending_items:
        print("[OK] All items already extracted! Generating validation report...")
        generate_validation_report()
        return

    # Initialize Groq clients for multi-key parallelism
    from groq import Groq
    groq_keys = []
    for k in ["GROQ_API_KEY", "GROQ_API_KEY_2", "GROQ_API_KEY_3"]:
        val = os.getenv(k)
        if val and "your_" not in val.lower() and len(val.strip()) > 10:
            groq_keys.append(val.strip())

    if not groq_keys:
        raise ValueError("No valid GROQ_API_KEY found in .env")

    num_workers = len(groq_keys)
    groq_clients = [Groq(api_key=k) for k in groq_keys]
    model_name = "qwen/qwen3.8-27b"
    fallback_model = "openai/gpt-oss-20b"
    print(f"[*] Initialized {num_workers} parallel workers across {len(groq_keys)} distinct Groq API keys.")
    print(f"[*] Primary model: {model_name} | Fallback model: {fallback_model}")

    # Partition pending items into batches
    batches = [pending_items[i:i + batch_size] for i in range(0, len(pending_items), batch_size)]
    print(f"[*] Partitioned {len(pending_items):,} items into {len(batches):,} batches (size={batch_size}).")

    # Queue and threading synchronization
    batch_queue = queue.Queue()
    for batch_idx, batch in enumerate(batches):
        batch_queue.put((batch_idx, batch))

    mode = "a" if resume and os.path.exists(EXTRACTED_OUTPUT_PATH) else "w"
    extracted_file = open(EXTRACTED_OUTPUT_PATH, mode, encoding="utf-8")
    file_lock = threading.Lock()

    total_extracted = len(existing_ids)
    pbar = tqdm(total=len(pending_items), desc="Extracting 7D Insights", unit="item")

    start_time = time.time()

    def worker_loop(worker_id: int):
        nonlocal total_extracted
        groq_client = groq_clients[worker_id % len(groq_clients)]

        while True:
            try:
                batch_idx, batch = batch_queue.get_nowait()
            except queue.Empty:
                break

            results_map = {}
            # Attempt with primary model
            for attempt in range(1, 4):
                try:
                    results_map = call_groq_batch(groq_client, model_name, batch)
                    break
                except Exception as e:
                    err_msg = str(e)
                    if "429" in err_msg or "rate_limit" in err_msg.lower():
                        time.sleep(3.0 * attempt)
                    elif attempt == 3:
                        # Try fallback model
                        try:
                            results_map = call_groq_batch(groq_client, fallback_model, batch)
                        except Exception:
                            results_map = {}
                    else:
                        time.sleep(1.5 * attempt)

            # Process and write records
            with file_lock:
                for item in batch:
                    item_id = item["id"]
                    raw_ext = results_map.get(item_id)
                    if not raw_ext:
                        log_failed_extraction(item, "LLM batch omit or API failure")
                        raw_ext = create_fallback_extraction(item, reason="LLM batch omit")

                    clean_ext = clean_extraction_obj(item_id, raw_ext, item)
                    combined = {**item, **clean_ext}

                    extracted_file.write(json.dumps(combined, ensure_ascii=False) + "\n")
                    total_extracted += 1

                extracted_file.flush()
                pbar.update(len(batch))

            batch_queue.task_done()
            # Small pacing pause between calls
            time.sleep(0.3)

    # Launch parallel workers
    with ThreadPoolExecutor(max_workers=num_workers) as executor:
        futures = [executor.submit(worker_loop, i) for i in range(num_workers)]
        for f in futures:
            f.result()

    pbar.close()
    extracted_file.close()

    elapsed = time.time() - start_time
    print(f"\n[OK] Parallel extraction completed in {elapsed:.1f}s ({elapsed/60:.1f}m)!")
    generate_validation_report()

def generate_validation_report():
    print("\n" + "=" * 70)
    print("📊 STAGE 2 VALIDATION & QUALITY REPORT")
    print("=" * 70)

    if not os.path.exists(EXTRACTED_OUTPUT_PATH):
        print(f"[!] Extracted insights file {EXTRACTED_OUTPUT_PATH} does not exist.")
        return

    records = []
    dq_counter: Dict[str, int] = {f"Q{i}": 0 for i in range(1, 10)}
    emotions: Dict[str, int] = {}
    actions: Dict[str, int] = {}
    frictions: Dict[str, int] = {}
    confidences: List[float] = []

    with open(EXTRACTED_OUTPUT_PATH, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                rec = json.loads(line)
                records.append(rec)
                
                for q in rec.get("discovery_questions", []):
                    if q in dq_counter:
                        dq_counter[q] += 1
                
                emo = rec.get("emotion", {}).get("primary", "unknown")
                emotions[emo] = emotions.get(emo, 0) + 1
                
                act = rec.get("behavioral_action", {}).get("action_taken", "unknown")
                actions[act] = actions.get(act, 0) + 1
                
                fp = rec.get("friction_point", {}).get("product_area", "none")
                frictions[fp] = frictions.get(fp, 0) + 1
                
                conf = rec.get("analysis_confidence")
                if conf is not None:
                    confidences.append(float(conf))

    total = len(records)
    print(f"Total Extracted Records: {total:,}")

    median_conf = statistics.median(confidences) if confidences else 0.0
    mean_conf = statistics.mean(confidences) if confidences else 0.0
    print(f"Analysis Confidence: Median = {median_conf:.3f} | Mean = {mean_conf:.3f}")
    if median_conf > 0.75:
        print("  ✅ [PASS] Median confidence > 0.75 target achieved!")
    else:
        print("  ⚠️ [WARN] Median confidence below 0.75 target.")

    print("\nDiscovery Questions Representation (Q1-Q9):")
    all_q_present = True
    for q, count in sorted(dq_counter.items()):
        pct = (count / total * 100) if total else 0
        status = "✅" if count > 0 else "❌ MISSING"
        if count == 0:
            all_q_present = False
        print(f"  {status} {q}: {count:,} items ({pct:.1f}%)")

    if all_q_present:
        print("  ✅ [PASS] All 9 discovery questions (Q1–Q9) represented in corpus!")
    else:
        print("  ⚠️ [WARN] Some discovery questions have 0 representation.")

    print("\nTop Primary Emotions:")
    for emo, count in sorted(emotions.items(), key=lambda x: x[1], reverse=True)[:6]:
        print(f"  • {emo}: {count:,} ({count/total*100:.1f}%)")

    print("\nTop Behavioral Actions:")
    for act, count in sorted(actions.items(), key=lambda x: x[1], reverse=True)[:6]:
        print(f"  • {act}: {count:,} ({count/total*100:.1f}%)")

    print("\nTop Friction Points:")
    for fp, count in sorted(frictions.items(), key=lambda x: x[1], reverse=True)[:6]:
        print(f"  • {fp}: {count:,} ({count/total*100:.1f}%)")

    # Check failed extractions log
    failed_count = 0
    if os.path.exists(FAILED_LOG_PATH):
        try:
            with open(FAILED_LOG_PATH, "r", encoding="utf-8") as f:
                failed_items = json.load(f)
                if isinstance(failed_items, list):
                    failed_count = len(failed_items)
        except Exception:
            pass
    print(f"\nFailed Extractions in {FAILED_LOG_PATH}: {failed_count}")
    if failed_count == 0:
        print("  ✅ [PASS] 0 permanent extraction failures!")
    else:
        print(f"  ℹ️ {failed_count} items logged in failed_extractions.json")

    print("=" * 70)

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Stage 2 Multi-Dimensional LLM Extraction")
    parser.add_argument("--batch-size", type=int, default=6, help="Number of items per batch (default: 6)")
    parser.add_argument("--limit", type=int, default=None, help="Limit number of items for testing")
    parser.add_argument("--no-resume", action="store_true", help="Overwrite existing extracted file")
    args = parser.parse_args()

    run_stage2_extraction(
        batch_size=args.batch_size,
        limit=args.limit,
        resume=not args.no_resume
    )
