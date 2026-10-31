"""
Orchestrator for Stage 0 Data Ingestion.
Runs all scrapers, validates outputs against the unified schema,
merges results into data/raw/raw_data.jsonl, and prints a volume report.
"""

import sys
import os
import json
import glob
from typing import Dict

if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

DATA_RAW_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "data", "raw"
)
MERGED_OUTPUT = os.path.join(DATA_RAW_DIR, "raw_data.jsonl")

REQUIRED_SCHEMA_FIELDS = ["id", "source", "platform_app", "text", "date"]

def merge_and_report() -> Dict[str, int]:
    os.makedirs(DATA_RAW_DIR, exist_ok=True)
    source_counts = {}
    total_valid = 0
    seen_ids = set()

    jsonl_files = [
        f for f in glob.glob(os.path.join(DATA_RAW_DIR, "*.jsonl"))
        if os.path.basename(f) != "raw_data.jsonl"
    ]

    print(f"\n[*] Merging {len(jsonl_files)} raw data files into {MERGED_OUTPUT}...")

    with open(MERGED_OUTPUT, "w", encoding="utf-8") as out_f:
        for fpath in jsonl_files:
            fname = os.path.basename(fpath)
            file_valid = 0
            with open(fpath, "r", encoding="utf-8") as in_f:
                for line in in_f:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        record = json.loads(line)
                        if not all(k in record for k in REQUIRED_SCHEMA_FIELDS):
                            continue
                        
                        rec_id = record["id"]
                        if rec_id in seen_ids:
                            continue
                        seen_ids.add(rec_id)

                        src = record.get("source", "unknown")
                        source_counts[src] = source_counts.get(src, 0) + 1
                        out_f.write(json.dumps(record, ensure_ascii=False) + "\n")
                        file_valid += 1
                        total_valid += 1
                    except Exception:
                        continue
            print(f"    - {fname}: {file_valid} valid items")

    print("\n" + "=" * 50)
    print(" 📊 RAW INGESTION VOLUME REPORT")
    print("=" * 50)
    for src, cnt in sorted(source_counts.items(), key=lambda x: -x[1]):
        print(f"  {src:<20}: {cnt:>6} items")
    print("-" * 50)
    print(f"  {'TOTAL MERGED':<20}: {total_valid:>6} items")
    print(f"  {'DISTINCT SOURCES':<20}: {len(source_counts):>6}")
    print("=" * 50 + "\n")

    return source_counts

if __name__ == "__main__":
    merge_and_report()
