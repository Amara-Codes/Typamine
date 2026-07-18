import { NextRequest, NextResponse } from "next/server";
import { fetchGoogleFontCategory } from "@/lib/googleFonts";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const family = searchParams.get("family");
    if (!family) {
      return NextResponse.json({ error: "Missing family query parameter" }, { status: 400 });
    }

    const category = await fetchGoogleFontCategory(family);
    return NextResponse.json({ category });
  } catch (error: any) {
    console.error("[Google Fonts Route] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch Google Fonts category" }, { status: 500 });
  }
}
