"use client";

export const dynamic = 'force-dynamic';

import { useState } from "react";
import { Download, Lock, Link as LinkIcon, AlertCircle, CheckCircle2, FileVideo } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DownloaderPage() {
    const [pin, setPin] = useState("");
    const [url, setUrl] = useState("");
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // PIN updated as per user request
        if (pin === "31101983") {
            setIsUnlocked(true);
            setError("");
        } else {
            setError("PIN Salah!");
        }
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        try {
            // Basic validation
            if (!url.includes("aepro.my.id/detail/")) {
                throw new Error("URL harus dari halaman detail aepro.my.id");
            }

            // Parse URL to get source and ID
            // Format: .../detail/[source]/[id]
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split("/");
            // ["", "detail", "source", "id"]
            const source = pathParts[2];
            const bookId = pathParts[3];

            if (!source || !bookId) {
                throw new Error("Format URL tidak dikenali");
            }

            // Hit API to generate M3U
            const response = await fetch("/api/tools/generate-playlist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ source, bookId })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Gagal membuat playlist");
            }

            // Trigger download
            const blob = await response.blob();
            const filename = response.headers.get("Content-Disposition")?.split("filename=")[1]?.replace(/"/g, "") || `${source}-${bookId}.m3u8`;

            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = downloadUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(downloadUrl);

            setSuccess("Playlist berhasil didownload!");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isUnlocked) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4">
                <form onSubmit={handleLogin} className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl p-8 shadow-2xl">
                    <div className="flex justify-center mb-6">
                        <div className="p-4 bg-primary/10 rounded-full">
                            <Lock className="w-8 h-8 text-primary" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-white text-center mb-2">Private Access</h1>
                    <p className="text-white/60 text-center mb-8">Masukkan PIN untuk mengakses tools ini.</p>

                    <div className="space-y-4">
                        <input
                            type="password"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            placeholder="Masukkan PIN..."
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors text-center text-lg tracking-widest placeholder:tracking-normal"
                            autoFocus
                        />
                        {error && (
                            <div className="flex items-center gap-2 text-red-400 text-sm justify-center bg-red-400/10 p-2 rounded-lg">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}
                        <button
                            type="submit"
                            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-all active:scale-95"
                        >
                            Buka Akses
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-8">
            <div className="max-w-2xl mx-auto space-y-8">
                <header className="space-y-4 text-center">
                    <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full mb-2">
                        <Download className="w-10 h-10 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">
                        AE Video Downloader
                    </h1>
                    <p className="text-white/60 max-w-md mx-auto">
                        Generate playlist M3U8 dari drama favorit kamu. Bisa diputar di VLC atau download massal pakai IDM/1DM.
                    </p>
                </header>

                <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-sm">
                    <form onSubmit={handleGenerate} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-white/80 ml-1">Link Detail Drama</label>
                            <div className="relative">
                                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                                <input
                                    type="url"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="https://aepro.my.id/detail/dramabox/..."
                                    className="w-full bg-black/50 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-primary transition-colors font-mono text-sm"
                                    required
                                />
                            </div>
                            <p className="text-xs text-white/40 ml-1">
                                Supported sources: Dramabox, Melolo, ReelShort, FlickReels, etc.
                            </p>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-200">
                                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                <p className="text-sm">{error}</p>
                            </div>
                        )}

                        {success && (
                            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-start gap-3 text-green-200 animate-in fade-in slide-in-from-top-2">
                                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                                <p className="text-sm">{success}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className={cn(
                                "w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2",
                                loading && "opacity-70 cursor-wait"
                            )}
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Generating Playlist...
                                </>
                            ) : (
                                <>
                                    <FileVideo className="w-5 h-5" />
                                    Download Playlist (.m3u8)
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-6 bg-zinc-900/30 border border-white/5 rounded-xl space-y-3">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-xs">VLC</span>
                            Streaming
                        </h3>
                        <p className="text-sm text-white/50 leading-relaxed">
                            Buka file .m3u8 dari <strong>VLC Media Player</strong> atau <strong>MX Player</strong>.
                            Video akan main otomatis berurutan seperti nonton film panjang.
                        </p>
                    </div>

                    <div className="p-6 bg-zinc-900/30 border border-white/5 rounded-xl space-y-3">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-xs">IDM</span>
                            Batch Download
                        </h3>
                        <p className="text-sm text-white/50 leading-relaxed">
                            Buka file .m3u8 di <strong>1DM+ (Android)</strong> atau <strong>IDM (PC)</strong>.
                            Import playlistnya lalu pilih "Select All" untuk download semua episode sekaligus.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
