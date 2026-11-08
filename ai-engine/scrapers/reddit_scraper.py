"""
Reddit Scraper for AI Discovery Engine (INDmoney SIP Retention)
Uses PRAW with your Reddit API credentials, or provides guided instructions.
"""

import os
import json
import time
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

SUBREDDITS = ["IndiaInvestments", "mutualfunds", "INDmoney"]

SEARCH_KEYWORDS = [
    # Drop-off Signals
    "stopped SIP",
    "paused SIP",
    "cancelled SIP",
    "SIP loss",
    "SIP negative",
    "SIP not working",
    "stop SIP",
    
    # Lifecycle & Experience
    "first SIP",
    "SIP 6 months",
    "SIP 1 year",
    "SIP returns",
    "SIP journey",
    
    # Emotional & Confusion
    "SIP confused",
    "SIP scared",
    "SIP regret",
    "should I stop SIP",
    "market crash SIP",
    
    # Platform Context
    "INDmoney SIP",
    "INDmoney mutual fund",
    "Groww SIP",
    "Zerodha Coin SIP"
]

OUTPUT_FILE = os.path.join("data", "raw", "reddit_posts.jsonl")

def determine_platform(title, text, subreddit):
    full_text = f"{title} {text}".lower()
    if "indmoney" in full_text or "ind wealth" in full_text or subreddit.lower() == "indmoney":
        return "INDmoney"
    elif "groww" in full_text:
        return "Groww"
    elif "zerodha" in full_text or "coin" in full_text:
        return "Zerodha"
    return "Mutual Funds / General"

def scrape_with_praw(client_id, client_secret, user_agent, limit_per_keyword=25):
    import praw
    reddit = praw.Reddit(
        client_id=client_id,
        client_secret=client_secret,
        user_agent=user_agent
    )

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    seen_ids = set()

    if os.path.exists(OUTPUT_FILE):
        with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    data = json.loads(line)
                    seen_ids.add(data.get("id"))
                except Exception:
                    pass

    print(f"[*] PRAW authenticated successfully! Scraping subreddits: {SUBREDDITS}")
    print(f"[*] Pre-existing records: {len(seen_ids)}\n")

    with open(OUTPUT_FILE, "a", encoding="utf-8") as out_f:
        for sub_name in SUBREDDITS:
            print(f"--- Subreddit: r/{sub_name} ---")
            try:
                subreddit = reddit.subreddit(sub_name)
            except Exception as e:
                print(f"[!] Could not access r/{sub_name}: {e}")
                continue

            for keyword in SEARCH_KEYWORDS:
                print(f"  [Query] r/{sub_name} -> '{keyword}'")
                try:
                    search_results = subreddit.search(keyword, sort="relevance", limit=limit_per_keyword)
                    items_added = 0

                    for post in search_results:
                        unique_id = f"reddit_{post.id}"
                        if unique_id in seen_ids:
                            continue

                        title = post.title or ""
                        selftext = post.selftext or ""
                        combined_text = f"{title}\n\n{selftext}".strip()

                        if len(combined_text) < 25:
                            continue

                        post_date = datetime.utcfromtimestamp(post.created_utc).strftime("%Y-%m-%d") if post.created_utc else "unknown"
                        platform_app = determine_platform(title, selftext, sub_name)
                        engagement = post.score + (post.num_comments * 2)

                        record = {
                            "id": unique_id,
                            "source": "reddit",
                            "platform_app": platform_app,
                            "text": combined_text,
                            "rating": None,
                            "date": post_date,
                            "engagement_score": engagement,
                            "url": f"https://reddit.com{post.permalink}",
                            "raw_metadata": {
                                "subreddit": sub_name,
                                "author": str(post.author) if post.author else "unknown",
                                "score": post.score,
                                "num_comments": post.num_comments,
                                "keyword_matched": keyword,
                                "type": "post"
                            }
                        }

                        out_f.write(json.dumps(record, ensure_ascii=False) + "\n")
                        out_f.flush()
                        seen_ids.add(unique_id)
                        items_added += 1

                    print(f"    -> Added {items_added} posts.")
                    time.sleep(1.0)  # PRAW manages rate limits automatically

                except Exception as e:
                    print(f"    [!] Error during search for '{keyword}': {e}")

    print(f"\n[✓] Reddit scraping complete! Total records saved: {len(seen_ids)}")
    return len(seen_ids)

def main():
    client_id = os.getenv("REDDIT_CLIENT_ID")
    client_secret = os.getenv("REDDIT_CLIENT_SECRET")
    user_agent = os.getenv("REDDIT_USER_AGENT", "INDmoneySIPResearch/1.0")

    if not client_id or not client_secret or client_id.strip() == "":
        print("\n" + "="*60)
        print("REDDIT API CREDENTIALS REQUIRED FOR REDDIT SCRAPING")
        print("="*60)
        print("Reddit now requires OAuth for all search and API requests.")
        print("To scrape Reddit:")
        print("1. Go to https://www.reddit.com/prefs/apps")
        print("2. Click 'create another app...' (select 'script')")
        print("3. Name: INDmoneyResearch, redirect uri: http://localhost:8080")
        print("4. Copy the client ID (under the app name) and client secret")
        print("5. Paste them into your .env file:")
        print("   REDDIT_CLIENT_ID=your_id")
        print("   REDDIT_CLIENT_SECRET=your_secret")
        print("="*60 + "\n")
        return

    scrape_with_praw(client_id, client_secret, user_agent)

if __name__ == "__main__":
    main()
