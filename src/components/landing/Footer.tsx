import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t-2 border-[#63e4e0] mt-auto bg-[#293a4e]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Image src="/ccube.png" alt="C Cube" width={20} height={20} className="rounded-none" />
          <span className="font-mono text-xs uppercase tracking-wider text-white/40">
            Built by{" "}
            <Link
              href="https://ccube.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#63e4e0] hover:text-white transition-colors"
            >
              C CUBE
            </Link>
          </span>
        </div>
        <div className="flex items-center gap-6 font-mono text-xs uppercase tracking-wider text-white/40">
          <Link href="/leaderboard" className="hover:text-[#63e4e0] transition-colors">
            Rankings
          </Link>
          <Link href="/contests" className="hover:text-[#63e4e0] transition-colors">
            Contests
          </Link>
        </div>
      </div>
    </footer>
  );
}
