import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "PerkSnob — Marriott Elite Benefits, Crowdsourced",
    template: "%s | PerkSnob",
  },
  description:
    "Real Marriott Bonvoy elite benefits reported by real guests. Crowdsourced perks for Titanium, Platinum, and Ambassador Elite at 300+ luxury properties.",
  metadataBase: new URL("https://perksnob.com"),
  openGraph: {
    title: "PerkSnob — Marriott Elite Benefits, Crowdsourced",
    description:
      "Real Marriott Bonvoy elite benefits reported by real guests. Crowdsourced perks for Titanium, Platinum, and Ambassador Elite at 300+ luxury properties.",
    url: "https://perksnob.com",
    siteName: "PerkSnob",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PerkSnob — Marriott Elite Benefits, Crowdsourced",
    description:
      "Real Marriott Bonvoy elite benefits reported by real guests. Crowdsourced perks for Titanium, Platinum, and Ambassador Elite at 300+ luxury properties.",
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
    <html lang="en" className={`${dmSans.variable} ${playfair.variable}`}>
      <body
        className={`${dmSans.className} ${playfair.className} bg-slate-50 antialiased`}
      >
        {children}

        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-06P5B7HMQ6"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-06P5B7HMQ6');
          `}
        </Script>
      </body>
    </html>
  );
}
