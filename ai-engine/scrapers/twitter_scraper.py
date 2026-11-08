"""
Twitter/X Scraper & Importer for AI Discovery Engine (INDmoney SIP Retention)
Loads exported Twitter data or search results into unified schema.
Output: data/raw/twitter_results.jsonl
"""

import sys
import os
import json

if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

OUTPUT_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "data", "raw"
)
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "twitter_results.jsonl")

def import_or_scrape_twitter():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    if not os.path.exists(OUTPUT_FILE):
        with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
            pass
    print(f"[*] Twitter scraper/importer initialized. Output: {OUTPUT_FILE}")

if __name__ == "__main__":
    import_or_scrape_twitter()

