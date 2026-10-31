"""
ValuePickr Forum Scraper for AI Discovery Engine (INDmoney SIP Retention)
Scrapes long-term retail investor discussions on SIPs, mutual funds, market downturns, and behavior.
Output: data/raw/valuepickr_threads.jsonl
"""

import sys
import os
import json
import time
import requests
from bs4 import BeautifulSoup

if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

OUTPUT_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "data", "raw"
)
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "valuepickr_threads.jsonl")

SEARCH_KEYWORDS = [
    "stopped SIP",
    "paused SIP",
    "SIP vs lumpsum",
    "SIP market crash",
    "SIP negative returns",
    "mutual fund portfolio red",
    "SIP e-mandate",
    "INDmoney mutual fund",
    "SIP asset allocation",
    "first time SIP",
    "SIP review",
    "SIP exit strategy"
]

def scrape_valuepickr(limit_per_keyword: int = 30):
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    seen_ids = set()

    if os.path.exists(OUTPUT_FILE):
        with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    data = json.loads(line)
                    seen_ids.add(data.get("id"))
                except Exception:
                    pass

    print(f"[*] Scraping ValuePickr forum. Pre-existing records: {len(seen_ids)}")
    total_new = 0

    with open(OUTPUT_FILE, "a", encoding="utf-8") as out_f:
        for term in SEARCH_KEYWORDS:
            url = f"https://forum.valuepickr.com/search.json?q={requests.utils.quote(term)}"
            try:
                resp = requests.get(url, headers=headers, timeout=12)
                if resp.status_code == 200:
                    data = resp.json()
                    posts = data.get("posts", [])[:limit_per_keyword]
                    term_count = 0
                    for post in posts:
                        post_id = post.get("id")
                        unique_id = f"valuepickr_{post_id}"
                        if unique_id in seen_ids:
                            continue

                        raw_blurb = post.get("blurb", "")
                        soup = BeautifulSoup(raw_blurb, "html.parser")
                        clean_text = soup.get_text().strip()
                        if len(clean_text) < 25:
                            continue

                        platform_app = "Mutual Funds / Equity SIP"
                        low_text = clean_text.lower()
                        if "indmoney" in low_text or "ind wealth" in low_text:
                            platform_app = "INDmoney"
                        elif "groww" in low_text:
                            platform_app = "Groww"
                        elif "zerodha" in low_text or "coin" in low_text:
                            platform_app = "Zerodha Coin"

                        date_raw = post.get("created_at", "")
                        date_str = date_raw[:10] if date_raw else "unknown"

                        record = {
                            "id": unique_id,
                            "source": "valuepickr",
                            "platform_app": platform_app,
                            "text": clean_text,
                            "rating": None,
                            "date": date_str,
                            "engagement_score": int(post.get("like_count", 0) or 0),
                            "url": f"https://forum.valuepickr.com/t/{post.get('topic_id')}",
                            "raw_metadata": {
                                "username": post.get("username", "anonymous"),
                                "topic_title": post.get("topic_title", ""),
                                "search_keyword": term
                            }
                        }

                        out_f.write(json.dumps(record, ensure_ascii=False) + "\n")
                        out_f.flush()
                        seen_ids.add(unique_id)
                        total_new += 1
                        term_count += 1

                    print(f"    Keyword '{term}': Added {term_count} threads.")
                    time.sleep(1.0)
                else:
                    print(f"    [!] ValuePickr returned status {resp.status_code} for '{term}'")
                    time.sleep(1.5)
            except Exception as e:
                print(f"    [!] Error scraping '{term}': {e}")
                time.sleep(1.5)

    print(f"\n[OK] ValuePickr scraping complete! Total records in {OUTPUT_FILE}: {len(seen_ids)}")
    return len(seen_ids)

if __name__ == "__main__":
    scrape_valuepickr()
