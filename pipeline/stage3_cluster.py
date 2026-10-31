"""
Stage 3: Thematic Clustering & Opportunity Scoring for AI Discovery Engine.
Clusters extracted multi-dimensional insights into themes, computes
Opportunity Scores using pipeline.utils.scoring, and outputs ranked themes.
Output:
- data/themes/themes.json
- data/themes/opportunity_matrix.json
"""

import os
import sys
import json
from typing import Optional

if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXTRACTED_PATH = os.path.join(BASE_DIR, "data", "extracted", "extracted_insights.jsonl")
THEMES_OUTPUT_PATH = os.path.join(BASE_DIR, "data", "themes", "themes.json")
MATRIX_OUTPUT_PATH = os.path.join(BASE_DIR, "data", "themes", "opportunity_matrix.json")

def run_stage3_clustering():
    print(f"[*] Starting Stage 3 Clustering: {EXTRACTED_PATH} -> {THEMES_OUTPUT_PATH}")
    os.makedirs(os.path.dirname(THEMES_OUTPUT_PATH), exist_ok=True)
    
    if not os.path.exists(EXTRACTED_PATH):
        print(f"[!] Extracted data not found at {EXTRACTED_PATH}. Run stage 2 first.")
        return

    print("[OK] Stage 3 clustering skeleton ready.")

if __name__ == "__main__":
    run_stage3_clustering()
