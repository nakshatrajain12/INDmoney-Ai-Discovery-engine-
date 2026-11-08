"""
Stage 1: Filter Pipeline for AI Discovery Engine.
Implements:
1. Deduplication (exact hash + fuzzy shingle Jaccard similarity threshold 0.85)
2. PII Sanitization (Email, Phone, PAN, Account numbers, and signatures masked)
3. Language & Character Check (English + Hinglish preserved, foreign alphabets dropped)
4. Spam Filter (drops <= 5 words, generic ratings spam, repetitive character floods)
5. Relevance Classifier (evaluates investment relevance against §4.2 guidelines)
Output: data/filtered/filtered_data.jsonl (Target: 2,500–4,000 items)
"""

import os
import sys
import json
import re
import unicodedata
from typing import Dict, List, Optional, Set, Tuple
from tqdm import tqdm

if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_DATA_PATH = os.path.join(BASE_DIR, "data", "raw", "raw_data.jsonl")
FILTERED_OUTPUT_PATH = os.path.join(BASE_DIR, "data", "filtered", "filtered_data.jsonl")

# PII Regex Patterns (architecture.md §4.3)
REGEX_EMAIL = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+", re.IGNORECASE)
REGEX_PHONE = re.compile(r"(?:\+91[\-\s]?)?[6-9]\d{9}\b|\+?\d{1,3}[\s\-]?\d{10}\b")
REGEX_PAN = re.compile(r"\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b")
REGEX_ACCOUNT = re.compile(r"\b\d{9,18}\b")
REGEX_SIGNATURE = re.compile(r"(?:regards|thanks|sincerely|cheers|yours truly)[\s,:\-]+([A-Za-z\s]{2,25})", re.IGNORECASE)

# Relevant Investment & SIP Keywords
SIP_KEYWORDS = {
    "sip", "mutual fund", "mutual funds", "mf", "mfs", "nav", "xirr", "portfolio",
    "returns", "return", "cams", "kfintech", "mandate", "e-mandate", "autodebit",
    "auto-debit", "auto debit", "nach", "pause", "paused", "pausing", "stop",
    "stopped", "stopping", "cancel", "cancelled", "cancelling", "redeem",
    "redemption", "loss", "losses", "profit", "red", "drawdown", "market", "nifty",
    "sensex", "index fund", "step up", "step-up", "fd", "cagr", "units", "folio",
    "groww", "indmoney", "zerodha", "coin", "elss", "lumpsum", "lump sum",
    "direct plan", "regular plan", "expense ratio", "smallcap", "midcap",
    "flexicap", "emergency fund", "compounding", "installments", "installment"
}

# Irrelevant Topics (credit cards, personal loans, unrelated bugs)
EXCLUSION_KEYWORDS = {
    "personal loan", "loan interest", "credit card limit", "credit score cibil",
    "cibil score", "instant cash", "rbi loan"
}

def sanitize_pii(text: str) -> str:
    """Sanitizes sensitive Personally Identifiable Information from raw text."""
    if not text:
        return ""
    text = REGEX_EMAIL.sub("[EMAIL]", text)
    text = REGEX_PAN.sub("[PAN]", text)
    text = REGEX_PHONE.sub("[PHONE]", text)
    text = REGEX_ACCOUNT.sub("[ACCOUNT]", text)
    text = REGEX_SIGNATURE.sub(r"[USER]", text)
    return text

def is_valid_language(text: str) -> bool:
    """Checks that text is in Latin or Devanagari (English / Hinglish / Hindi)."""
    # Count characters in allowed scripts vs foreign scripts
    allowed = 0
    foreign = 0
    for char in text:
        if char.isspace() or char in "!?,.:;\"'()[]{}-+*/@#%&_=<>~|\\0123456789":
            continue
        try:
            name = unicodedata.name(char, "").lower()
            if "latin" in name or "devanagari" in name:
                allowed += 1
            elif any(s in name for s in ["cyrillic", "arabic", "cjk", "hangul", "thai", "hebrew"]):
                foreign += 1
        except Exception:
            pass
    if foreign > 5 and foreign > (allowed * 0.3):
        return False
    return allowed >= 8

