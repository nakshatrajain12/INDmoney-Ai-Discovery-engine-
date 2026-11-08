"""
YouTube Comment Scraper for AI Discovery Engine (INDmoney SIP Retention)
Extracts comments from top Indian financial creators' SIP explainer videos
(Akshat Shrivastava, Ankur Warikoo, CA Rachana Ranade).
Output: data/raw/youtube_comments.jsonl
"""

import sys
import os
import json
import itertools
from datetime import datetime
from youtube_comment_downloader import YoutubeCommentDownloader, SORT_BY_POPULAR

if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

OUTPUT_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "data", "raw"
)
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "youtube_comments.jsonl")

# Top 10 high-impact Indian personal finance SIP videos
TARGET_VIDEOS = [
    {"video_id": "lkefAqfzaO4", "creator": "Akshat Shrivastava", "topic": "5 Simple SIP Strategies"},
    {"video_id": "YZqYj_9NKDU", "creator": "Akshat Shrivastava", "topic": "Learn to do SIPs properly"},
    {"video_id": "UYAYMhtBWbE", "creator": "Akshat Shrivastava", "topic": "Why I stopped regular SIPs"},
    {"video_id": "jQ2pV7e3nOg", "creator": "Akshat Shrivastava", "topic": "Why people drop off from SIPs"},
    {"video_id": "tJvEs7YD9ZE", "creator": "Akshat Shrivastava", "topic": "Stock SIP vs Mutual Fund SIP"},
    {"video_id": "1DRq8N7SpYc", "creator": "Ankur Warikoo", "topic": "SIP Kya Hai - SIP vs Lumpsum"},
    {"video_id": "8UzLUXL--FA", "creator": "Ankur Warikoo", "topic": "SIP Portfolio Balancing"},
    {"video_id": "HRC8J-gVbhA", "creator": "Ankur Warikoo", "topic": "SIP vs Step-up SIP Decisions"},
    {"video_id": "t6BQ1Wle8c4", "creator": "CA Rachana Ranade", "topic": "Lumpsum or SIP which is better"},
    {"video_id": "0gEKz_wyg3E", "creator": "CA Rachana Ranade", "topic": "Market Volatility and SIP Anxiety"}
]

def scrape_youtube(target_per_video: int = 100):
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    downloader = YoutubeCommentDownloader()
    seen_ids = set()

    if os.path.exists(OUTPUT_FILE):
        with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    data = json.loads(line)
                    seen_ids.add(data.get("id"))
                except Exception:
                    pass

    print(f"[*] Starting YouTube Comment Scraper. Pre-existing records: {len(seen_ids)}")
    total_new = 0

    with open(OUTPUT_FILE, "a", encoding="utf-8") as out_f:
        for v in TARGET_VIDEOS:
            vid = v["video_id"]
            creator = v["creator"]
            topic = v["topic"]
            video_url = f"https://www.youtube.com/watch?v={vid}"
            print(f"\n[*] Scraping: {creator} — '{topic}' ({vid})...")
            
            try:
                comments = downloader.get_comments_from_url(video_url, sort_by=SORT_BY_POPULAR)
                video_count = 0
                for c in itertools.islice(comments, target_per_video):
                    cid = c.get("cid")
                    if not cid:
                        cid = f"{vid}_{video_count}"
                    
                    unique_id = f"youtube_{cid}"
                    if unique_id in seen_ids:
                        continue

                    raw_text = c.get("text", "").strip()
                    if len(raw_text) < 15:
                        continue

                    # Filter for SIP / investment relevance keywords
                    low_text = raw_text.lower()
                    
                    platform_app = "Mutual Funds / General SIP"
                    if "indmoney" in low_text or "ind wealth" in low_text:
                        platform_app = "INDmoney"
                    elif "groww" in low_text:
                        platform_app = "Groww"
                    elif "zerodha" in low_text or "coin" in low_text:
                        platform_app = "Zerodha Coin"

                    # Parse votes / engagement
                    votes = c.get("votes", 0)
                    try:
                        engagement = int(votes)
                    except Exception:
                        engagement = 0

                    record = {
                        "id": unique_id,
                        "source": "youtube",
                        "platform_app": platform_app,
                        "text": raw_text,
                        "rating": None,
                        "date": str(c.get("time", "recent")),
                        "engagement_score": engagement,
                        "url": f"https://www.youtube.com/watch?v={vid}&lc={cid}",
                        "raw_metadata": {
                            "author": c.get("author", "unknown"),
                            "video_id": vid,
                            "creator": creator,
                            "topic": topic
                        }
                    }

                    out_f.write(json.dumps(record, ensure_ascii=False) + "\n")
                    out_f.flush()
                    seen_ids.add(unique_id)
                    total_new += 1
                    video_count += 1

                print(f"    -> Added {video_count} comments from video {vid}.")

            except Exception as e:
                print(f"    [!] Error scraping video {vid}: {e}")

    print(f"\n[OK] YouTube scraping complete! Total records in {OUTPUT_FILE}: {len(seen_ids)}")
    return len(seen_ids)

if __name__ == "__main__":
    scrape_youtube(80)
