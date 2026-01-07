"use client";

import { useState, useEffect } from "react";
import { GameCard } from "./game-card";
import { AnimatePresence, motion } from "framer-motion";
import { submitVote } from "@/app/actions";
import Link from "next/link";
import type { CharacterWithRelations, SwipeDirection, VoteType } from "@/lib/types";

interface CardStackProps {
    initialCharacters: CharacterWithRelations[];
}

// Preload images for smoother transitions
function preloadImages(characters: CharacterWithRelations[], count: number = 5) {
    characters.slice(0, count).forEach(character => {
        character.images?.forEach(img => {
            const image = new Image();
            image.src = img.imageUrl;
        });
    });
}

export function CardStack({ initialCharacters }: CardStackProps) {
    const [cards, setCards] = useState(initialCharacters);
    const [stats, setStats] = useState({ smash: 0, pass: 0, kill: 0 });

    // Preload upcoming images
    useEffect(() => {
        preloadImages(cards, 5);
    }, [cards]);

    const handleSwipe = async (id: string, direction: SwipeDirection) => {
        const typeMap: Record<SwipeDirection, VoteType> = {
            left: "smash",
            right: "pass",
            up: "kill",
        };

        const type = typeMap[direction];
        
        // Update local stats
        setStats(prev => ({ ...prev, [type]: prev[type] + 1 }));

        // Submit vote (fire and forget)
        submitVote({ characterId: id, type }).catch((err) => {
            console.error("Vote failed:", err);
        });
        
        // Remove card after animation
        setTimeout(() => {
            setCards((prev) => prev.filter((c) => c.id !== id));
        }, 200);
    };

    const total = initialCharacters.length;
    const remaining = cards.length;
    const progress = total > 0 ? ((total - remaining) / total) * 100 : 0;

    return (
        <div className="relative w-full max-w-sm mx-auto">
            {/* Progress bar */}
            <div className="mb-4 px-1">
                <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
                    <motion.div
                        className="h-full gradient-tinder"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>{remaining} remaining</span>
                    <span>{total - remaining} / {total}</span>
                </div>
            </div>

            {/* Card stack */}
            <div className="relative h-[600px] flex justify-center items-center">
                <AnimatePresence>
                    {cards.slice(0, 3).map((character, index) => {
                        const isTop = index === 0;

                        return (
                            <motion.div
                                key={character.id}
                                className="absolute w-full inset-0"
                                initial={{ scale: 1 - index * 0.05, y: index * 8 }}
                                animate={{ 
                                    scale: 1 - index * 0.05, 
                                    y: index * 8,
                                    opacity: 1 - index * 0.15,
                                }}
                                transition={{ duration: 0.3 }}
                                style={{ zIndex: cards.length - index }}
                            >
                                <GameCard
                                    character={character}
                                    active={isTop}
                                    onSwipe={(dir) => handleSwipe(character.id, dir)}
                                />
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {/* Empty state */}
                {cards.length === 0 && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center"
                    >
                        <div className="mb-6">
                            <p className="text-2xl font-bold text-foreground mb-2">
                                All done!
                            </p>
                            <p className="text-muted-foreground">
                                You've rated all {total} characters
                            </p>
                        </div>

                        {/* Stats summary */}
                        <div className="flex justify-center gap-6 mb-8">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-accent">{stats.smash}</p>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide">Smash</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-destructive">{stats.pass}</p>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide">Pass</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-muted-foreground">{stats.kill}</p>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide">Skip</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Link
                                href="/"
                                className="px-6 py-3 gradient-tinder text-white rounded-xl font-semibold hover:opacity-90 transition-opacity glow-tinder"
                            >
                                Play Again
                            </Link>
                            <Link
                                href="/results"
                                className="px-6 py-3 bg-secondary text-secondary-foreground rounded-xl font-semibold hover:bg-secondary/80 transition-colors"
                            >
                                View Rankings
                            </Link>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
