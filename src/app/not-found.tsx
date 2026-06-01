import Link from "next/link";
import { Header } from "@/components/layout/Header";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-stone-50">
      <Header />
      <main className="mx-auto flex max-w-3xl flex-col items-center px-4 py-32 text-center">
        <p className="text-6xl font-black text-stone-200">404</p>
        <h1 className="mt-4 text-xl font-bold text-stone-700">
          Page not found
        </h1>
        <p className="mt-2 text-stone-500">
          This item or page doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="mt-6 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
        >
          Back to menu
        </Link>
      </main>
    </div>
  );
}
