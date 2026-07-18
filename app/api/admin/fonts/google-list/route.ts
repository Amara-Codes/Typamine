import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const apiKey = process.env.GOOGLE_FONTS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing GOOGLE_FONTS_API_KEY in environment" }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get("sort") || "popularity";
    const category = searchParams.get("category");

    // Request with variable axes (VF) and compression (WOFF2)
    let googleUrl = `https://www.googleapis.com/webfonts/v1/webfonts?key=${apiKey}&sort=${sort}&capability=VF&capability=WOFF2`;

    if (category && category !== "ALL") {
      googleUrl += `&category=${encodeURIComponent(category.toLowerCase())}`;
    }

    console.log(`[Google Fonts List] Calling Google API: ${googleUrl}`);
    const res = await fetch(googleUrl);
    if (!res.ok) {
      console.error(`[Google Fonts List] Google API response failed with status ${res.status}`);
      return NextResponse.json({ error: `Google API failed with status ${res.status}` }, { status: res.status });
    }

    const data = await res.json();
    const items = (data.items || []).map((item: any) => ({
      ...item,
      provider: 'google'
    }));
    return NextResponse.json({ items });
  } catch (error: any) {
    console.error("[Google Fonts List Route] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to retrieve Google Fonts list" }, { status: 500 });
  }
}
