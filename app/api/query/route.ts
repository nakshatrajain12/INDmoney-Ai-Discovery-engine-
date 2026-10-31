import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    return NextResponse.json({
      query: query || "",
      answer: "RAG Query synthesis endpoint is active. Vector retrieval is wired in Stage 4.",
      citations: []
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
