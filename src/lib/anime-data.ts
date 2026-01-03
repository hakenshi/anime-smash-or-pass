"use cache";

import { cacheLife } from "next/cache";

const ANILIST_API_URL = "https://graphql.anilist.co";

// --- Queries ---

const CHARACTERS_QUERY = `
query ($page: Int, $perPage: Int) {
  Page(page: $page, perPage: $perPage) {
    pageInfo {
      total
      perPage
      currentPage
      lastPage
      hasNextPage
    }
    characters(sort: FAVOURITES_DESC) {
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
      media(sort: POPULARITY_DESC, type: ANIME, perPage: 1) {
        nodes {
          id
          title {
            romaji
            english
          }
          startDate {
            year
            month
            day
          }
        }
      }
    }
  }
}
`;

const ANIME_SEARCH_QUERY = `
query ($search: String, $perPage: Int) {
  Page(page: 1, perPage: $perPage) {
    media(search: $search, type: ANIME, sort: POPULARITY_DESC) {
      id
      title {
        romaji
        english
      }
      coverImage {
        medium
      }
      startDate {
        year
      }
    }
  }
}
`;

const ANIME_CHARACTERS_QUERY = `
query ($id: Int, $page: Int, $perPage: Int) {
  Media(id: $id) {
    characters(page: $page, perPage: $perPage, sort: ROLE) {
      pageInfo {
        total
        perPage
        currentPage
        lastPage
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

// --- Fetchers ---

const MAX_PAGES = 50;

async function fetchRandomCharacters() {
    const randomPage = Math.floor(Math.random() * MAX_PAGES) + 1;
    const response = await fetch(ANILIST_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
            query: CHARACTERS_QUERY,
            variables: { page: randomPage, perPage: 50 },
        }),
    });

    if (!response.ok) return [];
    const data = await response.json();
    return data.data.Page.characters;
}

async function fetchAnimeSearchResults(query: string) {
    const response = await fetch(ANILIST_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
            query: ANIME_SEARCH_QUERY,
            variables: { search: query, perPage: 10 },
        }),
    });

    if (!response.ok) return [];
    const data = await response.json();
    return data.data.Page.media;
}

async function fetchCharactersForAnime(animeId: number) {
    // Fetch first 50 characters (should cover main cast)
    // If we need more, we'd need pagination logic, but 50 is usually enough for main + supporting
    const response = await fetch(ANILIST_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
            query: ANIME_CHARACTERS_QUERY,
            variables: { id: animeId, page: 1, perPage: 50 },
        }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.data.Media.characters.nodes;
}

// --- Cached Exports ---

export async function getAnimeCharacters() {
    cacheLife("hours");
    return fetchRandomCharacters();
}

export async function searchAnime(query: string) {
    // Cache search results for a bit
    cacheLife("hours");
    return fetchAnimeSearchResults(query);
}

export async function getCharactersByAnime(animeId: number) {
    cacheLife("hours");
    return fetchCharactersForAnime(animeId);
}

export async function getRandomCharacter(options?: { animeId?: number, gender?: string }) {
    let characters: any[] | null = [];
    let animeTitle = "Unknown Anime";
    let animeDate = "Unknown Date";

    if (options?.animeId) {
        // Fetch specifically for this anime
        characters = await getCharactersByAnime(options.animeId);
        // We don't get the anime details in the character node for this query, 
        // but usually the caller knows the anime. 
        // We could fetch anime details separately if needed, but for now we'll rely on generic fallback or
        // assume UI handles the context.
    } else {
        // Random pool
        characters = await getAnimeCharacters();
    }

    if (!characters || characters.length === 0) return null;

    // Filter by gender if requested
    if (options?.gender) {
        const targetGender = options.gender.toLowerCase();
        characters = characters.filter((char: any) => {
            const charGender = (char.gender || "").toLowerCase();
            // AniList genders are free text, but usually "Male", "Female"
            return charGender === targetGender;
        });
    }

    if (characters.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * characters.length);
    const char = characters[randomIndex];

    if (!char) return null;

    // If we came from Media query, char.media is missing.
    // If we came from Random query, char.media is present.
    if (char.media && char.media.nodes && char.media.nodes.length > 0) {
        animeTitle = char.media.nodes[0].title.english || char.media.nodes[0].title.romaji;
        animeDate = char.media.nodes[0].startDate.year ? `${char.media.nodes[0].startDate.year}` : "Unknown Date";
    }

    return {
        id: char.id,
        name: char.name.full || char.name.native,
        image: char.image.large || char.image.medium,
        age: char.age || "Unknown",
        gender: char.gender || "Unknown",
        anime: animeTitle,
        releaseDate: animeDate,
    };
}
