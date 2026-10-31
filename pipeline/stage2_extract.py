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
from typing import Optional
from tqdm import tqdm

if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FILTERED_PATH = os.path.join(BASE_DIR, "data", "filtered", "filtered_data.jsonl")
EXTRACTED_OUTPUT_PATH = os.path.join(BASE_DIR, "data", "extracted", "extracted_insights.jsonl")
PROMPT_PATH = os.path.join(BASE_DIR, "pipeline", "prompts", "master_extraction.txt")

def run_stage2_extraction(limit: Optional[int] = None):
    print(f"[*] Starting Stage 2 LLM Extraction: {FILTERED_PATH} -> {EXTRACTED_OUTPUT_PATH}")
    os.makedirs(os.path.dirname(EXTRACTED_OUTPUT_PATH), exist_ok=True)
    
    if not os.path.exists(FILTERED_PATH):
        print(f"[!] Filtered data not found at {FILTERED_PATH}. Run stage 1 filter first.")
        return

    print("[OK] Stage 2 extraction skeleton ready.")

if __name__ == "__main__":
    run_stage2_extraction()
