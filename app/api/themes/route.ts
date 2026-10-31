import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const matrixRequested = searchParams.get("matrix") === "true";
    const themeId = searchParams.get("id");

    const matrixPath = path.join(process.cwd(), "data", "themes", "opportunity_matrix.json");
    const themesPath = path.join(process.cwd(), "data", "themes", "themes.json");

    const targetPath = matrixRequested ? matrixPath : themesPath;

    if (!fs.existsSync(targetPath)) {
      return NextResponse.json({ themes: [] });
    }

    const data = JSON.parse(fs.readFileSync(targetPath, "utf-8"));

    if (themeId) {
      const found = data.find((t: any) => t.id === themeId);
      if (!found) {
        return NextResponse.json({ error: `Theme ${themeId} not found` }, { status: 404 });
      }
      return NextResponse.json({ theme: found });
    }

    return NextResponse.json({
      themes: data,
      count: data.length,
      top_theme: data[0] || null
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
