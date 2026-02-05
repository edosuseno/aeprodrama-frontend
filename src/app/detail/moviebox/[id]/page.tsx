"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useMovieBoxDetail } from "@/hooks/useMovieBox";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Play, Calendar, Clock, Star, Download } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function MovieBoxDetailPage({ params }: PageProps) {
    const resolvedParams = use(params);
    const router = useRouter();
    const { toast } = useToast();
    const { data: detailRes, isLoading } = useMovieBoxDetail(resolvedParams.id);

    if (isLoading) {
        return <DetailSkeleton />;
    }

    const detail = detailRes?.data;
    if (!detail) return <div className="p-10 text-center">Film tidak ditemukan</div>;

    const isSeries = detail.type === "Series" || (detail.episodes && detail.episodes.length > 0);

    const handleWatch = (episodeId?: string) => {
        if (isSeries && !episodeId && detail.episodes?.[0]) {
            // If series and no specific episode clicked, watch first episode
            episodeId = detail.episodes[0].id; // Usually url or specific id
            // The episode.id from API might be a full URL or an ID.
            // We'll need to handle this in the watch page.
            // For now, let's assume we pass the index or id.
        }

        // Construct watch URL
        // We might need to pass the episode ID if it's a series
        let url = `/watch/moviebox/${resolvedParams.id}`;
        if (episodeId) {
            url += `?episodeId=${encodeURIComponent(episodeId)}`;
        }
        router.push(url);
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Backdrop / Header */}
            <div className="relative h-[40vh] md:h-[50vh] w-full overflow-hidden">
                <div className="absolute inset-0 bg-black/60 z-10" />
                <div
                    className="absolute inset-0 bg-cover bg-center blur-sm scale-110 opacity-50"
                    style={{ backgroundImage: `url(${detail.poster})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent z-20" />

                <div className="absolute top-4 left-4 z-50">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full bg-black/20 hover:bg-black/40 text-white">
                        <ArrowLeft className="w-6 h-6" />
                    </Button>
                </div>

                <div className="absolute bottom-0 left-0 right-0 z-30 p-4 md:p-8 container mx-auto flex flex-col md:flex-row gap-6 items-end">
                    <div className="shrink-0 w-32 md:w-48 aspect-[2/3] rounded-lg overflow-hidden shadow-2xl ring-2 ring-white/10 relative">
                        <Image
                            src={detail.poster}
                            alt={detail.title}
                            fill
                            className="object-cover"
                            unoptimized
                        />
                    </div>
                    <div className="flex-1 space-y-3 mb-2 text-center md:text-left">
                        <h1 className="text-2xl md:text-4xl font-bold text-white leading-tight font-display">{detail.title}</h1>

                        <div className="flex flex-wrap gap-2 justify-center md:justify-start items-center text-sm text-gray-300">
                            <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/20">{detail.quality || "HD"}</Badge>
                            {detail.rating && <div className="flex items-center gap-1"><Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /> <span>{detail.rating}</span></div>}
                            {detail.release && <div className="flex items-center gap-1"><Calendar className="w-4 h-4" /> <span>{detail.release}</span></div>}
                            {detail.duration && <div className="flex items-center gap-1"><Clock className="w-4 h-4" /> <span>{detail.duration}</span></div>}
                        </div>

                        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                            {detail.genre?.map((g) => (
                                <Badge key={g} variant="outline" className="border-white/20 text-white/80">{g}</Badge>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 md:px-8 mt-8 space-y-8">
                {/* Actions */}
                <div className="flex flex-col md:flex-row gap-4">
                    {!isSeries && (
                        <Button size="lg" onClick={() => handleWatch()} className="w-full md:w-auto font-bold text-lg h-12">
                            <Play className="w-5 h-5 mr-2 fill-current" /> Tonton Sekarang
                        </Button>
                    )}
                    {/* We could add a download button logic here if needed, triggering a toast or opening source */}
                </div>

                {/* Synopsis */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-l-4 border-primary pl-3">Sinopsis</h3>
                    <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                        {detail.synopsis}
                    </p>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/30 p-6 rounded-xl border border-white/5">
                    <div className="space-y-3">
                        <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className="text-muted-foreground">Sutradara</span>
                            <span className="font-medium">{detail.director || "-"}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className="text-muted-foreground">Negara</span>
                            <span className="font-medium">{detail.country || "-"}</span>
                        </div>
                    </div>
                    <div>
                        <span className="text-muted-foreground block mb-2">Pemeran</span>
                        <p className="text-sm font-medium leading-relaxed">{detail.cast?.join(", ") || "-"}</p>
                    </div>
                </div>

                {/* Episodes List (If Series) */}
                {isSeries && detail.episodes && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-l-4 border-primary pl-3">
                            Episode ({detail.episodes.length})
                        </h3>
                        <ScrollArea className="h-[300px] w-full rounded-md border p-4 bg-muted/20">
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                {detail.episodes.map((ep) => (
                                    <Button
                                        key={ep.id}
                                        variant="outline"
                                        className="h-auto py-3 px-2 flex flex-col gap-1 items-start hover:bg-primary hover:text-white transition-colors border-white/10"
                                        onClick={() => handleWatch(ep.id)}
                                    >
                                        <span className="text-xs opacity-70 line-clamp-1 w-full text-left">{ep.title}</span>
                                        <span className="font-bold flex items-center gap-1">
                                            <Play className="w-3 h-3" /> Tonton
                                        </span>
                                    </Button>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                )}

            </div>
        </div>
    );
}

function DetailSkeleton() {
    return (
        <div className="min-h-screen bg-background">
            <div className="h-[50vh] bg-muted animate-pulse" />
            <div className="container mx-auto px-4 -mt-20 relative z-10 space-y-6">
                <div className="flex flex-col md:flex-row gap-6 items-end">
                    <Skeleton className="w-32 h-48 rounded-lg" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                </div>
                <Skeleton className="h-12 w-40" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                </div>
            </div>
        </div>
    )
}
