import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const zipPath = path.join(process.cwd(), "public", "indmoney-research-data.zip");
    
    if (!fs.existsSync(zipPath)) {
      return NextResponse.json(
        { error: "Export archive not found on server." },
        { status: 404 }
      );
    }

    const fileBuffer = fs.readFileSync(zipPath);
    const stat = fs.statSync(zipPath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="indmoney-research-data.zip"',
        "Content-Length": stat.size.toString(),
        "Cache-Control": "public, max-age=3600, immutable",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to stream research archive: " + error.message },
      { status: 500 }
    );
  }
}

