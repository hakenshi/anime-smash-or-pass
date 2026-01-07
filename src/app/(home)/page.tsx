import { Suspense } from "react";
import { SetupForm } from "@/components/setup/setup-form";
import { getAvailableAnimes, getAvailableGenders, getCharacterCount } from "@/app/actions";
import { PageTitle } from "@/components/ui/page-title";

export default function HomePage() {
    return (
        <main className="h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center p-4 overflow-hidden">
            {/* Page Title */}
            <PageTitle>Choose Your Fighters</PageTitle>

            {/* Setup Form */}
            <Suspense fallback={<SetupSkeleton />}>
                <SetupContent />
            </Suspense>
        </main>
    );
}

async function SetupContent() {
    const [availableAnimes, allGenders, totalCount] = await Promise.all([
        getAvailableAnimes(),
        getAvailableGenders(),
        getCharacterCount({}),
    ]);

    return (
        <SetupForm
            availableAnimes={availableAnimes}
            availableGenders={allGenders}
            totalCharacterCount={totalCount}
        />
    );
}

function SetupSkeleton() {
    return (
        <div className="w-full max-w-lg mx-auto">
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4 animate-pulse">
                <div className="h-5 w-24 bg-secondary rounded" />
                <div className="grid grid-cols-4 gap-1.5">
                    {[...Array(7)].map((_, i) => (
                        <div key={i} className="h-10 bg-secondary rounded-lg" />
                    ))}
                </div>
                <div className="h-4 w-32 bg-secondary rounded" />
                <div className="flex gap-4">
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-16 bg-secondary rounded" />
                        <div className="flex gap-1.5">
                            <div className="h-8 w-12 bg-secondary rounded-lg" />
                            <div className="h-8 w-16 bg-secondary rounded-lg" />
                            <div className="h-8 w-14 bg-secondary rounded-lg" />
                        </div>
                    </div>
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-12 bg-secondary rounded" />
                        <div className="flex gap-1.5">
                            <div className="h-8 w-10 bg-secondary rounded-lg" />
                            <div className="h-8 w-10 bg-secondary rounded-lg" />
                            <div className="h-8 w-10 bg-secondary rounded-lg" />
                        </div>
                    </div>
                </div>
                <div className="h-12 bg-primary/30 rounded-xl" />
            </div>
        </div>
    );
}
