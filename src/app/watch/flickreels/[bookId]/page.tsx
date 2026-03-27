"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useFlickReelsDetail } from "@/hooks/useFlickReels";
import { UnifiedErrorDisplay } from "@/components/UnifiedErrorDisplay";

export default function FlickReelsRedirect() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.bookId as string;
  const { data, isLoading, error } = useFlickReelsDetail(bookId);

  useEffect(() => {
    if (data?.episodes && data.episodes.length > 0) {
      const firstEp = data.episodes[0];
      router.replace(`/watch/flickreels/${bookId}/${firstEp.id}`);
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
