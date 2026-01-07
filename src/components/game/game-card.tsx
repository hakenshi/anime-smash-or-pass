"use client";

import { motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import { useState } from "react";
import Image from "next/image";
import type { CharacterWithRelations, SwipeDirection } from "@/lib/types";

interface GameCardProps {
    character: CharacterWithRelations;
    active: boolean;
    onSwipe: (direction: SwipeDirection) => void;
}

export function GameCard({ character, active, onSwipe }: GameCardProps) {
    const [exitX, setExitX] = useState<number | null>(null);
    const [exitY, setExitY] = useState<number | null>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-15, 15]);
    const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0.5, 1, 1, 1, 0.5]);

    // Overlay opacities based on swipe direction
    const smashOpacity = useTransform(x, [-150, -50], [1, 0]);
    const passOpacity = useTransform(x, [50, 150], [0, 1]);
    const killOpacity = useTransform(y, [-150, -50], [1, 0]);

    // Glow intensity based on drag
    const glowIntensity = useTransform(
        x,
        [-150, 0, 150],
        [1, 0, 1]
    );

    const images = character.images || [];
    const currentImage = images[currentImageIndex]?.imageUrl;
    const hasMultipleImages = images.length > 1;

    const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!hasMultipleImages || !active) return;

        const { width, left } = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - left;

        if (clickX < width * 0.3) {
            setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : prev));
        } else if (clickX > width * 0.7) {
            setCurrentImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : prev));
        }
    };

    const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (!active) return;

        const SWIPE_THRESHOLD = 100;
        const VELOCITY_THRESHOLD = 500;

        if (info.offset.x < -SWIPE_THRESHOLD || info.velocity.x < -VELOCITY_THRESHOLD) {
            setExitX(-2000);
            onSwipe("left");
        } else if (info.offset.x > SWIPE_THRESHOLD || info.velocity.x > VELOCITY_THRESHOLD) {
            setExitX(2000);
            onSwipe("right");
        } else if (info.offset.y < -SWIPE_THRESHOLD || info.velocity.y < -VELOCITY_THRESHOLD) {
            setExitY(-2000);
            onSwipe("up");
        }
    };

    return (
        <motion.div
            style={{
                x: active ? x : 0,
                y: active ? y : 0,
                rotate: active ? rotate : 0,
                opacity: active ? opacity : 0.8,
                position: "absolute",
                top: 0,
                zIndex: active ? 10 : 0,
                width: "100%",
                height: "600px",
                cursor: active ? "grab" : "default",
            }}
            drag={active}
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            onDragEnd={handleDragEnd}
            animate={
                exitX !== null
                    ? { x: exitX, opacity: 0 }
                    : exitY !== null
                        ? { y: exitY, opacity: 0 }
                        : { x: 0, y: 0, opacity: 1 }
            }
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative rounded-2xl overflow-hidden border border-border/50 bg-card shadow-2xl shadow-black/50"
        >
            {/* Image Area */}
            <div
                className="absolute inset-0 z-10"
                onClick={handleTap}
            >
                {currentImage ? (
                    <Image
                        src={currentImage}
                        alt={character.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 400px"
                        className="object-cover pointer-events-none"
                        draggable={false}
                        priority={active}
                    />
                ) : (
                    <div className="w-full h-full bg-secondary flex items-center justify-center text-muted-foreground">
                        No Image
                    </div>
                )}

                {/* Gradient overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent pointer-events-none" />

                {/* Carousel Indicators */}
                {hasMultipleImages && (
                    <div className="absolute top-3 left-3 right-3 flex gap-1 z-20">
                        {images.map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-1 rounded-full flex-1 transition-all duration-200 ${
                                    idx === currentImageIndex 
                                        ? "bg-primary shadow-sm shadow-primary/50" 
                                        : "bg-white/30"
                                }`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Character Info */}
            <div className="absolute bottom-0 left-0 right-0 p-5 text-white select-none pointer-events-none z-20">
                <div className="flex items-baseline gap-2 mb-1">
                    <h2 className="text-2xl font-bold tracking-tight">
                        {character.name}
                    </h2>
                    {character.age && character.age !== "Unknown" && (
                        <span className="text-lg text-white/70 font-medium">
                            {character.age}
                        </span>
                    )}
                </div>
                <p className="text-sm text-primary font-medium">
                    {character.anime?.title}
                </p>
                {character.gender && character.gender !== "Unknown" && (
                    <p className="text-xs text-white/50 mt-1">
                        {character.gender}
                    </p>
                )}
            </div>

            {/* Swipe Overlays */}
            <motion.div 
                style={{ opacity: smashOpacity }} 
                className="absolute top-6 right-6 z-30 pointer-events-none"
            >
                <div className="border-3 border-accent rounded-lg px-4 py-2 rotate-12 glow-smash">
                    <span className="text-accent font-bold text-3xl uppercase tracking-wider text-glow">
                        SMASH
                    </span>
                </div>
            </motion.div>

            <motion.div 
                style={{ opacity: passOpacity }} 
                className="absolute top-6 left-6 z-30 pointer-events-none"
            >
                <div className="border-3 border-destructive rounded-lg px-4 py-2 -rotate-12 glow-pass">
                    <span className="text-destructive font-bold text-3xl uppercase tracking-wider text-glow">
                        PASS
                    </span>
                </div>
            </motion.div>

            <motion.div 
                style={{ opacity: killOpacity }} 
                className="absolute bottom-28 left-0 right-0 flex justify-center z-30 pointer-events-none"
            >
                <div className="border-3 border-muted-foreground rounded-lg px-4 py-2">
                    <span className="text-muted-foreground font-bold text-3xl uppercase tracking-wider">
                        SKIP
                    </span>
                </div>
            </motion.div>

            {/* Subtle card glow effect when active */}
            {active && (
                <motion.div
                    className="absolute inset-0 pointer-events-none z-0 rounded-2xl"
                    style={{
                        opacity: glowIntensity,
                        boxShadow: "inset 0 0 60px rgba(0, 200, 255, 0.1)",
                    }}
                />
            )}
        </motion.div>
    );
}
