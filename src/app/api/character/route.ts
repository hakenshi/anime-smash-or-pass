
import { getRandomCharacter } from "@/lib/anime-data";
import { NextResponse } from "next/server";

export async function GET() {
    const character = await getRandomCharacter();

    if (!character) {
        return NextResponse.json({ error: "Failed to fetch character" }, { status: 500 });
    }

    // Set Cache-Control headers to ensure browser respects our server-side caching strategy
    // stale-while-revalidate for snappy feeling
    return NextResponse.json(character, {
        headers: {
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
        },
    });
}