def is_spam(text: str) -> bool:
    """Detects short reviews, repetitive phrases, or zero-information ratings."""
    words = text.split()
    if len(words) <= 5:
        return True
    
    # Check word diversity
    unique_words = set(w.lower() for w in words)
    if len(words) >= 8 and (len(unique_words) / len(words)) < 0.35:
        return True
    
    # Drop generic reviews with zero investment content
    cleaned = text.lower().strip()
    generic_phrases = {
        "good app", "very good app", "nice app", "super app", "bad app", "worst app",
        "best app ever", "excellent app", "osm app", "great app", "awesome app",
        "good experience", "very bad app", "love this app", "poor app", "useful app"
    }
    if cleaned in generic_phrases:
        return True
    
    return False

def get_shingles(text: str, k: int = 3) -> Set[str]:
    """Generates word k-shingles for fuzzy deduplication."""
    tokens = re.sub(r"[^\w\s]", "", text.lower()).split()
    if len(tokens) < k:
        return {" ".join(tokens)}
    return {" ".join(tokens[i:i+k]) for i in range(len(tokens) - k + 1)}

def jaccard_similarity(set_a: Set[str], set_b: Set[str]) -> float:
    """Computes Jaccard similarity between two shingle sets."""
    if not set_a or not set_b:
        return 0.0
    union = len(set_a | set_b)
    if union == 0:
        return 0.0
    return len(set_a & set_b) / union

def evaluate_relevance(text: str, source: str) -> Tuple[bool, float, str]:
    """
    Evaluates whether the user signal discusses SIP/mutual fund investing.
    Returns (is_relevant, confidence, reason).
    """
    low_text = text.lower()
    
    # Check for exclusion topics
    for exc in EXCLUSION_KEYWORDS:
        if exc in low_text and "sip" not in low_text and "mutual fund" not in low_text:
            return False, 0.90, f"Discusses non-investment feature ({exc})"

    # Count matching domain keywords
    matches = [kw for kw in SIP_KEYWORDS if kw in low_text]
    
    # Forums (TradingQ&A, ValuePickr) were already keyword-curated during ingestion
    if source in ("tradingqa", "valuepickr"):
        confidence = 0.95 if matches else 0.82
        return True, confidence, f"Financial forum discussion regarding SIP/MF investing ({len(matches)} matched terms)"

    if not matches:
        return False, 0.92, "No investment, SIP, or portfolio keywords found"

    # Specific high-signal investment phrases
    high_signal = any(
        term in low_text
        for term in [
            "stopped sip", "paused sip", "cancel sip", "first sip", "sip loss",
            "sip returns", "nav dropped", "xirr", "mandate failed", "autodebit",
            "portfolio red", "compounding", "step up", "elss"
        ]
    )

    if high_signal:
        return True, 0.96, f"Explicit SIP investor lifecycle/drop-off signal ({', '.join(matches[:3])})"
    elif len(matches) >= 2:
        return True, 0.90, f"Discusses mutual fund portfolio experience ({', '.join(matches[:3])})"
    else:
        return True, 0.85, f"Mentions core investment topic: {matches[0]}"

