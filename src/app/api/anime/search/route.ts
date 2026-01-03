
import { searchAnime } from "@/lib/anime-data";
import { NextResponse, NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("query");

    if (!query) {
        return NextResponse.json({ error: "Query parameter required" }, { status: 400 });
    }

    const results = await searchAnime(query);

    return NextResponse.json(results, {
        headers: {
            "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
        }
    });
}
