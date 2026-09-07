import React from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Media } from "@/components/Media";
import { Rail } from "@/components/Rail";
import { BoutiqueCard } from "@/components/Cards";
import { CallRequest } from "@/components/CallRequest";
import { useCatalogProducts } from "@/hooks/useCatalogProducts";
import { useDesigners } from "@/hooks/useDesigners";
import { CANONICAL_TAXONOMY, CanonicalCategory } from "@/lib/adapters/productAdapter";
import { transformDesignerToBoutiqueStrict } from "@/lib/adapters/boutiqueAdapter";

export default function Index() {
  const { data: catalogData, isLoading: isCatalogLoading } = useCatalogProducts();
  const { data: designers = [], isLoading: isDesignersLoading } = useDesigners();

  const designs = catalogData?.designs || [];
  
  // Pick a real production piece for the hero spotlight
  const hero = designs.find((d) => d.image && d.image !== "/placeholder.svg") || designs[0];
  const inStudioCount = designs.filter((d) => d.readyStock !== null).length;

  return (
    <div className="min-h-screen bg-ivory text-ink grain flex flex-col selection:bg-clay selection:text-white">
      <Header />

      <main className="flex-1">
        {/* Editorial Hero */}
        <section className="border-b border-black/5">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:py-16">
            <div className="rise">
              <span className="text-xs uppercase tracking-[0.2em] font-semibold text-clay">
                India&apos;s Boutique Fashion Collective
              </span>
              <h1 className="mt-3 font-display text-4xl sm:text-6xl leading-[1.05] tracking-tight font-normal">
                Sit in Delhi.
                <br />
                Order from a boutique
                <br />
                <span className="text-clay italic">in Mumbai.</span>
              </h1>
              <p className="mt-6 max-w-lg text-base sm:text-lg leading-relaxed text-ink-soft">
                {inStudioCount > 0 ? `${inStudioCount} pieces` : "Dozens of creations"} are hanging in a studio somewhere in India right now — order one and it ships this week. Want it in your size, or another colour? Call the designer and they will make it for you.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/collections"
                  className="rounded-full bg-ink px-7 py-3.5 text-sm font-medium text-ivory transition hover:bg-clay"
                >
                  Browse Designs
                </Link>
                <Link
                  to="/how-it-works"
                  className="rounded-full border border-ink/20 px-7 py-3.5 text-sm font-medium text-ink transition hover:bg-parchment"
                >
                  How the call works
                </Link>
              </div>
            </div>

            {/* Featured Hero Piece */}
            {hero && (
              <div className="rise">
                <Link to={`/product/${hero.slug}`} className="group block">
                  <Media
                    src={hero.image}
                    alt={hero.title}
                    palette={hero.palette}
                    ratio="aspect-[4/5]"
                    priority
                    badge={hero.readyStock ? "Studio Stock" : undefined}
                  />
                </Link>
                <div className="mt-4 flex items-end justify-between gap-5">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-clay font-medium">This Week&apos;s Piece</p>
                    <Link to={`/product/${hero.slug}`}>
                      <h2 className="mt-1 font-display text-xl sm:text-2xl hover:text-clay font-normal">{hero.title}</h2>
                    </Link>
                    {hero.subtitle && (
                      <p className="text-xs sm:text-sm text-ink-soft line-clamp-1">{hero.subtitle}</p>
                    )}
                    <p className="mt-1.5 text-sm font-medium">
                      ₹{hero.price.toLocaleString("en-IN")}
                      <span className="text-ink-soft font-normal">
                        {" · "}
                        <span className="font-medium text-ink">{hero.boutique}</span>
                      </span>
                    </p>
                  </div>
                  <div className="shrink-0">
                    <CallRequest
                      boutique={hero.boutique}
                      owner="Lead Designer"
                      design={hero.title}
                      variant="mini"
                      label="Call Atelier"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Category Rail Sticky Bar */}
        <nav className="sticky top-[95px] z-40 border-b border-black/5 bg-ivory/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-5 py-3 scrollbar-none">
            <Link
              to="/collections"
              className="shrink-0 rounded-full border border-ink/15 bg-white/70 px-4 py-1.5 text-xs sm:text-sm font-medium transition hover:border-clay hover:bg-clay hover:text-ivory"
            >
              All Designs
            </Link>
            {CANONICAL_TAXONOMY.map((catName) => (
              <Link
                key={catName}
                to={`/collections?category=${encodeURIComponent(catName)}`}
                className="shrink-0 rounded-full border border-ink/15 bg-white/70 px-4 py-1.5 text-xs sm:text-sm font-medium transition hover:border-clay hover:bg-clay hover:text-ivory"
              >
                {catName}
              </Link>
            ))}
          </div>
        </nav>

        {/* Category Shelves in Canonical Order */}
        {CANONICAL_TAXONOMY.map((catName, idx) => {
          const categoryItems = designs.filter((d) => d.category === catName);
          if (categoryItems.length === 0) return null;

          return (
            <Rail
              key={catName}
              title={catName}
              items={categoryItems.slice(0, 8)}
              total={categoryItems.length}
              href={`/collections?category=${encodeURIComponent(catName)}`}
              priority={idx === 0}
            />
          );
        })}

        {/* Why the Call Exists */}
        <section className="mt-20 border-y border-black/5 bg-parchment/50">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-3">
            {[
              {
                h: "Buy what's on the rail",
                p: "Every piece is a real garment in a real studio. Order it as photographed and it ships in two or three days — no waiting six weeks for something simple.",
              },
              {
                h: "Or have it made for you",
                p: "Nothing in your size? Wrong colour? Fifteen free minutes with the boutique owner and they will remake it in your measurements, which we then keep on file.",
              },
              {
                h: "Money held until it fits",
                p: "You pay Ogura, not the boutique. The studio is paid after you confirm the fit, and one alteration is free anywhere in India.",
              },
            ].map((c) => (
              <div key={c.h} className="space-y-2">
                <h3 className="font-display text-2xl font-normal text-ink">{c.h}</h3>
                <p className="text-sm leading-relaxed text-ink-soft">{c.p}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Independent Boutiques & Ateliers Spotlight */}
        <section className="mx-auto max-w-7xl px-5 py-16">
          <div className="flex items-end justify-between gap-6">
            <div>
              <span className="text-xs uppercase tracking-[0.2em] font-semibold text-clay">Curated Studios</span>
              <h2 className="mt-1 font-display text-3xl sm:text-4xl font-normal">The ateliers behind them</h2>
              <p className="mt-2 text-sm text-ink-soft">
                Independent boutiques, vetted and visited. Every one takes direct consultation calls.
              </p>
            </div>
            <Link to="/designers" className="shrink-0 text-sm font-medium text-clay hover:underline">
              View all boutiques →
            </Link>
          </div>

          <div className="mt-8 grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
            {designers.slice(0, 4).map((d) => {
              const b = transformDesignerToBoutiqueStrict(d);
              return <BoutiqueCard key={b.id} b={b} count={b.productCount} />;
            })}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
