"use client";

import { useState, useEffect } from "react";
import { 
  User, 
  Settings, 
  LogOut, 
  ChevronRight, 
  ChevronLeft, 
  History, 
  ShieldCheck, 
  Monitor,
  Bell,
  HelpCircle,
  Gem
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <User className="w-8 h-8 animate-spin text-primary opacity-20" />
      </div>
    );
  }

  const ProfileItem = ({ icon: Icon, label, value, href, variant = "default" }: any) => (
    <Link 
      href={href || "#"} 
      className={cn(
        "flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group",
        variant === "danger" 
          ? "hover:bg-red-500/10 text-red-500" 
          : "bg-card/40 border border-border/50 hover:bg-card/60"
      )}
    >
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-sm",
          variant === "danger" ? "bg-red-500/20" : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white"
        )}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-sm tracking-tight">{label}</span>
          {value && <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-black leading-none mt-1">{value}</span>}
        </div>
      </div>
      <ChevronRight className={cn("w-5 h-5 opacity-30 group-hover:opacity-100 transition-opacity", variant === "danger" ? "text-red-500" : "text-muted-foreground")} />
    </Link>
  );

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full glass-strong border-b border-border/50 px-4 py-4 md:px-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-muted rounded-full transition-colors transition-transform active:scale-90">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl md:text-2xl font-bold font-display tracking-tight flex items-center gap-2">
            <User className="w-6 h-6 text-primary" />
            Profil Saya
          </h1>
        </div>
        <button className="p-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all">
          <Settings className="w-5 h-5" />
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-4 md:px-0 py-10 space-y-8 animate-fade-up">
        {/* User Card */}
        <section className="relative overflow-hidden p-6 rounded-[32px] bg-gradient-to-br from-zinc-900 to-black border border-white/10 shadow-2xl group">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-[80px] group-hover:bg-primary/40 transition-all duration-700" />
          
          <div className="flex flex-col items-center text-center relative z-10">
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-3xl bg-zinc-800 border-2 border-white/10 p-1 overflow-hidden shadow-2xl">
                <div className="w-full h-full rounded-[22px] bg-gradient-to-tr from-primary to-rose-500 flex items-center justify-center text-white text-3xl font-black">
                  AE
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-yellow-500 border-4 border-black flex items-center justify-center text-black">
                <Gem className="w-4 h-4" />
              </div>
            </div>
            
            <h2 className="text-2xl font-display font-black tracking-tight text-white mb-1 uppercase">AE PRO DRAMA VIP</h2>
            <p className="text-sm text-muted-foreground/80 mb-6 font-medium">Bapak Guru - Premium Member</p>
            
            <div className="flex gap-4 w-full">
              <div className="flex-1 p-3 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
                <span className="block text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">Riwayat</span>
                <span className="text-lg font-bold text-white">420</span>
              </div>
              <div className="flex-1 p-3 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
                <span className="block text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">Favorit</span>
                <span className="text-lg font-bold text-white">1.3K</span>
              </div>
            </div>
          </div>
        </section>

        {/* Menu Sections */}
        <div className="space-y-6">
          <div className="space-y-3">
             <h3 className="px-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Pribadi</h3>
             <div className="grid gap-2.5">
               <ProfileItem icon={History} label="Riwayat Nonton" value="Terakhir di lihat" href="/history" />
               <ProfileItem icon={Gem} label="Langganan VIP" value="Akun Premium" />
               <ProfileItem icon={ShieldCheck} label="Keamanan Akun" value="Telah terlindungi" />
             </div>
          </div>

          <div className="space-y-3">
             <h3 className="px-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Sistem</h3>
             <div className="grid gap-2.5">
               <ProfileItem icon={Monitor} label="Pengaturan Tampilan" value="Mode Gelap Aktif" />
               <ProfileItem icon={Bell} label="Notifikasi" value="Update Terbaru" />
               <ProfileItem icon={HelpCircle} label="Pusat Bantuan" href="#" />
             </div>
          </div>

          <div className="pt-4 pb-10">
             <button className="w-full flex items-center justify-between p-4 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/10 group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center group-hover:bg-white group-hover:text-red-500 transition-colors">
                    <LogOut className="w-5 h-5" />
                  </div>
                  <span className="font-black text-sm uppercase tracking-widest">Keluar Akun</span>
                </div>
                <ChevronRight className="w-5 h-5 opacity-50 group-hover:translate-x-1 transition-transform" />
             </button>
          </div>
        </div>
      </main>

      {/* Version Tag */}
      <footer className="text-center pb-12 opacity-30 select-none">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] font-display">AE PRO v4.2.0 BETA</p>
      </footer>
    </div>
  );
}
