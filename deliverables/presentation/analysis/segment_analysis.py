"""Segment analysis backing presentation/analysis/segment_analysis.md.

Usage (from anywhere):  python presentation/analysis/segment_analysis.py
Reads data/extracted/extracted_insights.jsonl, prints per-segment metrics as JSON
and writes them to presentation/analysis/segment_metrics.json.

Segments use only observed signals (channel + star rating). Problem, SIP, stop-intent
and duration flags are regexes over raw text, so rule-based fallback fields are not used.
The CTRL weights are analyst judgement, not measured.
"""
import json, re, collections as C, sys
from pathlib import Path
sys.stdout.reconfigure(encoding="utf-8")
HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent  # repo root
OUT = HERE / "segment_metrics.json"
rows = [json.loads(l) for l in open(ROOT / "data" / "extracted" / "extracted_insights.jsonl", encoding="utf-8") if l.strip()]

P = {
 "payment_mandate": r"mandate|auto.?debit|\bnach\b|bounce|sip (failed|fail|not (deduct|execut|process))|payment (fail|issue|problem|stuck|not)|money (deducted|debited|stuck|not (credited|received|refunded))|amount (deducted|debited)|refund|upi (fail|issue)|transaction (fail|stuck|pending)",
 "withdrawal_redemption": r"withdraw|redeem|redemption|payout|settle(d|ment)|funds? (stuck|locked|blocked|held|not)|unable to (withdraw|redeem|sell)",
 "charges_fees": r"charge|brokerage|\bfees?\b|hidden|\bamc\b|commission|penalt",
 "returns_loss": r"\bloss(es)?\b|negative|\bred\b|crash|bleed|underperform|\bfell\b|returns?\b|xirr|profit",
 "app_technical": r"crash|\bhang|\bslow|glitch|\bbug|not working|doesn.?t work|not opening|\berror|log.?in|\botp\b|server|loading|\blag",
 "support": r"customer (care|support|service)|\bsupport\b|no response|not responding|ticket|complaint|helpline|chat ?bot|resolution|escalat",
 "kyc_onboarding": r"\bkyc\b|verification|onboard|account open|open(ing)? (an )?account|aadhaar|sign ?up|registration",
 "info_clarity": r"confus|understand|explain|unclear|don.?t know|how (to|do|does|can)|what (is|does|are)|clarity|calculation|transparen|guidance|educat",
 "fund_choice": r"which fund|best fund|recommend|suggest|small ?cap|large ?cap|mid ?cap|index fund|direct (plan|fund)|regular (plan|fund)|\bnfo\b|\belss\b",
}
SIP = r"\bsips?\b|mutual funds?|\bmfs?\b|\bnav\b|\belss\b|index fund|\bfolio|\bxirr\b|systematic"
STOP = r"\bstop(ped|ping)?\b|paus(e|ed|ing)|cancel+(ed|ing)?\b|discontinu|uninstall|switch(ed|ing)? (to|from)|\bquit|clos(e|ed|ing) (my )?account|moving (to|my)|shift(ed|ing)? to"
STOCK = r"\bstocks?\b|f&o|\boptions?\b|intraday|\bfno\b|\bipo\b|trading"
DUR = re.compile(r"(\d+|one|two|three|four|five|six|seven|eight|nine|ten|a)\s*\+?\s*(months?|mos?\b|yrs?|years?)", re.I)
NUM = {"one":1,"two":2,"three":3,"four":4,"five":5,"six":6,"seven":7,"eight":8,"nine":9,"ten":10,"a":1}
CTRL = {  # analyst judgement: can INDmoney change it with a product/ops change?
 "payment_mandate": 1, "withdrawal_redemption": 1, "charges_fees": 0.5, "returns_loss": 0.5,
 "app_technical": 1, "support": 1, "kyc_onboarding": 0.5, "info_clarity": 1, "fund_choice": 0.5}

def seg(r):
    if r["source"] in ("google_play", "app_store"):
        return "A_dissat" if (r["rating"] or 0) <= 2 else "B_sat"
    return "C_community"
def inr(x): return x["platform_app"] == "INDmoney"
def dur_bucket(t):
    out = []
    for m in DUR.finditer(t):
        n = m.group(1).lower(); n = int(n) if n.isdigit() else NUM[n]
        mo = n * 12 if m.group(2).lower().startswith(("y",)) else n
        if mo > 120: continue
        out.append("<=1m" if mo <= 1 else "2-3m" if mo <= 3 else "4-6m" if mo <= 6 else "7-12m" if mo <= 12 else ">12m")
    return out

