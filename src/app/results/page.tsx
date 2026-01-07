import { getCharacterRankings, getVoteStats } from "@/app/actions";
import Image from "next/image";
import Link from "next/link";

export default async function ResultsPage() {
    const [rankings, stats] = await Promise.all([
        getCharacterRankings(),
        getVoteStats(),
    ]);

    return (
        <main className="min-h-screen p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <header className="mb-8">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
                    >
                        <ArrowLeftIcon />
                        <span>Back to game</span>
                    </Link>
                    <h1 className="text-3xl md:text-4xl font-bold">
                        <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            Rankings
                        </span>
                    </h1>
                </header>

                {/* Global Stats */}
                <section className="mb-8 p-6 bg-card rounded-2xl border border-border">
                    <h2 className="text-lg font-semibold mb-4">Global Stats</h2>
                    <div className="grid grid-cols-4 gap-4">
                        <StatCard label="Total Votes" value={stats.total} />
                        <StatCard
                            label="Smash"
                            value={stats.smash}
                            color="text-accent"
                        />
                        <StatCard
                            label="Pass"
                            value={stats.pass}
                            color="text-destructive"
                        />
                        <StatCard
                            label="Skip"
                            value={stats.kill}
                            color="text-muted-foreground"
                        />
                    </div>
                </section>

                {/* Character Rankings */}
                <section>
                    <h2 className="text-lg font-semibold mb-4">
                        Character Rankings
                        <span className="text-muted-foreground font-normal ml-2">
                            (by smash rate)
                        </span>
                    </h2>

                    {rankings.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>No votes yet. Start playing to see rankings!</p>
                            <Link
                                href="/"
                                className="inline-block mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-xl font-medium"
                            >
                                Start Playing
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {rankings.map((item, index) => (
                                <RankingCard
                                    key={item.character.id}
                                    rank={index + 1}
                                    character={item.character}
                                    smash={item.smash}
                                    pass={item.pass}
                                    kill={item.kill}
                                    smashRate={item.smashRate}
                                />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}

function StatCard({
    label,
    value,
    color,
}: {
    label: string;
    value: number;
    color?: string;
}) {
    return (
        <div className="text-center">
            <p className={`text-2xl md:text-3xl font-bold ${color || "text-foreground"}`}>
                {value.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
                {label}
            </p>
        </div>
    );
}

function RankingCard({
    rank,
    character,
    smash,
    pass,
    kill,
    smashRate,
}: {
    rank: number;
    character: {
        id: string;
        name: string;
        images: { imageUrl: string }[];
        anime: { title: string } | null;
    };
    smash: number;
    pass: number;
    kill: number;
    smashRate: number;
}) {
    const image = character.images?.[0]?.imageUrl;
    const total = smash + pass + kill;

    return (
        <div className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:border-primary/30 transition-colors">
            {/* Rank */}
            <div className="w-8 text-center">
                {rank <= 3 ? (
                    <span
                        className={`text-xl font-bold ${
                            rank === 1
                                ? "text-yellow-400"
                                : rank === 2
                                  ? "text-gray-400"
                                  : "text-amber-600"
                        }`}
                    >
                        {rank}
                    </span>
                ) : (
                    <span className="text-muted-foreground">{rank}</span>
                )}
            </div>

            {/* Image */}
            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                {image ? (
                    <Image
                        src={image}
                        alt={character.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                        ?
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{character.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                    {character.anime?.title}
                </p>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm">
                <div className="text-center">
                    <p className="font-bold text-accent">{smash}</p>
                    <p className="text-xs text-muted-foreground">Smash</p>
                </div>
                <div className="text-center">
                    <p className="font-bold text-destructive">{pass}</p>
                    <p className="text-xs text-muted-foreground">Pass</p>
                </div>
                <div className="text-center hidden md:block">
                    <p className="font-bold text-muted-foreground">{kill}</p>
                    <p className="text-xs text-muted-foreground">Skip</p>
                </div>
            </div>

            {/* Smash Rate */}
            <div className="w-16 text-right">
                <p className="font-bold text-primary">
                    {(smashRate * 100).toFixed(0)}%
                </p>
                <p className="text-xs text-muted-foreground">rate</p>
            </div>
        </div>
    );
}

function ArrowLeftIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
        </svg>
    );
}
