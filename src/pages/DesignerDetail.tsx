import React, { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useDesigner } from "@/hooks/useDesigners";
import { useDesignerProducts } from "@/hooks/useDesignerProducts";
import { CallRequest } from "@/components/CallRequest";
import { Media } from "@/components/Media";
import { DesignCard } from "@/components/Cards";
import { Skeleton } from "@/components/ui/skeleton";
import { transformProductToDesignStrict } from "@/lib/adapters/productAdapter";
import { getBoutiquePriceRange } from "@/lib/adapters/boutiqueAdapter";
import { Sparkles, MapPin } from "lucide-react";

export default function DesignerDetail() {
  const { designerId } = useParams<{ designerId: string }>();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const { data: designer, isLoading: isDesignerLoading } = useDesigner(designerId || "");
  const { data: productsData, isLoading: isProductsLoading } = useDesignerProducts(designerId);

  const rawProducts = useMemo(() => {
    return productsData?.products || [];
  }, [productsData]);

  // Categories available within this specific atelier
  const atelierCategories = useMemo(() => {
    const set = new Set<string>();
    rawProducts.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ["All", ...Array.from(set)];
  }, [rawProducts]);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "All") return rawProducts;
    return rawProducts.filter((p) => p.category === selectedCategory);
  }, [rawProducts, selectedCategory]);

  if (isDesignerLoading) {
    return (
      <div className="min-h-screen bg-warm-white text-ink flex flex-col">
        <Header />
        <main className="flex-1 max-w-7xl mx-auto px-5 py-12 w-full">
          <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-10">
            <div className="space-y-4">
              <Skeleton className="h-6 w-32 bg-parchment" />
              <Skeleton className="h-12 w-3/4 bg-parchment" />
              <Skeleton className="h-32 w-full bg-parchment" />
            </div>
            <Skeleton className="aspect-[5/3] bg-parchment rounded-xl" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!designer) {
    return (
      <div className="min-h-screen bg-warm-white text-ink flex flex-col">
        <Header />
        <main className="flex-1 max-w-3xl mx-auto px-5 py-24 text-center">
          <h1 className="font-display text-4xl font-normal">Atelier Not Found</h1>
          <p className="mt-3 text-ink-soft">
            This atelier profile could not be located in our curated registry.
          </p>
          <Link
            to="/designers"
            className="mt-6 inline-block rounded-full bg-ink px-7 py-3 text-xs font-medium text-warm-white hover:bg-rose transition"
          >
            Return to All Ateliers
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-white text-ink flex flex-col selection:bg-rose selection:text-white">
      <Header />

      <main className="flex-1 mx-auto max-w-7xl px-5 py-8 sm:py-12 w-full">
        <Link
          to="/designers"
          className="text-xs uppercase tracking-[0.16em] font-medium text-ink-soft hover:text-rose transition"
        >
          ← All Ateliers
        </Link>

        {/* Atelier Hero & Story */}
        <div className="mt-6 grid gap-12 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] font-semibold text-rose">
              <MapPin className="h-3.5 w-3.5" />
              <span>{designer.city} · India</span>
            </div>
            <h1 className="mt-2 font-display text-4xl sm:text-5xl font-normal leading-tight">
              {designer.brand_name || designer.name}
            </h1>
            <p className="mt-2 text-base text-ink-soft font-medium">
              Lead Couturier: {designer.name} · {designer.category || "Independent Atelier"}
            </p>
            <p className="mt-6 text-base leading-relaxed text-ink font-light">
              {designer.description ||
                "Independent atelier crafting authentic bespoke garments and contemporary silhouettes on order for clients across India."}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-ink-soft font-medium">
              <span className="rounded-full bg-parchment/80 px-4 py-1.5">
                Price range: {getBoutiquePriceRange(designer.id || designer.name)}
              </span>
              <span className="rounded-full bg-blush px-4 py-1.5 text-rose flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                <span>Verified Independent Atelier</span>
              </span>
            </div>
          </div>

          {/* Call Consultation Panel */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            {designer.profile_image || designer.banner_image ? (
              <Media
                src={designer.profile_image || designer.banner_image}
                alt={designer.brand_name}
                ratio="aspect-[5/3]"
                priority
              />
            ) : null}
            <div className="mt-5 rounded-xl border border-black/10 bg-parchment/60 p-6">
              <h2 className="font-display text-2xl font-normal leading-tight">
                Talk to {designer.name.split(" ")[0]} directly
              </h2>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-ink-soft">
                Fifteen minutes, free, before you place an order. Ask about custom sizing, sleeve modifications, neckline adjustments, or event timelines.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-ink-soft">
                <li>• Direct consultation with the maker</li>
                <li>• Video or voice call in your preferred language</li>
                <li>• Custom measurements taken on file</li>
              </ul>
              <div className="mt-5">
                <CallRequest
                  boutique={designer.brand_name || designer.name}
                  owner={designer.name}
                  variant="solid"
                  label={`Request a Call with ${designer.name.split(" ")[0]}`}
                />
              </div>
            </div>
          </aside>
        </div>

        {/* Mini-Storefront: Category Filter & Creations Grid */}
        <div className="mt-20 border-t border-black/5 pt-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-rose">
                Atelier Catalog
              </span>
              <h2 className="mt-1 font-display text-3xl font-normal">
                Shop {designer.brand_name || designer.name}
              </h2>
              <p className="mt-1 text-xs text-ink-soft">
                {rawProducts.length} {rawProducts.length === 1 ? "creation" : "creations"} available from this atelier
              </p>
            </div>

            {/* Atelier internal category pills */}
            {atelierCategories.length > 2 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
                {atelierCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`shrink-0 rounded-full px-3.5 py-1 text-xs font-medium transition ${
                      selectedCategory === cat
                        ? "bg-rose text-white"
                        : "border border-black/10 bg-warm-white text-ink hover:border-black/30"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {isProductsLoading ? (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse space-y-3">
                  <div className="aspect-[4/5] rounded-md bg-parchment" />
                  <div className="h-4 w-3/4 rounded bg-parchment" />
                  <div className="h-3 w-1/2 rounded bg-parchment" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="mt-8 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {filteredProducts.map((p) => {
                const adapted = transformProductToDesignStrict({
                  id: p.id,
                  name: p.title,
                  brand: designer.brand_name || designer.name,
                  price: p.price,
                  originalPrice: p.original_price,
                  category: p.category as any,
                  images: p.images,
                  sizes: p.sizes,
                  colors: p.colors,
                  description: "",
                  material: "Artisanal textile",
                  inStock: true,
                  tags: [],
                });
                return <DesignCard key={p.id} design={adapted} />;
              })}
            </div>
          ) : (
            <div className="mt-8 rounded-xl border border-dashed border-black/20 p-8 text-center bg-parchment/30 max-w-xl mx-auto">
              <p className="text-sm text-ink-soft">
                Pieces in this category from this atelier are currently made exclusively on order. Book a consultation call above to commission a bespoke design.
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
