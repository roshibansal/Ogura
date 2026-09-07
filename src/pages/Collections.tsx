import React, { useMemo } from "react";
import { useSearchParams, Link, useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DesignCard } from "@/components/Cards";
import { useCatalogProducts } from "@/hooks/useCatalogProducts";
import { CANONICAL_TAXONOMY, DesignVM } from "@/lib/adapters/productAdapter";

export default function Collections() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { category: routeCategory } = useParams();
  const { data: catalogData, isLoading } = useCatalogProducts();

  const activeCategory = searchParams.get("category") || routeCategory || "";
  const activeAvailability = searchParams.get("availability") || "";
  const activePrice = searchParams.get("price") || "";
  const activeSort = searchParams.get("sort") === "high" ? "high" : "low";

  const toggleParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (next.get(key) === value) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next);
  };

  const setSort = (sortVal: "low" | "high") => {
    const next = new URLSearchParams(searchParams);
    if (sortVal === "low") {
      next.delete("sort");
    } else {
      next.set("sort", sortVal);
    }
    setSearchParams(next);
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const hasActiveFilters = Boolean(activeCategory || activeAvailability || activePrice);

  const filteredDesigns = useMemo(() => {
    const list = catalogData?.designs || [];

    return list
      .filter((d: DesignVM) => {
        // Category filter
        if (activeCategory) {
          const normActive = activeCategory.toLowerCase();
          const normItem = d.category.toLowerCase();
          if (normActive !== normItem) return false;
        }

        // Availability filter
        if (activeAvailability === "stock" && !d.readyStock) return false;
        if (activeAvailability === "order" && d.readyStock) return false;

        // Price filter
        if (activePrice === "under3" && d.price >= 3000) return false;
        if (activePrice === "3to7" && (d.price < 3000 || d.price > 7000)) return false;
        if (activePrice === "over7" && d.price <= 7000) return false;

        return true;
      })
      .sort((a, b) => (activeSort === "high" ? b.price - a.price : a.price - b.price));
  }, [catalogData, activeCategory, activeAvailability, activePrice, activeSort]);

  return (
    <div className="min-h-screen bg-ivory text-ink grain flex flex-col selection:bg-clay selection:text-white">
      <Header />

      <main className="flex-1 mx-auto w-full max-w-7xl px-5 py-10 sm:py-14">
        {/* Page Title & Philosophy */}
        <div className="max-w-3xl">
          <span className="text-xs uppercase tracking-[0.2em] font-semibold text-clay">
            Boutique Catalog
          </span>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl font-normal tracking-tight">
            The collection
          </h1>
          <p className="mt-3 text-base sm:text-lg text-ink-soft leading-relaxed">
            Browse real pieces from independent Indian boutiques. Filter by studio stock to see what ships this week, or commission a piece made to your exact measurements.
          </p>
        </div>

        {/* Faceted Sticky Filter Rail */}
        <div className="sticky top-[75px] z-30 mt-8 rounded-2xl border border-black/5 bg-ivory/95 p-4 backdrop-blur-md shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
              <button
                type="button"
                onClick={() => toggleParam("category", "")}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                  !activeCategory
                    ? "bg-ink text-ivory"
                    : "border border-ink/15 bg-white/60 text-ink hover:border-ink/40"
                }`}
              >
                All Categories
              </button>
              {CANONICAL_TAXONOMY.map((cat) => {
                const isActive = activeCategory.toLowerCase() === cat.toLowerCase();
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleParam("category", cat)}
                    className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                      isActive
                        ? "bg-clay text-white"
                        : "border border-ink/15 bg-white/60 text-ink hover:border-clay hover:text-clay"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Secondary Facets: Availability, Price, Sort */}
            <div className="flex flex-wrap items-center gap-2 text-xs pt-1 border-t border-black/5 w-full sm:border-t-0 sm:pt-0 sm:w-auto">
              {/* Availability */}
              <button
                type="button"
                onClick={() => toggleParam("availability", "stock")}
                className={`rounded-full px-3 py-1 font-medium transition ${
                  activeAvailability === "stock"
                    ? "bg-forest text-white"
                    : "border border-ink/15 text-ink-soft hover:text-ink"
                }`}
              >
                Studio Stock
              </button>
              <button
                type="button"
                onClick={() => toggleParam("availability", "order")}
                className={`rounded-full px-3 py-1 font-medium transition ${
                  activeAvailability === "order"
                    ? "bg-ink text-white"
                    : "border border-ink/15 text-ink-soft hover:text-ink"
                }`}
              >
                Made on Order
              </button>

              {/* Price Band */}
              <button
                type="button"
                onClick={() => toggleParam("price", "under3")}
                className={`rounded-full px-3 py-1 font-medium transition ${
                  activePrice === "under3"
                    ? "bg-clay text-white"
                    : "border border-ink/15 text-ink-soft hover:text-ink"
                }`}
              >
                &lt; ₹3k
              </button>
              <button
                type="button"
                onClick={() => toggleParam("price", "3to7")}
                className={`rounded-full px-3 py-1 font-medium transition ${
                  activePrice === "3to7"
                    ? "bg-clay text-white"
                    : "border border-ink/15 text-ink-soft hover:text-ink"
                }`}
              >
                ₹3k–₹7k
              </button>
              <button
                type="button"
                onClick={() => toggleParam("price", "over7")}
                className={`rounded-full px-3 py-1 font-medium transition ${
                  activePrice === "over7"
                    ? "bg-clay text-white"
                    : "border border-ink/15 text-ink-soft hover:text-ink"
                }`}
              >
                &gt; ₹7k
              </button>

              {/* Sort toggle */}
              <button
                type="button"
                onClick={() => setSort(activeSort === "high" ? "low" : "high")}
                className="rounded-full border border-ink/15 px-3 py-1 text-ink font-medium hover:bg-parchment transition ml-auto sm:ml-0"
              >
                Price: {activeSort === "high" ? "High → Low" : "Low → High"}
              </button>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-xs text-clay underline font-medium hover:text-ink transition ml-2"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results Info */}
        <div className="mt-8 flex items-center justify-between text-xs text-ink-soft">
          <p>
            Showing <span className="font-semibold text-ink">{filteredDesigns.length}</span> designs
            {activeCategory && (
              <span> in <span className="font-semibold text-ink">{activeCategory}</span></span>
            )}
          </p>
        </div>

        {/* Designs Grid */}
        {isLoading ? (
          <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse space-y-3">
                <div className="aspect-[4/5] rounded-lg bg-parchment" />
                <div className="h-4 w-3/4 rounded bg-parchment" />
                <div className="h-3 w-1/2 rounded bg-parchment" />
              </div>
            ))}
          </div>
        ) : filteredDesigns.length > 0 ? (
          <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            {filteredDesigns.map((d: DesignVM) => (
              <DesignCard key={d.slug} design={d} />
            ))}
          </div>
        ) : (
          <div className="mt-16 rounded-2xl border border-dashed border-ink/20 p-12 text-center max-w-xl mx-auto bg-parchment/30">
            <h3 className="font-display text-2xl font-normal">No pieces found in this view</h3>
            <p className="mt-2 text-sm text-ink-soft leading-relaxed">
              This atelier collection is currently being curated, or no pieces match that filter combination. Clear the filters or request a call with our styling concierge to commission a custom creation.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="rounded-full bg-ink px-6 py-2.5 text-xs font-medium text-ivory hover:bg-clay transition"
                >
                  Reset All Filters
                </button>
              )}
              <Link
                to="/how-it-works"
                className="rounded-full border border-ink/20 px-6 py-2.5 text-xs font-medium text-ink hover:bg-parchment transition"
              >
                Learn How to Commission
              </Link>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}