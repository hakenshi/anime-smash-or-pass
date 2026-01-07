import type { characters, animes, characterImages } from "@/db/schema";

// Infer types from Drizzle schema
export type Character = typeof characters.$inferSelect;
export type Anime = typeof animes.$inferSelect;
export type CharacterImage = typeof characterImages.$inferSelect;

// Character with relations (what getCharacters returns)
export type CharacterWithRelations = Character & {
  images: CharacterImage[];
  anime: Anime;
};

// Vote types
export type VoteType = "smash" | "pass" | "kill";

// Swipe directions
export type SwipeDirection = "left" | "right" | "up";
