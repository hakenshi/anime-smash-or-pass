import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getGameConfig, getCharacters } from "@/app/actions";
import { CardStack } from "@/components/game/card-stack";
import type { Gender, AnimeName } from "@/lib/constants";

export default function PlayPage() {
    return (
        <main className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center p-4">
            {/* Game */}
            <Suspense fallback={<GameSkeleton />}>
                <PlayContent />
            </Suspense>
        </main>
    );
}

async function PlayContent() {
    const config = await getGameConfig();

    // Redirect to setup if no config
    if (!config) {
        redirect("/");
    }

    // Parse config
    const animeNames = config.animes.length > 0 
        ? config.animes as AnimeName[] 
        : undefined;
    const genders = config.genders.length > 0 
        ? config.genders as Gender[] 
        : undefined;
    const limit = config.limit ?? undefined;

    // Fetch characters with config
    const characters = await getCharacters({
        animeNames,
        genders,
        limit,
    });

    // Handle empty result
    if (characters.length === 0) {
        return (
            <div className="text-center py-20">
                <p className="text-xl text-muted-foreground mb-4">
                    No characters found with your filters
                </p>
                <Link
                    href="/"
                    className="px-6 py-3 gradient-tinder text-white rounded-xl font-semibold hover:opacity-90 transition-opacity inline-block"
                >
                    Change Filters
                </Link>
            </div>
        );
    }

    return (
        <div className="w-full max-w-sm mx-auto">
            <CardStack initialCharacters={characters} />
        </div>
    );
}

function GameSkeleton() {
    return (
        <div className="w-full max-w-sm mx-auto">
            {/* Progress bar skeleton */}
            <div className="mb-4 px-1">
                <div className="h-1 w-full bg-secondary rounded-full animate-pulse" />
                <div className="flex justify-between mt-2">
                    <div className="h-3 w-20 bg-secondary rounded animate-pulse" />
                    <div className="h-3 w-12 bg-secondary rounded animate-pulse" />
                </div>
            </div>

            {/* Card skeleton */}
            <div className="relative h-[600px] flex justify-center items-center">
                <div className="w-full h-full bg-card border border-border rounded-3xl animate-pulse" />
            </div>
        </div>
    );
}
