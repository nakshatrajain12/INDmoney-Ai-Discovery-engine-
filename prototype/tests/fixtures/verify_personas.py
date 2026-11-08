"""
Independent verification of the Phase 2 engine. Written separately from the TypeScript code: it reads the RAW fixture
data (personas.json) and re-derives, with exact Fractions and mpmath, invested, value, absolute return, A%, tenure,
instalment counts, XIRR (mpmath findroot and scipy brentq, Excel convention: days/365) and the situation band.
It then compares against the engine output (engine.json). It never imports engine code.

Usage:  python -I verify_personas.py <personas.json> <engine.json>
All inputs are DEMO DATA with illustrative NAVs.
"""
import json
import sys
from datetime import date
from fractions import Fraction

from mpmath import mp, mpf, findroot
from scipy.optimize import brentq

mp.dps = 50
XIRR_TOL_PCT = 0.0001  # stated tolerance: engine rounds to 4 dp, so allow 1e-4 percentage points


def d(s):
    y, m, dd = map(int, s.split("-"))
    return date(y, m, dd)


def add_months(a, n):
    y = a.year + (a.month - 1 + n) // 12
    m = (a.month - 1 + n) % 12 + 1
    import calendar
    return date(y, m, min(a.day, calendar.monthrange(y, m)[1]))


def months_between(a, b):
    if b < a:
        return 0
    n = 0
    while add_months(a, n + 1) <= b:
        n += 1
    return n


def round_half_away(fr):
    # fr: Fraction
    s = 1 if fr >= 0 else -1
    a = abs(fr)
    return s * int((a * 2 + 1) // 2) if False else s * ((a.numerator * 2 + a.denominator) // (a.denominator * 2))


def xirr_independent(flows):
    """flows: list of (date, Fraction rupees). Returns percent or None."""
    if len(flows) < 2 or not any(a < 0 for _, a in flows) or not any(a > 0 for _, a in flows):
        return None
    flows = sorted(flows, key=lambda x: x[0])
    t0 = flows[0][0]
    if all(f[0] == t0 for f in flows):
        return None
    ts = [(f[0] - t0).days / 365.0 for f in flows]
    cs = [float(f[1]) for f in flows]

    def npv_f(r):
        return sum(c / (1 + r) ** t for c, t in zip(cs, ts))

    lo, hi = -0.9999, 100.0
    if npv_f(lo) * npv_f(hi) > 0:
        return None
    r_brent = brentq(npv_f, lo, hi, xtol=1e-14, rtol=1e-14, maxiter=500)
    # high precision polish with mpmath
    mts = [mpf((f[0] - t0).days) / 365 for f in flows]
    mcs = [mpf(f[1].numerator) / mpf(f[1].denominator) for f in flows]
    r_mp = findroot(lambda r: sum(c / (1 + r) ** t for c, t in zip(mcs, mts)), mpf(r_brent))
    assert abs(float(r_mp) - r_brent) < 1e-9, "brentq and mpmath disagree"
    return float(r_mp) * 100


def band(pct2):  # pct2 = A% in hundredths of a percent
    if pct2 <= -500:
        return "NEGATIVE"
    if pct2 <= -50:
        return "SMALL_NEGATIVE"
    if pct2 < 50:
        return "FLAT"
    if pct2 < 500:
        return "SMALL_POSITIVE"
    return "POSITIVE"


def stage(m):
    return "OVER_12" if m >= 12 else "M6_12" if m >= 6 else "M3_6" if m >= 3 else "M1_3" if m >= 1 else "M1"


def main(pp, ep):
    personas = json.load(open(pp, encoding="utf-8"))
    engine = {e["sipId"]: e for e in json.load(open(ep, encoding="utf-8"))}
    problems, n = [], 0
    worst_xirr = 0.0
    for p in personas:
        asof = d(p["asOf"])
        for b in p["sips"]:
            n += 1
            sid = b["sip"]["id"]
            e = engine[sid]["metrics"]
            ok = [i for i in b["instalments"] if i["status"] == "SUCCESS" and i["settledOn"] and d(i["settledOn"]) <= asof]
            invested = sum(i["amountPaise"] for i in ok)  # integer paise, exact
            val = b["valuation"]["currentValuePaise"] if b["valuation"] else None
            exp = {"investedPaise": invested, "instalmentsPaid": len(ok)}
            exp["instalmentsFailed"] = sum(1 for i in b["instalments"] if i["status"] == "FAILED" and d(i["dueDate"]) <= asof)
            exp["instalmentsPending"] = sum(1 for i in b["instalments"] if i["status"] == "PENDING" and d(i["dueDate"]) <= asof)
            if ok:
                first = min(d(i["settledOn"]) for i in ok)
                exp["tenureMonths"] = months_between(first, asof)
            else:
                exp["tenureMonths"] = 0
            exp["stage"] = stage(exp["tenureMonths"])
            if val is None or invested <= 0:
                exp.update(currentValuePaise=val, absoluteReturnPaise=None, situation="INSUFFICIENT_DATA")
                pct2 = None
            else:
                a = val - invested
                pct2 = round_half_away(Fraction(a * 10000, invested))
                exp.update(currentValuePaise=val, absoluteReturnPaise=a)
                exp["situation"] = "INSUFFICIENT_DATA" if len(ok) < 2 else band(pct2)
            for k, v in exp.items():
                if e[k] != v:
                    problems.append(f"{sid}: {k} engine={e[k]!r} independent={v!r}")
            if pct2 is not None:
                got = round(e["absoluteReturnPct"] * 100)
                want = round_half_away(Fraction(a * 1000000, invested)) / 100
                if abs(got - want) > 0.5:
                    problems.append(f"{sid}: pct engine={e['absoluteReturnPct']} independent={want/100}")
            # XIRR
            if val is None:
                xi = None
                want_status = "UNAVAILABLE_NO_VALUATION"
            else:
                flows = [(d(i["settledOn"]), Fraction(-i["amountPaise"], 100)) for i in ok] + [(asof, Fraction(val, 100))]
                xi = xirr_independent(flows)
                want_status = "OK" if xi is not None else None
            if xi is None:
                if e["xirrPct"] is not None:
                    problems.append(f"{sid}: engine XIRR {e['xirrPct']} but independent says none")
                if want_status and e["xirrStatus"] != want_status:
                    problems.append(f"{sid}: xirrStatus {e['xirrStatus']} != {want_status}")
                if val is not None and not e["xirrStatus"].startswith("UNAVAILABLE"):
                    problems.append(f"{sid}: expected UNAVAILABLE status, got {e['xirrStatus']}")
            else:
                if e["xirrPct"] is None:
                    problems.append(f"{sid}: engine XIRR null but independent {xi:.6f}")
                else:
                    diff = abs(e["xirrPct"] - xi)
                    worst_xirr = max(worst_xirr, diff)
                    if diff > XIRR_TOL_PCT:
                        problems.append(f"{sid}: XIRR engine={e['xirrPct']} independent={xi:.6f} diff={diff:.6f}")
    print(f"SIPs checked: {n}")
    print(f"Worst XIRR difference: {worst_xirr:.8f} percentage points (tolerance {XIRR_TOL_PCT})")
    print(f"Mismatches: {len(problems)}")
    for x in problems:
        print("  MISMATCH", x)
    sys.exit(1 if problems else 0)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
