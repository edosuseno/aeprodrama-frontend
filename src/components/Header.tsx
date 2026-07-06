"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { Search, X, Play, Menu } from "lucide-react";
import { useSearchDramas } from "@/hooks/useDramas";
import { useReelShortSearch } from "@/hooks/useReelShort";
import { useNetShortSearch } from "@/hooks/useNetShort";
import { useMeloloSearch } from "@/hooks/useMelolo";
import { useFlickReelsSearch } from "@/hooks/useFlickReels";
import { useFreeReelsSearch } from "@/hooks/useFreeReels";
import { useMovieBoxSearch } from "@/hooks/useMovieBox";
import { useShortMaxSearch } from "@/hooks/useShortMax";
import { useStardustTVSearch } from "@/hooks/useStardustTV";
import { useIdrama2Search } from "@/hooks/useIdrama2";
import { useDramaWaveSearch } from "@/hooks/useDramaWave";
import { useDrmanovaSearch } from "@/hooks/useDrmanova";
import { useVeloloSearch } from "@/hooks/useVelolo";
import { useDotDramaSearch } from "@/hooks/useDotDrama";
import { useGoodShortSearch } from "@/hooks/useGoodShort";
import { useMeloShortSearch } from "@/hooks/useMeloShort";
import { usePlatform } from "@/hooks/usePlatform";
import { useDebounce } from "@/hooks/useDebounce";
import { usePathname } from "next/navigation";

