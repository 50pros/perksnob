import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
});
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://perksnob.com"),
  title: {
    default: "PerkSnob — Marriott Bonvoy elite benefits directory",
    template: "%s · PerkSnob",
  },
  description:
    "Discover, browse, and search the elite perks Marriott Bonvoy hotels actually provide — for Titanium, Platinum, and Ambassador Elite members. Declared by hotels, confirmed by real guests.",
  openGraph: {
    title: "PerkSnob — Marriott Bonvoy elite benefits directory",
    description:
      "Perks declared by hotels, confirmed by real guests. See the gap between what's promised and what's delivered.",
    url: "https://perksnob.com",
    siteName: "PerkSnob",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PerkSnob — Marriott Bonvoy elite benefits directory",
    description: "Perks declared by hotels, confirmed by real guests.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png" }],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body>
        {children}

        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-06P5B7HMQ6"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', 'G-06P5B7HMQ6');`}
        </Script>
      </body>
    </html>
  );
}
