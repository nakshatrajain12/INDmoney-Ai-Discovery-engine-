"""
TradingQ&A Forum Scraper for AI Discovery Engine (INDmoney SIP Retention)
Scrapes Zerodha TradingQ&A discussion threads on SIP strategies, pauses, and mutual funds.
Output: data/raw/tradingqa_threads.jsonl
"""

import sys
import os
import json
import requests
from bs4 import BeautifulSoup

if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

OUTPUT_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "data", "raw"
)
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "tradingqa_threads.jsonl")

def scrape_tradingqa(search_terms=None, limit: int = 50):
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    terms = search_terms or ["SIP pause", "stopped SIP", "SIP loss", "INDmoney mutual fund"]
    print(f"[*] Scraping TradingQ&A for keywords: {terms}...")

    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    total_written = 0

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        for term in terms:
            try:
                url = f"https://tradingqna.com/search.json?q={requests.utils.quote(term)}"
                resp = requests.get(url, headers=headers, timeout=10)
                if resp.status_code == 200:
                    data = resp.json()
                    posts = data.get("posts", [])[:limit]
                    for post in posts:
                        raw_html = post.get("blurb", "")
                        soup = BeautifulSoup(raw_html, "html.parser")
                        clean_text = soup.get_text().strip()
                        if not clean_text:
                            continue

                        record = {
                            "id": f"tradingqa_{post.get('id', total_written)}",
                            "source": "tradingqa",
                            "platform_app": "Zerodha/General SIP",
                            "text": clean_text,
                            "rating": None,
                            "date": post.get("created_at", "")[:10] if post.get("created_at") else "",
                            "engagement_score": post.get("like_count", 0),
                            "url": f"https://tradingqna.com/t/{post.get('topic_id')}",
                            "raw_metadata": {
                                "username": post.get("username"),
                                "topic_title": post.get("topic_title")
                            }
                        }
                        f.write(json.dumps(record, ensure_ascii=False) + "\n")
                        total_written += 1
            except Exception as e:
                print(f"[!] TradingQ&A search error for '{term}': {e}")

    print(f"[OK] Total TradingQ&A posts written: {total_written} -> {OUTPUT_FILE}")
    return total_written

if __name__ == "__main__":
    scrape_tradingqa(limit=5)
