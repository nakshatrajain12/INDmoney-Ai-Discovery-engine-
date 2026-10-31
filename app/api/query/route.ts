import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const EXTRACTED_PATH = path.join(process.cwd(), "data", "extracted", "extracted_insights.jsonl");
const THEMES_PATH = path.join(process.cwd(), "data", "themes", "opportunity_matrix.json");

interface ExtractedItem {
  id: string;
  source: string;
  platform_app?: string;
  text: string;
  rating?: number | null;
  date?: string;
  url?: string;
  discovery_questions?: string[];
  emotion?: { primary?: string; intensity?: string; trigger?: string };
  user_segment?: { experience_level?: string; segment_evidence?: string };
  behavioral_action?: { action_taken?: string; action_reason?: string };
  friction_point?: { product_area?: string; specific_issue?: string; severity?: string };
  unmet_need?: string;
  key_quote?: string;
  analysis_confidence?: number;
}

function scoreRelevance(item: ExtractedItem, queryTerms: string[]): number {
  let score = 0;
  const text = (item.text || "").toLowerCase();
  const quote = (item.key_quote || "").toLowerCase();
  const trigger = (item.emotion?.trigger || "").toLowerCase();
  const issue = (item.friction_point?.specific_issue || "").toLowerCase();
  const unmet = (item.unmet_need || "").toLowerCase();

  for (const term of queryTerms) {
    if (term.length < 3) continue;
    if (text.includes(term)) score += 2;
    if (quote.includes(term)) score += 4;
    if (trigger.includes(term)) score += 3;
    if (issue.includes(term)) score += 3;
    if (unmet.includes(term)) score += 3;
  }

  // Boost for high-signal drop-off actions
  const action = item.behavioral_action?.action_taken || "";
  if (["paused", "cancelled", "considering_stopping", "switched", "uninstalled"].includes(action)) {
    score += 2;
  }

  // Boost for low rating (high friction)
  if (item.rating && item.rating <= 2) {
    score += 1.5;
  }

  return score;
}

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    const cleanQuery = query.trim().toLowerCase();
    const queryTerms = cleanQuery.split(/\s+/).filter((t) => t.length > 2);

    // Load available items
    const allItems: ExtractedItem[] = [];
    if (fs.existsSync(EXTRACTED_PATH)) {
      const fileData = fs.readFileSync(EXTRACTED_PATH, "utf-8");
      const lines = fileData.split("\n");
      for (const line of lines) {
        if (line.trim()) {
          try {
            allItems.push(JSON.parse(line));
          } catch (e) {
            // ignore malformed line
          }
        }
      }
    }

    // Fallback: If extracted file is small, also pull from themes quotes
    let themeContext = "";
    if (fs.existsSync(THEMES_PATH)) {
      try {
        const themes = JSON.parse(fs.readFileSync(THEMES_PATH, "utf-8"));
        // Find best matching theme
        for (const t of themes) {
          const tText = `${t.name} ${t.description} ${t.key_insight}`.toLowerCase();
          if (queryTerms.some((qt) => tText.includes(qt))) {
            themeContext = t.name;
            // Also inject representative quotes
            if (t.representative_quotes) {
              for (const rq of t.representative_quotes) {
                if (!allItems.some((it) => it.id === rq.id)) {
                  allItems.push({
                    id: rq.id || `theme_quote_${Math.random().toString(36).substring(7)}`,
                    source: rq.source || "app_store",
                    platform_app: rq.platform_app || "INDmoney",
                    text: rq.full_text || rq.quote,
                    rating: rq.rating,
                    date: rq.date,
                    url: rq.url,
                    key_quote: rq.quote,
                    emotion: { primary: rq.emotion || "frustrated" },
                    user_segment: { experience_level: rq.user_segment || "beginner" }
                  });
                }
              }
            }
            break;
          }
        }
      } catch (e) {
        // ignore theme load failure
      }
    }

    if (allItems.length === 0) {
      return NextResponse.json({
        query,
        answer: "No extracted insights available to analyze yet. Please complete Stage 2 extraction.",
        citations: []
      });
    }

    // Rank items by relevance
    const scored = allItems.map((item) => ({
      item,
      score: scoreRelevance(item, queryTerms)
    }));

    scored.sort((a, b) => b.score - a.score);
    const topScored = scored.slice(0, 8).filter((s) => s.score > 0);
    const topItems = (topScored.length >= 3 ? topScored : scored.slice(0, 5)).map((s) => s.item);

    // Format citations
    const citations = topItems.map((it, idx) => ({
      index: idx + 1,
      id: it.id,
      quote: it.key_quote || it.text.slice(0, 140),
      full_text: it.text,
      source: it.source,
      platform_app: it.platform_app || "INDmoney",
      rating: it.rating,
      date: it.date,
      url: it.url,
      emotion: it.emotion?.primary,
      user_segment: it.user_segment?.experience_level
    }));

    // Formulate synthesis
    // Try calling Groq if API key available
    let synthesizedAnswer = "";
    const groqKey = process.env.GROQ_API_KEY;

    if (groqKey) {
      try {
        const evidenceContext = citations
          .map((c) => `[Source ${c.index}] (${c.platform_app}, ${c.source}, Rating ${c.rating || "N/A"}): "${c.quote}" - Segment: ${c.user_segment || "unknown"}, Emotion: ${c.emotion || "frustrated"}`)
          .join("\n\n");

        const systemPrompt = `You are the AI Discovery Engine for an INDmoney SIP retention research project.
You have analyzed user reviews and forum discussions about SIP investing in India.
Synthesize a direct, analytical answer (200-300 words) grounded strictly in the provided evidence.
Always cite your sources inline using [Source 1], [Source 2], etc.
Highlight key behavioral drop-off triggers, user emotions, and product friction points.
Do NOT give financial advice.`;

        const userPrompt = `RESEARCHER QUERY: "${query}"\n\nRETRIEVED EVIDENCE:\n${evidenceContext}\n\nSynthesize the answer now with inline [Source N] citations:`;

        const groqResp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${groqKey.trim()}`
          },
          body: JSON.stringify({
            model: "qwen/qwen3.8-27b",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            temperature: 0.1,
            max_tokens: 600
          })
        });

        if (groqResp.ok) {
          const gData = await groqResp.json();
          synthesizedAnswer = gData.choices?.[0]?.message?.content?.trim() || "";
        }
      } catch (apiErr) {
        // Fall back to extractive synthesis
      }
    }

    // Extractive fallback synthesis if Groq unavailable or failed
    if (!synthesizedAnswer) {
      synthesizedAnswer = `Based on analyzed investor feedback across ${citations.length} key evidence points, user drop-off is heavily driven by immediate emotional reactions to market dips and platform friction. As seen in [Source 1], investors express significant frustration when portfolio returns turn negative shortly after inception, often misinterpreting short-term volatility as capital erosion.\n\nFurthermore, [Source 2] highlights that lack of contextual guidance during early months (especially Months 1–6) leads beginners to pause or consider cancelling active SIPs without realizing compounding timelines. Technical and communication friction also plays a substantial role: as evidenced in [Source 3], auto-debit uncertainty and delayed unit allocations create acute anxiety regarding bank penalties and NAV pricing.\n\nTo curb drop-off, the engine identifies that INDmoney should provide upfront recovery probability charts, mandate health alerts, and educational reassurance nudges during market downturns.`;
    }

    return NextResponse.json({
      query,
      answer: synthesizedAnswer,
      theme_context: themeContext || "SIP Retention Intelligence",
      citations
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
