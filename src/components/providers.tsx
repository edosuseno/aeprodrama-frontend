"use client";

import { QueryClient, QueryClientProvider, QueryCache } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { useState } from "react";
import { toast } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
            onError: (error: any) => {
                if (error?.response?.status === 429 || error?.status === 429) {
                    toast.error("Terlalu Cepat!", {
                        description: "Mohon tunggu sebentar sebelum request lagi.",
                        duration: 5000,
                    });
                }
            },
        }),
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // Data dianggap segar selama 5 menit
            gcTime: 24 * 60 * 60 * 1000, // Simpan data di memori selama 24 jam
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            refetchOnReconnect: false,
            retry: 1, // Batasi retry agar user tidak menunggu lama jika error
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <TooltipProvider>{children}</TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
