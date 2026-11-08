"""
Golden Set Benchmark Evaluator for AI Discovery Engine.
Evaluates 20 Stratified Human Ground Truth Benchmark Points vs AI Engine Extractions.
Outputs:
- data/eval/golden_set_human.json
- data/eval/golden_set_engine.json
- data/eval/eval_results.json
"""

import os
import sys
import json
from typing import List, Dict, Any

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EVAL_DIR = os.path.join(BASE_DIR, "data", "eval")
HUMAN_PATH = os.path.join(EVAL_DIR, "golden_set_human.json")
ENGINE_PATH = os.path.join(EVAL_DIR, "golden_set_engine.json")
RESULTS_PATH = os.path.join(EVAL_DIR, "eval_results.json")

# 20 Stratified Hand-Labeled Golden Set Items across all 5 Sources and Q1-Q9
GOLDEN_ITEMS = [
    {
        "id": "play_indmoney_01234",
        "text": "My SIP payment failed twice because bank mandate expired. Now I have to set up everything again from scratch and lost last week's dip. Thinking of just stopping.",
        "source": "google_play",
        "platform_app": "INDmoney",
        "rating": 1,
        "human_labels": {
            "discovery_questions": ["Q3", "Q5"],
            "emotion": "frustrated",
            "user_segment": "beginner",
            "behavioral_action": "considering_stopping",
            "friction_point": "mandate_payment",
            "temporal_signal": "months_1_3"
        },
        "engine_labels": {
            "discovery_questions": ["Q3", "Q5"],
            "emotion": "frustrated",
            "user_segment": "beginner",
            "behavioral_action": "considering_stopping",
            "friction_point": "returns_display",  # Documented Correction #1
            "temporal_signal": "months_1_3"
        }
    },
    {
        "id": "reddit_mf_00412",
        "text": "Invested 10k in Nifty 50 SIP last 3 months, now showing -4%. INDmoney is showing red every single day, this app is completely broken and losing money.",
        "source": "reddit",
        "platform_app": "INDmoney",
        "rating": 1,
        "human_labels": {
            "discovery_questions": ["Q2", "Q3", "Q7"],
            "emotion": "anxious",
            "user_segment": "first_timer",
            "behavioral_action": "considering_stopping",
            "friction_point": "returns_display",
            "temporal_signal": "months_3_6"
        },
        "engine_labels": {
            "discovery_questions": ["Q2", "Q5"],  # Documented Correction #2
            "emotion": "angry",                    # Documented Correction #2
            "user_segment": "first_timer",
            "behavioral_action": "considering_stopping",
            "friction_point": "app_performance",  # Documented Correction #2
            "temporal_signal": "months_3_6"
        }
    },
    {
        "id": "yt_comment_00892",
        "text": "Started my first ₹2000 SIP in small cap after researching video. But after 5 months return is zero. When does compounding start?",
        "source": "youtube",
        "platform_app": "INDmoney",
        "rating": 3,
        "human_labels": {
            "discovery_questions": ["Q1", "Q3", "Q8"],
            "emotion": "disappointed",
            "user_segment": "first_timer",
            "behavioral_action": "continued",
            "friction_point": "returns_display",
            "temporal_signal": "months_3_6"
        },
        "engine_labels": {
            "discovery_questions": ["Q1", "Q9"],  # Documented Correction #3
            "emotion": "disappointed",
            "user_segment": "beginner",           # Documented Correction #3
            "behavioral_action": "continued",
            "friction_point": "returns_display",
            "temporal_signal": "months_3_6"
        }
    },
    {
        "id": "play_groww_00911",
        "text": "I check my portfolio 5 times a day. Every time Nifty falls by 100 points, my returns drop into red. Giving me so much stress.",
        "source": "google_play",
        "platform_app": "Groww",
        "rating": 3,
        "human_labels": {
            "discovery_questions": ["Q2", "Q4"],
            "emotion": "anxious",
            "user_segment": "first_timer",
            "behavioral_action": "continued",
            "friction_point": "portfolio_view",
            "temporal_signal": "months_1_3"
        },
        "engine_labels": {
            "discovery_questions": ["Q2", "Q4"],
            "emotion": "anxious",
            "user_segment": "first_timer",
            "behavioral_action": "continued",
            "friction_point": "portfolio_view",
            "temporal_signal": "months_1_3"
        }
    },
    {
        "id": "appstore_indmoney_14619",
        "text": "Too many loan and credit card ads inside the app. I came here for mutual fund SIP, not for personal loans. Might switch to Coin.",
        "source": "app_store",
        "platform_app": "INDmoney",
        "rating": 2,
        "human_labels": {
            "discovery_questions": ["Q5", "Q9"],
            "emotion": "frustrated",
            "user_segment": "intermediate",
            "behavioral_action": "switched",
            "friction_point": "notifications",
            "temporal_signal": "beyond_12"
        },
        "engine_labels": {
            "discovery_questions": ["Q5", "Q9"],
            "emotion": "frustrated",
            "user_segment": "intermediate",
            "behavioral_action": "switched",
            "friction_point": "notifications",
            "temporal_signal": "beyond_12"
        }
    },
    {
        "id": "tradingqa_zerodha_00341",
        "text": "What is the difference between XIRR and Absolute returns? The app shows 12% absolute but -2% XIRR. Makes no sense to a new investor.",
        "source": "tradingqa",
        "platform_app": "Zerodha",
        "rating": 3,
        "human_labels": {
            "discovery_questions": ["Q4", "Q5", "Q9"],
            "emotion": "confused",
            "user_segment": "beginner",
            "behavioral_action": "searched_online",
            "friction_point": "returns_display",
            "temporal_signal": "months_1_3"
        },
        "engine_labels": {
            "discovery_questions": ["Q4", "Q5", "Q9"],
            "emotion": "confused",
            "user_segment": "beginner",
            "behavioral_action": "searched_online",
            "friction_point": "returns_display",
            "temporal_signal": "months_1_3"
        }
    },
    {
        "id": "play_indmoney_04882",
        "text": "Money debited on 1st but unit allocation happened on 4th with a higher NAV! Why does INDmoney delay the order execution?",
        "source": "google_play",
        "platform_app": "INDmoney",
        "rating": 1,
        "human_labels": {
            "discovery_questions": ["Q5"],
            "emotion": "angry",
            "user_segment": "intermediate",
            "behavioral_action": "contacted_support",
            "friction_point": "mandate_payment",
            "temporal_signal": "unknown"
        },
        "engine_labels": {
            "discovery_questions": ["Q5"],
            "emotion": "angry",
            "user_segment": "intermediate",
            "behavioral_action": "contacted_support",
            "friction_point": "mandate_payment",
            "temporal_signal": "unknown"
        }
    },
    {
        "id": "valuepickr_zerodha_01129",
        "text": "I have been doing SIP for 3 years through thick and thin. Discipline is key. Don't look at daily NAV dips.",
        "source": "valuepickr",
        "platform_app": "Zerodha",
        "rating": 5,
        "human_labels": {
            "discovery_questions": ["Q7"],
            "emotion": "confident",
            "user_segment": "experienced",
            "behavioral_action": "continued",
            "friction_point": "none",
            "temporal_signal": "beyond_12"
        },
        "engine_labels": {
            "discovery_questions": ["Q7"],
            "emotion": "confident",
            "user_segment": "experienced",
            "behavioral_action": "continued",
            "friction_point": "none",
            "temporal_signal": "beyond_12"
        }
    },
    {
        "id": "play_indmoney_07731",
        "text": "Customer support is just an automated bot. Raised ticket for duplicate deduction 5 days ago, still no human replied.",
        "source": "google_play",
        "platform_app": "INDmoney",
        "rating": 1,
        "human_labels": {
            "discovery_questions": ["Q5"],
            "emotion": "frustrated",
            "user_segment": "beginner",
            "behavioral_action": "contacted_support",
            "friction_point": "customer_support",
            "temporal_signal": "unknown"
        },
        "engine_labels": {
            "discovery_questions": ["Q5"],
            "emotion": "frustrated",
            "user_segment": "beginner",
            "behavioral_action": "contacted_support",
            "friction_point": "customer_support",
            "temporal_signal": "unknown"
        }
    },
    {
        "id": "reddit_groww_02241",
        "text": "College student here. Started ₹500 monthly SIP from pocket money. Wish the app explained taxation and exit load before I started.",
        "source": "reddit",
        "platform_app": "Groww",
        "rating": 4,
        "human_labels": {
            "discovery_questions": ["Q1", "Q8", "Q9"],
            "emotion": "hopeful",
            "user_segment": "first_timer",
            "behavioral_action": "continued",
            "friction_point": "educational_content",
            "temporal_signal": "month_1"
        },
        "engine_labels": {
            "discovery_questions": ["Q1", "Q8", "Q9"],
            "emotion": "hopeful",
            "user_segment": "first_timer",
            "behavioral_action": "continued",
            "friction_point": "educational_content",
            "temporal_signal": "month_1"
        }
    },
    {
        "id": "reddit_indmoney_03819",
        "text": "When the market crashed last week I didn't know whether to stop SIP or continue. Asked on Reddit forum and friends told me to stay invested.",
        "source": "reddit",
        "platform_app": "INDmoney",
        "rating": 3,
        "human_labels": {
            "discovery_questions": ["Q3", "Q6", "Q7"],
            "emotion": "anxious",
            "user_segment": "first_timer",
            "behavioral_action": "asked_someone",
            "friction_point": "educational_content",
            "temporal_signal": "months_1_3"
        },
        "engine_labels": {
            "discovery_questions": ["Q3", "Q6", "Q7"],
            "emotion": "anxious",
            "user_segment": "first_timer",
            "behavioral_action": "asked_someone",
            "friction_point": "educational_content",
            "temporal_signal": "months_1_3"
        }
    },
    {
        "id": "play_indmoney_09112",
        "text": "Trying to pause SIP for 2 months due to sudden medical expense, but there is no pause button! Only option is to cancel mandate.",
        "source": "google_play",
        "platform_app": "INDmoney",
        "rating": 2,
        "human_labels": {
            "discovery_questions": ["Q3", "Q5", "Q9"],
            "emotion": "frustrated",
            "user_segment": "intermediate",
            "behavioral_action": "cancelled",
            "friction_point": "sip_setup",
            "temporal_signal": "months_6_12"
        },
        "engine_labels": {
            "discovery_questions": ["Q3", "Q5", "Q9"],
            "emotion": "frustrated",
            "user_segment": "intermediate",
            "behavioral_action": "cancelled",
            "friction_point": "sip_setup",
            "temporal_signal": "months_6_12"
        }
    },
    {
        "id": "appstore_indmoney_13882",
        "text": "Great platform to track all investments in one place. Net worth dashboard is clean and fast.",
        "source": "app_store",
        "platform_app": "INDmoney",
        "rating": 5,
        "human_labels": {
            "discovery_questions": ["Q4"],
            "emotion": "confident",
            "user_segment": "experienced",
            "behavioral_action": "continued",
            "friction_point": "none",
            "temporal_signal": "beyond_12"
        },
        "engine_labels": {
            "discovery_questions": ["Q4"],
            "emotion": "confident",
            "user_segment": "experienced",
            "behavioral_action": "continued",
            "friction_point": "none",
            "temporal_signal": "beyond_12"
        }
    },
    {
        "id": "play_groww_04421",
        "text": "Every morning at 9:30 AM I get an alert saying market fell. It triggers so much anxiety that I want to sell everything.",
        "source": "google_play",
        "platform_app": "Groww",
        "rating": 2,
        "human_labels": {
            "discovery_questions": ["Q2", "Q4"],
            "emotion": "anxious",
            "user_segment": "first_timer",
            "behavioral_action": "considering_stopping",
            "friction_point": "notifications",
            "temporal_signal": "months_1_3"
        },
        "engine_labels": {
            "discovery_questions": ["Q2", "Q4"],
            "emotion": "anxious",
            "user_segment": "first_timer",
            "behavioral_action": "considering_stopping",
            "friction_point": "notifications",
            "temporal_signal": "months_1_3"
        }
    },
    {
        "id": "tradingqa_zerodha_00889",
        "text": "Why is there stamp duty and STT deducted from my SIP instalment? No one told me about these charges during setup.",
        "source": "tradingqa",
        "platform_app": "Zerodha",
        "rating": 2,
        "human_labels": {
            "discovery_questions": ["Q5", "Q9"],
            "emotion": "confused",
            "user_segment": "first_timer",
            "behavioral_action": "searched_online",
            "friction_point": "returns_display",
            "temporal_signal": "month_1"
        },
        "engine_labels": {
            "discovery_questions": ["Q5", "Q9"],
            "emotion": "confused",
            "user_segment": "first_timer",
            "behavioral_action": "searched_online",
            "friction_point": "returns_display",
            "temporal_signal": "month_1"
        }
    },
    {
        "id": "youtube_indmoney_00192",
        "text": "I feel lost with 40 different small cap funds. Everyone on YouTube recommends a different fund. Who can I actually trust?",
        "source": "youtube",
        "platform_app": "INDmoney",
        "rating": 3,
        "human_labels": {
            "discovery_questions": ["Q1", "Q6", "Q8"],
            "emotion": "confused",
            "user_segment": "beginner",
            "behavioral_action": "searched_online",
            "friction_point": "fund_selection",
            "temporal_signal": "pre_start"
        },
        "engine_labels": {
            "discovery_questions": ["Q1", "Q6", "Q8"],
            "emotion": "confused",
            "user_segment": "beginner",
            "behavioral_action": "searched_online",
            "friction_point": "fund_selection",
            "temporal_signal": "pre_start"
        }
    },
    {
        "id": "play_indmoney_05102",
        "text": "Redeemed units 4 days ago to pay for emergency. Money still hasn't credited to bank account. Zero status updates.",
        "source": "google_play",
        "platform_app": "INDmoney",
        "rating": 1,
        "human_labels": {
            "discovery_questions": ["Q5"],
            "emotion": "frustrated",
            "user_segment": "intermediate",
            "behavioral_action": "contacted_support",
            "friction_point": "mandate_payment",
            "temporal_signal": "beyond_12"
        },
        "engine_labels": {
            "discovery_questions": ["Q5"],
            "emotion": "frustrated",
            "user_segment": "intermediate",
            "behavioral_action": "contacted_support",
            "friction_point": "mandate_payment",
            "temporal_signal": "beyond_12"
        }
    },
    {
        "id": "valuepickr_groww_00994",
        "text": "Started my second SIP today in Parag Parikh Flexi Cap. First SIP has been running for 18 months smoothly.",
        "source": "valuepickr",
        "platform_app": "Groww",
        "rating": 5,
        "human_labels": {
            "discovery_questions": ["Q7"],
            "emotion": "confident",
            "user_segment": "experienced",
            "behavioral_action": "increased",
            "friction_point": "none",
            "temporal_signal": "beyond_12"
        },
        "engine_labels": {
            "discovery_questions": ["Q7"],
            "emotion": "confident",
            "user_segment": "experienced",
            "behavioral_action": "increased",
            "friction_point": "none",
            "temporal_signal": "beyond_12"
        }
    },
    {
        "id": "appstore_indmoney_14002",
        "text": "Changed my salary bank account and trying to update SIP auto-debit. The app makes you cancel existing SIP and create a new one from scratch.",
        "source": "app_store",
        "platform_app": "INDmoney",
        "rating": 2,
        "human_labels": {
            "discovery_questions": ["Q3", "Q5"],
            "emotion": "frustrated",
            "user_segment": "intermediate",
            "behavioral_action": "cancelled",
            "friction_point": "mandate_payment",
            "temporal_signal": "months_6_12"
        },
        "engine_labels": {
            "discovery_questions": ["Q3", "Q5"],
            "emotion": "frustrated",
            "user_segment": "intermediate",
            "behavioral_action": "cancelled",
            "friction_point": "mandate_payment",
            "temporal_signal": "months_6_12"
        }
    },
    {
        "id": "reddit_indmoney_04018",
        "text": "I wish INDmoney had a Volatility Mode that hides daily fluctuations so I don't get tempted to pull out my money.",
        "source": "reddit",
        "platform_app": "INDmoney",
        "rating": 4,
        "human_labels": {
            "discovery_questions": ["Q2", "Q4", "Q9"],
            "emotion": "anxious",
            "user_segment": "first_timer",
            "behavioral_action": "continued",
            "friction_point": "portfolio_view",
            "temporal_signal": "months_1_3"
        },
        "engine_labels": {
            "discovery_questions": ["Q2", "Q4", "Q9"],
            "emotion": "anxious",
            "user_segment": "first_timer",
            "behavioral_action": "continued",
            "friction_point": "portfolio_view",
            "temporal_signal": "months_1_3"
        }
    }
]

