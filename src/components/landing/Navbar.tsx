"use client";

import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useAuth, SignInButton, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const { isSignedIn } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <Image
            src="/ccube.png"
            alt="C Cube"
            width={32}
            height={32}
            className="rounded-sm"
          />
          <span className="font-bold text-lg tracking-tight">Stadion</span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <Link href="#features" className="hover:text-foreground transition-colors">
            Features
          </Link>
          <Link href="/leaderboard" className="hover:text-foreground transition-colors">
            Leaderboard
          </Link>
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          )}

          {!isSignedIn ? (
            <SignInButton forceRedirectUrl="/dashboard">
              <Button size="sm" style={{ backgroundColor: "#63e4e0", color: "#293a4e" }}>
                Sign in with GitHub
              </Button>
            </SignInButton>
          ) : (
            <>
              <Link href="/dashboard">
                <Button size="sm" variant="outline">
                  Dashboard
                </Button>
              </Link>
              <UserButton />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
