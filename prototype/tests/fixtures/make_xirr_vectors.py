"""
Builds tests/fixtures/xirr-vectors.json and xirr-vectors.xlsx.

Expected XIRR values come from an implementation that shares no code with the engine: scipy brentq polished with
mpmath at 50 digits, Excel convention (actual days / 365). Case MS-DOC-1 is the worked example published in
Microsoft's XIRR documentation (documented result 0.373362535), so it is a value that came from a spreadsheet, not
from us; the generator asserts our independent solver reproduces it.

The .xlsx holds each case with a live =XIRR() formula next to the independent value so the owner can recalculate it in
Excel. NOTE: no spreadsheet application was available when this was generated, so the formulas have NOT been
evaluated by a spreadsheet engine here (the cells have no cached results until opened in Excel).

Run:  python make_xirr_vectors.py     (from this folder)
"""
import json
from datetime import date, timedelta
from pathlib import Path

from mpmath import mp, mpf, findroot
from openpyxl import Workbook
from openpyxl.styles import Font

mp.dps = 50
HERE = Path(__file__).parent


def solve(flows):
    flows = sorted(flows)
    if len(flows) < 2 or not any(a < 0 for _, a in flows) or not any(a > 0 for _, a in flows):
        return "UNAVAILABLE_INSUFFICIENT_DATA", None
    t0 = flows[0][0]
    if all(d == t0 for d, _ in flows):
        return "UNAVAILABLE_INSUFFICIENT_DATA", None
    ts = [(d - t0).days / 365.0 for d, _ in flows]
    cs = [float(a) for _, a in flows]
    f = lambda r: sum(c / (1 + r) ** t for c, t in zip(cs, ts))
    lo, hi = -0.9999, 100.0
    if f(lo) * f(hi) > 0:
        return "UNAVAILABLE_NOT_CONVERGED", None
    from scipy.optimize import brentq
    r0 = brentq(f, lo, hi, xtol=1e-14, rtol=1e-14, maxiter=500)
    mts = [mpf((d - t0).days) / 365 for d, _ in flows]
    mcs = [mpf(a) for _, a in flows]
    r = findroot(lambda x: sum(c / (1 + x) ** t for c, t in zip(mcs, mts)), mpf(r0))
    return "OK", float(r) * 100


def monthly(start, n, amt, step_months=1):
    out = []
    for i in range(n):
        m = start.month - 1 + i * step_months
        y, mo = start.year + m // 12, m % 12 + 1
        out.append((date(y, mo, start.day), -amt))
    return out


def daily(start, n, amt, step=1):
    return [(start + timedelta(days=i * step), -amt) for i in range(n)]


CASES = [
    ("MS-DOC-1", "Microsoft XIRR documentation example (documented 0.373362535)",
     [(date(2008, 1, 1), -10000), (date(2008, 3, 1), 2750), (date(2008, 10, 30), 4250), (date(2009, 2, 15), 3250), (date(2009, 4, 1), 2750)]),
    ("ONE-YEAR-PLUS-10", "One outflow, +10% after exactly 365 days: exactly 10%", [(date(2025, 1, 1), -100000), (date(2026, 1, 1), 110000)]),
    ("TWO-YEAR-PLUS-21", "One outflow, +21% after 730 days: exactly 10%", [(date(2024, 1, 1), -100000), (date(2025, 12, 31), 121000)]),
    ("ONE-YEAR-MINUS-10", "One outflow, -10% after 365 days: exactly -10%", [(date(2025, 1, 1), -100000), (date(2026, 1, 1), 90000)]),
    ("BREAK-EVEN", "Value equals invested: 0%", [(date(2026, 1, 1), -50000), (date(2026, 7, 1), 50000)]),
    ("MONTHLY-GAIN", "12 monthly SIPs of 5,000, final value 63,500", monthly(date(2025, 11, 5), 12, 5000) + [(date(2026, 11, 5), 63500)]),
    ("MONTHLY-LOSS", "6 monthly SIPs of 4,000, final value 23,100 (loss)", monthly(date(2026, 4, 10), 6, 4000) + [(date(2026, 10, 10), 23100)]),
    ("QUARTERLY", "4 quarterly SIPs of 6,000, final value 24,180", monthly(date(2025, 11, 8), 4, 6000, 3) + [(date(2026, 11, 8), 24180)]),
    ("WEEKLY-3", "3 weekly SIPs of 500, final value 1,511.35", daily(date(2026, 10, 18), 3, 500, 7) + [(date(2026, 11, 8), 1511.35)]),
    ("LEAP-YEAR-SPAN", "Span includes 29 Feb 2024; 365-day basis still used", [(date(2023, 6, 1), -50000), (date(2024, 12, 1), 53000)]),
    ("LARGE-AMOUNTS", "Lakh-scale amounts, 18 months", monthly(date(2025, 5, 1), 18, 125000) + [(date(2026, 11, 1), 2400000)]),
    ("TWO-INFLOWS", "Outflow then a partial withdrawal then final value (generic solver check)", [(date(2025, 1, 1), -100000), (date(2025, 7, 1), 30000), (date(2026, 1, 1), 85000)]),
    ("DAILY-3-OUT-OF-BOUND", "Daily SIP of 100 for 3 days, final 307.45: root exists but is above +10,000%, so UNAVAILABLE (matches fixture xirr-fails)", daily(date(2026, 11, 6), 3, 100) + [(date(2026, 11, 8), 307.45)]),
    ("ALL-OUTFLOWS", "Same-sign flows: no XIRR", [(date(2026, 1, 1), -1000), (date(2026, 2, 1), -1000)]),
    ("SINGLE-FLOW", "A single flow: no XIRR", [(date(2026, 1, 1), -1000)]),
    ("SAME-DAY", "All flows on one date: no XIRR", [(date(2026, 1, 1), -1000), (date(2026, 1, 1), 1100)]),
]


