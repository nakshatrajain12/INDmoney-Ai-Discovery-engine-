"""
Opportunity Score Calculator for AI Discovery Engine.
Implements the formula defined in architecture.md §6.2:
Opportunity Score = (W_f * Frequency) * (W_s * Severity) * (W_a * Actionability) * (W_r * Recency)
or additive composite normalized score.
"""

from typing import Dict, List, Optional
from datetime import datetime, timezone

# Factor Weights from architecture.md §6.2
WEIGHT_FREQUENCY = 0.30
WEIGHT_SEVERITY = 0.30
WEIGHT_ACTIONABILITY = 0.25
WEIGHT_RECENCY = 0.15

SEVERITY_MAP = {
    "minor": 1.0 / 3.0,
    "moderate": 2.0 / 3.0,
    "critical": 1.0
}

def calculate_opportunity_score(
    frequency: float,
    severity: float,
    actionability: float,
    recency: float,
    mode: str = "multiplicative"
) -> float:
    """
    Calculates opportunity score for a given theme.
    All inputs should be normalized between 0.0 and 1.0.
    
    If mode == 'multiplicative':
      Score = (W_f * Frequency) * (W_s * Severity) * (W_a * Actionability) * (W_r * Recency)
      Scaled to 0-100 for readability.
    If mode == 'weighted_sum':
      Score = (W_f * Frequency + W_s * Severity + W_a * Actionability + W_r * Recency) * 100
    """
    freq = max(0.0, min(1.0, frequency))
    sev = max(0.0, min(1.0, severity))
    act = max(0.0, min(1.0, actionability))
    rec = max(0.0, min(1.0, recency))

    if mode == "multiplicative":
        # Multiplicative composite from §6.2
        term_f = WEIGHT_FREQUENCY * freq
        term_s = WEIGHT_SEVERITY * sev
        term_a = WEIGHT_ACTIONABILITY * act
        term_r = WEIGHT_RECENCY * rec
        # Normalize product against maximum possible product: (0.3*0.3*0.25*0.15) = 0.003375
        max_prod = WEIGHT_FREQUENCY * WEIGHT_SEVERITY * WEIGHT_ACTIONABILITY * WEIGHT_RECENCY
        if max_prod == 0:
            return 0.0
        score = (term_f * term_s * term_a * term_r) / max_prod * 100.0
        return round(score, 2)
    else:
        # Weighted sum composite
        weighted = (
            (WEIGHT_FREQUENCY * freq) +
            (WEIGHT_SEVERITY * sev) +
            (WEIGHT_ACTIONABILITY * act) +
            (WEIGHT_RECENCY * rec)
        )
        return round(weighted * 100.0, 2)

def score_theme(
    theme_name: str,
    items: List[Dict],
    total_corpus_size: int,
    actionability_score: float = 0.8
) -> Dict:
    """
    Given a list of extracted data points belonging to a theme,
    calculates frequency, average severity, recency, and composite opportunity score.
    """
    if not items or total_corpus_size <= 0:
        return {
            "theme_name": theme_name,
            "opportunity_score": 0.0,
            "frequency_count": 0,
            "frequency_norm": 0.0,
            "avg_severity": 0.0,
            "actionability": actionability_score,
            "recency": 0.0
        }

    count = len(items)
    freq_norm = min(1.0, count / max(1, total_corpus_size))

    # Average severity
    sev_values = []
    for it in items:
        f_point = it.get("friction_point") or {}
        sev = f_point.get("severity", "minor") if isinstance(f_point, dict) else "minor"
        sev_values.append(SEVERITY_MAP.get(str(sev).lower(), 1.0 / 3.0))
    avg_sev = sum(sev_values) / len(sev_values) if sev_values else 0.33

    # Recency (higher weight if within last 12 months)
    recency_scores = []
    now = datetime.now(timezone.utc)
    for it in items:
        date_str = it.get("date")
        if date_str:
            try:
                dt = datetime.fromisoformat(str(date_str).replace("Z", "+00:00"))
                days_diff = (now - dt).days
                if days_diff <= 365:
                    recency_scores.append(1.0)
                elif days_diff <= 730:
                    recency_scores.append(0.6)
                else:
                    recency_scores.append(0.3)
            except Exception:
                recency_scores.append(0.5)
        else:
            recency_scores.append(0.5)

    avg_rec = sum(recency_scores) / len(recency_scores) if recency_scores else 0.5
    opp_score = calculate_opportunity_score(freq_norm, avg_sev, actionability_score, avg_rec)

    return {
        "theme_name": theme_name,
        "opportunity_score": opp_score,
        "frequency_count": count,
        "frequency_norm": round(freq_norm, 4),
        "avg_severity": round(avg_sev, 4),
        "actionability": round(actionability_score, 4),
        "recency": round(avg_rec, 4)
    }

if __name__ == "__main__":
    print("[*] Testing Opportunity Score Calculator...")
    sample_score = calculate_opportunity_score(0.15, 0.8, 0.9, 0.7)
    print(f"Sample Opportunity Score: {sample_score} / 100")
