
import { getRandomCharacter } from "@/lib/anime-data";
import { NextResponse, NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const animeId = searchParams.get("animeId");
    const gender = searchParams.get("gender");

    const options: { animeId?: number; gender?: string } = {};

    if (animeId) {
        const id = parseInt(animeId);
        if (!isNaN(id)) {
            options.animeId = id;
        }
    }

    if (gender) {
        options.gender = gender;
    }

    const character = await getRandomCharacter(options);

    if (!character) {
        // If filtering resulted in no characters
        return NextResponse.json({ error: "No character found with these filters" }, { status: 404 });
    }

    return NextResponse.json(character, {
        headers: {
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
        },
    });
}
