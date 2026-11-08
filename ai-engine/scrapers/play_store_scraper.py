"""
Google Play Store Scraper for AI Discovery Engine (INDmoney SIP Retention)
Scrapes reviews for INDmoney (in.indwealth), Groww, and Zerodha Coin.
"""

import sys
import os
import json
import time
from datetime import datetime

# Ensure standard output can handle utf-8 on Windows
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

from google_play_scraper import Sort, reviews

APPS = [
    {"app_id": "in.indwealth", "name": "INDmoney", "count": 3500},
    {"app_id": "com.nextbillion.groww", "name": "Groww", "count": 1500},
    {"app_id": "com.zerodha.coin", "name": "Zerodha Coin", "count": 1000}
]

OUTPUT_DIR = os.path.join("data", "raw")

def scrape_app(app_info):
    app_id = app_info["app_id"]
    app_name = app_info["name"]
    target_count = app_info["count"]
    out_file = os.path.join(OUTPUT_DIR, f"play_store_{app_name.lower().replace(' ', '_')}.jsonl")

    print(f"\n[*] Fetching reviews for {app_name} ({app_id}). Target: {target_count}...")
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    seen_ids = set()
    if os.path.exists(out_file):
        with open(out_file, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    data = json.loads(line)
                    seen_ids.add(data.get("id"))
                except Exception:
                    pass

    print(f"    Existing reviews in {out_file}: {len(seen_ids)}")

    total_fetched = 0
    continuation_token = None
    batch_size = 200

    with open(out_file, "a", encoding="utf-8") as f:
        while total_fetched < target_count:
            fetch_size = min(batch_size, target_count - total_fetched)
            try:
                result, continuation_token = reviews(
                    app_id,
                    lang="en",
                    country="in",
                    sort=Sort.NEWEST,
                    count=fetch_size,
                    continuation_token=continuation_token
                )

                if not result:
                    print("    [!] No more reviews returned by Play Store.")
                    break

                new_in_batch = 0
                for rev in result:
                    rev_id = rev.get("reviewId")
                    unique_id = f"play_{app_name.lower()}_{rev_id}"
                    if unique_id in seen_ids:
                        continue

                    content = rev.get("content", "").strip()
                    if len(content) < 15:
                        continue

                    rev_date = rev.get("at")
                    date_str = rev_date.strftime("%Y-%m-%d") if isinstance(rev_date, datetime) else "unknown"

                    record = {
                        "id": unique_id,
                        "source": "google_play",
                        "platform_app": app_name,
                        "text": content,
                        "rating": rev.get("score"),
                        "date": date_str,
                        "engagement_score": rev.get("thumbsUpCount", 0),
                        "url": f"https://play.google.com/store/apps/details?id={app_id}&reviewId={rev_id}",
                        "raw_metadata": {
                            "user_name": rev.get("userName", ""),
                            "app_version": rev.get("reviewCreatedVersion", ""),
                            "reply_content": rev.get("replyContent", "")
                        }
                    }

                    f.write(json.dumps(record, ensure_ascii=False) + "\n")
                    f.flush()
                    seen_ids.add(unique_id)
                    total_fetched += 1
                    new_in_batch += 1

                print(f"    Progress: {total_fetched}/{target_count} reviews saved.")
                time.sleep(1.2)

                if not continuation_token or new_in_batch == 0:
                    break

            except Exception as e:
                print(f"    [!] Error during scraping: {e}")
                time.sleep(2)
                break

    print(f"[OK] {app_name} scraping complete! Total records saved: {len(seen_ids)}")
    return len(seen_ids)

def main():
    print("="*60)
    print("GOOGLE PLAY STORE SCRAPER - AI DISCOVERY ENGINE")
    print("="*60)
    for app in APPS:
        scrape_app(app)

if __name__ == "__main__":
    main()
