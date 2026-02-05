"use client";

import { useMovieBoxHome, useMovieBoxTrending, useMovieBoxPopular, useMovieBoxNowPlaying } from "@/hooks/useMovieBox";
import { UnifiedMediaCard } from "./UnifiedMediaCard";
import { UnifiedMediaCardSkeleton } from "./UnifiedMediaCardSkeleton";
import { ExploreMovieBox } from "./ExploreMovieBox";
import { Film, Trophy, Star, Play } from "lucide-react";

const GRID_CLASS = "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-9 gap-3 md:gap-5";

function MovieSectionSkeleton() {
    return (
        <section className="mt-8 space-y-4">
            <div className="h-7 w-48 bg-white/10 rounded-lg animate-pulse" />
            <div className={GRID_CLASS}>
                {Array.from({ length: 9 }).map((_, i) => (
                    <UnifiedMediaCardSkeleton key={i} />
                ))}
            </div>
        </section>
    );
}

function LatestSection() {
    const { data: home, isLoading } = useMovieBoxHome();

    if (isLoading) return <MovieSectionSkeleton />;

    const items = (home?.data || []).slice(0, 18);

    return (
        <section className="mt-8">
            <div className="flex items-center gap-2 mb-4">
                <Film className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold">Upload Terbaru</h2>
            </div>

            <div className={GRID_CLASS}>
                {items.map((movie: any, idx: number) => (
                    <UnifiedMediaCard
                        key={`${movie.id}-latest-${idx}`}
                        title={movie.title}
                        cover={movie.poster}
                        link={`/detail/moviebox/${movie.id}`}
                        episodes={movie.year ? parseInt(movie.year) : 0}
                        index={idx}
                        topRightBadge={movie.rating ? { text: `⭐ ${movie.rating}`, isTransparent: true } : null}
                    />
                ))}
            </div>
        </section>
    );
}

function TrendingSection() {
    const { data: trending, isLoading } = useMovieBoxTrending();

    if (isLoading) return <MovieSectionSkeleton />;

    const items = (trending?.data || []).slice(0, 18);

    return (
        <section className="mt-8">
            <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <h2 className="text-xl font-bold">Rating Tertinggi</h2>
            </div>

            <div className={GRID_CLASS}>
                {items.map((movie: any, idx: number) => (
                    <UnifiedMediaCard
                        key={`${movie.id}-trending-${idx}`}
                        title={movie.title}
                        cover={movie.poster}
                        link={`/detail/moviebox/${movie.id}`}
                        episodes={movie.year ? parseInt(movie.year) : 0}
                        index={idx}
                        topRightBadge={movie.rating ? { text: `⭐ ${movie.rating}`, isTransparent: true } : null}
                    />
                ))}
            </div>
        </section>
    );
}

function PopularSection() {
    const { data: popular, isLoading } = useMovieBoxPopular();

    if (isLoading) return <MovieSectionSkeleton />;

    const items = (popular?.data || []).slice(0, 18);

    return (
        <section className="mt-8">
            <div className="flex items-center gap-2 mb-4">
                <Star className="w-5 h-5 text-purple-500" />
                <h2 className="text-xl font-bold">Paling Populer</h2>
            </div>

            <div className={GRID_CLASS}>
                {items.map((movie: any, idx: number) => (
                    <UnifiedMediaCard
                        key={`${movie.id}-popular-${idx}`}
                        title={movie.title}
                        cover={movie.poster}
                        link={`/detail/moviebox/${movie.id}`}
                        episodes={movie.year ? parseInt(movie.year) : 0}
                        index={idx}
                        topRightBadge={movie.rating ? { text: `⭐ ${movie.rating}`, isTransparent: true } : null}
                    />
                ))}
            </div>
        </section>
    );
}

function NowPlayingSection() {
    const { data: nowPlaying, isLoading } = useMovieBoxNowPlaying();

    if (isLoading) return <MovieSectionSkeleton />;

    const items = (nowPlaying?.data || []).slice(0, 18);

    return (
        <section className="mt-8">
            <div className="flex items-center gap-2 mb-4">
                <Play className="w-5 h-5 text-green-500" />
                <h2 className="text-xl font-bold">Sedang Tayang</h2>
            </div>

            <div className={GRID_CLASS}>
                {items.map((movie: any, idx: number) => (
                    <UnifiedMediaCard
                        key={`${movie.id}-nowplaying-${idx}`}
                        title={movie.title}
                        cover={movie.poster}
                        link={`/detail/moviebox/${movie.id}`}
                        episodes={movie.year ? parseInt(movie.year) : 0}
                        index={idx}
                        topRightBadge={movie.rating ? { text: `Now`, color: "#22c55e" } : null}
                    />
                ))}
            </div>
        </section>
    );
}

export function MovieBoxHome() {
    return (
        <div className="space-y-12 animate-in fade-in duration-500 pb-20">
            <LatestSection />
            <PopularSection />
            <NowPlayingSection />
            <TrendingSection />
            <ExploreMovieBox />
        </div>
    );
}
