"use server";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { characters, animes, votes } from "@/db/schema";
import { and, inArray, sql } from "drizzle-orm";
import { cacheLife } from "next/cache";

import type { Gender, AnimeName } from "@/lib/constants";

// Game config type
export interface GameConfig {
  animes: string[];
  genders: string[];
  limit: number | null; // null = all
}

const GAME_CONFIG_COOKIE = "game-config";

// Save game config to cookies and redirect to play
export async function saveGameConfig(config: GameConfig) {
  const cookieStore = await cookies();
  
  cookieStore.set(GAME_CONFIG_COOKIE, JSON.stringify(config), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  });

  redirect("/play");
}

// Get game config from cookies
export async function getGameConfig(): Promise<GameConfig | null> {
  const cookieStore = await cookies();
  const configCookie = cookieStore.get(GAME_CONFIG_COOKIE);

  if (!configCookie?.value) {
    return null;
  }

  try {
    return JSON.parse(configCookie.value) as GameConfig;
  } catch {
    return null;
  }
}

// Clear game config
export async function clearGameConfig() {
  const cookieStore = await cookies();
  cookieStore.delete(GAME_CONFIG_COOKIE);
}

// Fisher-Yates shuffle for proper randomization
function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Inner query wrapped with React cache for request-level memoization
const queryCharacters = cache(async (
  genders?: Gender[],
  animeNames?: AnimeName[]
) => {
  const filters = [];

  if (genders && genders.length > 0) {
    filters.push(inArray(characters.gender, genders));
  }

  if (animeNames && animeNames.length > 0) {
    filters.push(
      inArray(
        characters.animeId,
        db
          .select({ id: animes.id })
          .from(animes)
          .where(inArray(animes.title, animeNames)),
      ),
    );
  }

  return db.query.characters.findMany({
    where: filters.length > 0 ? and(...filters) : undefined,
    with: {
      images: true,
      anime: true,
    },
  });
});

// Outer function with time-based caching across requests
export async function getCharacters({
  genders,
  animeNames,
  limit,
}: {
  genders?: Gender[];
  animeNames?: AnimeName[];
  limit?: number;
}) {
  "use cache";
  cacheLife("hours");

  const data = await queryCharacters(genders, animeNames);
  const shuffled = shuffle(data);
  
  // Apply limit if specified
  if (limit && limit > 0) {
    return shuffled.slice(0, limit);
  }
  
  return shuffled;
}

// Get available animes from the database (what's actually seeded)
export async function getAvailableAnimes() {
  "use cache";
  cacheLife("days");

  const data = await db.query.animes.findMany({
    columns: {
      id: true,
      title: true,
    },
    orderBy: (animes, { asc }) => [asc(animes.title)],
  });

  return data;
}

// Get available genders for specific animes (or all if none specified)
export async function getAvailableGenders(animeNames?: string[]) {
  "use cache";
  cacheLife("days");

  let query;
  
  if (animeNames && animeNames.length > 0) {
    // Get genders for specific animes
    query = db
      .selectDistinct({ gender: characters.gender })
      .from(characters)
      .innerJoin(animes, sql`${characters.animeId} = ${animes.id}`)
      .where(inArray(animes.title, animeNames));
  } else {
    // Get all genders
    query = db
      .selectDistinct({ gender: characters.gender })
      .from(characters);
  }

  const data = await query;
  return data
    .map((d) => d.gender)
    .filter((g): g is string => g !== null)
    .sort();
}

// Get character count for given filters (for preview)
export async function getCharacterCount({
  genders,
  animeNames,
}: {
  genders?: string[];
  animeNames?: string[];
}) {
  "use cache";
  cacheLife("hours");

  const filters = [];

  if (genders && genders.length > 0) {
    filters.push(inArray(characters.gender, genders));
  }

  if (animeNames && animeNames.length > 0) {
    filters.push(
      inArray(
        characters.animeId,
        db
          .select({ id: animes.id })
          .from(animes)
          .where(inArray(animes.title, animeNames)),
      ),
    );
  }

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(characters)
    .where(filters.length > 0 ? and(...filters) : undefined);

  return Number(result[0]?.count ?? 0);
}

export async function submitVote({
  characterId,
  type,
  sessionId = "anonymous", // For now
}: {
  characterId: string;
  type: "smash" | "pass" | "kill";
  sessionId?: string;
}) {
  await db.insert(votes).values({
    characterId,
    type,
    sessionId,
  });
}

// Get character rankings based on votes
const queryCharacterRankings = cache(async () => {
  const allVotes = await db.query.votes.findMany({
    with: {
      character: {
        with: {
          images: true,
          anime: true,
        },
      },
    },
  });

  // Group votes by character
  const votesByCharacter = new Map<
    string,
    {
      character: typeof allVotes[0]["character"];
      smash: number;
      pass: number;
      kill: number;
      total: number;
    }
  >();

  for (const vote of allVotes) {
    const charId = vote.characterId;
    const existing = votesByCharacter.get(charId) || {
      character: vote.character,
      smash: 0,
      pass: 0,
      kill: 0,
      total: 0,
    };

    existing[vote.type as "smash" | "pass" | "kill"]++;
    existing.total++;
    votesByCharacter.set(charId, existing);
  }

  return Array.from(votesByCharacter.values());
});

export async function getCharacterRankings() {
  "use cache";
  cacheLife("minutes");

  const rankings = await queryCharacterRankings();

  // Sort by smash rate (smash / total)
  return rankings
    .map((r) => ({
      ...r,
      smashRate: r.total > 0 ? r.smash / r.total : 0,
    }))
    .sort((a, b) => b.smashRate - a.smashRate);
}

export async function getVoteStats() {
  "use cache";
  cacheLife("minutes");

  const allVotes = await db.query.votes.findMany();

  const stats = {
    total: allVotes.length,
    smash: allVotes.filter((v) => v.type === "smash").length,
    pass: allVotes.filter((v) => v.type === "pass").length,
    kill: allVotes.filter((v) => v.type === "kill").length,
  };

  return stats;
}