segs = C.defaultdict(list)
for r in rows: segs[seg(r)].append(r)
N = len(rows)
res = {}
for k, g in sorted(segs.items()):
    n = len(g); d = {"n": n, "share": round(100*n/N,1), "indmoney_n": sum(inr(r) for r in g)}
    d["apps"] = C.Counter(r["platform_app"] for r in g).most_common()
    d["sources"] = C.Counter(r["source"] for r in g).most_common()
    rt = [r["rating"] for r in g if r["rating"]]
    d["avg_rating"] = round(sum(rt)/len(rt),2) if rt else None
    d["rating_dist"] = sorted(C.Counter(r["rating"] for r in g).items(), key=lambda x: str(x[0]))
    txt = [(r, r["text"].lower()) for r in g]
    d["sip_explicit"] = sum(bool(re.search(SIP, t)) for _, t in txt)
    d["sip_explicit_indmoney"] = sum(bool(re.search(SIP, t)) and inr(r) for r, t in txt)
    d["stop_kw"] = sum(bool(re.search(STOP, t)) for _, t in txt)
    d["stop_kw_sip"] = sum(bool(re.search(STOP, t)) and bool(re.search(SIP, t)) for _, t in txt)
    d["stock_kw"] = sum(bool(re.search(STOCK, t)) for _, t in txt)
    d["probs"] = {p: sum(bool(re.search(rx, t)) for _, t in txt) for p, rx in P.items()}
    d["probs_sip"] = {p: sum(bool(re.search(rx, t)) and bool(re.search(SIP, t)) for _, t in txt) for p, rx in P.items()}
    d["probs_indm"] = {p: sum(bool(re.search(rx, t)) and inr(r) for r, t in txt) for p, rx in P.items()}
    hits = sum(sum(bool(re.search(rx,t)) for rx in P.values()) for _,t in txt)
    d["ctrl_weighted"] = round(sum(d["probs"][p]*CTRL[p] for p in P) / max(1,sum(d["probs"].values())),2)
    d["no_problem_kw"] = sum(not any(re.search(rx, t) for rx in P.values()) for _, t in txt)
    # stored fields + provenance
    llm = [r for r in g if r["user_segment"]["segment_evidence"] != "rule-based baseline"]
    d["llm_n"] = len(llm)
    d["stored_sev"] = C.Counter(r["friction_point"]["severity"] for r in g).most_common()
    d["llm_sev"] = C.Counter(r["friction_point"]["severity"] for r in llm).most_common()
    d["llm_area"] = C.Counter(r["friction_point"]["product_area"] for r in llm).most_common(6)
    d["llm_emo"] = C.Counter(r["emotion"]["primary"] for r in llm).most_common(5)
    d["llm_action"] = C.Counter(r["behavioral_action"]["action_taken"] for r in llm).most_common(6)
    for a, f in [("exp", lambda r: r["user_segment"]["experience_level"]), ("age", lambda r: r["user_segment"]["age_hint"]),
                 ("inc", lambda r: r["user_segment"]["income_hint"]), ("infl", lambda r: r["user_segment"]["influence_source"]),
                 ("ten", lambda r: r["temporal_signal"]["sip_tenure"])]:
        d["llm_" + a] = C.Counter(f(r) for r in llm).most_common()
        d["all_" + a + "_unknown"] = round(100*sum(f(r) == "unknown" for r in g)/n, 1)
    d["llm_unmet"] = C.Counter((r["unmet_need"] or "").strip().lower() for r in llm if r["unmet_need"]).most_common(12)
    d["llm_conf"] = round(sum(r["analysis_confidence"] for r in llm)/max(1,len(llm)),2)
    b = C.Counter(); nd = 0
    for r, t in txt:
        bb = dur_bucket(t)
        if bb: nd += 1; b.update(set(bb))
    d["dur_texts"] = nd; d["dur_buckets"] = b.most_common()
    b2 = C.Counter(); nd2 = 0
    for r, t in txt:
        if re.search(SIP, t):
            bb = dur_bucket(t)
            if bb: nd2 += 1; b2.update(set(bb))
    d["dur_texts_sip"] = nd2; d["dur_buckets_sip"] = b2.most_common()
    # wish / request language
    d["request_kw"] = sum(bool(re.search(r"\bwish\b|should (have|add|provide|show)|please (add|provide|give|fix|show)|need(s)? (to|a|an)|\bfeature\b|would be (nice|great|better)|suggest", t)) for _, t in txt)
    res[k] = d
json.dump(res, open(OUT, "w", encoding="utf-8"), indent=1, default=str)
print(json.dumps(res, indent=1, default=str))
