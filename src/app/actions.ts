"use server";

import { searchAnime, getRandomCharacter } from "@/lib/anime-data";
import { db } from "@/db";
import { characters, votes } from "@/db/schema";
import { eq, and, count, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// --- Anime Data Actions ---

export async function searchAnimeAction(query: string) {
    return await searchAnime(query);
}

export async function getNextCharacterAction(animeId?: number, gender?: string) {
    return await getRandomCharacter({ animeId, gender });
}

// --- Voting & User Actions ---

export async function submitVoteAction(characterData: any, type: "smash" | "pass") {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        throw new Error("Unauthorized");
    }

    const userId = session.session.userId;
    const externalId = characterData.id;

    // 1. Ensure Character Exists in DB
    let charRecord = await db.query.characters.findFirst({
        where: eq(characters.externalId, externalId)
    });

    if (!charRecord) {
        const [newChar] = await db.insert(characters).values({
            externalId: externalId,
            name: characterData.name,
            image: characterData.image,
            age: characterData.age,
            animeTitle: characterData.anime,
            animeReleaseDate: characterData.releaseDate,
        }).returning();
        charRecord = newChar;
    }

    // 2. Record Vote
    await db.insert(votes).values({
        userId: userId,
        characterId: charRecord.id,
        type: type,
    });

    return { success: true };
}

export async function getUserHistoryAction() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) return [];

    const history = await db.select({
        characterName: characters.name,
        characterImage: characters.image,
        animeTitle: characters.animeTitle,
        vote: votes.type,
        votedAt: votes.createdAt,
    })
        .from(votes)
        .innerJoin(characters, eq(votes.characterId, characters.id))
        .where(eq(votes.userId, session.session.userId))
        .orderBy(sql`${votes.createdAt} DESC`);

    return history;
}

export async function getCharacterStatsAction(externalId: number) {
    const charRecord = await db.query.characters.findFirst({
        where: eq(characters.externalId, externalId)
    });

    if (!charRecord) return { smash: 0, pass: 0 };

    const stats = await db.select({
        type: votes.type,
        count: count(),
    })
        .from(votes)
        .where(eq(votes.characterId, charRecord.id))
        .groupBy(votes.type);

    const result = { smash: 0, pass: 0 };
    stats.forEach((s: { type: string | null; count: number }) => {
        if (s.type === 'smash') result.smash = s.count;
        if (s.type === 'pass') result.pass = s.count;
    });

    return result;
}
