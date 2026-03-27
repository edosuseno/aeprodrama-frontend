"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface HistoryItem {
  id: string;
  title: string;
  poster: string;
  platform: string;
  episodeNumber?: number | string;
  lastWatchedAt: number;
  link: string;
}

interface HistoryState {
  items: HistoryItem[];
  addToHistory: (item: Omit<HistoryItem, "lastWatchedAt">) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      items: [],
      
      addToHistory: (newItem) => set((state) => {
        // Hapus item lama jika ada ID yang sama (untuk update posisi ke paling atas)
        const filteredItems = state.items.filter(item => item.id !== newItem.id);
        
        const itemWithTimestamp: HistoryItem = {
          ...newItem,
          lastWatchedAt: Date.now(),
        };

        // Batasi maksimal 40 item agar cache tidak bengkak
        const updatedItems = [itemWithTimestamp, ...filteredItems].slice(0, 40);
        
        return { items: updatedItems };
      }),

      removeFromHistory: (id) => set((state) => ({
        items: state.items.filter(item => item.id !== id)
      })),

      clearHistory: () => set({ items: [] }),
    }),
    {
      name: "aepro-view-history",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
