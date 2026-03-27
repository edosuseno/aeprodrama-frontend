"use client";

import { useState, useEffect } from "react";
import { useHistoryStore } from "@/hooks/useHistory";
import { usePlatform } from "@/hooks/usePlatform";
import { cn } from "@/lib/utils";
import { Clock, Trash2, Play, ChevronLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale/id";

export default function HistoryPage() {
  const { items, removeFromHistory, clearHistory } = useHistoryStore();
  const { setPlatform } = usePlatform();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Clock className="w-8 h-8 animate-spin text-primary opacity-20" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full glass-strong border-b border-border/50 px-4 py-4 md:px-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-muted rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-bold font-display flex items-center gap-2">
              <Clock className="w-6 h-6 text-primary" />
              Riwayat Nonton
            </h1>
            <p className="text-xs text-muted-foreground">Terakhir dilihat di browser Bapak</p>
          </div>
        </div>

        {items.length > 0 && (
          <button 
            onClick={() => {
              if (confirm("Hapus semua riwayat nonton Bapak?")) {
                clearHistory();
              }
            }}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-500/10 rounded-xl transition-all uppercase tracking-wider"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Bersihkan</span>
          </button>
        )}
      </header>

      <main className="max-w-[1600px] mx-auto px-4 md:px-10 py-8">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center animate-fade-up">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
              <Clock className="w-10 h-10 text-muted-foreground opacity-20" />
            </div>
            <h2 className="text-xl font-bold mb-2">Belum ada riwayat</h2>
            <p className="text-muted-foreground max-w-xs mb-8">
              Bapak belum menonton video apapun. Mulai nonton sekarang dan riwayatnya akan muncul di sini.
            </p>
            <Link 
              href="/"
              className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 transition-all"
            >
              Jelajahi Drama
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map((item, index) => {
              if (!item || !item.id) return null;

              const posterUrl = item.poster || "/placeholder-poster.png"; 
              const dramaTitle = item.title || "Tontonan Baru";

              return (
                <div 
                  key={`${item.id}-${index}`}
                  className="group relative bg-card/40 border border-border/50 rounded-2xl overflow-hidden hover:bg-card/60 transition-all duration-300 animate-fade-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex gap-4 p-3">
                    {/* Poster */}
                    <Link 
                      href={item.link || "/"}
                      className="relative w-24 h-32 md:w-28 md:h-38 rounded-xl overflow-hidden shadow-lg shrink-0"
                    >
                      <Image
                        src={posterUrl}
                        alt={dramaTitle}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <Play className="w-8 h-8 text-white fill-white shadow-glow" />
                      </div>
                    </Link>

                    {/* Info */}
                    <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[10px] font-black py-0.5 px-2 bg-primary/20 text-primary rounded-full uppercase tracking-widest">
                            {item.platform || "Drama"}
                          </span>
                          <button 
                            onClick={() => removeFromHistory(item.id)}
                            className="text-muted-foreground hover:text-red-500 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <h3 className="font-bold text-base mt-2 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                          {dramaTitle}
                        </h3>
                        {item.episodeNumber && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Episode {item.episodeNumber}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <span className="text-[10px] text-muted-foreground">
                          {item.lastWatchedAt ? formatDistanceToNow(item.lastWatchedAt, { addSuffix: true, locale: id }) : "Baru saja"}
                        </span>
                        <Link
                          href={item.link || "/"}
                          onClick={() => item.platform && setPlatform(item.platform as any)}
                          className="flex items-center gap-1 text-xs font-bold text-primary group/link"
                        >
                          Lanjut
                          <Play className="w-3 h-3 fill-primary transform group-hover/link:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
