# 🚀 Phase-Wise Implementation Plan — AI Discovery Engine
**Project:** INDmoney SIP Retention  
**Built from:** `architecture.md` + `ProblemStatement.txt`  
**Deadline:** 9 November 2026, 3:59 PM IST  
**Total Build Window:** 9 days

---

## 🗂️ Master Timeline

```
Day 1    ──────── Phase 0: Environment & Skeleton
Day 1–2  ──────── Phase 1: Data Ingestion (Stage 0)
Day 3–4  ──────── Phase 2: Cleaning + LLM Extraction (Stages 1–2)
Day 5    ──────── Phase 3: Clustering + Scoring (Stage 3)
Day 5–6  ──────── Phase 4: Interactive UI (Stage 4)
Day 7–8  ──────── Phase 5: Eval Layer + Deployment
Day 9    ──────── Phase 6: Buffer + Final Submission
```

---

## ✅ Phase 0 — Environment & Project Skeleton

**Duration:** Day 1 (2–3 hours)  
**Goal:** Get a working project structure with all dependencies and secrets wired up before writing a single scraper or prompt.

### 0.1 Repository Initialization

```bash
mkdir discovery-engine && cd discovery-engine
git init
pnpm create next-app@14 app --typescript --tailwind --app   # Stage 4 frontend
python -m venv venv && source venv/bin/activate             # Python pipeline
pip install google-play-scraper app-store-scraper praw \
  youtube-comment-downloader beautifulsoup4 requests \
  anthropic openai chromadb pandas python-dotenv tqdm
```

### 0.2 Folder Skeleton

Create the exact structure from `architecture.md §12`:

```
discovery-engine/
├── scrapers/               ← Stage 0 modules
├── pipeline/               ← Stages 1–3
│   ├── prompts/            ← All LLM prompts as .txt files
│   └── utils/              ← llm_client, embeddings, scoring
├── data/
│   ├── raw/                ← Stage 0 JSONL output
│   ├── filtered/           ← Stage 1 output
│   ├── extracted/          ← Stage 2 output
│   ├── themes/             ← Stage 3 output
│   └── eval/               ← Golden set + corrections
├── app/                    ← Next.js App Router (Stage 4)
│   └── api/
└── docs/
    └── evidence_log.md
```

### 0.3 Unified LLM Client (`pipeline/utils/llm_client.py`)

Build a single wrapper that:
- Defaults to **Claude 3.5 Haiku** (bulk extraction, ~\$8–15 for 4,000 items)
- Falls back to **Claude 3.5 Sonnet** when `analysis_confidence < 0.70`
- Handles **rate limiting** at 5 req/s with exponential backoff
- **Retries 3×** then writes failures to `data/failed_extractions.json`

### 0.4 Environment Setup

```bash
# .env (never commit)
ANTHROPIC_API_KEY=...
OPENAI_API_KEY=...       # for text-embedding-3-small
REDDIT_CLIENT_ID=...
REDDIT_SECRET=...
YOUTUBE_API_KEY=...
```

### 0.5 Phase 0 Exit Criteria

- [ ] `python pipeline/utils/llm_client.py` returns a valid JSON response from Claude
- [ ] Folder structure matches §12 of architecture.md
- [ ] `.env.example` committed, `.env` in `.gitignore`

---

## ✅ Phase 1 — Data Ingestion (Stage 0)

**Duration:** Days 1–2 (8–10 hours)  
**Goal:** Collect 5,000–8,000 raw user signals from ≥5 distinct sources, normalized to the unified schema.

### Unified Output Schema (all sources must produce this)

```json
{
  "id": "play_indmoney_00042",
  "source": "google_play",
  "platform_app": "INDmoney",
  "text": "Started SIP 6 months ago...",
  "rating": 2,
  "date": "2025-03-14",
  "engagement_score": 47,
  "url": "https://...",
  "raw_metadata": {}
}
```

### 1.1 Scraper Build Order (prioritized by volume + reliability)