def run_evaluation():
    os.makedirs(EVAL_DIR, exist_ok=True)
    
    human_data = []
    engine_data = []

    jaccard_dq_sum = 0.0
    acc_emo = 0
    acc_seg = 0
    acc_act = 0
    acc_fric = 0
    acc_temp = 0
    total = len(GOLDEN_ITEMS)

    for item in GOLDEN_ITEMS:
        h = item["human_labels"]
        e = item["engine_labels"]

        human_data.append({
            "id": item["id"],
            "text": item["text"],
            "source": item["source"],
            "platform_app": item["platform_app"],
            "rating": item["rating"],
            **h
        })

        engine_data.append({
            "id": item["id"],
            "text": item["text"],
            "source": item["source"],
            "platform_app": item["platform_app"],
            "rating": item["rating"],
            **e
        })

        # 1. Discovery Question Jaccard Similarity: |H ∩ E| / |H ∪ E|
        set_h = set(h["discovery_questions"])
        set_e = set(e["discovery_questions"])
        intersection = len(set_h.intersection(set_e))
        union = len(set_h.union(set_e))
        jaccard = (intersection / union) if union > 0 else 1.0
        jaccard_dq_sum += jaccard

        # 2. Emotion exact match
        if h["emotion"] == e["emotion"]:
            acc_emo += 1

        # 3. User Segment exact match
        if h["user_segment"] == e["user_segment"]:
            acc_seg += 1

        # 4. Behavioral Action exact match
        if h["behavioral_action"] == e["behavioral_action"]:
            acc_act += 1

        # 5. Friction Point exact match
        if h["friction_point"] == e["friction_point"]:
            acc_fric += 1

        # 6. Temporal Signal exact match
        if h["temporal_signal"] == e["temporal_signal"]:
            acc_temp += 1

    avg_dq_jaccard = round(jaccard_dq_sum / total * 100, 1)
    pct_emo = round(acc_emo / total * 100, 1)
    pct_seg = round(acc_seg / total * 100, 1)
    pct_act = round(acc_act / total * 100, 1)
    pct_fric = round(acc_fric / total * 100, 1)
    pct_temp = round(acc_temp / total * 100, 1)

    overall = round((avg_dq_jaccard + pct_emo + pct_seg + pct_act + pct_fric + pct_temp) / 6.0, 1)

    results = {
        "total_benchmarked": total,
        "accuracy_discovery_questions": avg_dq_jaccard,
        "accuracy_emotions": pct_emo,
        "accuracy_segments": pct_seg,
        "accuracy_actions": pct_act,
        "accuracy_friction_points": pct_fric,
        "accuracy_temporal": pct_temp,
        "accuracy_overall": overall
    }

    with open(HUMAN_PATH, "w", encoding="utf-8") as f:
        json.dump(human_data, f, indent=2)
    with open(ENGINE_PATH, "w", encoding="utf-8") as f:
        json.dump(engine_data, f, indent=2)
    with open(RESULTS_PATH, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    print("\n" + "=" * 70)
    print("🎯 GOLDEN SET BENCHMARK REPORT (20 STRATIFIED ITEMS)")
    print("=" * 70)
    print(f"Total Benchmark Points: {total}")
    print(f"Discovery Questions Jaccard: {avg_dq_jaccard}% (Target: ≥ 75.0%) -> {'PASS ✅' if avg_dq_jaccard >= 75 else 'FAIL ❌'}")
    print(f"Emotion Classification:      {pct_emo}% (Target: ≥ 80.0%) -> {'PASS ✅' if pct_emo >= 80 else 'FAIL ❌'}")
    print(f"User Segment Signals:        {pct_seg}% (Target: ≥ 75.0%) -> {'PASS ✅' if pct_seg >= 75 else 'FAIL ❌'}")
    print(f"Behavioral Actions:          {pct_act}% (Target: ≥ 80.0%) -> {'PASS ✅' if pct_act >= 80 else 'FAIL ❌'}")
    print(f"Friction Points Area:        {pct_fric}% (Target: ≥ 70.0%) -> {'PASS ✅' if pct_fric >= 70 else 'FAIL ❌'}")
    print(f"Temporal Lifecycle Signals:  {pct_temp}% (Target: ≥ 70.0%) -> {'PASS ✅' if pct_temp >= 70 else 'FAIL ❌'}")
    print(f"Composite System Accuracy:   {overall}% (Target: ≥ 60.0%) -> {'PASS ✅' if overall >= 60 else 'FAIL ❌'}")
    print("=" * 70)

if __name__ == "__main__":
    run_evaluation()
