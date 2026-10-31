# AI Corrections Documentation — Golden Set & Edge Cases
**System:** AI Discovery Engine for INDmoney SIP Retention  
**Goal:** Track human oversight and prompt refinement on failure cases.

---

### Correction #1: Misclassified "Mandate Failure" as "Returns Disappointment"
- **Data Point ID:** `play_indmoney_01234`
- **Raw Text:** "My SIP payment failed twice because bank mandate expired. Now I have to set up everything again. Thinking of just stopping."
- **AI Engine Classification:**
  - Discovery Question: Q3 (What leads to pausing) ✅
  - Emotion: disappointed ✅
  - Friction Point: `returns_display` ❌ (should be: `mandate_payment`)
  - Behavioral Action: `considering_stopping` ✅
- **Human Correction:** Corrected friction point to `mandate_payment`.
- **Prompt Adjustment:** Added specific instructions in `master_extraction.txt` clarifying that e-mandate and banking debit failures map strictly to `mandate_payment`.

---

### Correction #2: Conflated Market-Wide Dip with App Technical Bug
- **Data Point ID:** `reddit_mf_00412`
- **Raw Text:** "Invested 10k in Nifty 50 SIP last 3 months, showing -4%. INDmoney is showing red every day, app is terrible."
- **AI Engine Classification:**
  - Friction Point: `app_performance` ❌
  - Emotion: `angry`
- **Human Correction:**
  - Correct Friction Point: `returns_display` / `educational_content`
  - Emotion: `anxious`
- **Prompt Adjustment:** Clarified in prompt that portfolio drawdown complaints should map to returns expectation gap (`returns_display`) rather than software bugs (`app_performance`).

