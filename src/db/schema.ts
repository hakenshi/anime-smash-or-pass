import { pgTable, text, integer, timestamp, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// --- Tables ---

export const animes = pgTable("animes", {
  id: uuid("id").primaryKey().defaultRandom(),
  externalId: integer("external_id").notNull().unique(), // AniList ID
  title: text("title").notNull(),
  releaseDate: text("release_date"), // Year or date string
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const characters = pgTable("characters", {
  id: uuid("id").primaryKey().defaultRandom(),
  externalId: integer("external_id").notNull().unique(), // AniList ID
  name: text("name").notNull(),
  // Imagem removida daqui, agora vive na tabela character_images
  age: text("age"),
  gender: text("gender"),
  animeId: uuid("anime_id")
    .references(() => animes.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const characterImages = pgTable("character_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  characterId: uuid("character_id")
    .references(() => characters.id)
    .notNull(),
  imageUrl: text("image_url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const votes = pgTable("votes", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: text("session_id").notNull(),
  characterId: uuid("character_id")
    .references(() => characters.id)
    .notNull(),
  type: text("type", { enum: ["smash", "pass", "kill"] }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- Relations ---

export const animesRelations = relations(animes, ({ many }) => ({
  characters: many(characters),
}));

export const charactersRelations = relations(characters, ({ one, many }) => ({
  anime: one(animes, {
    fields: [characters.animeId],
    references: [animes.id],
  }),
  images: many(characterImages),
}));

export const characterImagesRelations = relations(
  characterImages,
  ({ one }) => ({
    character: one(characters, {
      fields: [characterImages.characterId],
      references: [characters.id],
    }),
  }),
);

export const votesRelations = relations(votes, ({ one }) => ({
  character: one(characters, {
    fields: [votes.characterId],
    references: [characters.id],
  }),
}));
