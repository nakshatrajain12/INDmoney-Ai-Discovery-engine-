import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    segments: [
      { name: "first_timer", count: 0 },
      { name: "beginner", count: 0 },
      { name: "intermediate", count: 0 },
      { name: "experienced", count: 0 }
    ]
  });
}
