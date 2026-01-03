"use server";

import { searchAnime, getRandomCharacter } from "@/lib/anime-data";

export async function searchAnimeAction(query: string) {
    return await searchAnime(query);
}

export async function getNextCharacterAction(animeId?: number, gender?: string) {
    // If animeId is provided, we use the specific logic
    // If not, we use the random logic
    // The getRandomCharacter function in anime-data.ts already handles the cache usage internally
    return await getRandomCharacter({ animeId, gender });
}
