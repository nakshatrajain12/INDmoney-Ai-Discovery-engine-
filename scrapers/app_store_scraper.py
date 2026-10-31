"""
Apple App Store Scraper for AI Discovery Engine (INDmoney SIP Retention)
Target: INDmoney app (App ID: 1459526006, Country: in)
Output: data/raw/app_store_indmoney.jsonl
"""

import sys
import os
import json
from datetime import datetime
from app_store_scraper import AppStore

if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

OUTPUT_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "data", "raw"
)
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "app_store_indmoney.jsonl")

def scrape_app_store(target_count: int = 1000):
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"[*] Scraping Apple App Store for INDmoney (Target: {target_count})...")
    
    indmoney = AppStore(country="in", app_name="indmoney", app_id="1459526006")
    indmoney.review(how_many=target_count)

    written = 0
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        for rev in indmoney.reviews:
            date_val = rev.get("date")
            date_str = date_val.strftime("%Y-%m-%d") if isinstance(date_val, datetime) else str(date_val)
            
            record = {
                "id": f"appstore_indmoney_{written:05d}",
                "source": "app_store",
                "platform_app": "INDmoney",
                "text": rev.get("review", "").strip(),
                "rating": rev.get("rating"),
                "date": date_str,
                "engagement_score": 0,
                "url": "https://apps.apple.com/in/app/indmoney/id1459526006",
                "raw_metadata": {
                    "user_name": rev.get("userName"),
                    "title": rev.get("title")
                }
            }
            f.write(json.dumps(record, ensure_ascii=False) + "\n")
            written += 1

    print(f"[OK] Successfully wrote {written} Apple App Store reviews to {OUTPUT_FILE}")
    return written

if __name__ == "__main__":
    scrape_app_store(100)
