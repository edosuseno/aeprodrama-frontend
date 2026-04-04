"use client";

import { useParams } from "next/navigation";
import { useDotDramaDetail } from "@/hooks/useDotDrama";
import { UnifiedMediaDetail } from "@/components/UnifiedMediaDetail";
import { UnifiedMediaDetailSkeleton } from "@/components/UnifiedMediaDetailSkeleton";
import { UnifiedErrorDisplay } from "@/components/UnifiedErrorDisplay";

export default function DotDramaDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { data: drama, isLoading, isError, refetch } = useDotDramaDetail(id || "");

    if (isLoading) {
        return <UnifiedMediaDetailSkeleton />;
    }

    if (isError || !drama) {
        return (
            <UnifiedErrorDisplay
                title="Gagal Memuat Detail Dot Drama"
                message="Terjadi kesalahan saat mengambil informasi film. Silakan coba lagi."
                onRetry={() => refetch()}
            />
        );
    }

    return (
        <UnifiedMediaDetail
            title={drama.title}
            cover={drama.cover}
            description={drama.description}
            episodes={drama.episodes.map(ep => ({
                id: ep.id,
                index: ep.index,
                title: ep.title,
                videoAddress: ep.videoAddress
            }))}
            platform="dotdrama"
            platformId={drama.id}
            totalEpisodes={drama.totalEpisodes}
            provider="dotdrama"
        />
    );
}