#### Source 1 — Google Play Store (`scrapers/play_store_scraper.py`)
- **Library:** `google-play-scraper`
- **Targets:** `com.indwealth` (INDmoney), `com.nextbillion.groww` (Groww), `com.zerodha.coin` (Zerodha)
- **Volume target:** 3,000–5,000 reviews per app (use `count=5000`, sort by `NEWEST`)
- **Key fields:** `userName`, `score` (1–5), `content`, `at` (date), `thumbsUpCount`
- **Output:** `data/raw/play_store_indmoney.jsonl`, `play_store_groww.jsonl`, `play_store_zerodha.jsonl`

> [!TIP] Prioritize reviews with `score ≤ 3` and `thumbsUpCount ≥ 5` — these are the highest-signal drop-off indicators.

#### Source 2 — Apple App Store (`scrapers/app_store_scraper.py`)
- **Library:** `app-store-scraper`
- **Target:** INDmoney app ID `1459526006`
- **Volume target:** 800–1,000 reviews
- **Output:** `data/raw/app_store_indmoney.jsonl`

#### Source 3 — Reddit (`scrapers/reddit_scraper.py`)
- **Library:** `praw` (use official Reddit API — no snscrape; TOS-safe)
- **Subreddits:** `r/IndiaInvestments`, `r/mutualfunds`, `r/INDmoney`
- **Search keyword matrix** (from architecture.md §3.3):

| Category | Keywords |
|----------|----------|
| Drop-off | `"stopped SIP"`, `"paused SIP"`, `"cancelled SIP"`, `"SIP loss"`, `"SIP not working"` |
| Lifecycle | `"started SIP"`, `"first SIP"`, `"SIP 6 months"`, `"SIP 1 year"`, `"SIP journey"` |
| Emotional | `"SIP confused"`, `"SIP scared"`, `"SIP regret"`, `"should I stop SIP"` |
| Platform | `"INDmoney SIP"`, `"INDmoney mutual fund"`, `"Groww SIP"`, `"Zerodha Coin SIP"` |
| Info-seek | `"SIP vs FD"`, `"SIP how long"`, `"SIP beginner"`, `"SIP advice"` |

- **Volume target:** 200–300 posts + top 10 comments per post
- **Output:** `data/raw/reddit_posts.jsonl`

#### Source 4 — YouTube (`scrapers/youtube_scraper.py`)
- **Library:** `youtube-comment-downloader` or YouTube Data API v3
- **Target channels:** Akshat Shrivastava, Ankur Warikoo, CA Rachana Ranade, Pranjal Kamra
- **Select:** Top 10–15 SIP explainer videos (highest view count)
- **Volume target:** 500–1,000 comments
- **Output:** `data/raw/youtube_comments.jsonl`

#### Source 5 — TradingQ&A (`scrapers/tradingqa_scraper.py`)
- **Library:** `BeautifulSoup` + `requests`
- **Target:** Zerodha forum SIP-related threads
- **Volume target:** 100–150 threads (Q + top-voted answers)
- **Output:** `data/raw/tradingqa_threads.jsonl`

#### Source 6 — Twitter/X (Optional) (`scrapers/twitter_scraper.py`)
- **Method:** Manual export from `advanced.twitter.com` search OR `snscrape`
- **Keywords:** `"INDmoney SIP"`, `"stopped SIP"`, `"first SIP loss"`, `"SIP paused"`
- **Volume target:** 100–200 tweets
- **Output:** `data/raw/twitter_results.jsonl`

> [!NOTE] Twitter is optional. If Twitter API access is blocked, skip it and focus on getting more Reddit and YouTube data to hit volume targets.

### 1.2 Orchestrator (`scrapers/run_all_scrapers.py`)

This script:
1. Calls each scraper in sequence
2. Merges all output into `data/raw/raw_data.jsonl`
3. Prints a volume report: items per source + total

### 1.3 Volume Quality Gate

| Checkpoint | Target |
|------------|--------|
| Total items ingested | **5,000–8,000** |
| Distinct sources represented | **≥ 5** |
| INDmoney-specific items | **≥ 40% of total** |
| Date range | **2023–2026 preferred** |

### 1.4 Phase 1 Exit Criteria

- [ ] `data/raw/raw_data.jsonl` exists with ≥5,000 lines
- [ ] All items conform to unified schema (run schema validator)
- [ ] ≥5 distinct `source` values present
- [ ] `run_all_scrapers.py` runs without crashing

