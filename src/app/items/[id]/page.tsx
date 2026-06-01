import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Tag } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { fetchItemById } from "@/services/square.service";
import { Header } from "@/components/layout/Header";
import { ModifierListSection } from "@/components/menu/ModifierListSection";
import type { ItemDetailResponse } from "@/types";

interface ItemPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ locationId?: string }>;
}

/**
 * WHY THIS IS A SERVER COMPONENT
 * --------------------------------
 * The item detail page doesn't have interactive state (no category filter,
 * no location switcher). Fetching on the server means:
 *   - Faster Time to First Byte (no client-side waterfall)
 *   - Better SEO (content is in the initial HTML)
 *   - No loading spinner — content is ready when the page paints
 *
 * We call our own API route rather than the service directly so that:
 *   - The same validation and error handling code runs regardless of
 *     how the data is requested
 *   - In production, this could be a separate microservice
 */
async function fetchItemDetail(id: string): Promise<ItemDetailResponse | null> {
  return (await fetchItemById(id)) as ItemDetailResponse | null;
}

export default async function ItemDetailPage({
  params,
  searchParams,
}: ItemPageProps) {
  const { id } = await params;
  const { locationId } = await searchParams;

  let item: ItemDetailResponse | null = null;

  try {
    item = await fetchItemDetail(id);
  } catch {
    // Server-side fetch error — show error UI rather than crashing
    return (
      <div className="min-h-screen bg-stone-50">
        <Header />
        <main className="mx-auto max-w-3xl px-4 py-16 text-center">
          <p className="text-lg font-semibold text-stone-700">
            Unable to load this item.
          </p>
          <BackLink locationId={locationId} />
        </main>
      </div>
    );
  }

  if (!item) {
    notFound();
  }

  const backHref = locationId ? `/?locationId=${locationId}` : "/";

  return (
    <div className="min-h-screen bg-stone-50">
      <Header />

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {/* Back navigation */}
        <Link
          href={backHref}
          className="
            mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-stone-500
            hover:text-brand-700 transition-colors focus-visible:outline-none
            focus-visible:ring-2 focus-visible:ring-brand-500 rounded
          "
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to menu
        </Link>

        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          {/* Hero image */}
          {item.imageUrl && (
            <div className="relative h-72 w-full bg-stone-100 sm:h-96">
              <Image
                src={item.imageUrl}
                alt={item.name}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-cover"
              />
            </div>
          )}

          <div className="p-6 sm:p-8">
            {/* Category badge */}
            <div className="mb-3 flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-brand-500" aria-hidden />
              <span className="text-xs font-semibold uppercase tracking-wide text-brand-600">
                {item.categoryName}
              </span>
            </div>

            {/* Name + price */}
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl font-bold text-stone-900 sm:text-3xl">
                {item.name}
              </h1>
              {item.price && (
                <span className="shrink-0 rounded-lg bg-brand-50 px-3 py-1.5 text-lg font-bold text-brand-700">
                  {formatMoney(item.price)}
                </span>
              )}
            </div>

            {/* Description */}
            {item.description && (
              <p className="mt-4 text-base leading-relaxed text-stone-600">
                {item.description}
              </p>
            )}

            {/* Modifiers */}
            {item.modifierLists.length > 0 && (
              <div className="mt-8 space-y-6">
                <h2 className="text-base font-bold text-stone-900">
                  Customize your order
                </h2>
                {item.modifierLists.map((list) => (
                  <ModifierListSection key={list.id} modifierList={list} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function BackLink({ locationId }: { locationId: string | undefined }) {
  return (
    <Link
      href={locationId ? `/?locationId=${locationId}` : "/"}
      className="mt-4 inline-flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-800"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to menu
    </Link>
  );
}
