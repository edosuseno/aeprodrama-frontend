import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { BackToTop } from "@/components/BackToTop";

export const metadata: Metadata = {
  title: "AE DRAMA Pusat Drama - Nonton Drama Pendek Sub Indo",
  description: "AE DRAMA Pusat Drama adalah platform streaming drama pendek premium dengan subtitle Indonesia. Nonton gratis dan lengkap di AE DRAMA.",
  icons: {
    icon: "/icon.png?v=4",
    apple: "/apple-touch-icon.png?v=4",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#e11d48",
};

import { LayoutContent } from "@/components/LayoutContent";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://wsrv.nl" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="AE DRAMA" />
      </head>
      <body className="font-sans antialiased text-foreground bg-background">
        <Providers>
          <LayoutContent>
            {children}
          </LayoutContent>
          <BackToTop />
          <Toaster />
          <Sonner />
        </Providers>
        
        {/* Anti-Crash Patch for Google Translate & Other Translators */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof Node === 'function' && Node.prototype) {
                const originalRemoveChild = Node.prototype.removeChild;
                Node.prototype.removeChild = function(child) {
                  if (child.parentNode !== this) {
                    if (child.parentNode) {
                      return child.parentNode.removeChild(child);
                    }
                    return child;
                  }
                  return originalRemoveChild.apply(this, arguments);
                };

                const originalInsertBefore = Node.prototype.insertBefore;
                Node.prototype.insertBefore = function(newNode, referenceNode) {
                  if (referenceNode && referenceNode.parentNode !== this) {
                    if (referenceNode.parentNode) {
                      return referenceNode.parentNode.insertBefore(newNode, referenceNode);
                    }
                  }
                  return originalInsertBefore.apply(this, arguments);
                };
              }
            `,
          }}
        />

        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(registration) {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                  }, function(err) {
                    console.log('ServiceWorker registration failed: ', err);
                  });
                });
              }
            `,
          }}
        />
      </body>

    </html>
  );
}
