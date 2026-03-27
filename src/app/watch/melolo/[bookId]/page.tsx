"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMeloloDetail } from "@/hooks/useMelolo";
import { UnifiedErrorDisplay } from "@/components/UnifiedErrorDisplay";

export default function MeloloRedirect() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.bookId as string;
  const { data, isLoading, error } = useMeloloDetail(bookId);

  useEffect(() => {
    const videoList = data?.data?.video_data?.video_list;
    if (videoList && videoList.length > 0) {
      const firstEpVid = videoList[0].vid;
      router.replace(`/watch/melolo/${bookId}/${firstEpVid}`);
    }
  }, [data, bookId, router]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <UnifiedErrorDisplay 
          title="Drama Tidak Ditemukan" 
          message="Maaf, video yang Anda cari tidak tersedia." 
          onRetry={() => router.push("/")} 
        />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
}
