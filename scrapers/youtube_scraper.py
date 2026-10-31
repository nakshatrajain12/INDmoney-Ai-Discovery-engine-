"""
YouTube Comment Scraper for AI Discovery Engine (INDmoney SIP Retention)
Extracts comments from top SIP explainer & review videos.
Output: data/raw/youtube_comments.jsonl
"""

import sys
import os
import json
import itertools
from youtube_comment_downloader import YoutubeCommentDownloader, SORT_BY_POPULAR

if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

OUTPUT_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "data", "raw"
)
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "youtube_comments.jsonl")

# Curated list of popular SIP / INDmoney mutual fund analysis video IDs
TARGET_VIDEOS = [
    {"video_id": "z9vV_g77w30", "channel": "Akshat Shrivastava", "topic": "SIP vs Lump Sum"},
    {"video_id": "8U8vjH_72uY", "channel": "CA Rachana Ranade", "topic": "Mutual Funds for Beginners"},
    {"video_id": "0DqAEv3BqO0", "channel": "Ankur Warikoo", "topic": "SIP Mistakes"}
]

def scrape_youtube(target_per_video: int = 150):
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    downloader = YoutubeCommentDownloader()
    total_written = 0

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        for v in TARGET_VIDEOS:
            vid = v["video_id"]
            print(f"[*] Extracting comments for {vid} ({v['channel']} - {v['topic']})...")
            try:
                comments = downloader.get_comments_from_url(
                    f"https://www.youtube.com/watch?v={vid}",
                    sort_by=SORT_BY_POPULAR
                )
                count = 0
                for c in itertools.islice(comments, target_per_video):
                    text = c.get("text", "").strip()
                    if not text:
                        continue
                    record = {
                        "id": f"yt_{vid}_{c.get('cid', count)}",
                        "source": "youtube",
                        "platform_app": "INDmoney/General SIP",
                        "text": text,
                        "rating": None,
                        "date": str(c.get("time", "")),
                        "engagement_score": int(c.get("votes", 0) or 0),
                        "url": f"https://www.youtube.com/watch?v={vid}&lc={c.get('cid', '')}",
                        "raw_metadata": {
                            "channel": v["channel"],
                            "author": c.get("author")
                        }
                    }
                    f.write(json.dumps(record, ensure_ascii=False) + "\n")
                    count += 1
                    total_written += 1
                print(f"    Fetched {count} comments.")
            except Exception as e:
                print(f"    [!] Error fetching video {vid}: {e}")

    print(f"[OK] Total YouTube comments written: {total_written} -> {OUTPUT_FILE}")
    return total_written

if __name__ == "__main__":
    scrape_youtube(10)