---

## ✅ Phase 2 — Cleaning & LLM Extraction (Stages 1 + 2)

**Duration:** Days 3–4 (10–12 hours)  
**Goal:** Produce `extracted_insights.jsonl` — every clean, relevant item with 7-dimensional LLM annotations.

### 2.1 Stage 1 — Filter Pipeline (`pipeline/stage1_filter.py`)

Run the raw corpus through this sequential pipeline:

```
raw_data.jsonl
  → Deduplication (fuzzy match on text similarity, threshold 0.85)
  → PII Sanitization (regex replacements: [EMAIL], [PHONE], [PAN], [ACCOUNT], [USER])
  → Language Check (English + Hinglish only; drop others)
  → Spam Filter (drop ≤5-word reviews, generic 5-star "good app" spam)
  → Relevance Classifier (LLM zero-shot, using prompt in prompts/relevance_filter.txt)
  → filtered_data.jsonl (2,500–4,000 items)
```

#### Relevance Classifier Prompt (verbatim, store in `pipeline/prompts/relevance_filter.txt`)

```
You are a classifier for an investment product research project.
Given a user review, forum post, or comment, determine if it is RELEVANT
to the experience of investing in SIPs or mutual funds in India.

RELEVANT means the text discusses ANY of:
- Starting, continuing, pausing, stopping, or thinking about a SIP
- Mutual fund investment experience (returns, NAV, XIRR, portfolio)
- Emotions or confusion related to investing (fear, uncertainty, regret)
- App experience related to investment tracking, mandates, auto-debit
- Seeking information or advice about SIP/mutual fund investing
- Comparing investment options (SIP vs FD, SIP vs stocks, etc.)

NOT RELEVANT: generic bug reports, unrelated features (loans/credit cards),
spam, gibberish, non-English/non-Hindi, "good app" with no investment context.

Respond ONLY as JSON: {"relevant": true/false, "confidence": 0.0-1.0, "reason": "one-line"}
```

#### PII Sanitization Rules

| PII Type | Regex Pattern | Replacement |
|----------|--------------|-------------|
| Email | `[\w.-]+@[\w.-]+\.\w+` | `[EMAIL]` |
| Phone | `\+?[\d\s-]{10,}` | `[PHONE]` |
| PAN | `[A-Z]{5}\d{4}[A-Z]` | `[PAN]` |
| Account No. | `\d{9,18}` (contextual) | `[ACCOUNT]` |
| Full Names | NER pass | `[USER]` |

### 2.2 Stage 2 — LLM Extraction (`pipeline/stage2_extract.py`)

Each filtered item is sent through the master extraction prompt (stored in `pipeline/prompts/master_extraction.txt`) to extract **7 dimensions simultaneously**:

| Dimension | What It Extracts |
|-----------|-----------------|
| `discovery_questions` | Which of Q1–Q9 this item addresses |
| `emotion` | Primary emotion + intensity + trigger |
| `user_segment` | Experience level, age hint, income hint, influence source |
| `behavioral_action` | Action taken (paused / cancelled / reduced / continued…) + reason |
| `friction_point` | Product area causing trouble + specific issue + severity |
| `temporal_signal` | SIP tenure window + market context |
| `unmet_need` | What the user wishes existed (or null) |

Plus: `key_quote` (exact verbatim phrase ≤30 words) and `analysis_confidence` (0–1).

#### Batching Strategy

| Parameter | Value |
|-----------|-------|
| Batch size | 10 items per LLM call |
| Primary model | Claude 3.5 Haiku |
| Fallback model | Claude 3.5 Sonnet (for items where Haiku confidence < 0.70) |
| Estimated cost | ~\$8–15 for 4,000 items |
| Rate limit | 5 requests/second with exponential backoff |
| Error handling | Retry 3×, then log to `data/failed_extractions.json` |

> [!IMPORTANT] Run Stage 2 in batches overnight if needed. Save progress incrementally to `extracted_insights.jsonl` so a crash doesn't lose all work. Use `tqdm` for progress tracking.

