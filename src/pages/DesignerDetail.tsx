import React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useDesigner } from "@/hooks/useDesigners";
import { useDesignerProducts } from "@/hooks/useDesignerProducts";
import { CallRequest } from "@/components/CallRequest";
import { Media } from "@/components/Media";
import { DesignCard } from "@/components/Cards";
import { Skeleton } from "@/components/ui/skeleton";
import { transformProductToDesignStrict, getUniformProductPrice } from "@/lib/adapters/productAdapter";
import { getBoutiquePriceRange } from "@/lib/adapters/boutiqueAdapter";

export default function DesignerDetail() {
  const { designerId } = useParams<{ designerId: string }>();
  const navigate = useNavigate();

  const { data: designer, isLoading: isDesignerLoading } = useDesigner(designerId || "");
  const { data: productsData, isLoading: isProductsLoading } = useDesignerProducts(designerId);

  if (isDesignerLoading) {
    return (
      <div className="min-h-screen bg-ivory text-ink flex flex-col">
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
      <div className="min-h-screen bg-ivory text-ink flex flex-col">
        <Header />
        <main className="flex-1 max-w-3xl mx-auto px-5 py-24 text-center">
          <h1 className="font-display text-4xl font-normal">Boutique Not Found</h1>
          <p className="mt-3 text-ink-soft">
            This atelier profile could not be located.
          </p>
          <Link
            to="/designers"
            className="mt-6 inline-block rounded-full bg-ink px-7 py-3 text-xs font-medium text-ivory hover:bg-clay transition"
          >
            Return to Boutiques
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const products = (productsData?.products || [])
    .slice()
    .sort((a, b) => getUniformProductPrice(a.id) - getUniformProductPrice(b.id));

  return (
    <div className="min-h-screen bg-ivory text-ink grain flex flex-col selection:bg-clay selection:text-white">
      <Header />

      <main className="flex-1 mx-auto max-w-7xl px-5 py-12 w-full">
        <Link to="/designers" className="text-xs uppercase tracking-[0.16em] font-medium text-ink-soft hover:text-ink transition">
          ← All boutiques
        </Link>

        <div className="mt-6 grid gap-12 lg:grid-cols-[1.15fr_0.85fr]">
          {/* Atelier Story */}
          <div>
            <p className="text-xs uppercase tracking-[0.18em] font-semibold text-clay">
              {designer.city} · India
            </p>
            <h1 className="mt-2 font-display text-4xl sm:text-5xl font-normal leading-tight">
              {designer.brand_name || designer.name}
            </h1>
            <p className="mt-2 text-base text-ink-soft font-medium">
              Lead Couturier: {designer.name} · {designer.category || "Bespoke Couture"}
            </p>
            <p className="mt-6 text-base sm:text-lg leading-relaxed text-ink font-light">
              {designer.description || "Independent atelier crafting custom garments on order for discerning clients across India."}
            </p>

            <div className="mt-6 inline-flex items-center rounded-full bg-parchment px-4 py-1.5 text-xs text-ink-soft font-medium">
              Price range: {getBoutiquePriceRange(designer.id || designer.name)}
            </div>
          </div>

          {/* Sticky Call Consultation Panel */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <Media
              src={designer.profile_image || designer.banner_image}
              alt={designer.brand_name}
              palette={{ from: "#24402f", to: "#415c4d", accent: "#a3853f" }}
              ratio="aspect-[5/3]"
              priority
            />
            <div className="mt-5 rounded-2xl border border-black/10 bg-parchment/60 p-6">
              <h2 className="font-display text-2xl font-normal leading-tight">
                Talk to {designer.name.split(" ")[0]} first
              </h2>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-ink-soft">
                Fifteen minutes, free, before you spend anything. Ask about custom sizing, a change to the neckline or sleeve, or whether a bespoke piece can be ready by your event date.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-ink-soft">
                <li>• Direct consultation with the maker</li>
                <li>• Video or voice call in your preferred language</li>
                <li>• Free measurements consultation</li>
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

        {/* Studio Creations Grid */}
        <div className="mt-20 border-t border-black/5 pt-12">
          <div className="flex items-end justify-between gap-6">
            <div>
              <h2 className="font-display text-3xl font-normal">From the studio</h2>
              <p className="mt-1 text-xs text-ink-soft">
                {products.length} {products.length === 1 ? "design" : "designs"} available from this atelier
              </p>
            </div>
          </div>

          {products.length > 0 ? (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((p) => {
                const adapted = transformProductToDesignStrict({
                  id: p.id,
                  name: p.title,
                  brand: designer.brand_name || designer.name,
                  price: p.price,
                  originalPrice: p.original_price,
                  category: "dresses",
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
            <div className="mt-8 rounded-xl border border-dashed border-ink/20 p-8 text-center bg-parchment/30">
              <p className="text-sm text-ink-soft">
                All pieces from this atelier are currently made exclusively on order. Book a consultation call above to commission a bespoke design.
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
