import { ChevronLeft, ChevronRight } from "lucide-react";

interface UnifiedVideoNavigationProps {
    currentEpisode: number;
    totalEpisodes: number;
    onPrev: () => void;
    onNext: () => void;
    isLoading?: boolean;
}

export function UnifiedVideoNavigation({
    currentEpisode,
    totalEpisodes,
    onPrev,
    onNext,
    isLoading = false
}: UnifiedVideoNavigationProps) {
    const hasPrev = currentEpisode > 1;
    const hasNext = currentEpisode < totalEpisodes;

    return (
        <div className="absolute bottom-20 md:bottom-12 left-0 right-0 z-40 pointer-events-none flex justify-center pb-safe-area-bottom">
            <div className="flex items-center gap-2 md:gap-6 pointer-events-auto bg-black/60 backdrop-blur-md px-3 py-1.5 md:px-6 md:py-3 rounded-full border border-white/10 shadow-lg transition-all scale-90 md:scale-100 origin-bottom">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (hasPrev) onPrev();
                    }}
                    disabled={!hasPrev || isLoading}
                    className="p-1.5 md:p-2 rounded-full text-white disabled:opacity-30 hover:bg-white/10 transition-colors"
                    aria-label="Episode Sebelumnya"
                >
                    <ChevronLeft className="w-4 h-4 md:w-6 md:h-6" />
                </button>

                <span className="text-white font-medium text-xs md:text-sm tabular-nums min-w-[60px] md:min-w-[80px] text-center select-none">
                    Ep {currentEpisode} / {totalEpisodes}
                </span>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (hasNext) onNext();
                    }}
                    disabled={!hasNext || isLoading}
                    className="p-1.5 md:p-2 rounded-full text-white disabled:opacity-30 hover:bg-white/10 transition-colors"
                    aria-label="Episode Selanjutnya"
                >
                    <ChevronRight className="w-4 h-4 md:w-6 md:h-6" />
                </button>
            </div>
        </div>
    );
}
