"""
Unified Schema Validator for AI Discovery Engine.
Verifies that all entries in data/raw/raw_data.jsonl adhere strictly to the
Unified Output Schema specified in implementation_plan.md §1.0 & architecture.md §10.
"""

import sys
import os
import json
from typing import Tuple

if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

DATA_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "data", "raw", "raw_data.jsonl"
)

REQUIRED_KEYS = {
    "id": str,
    "source": str,
    "platform_app": str,
    "text": str,
    "date": (str, type(None)),
    "rating": (int, float, type(None)),
    "engagement_score": (int, float),
    "url": str,
    "raw_metadata": dict
}

def validate_file(file_path: str = DATA_PATH) -> Tuple[bool, int, int]:
    if not os.path.exists(file_path):
        print(f"[!] File not found: {file_path}")
        return False, 0, 0

    valid_count = 0
    invalid_count = 0
    errors = []

    with open(file_path, "r", encoding="utf-8") as f:
        for idx, line in enumerate(f, start=1):
            line = line.strip()
            if not line:
                continue
            try:
                rec = json.loads(line)
                # Check types
                for key, expected_type in REQUIRED_KEYS.items():
                    if key not in rec:
                        errors.append(f"Line {idx}: Missing key '{key}'")
                        invalid_count += 1
                        break
                    val = rec[key]
                    if not isinstance(val, expected_type):
                        errors.append(f"Line {idx}: Key '{key}' has invalid type {type(val)} (expected {expected_type})")
                        invalid_count += 1
                        break
                else:
                    valid_count += 1
            except Exception as e:
                errors.append(f"Line {idx}: JSON parse error: {e}")
                invalid_count += 1

    print("\n" + "="*50)
    print(" 🔍 UNIFIED SCHEMA VALIDATION REPORT")
    print("="*50)
    print(f"  Target File    : {os.path.basename(file_path)}")
    print(f"  Total Verified : {valid_count + invalid_count}")
    print(f"  Valid Records  : {valid_count}")
    print(f"  Invalid Records: {invalid_count}")
    print(f"  Accuracy Rate  : {(valid_count / (valid_count + invalid_count) * 100):.2f}%")
    
    if errors:
        print(f"\n  [!] First 5 errors detected:")
        for err in errors[:5]:
            print(f"    - {err}")
    else:
        print("\n  [✓] 100% of records strictly conform to Unified Schema!")
    print("="*50 + "\n")

    return (invalid_count == 0), valid_count, invalid_count

if __name__ == "__main__":
    success, valid, invalid = validate_file()
    if not success:
        sys.exit(1)
