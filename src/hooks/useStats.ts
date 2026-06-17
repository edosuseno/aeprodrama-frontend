"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect } from "react";

import { getBackendBase } from "@/lib/api-utils";
export function useOnlineTracker() {
  // 1. Mutation untuk kirim Heartbeat
  const { mutate: sendHeartbeat } = useMutation({
    mutationFn: async () => {
      const resp = await fetch(`${getBackendBase()}/stats/heartbeat`, {
        method: "POST",
      });
      return resp.json();
    },
  });

  // Kirim heartbeat saat pertama kali buka web
  useEffect(() => {
    sendHeartbeat();
    
    // Kirim ulang setiap 4 menit agar tetap dianggap 'online'
    const interval = setInterval(() => {
      sendHeartbeat();
    }, 4 * 60 * 1000);

    return () => clearInterval(interval);
  }, [sendHeartbeat]);

  // 2. Query untuk ambil jumlah online
  return useQuery({
    queryKey: ["online-users"],
    queryFn: async () => {
      const resp = await fetch(`${getBackendBase()}/stats/online`);
      const data = await resp.json();
      return data.count || 0;
    },
    refetchInterval: 30000, // Update angka di layar setiap 30 detik
  });
}
