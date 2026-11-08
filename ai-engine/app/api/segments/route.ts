import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "data", "themes", "themes.json");
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ segments: {} });
    }

    const themes = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    
    const experienceTotals: Record<string, number> = {};
    const tenureTotals: Record<string, number> = {};
    const influenceTotals: Record<string, number> = {};
    const themeSegmentMatrix: Record<string, any> = {};

    for (const theme of themes) {
      const seg = theme.segment_breakdown || {};
      
      // Experience
      for (const [lvl, count] of Object.entries(seg.experience_level || {})) {
        experienceTotals[lvl] = (experienceTotals[lvl] || 0) + (count as number);
      }
      
      // Tenure
      for (const [ten, count] of Object.entries(seg.sip_tenure || {})) {
        tenureTotals[ten] = (tenureTotals[ten] || 0) + (count as number);
      }

      // Influence
      for (const [inf, count] of Object.entries(seg.influence_source || {})) {
        influenceTotals[inf] = (influenceTotals[inf] || 0) + (count as number);
      }

      themeSegmentMatrix[theme.id] = {
        name: theme.name,
        rank: theme.rank,
        opportunity_score: theme.opportunity_score,
        experience: seg.experience_level || {},
        tenure: seg.sip_tenure || {},
        influence: seg.influence_source || {}
      };
    }

    return NextResponse.json({
      aggregates: {
        experience_level: experienceTotals,
        sip_tenure: tenureTotals,
        influence_source: influenceTotals
      },
      theme_matrix: themeSegmentMatrix,
      total_themes: themes.length
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
