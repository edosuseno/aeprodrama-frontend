"use client";

import { useEffect } from "react";

export function ClientSecurity() {
  useEffect(() => {
    // ONLY run this security script in Production!
    // In local development (npm run dev), you can still use F12 and Right Click freely.
    if (process.env.NODE_ENV !== "production") {
      return;
    }

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent F12
      if (e.key === "F12") {
        e.preventDefault();
      }

      // Prevent Ctrl+Shift+I (Inspect) / Ctrl+Shift+J (Console) / Ctrl+Shift+C (Element)
      if (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i" || e.key === "J" || e.key === "j" || e.key === "C" || e.key === "c")) {
        e.preventDefault();
      }

      // Prevent Ctrl+U (View Source)
      if (e.ctrlKey && (e.key === "U" || e.key === "u")) {
        e.preventDefault();
      }
    };

    // Add event listeners
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return null;
}
