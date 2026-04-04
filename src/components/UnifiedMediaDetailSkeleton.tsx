"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function UnifiedMediaDetailSkeleton() {
    return (
        <main className="min-h-screen pt-24 px-4 bg-black">
            <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
                {/* Back Button Skeleton */}
                <Skeleton className="h-6 w-24 bg-white/5 rounded-full" />

                <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
                    {/* Poster Skeleton */}
                    <div className="space-y-4">
                        <Skeleton className="aspect-[3/4.5] w-full max-w-[300px] mx-auto rounded-2xl bg-white/5" />
                    </div>

                    {/* Content Skeleton */}
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <Skeleton className="h-12 w-3/4 bg-white/5 rounded-xl" />
                            <div className="flex gap-3">
                                <Skeleton className="h-6 w-24 bg-white/5 rounded-full" />
                                <Skeleton className="h-6 w-32 bg-white/5 rounded-full" />
                            </div>
                        </div>

                        {/* Synopsis Card Skeleton */}
                        <div className="glass rounded-2xl p-6 border border-white/10 space-y-3 bg-white/5">
                            <Skeleton className="h-5 w-24 bg-white/10 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-full bg-white/10 rounded-full" />
                                <Skeleton className="h-4 w-5/6 bg-white/10 rounded-full" />
                                <Skeleton className="h-4 w-4/6 bg-white/10 rounded-full" />
                            </div>
                        </div>

                        {/* Button Skeleton */}
                        <Skeleton className="h-14 w-56 bg-white/10 rounded-full" />
                    </div>
                </div>
            </div>
        </main>
    );
}
