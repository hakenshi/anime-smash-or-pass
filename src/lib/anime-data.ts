import { unstable_cache } from "next/cache";

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

// Helper to pick a random page. AniList has thousands of chars.
// We'll limit to top 50 pages (approx 2500 top characters) to ensure quality.
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
                    perPage: 50, // Fetch a batch
                },
            }),
            next: {
                revalidate: 3600, // Revalidate every hour at most
            }
        });

        if (!response.ok) {
            throw new Error(`AniList API returned ${response.status}`);
        }

        const data = await response.json();
        return data.data.Page.characters;
    } catch (error) {
        console.error("Failed to fetch anime characters:", error);
        return [];
    }
}

// Cached version of the fetcher
// In a real app, we might want to pre-seed this or use a database to store "seen" characters.
// For "stupidly fast", we rely on Next.js Data Cache.
export const getAnimeCharacters = unstable_cache(
    async () => {
        return fetchCharactersFromApi();
    },
    ["anime-characters-list"], // Cache key
    {
        revalidate: 3600, // Revalidate cache every hour
        tags: ["anime-characters"],
    }
);

// Function to get a single random character from the cached batch
export async function getRandomCharacter() {
    const characters = await getAnimeCharacters();
    if (!characters || characters.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * characters.length);
    const char = characters[randomIndex];

    if (!char) return null;

    // Format data for the UI
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
