import { db } from "@/db";
import { animes, characters, characterImages } from "@/db/schema";
import { eq } from "drizzle-orm";

const ANILIST_API_URL = "https://graphql.anilist.co";

import { ANIMES } from "@/lib/constants";

// Use shared constants
const TARGET_ANIMES = ANIMES;

const ANIME_SEARCH_QUERY = `
query ($search: String) {
  Media(search: $search, type: ANIME, sort: SEARCH_MATCH) {
    id
    title {
      romaji
      english
    }
    startDate {
      year
    }
  }
}
`;

const CHARACTERS_QUERY = `
query ($id: Int, $page: Int) {
  Media(id: $id) {
    characters(page: $page, perPage: 50, sort: ROLE) {
      pageInfo {
        hasNextPage
      }
      nodes {
        id
        name {
          full
          native
        }
        image {
          large
          medium
        }
        age
        gender
      }
    }
  }
}
`;

async function fetchAnimeData(search: string) {
  await new Promise((r) => setTimeout(r, 2000)); // Rate limit safety

  const response = await fetch(ANILIST_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      query: ANIME_SEARCH_QUERY,
      variables: { search },
    }),
  });

  if (!response.ok) {
    console.error(`Rate limit or error: ${response.status} ${response.statusText}`);
    const text = await response.text();
    console.error(text);
    return null;
  }

  const data = await response.json();
  if (!data.data || !data.data.Media) {
    console.error("Invalid response for", search, JSON.stringify(data, null, 2));
    if (data.errors) {
      console.error("Errors:", data.errors);
    }
    return null;
  }

  return data.data.Media;
}

async function fetchCharactersForAnime(animeId: number) {
  let allCharacters: any[] = [];
  let page = 1;
  let hasNextPage = true;

  // Aumentei o limite de páginas para 4 (200 chars) para pegar casts grandes como Naruto/One Piece
  while (hasNextPage && page <= 4) {
    console.log(`     ↳ Baixando página ${page}...`);
    const response = await fetch(ANILIST_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query: CHARACTERS_QUERY,
        variables: { id: animeId, page },
      }),
    });

    if (!response.ok) {
      console.error(`Error fetching characters page ${page}: ${response.status}`);
      await new Promise((r) => setTimeout(r, 5000)); // Wait longer on error
      // Use break to stop fetching for this anime on error to avoid infinite loop or gaps
      break;
    }

    const data = await response.json();
    if (!data.data || !data.data.Media) {
      console.error("Invalid character data for anime", animeId, JSON.stringify(data));
      break;
    }

    const nodes = data.data.Media?.characters?.nodes || [];

    allCharacters = [...allCharacters, ...nodes];
    hasNextPage = data.data.Media?.characters?.pageInfo?.hasNextPage;
    page++;

    await new Promise((r) => setTimeout(r, 1200)); // Increased delay slightly
  }
  return allCharacters;
}

export async function seedDatabase() {
  console.log(`🌱 Iniciando Seeder para ${TARGET_ANIMES.length} animes...`);

  for (const animeName of TARGET_ANIMES) {
    console.log(`
🔎 Processando: ${animeName}`);

    const animeData = await fetchAnimeData(animeName);
    if (!animeData) {
      console.error(`❌ Anime não encontrado: ${animeName}`);
      continue;
    }

    // 1. Salvar Anime
    let dbAnime = await db.query.animes.findFirst({
      where: eq(animes.externalId, animeData.id),
    });

    if (!dbAnime) {
      console.log(
        `   🆕 Criando Anime: ${animeData.title.english || animeData.title.romaji}`,
      );
      const [newAnime] = await db
        .insert(animes)
        .values({
          externalId: animeData.id,
          title: animeData.title.english || animeData.title.romaji,
          releaseDate: animeData.startDate?.year
            ? String(animeData.startDate.year)
            : "Unknown",
        })
        .returning();
      dbAnime = newAnime;
    } else {
      console.log(`   ✅ Anime já existente: ${dbAnime.title}`);
    }

    // 2. Salvar Personagens
    const charList = await fetchCharactersForAnime(animeData.id);
    console.log(`   📦 Encontrados ${charList.length} personagens.`);

    let savedCount = 0;
    for (const char of charList) {
      // Verifica se char já existe
      const existingChar = await db.query.characters.findFirst({
        where: eq(characters.externalId, char.id),
      });

      if (!existingChar) {
        // Inserir Personagem
        const [newChar] = await db
          .insert(characters)
          .values({
            externalId: char.id,
            name: char.name.full || char.name.native,
            age: char.age || "Unknown",
            gender: char.gender || "Unknown",
            animeId: dbAnime.id,
          })
          .returning();

        // Inserir Imagens
        const imagesToInsert = [];
        if (char.image.large)
          imagesToInsert.push({
            characterId: newChar.id,
            imageUrl: char.image.large,
          });
        if (char.image.medium)
          imagesToInsert.push({
            characterId: newChar.id,
            imageUrl: char.image.medium,
          });

        if (imagesToInsert.length > 0) {
          await db.insert(characterImages).values(imagesToInsert);
        }

        savedCount++;
      }
    }
    console.log(`   💾 ${savedCount} personagens novos salvos.`);
  }

  console.log("\n🏁 Seed concluído!");
}

seedDatabase();
