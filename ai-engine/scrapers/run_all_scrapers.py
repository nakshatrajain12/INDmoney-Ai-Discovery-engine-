"""
Orchestrator for Stage 0 Data Ingestion.
Runs all active scrapers in sequence, validates records against the Unified Schema,
deduplicates and merges all data into data/raw/raw_data.jsonl, and prints a comprehensive
Volume Quality Gate report.
"""

import sys
import os
import json
import glob
from typing import Dict, Set

if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

DATA_RAW_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "data", "raw"
)
MERGED_OUTPUT = os.path.join(DATA_RAW_DIR, "raw_data.jsonl")

# Unified Output Schema required fields (§1.0)
REQUIRED_FIELDS = ["id", "source", "platform_app", "text", "date"]

def validate_record(record: dict) -> bool:
    """Strict schema validator for all ingested signals."""
    if not isinstance(record, dict):
        return False
    
    # Check all required fields exist
    for field in REQUIRED_FIELDS:
        if field not in record:
            return False
    
    # Text must be a non-trivial string
    text = record.get("text")
    if not isinstance(text, str) or len(text.strip()) < 10:
        return False
    
    # ID must be non-empty
    rec_id = record.get("id")
    if not isinstance(rec_id, str) or not rec_id.strip():
        return False

    # Engagement score should be an integer
    eng = record.get("engagement_score")
    if eng is not None and not isinstance(eng, (int, float)):
        record["engagement_score"] = 0

    return True

def merge_and_validate() -> Dict:
    os.makedirs(DATA_RAW_DIR, exist_ok=True)
    source_counts = {}
    platform_counts = {}
    seen_ids: Set[str] = set()
    seen_text_hashes: Set[int] = set()
    total_valid = 0
    total_skipped = 0

    jsonl_files = [
        f for f in glob.glob(os.path.join(DATA_RAW_DIR, "*.jsonl"))
        if os.path.basename(f) != "raw_data.jsonl"
    ]

    print(f"\n[*] Scanning {len(jsonl_files)} source files in {DATA_RAW_DIR}...")

    with open(MERGED_OUTPUT, "w", encoding="utf-8") as out_f:
        for fpath in sorted(jsonl_files):
            fname = os.path.basename(fpath)
            file_valid = 0
            file_skipped = 0

            with open(fpath, "r", encoding="utf-8") as in_f:
                for line in in_f:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        record = json.loads(line)
                        if not validate_record(record):
                            file_skipped += 1
                            total_skipped += 1
                            continue

                        # Deduplicate by ID
                        rec_id = record["id"]
                        if rec_id in seen_ids:
                            file_skipped += 1
                            total_skipped += 1
                            continue

                        # Deduplicate by normalized text hash (fuzzy safeguard)
                        norm_text = "".join(record["text"].lower().split())
                        text_hash = hash(norm_text)
                        if text_hash in seen_text_hashes:
                            file_skipped += 1
                            total_skipped += 1
                            continue

                        seen_ids.add(rec_id)
                        seen_text_hashes.add(text_hash)

                        # Track sources
                        src = record.get("source", "unknown")
                        source_counts[src] = source_counts.get(src, 0) + 1

                        # Track platforms (INDmoney focus)
                        plat = record.get("platform_app", "unknown")
                        platform_counts[plat] = platform_counts.get(plat, 0) + 1

                        out_f.write(json.dumps(record, ensure_ascii=False) + "\n")
                        file_valid += 1
                        total_valid += 1

                    except Exception:
                        file_skipped += 1
                        total_skipped += 1
                        continue

            print(f"    - {fname:<30}: {file_valid:>5} valid | {file_skipped:>4} skipped")

    # Metrics for Quality Gate
    indmoney_items = sum(
        cnt for plat, cnt in platform_counts.items()
        if "indmoney" in plat.lower() or "ind wealth" in plat.lower()
    )
    indmoney_pct = (indmoney_items / total_valid * 100.0) if total_valid > 0 else 0.0

    print("\n" + "=" * 65)
    print(" 📊 PHASE 1 — VOLUME QUALITY GATE & INGESTION REPORT")
    print("=" * 65)
    print("  SOURCE BREAKDOWN:")
    for src, cnt in sorted(source_counts.items(), key=lambda x: -x[1]):
        pct = (cnt / total_valid * 100.0) if total_valid > 0 else 0
        print(f"    • {src:<20}: {cnt:>6} items ({pct:>5.1f}%)")
    
    print("-" * 65)
    print("  PLATFORM FOCUS (TARGET: INDMONEY ≥ 40%):")
    for plat, cnt in sorted(platform_counts.items(), key=lambda x: -x[1])[:5]:
        pct = (cnt / total_valid * 100.0) if total_valid > 0 else 0
        print(f"    • {plat:<20}: {cnt:>6} items ({pct:>5.1f}%)")
    
    print(f"    ------------------------------------")
    print(f"    INDmoney Total Signals : {indmoney_items:>6} items ({indmoney_pct:>5.1f}%)")
    print("-" * 65)
    print(f"  TOTAL MERGED CORPUS    : {total_valid:>6} verified rows")
    print(f"  DISTINCT SOURCES       : {len(source_counts):>6} sources")
    print(f"  OUTPUT FILE            : {MERGED_OUTPUT}")
    print("=" * 65)

    # Check Exit Criteria
    c1 = total_valid >= 5000
    c2 = len(source_counts) >= 5
    c3 = indmoney_pct >= 40.0
    c4 = os.path.exists(MERGED_OUTPUT)

    print("\n  EXIT CRITERIA CHECKLIST:")
    print(f"    [{'✓' if c1 else '✗'}] Total volume ≥ 5,000 items ({total_valid} items)")
    print(f"    [{'✓' if c2 else '✗'}] Distinct sources ≥ 5 ({len(source_counts)} sources)")
    print(f"    [{'✓' if c3 else '✗'}] INDmoney focus ≥ 40% ({indmoney_pct:.1f}%)")
    print(f"    [{'✓' if c4 else '✗'}] raw_data.jsonl validated and generated")
    print("=" * 65 + "\n")

    return {
        "total_valid": total_valid,
        "distinct_sources": len(source_counts),
        "indmoney_pct": indmoney_pct,
        "source_counts": source_counts
    }

if __name__ == "__main__":
    merge_and_validate()
