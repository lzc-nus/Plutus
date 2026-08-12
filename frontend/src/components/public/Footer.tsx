import Link from "next/link";

const footerLinks = [
  { href: "/community", label: "Community" },
  { href: "/login", label: "Sign in" },
  { href: "/register", label: "Create account" },
];

export default function Footer() {
  return (
    <footer className="border-t border-[#d9d0c1] bg-[#1d211c] text-[#fbf7ef]">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-[1.2fr_0.8fr] lg:px-10">
        <div>
          <Link
            href="/"
            aria-label="Plutus home"
            className="brand-script text-5xl leading-none text-[#d8bd75]"
          >
            Plutus
          </Link>

          <p className="mt-5 max-w-md text-sm leading-6 text-[#d9d0c1]">
            AI financial intelligence for tracking wealth, risk, cash flow, and
            the decisions that shape long-term capital.
          </p>
        </div>

        <div className="grid gap-3 sm:justify-self-end">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d8bd75]">
            Navigation
          </p>

          <div className="grid gap-2">
            {footerLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-[#d9d0c1] transition hover:text-[#fbf7ef]"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 px-6 py-5 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 text-xs text-[#bdb4a4] sm:flex-row sm:items-center sm:justify-between">
          <p>
            Copyright {new Date().getFullYear()} Two Sicilies. All rights reserved.
          </p>
          
          <p>
            Private wealth intelligence platform.
          </p>
        </div>
      </div>
    </footer>
  );
}