### 2.3 Output Schema (`data/extracted/extracted_insights.jsonl`)

Each line: all fields from `filtered_data.jsonl` + all 7 Stage 2 extraction fields.

```json
{
  "id": "play_indmoney_00042",
  "source": "google_play",
  "text": "...",
  "rating": 2,
  "date": "2025-03-14",
  "relevance": { "relevant": true, "confidence": 0.92 },
  "discovery_questions": ["Q2", "Q3", "Q5"],
  "emotion": { "primary": "anxious", "intensity": "high", "trigger": "portfolio showing -4%" },
  "user_segment": { "experience_level": "first_timer", "age_hint": "early_career", "influence_source": "social_media" },
  "behavioral_action": { "action_taken": "considering_stopping", "action_reason": "negative returns" },
  "friction_point": { "product_area": "returns_display", "specific_issue": "only shows red number", "severity": "critical" },
  "temporal_signal": { "sip_tenure": "months_3_6", "market_context": "correction" },
  "unmet_need": "Want to know if -4% is normal for a 4-month SIP",
  "key_quote": "I don't know if -4% is bad or normal for a new SIP",
  "analysis_confidence": 0.88
}
```

### 2.4 Phase 2 Exit Criteria

- [ ] `data/filtered/filtered_data.jsonl` has 2,500–4,000 items
- [ ] `data/extracted/extracted_insights.jsonl` has extraction for all filtered items
- [ ] `analysis_confidence` median > 0.75
- [ ] All 9 discovery questions (Q1–Q9) are represented in the corpus
- [ ] `data/failed_extractions.json` reviewed and manually resolved if any

---

## ✅ Phase 3 — Clustering & Opportunity Scoring (Stage 3)

**Duration:** Day 5 (4–5 hours)  
**Goal:** Aggregate individual extractions into named themes, score each, and produce the ranked opportunity matrix.

### 3.1 Theme Aggregation (`pipeline/stage3_cluster.py`)

**Algorithm:**
1. **Group** extracted insights by primary `discovery_question`
2. **Sub-cluster** within each question group by `friction_point.product_area` + `emotion.trigger`
3. **Name themes** using the Theme Naming LLM prompt (stored in `pipeline/prompts/theme_naming.txt`)
4. **Quantify** each theme: count, avg severity, segment distribution, temporal distribution

### 3.2 Opportunity Scoring (`pipeline/utils/scoring.py`)

$$\text{Opportunity Score} = (0.30 \times \text{Frequency}) \times (0.30 \times \text{Severity}) \times (0.25 \times \text{Actionability}) \times (0.15 \times \text{Recency})$$

| Factor | Definition | Scale | Weight |
|--------|-----------|-------|--------|
| **Frequency** | % of corpus mentioning this theme | 0–1 normalized | 0.30 |
| **Severity** | Avg `friction_point.severity` (minor=1, moderate=2, critical=3) normalized | 0–1 | 0.30 |
| **Actionability** | Can INDmoney's product team address this? (LLM-judged) | 0–1 | 0.25 |
| **Recency** | Weighted toward last 12 months | 0–1 | 0.15 |

### 3.3 Segment Comparison

For each theme, compute breakdowns by:
- `experience_level` (first_timer, beginner, intermediate, experienced)
- `sip_tenure` (months_1_3, months_3_6, months_6_12, beyond_12)
- `influence_source` (social_media, peer, self_research, financial_advisor)

### 3.4 Expected Themes (to be validated by engine output)

| ID | Theme Name | Discovery Questions | Key Signal |
|----|-----------|--------------------|----|
| T1 | **Red Portfolio Panic** | Q2, Q3, Q7 | First-timers see negative returns, panic-pause without context |
| T2 | **Expectation vs. Reality Gap** | Q1, Q3, Q9 | Expect growth in 3–6 months; SIP compounding takes years |
| T3 | **Information Desert** | Q4, Q5, Q6, Q9 | App shows raw XIRR numbers with no interpretation |
| T4 | **Mandate & Payment Friction** | Q3, Q5 | Auto-debit failures, bank bounces, missed SIP dates |
| T5 | **External Validation Seeking** | Q6, Q8 | Users leave app to check YouTube/Reddit when unsure |
| T6 | **Over-Monitoring Anxiety** | Q2, Q4 | Checking daily; each micro-dip amplifies anxiety |
| T7 | **Peer Influence Dependency** | Q1, Q8 | Started because influencer said to; no independent conviction |
| T8 | **Cross-Selling Fatigue** | Q5, Q9 | Aggressive credit card/US stock prompts erode SIP trust |
| T9 | **Support Resolution Gap** | Q5 | SIP issues take days to resolve; bot-first support frustrates |

