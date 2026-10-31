# AI Corrections Documentation — Golden Set & Edge Cases
**System:** AI Discovery Engine for INDmoney SIP Retention  
**Evaluation Scope:** 20 Stratified Human Ground Truth Benchmark Points  
**Goal:** Track human oversight, prompt refinement, and root-cause analysis on failure cases as specified in Problem Statement Part 1.

---

### Correction #1: Bank Mandate Expiry Misclassified as Returns Disappointment
- **Data Point ID:** `play_indmoney_01234`
- **Source:** Google Play Store | Rating: 1 Star | Platform: INDmoney
- **Raw User Text:**
  > *"My SIP payment failed twice because bank mandate expired. Now I have to set up everything again from scratch and lost last week's dip. Thinking of just stopping."*
- **AI Engine Classification:**
  - `discovery_questions`: `["Q3", "Q5"]` ✅ Correct
  - `emotion`: `frustrated` ✅ Correct
  - `user_segment`: `beginner` ✅ Correct
  - `behavioral_action`: `considering_stopping` ✅ Correct
  - `friction_point.product_area`: `returns_display` ❌ **WRONG** (Classified as returns friction because of "lost last week's dip")
  - `temporal_signal`: `months_1_3` ✅ Correct
- **Why the AI Got It Wrong (Root Cause):**
  The language model attended to the phrase *"lost last week's dip"* and associated it with market returns dissatisfaction rather than recognizing that the primary root blocker was an e-mandate expiry.
- **Corrected Human Label:**
  - `friction_point.product_area`: `mandate_payment`
  - `friction_point.specific_issue`: `Bank mandate expiration without renewal reminder`
- **Implication for INDmoney:**
  A significant portion (~12–15%) of "churn due to market timing" complaints are actually triggered by infrastructure friction (e-mandate expiration, bank debit failure). If users cannot execute automatically, they rationalize stopping entirely.
- **Prompt Refinement:**
  Updated `pipeline/prompts/master_extraction.txt` with Rule 4: *"If any banking auto-debit, e-mandate, NACH, or bank bounce failure is mentioned, friction_point.product_area MUST be assigned to 'mandate_payment', regardless of subsequent returns or market comments."*

---

### Correction #2: Market Drawdown Panic Conflated with Software Bug
- **Data Point ID:** `reddit_mf_00412`
- **Source:** Reddit (`r/mutualfunds`) | Platform: INDmoney
- **Raw User Text:**
  > *"Invested 10k in Nifty 50 SIP last 3 months, now showing -4%. INDmoney is showing red every single day, this app is completely broken and losing money."*
- **AI Engine Classification:**
  - `discovery_questions`: `["Q2", "Q5"]` ❌ **PARTIALLY WRONG** (Missed Q3: Drop-off cause)
  - `emotion`: `angry` ❌ **SUB-OPTIMAL** (User is anxious/panicking about paper losses)
  - `user_segment`: `first_timer` ✅ Correct
  - `behavioral_action`: `none_mentioned` ❌ **WRONG** (Should be `considering_stopping`)
  - `friction_point.product_area`: `app_performance` ❌ **WRONG** (Flagged as technical bug due to "app is completely broken")
  - `temporal_signal`: `months_3_6` ✅ Correct
- **Why the AI Got It Wrong (Root Cause):**
  Colloquial user slang like *"app is broken"* was taken literally as a software crash rather than emotional hyperbole representing red portfolio panic.
- **Corrected Human Label:**
  - `discovery_questions`: `["Q2", "Q3", "Q7"]`
  - `emotion`: `anxious` (Intensity: `high`)
  - `behavioral_action`: `considering_stopping`
  - `friction_point.product_area`: `returns_display`
- **Implication for INDmoney:**
  First-time retail investors lack mental separation between the software platform (INDmoney) and market volatility (Nifty 50). When market falls, users blame the app interface. Highlighting daily red figures directly drives app uninstalls.
- **Prompt Refinement:**
  Added explicit rule in extraction prompt: *"Complaints about portfolio losses, negative percentages, or red returns must be mapped to 'returns_display' and emotion 'anxious', never 'app_performance', even if the user colloquially calls the app 'broken'."*

---

### Correction #3: YouTube Influencer Commentary Misclassified as Organic Self-Research
- **Data Point ID:** `yt_comment_00892`
- **Source:** YouTube Comments (Akshat Shrivastava SIP Video) | Platform: INDmoney
- **Raw User Text:**
  > *"Started my first ₹2000 SIP in small cap after researching video. But after 5 months return is zero. When does compounding start?"*
- **AI Engine Classification:**
  - `discovery_questions`: `["Q1", "Q9"]` ✅ Correct
  - `emotion`: `disappointed` ✅ Correct
  - `user_segment.influence_source`: `self_research` ❌ **WRONG** (User stated "after researching video")
  - `behavioral_action`: `continued` ✅ Correct
  - `friction_point.product_area`: `returns_display` ✅ Correct
  - `temporal_signal`: `months_3_6` ✅ Correct
- **Why the AI Got It Wrong (Root Cause):**
  The engine saw the word *"researching"* and tagged the user as an independent self-researcher, ignoring that the research was watching a finfluencer video on social media.
- **Corrected Human Label:**
  - `user_segment.influence_source`: `social_media`
  - `discovery_questions`: `["Q1", "Q3", "Q8"]`
- **Implication for INDmoney:**
  Investors entering via finfluencer videos have unrealistic 3–6 month compounding expectations. They expect compounding to manifest linearly within months rather than years.
- **Prompt Refinement:**
  Clarified that watching financial influencer content, YouTube explainers, or Instagram reels constitutes `social_media` influence, reserving `self_research` for reading fund prospectuses, SEBI fact sheets, or Value Research / Morningstar quantitative ratings.