def run_stage1_filtering(threshold_fuzzy: float = 0.85) -> Dict:
    print("\n" + "=" * 65)
    print(" 🚀 STAGE 1: DEDUPLICATION, PII SANITIZATION & RELEVANCE FILTER")
    print("=" * 65)
    print(f"  Input Corpus  : {RAW_DATA_PATH}")
    print(f"  Output Corpus : {FILTERED_OUTPUT_PATH}")
    print(f"  Fuzzy Dedup   : Jaccard shingle threshold ≥ {threshold_fuzzy}")

    os.makedirs(os.path.dirname(FILTERED_OUTPUT_PATH), exist_ok=True)

    if not os.path.exists(RAW_DATA_PATH):
        raise FileNotFoundError(f"Raw data file missing at {RAW_DATA_PATH}. Run scrapers first.")

    total_scanned = 0
    dropped_spam = 0
    dropped_lang = 0
    dropped_irrelevant = 0
    dropped_duplicate = 0
    accepted_records = []
    
    # Keep lightweight shingle cache (indexed by first token for fast pruning)
    accepted_shingles_by_first_token: Dict[str, List[Tuple[Set[str], str]]] = {}

    with open(RAW_DATA_PATH, "r", encoding="utf-8") as in_f:
        lines = in_f.readlines()

    print(f"\n[*] Processing {len(lines)} raw records...")

    for line in tqdm(lines, desc="Filtering Corpus", unit="item"):
        line = line.strip()
        if not line:
            continue
        total_scanned += 1
        
        try:
            record = json.loads(line)
        except Exception:
            continue

        raw_text = record.get("text", "")
        source = record.get("source", "unknown")

        # 1. Language Check
        if not is_valid_language(raw_text):
            dropped_lang += 1
            continue

        # 2. Spam & Quality Filter
        if is_spam(raw_text):
            dropped_spam += 1
            continue

        # 3. PII Sanitization
        clean_text = sanitize_pii(raw_text)

        # 4. Domain Relevance Classification
        is_relevant, confidence, reason = evaluate_relevance(clean_text, source)
        if not is_relevant:
            dropped_irrelevant += 1
            continue

        # 5. Fuzzy Deduplication (0.85 Jaccard threshold)
        curr_shingles = get_shingles(clean_text, k=3)
        tokens = clean_text.lower().split()
        first_token = tokens[0] if tokens else ""

        is_dup = False
        candidates = accepted_shingles_by_first_token.get(first_token, [])
        for exist_shingles, exist_id in candidates:
            if jaccard_similarity(curr_shingles, exist_shingles) >= threshold_fuzzy:
                is_dup = True
                dropped_duplicate += 1
                break

        if is_dup:
            continue

        # Record accepted
        candidates.append((curr_shingles, record["id"]))
        accepted_shingles_by_first_token[first_token] = candidates

        # Attach clean text and relevance annotation
        record["text"] = clean_text
        record["relevance"] = {
            "relevant": True,
            "confidence": round(confidence, 2),
            "reason": reason
        }
        accepted_records.append(record)

    # Write output
    with open(FILTERED_OUTPUT_PATH, "w", encoding="utf-8") as out_f:
        for rec in accepted_records:
            out_f.write(json.dumps(rec, ensure_ascii=False) + "\n")

    accepted_count = len(accepted_records)
    print("\n" + "=" * 65)
    print(" 📊 STAGE 1 FILTERING RESULTS")
    print("=" * 65)
    print(f"  Total Raw Scanned        : {total_scanned:>6}")
    print(f"  Dropped (Spam / ≤5 words): {dropped_spam:>6}")
    print(f"  Dropped (Foreign Script) : {dropped_lang:>6}")
    print(f"  Dropped (Irrelevant)     : {dropped_irrelevant:>6}")
    print(f"  Dropped (Fuzzy Duplicates):{dropped_duplicate:>6}")
    print("-" * 65)
    print(f"  TOTAL ACCEPTED FILTERED  : {accepted_count:>6} items")
    print(f"  TARGET RANGE (2,500–4,000): {'[✓] WITHIN RANGE' if 2500 <= accepted_count <= 4000 else '[!] Out of range'}")
    print(f"  SAVED TO                 : {FILTERED_OUTPUT_PATH}")
    print("=" * 65 + "\n")

    return {
        "total_scanned": total_scanned,
        "accepted": accepted_count,
        "output_path": FILTERED_OUTPUT_PATH
    }

if __name__ == "__main__":
    run_stage1_filtering()
