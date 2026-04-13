import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2.5">
          <Image src="/ccube.png" alt="C Cube" width={24} height={24} className="rounded-sm opacity-80" />
          <span>
            Built by{" "}
            <Link
              href="https://ccube.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors underline underline-offset-2"
            >
              C Cube
            </Link>
          </span>
        </div>
        <div className="flex items-center gap-5">
          <Link href="/leaderboard" className="hover:text-foreground transition-colors">
            Leaderboard
          </Link>
          <Link href="/contests" className="hover:text-foreground transition-colors">
            Contests
          </Link>
        </div>
      </div>
    </footer>
  );
}
