import React from "react";
import { Link } from "react-router-dom";
import { DesignCard } from "./Cards";
import { DesignVM } from "@/lib/adapters/productAdapter";

export function Rail({
  title,
  line,
  items,
  href,
  total,
  priority = false,
}: {
  title: string;
  line?: string;
  items: DesignVM[];
  href: string;
  total: number;
  priority?: boolean;
}) {
  if (items.length === 0) return null;

  return (
    <section className="mt-14 text-ink">
      <div className="mx-auto flex max-w-7xl items-end justify-between gap-6 px-5">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-normal">{title}</h2>
          {line && <p className="mt-1 text-xs sm:text-sm text-ink-soft">{line}</p>}
        </div>
        <Link to={href} className="shrink-0 text-xs sm:text-sm font-medium text-clay hover:underline">
          All {total} →
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto pb-4 scrollbar-none">
        <div className="mx-auto flex w-max max-w-none gap-6 px-5 sm:gap-7 lg:px-8">
          {items.map((d) => (
            <div key={d.slug} className="w-[15rem] shrink-0 sm:w-[16.5rem]">
              <DesignCard design={d} priority={priority} />
            </div>
          ))}
          <Link
            to={href}
            className="flex w-[15rem] shrink-0 items-center justify-center rounded-lg border border-dashed border-ink/20 text-xs sm:text-sm text-ink-soft transition hover:border-clay hover:text-clay sm:w-[16.5rem] bg-parchment/30"
          >
            See all {total} in {title} →
          </Link>
        </div>
      </div>
    </section>
  );
}
