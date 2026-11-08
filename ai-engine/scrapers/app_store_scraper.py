"""
Apple App Store Scraper for AI Discovery Engine (INDmoney SIP Retention)
Fetches customer reviews from Apple iTunes RSS API for INDmoney and peer investment apps.
Target: INDmoney (Track ID: 1450178837), Groww (Track ID: 1404871703)
Output: data/raw/app_store_indmoney.jsonl
"""

import sys
import os
import json
import time
import requests
from datetime import datetime

if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

OUTPUT_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "data", "raw"
)
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "app_store_indmoney.jsonl")

TARGET_APPS = [
    {"app_name": "INDmoney", "app_id": 1450178837, "pages": 10},
    {"app_name": "Groww", "app_id": 1404871703, "pages": 10}
]

def scrape_app_store():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    headers = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"}
    total_written = 0
    seen_ids = set()

    if os.path.exists(OUTPUT_FILE):
        with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    data = json.loads(line)
                    seen_ids.add(data.get("id"))
                except Exception:
                    pass

    print(f"[*] Scraping Apple App Store reviews. Pre-existing records: {len(seen_ids)}")

    with open(OUTPUT_FILE, "a", encoding="utf-8") as out_f:
        for app in TARGET_APPS:
            app_name = app["app_name"]
            app_id = app["app_id"]
            max_pages = app["pages"]
            app_written = 0
            print(f"\n--- App Store: {app_name} (ID: {app_id}) ---")

            for page in range(1, max_pages + 1):
                url = f"https://itunes.apple.com/in/rss/customerreviews/page={page}/id={app_id}/sortby=mostrecent/json"
                try:
                    res = requests.get(url, headers=headers, timeout=12)
                    if res.status_code != 200:
                        print(f"    [!] Page {page} returned status {res.status_code}")
                        break

                    data = res.json()
                    entries = data.get("feed", {}).get("entry", [])
                    if not entries:
                        print(f"    [!] No more entries on page {page}")
                        break

                    for entry in entries:
                        rev_id = entry.get("id", {}).get("label")
                        if not rev_id:
                            continue

                        unique_id = f"appstore_{app_name.lower()}_{rev_id}"
                        if unique_id in seen_ids:
                            continue

                        title = entry.get("title", {}).get("label", "").strip()
                        content = entry.get("content", {}).get("label", "").strip()
                        full_text = f"{title}. {content}".strip() if title else content

                        if len(full_text) < 10:
                            continue

                        rating_str = entry.get("im:rating", {}).get("label", "0")
                        rating = int(rating_str) if rating_str.isdigit() else None
                        
                        date_raw = entry.get("updated", {}).get("label", "")
                        date_str = date_raw[:10] if date_raw else "unknown"

                        record = {
                            "id": unique_id,
                            "source": "app_store",
                            "platform_app": app_name,
                            "text": full_text,
                            "rating": rating,
                            "date": date_str,
                            "engagement_score": 0,
                            "url": f"https://apps.apple.com/in/app/id{app_id}",
                            "raw_metadata": {
                                "author": entry.get("author", {}).get("name", {}).get("label", ""),
                                "app_version": entry.get("im:version", {}).get("label", ""),
                                "app_id": app_id
                            }
                        }

                        out_f.write(json.dumps(record, ensure_ascii=False) + "\n")
                        out_f.flush()
                        seen_ids.add(unique_id)
                        total_written += 1
                        app_written += 1

                    print(f"    Page {page}: Processed {len(entries)} items (Total new for {app_name}: {app_written})")
                    time.sleep(0.5)

                except Exception as e:
                    print(f"    [!] Error scraping page {page}: {e}")
                    time.sleep(1.0)

    print(f"\n[OK] Apple App Store scraping complete! Total records in {OUTPUT_FILE}: {len(seen_ids)}")
    return len(seen_ids)

if __name__ == "__main__":
    scrape_app_store()
