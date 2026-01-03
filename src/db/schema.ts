
import { pgTable, text, integer, timestamp, boolean, uuid } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("emailVerified").notNull(),
    image: text("image"),
    createdAt: timestamp("createdAt").notNull(),
    updatedAt: timestamp("updatedAt").notNull()
});

export const session = pgTable("session", {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expiresAt").notNull(),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    userId: text("userId").notNull().references(() => user.id)
});

export const account = pgTable("account", {
    id: text("id").primaryKey(),
    accountId: text("accountId").notNull(),
    providerId: text("providerId").notNull(),
    userId: text("userId").notNull().references(() => user.id),
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    idToken: text("idToken"),
    accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
    refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("createdAt").notNull(),
    updatedAt: timestamp("updatedAt").notNull()
});

export const verification = pgTable("verification", {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    createdAt: timestamp("createdAt"),
    updatedAt: timestamp("updatedAt")
});

export const characters = pgTable("characters", {
    id: uuid("id").primaryKey().defaultRandom(),
    externalId: integer("external_id").notNull().unique(), // AniList ID
    name: text("name").notNull(),
    image: text("image").notNull(),
    age: text("age"), // Can be "16", "100+", "Unknown", so text is safer
    animeTitle: text("anime_title").notNull(),
    animeReleaseDate: text("anime_release_date"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const votes = pgTable("votes", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").references(() => user.id), // Nullable if we allow anonymous votes later, but better to link
    characterId: uuid("character_id").references(() => characters.id).notNull(),
    type: text("type", { enum: ["smash", "pass"] }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
