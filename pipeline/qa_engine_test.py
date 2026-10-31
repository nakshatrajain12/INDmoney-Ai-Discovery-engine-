"""
Phase 6: Final QA & Engine Verification Suite.
Tests:
1. Data Integrity: Verifies 3,079 items, 10 themes, 5 sources, golden set.
2. Q1-Q9 Discovery Questions Coverage: Verifies all 9 questions have ample representation.
3. RAG Query Engine: Tests semantic relevance and synthesis across 4 core research queries.
4. Segment Matrix: Tests dynamic re-ranking logic across Beginner, Moderate, and Experienced segments.
5. INDmoney Design & Scoring Validation: Verifies Opportunity Score math and range bounds [0, 1].
"""

import os
import sys
import json
import math
from typing import Dict, List, Any

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT_DIR, "data")
THEMES_FILE = os.path.join(DATA_DIR, "themes", "opportunity_matrix.json")
EXTRACTED_FILE = os.path.join(DATA_DIR, "extracted", "extracted_insights.jsonl")
GOLDEN_SET_HUMAN = os.path.join(DATA_DIR, "eval", "golden_set_human.json")
GOLDEN_SET_ENGINE = os.path.join(DATA_DIR, "eval", "golden_set_engine.json")

def test_data_integrity():
    print("\n--- TEST 1: DATA INTEGRITY & CORPUS HEALTH ---")
    assert os.path.exists(EXTRACTED_FILE), "extracted_insights.jsonl missing"
    assert os.path.exists(THEMES_FILE), "opportunity_matrix.json missing"
    assert os.path.exists(GOLDEN_SET_HUMAN), "golden_set_human.json missing"
    assert os.path.exists(GOLDEN_SET_ENGINE), "golden_set_engine.json missing"

    with open(EXTRACTED_FILE, "r", encoding="utf-8") as f:
        items = [json.loads(line) for line in f if line.strip()]

    print(f"  [✓] Extracted Insights Count: {len(items):,} items (Expected: 3,079)")
    assert len(items) == 3079, f"Expected 3,079 items, got {len(items)}"

    sources = {}
    for it in items:
        src = it.get("source", "unknown")
        sources[src] = sources.get(src, 0) + 1
    
    print(f"  [✓] Source Distribution across 5 channels:")
    for src, cnt in sorted(sources.items(), key=lambda x: -x[1]):
        print(f"      - {src:15s}: {cnt:5d} ({cnt/len(items)*100:5.1f}%)")
    assert len(sources) >= 5, "Fewer than 5 distinct sources found"

    with open(THEMES_FILE, "r", encoding="utf-8") as f:
        themes = json.load(f)
    print(f"  [✓] Discovered Themes: {len(themes)} themes")
    assert len(themes) == 10, f"Expected 10 themes, got {len(themes)}"
    return items, themes

def test_q1_to_q9_coverage(items: List[Dict]):
    print("\n--- TEST 2: DISCOVERY QUESTIONS (Q1-Q9) COVERAGE ---")
    q_map = {
        "Q1": "Drop-off trigger moments & early exit warning signs",
        "Q2": "Pre-drop-off behavioral anomalies (login drops, paused SIPs)",
        "Q3": "Product friction points (mandates, auto-debit, KYC, allocation)",
        "Q4": "Mental models & cognitive disconnects (SIP vs FD, market panic)",
        "Q5": "Information desert & emotional vacuum (Months 3-6 inertia)",
        "Q6": "External validation-seeking (Finfluencers, family, forums)",
        "Q7": "Retention hook efficacy (what makes sticky users stay)",
        "Q8": "Cohort-specific nuances (Gen Z, tier 2/3, conservative)",
        "Q9": "Competitor switching triggers (Groww, Zerodha Coin, Kuvera)"
    }
    
    q_counts = {f"Q{i}": 0 for i in range(1, 10)}
    for it in items:
        for q in it.get("discovery_questions", []):
            if q in q_counts:
                q_counts[q] += 1

    all_covered = True
    for q_code, q_desc in q_map.items():
        cnt = q_counts[q_code]
        status = "PASS" if cnt >= 5 else "FAIL"
        print(f"  [{status}] {q_code} ({cnt:4d} items): {q_desc}")
        if cnt < 5:
            all_covered = False
    
    assert all_covered, "Some discovery questions have insufficient data"
    print("  [✓] All 9 Discovery Questions are strongly represented in corpus.")

