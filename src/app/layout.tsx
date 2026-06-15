import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Open_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next"
import "./globals.css";
import Providers from "@/lib/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
const openSans = Open_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "GitSlice — Download any GitHub subdirectory instantly",
    template: "%s | GitSlice",
  },
  description:
    "GitSlice lets you download any subdirectory of a GitHub repository in one click — no need to clone the whole repo. Browse file trees with a rich GUI and grab only what you need.",
  keywords: [
    "GitHub subdirectory downloader",
    "download GitHub folder",
    "git sparse checkout",
    "GitHub code downloader",
    "download part of GitHub repo",
    "open source",
  ],
  authors: [{ name: "GitSlice" }],
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    title: "GitSlice — Download any GitHub subdirectory instantly",
    description:
      "Browse any GitHub repo's file tree and download only the subdirectory you need — no full clone required.",
    images: [
      {
        url: "/favicon.svg",
        width: 1200,
        height: 630,
        alt: "GitSlice",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GitSlice — Download any GitHub subdirectory instantly",
    description:
      "Browse any GitHub repo's file tree and download only the subdirectory you need — no full clone required.",
    images: ["/favicon.svg"],
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      suppressHydrationWarning
      lang="en"
      className={`${openSans.variable} ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <Analytics />

      <body className="min-h-full flex flex-col">
        <Providers >
          {children}
        </Providers>
      </body>
    </html>
  );
}