import { useSidebarStore } from "@/hooks/useSidebar";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();
  const { isExpanded, toggleSidebar } = useSidebarStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 300);
  const normalizedQuery = debouncedQuery.trim();

  // Listen for global openSearch event from Mobile Nav
  React.useEffect(() => {
    const handleOpenSearch = () => setSearchOpen(true);
    window.addEventListener('openSearch', handleOpenSearch);
    return () => window.removeEventListener('openSearch', handleOpenSearch);
  }, []);

  // Platform context
  const { isDramaBox, isReelShort, isNetShort, isShortMax, isMelolo, isFlickReels, isFreeReels, isMovieBox, isStardustTV, isDramaWave, isDramaNova, isVelolo, isDotDrama, isGoodShort, isMeloShort, isIdrama2, platformInfo, setPlatform } = usePlatform();

  // Search based on platform
  const { data: dramaBoxResults, isLoading: isSearchingDramaBox } = useSearchDramas(
    isDramaBox ? normalizedQuery : ""
  );
  const { data: reelShortResults, isLoading: isSearchingReelShort } = useReelShortSearch(
    isReelShort ? normalizedQuery : ""
  );
  const { data: netShortResults, isLoading: isSearchingNetShort } = useNetShortSearch(
    isNetShort ? normalizedQuery : ""
  );
  const { data: shortMaxResults, isLoading: isSearchingShortMax } = useShortMaxSearch(
    isShortMax ? normalizedQuery : ""
  );
  const { data: meloloResults, isLoading: isSearchingMelolo } = useMeloloSearch(
    isMelolo ? normalizedQuery : ""
  );
  const { data: flickReelsResults, isLoading: isSearchingFlickReels } = useFlickReelsSearch(
    isFlickReels ? normalizedQuery : ""
  );
  const { data: freeReelsResults, isLoading: isSearchingFreeReels } = useFreeReelsSearch(
    isFreeReels ? normalizedQuery : ""
  );
  const { data: movieBoxResults, isLoading: isSearchingMovieBox } = useMovieBoxSearch(
    isMovieBox ? normalizedQuery : ""
  );
  const { data: stardustTVResults, isLoading: isSearchingStardustTV } = useStardustTVSearch(
    isStardustTV ? normalizedQuery : ""
  );
  const { data: idrama2Results, isLoading: isSearchingIdrama2 } = useIdrama2Search(
    isIdrama2 ? normalizedQuery : ""
  );
  const { data: dramaWaveResults, isLoading: isSearchingDramaWave } = useDramaWaveSearch(
    isDramaWave ? normalizedQuery : ""
  );
  const { data: dramanovaResults, isLoading: isSearchingDramanova } = useDrmanovaSearch(
    isDramaNova ? normalizedQuery : ""
  );
  const { data: veloloResults, isLoading: isSearchingVelolo } = useVeloloSearch(
    isVelolo ? normalizedQuery : ""
  );
  const { data: dotDramaResults, isLoading: isSearchingDotDrama } = useDotDramaSearch(
    isDotDrama ? normalizedQuery : ""
  );
  const { data: goodShortResults, isLoading: isSearchingGoodShort } = useGoodShortSearch(
    isGoodShort ? normalizedQuery : ""
  );
  const { data: meloShortResults, isLoading: isSearchingMeloShort } = useMeloShortSearch(
    isMeloShort ? normalizedQuery : ""
  );

  const isSearching = isDramaBox
    ? isSearchingDramaBox
    : isReelShort
      ? isSearchingReelShort
      : isNetShort
        ? isSearchingNetShort
        : isShortMax
          ? isSearchingShortMax
          : isMelolo
            ? isSearchingMelolo
            : isFlickReels
              ? isSearchingFlickReels
              : isFreeReels
                ? isSearchingFreeReels
                : isStardustTV
                  ? isSearchingStardustTV
                  : isIdrama2
                    ? isSearchingIdrama2
                    : isDramaWave
                    ? isSearchingDramaWave
                    : isDramaNova
                      ? isSearchingDramanova
                      : isVelolo
                        ? isSearchingVelolo
                          : isDotDrama
                            ? isSearchingDotDrama
                            : isGoodShort
                              ? isSearchingGoodShort
                              : isMeloShort
                                ? isSearchingMeloShort
                                : isSearchingMovieBox;

  // Search results processing
  const searchResults: any[] = (isDramaBox
    ? dramaBoxResults
    : isReelShort
      ? (Array.isArray(reelShortResults) ? reelShortResults : (reelShortResults as any)?.data)
      : isNetShort
        ? netShortResults?.data
        : isShortMax
          ? shortMaxResults
          : isMelolo
            ? (meloloResults as any)?.search_data?.flatMap((item: any) => item.books || []) || []
            : isFlickReels
              ? flickReelsResults?.data
              : isFreeReels
                ? freeReelsResults
                : isStardustTV
                  ? stardustTVResults
                  : isIdrama2
                    ? idrama2Results
                    : isDramaWave
                    ? dramaWaveResults
                    : isDramaNova
                      ? dramanovaResults
                      : isVelolo
                        ? veloloResults
                          : isDotDrama
                            ? dotDramaResults
                            : isGoodShort
                              ? goodShortResults
                              : isMeloShort
                                ? meloShortResults
                                : movieBoxResults?.data) || [];

  const handleSearchClose = () => {
    setSearchOpen(false);
    setSearchQuery("");
  };

  // Hide header on watch pages for immersive video experience
  if (pathname?.startsWith("/watch")) {
    return null;
  }

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-[70] bg-background border-b border-border transition-all duration-300 ease-in-out"
    )}>
      <div className="w-full px-4 md:px-3">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-0 md:gap-2">
            {/* Sidebar Toggle - Desktop Only */}
            <button
              onClick={toggleSidebar}
              className="hidden md:flex p-3 rounded-xl hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Toggle Sidebar"
            >
              <Menu className={cn("w-6 h-6 transition-transform duration-300", isExpanded ? "rotate-180" : "rotate-0")} />
            </button>

            {/* Logo */}
            <Link href="/" onClick={() => setPlatform("home")} className="flex items-center gap-2.5 px-2 md:px-0 group">
              <img
                src="/icon.png"
                alt="DRACINDO Logo"
                className="w-10 h-10 rounded-xl group-hover:scale-110 transition-transform duration-300"
              />
              <div className="flex flex-col -gap-1">
                <span className="font-display font-bold text-lg leading-none gradient-text tracking-wide">
                  DRACINDO
                </span>
                <span className="text-[10px] font-medium text-muted-foreground leading-none tracking-[0.2em]">
                  PUSAT DRAMA
                </span>
              </div>
            </Link>
          </div>

          {/* Search Button Only - No Nav Links */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2.5 rounded-xl hover:bg-muted/50 transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Search Overlay (Portal) */}
      {searchOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 bg-background z-[9999] overflow-hidden">
            <div className="container mx-auto px-4 py-6 h-[100dvh] flex flex-col">
              <div className="flex items-center gap-4 mb-6 flex-shrink-0">
                <div className="flex-1 relative min-w-0">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Cari drama di ${platformInfo.name}...`}
                    className="search-input pl-12"
                    autoFocus
                  />
                </div>
                <button
                  onClick={handleSearchClose}
                  className="p-3 rounded-xl hover:bg-muted/50 transition-colors flex-shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Platform indicator */}
              <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                <span>Mencari di:</span>
                <span className="px-2 py-1 rounded-full bg-primary/20 text-primary font-medium">
                  {platformInfo.name}
                </span>
              </div>

              {/* Search Results */}
              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
                {isSearching && normalizedQuery && (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                {/* DramaBox Results */}
                {isDramaBox && searchResults && searchResults.length > 0 && (
                  <div className="grid gap-3">
                    {searchResults.map((drama: any, index: number) => (
                      <Link
                        key={drama.bookId}
                        href={`/detail/dramabox/${drama.bookId}`}
                        onClick={handleSearchClose}
                        className="flex gap-4 p-4 rounded-2xl bg-card hover:bg-muted transition-all text-left animate-fade-up overflow-hidden"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <img
                          src={drama.cover}
                          alt={drama.bookName}
                          className="w-16 h-24 object-cover rounded-xl flex-shrink-0"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display font-semibold text-foreground truncate">{drama.bookName}</h3>
                          {drama.protagonist && (
                            <p className="text-sm text-muted-foreground mt-1 truncate">{drama.protagonist}</p>
                          )}
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                            {drama.introduction}
                          </p>
                          {drama.tagNames && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {drama.tagNames.slice(0, 3).map((tag: string) => (
                                <span key={tag} className="tag-pill text-[10px]">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* ReelShort Results */}
                {isReelShort && searchResults && searchResults.length > 0 && (
                  <div className="grid gap-3">
                    {searchResults.map((book: any, index: number) => (
                      <Link
                        key={book.book_id}
                        href={`/detail/reelshort/${book.book_id}`}
                        onClick={handleSearchClose}
                        className="flex gap-4 p-4 rounded-2xl bg-card hover:bg-muted transition-all text-left animate-fade-up overflow-hidden"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <img
                          src={book.book_pic}
                          alt={book.book_title}
                          className="w-16 h-24 object-cover rounded-xl flex-shrink-0"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display font-semibold text-foreground truncate">{book.book_title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                            {book.special_desc}
                          </p>
                          {book.theme && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {book.theme.slice(0, 3).map((tag: string, idx: number) => (
                                <span key={idx} className="tag-pill text-[10px]">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          {book.book_mark?.text && (
                            <span
                              className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold"
                              style={{
                                backgroundColor: book.book_mark.color || "#E52E2E",
                                color: book.book_mark.text_color || "#FFFFFF",
                              }}
                            >
                              {book.book_mark.text}
                            </span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* NetShort Results */}
                {isNetShort && searchResults && searchResults.length > 0 && (
                  <div className="grid gap-3">
                    {searchResults.map((drama: any, index: number) => (
                      <Link
                        key={drama.shortPlayId}
                        href={`/detail/netshort/${drama.shortPlayId}`}
                        onClick={handleSearchClose}
                        className="flex gap-4 p-4 rounded-2xl bg-card hover:bg-muted transition-all text-left animate-fade-up overflow-hidden"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <img
                          src={drama.cover}
                          alt={drama.title}
                          className="w-16 h-24 object-cover rounded-xl flex-shrink-0"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display font-semibold text-foreground truncate">{drama.title}</h3>
                          {drama.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                              {drama.description}
                            </p>
                          )}
                          {drama.labels && Array.isArray(drama.labels) && drama.labels.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {drama.labels.slice(0, 3).map((tag: string, idx: number) => (
                                <span key={idx} className="tag-pill text-[10px]">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          {drama.heatScore && (
                            <span className="inline-block mt-2 text-[10px] text-muted-foreground">
                              {drama.heatScore}
                            </span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* ShortMax Results */}
                {isShortMax && searchResults && searchResults.length > 0 && (
                  <div className="grid gap-3">
                    {searchResults.map((drama: any, index: number) => (
                      <Link
                        key={drama.shortPlayId}
                        href={`/detail/shortmax/${drama.shortPlayId}`}
                        onClick={handleSearchClose}
                        className="flex gap-4 p-4 rounded-2xl bg-card hover:bg-muted transition-all text-left animate-fade-up overflow-hidden"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <img
                          src={drama.cover}
                          alt={drama.title}
                          className="w-16 h-24 object-cover rounded-xl flex-shrink-0"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display font-semibold text-foreground truncate">{drama.title}</h3>
                          {drama.labels && Array.isArray(drama.labels) && drama.labels.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {drama.labels.slice(0, 3).map((tag: string, idx: number) => (
                                <span key={idx} className="tag-pill text-[10px]">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Melolo Results */}
                {isMelolo && searchResults && searchResults.length > 0 && (
                  <div className="grid gap-3">
                    {searchResults.map((book: any, index: number) => (
                      <Link
                        key={book.book_id}
                        href={`/detail/melolo/${book.book_id}`}
                        onClick={handleSearchClose}
                        className="flex gap-4 p-4 rounded-2xl bg-card hover:bg-muted transition-all text-left animate-fade-up overflow-hidden"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="w-16 h-24 bg-muted rounded-xl flex-shrink-0 overflow-hidden">
                          {book.thumb_url ? (
                            <img
                              src={book.thumb_url.includes(".heic")
                                ? `https://wsrv.nl/?url=${encodeURIComponent(book.thumb_url)}&output=jpg`
                                : book.thumb_url}
                              alt={book.book_name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted">
                              <span className="text-xs text-muted-foreground">No Img</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display font-semibold text-foreground truncate">{book.book_name}</h3>
                          {book.abstract && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                              {book.abstract}
                            </p>
                          )}
                          {book.stat_infos && book.stat_infos.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              <span className="tag-pill text-[10px]">
                                {book.stat_infos[0]}
                              </span>
                            </div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* FlickReels Results */}
                {isFlickReels && searchResults && searchResults.length > 0 && (
                  <div className="grid gap-3">
                    {searchResults.map((book: any, index: number) => (
                      <Link
                        key={book.playlet_id}
                        href={`/detail/flickreels/${book.playlet_id}`}
                        onClick={handleSearchClose}
                        className="flex gap-4 p-4 rounded-2xl bg-card hover:bg-muted transition-all text-left animate-fade-up overflow-hidden"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <img
                          src={book.cover}
                          alt={book.title}
                          className="w-16 h-24 object-cover rounded-xl flex-shrink-0"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display font-semibold text-foreground truncate">{book.title}</h3>
                          {book.introduce && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                              {book.introduce}
                            </p>
                          )}
                          {book.tag_list && book.tag_list.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {book.tag_list.slice(0, 3).map((tag: any, idx: number) => (
                                <span key={idx} className="tag-pill text-[10px]">
                                  {typeof tag === 'string' ? tag : tag.tag_name || tag.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* FreeReels Results */}
                {isFreeReels && searchResults && searchResults.length > 0 && (
                  <div className="grid gap-3">
                    {searchResults.map((book: any, index: number) => (
                      <Link
                        key={book.key}
                        href={`/detail/freereels/${book.key}`}
                        onClick={handleSearchClose}
                        className="flex gap-4 p-4 rounded-2xl bg-card hover:bg-muted transition-all text-left animate-fade-up overflow-hidden"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <img
                          src={book.cover}
                          alt={book.title}
                          className="w-16 h-24 object-cover rounded-xl flex-shrink-0"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display font-semibold text-foreground truncate">{book.title}</h3>
                          {book.desc && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                              {book.desc}
                            </p>
                          )}
                          {book.content_tags && book.content_tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {book.content_tags.slice(0, 3).map((tag: string, idx: number) => (
                                <span key={idx} className="tag-pill text-[10px]">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* MovieBox Results */}
                {isMovieBox && searchResults && searchResults.length > 0 && (
                  <div className="grid gap-3">
                    {searchResults.map((movie: any, index: number) => (
                      <Link
                        key={movie.id}
                        href={`/detail/moviebox/${movie.id}`}
                        onClick={handleSearchClose}
                        className="flex gap-4 p-4 rounded-2xl bg-card hover:bg-muted transition-all text-left animate-fade-up overflow-hidden"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <img
                          src={movie.poster}
                          alt={movie.title}
                          className="w-16 h-24 object-cover rounded-xl flex-shrink-0"
                          loading="lazy"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display font-semibold text-foreground truncate">{movie.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            {movie.rating && (
                              <span className="text-xs text-yellow-500 font-bold">⭐ {movie.rating}</span>
                            )}
                            {movie.year && (
                              <span className="text-xs text-muted-foreground">{movie.year}</span>
                            )}
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold uppercase tracking-wider">
                              {movie.type || 'Movie'}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                            {movie.synopsis}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* StardustTV Results */}
                {isStardustTV && searchResults && searchResults.length > 0 && (
                  <div className="grid gap-3">
                    {searchResults.map((drama: any, index: number) => (
                      <Link
                        key={drama.id || drama.shortPlayId}
                        href={`/detail/stardusttv/${drama.id || drama.shortPlayId}`}
                        onClick={handleSearchClose}
                        className="flex gap-4 p-4 rounded-2xl bg-card hover:bg-muted transition-all text-left animate-fade-up overflow-hidden"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <img
                          src={drama.poster || drama.image}
                          alt={drama.title || drama.name}
                          className="w-16 h-24 object-cover rounded-xl flex-shrink-0"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display font-semibold text-foreground truncate">{drama.title || drama.name}</h3>
                          {drama.intro || drama.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                              {drama.intro || drama.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            <span className="tag-pill text-[10px]">
                              {drama.totalEpisodes || drama.chapterCount || 0} Episodes
                            </span>
                            {drama.badge && (
                              <span className="tag-pill text-[10px] bg-primary/20 text-primary">
                                {drama.badge}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* iDrama Results */}
                {isIdrama2 && searchResults && searchResults.length > 0 && (
                  <div className="grid gap-3">
                    {searchResults.map((drama: any, index: number) => (
                      <Link
                        key={drama.id}
                        href={`/detail/idrama2/${drama.id}`}
                        onClick={handleSearchClose}
                        className="flex gap-4 p-4 rounded-2xl bg-card hover:bg-muted transition-all text-left animate-fade-up overflow-hidden"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <img
                          src={drama.cover || drama.book_pic}
                          alt={drama.title || drama.book_title}
                          className="w-16 h-24 object-cover rounded-xl flex-shrink-0"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display font-semibold text-foreground truncate">{drama.title || drama.book_title}</h3>
                          <div className="mt-2">
                            <span className="tag-pill text-[10px] bg-primary/20 text-primary capitalize">
                              iDrama
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* DramaWave Results */}
                {isDramaWave && searchResults && searchResults.length > 0 && (
                  <div className="grid gap-3">
                    {searchResults.map((drama: any, index: number) => (
                      <Link
                        key={drama.shortPlayId}
                        href={`/detail/dramawave/${drama.shortPlayId}`}
                        onClick={handleSearchClose}
                        className="flex gap-4 p-4 rounded-2xl bg-card hover:bg-muted transition-all text-left animate-fade-up overflow-hidden"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <img
                          src={drama.shortPlayCover || drama.cover}
                          alt={drama.shortPlayName}
                          className="w-16 h-24 object-cover rounded-xl flex-shrink-0"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display font-semibold text-foreground truncate">{drama.shortPlayName}</h3>
                          {drama.tags && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {drama.tags.slice(0, 3).map((tag: string, idx: number) => (
                                <span key={idx} className="tag-pill text-[10px]">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="mt-2">
                            <span className="tag-pill text-[10px]">
                              {drama.chapterCount || 0} Episodes
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* DramaNova Results */}
                {isDramaNova && searchResults && searchResults.length > 0 && (
                  <div className="grid gap-3">
                    {searchResults.map((drama: any, index: number) => (
                      <Link
                        key={drama.id}
                        href={`/detail/dramanova/${drama.id}`}
                        onClick={handleSearchClose}
                        className="flex gap-4 p-4 rounded-2xl bg-card hover:bg-muted transition-all text-left animate-fade-up overflow-hidden"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <img
                          src={drama.cover}
                          alt={drama.title}
                          className="w-16 h-24 object-cover rounded-xl flex-shrink-0"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display font-semibold text-foreground truncate">{drama.title}</h3>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            <span className="tag-pill text-[10px]">
                              {drama.chapterCount || 0} Episodes
                            </span>
                            {drama.provider && (
                              <span className="tag-pill text-[10px] bg-primary/20 text-primary capitalize">
                                {drama.provider}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Velolo Results */}
                {isVelolo && searchResults && searchResults.length > 0 && (
                  <div className="grid gap-3">
                    {searchResults.map((drama: any, index: number) => (
                      <Link
                        key={drama.id}
                        href={`/detail/velolo/${drama.id}`}
                        onClick={handleSearchClose}
                        className="flex gap-4 p-4 rounded-2xl bg-card hover:bg-muted transition-all text-left animate-fade-up overflow-hidden"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <img
                          src={drama.cover}
                          alt={drama.title}
                          className="w-16 h-24 object-cover rounded-xl flex-shrink-0"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display font-semibold text-foreground truncate">{drama.title}</h3>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            <span className="tag-pill text-[10px]">
                              {drama.chapterCount || 0} Episodes
                            </span>
                            {drama.provider && (
                              <span className="tag-pill text-[10px] bg-primary/20 text-primary capitalize">
                                {drama.provider}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}


                {/* Dot Drama Results */}
                {isDotDrama && searchResults && searchResults.length > 0 && (
                  <div className="grid gap-3">
                    {searchResults.map((drama: any, index: number) => (
                      <Link
                        key={drama.id}
                        href={`/detail/dotdrama/${drama.id}`}
                        onClick={handleSearchClose}
                        className="flex gap-4 p-4 rounded-2xl bg-card hover:bg-muted transition-all text-left animate-fade-up overflow-hidden"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <img
                          src={drama.cover}
                          alt={drama.title}
                          className="w-16 h-24 object-cover rounded-xl flex-shrink-0"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display font-semibold text-foreground truncate">{drama.title}</h3>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            <span className="tag-pill text-[10px]">
                              {drama.chapterCount || drama.totalEpisodes || 0} Episodes
                            </span>
                            {drama.provider && (
                              <span className="tag-pill text-[10px] bg-primary/20 text-primary capitalize">
                                Dot Drama
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* GoodShort Results */}
                {isGoodShort && searchResults && searchResults.length > 0 && (
                  <div className="grid gap-3">
                    {searchResults.map((drama: any, index: number) => (
                      <Link
                        key={drama.id}
                        href={`/detail/goodshort/${drama.id}`}
                        onClick={handleSearchClose}
                        className="flex gap-4 p-4 rounded-2xl bg-card hover:bg-muted transition-all text-left animate-fade-up overflow-hidden"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <img
                          src={drama.cover}
                          alt={drama.title}
                          className="w-16 h-24 object-cover rounded-xl flex-shrink-0"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display font-semibold text-foreground truncate">{drama.title}</h3>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {drama.provider && (
                              <span className="tag-pill text-[10px] bg-primary/20 text-primary capitalize">
                                GoodShort
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* MeloShort Results */}
                {isMeloShort && searchResults && searchResults.length > 0 && (
                  <div className="grid gap-3">
                    {searchResults.map((drama: any, index: number) => (
                      <Link
                        key={drama.id}
                        href={`/detail/meloshort/${drama.id}`}
                        onClick={handleSearchClose}
                        className="flex gap-4 p-4 rounded-2xl bg-card hover:bg-muted transition-all text-left animate-fade-up overflow-hidden"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <img
                          src={drama.cover}
                          alt={drama.title}
                          className="w-16 h-24 object-cover rounded-xl flex-shrink-0"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display font-semibold text-foreground truncate">{drama.title}</h3>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {drama.chapterCount ? (
                                <span className="tag-pill text-[10px]">
                                  {drama.chapterCount} Episodes
                                </span>
                            ) : null}
                            {drama.provider && (
                              <span className="tag-pill text-[10px] bg-primary/20 text-primary capitalize">
                                MeloShort
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {searchResults && searchResults.length === 0 && normalizedQuery && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Tidak ada hasil untuk "{normalizedQuery}" di {platformInfo.name}</p>
                  </div>
                )}

                {!normalizedQuery && (
                  <div className="text-center py-12">
                    <Search className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground">Ketik untuk mencari drama di {platformInfo.name}</p>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </header>
  );
}