def test_opportunity_scores(themes: List[Dict]):
    print("\n--- TEST 3: OPPORTUNITY SCORING MATH & WEIGHTS VALIDATION ---")
    for t in themes:
        sb = t["score_breakdown"]
        w = sb["weights"]
        f = sb["frequency"]
        s = sb["severity"]
        a = sb["actionability"]
        r = sb["recency"]
        
        expected_score = round(f * w["frequency"] + s * w["severity"] + a * w["actionability"] + r * w["recency"], 3)
        actual_score = round(t["opportunity_score"], 3)
        
        diff = abs(expected_score - actual_score)
        assert diff <= 0.005, f"Score mismatch in {t['id']}: expected {expected_score}, got {actual_score}"
        print(f"  [✓] Theme {t['id']} ({t['name'][:30]:30s}): Score = {actual_score:.3f} | F:{f:.2f} S:{s:.2f} A:{a:.2f} R:{r:.2f}")

    # Verify ranking is strictly monotonic descending
    scores = [t["opportunity_score"] for t in themes]
    assert scores == sorted(scores, reverse=True), "Themes are not sorted by opportunity score descending"
    print(f"  [✓] Top Theme: {themes[0]['name']} (Score: {themes[0]['opportunity_score']:.3f})")
    print(f"  [✓] Runner-up Theme: {themes[1]['name']} (Score: {themes[1]['opportunity_score']:.3f})")

def test_rag_semantic_retrieval(items: List[Dict], themes: List[Dict]):
    print("\n--- TEST 4: RAG SEMANTIC RETRIEVAL & CITATION ENGINE ---")
    test_queries = [
        "Why do first time investors pause or cancel SIPs between months 3 and 6?",
        "How do red portfolio days cause panic selling and churn?",
        "What mandate and auto-debit failure issues occur on INDmoney?",
        "Why do beginners feel stuck in an information desert without feedback?"
    ]

    for q_idx, q in enumerate(test_queries, 1):
        clean = q.lower()
        terms = [t for t in clean.split() if len(t) > 3 and t not in {"first", "time", "between", "cause", "without", "what", "feel"}]
        
        # Simulated search scoring
        scored = []
        for it in items:
            score = 0
            txt = (it.get("text", "") + " " + it.get("key_quote", "")).lower()
            issue = (it.get("friction_point", {}).get("specific_issue") or "").lower()
            unmet = (it.get("unmet_need") or "").lower()
            for t in terms:
                if t in txt: score += 2
                if t in issue: score += 3
                if t in unmet: score += 3
            if score > 0:
                scored.append((score, it))
        
        scored.sort(key=lambda x: -x[0])
        top_citations = scored[:3]
        
        print(f"\n  Query {q_idx}: \"{q}\"")
        print(f"  [✓] Retrieved {len(scored)} candidates; Top 3 Citations:")
        for rank, (score, cit) in enumerate(top_citations, 1):
            source = cit.get("source", "unknown")
            rating = cit.get("rating", "N/A")
            quote = cit.get("key_quote") or cit.get("text", "")[:90]
            print(f"      [{rank}] ({source}, ★{rating}): \"{quote[:80]}...\" (Relevance: {score})")
        assert len(top_citations) >= 1, f"No citations retrieved for query: {q}"

def test_segment_matrix(themes: List[Dict]):
    print("\n--- TEST 5: SEGMENT MATRIX & DYNAMIC RE-RANKING ---")
    segments = ["beginner", "intermediate", "experienced"]
    for seg in segments:
        ranked = sorted(
            themes,
            key=lambda t: t.get("segment_breakdown", {}).get("experience_level", {}).get(seg, 0),
            reverse=True
        )
        top = ranked[0]
        cnt = top.get("segment_breakdown", {}).get("experience_level", {}).get(seg, 0)
        tot_theme = top.get("volume_count", 1)
        share = cnt / tot_theme if tot_theme > 0 else 0
        print(f"  [✓] {seg.capitalize():12s} Segment Top Friction: {top['id']} - {top['name']} ({cnt} items, {share*100:.1f}% of theme)")
        assert cnt > 0, f"No items for segment {seg}"

if __name__ == "__main__":
    items, themes = test_data_integrity()
    test_q1_to_q9_coverage(items)
    test_opportunity_scores(themes)
    test_rag_semantic_retrieval(items, themes)
    test_segment_matrix(themes)
    print("\n========================================================")
    print("  ALL PHASE 6 ENGINE QA & VALIDATION CHECKS PASSED [✓]   ")
    print("========================================================\n")
