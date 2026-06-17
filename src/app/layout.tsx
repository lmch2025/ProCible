import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { I18nProvider } from "@/lib/i18n";

/**
 * Inline pre-hydration i18n script.
 *
 * Runs BEFORE React hydrates. Goal: detect the user's locale from
 * (1) explicit user choice in localStorage, or (2) browser/phone language,
 * then write it to localStorage['procible.locale'] (which React reads via
 * useSyncExternalStore on the first client render) and set <html lang="">
 * so the very first paint already shows the correct language — no French
 * flash for English users, no English flash for French users.
 *
 * This mirrors the logic in src/lib/i18n/index.tsx detectBrowserLocale().
 * Keep them in sync.
 */
const LOCALE_INIT_SCRIPT = `(function(){try{
  var EXPLICIT='procible.locale.explicit';
  var EFFECTIVE='procible.locale';
  var DEFAULT='fr';
  function detect(){
    var e=localStorage.getItem(EXPLICIT);
    if(e==='fr'||e==='en')return e;
    var langs=navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language];
    for(var i=0;i<langs.length;i++){
      var l=(langs[i]||'').toLowerCase();
      if(l.indexOf('en')===0)return 'en';
      if(l.indexOf('fr')===0)return 'fr';
    }
    return DEFAULT;
  }
  var locale=detect();
  localStorage.setItem(EFFECTIVE,locale);
  document.documentElement.lang=locale;
}catch(e){}})();`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ProCible — Votre assistant de prospection",
  description: "ProCible trouve des prospects pour vous chaque nuit. Prospection automatique, leads qualifiés, contact en un tap.",
  keywords: ["ProCible", "prospection", "leads", "CRM", "Afrique", "Cameroun", "business"],
  authors: [{ name: "ProCible" }],
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-512.png",
  },
  openGraph: {
    title: "ProCible — Votre assistant de prospection",
    description: "Trouvez des clients pendant que vous dormez",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#FF7B54",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        {/* Pre-hydration i18n: detect locale + set <html lang> before React renders, so the first paint is already in the right language. */}
        <script dangerouslySetInnerHTML={{ __html: LOCALE_INIT_SCRIPT }} />
      </head>
      <body
        className={`${geistSans.variable} antialiased bg-background text-foreground`}
      >
        <I18nProvider>
          {children}
          <Toaster position="top-center" />
        </I18nProvider>
      </body>
    </html>
  );
}