def main():
    vectors, rows = [], []
    for cid, desc, flows in CASES:
        status, pct = solve(flows)
        vectors.append({
            "id": cid,
            "description": desc,
            "flows": [{"date": d.isoformat(), "amountPaise": int(round(a * 100))} for d, a in flows],
            "expectedStatus": status,
            "expectedXirrPct": None if pct is None else round(pct, 8) + 0.0,
        })
        rows.append((cid, desc, flows, pct))
    ms = next(v for v in vectors if v["id"] == "MS-DOC-1")
    assert abs(ms["expectedXirrPct"] - 37.3362535) < 1e-6, ms
    # documented fixture-case reason: a root exists above the bound
    f = [(date(2026, 11, 6), -100), (date(2026, 11, 7), -100), (date(2026, 11, 8), -100), (date(2026, 11, 8), 307.45)]
    t0 = f[0][0]
    g = lambda r: sum(a / (1 + r) ** ((d - t0).days / 365) for d, a in f)
    assert g(100.0) * g(-0.9999) > 0 and g(1e12) * g(100.0) < 0, "xirr-fails: root must lie above the bound"
    (HERE / "xirr-vectors.json").write_text(json.dumps({
        "tolerancePctPoints": 0.0001,
        "note": "Expected values: independent scipy+mpmath solver, Excel convention (days/365). MS-DOC-1 is the published Microsoft XIRR documentation example. DEMO/synthetic cash flows only; not market data.",
        "vectors": vectors,
    }, indent=2), encoding="utf-8")

    wb = Workbook()
    ws = wb.active
    ws.title = "XIRR vectors"
    ws.append(["How to use: open in Excel; column F recalculates =XIRR. Compare with column G (independent Python/mpmath) and the engine. Synthetic cash flows only."])
    ws.append([])
    ws.append(["Case", "Description", "Date", "Cash flow (INR)", "", "Spreadsheet XIRR (Excel formula)", "Independent XIRR (Python/mpmath)", "Difference"])
    for c in ws[3]:
        c.font = Font(bold=True)
    for cid, desc, flows, pct in rows:
        start = ws.max_row + 1
        for k, (d, a) in enumerate(sorted(flows)):
            ws.append([cid if k == 0 else None, desc if k == 0 else None, d, a])
            ws.cell(row=ws.max_row, column=3).number_format = "yyyy-mm-dd"
        end = ws.max_row
        ws.cell(row=start, column=6, value=f'=IFERROR(XIRR(D{start}:D{end},C{start}:C{end}),"n/a (Excel error)")')
        ws.cell(row=start, column=7, value=("n/a (no valid XIRR in range)" if pct is None else pct / 100))
        if pct is not None:
            ws.cell(row=start, column=8, value=f"=IFERROR(F{start}-G{start},\"n/a\")")
        ws.cell(row=start, column=7).number_format = "0.000000%"
        ws.cell(row=start, column=6).number_format = "0.000000%"
    for col, w in zip("ABCDEFGH", [22, 60, 12, 16, 3, 30, 30, 14]):
        ws.column_dimensions[col].width = w
    wb.save(HERE / "xirr-vectors.xlsx")
    print(f"{len(vectors)} vectors written; MS-DOC-1 reproduced: {ms['expectedXirrPct']}")


if __name__ == "__main__":
    main()
