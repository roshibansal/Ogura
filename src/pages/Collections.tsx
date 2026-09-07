import React, { useMemo, useState } from "react";
import { useSearchParams, Link, useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DesignCard } from "@/components/Cards";
import { useCatalogProducts } from "@/hooks/useCatalogProducts";
import { CANONICAL_TAXONOMY, DesignVM, resolveCategoryFromSlug, slugifyCategory } from "@/lib/adapters/productAdapter";
import { Filter, X, Check, ChevronDown } from "lucide-react";

export default function Collections() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { category: routeCategory } = useParams();
  const { data: catalogData, isLoading } = useCatalogProducts();
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const activeCategory = searchParams.get("category") || routeCategory || "";
  const activeCategoryCanonical = useMemo(() => {
    return resolveCategoryFromSlug(activeCategory);
  }, [activeCategory]);

  const activeAtelier = searchParams.get("atelier") || "";
  const activeAvailability = searchParams.get("availability") || "";
  const activePrice = searchParams.get("price") || "";
  const activeCity = searchParams.get("city") || "";
  const activeSort = searchParams.get("sort") || "low";
  const searchQuery = searchParams.get("q") || "";

  const toggleParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (next.get(key) === value) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next);
  };

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (!value) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next);
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const allDesigns = useMemo(() => catalogData?.designs || [], [catalogData]);

  // Compute facet counts dynamically based on current catalog
  const facetCounts = useMemo(() => {
    const counts = {
      availability: { stock: 0, order: 0 },
      price: { under12: 0, "12to14": 0, over14: 0 },
      categories: {} as Record<string, number>,
      ateliers: {} as Record<string, number>,
      cities: {} as Record<string, number>,
    };

    allDesigns.forEach((d) => {
      // Availability
      if (d.readyStock) counts.availability.stock++;
      else counts.availability.order++;

      // Price
      if (d.price < 12000) counts.price.under12++;
      else if (d.price <= 14000) counts.price["12to14"]++;
      else counts.price.over14++;

      // Category
      if (d.category) {
        counts.categories[d.category] = (counts.categories[d.category] || 0) + 1;
      }

      // Atelier
      if (d.boutique) {
        counts.ateliers[d.boutique] = (counts.ateliers[d.boutique] || 0) + 1;
      }

      // City
      if (d.city) {
        counts.cities[d.city] = (counts.cities[d.city] || 0) + 1;
      }
    });

    return counts;
  }, [allDesigns]);

  // Filtered and sorted designs
  const filteredDesigns = useMemo(() => {
    return allDesigns
      .filter((d: DesignVM) => {
        // Search query filter
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchTitle = d.title.toLowerCase().includes(q);
          const matchBrand = d.boutique.toLowerCase().includes(q);
          const matchCategory = d.category.toLowerCase().includes(q);
          if (!matchTitle && !matchBrand && !matchCategory) return false;
        }

        // Category filter with slug resolution
        if (activeCategory) {
          if (activeCategoryCanonical) {
            if (d.category !== activeCategoryCanonical) return false;
          } else {
            const normActive = activeCategory.toLowerCase();
            const normItem = d.category.toLowerCase();
            if (normActive !== normItem) return false;
          }
        }

        // Atelier filter
        if (activeAtelier && d.boutique.toLowerCase() !== activeAtelier.toLowerCase()) {
          return false;
        }

        // City filter
        if (activeCity && d.city.toLowerCase() !== activeCity.toLowerCase()) {
          return false;
        }

        // Availability filter
        if (activeAvailability === "stock" && !d.readyStock) return false;
        if (activeAvailability === "order" && d.readyStock) return false;

        // Price filter
        if (activePrice === "under12" && d.price >= 12000) return false;
        if (activePrice === "12to14" && (d.price < 12000 || d.price > 14000)) return false;
        if (activePrice === "over14" && d.price <= 14000) return false;

        return true;
      })
      .sort((a, b) => {
        if (activeSort === "high") return b.price - a.price;
        if (activeSort === "new") return b.title.localeCompare(a.title);
        // Default: Price low to high
        return a.price - b.price;
      });
  }, [allDesigns, activeCategory, activeAtelier, activeAvailability, activePrice, activeCity, activeSort, searchQuery]);

  // Count distinct ateliers represented in filtered results
  const distinctAteliersCount = useMemo(() => {
    const s = new Set<string>();
    filteredDesigns.forEach((d) => s.add(d.boutique));
    return s.size;
  }, [filteredDesigns]);

  const hasActiveFilters = Boolean(
    activeCategory || activeAtelier || activeAvailability || activePrice || activeCity || searchQuery
  );

  return (
    <div className="min-h-screen bg-[#f8d2f9] text-[#5A0A26] flex flex-col selection:bg-gold selection:text-ink">
      <Header />

      <main className="flex-1 max-w-[1440px] mx-auto w-full px-3 sm:px-6 py-5 sm:py-7">
        {/* Breadcrumbs (.crumbs) */}
        <p className="text-sm text-ink/75 mb-4 font-semibold">
          <Link to="/" className="hover:text-ink transition">
            Home
          </Link>
          <span className="mx-2 text-[#fcb8fd]">/</span>
          <span className="text-ink font-bold">
            {activeCategory || (searchQuery ? `Search: "${searchQuery}"` : "All Creations")}
          </span>
        </p>

        {/* Listing Header (.lhead) */}
        <div className="flex flex-wrap items-baseline justify-between gap-4 pb-5 border-b border-[#fcb8fd]">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif tracking-tight text-ink">
              {activeCategory || (searchQuery ? `Search results for "${searchQuery}"` : "All Creations")}
            </h1>
            <p className="text-sm sm:text-base text-ink/80 mt-1.5 font-medium">
              <b className="text-ink font-extrabold">{filteredDesigns.length}</b> {filteredDesigns.length === 1 ? "piece" : "pieces"} from{" "}
              <b className="text-ink font-extrabold">{distinctAteliersCount}</b> {distinctAteliersCount === 1 ? "shop" : "shops"}
            </p>
          </div>

          {/* Sort Selector and Filter Trigger */}
          <div className="flex items-center gap-3 text-sm font-semibold">
            {/* Mobile Filter Button */}
            <button
              type="button"
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-1.5 border border-line bg-white px-3 py-2 rounded-sm text-grey-soft hover:text-ink transition"
            >
              <Filter className="h-3.5 w-3.5" />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="h-2 w-2 rounded-full bg-rose" />
              )}
            </button>

            {/* Sort Select (.sel) */}
            <div className="relative inline-block">
              <select
                value={activeSort}
                onChange={(e) => setParam("sort", e.target.value)}
                className="appearance-none border border-[#fcb8fd] bg-white px-3 py-2 pr-7 rounded-sm text-[#5A0A26] hover:border-[#5A0A26] focus:outline-none transition cursor-pointer text-xs font-bold shadow-xs"
              >
                <option value="low">Price: Low to High (Default)</option>
                <option value="high">Price: High to Low</option>
                <option value="new">Newly Added</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-grey-muted pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Active Filter Tags Bar (.sortbar) */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 py-3 border-b border-line text-xs">
            <span className="text-grey-muted font-medium text-[11px] uppercase tracking-wider">
              Active:
            </span>

            {activeCategory && (
              <button
                type="button"
                onClick={() => setParam("category", "")}
                className="inline-flex items-center gap-1 border border-rose text-rose bg-white px-2.5 py-1 rounded-sm text-xs hover:bg-rose/5 transition"
              >
                <span>Category: {activeCategoryCanonical || activeCategory}</span>
                <X className="h-3 w-3" />
              </button>
            )}

            {activeAvailability && (
              <button
                type="button"
                onClick={() => setParam("availability", "")}
                className="inline-flex items-center gap-1 border border-rose text-rose bg-white px-2.5 py-1 rounded-sm text-xs hover:bg-rose/5 transition"
              >
                <span>{activeAvailability === "stock" ? "In studio" : "Made on order"}</span>
                <X className="h-3 w-3" />
              </button>
            )}

            {activePrice && (
              <button
                type="button"
                onClick={() => setParam("price", "")}
                className="inline-flex items-center gap-1 border border-rose text-rose bg-white px-2.5 py-1 rounded-sm text-xs hover:bg-rose/5 transition"
              >
                <span>
                  {activePrice === "under12"
                    ? "Under ₹12,000"
                    : activePrice === "12to14"
                    ? "₹12,000–₹14,000"
                    : "Over ₹14,000"}
                </span>
                <X className="h-3 w-3" />
              </button>
            )}

            {activeAtelier && (
              <button
                type="button"
                onClick={() => setParam("atelier", "")}
                className="inline-flex items-center gap-1 border border-rose text-rose bg-white px-2.5 py-1 rounded-sm text-xs hover:bg-rose/5 transition"
              >
                <span>Atelier: {activeAtelier}</span>
                <X className="h-3 w-3" />
              </button>
            )}

            {activeCity && (
              <button
                type="button"
                onClick={() => setParam("city", "")}
                className="inline-flex items-center gap-1 border border-rose text-rose bg-white px-2.5 py-1 rounded-sm text-xs hover:bg-rose/5 transition"
              >
                <span>City: {activeCity}</span>
                <X className="h-3 w-3" />
              </button>
            )}

            {searchQuery && (
              <button
                type="button"
                onClick={() => setParam("q", "")}
                className="inline-flex items-center gap-1 border border-rose text-rose bg-white px-2.5 py-1 rounded-sm text-xs hover:bg-rose/5 transition"
              >
                <span>Query: &ldquo;{searchQuery}&rdquo;</span>
                <X className="h-3 w-3" />
              </button>
            )}

            <button
              type="button"
              onClick={clearAllFilters}
              className="text-grey-soft hover:text-ink underline text-[11px] ml-1 transition"
            >
              Clear all
            </button>
          </div>
        )}

        {/* 2-Column Listing Layout (.listing) */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 items-start">
          {/* Left Filter Rail (.rail) */}
          <aside className="hidden lg:block space-y-5 text-xs text-[#5A0A26] bg-white/95 border border-[#fcb8fd] p-4 rounded-sm shadow-xs">
            {/* Availability */}
            <div className="border-b border-[#fcb8fd]/70 pb-4">
              <h4 className="text-[11px] font-bold uppercase tracking-[0.11em] text-[#5A0A26] mb-2.5">
                Availability
              </h4>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => toggleParam("availability", "stock")}
                  className={`flex items-center gap-2 w-full text-left py-1 hover:text-ink transition ${
                    activeAvailability === "stock" ? "font-bold text-ink" : ""
                  }`}
                >
                  <span
                    className={`h-3.5 w-3.5 border rounded-sm flex items-center justify-center shrink-0 ${
                      activeAvailability === "stock"
                        ? "bg-ink border-ink text-white"
                        : "border-line"
                    }`}
                  >
                    {activeAvailability === "stock" && <Check className="h-2.5 w-2.5" />}
                  </span>
                  <span>In studio ({facetCounts.availability.stock})</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleParam("availability", "order")}
                  className={`flex items-center gap-2 w-full text-left py-1 hover:text-ink transition ${
                    activeAvailability === "order" ? "font-bold text-ink" : ""
                  }`}
                >
                  <span
                    className={`h-3.5 w-3.5 border rounded-sm flex items-center justify-center shrink-0 ${
                      activeAvailability === "order"
                        ? "bg-ink border-ink text-white"
                        : "border-line"
                    }`}
                  >
                    {activeAvailability === "order" && <Check className="h-2.5 w-2.5" />}
                  </span>
                  <span>Made on order ({facetCounts.availability.order})</span>
                </button>
              </div>
            </div>

            {/* Price Filter */}
            <div className="border-b border-line pb-4">
              <h4 className="text-[11px] font-bold uppercase tracking-[0.11em] text-grey-soft mb-2.5">
                Price
              </h4>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => toggleParam("price", "under12")}
                  className={`flex items-center gap-2 w-full text-left py-1 hover:text-ink transition ${
                    activePrice === "under12" ? "font-bold text-ink" : ""
                  }`}
                >
                  <span
                    className={`h-3.5 w-3.5 border rounded-sm flex items-center justify-center shrink-0 ${
                      activePrice === "under12"
                        ? "bg-ink border-ink text-white"
                        : "border-line"
                    }`}
                  >
                    {activePrice === "under12" && <Check className="h-2.5 w-2.5" />}
                  </span>
                  <span>Under ₹12,000 ({facetCounts.price.under12})</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleParam("price", "12to14")}
                  className={`flex items-center gap-2 w-full text-left py-1 hover:text-ink transition ${
                    activePrice === "12to14" ? "font-bold text-ink" : ""
                  }`}
                >
                  <span
                    className={`h-3.5 w-3.5 border rounded-sm flex items-center justify-center shrink-0 ${
                      activePrice === "12to14"
                        ? "bg-ink border-ink text-white"
                        : "border-line"
                    }`}
                  >
                    {activePrice === "12to14" && <Check className="h-2.5 w-2.5" />}
                  </span>
                  <span>₹12,000–₹14,000 ({facetCounts.price["12to14"]})</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleParam("price", "over14")}
                  className={`flex items-center gap-2 w-full text-left py-1 hover:text-ink transition ${
                    activePrice === "over14" ? "font-bold text-ink" : ""
                  }`}
                >
                  <span
                    className={`h-3.5 w-3.5 border rounded-sm flex items-center justify-center shrink-0 ${
                      activePrice === "over14"
                        ? "bg-ink border-ink text-white"
                        : "border-line"
                    }`}
                  >
                    {activePrice === "over14" && <Check className="h-2.5 w-2.5" />}
                  </span>
                  <span>Over ₹14,000 ({facetCounts.price.over14})</span>
                </button>
              </div>
            </div>

            {/* Category Filter */}
            <div className="border-b border-line pb-4">
              <h4 className="text-[11px] font-bold uppercase tracking-[0.11em] text-grey-soft mb-2.5">
                Category
              </h4>
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {CANONICAL_TAXONOMY.map((cat) => {
                  const isSelected =
                    activeCategoryCanonical === cat ||
                    activeCategory.toLowerCase() === cat.toLowerCase();
                  const count = facetCounts.categories[cat] || 0;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleParam("category", slugifyCategory(cat))}
                      className={`flex items-center justify-between w-full text-left py-1 hover:text-ink transition ${
                        isSelected ? "font-bold text-ink" : ""
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className={`h-3.5 w-3.5 border rounded-sm flex items-center justify-center shrink-0 ${
                            isSelected ? "bg-ink border-ink text-white" : "border-line"
                          }`}
                        >
                          {isSelected && <Check className="h-2.5 w-2.5" />}
                        </span>
                        <span>{cat}</span>
                      </span>
                      <span className="text-[11px] text-grey-muted">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Atelier Filter */}
            <div className="border-b border-line pb-4">
              <h4 className="text-[11px] font-bold uppercase tracking-[0.11em] text-grey-soft mb-2.5">
                Atelier
              </h4>
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {Object.entries(facetCounts.ateliers)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 10)
                  .map(([name, count]) => {
                    const isSelected = activeAtelier.toLowerCase() === name.toLowerCase();
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => toggleParam("atelier", name)}
                        className={`flex items-center justify-between w-full text-left py-1 hover:text-ink transition ${
                          isSelected ? "font-bold text-ink" : ""
                        }`}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <span
                            className={`h-3.5 w-3.5 border rounded-sm flex items-center justify-center shrink-0 ${
                              isSelected ? "bg-ink border-ink text-white" : "border-line"
                            }`}
                          >
                            {isSelected && <Check className="h-2.5 w-2.5" />}
                          </span>
                          <span className="truncate">{name}</span>
                        </span>
                        <span className="text-[11px] text-grey-muted ml-1">({count})</span>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* City Filter */}
            <div className="pb-4">
              <h4 className="text-[11px] font-bold uppercase tracking-[0.11em] text-grey-soft mb-2.5">
                Atelier City
              </h4>
              <div className="space-y-1.5">
                {Object.entries(facetCounts.cities)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 6)
                  .map(([city, count]) => {
                    const isSelected = activeCity.toLowerCase() === city.toLowerCase();
                    return (
                      <button
                        key={city}
                        type="button"
                        onClick={() => toggleParam("city", city)}
                        className={`flex items-center justify-between w-full text-left py-1 hover:text-ink transition ${
                          isSelected ? "font-bold text-ink" : ""
                        }`}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <span
                            className={`h-3.5 w-3.5 border rounded-sm flex items-center justify-center shrink-0 ${
                              isSelected ? "bg-ink border-ink text-white" : "border-line"
                            }`}
                          >
                            {isSelected && <Check className="h-2.5 w-2.5" />}
                          </span>
                          <span>{city}</span>
                        </span>
                        <span className="text-[11px] text-grey-muted">({count})</span>
                      </button>
                    );
                  })}
              </div>
            </div>
          </aside>

          {/* Right Product Grid (.grid) - 4 in a row, compact Amazon style */}
          <div className="w-full">
            {filteredDesigns.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
                {filteredDesigns.map((d) => (
                  <DesignCard key={d.slug} design={d} compact={true} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-wash rounded-sm border border-line p-8">
                <h3 className="text-lg font-serif italic font-normal text-ink">
                  No pieces matched your selected filters
                </h3>
                <p className="text-xs text-grey-soft mt-1.5 max-w-sm mx-auto">
                  Try clearing active filter tags or searching for a different style or atelier.
                </p>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="mt-4 rounded-sm bg-ink px-6 py-2.5 text-xs font-semibold text-white hover:bg-rose transition"
                >
                  Reset all filters
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Filter Drawer */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex bg-black/40 backdrop-blur-sm lg:hidden">
          <div className="ml-auto w-full max-w-xs bg-paper h-full p-5 overflow-y-auto flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <h3 className="text-sm font-bold uppercase tracking-wider text-ink">
                  Filters
                </h3>
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-1 text-grey-soft hover:text-ink"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Mobile Availability */}
              <div className="py-3 border-b border-line text-xs">
                <h4 className="font-bold text-ink mb-2">Availability</h4>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => toggleParam("availability", "stock")}
                    className="flex items-center gap-2 w-full text-left"
                  >
                    <span
                      className={`h-4 w-4 border rounded-sm flex items-center justify-center ${
                        activeAvailability === "stock" ? "bg-ink border-ink text-white" : "border-line"
                      }`}
                    >
                      {activeAvailability === "stock" && <Check className="h-3 w-3" />}
                    </span>
                    <span>In studio</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleParam("availability", "order")}
                    className="flex items-center gap-2 w-full text-left"
                  >
                    <span
                      className={`h-4 w-4 border rounded-sm flex items-center justify-center ${
                        activeAvailability === "order" ? "bg-ink border-ink text-white" : "border-line"
                      }`}
                    >
                      {activeAvailability === "order" && <Check className="h-3 w-3" />}
                    </span>
                    <span>Made on order</span>
                  </button>
                </div>
              </div>

              {/* Mobile Category */}
              <div className="py-3 border-b border-line text-xs">
                <h4 className="font-bold text-ink mb-2">Category</h4>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {CANONICAL_TAXONOMY.map((cat) => {
                    const isSelected =
                      activeCategoryCanonical === cat ||
                      activeCategory.toLowerCase() === cat.toLowerCase();
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleParam("category", slugifyCategory(cat))}
                        className={`block w-full text-left py-1 ${
                          isSelected ? "font-bold text-rose" : "text-grey-soft"
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-line flex gap-2">
              <button
                type="button"
                onClick={() => {
                  clearAllFilters();
                  setIsMobileFilterOpen(false);
                }}
                className="flex-1 py-2.5 border border-line text-xs font-semibold rounded-sm text-grey-soft"
              >
                Clear all
              </button>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-1 py-2.5 bg-ink text-white text-xs font-semibold rounded-sm hover:bg-rose"
              >
                Apply ({filteredDesigns.length})
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}