import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0d14" },
  ],
};

export const metadata: Metadata = {
  title: "NAPIER v2.0 · National Airfare Price Index & Live Flight Telemetry",
  description:
    "National Airfare Price Index Engine: real-time one-way airfare quotes directly aligned with Google Flights via SerpApi, festival surge projections, and archived Jevons price index metrics.",
  other: {
    "page-type": "software",
    "site-kind": "software",
  },
};

const themeScript = `try{
  var t = localStorage.getItem("napier-theme");
  var isDark = t ? t === "dark" : true;
  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  document.documentElement.setAttribute("data-tone", isDark ? "dark" : "light");
} catch(e) {
  document.documentElement.classList.add("dark");
  document.documentElement.setAttribute("data-theme", "dark");
  document.documentElement.setAttribute("data-tone", "dark");
}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className="dark"
      data-type="software"
      data-theme="dark"
      data-tone="dark"
      data-ground="painting"
      data-radius="soft"
      data-buttons="solid"
      suppressHydrationWarning
    >
      <head>
        <meta name="page-type" content="software" />
        <meta name="site-kind" content="software" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased min-h-screen selection:bg-cyan-500/20 selection:text-cyan-400">
        {children}
      </body>
    </html>
  );
}
