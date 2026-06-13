import Link from "next/link";
import { Great_Vibes } from "next/font/google";

const logoFont = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#d9d0c1] bg-[#f4efe6]/92 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4 lg:px-10">
        <Link
          href="/"
          aria-label="Plutus home"
          className={`${logoFont.className} text-5xl leading-none text-[#1d211c]`}
        >
          Plutus
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden text-sm font-semibold text-[#1d211c] transition hover:text-[#8f6f2d] sm:inline"
          >
            Sign in
          </Link>

          <Link
            href="/register"
            className="inline-flex h-10 items-center justify-center rounded-md bg-[#1d211c] px-4 text-sm font-bold text-[#fbf7ef] transition hover:bg-[#343b32]"
          >
            Create account
          </Link>
        </div>
      </nav>
    </header>
  );
}