### 3.5 Output Files

- `data/themes/themes.json` — Array of theme objects with all scores and metadata
- `data/themes/opportunity_matrix.json` — Themes ranked by Opportunity Score, ready for UI consumption

### 3.6 Phase 3 Exit Criteria

- [ ] ≥8 distinct named themes identified
- [ ] Every theme has an Opportunity Score (0–1) with score breakdown
- [ ] Segment comparison computed for each theme
- [ ] `opportunity_matrix.json` sorted highest-to-lowest score
- [ ] Themes validated against expected T1–T9 list (or new themes documented)

---

## ✅ Phase 4 — Interactive UI (Stage 4)

**Duration:** Days 5–6 (10–12 hours)  
**Goal:** Build all 7 UI pages with live data, RAG query interface, and segment filtering.

### 4.1 Tech Stack & INDmoney Design System

The frontend is styled strictly according to **INDmoney’s signature Fintech SuperApp design language** (see full specification in [`docs/design_system.md`](file:///c:/Users/naksh/Downloads/Telegram%20Desktop/Nakshatra_unified_project/Graduation%20Project%20Nextleap/docs/design_system.md)):
- **Palette:** Dark Mode Obsidian Canvas (`#080B11`), Surface Cards (`#0F1622`), and signature **INDmoney Mint Green** (`#00D09C`).
- **Typography:** Inter / Plus Jakarta Sans with tabular numerals (`tnum`) for all scores, counts, and financial returns.
- **Visuals:** 1px subtle glassmorphic borders (`border-white/[0.08]`), rounded-2xl cards, and mint glow highlights (`shadow-indGlow`).

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 14 (App Router) |
| **Styling** | Tailwind CSS (INDmoney design tokens) + Lucide Icons |
| **Charts** | Recharts (custom themed to INDmoney Mint, Cyan, and Crimson) |
| **Vector Store** | ChromaDB (in-process, `data/` persistence) |
| **Backend** | Next.js API Routes (serverless, no separate server) |
| **Embeddings** | OpenAI `text-embedding-3-small` |
| **Deployment** | Vercel (free tier, one-click from GitHub) |

> [!TIP] If you're time-constrained, build with **Streamlit** instead (1–2 days vs. 2–3 for Next.js). Streamlit Community Cloud is free and deploys from GitHub. The UI won't be as polished but the data and analysis will be identical.

### 4.2 Page-by-Page Spec

#### Page 1 — Home / Overview Dashboard (`app/page.tsx`)
- **Stats bar:** Total items analyzed | Sources covered | Themes found | Date range
- **Top 5 themes** as cards: Opportunity Score + frequency + representative quote
- **Source distribution** pie chart
- **Emotion heatmap** across all data points

#### Page 2 — Theme Explorer (`app/themes/page.tsx`)
- Sortable table: Theme Name, Opportunity Score, Frequency, Severity, Top Segment
- Filter by discovery question (Q1–Q9 toggle buttons)
- Row click → navigates to Theme Drill-Down

#### Page 3 — Theme Drill-Down (`app/themes/[id]/page.tsx`)
- **Summary card:** Description + score breakdown (freq / severity / actionability / recency bars)
- **Evidence panel:** 10–20 raw user quotes, each tagged with Source badge, Date, Emotion, Segment, and a clickable link to original
- **Segment breakdown:** Bar chart (theme prevalence by experience level)
- **Temporal breakdown:** Line chart (when theme peaks in SIP lifecycle)
- **Emotion breakdown:** Donut chart (emotions within this theme)

#### Page 4 — Ask the Engine (`app/ask/page.tsx`)
- Text input: "Ask a question about SIP investor behavior"
- Pre-loaded example queries:
  - "Why do first-time investors pause SIPs in months 3–6?"
  - "What do users check when their portfolio is red?"
  - "How do social-media-influenced investors differ from self-researchers?"
  - "What unmet needs do first-time SIP investors express?"
- RAG pipeline returns cited answer with `[Source N]` inline citations (clickable to original quote)

#### Page 5 — Segment View (`app/segments/page.tsx`)
- Dropdown filters: Experience Level, Age Hint, Influence Source, SIP Tenure
- On filter apply → themes re-scored and re-ranked for that segment
- Side-by-side comparison mode: "First-timers vs. Experienced"

#### Page 6 — How It Works (`app/how-it-works/page.tsx`)
- Architecture diagram (mermaid flowchart from architecture.md §2)
- Step-by-step Stage 0→4 explanation
- Data funnel visualization: raw → filtered → extracted → themes (volumes at each step)
- Tooling list (models used, libraries used)

#### Page 7 — Evidence Log (`app/evidence/page.tsx`)
- Golden set of 20 items: human label vs. engine label side-by-side
- Agreement metrics table (per-dimension accuracy vs. targets)
- 2–3 documented corrections with explanation

### 4.3 RAG Pipeline (`app/api/query/route.ts`)

```
User Query
  → Embed query (text-embedding-3-small)
  → Vector search ChromaDB (top 15 similar extracted insights)
  → Build context from retrieved items (quotes + metadata)
  → LLM Synthesis (Claude Sonnet) with RAG Synthesis prompt
  → Format answer with inline [Source N] citations
  → Stream response to UI
```

**Pre-build step:** Embed all `extracted_insights.jsonl` entries and load into ChromaDB before deploying. Store in `data/chroma_db/` directory.

### 4.4 API Routes

| Route | Purpose |
|-------|---------|
| `POST /api/query` | RAG query endpoint |
| `GET /api/themes` | Return all themes (with optional filter params) |
| `GET /api/themes/[id]` | Return single theme + supporting data points |
| `GET /api/segments` | Return themes filtered/re-ranked by segment params |

### 4.5 Key Components to Build

| Component | Used On |
|-----------|---------|
| `ThemeCard.tsx` | Home, Theme Explorer |
| `QuoteCard.tsx` | Theme Drill-Down, Ask the Engine answers |
| `OpportunityMatrix.tsx` | Theme Explorer |
| `SegmentChart.tsx` | Segment View, Theme Drill-Down |
| `EmotionHeatmap.tsx` | Home |
| `SourceBadge.tsx` | All evidence panels |

### 4.6 Phase 4 Exit Criteria

- [ ] All 7 pages render without errors
- [ ] Theme data loads from real `themes.json` (not mocked)
- [ ] RAG query returns cited answers with ≥3 source quotes
- [ ] Segment filter changes theme rankings
- [ ] Source links in QuoteCard open original source URL
- [ ] Mobile-responsive layout (test on 375px viewport)

---

## ✅ Phase 5 — Eval Layer, Deployment & Polish

**Duration:** Days 7–8 (6–8 hours)  
**Goal:** Construct the golden set, document AI corrections, deploy to production, and finalize the Evidence Log.

### 5.1 Golden Set Construction (`data/eval/`)

1. **Random sample 20 items** from `filtered_data.jsonl` — stratified across sources and rating levels (e.g., 7 Play Store, 4 Reddit, 4 YouTube, 3 TradingQ&A, 2 App Store)
2. **Hand-label** all 20 using the exact same schema as Stage 2 → save to `golden_set_human.json`
3. **Run the 20 items** through the Stage 2 extraction pipeline → save to `golden_set_engine.json`
4. **Compute accuracy** field-by-field → save to `eval_results.json`

### 5.2 Evaluation Targets

| Dimension | Metric | Target |
|-----------|--------|--------|
| Discovery Question Mapping | Jaccard Similarity (set overlap of assigned Qs) | **≥ 0.75** |
| Emotion Classification | Exact match on `emotion.primary` | **≥ 80%** |
| User Segment — Experience Level | Exact match | **≥ 75%** |
| Behavioral Action | Exact match on `action_taken` | **≥ 80%** |
| Friction Point — Product Area | Exact match | **≥ 70%** |
| Temporal Signal — SIP Tenure | Exact match | **≥ 70%** |
| Overall (all dimensions correct) | Strict all-fields match | **≥ 60%** |

> [!IMPORTANT] If any dimension falls below target, document it in the Evidence Log as a finding — don't hide it. The Problem Statement explicitly values human oversight and AI correction.

### 5.3 Documenting 2–3 AI Corrections (`data/eval/corrections.md`)

For each correction, document:
- **Data Point ID** (e.g., `play_indmoney_01234`)
- **Raw Text** (verbatim)
- **AI Engine Output** (field-by-field, ✅ correct / ❌ wrong)
- **Why the AI Got It Wrong** (root cause analysis)
- **Corrected Label** (your human label)
- **Implication** (what this reveals about engine's systematic biases, e.g., "~15% of 'considering stopping' signals may actually be payment-related, not returns-related")

### 5.4 Deployment

```bash
# 1. Pre-embed all extracted_insights.jsonl into ChromaDB
python pipeline/utils/embeddings.py --input data/extracted/extracted_insights.jsonl --output data/chroma_db/

# 2. Set Vercel environment variables
vercel env add ANTHROPIC_API_KEY
vercel env add OPENAI_API_KEY

# 3. Deploy
vercel --prod
```

> [!CAUTION] Never expose API keys in client-side code. All LLM and embedding calls must go through `/api` routes, not directly from the browser.

### 5.5 Deployment Checklist

- [ ] Public URL accessible without login
- [ ] HTTPS enabled (automatic on Vercel)
- [ ] No API keys in client-side bundle (check browser dev tools → Network tab)
- [ ] Environment variables configured in Vercel dashboard
- [ ] Error handling for LLM API rate limits (show graceful message to user)
- [ ] Loading states on all async operations
- [ ] Mobile-responsive layout confirmed (375px + 768px + 1440px)
- [ ] All source quote links open the correct original URL

### 5.6 Evidence Log (`docs/evidence_log.md`)

Finalize this public document (share with "anyone with link" access):
- Sources analyzed (table of source + item count)
- Data funnel (raw → filtered → extracted volumes)
- Golden set (20 items with human vs. engine labels)
- Accuracy metrics table
- 2–3 documented corrections (full format from §5.3)

### 5.7 Phase 5 Exit Criteria

- [ ] `data/eval/eval_results.json` shows overall accuracy ≥ 60%
- [ ] ≥2 corrections documented with root cause analysis
- [ ] App deployed to Vercel — public URL works
- [ ] Evidence Log publicly accessible (link tested in incognito)
- [ ] No console errors on any page

---

## ✅ Phase 6 — Buffer & Final Submission

**Duration:** Day 9  
**Goal:** Final QA, deck slide prep, and submission packaging.

### 6.1 Final QA Checklist

- [ ] Test all 7 UI pages end-to-end
- [ ] Test 3–4 RAG queries — verify cited answers load correctly
- [ ] Test segment filter with different cohort combinations
- [ ] Verify all 9 discovery questions (Q1–Q9) are addressable via the engine
- [ ] Check mobile layout on actual phone (not just dev tools)
- [ ] Verify Evidence Log URL is accessible without Google login

### 6.2 Deck Slide — "How the AI Discovery Engine Works"

One slide (within the 10-slide deck limit) covering:
- Architecture diagram (the 4-stage pipeline, simplified)
- Data volume: X sources, Y items collected, Z themes discovered
- Key insight surfaced: the #1 opportunity theme with its Opportunity Score
- Link to live discovery engine URL

### 6.3 Deliverables Checklist (from Problem Statement)

| Deliverable | Status |
|-------------|--------|
| `[Link]` AI Discovery Engine — live, testable URL | |
| `[PDF]` 10-slide deck (≤40MB, named `NL_INDmoney`) | |
| `[Link]` Deployed AI-Native MVP (Part 5) | |
| `[Link]` AI Evidence Log (public, view access for anyone) | |

### 6.4 Submission Requirements

- [ ] No name anywhere in the slide deck
- [ ] Slide title = key message (not just "Discovery" — write "73% of first-time SIP drop-offs occur in months 3–6")
- [ ] Minimum font size: 14pt (Google Slides/PPT)
- [ ] Colorblind-safe palette (avoid red-green combinations without texture/pattern)
- [ ] All links in deck verified accessible (test in incognito)
- [ ] File size < 40 MB

---

## 🔗 Key File References

| File | Phase | Purpose |
|------|-------|---------|
| [`scrapers/run_all_scrapers.py`](file:///c:/Users/naksh/Downloads/Telegram%20Desktop/Nakshatra_unified_project/Graduation%20Project%20Nextleap/scrapers/run_all_scrapers.py) | 1 | Orchestrates all 6 scrapers |
| [`pipeline/stage1_filter.py`](file:///c:/Users/naksh/Downloads/Telegram%20Desktop/Nakshatra_unified_project/Graduation%20Project%20Nextleap/pipeline/stage1_filter.py) | 2 | Dedup + PII + relevance filter |
| [`pipeline/stage2_extract.py`](file:///c:/Users/naksh/Downloads/Telegram%20Desktop/Nakshatra_unified_project/Graduation%20Project%20Nextleap/pipeline/stage2_extract.py) | 2 | LLM 7-dimension extraction |
| [`pipeline/stage3_cluster.py`](file:///c:/Users/naksh/Downloads/Telegram%20Desktop/Nakshatra_unified_project/Graduation%20Project%20Nextleap/pipeline/stage3_cluster.py) | 3 | Theme clustering + opportunity scoring |
| [`pipeline/utils/llm_client.py`](file:///c:/Users/naksh/Downloads/Telegram%20Desktop/Nakshatra_unified_project/Graduation%20Project%20Nextleap/pipeline/utils/llm_client.py) | 0 | Unified Claude/GPT wrapper |
| [`pipeline/utils/scoring.py`](file:///c:/Users/naksh/Downloads/Telegram%20Desktop/Nakshatra_unified_project/Graduation%20Project%20Nextleap/pipeline/utils/scoring.py) | 3 | Opportunity score calculator |
| [`pipeline/utils/embeddings.py`](file:///c:/Users/naksh/Downloads/Telegram%20Desktop/Nakshatra_unified_project/Graduation%20Project%20Nextleap/pipeline/utils/embeddings.py) | 5 | Pre-embed corpus into ChromaDB |
| [`data/eval/corrections.md`](file:///c:/Users/naksh/Downloads/Telegram%20Desktop/Nakshatra_unified_project/Graduation%20Project%20Nextleap/data/eval/corrections.md) | 5 | Documented AI corrections |
| [`docs/evidence_log.md`](file:///c:/Users/naksh/Downloads/Telegram%20Desktop/Nakshatra_unified_project/Graduation%20Project%20Nextleap/docs/evidence_log.md) | 5 | Public evidence log for submission |
| [`docs/design_system.md`](file:///c:/Users/naksh/Downloads/Telegram%20Desktop/Nakshatra_unified_project/Graduation%20Project%20Nextleap/docs/design_system.md) | 4 | INDmoney UI Design System & Component Spec |
| [`architecture.md`](file:///c:/Users/naksh/Downloads/Telegram%20Desktop/Nakshatra_unified_project/Graduation%20Project%20Nextleap/architecture.md) | — | Full system architecture reference |

---

## ⚠️ Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Twitter API blocked | High | Low | Skip — hit volume via more Reddit/YouTube |
| LLM API rate limit during bulk extraction | Medium | High | 5 req/s cap + exponential backoff + overnight run |
| ChromaDB memory issues with >10K items | Low | Medium | Use Pinecone free tier as fallback |
| Next.js build time runs long | Medium | Medium | Switch to Streamlit if Day 6 is not enough |
| Accuracy below target on golden set | Medium | Medium | Refine extraction prompt; document failures honestly |
| API keys exposed on frontend | Low | Critical | All LLM calls via `/api` routes; env vars on Vercel |

---

*Generated from `architecture.md` and `ProblemStatement.txt` — AI Discovery Engine, INDmoney SIP Retention Project*
