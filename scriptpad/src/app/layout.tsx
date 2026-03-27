import "~/styles/globals.css";

import { type Metadata } from "next";
import { DM_Sans, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  title: "ScriptPad",
  description:
    "Write, organize, and schedule scripts for short-form content.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${plusJakarta.variable} ${jetbrainsMono.variable} dark`}
    >
      <body className="min-h-screen bg-[#0F0F0F] font-sans text-[#E5E5E5] antialiased">
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
