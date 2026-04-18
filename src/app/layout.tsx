import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Providers } from "./providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stadion — Compete. Code. Climb.",
  description:
    "A competitive coding leaderboard for college developers, built under the C Cube club initiative.",
};

const clerkAppearance = {
  variables: {
    colorPrimary: "#63e4e0",
    colorBackground: "#293a4e",
    colorText: "#ffffff",
    colorTextSecondary: "rgba(255,255,255,0.5)",
    colorInputText: "#ffffff",
    colorInputBackground: "#1e3040",
    colorDanger: "#ff3e3e",
    borderRadius: "0px",
    fontFamily: "var(--font-geist-mono), monospace",
    fontSize: "13px",
  },
  elements: {
    card: "border-2 border-[#63e4e0] shadow-[4px_4px_0px_#63e4e0] bg-[#293a4e]",
    headerTitle: "font-mono font-black uppercase tracking-wider",
    headerSubtitle: "font-mono text-xs uppercase tracking-wider opacity-50",
    formButtonPrimary:
      "bg-[#63e4e0] text-[#293a4e] font-mono font-bold uppercase tracking-widest border-2 border-[#63e4e0] shadow-[2px_2px_0px_#63e4e0] hover:shadow-[4px_4px_0px_#63e4e0] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all rounded-none",
    formFieldInput:
      "border-2 border-[#63e4e0]/40 bg-[#1e3040] font-mono rounded-none focus:border-[#63e4e0] focus:ring-0",
    formFieldLabel: "font-mono text-xs uppercase tracking-wider text-white/60",
    socialButtonsBlockButton:
      "border-2 border-[#63e4e0]/40 bg-transparent font-mono uppercase tracking-wider rounded-none hover:bg-[#63e4e0]/10",
    footer: "hidden",
    userButtonPopoverCard: "border-2 border-[#63e4e0] shadow-[4px_4px_0px_#63e4e0] bg-[#293a4e] rounded-none",
    userButtonPopoverActionButton: "font-mono text-xs uppercase tracking-wider hover:bg-[#63e4e0]/10",
    userButtonAvatarBox: "rounded-none border-2 border-[#63e4e0]",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider appearance={clerkAppearance}>
      {/* suppressHydrationWarning required by next-themes */}
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        suppressHydrationWarning
      >
        <body className="min-h-full flex flex-col bg-background text-foreground">
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
