"use client";

import { useState, useTransition, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import { saveGameConfig, getAvailableGenders, getCharacterCount } from "@/app/actions";
import { ANIME_PRESETS, type PresetKey } from "@/lib/constants";

interface SetupFormProps {
    availableAnimes: { id: string; title: string }[];
    availableGenders: string[];
    totalCharacterCount: number;
}

const LIMIT_OPTIONS = [
    { value: 10, label: "10" },
    { value: 25, label: "25" },
    { value: 50, label: "50" },
    { value: 100, label: "100" },
    { value: null, label: "All" },
] as const;

// Filter presets to only include animes that exist in the database
function getAvailablePresets(availableAnimes: { title: string }[]) {
    const titles = new Set(availableAnimes.map(a => a.title));
    
    return (Object.entries(ANIME_PRESETS) as [PresetKey, typeof ANIME_PRESETS[PresetKey]][])
        .map(([key, preset]) => {
            const matchingAnimes = preset.animes.filter(a => titles.has(a));
            return {
                key,
                ...preset,
                matchingAnimes,
                available: matchingAnimes.length > 0,
            };
        })
        .filter(p => p.available);
}

export function SetupForm({
    availableAnimes,
    availableGenders,
    totalCharacterCount,
}: SetupFormProps) {
    const [selectedAnimes, setSelectedAnimes] = useState<string[]>([]);
    const [selectedGenders, setSelectedGenders] = useState<string[]>([]);
    const [limit, setLimit] = useState<number | null>(25);
    const [search, setSearch] = useState("");
    const [gendersForSelection, setGendersForSelection] = useState<string[]>(availableGenders);
    const [characterCount, setCharacterCount] = useState(totalCharacterCount);
    const [isPending, startTransition] = useTransition();
    const [activePreset, setActivePreset] = useState<PresetKey | null>(null);
    const [showAnimeList, setShowAnimeList] = useState(false);

    const presets = getAvailablePresets(availableAnimes);
    const allSelected = selectedAnimes.length === 0;
    const filteredAnimes = availableAnimes.filter((a) =>
        a.title.toLowerCase().includes(search.toLowerCase())
    );

    // Update available genders when anime selection changes
    useEffect(() => {
        if (selectedAnimes.length === 0) {
            setGendersForSelection(availableGenders);
        } else {
            getAvailableGenders(selectedAnimes).then(setGendersForSelection);
        }
    }, [selectedAnimes, availableGenders]);

    // Update character count preview
    useEffect(() => {
        const animes = selectedAnimes.length > 0 ? selectedAnimes : undefined;
        const genders = selectedGenders.length > 0 ? selectedGenders : undefined;
        
        getCharacterCount({ animeNames: animes, genders }).then(setCharacterCount);
    }, [selectedAnimes, selectedGenders]);

    // Reset gender selection if it's no longer valid
    useEffect(() => {
        setSelectedGenders((prev) =>
            prev.filter((g) => gendersForSelection.includes(g))
        );
    }, [gendersForSelection]);

    const selectPreset = (presetKey: PresetKey) => {
        const preset = presets.find(p => p.key === presetKey);
        if (!preset) return;
        
        if (activePreset === presetKey) {
            setActivePreset(null);
            setSelectedAnimes([]);
        } else {
            setActivePreset(presetKey);
            setSelectedAnimes(preset.matchingAnimes);
        }
    };

    const toggleAnime = (title: string) => {
        setActivePreset(null);
        setSelectedAnimes((prev) =>
            prev.includes(title)
                ? prev.filter((a) => a !== title)
                : [...prev, title]
        );
    };

    const selectAll = () => {
        setActivePreset(null);
        setSelectedAnimes([]);
    };

    const toggleGender = (gender: string) => {
        setSelectedGenders((prev) =>
            prev.includes(gender)
                ? prev.filter((g) => g !== gender)
                : [...prev, gender]
        );
    };

    const handleStart = () => {
        startTransition(async () => {
            await saveGameConfig({
                animes: selectedAnimes,
                genders: selectedGenders,
                limit,
            });
        });
    };

    const effectiveCount = limit ? Math.min(limit, characterCount) : characterCount;

    return (
        <m.div 
            className="w-full max-w-lg mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
        >
            <m.div 
                className="bg-card border border-border rounded-2xl p-5 space-y-4"
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
            >
                {/* Quick Presets */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                            Category
                        </h2>
                        <m.button
                            onClick={selectAll}
                            className={`text-sm px-2 py-0.5 rounded transition-colors ${
                                allSelected && !activePreset
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            All Anime
                        </m.button>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                        {presets.map((preset, index) => (
                            <m.button
                                key={preset.key}
                                onClick={() => selectPreset(preset.key)}
                                className={`px-2 py-2 rounded-lg text-center transition-colors ${
                                    activePreset === preset.key
                                        ? "bg-primary/20 border border-primary"
                                        : "bg-secondary/50 border border-transparent hover:bg-secondary hover:border-primary/30"
                                }`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <p className="font-medium text-sm leading-tight">{preset.name.split(' / ')[0]}</p>
                            </m.button>
                        ))}
                    </div>
                </div>

                {/* Custom Selection - Collapsible */}
                <div>
                    <m.button
                        onClick={() => setShowAnimeList(!showAnimeList)}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        whileHover={{ x: 3 }}
                    >
                        <m.svg 
                            className="w-3 h-3"
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                            animate={{ rotate: showAnimeList ? 90 : 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </m.svg>
                        {showAnimeList ? "Hide" : "Custom selection"}
                        {!showAnimeList && selectedAnimes.length > 0 && !activePreset && (
                            <m.span 
                                className="text-primary"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                            >
                                ({selectedAnimes.length} selected)
                            </m.span>
                        )}
                    </m.button>

                    {/* Expandable anime list */}
                    <AnimatePresence>
                        {showAnimeList && (
                            <m.div 
                                className="mt-2 space-y-2 overflow-hidden"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                            >
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search anime..."
                                    className="w-full px-3 py-1.5 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                />

                                <div className="max-h-32 overflow-y-auto space-y-0.5 pr-1">
                                    {filteredAnimes.map((anime) => (
                                        <m.label
                                            key={anime.id}
                                            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors text-sm ${
                                                selectedAnimes.includes(anime.title)
                                                    ? "bg-primary/10 text-foreground"
                                                    : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                                            }`}
                                            whileHover={{ x: 3 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedAnimes.includes(anime.title)}
                                                onChange={() => toggleAnime(anime.title)}
                                                className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary accent-primary"
                                            />
                                            <span className="truncate flex-1">{anime.title}</span>
                                        </m.label>
                                    ))}
                                </div>
                            </m.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Gender + Count in a row */}
                <div className="flex gap-4">
                    {/* Gender Selection */}
                    <div className="flex-1">
                        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
                            Gender
                        </h2>
                        <div className="flex flex-wrap gap-1.5">
                            <m.button
                                onClick={() => setSelectedGenders([])}
                                className={`px-2.5 py-1 rounded-lg text-sm font-medium transition-colors ${
                                    selectedGenders.length === 0
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                                }`}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                All
                            </m.button>
                            {gendersForSelection.filter(g => g === 'Female' || g === 'Male').map((gender) => (
                                <m.button
                                    key={gender}
                                    onClick={() => toggleGender(gender)}
                                    className={`px-2.5 py-1 rounded-lg text-sm font-medium transition-colors ${
                                        selectedGenders.includes(gender)
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                                    }`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    {gender}
                                </m.button>
                            ))}
                        </div>
                    </div>

                    {/* Character Count */}
                    <div className="flex-1">
                        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
                            Count
                        </h2>
                        <div className="flex flex-wrap gap-1.5">
                            {LIMIT_OPTIONS.slice(0, 4).map((option) => (
                                <m.button
                                    key={option.label}
                                    onClick={() => setLimit(option.value)}
                                    disabled={option.value !== null && option.value > characterCount}
                                    className={`px-2.5 py-1 rounded-lg text-sm font-medium transition-colors ${
                                        limit === option.value
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    {option.label}
                                </m.button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Start Button */}
                <m.button
                    onClick={handleStart}
                    disabled={isPending || characterCount === 0}
                    className="w-full py-3 gradient-tinder text-white rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed glow-tinder"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <AnimatePresence mode="wait">
                        {isPending ? (
                            <m.span
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                Loading...
                            </m.span>
                        ) : (
                            <m.span
                                key="start"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                Start ({effectiveCount} characters)
                            </m.span>
                        )}
                    </AnimatePresence>
                </m.button>
            </m.div>
        </m.div>
    );
}
