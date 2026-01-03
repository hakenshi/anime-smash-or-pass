"use cache";

import { cacheLife } from "next/cache";

const ANILIST_API_URL = "https://graphql.anilist.co";

const QUERY = `
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
      media(sort: POPULARITY_DESC, type: ANIME, perPage: 1) {
        nodes {
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

const MAX_PAGES = 50;

async function fetchCharactersFromApi() {
    const randomPage = Math.floor(Math.random() * MAX_PAGES) + 1;

    try {
        const response = await fetch(ANILIST_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                query: QUERY,
                variables: {
                    page: randomPage,
                    perPage: 50,
                },
            }),
        });

        if (!response.ok) {
            // If 404/500, we don't want to cache this error forever if possible,
            // but "use cache" might.
            throw new Error(`AniList API returned ${response.status}`);
        }

        const data = await response.json();
        return data.data.Page.characters;
    } catch (error) {
        console.error("Failed to fetch anime characters:", error);
        return [];
    }
}

export async function getAnimeCharacters() {
    // Use "hours" profile for long-lived cache
    // "weeks" | "days" | "hours" | "minutes" | "seconds"
    cacheLife("hours");
    return fetchCharactersFromApi();
}

export async function getRandomCharacter() {
    // This helper doesn't need its own cache if getAnimeCharacters is cached, 
    // but since "use cache" is file level here (or we can assume its cheap), 
    // we just call the cached function.
    const characters = await getAnimeCharacters();

    if (!characters || characters.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * characters.length);
    const char = characters[randomIndex];

    if (!char) return null;

    return {
        id: char.id,
        name: char.name.full || char.name.native,
        image: char.image.large || char.image.medium,
        age: char.age || "Unknown",
        anime: char.media.nodes[0]?.title.english || char.media.nodes[0]?.title.romaji || "Unknown Anime",
        releaseDate: char.media.nodes[0]?.startDate.year
            ? `${char.media.nodes[0].startDate.year}`
            : "Unknown Date",
    };
}
