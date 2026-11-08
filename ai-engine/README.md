# 🚀 AI Discovery Engine — INDmoney SIP Retention

An end-to-end AI-powered discovery engine built to uncover why users drop off from Systematic Investment Plans (SIPs) in India (specifically on **INDmoney**, compared with **Groww** and **Zerodha**), quantify emotional friction, and prioritize high-impact product retention interventions.

---

## 🏗️ System Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   STAGE 0    │ ──> │   STAGE 1    │ ──> │   STAGE 2    │ ──> │   STAGE 3    │
│  Data Ingest │     │ Dedupe & PII │     │ 7D LLM Extr. │     │ Clust & Score│
│ (6,000+ rows)│     │  Scrubbing   │     │ (Claude/Groq)│     │ (Opp. Matrix)│
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                                                                       │
                                                                       ▼
                                   ┌──────────────┐            ┌──────────────┐
                                   │  EVAL LAYER  │ <────────> │   STAGE 4    │
                                   │  Golden Set  │            │Next.js 14 UI │
                                   │ + Corrections│            │(RAG Citations│
                                   └──────────────┘            └──────────────┘
```

---

## 📁 Repository Structure

```
├── .env.example                       # Template for API keys
├── .gitignore                         # Protects secrets and large artifacts
├── README.md                          # Project documentation
├── architecture.md                    # Core system architecture & specification
├── implementation_plan.md             # 9-day phase-by-phase implementation plan
├── package.json                       # Next.js 14 frontend dependencies
├── requirements.txt                   # Python pipeline dependencies
│
├── scrapers/                          # Stage 0: Multi-source ingestion
│   ├── play_store_scraper.py          # Google Play reviews (INDmoney, Groww, Zerodha)
│   ├── app_store_scraper.py           # Apple App Store reviews
│   ├── reddit_scraper.py              # Reddit discussion threads (r/mutualfunds, etc.)
│   ├── youtube_scraper.py             # Top SIP explainer comments
│   ├── twitter_scraper.py             # Twitter / X investor discussions
│   ├── tradingqa_scraper.py           # TradingQ&A forum posts
│   └── run_all_scrapers.py            # Orchestrator & volume reporter
│
├── pipeline/                          # Stages 1-3: Intelligence pipeline
│   ├── stage1_filter.py               # Fuzzy deduplication & PII masking
│   ├── stage2_extract.py              # 7-dimensional LLM annotation engine
│   ├── stage3_cluster.py              # Theme clustering & opportunity ranking
│   ├── prompts/                       # Externalized system prompts
│   │   ├── relevance_filter.txt
│   │   ├── master_extraction.txt
│   │   ├── theme_naming.txt
│   │   └── rag_synthesis.txt
│   └── utils/
│       ├── llm_client.py              # Unified LLM client (Claude / Groq rotation / OpenAI)
│       ├── embeddings.py              # ChromaDB vector store manager
│       └── scoring.py                 # Multiplicative opportunity score calculator
│
├── data/                              # Data artifacts across pipeline stages
│   ├── raw/                           # Stage 0 raw JSONL files (6,200+ collected)
│   ├── filtered/                      # Stage 1 cleaned & sanitized data
│   ├── extracted/                     # Stage 2 7D structured insights
│   ├── themes/                        # Stage 3 themes and opportunity matrix
│   ├── eval/                          # Eval layer (Golden Set & AI corrections)
│   │   ├── golden_set_human.json
│   │   ├── golden_set_engine.json
│   │   ├── eval_results.json
│   │   └── corrections.md
│   └── failed_extractions.json        # Auto-logged LLM failures for review
│
├── app/                               # Stage 4: Next.js App Router UI
│   ├── page.tsx                       # Dashboard & overview
│   ├── themes/page.tsx                # Ranked theme explorer
│   ├── themes/[id]/page.tsx           # Verbatim evidence drill-down
│   ├── ask/page.tsx                   # RAG citation query interface
│   ├── segments/page.tsx              # Segment behavioral comparison
│   ├── how-it-works/page.tsx          # System explainer
│   ├── evidence/page.tsx              # Golden set transparency log
│   └── api/                           # API routes (/api/query, /api/themes, /api/segments)
│
└── docs/
    ├── design_system.md               # INDmoney UI design tokens & component spec
    └── evidence_log.md                # Submission evidence & evaluation report
```

---

## 🛠️ Quick Start & Setup

### 1. Environment & API Keys
Copy `.env.example` to `.env` and fill in your keys:
```bash
cp .env.example .env
```
Supported providers:
- **Groq** (`GROQ_API_KEY`, `GROQ_API_KEY_2`, `GROQ_API_KEY_3`) for ultra-fast inference and automatic key rotation
- **Anthropic** (`ANTHROPIC_API_KEY`) for Claude 3.5 Haiku & Sonnet
- **OpenAI** (`OPENAI_API_KEY`) for `text-embedding-3-small`

### 2. Python Environment
Install required dependencies:
```bash
pip install -r requirements.txt
```

Verify LLM connectivity:
```bash
python pipeline/utils/llm_client.py
```

### 3. Data Ingestion & Orchestration
Run the scraper orchestrator to merge and validate raw data:
```bash
python scrapers/run_all_scrapers.py
```

---

## 📊 Phase 0 Exit Criteria Status

- [x] `python pipeline/utils/llm_client.py` returns valid JSON
- [x] Folder structure exactly matches §12 of `architecture.md`
- [x] `.env.example` committed, `.env` in `.gitignore`
- [x] ChromaDB embedding and Opportunity Score utilities operational
- [x] Next.js 14 App Router skeleton configured

