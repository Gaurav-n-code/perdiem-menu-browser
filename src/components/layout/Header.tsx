import Link from "next/link";
import { UtensilsCrossed } from "lucide-react";

interface HeaderProps {
  right?: React.ReactNode;
}

export function Header({ right }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-stone-900 hover:text-brand-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
        >
          <UtensilsCrossed className="h-5 w-5 text-brand-600" aria-hidden />
          <span>Menu Browser</span>
        </Link>

        {right && <div>{right}</div>}
      </div>
    </header>
  );
}
