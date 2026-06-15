import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Open_Sans } from "next/font/google";
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
    default: "GitSlice — Explore GitHub repos commit by commit",
    template: "%s | GitSlice",
  },
  description:
    "GitSlice lets you browse any GitHub repository's history one commit at a time. Explore file trees, diff code, and understand how a project evolved.",
  keywords: [
    "GitHub",
    "repository explorer",
    "commit history",
    "code viewer",
    "git browser",
    "open source",
  ],
  authors: [{ name: "GitSlice" }],
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    title: "GitSlice — Explore GitHub repos commit by commit",
    description:
      "Browse any GitHub repository's history one commit at a time. Explore file trees and understand how a project evolved.",
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
    title: "GitSlice — Explore GitHub repos commit by commit",
    description:
      "Browse any GitHub repository's history one commit at a time. Explore file trees and understand how a project evolved.",
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

      <body className="min-h-full flex flex-col">
        <Providers >
          {children}
        </Providers>
      </body>
    </html>
  );
}
