"use client";

import { usePlatform } from "@/hooks/usePlatform";
import { Play, Calendar, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UnifiedErrorDisplay } from "./UnifiedErrorDisplay";

interface Episode {
    id: string;
    index: number;
    title: string;
    videoAddress: string;
}

interface UnifiedMediaDetailProps {
    title: string;
    cover: string;
    description: string;
    episodes: Episode[];
    platform: string;
    platformId: string;
    totalEpisodes: number;
    provider: string;
}

export function UnifiedMediaDetail({
    title,
    cover,
    description,
    episodes,
    platform,
    platformId,
    totalEpisodes,
    provider
}: UnifiedMediaDetailProps) {
    const router = useRouter();
    const { setPlatform, getPlatformInfo } = usePlatform();
    const platformInfo = getPlatformInfo(platform as any);

    const handleBack = () => {
        setPlatform(platform as any);
        router.push("/");
    };

    return (
        <main className="min-h-screen pt-20">
            <div className="relative">
                <div className="absolute inset-0 overflow-hidden">
                    <img
                        src={cover ? (cover.includes('wsrv.nl') || cover.includes('/api/proxy') || cover.includes('/api/image-proxy') || cover.includes('flextv.cc') ? cover : `/api/image-proxy?url=${encodeURIComponent(cover)}`) : ""}
                        alt=""
                        className="w-full h-full object-cover opacity-20 blur-3xl scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />
                </div>

                <div className="relative max-w-7xl mx-auto px-4 py-8">
                    <Link
                        href="/"
                        onClick={(e) => {
                            e.preventDefault();
                            handleBack();
                        }}
                        className="flex items-center gap-2 text-white/90 hover:text-white transition-colors p-2 -ml-2 rounded-full hover:bg-white/10 mb-6 w-fit"
                    >
                        <ChevronLeft className="w-6 h-6" />
                        <div className="flex flex-col -gap-1">
                            <span className="text-primary font-bold hidden sm:inline shadow-black drop-shadow-md leading-none">DRACINDO</span>
                            <span className="text-[10px] text-white/70 hidden sm:inline leading-none uppercase tracking-tighter">Pusat Drama</span>
                        </div>
                    </Link>

                    <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
                        <div className="relative group">
                            <img
                                src={cover ? (cover.includes('wsrv.nl') || cover.includes('/api/proxy') || cover.includes('/api/image-proxy') || cover.includes('flextv.cc') ? cover : `/api/image-proxy?url=${encodeURIComponent(cover)}`) : ""}
                                alt={title}
                                className="w-full max-w-[300px] mx-auto rounded-2xl shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]"
                            />
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-8">
                                <Link
                                    href={`/watch/${platform}/${platformId}`}
                                    className="px-8 py-3 rounded-full bg-primary text-primary-foreground font-semibold flex items-center gap-2 hover:scale-105 transition-transform shadow-lg"
                                >
                                    <Play className="w-5 h-5 fill-current" />
                                    Tonton Sekarang
                                </Link>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h1 className="text-3xl md:text-5xl font-bold font-display gradient-text mb-4 leading-tight">
                                    {title}
                                </h1>

                                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                                        <Play className="w-4 h-4 text-primary" />
                                        <span>{totalEpisodes} Episode</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                                            {platformInfo?.name || provider}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="glass rounded-2xl p-6 border border-white/10">
                                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                                    <span className="w-1 h-5 bg-primary rounded-full" />
                                    Sinopsis
                                </h3>
                                <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                                    {description || "Nikmati drama pendek berkualitas tinggi secara eksklusif hanya di DRACINDO Pusat Drama."}
                                </p>
                            </div>

                            <Link
                                href={`/watch/${platform}/${platformId}`}
                                className="inline-flex items-center gap-3 px-10 py-4 rounded-full font-bold text-primary-foreground transition-all hover:scale-105 shadow-xl hover:shadow-primary/20"
                                style={{ background: "var(--gradient-primary)" }}
                            >
                                <Play className="w-6 h-6 fill-current" />
                                Mulai Menonton
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
