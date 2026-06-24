import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#d9d0c1] bg-[#f4efe6]/92 backdrop-blur-md">
      <nav className="relative mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-3 gap-y-3 px-4 py-3 sm:px-6 sm:py-4 lg:px-10">
        <Link
          href="/"
          aria-label="Plutus home"
          className="brand-script shrink-0 text-4xl leading-none text-[#1d211c] sm:text-5xl"
        >
          Plutus
        </Link>

        <div
          aria-label="Public navigation"
          className="order-3 flex w-full justify-center rounded-md border border-[#d9d0c1]/70 bg-[#fbf7ef]/55 p-1 sm:absolute sm:left-1/2 sm:top-1/2 sm:order-none sm:w-auto sm:-translate-x-1/2 sm:-translate-y-1/2"
        >
          <Link
            href="/"
            className="rounded px-3 py-1.5 text-sm font-semibold text-[#6b6252] transition hover:bg-white hover:text-[#1d211c]"
          >
            Home
          </Link>
          <Link
            href="/community"
            className="rounded px-3 py-1.5 text-sm font-semibold text-[#1d211c] transition hover:bg-white hover:text-[#8f6f2d]"
          >
            Community
          </Link>
        </div>

        <div className="flex min-w-0 items-center justify-self-end gap-3">
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
