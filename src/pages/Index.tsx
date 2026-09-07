import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DesignCard, formatINR } from "@/components/Cards";
import { useCatalogProducts } from "@/hooks/useCatalogProducts";
import { useDesigners } from "@/hooks/useDesigners";
import { DesignVM } from "@/lib/adapters/productAdapter";
import { ArrowRight, ShieldCheck, Sparkles, Truck, RefreshCw, CheckCircle2 } from "lucide-react";

// City pairs for animated hero value proposition
const CITY_PAIRS = [
  ["Delhi", "Mumbai"],
  ["Bengaluru", "Lucknow"],
  ["Kolkata", "Jaipur"],
  ["Chennai", "Amritsar"],
  ["Pune", "Hyderabad"],
];

// Curated Category Blocks with high-res mockup assets
const CATEGORY_BLOCKS = [
  { title: "Lehengas", count: 46, image: "/mockup-assets/lengha-30.jpg", path: "/collections?category=Lehengas" },
  { title: "Sarees", count: 21, image: "/mockup-assets/saree-15.jpg", path: "/collections?category=Sarees" },
  { title: "Western Dresses", count: 30, image: "/mockup-assets/dresses-western-25.jpg", path: "/collections?category=Western%20Dresses" },
  { title: "Bags", count: 20, image: "/mockup-assets/bags-14.jpg", path: "/collections?category=Bags" },
  { title: "Shoes", count: 24, image: "/mockup-assets/shoes-14.jpg", path: "/collections?category=Shoes" },
  { title: "Tops", count: 17, image: "/mockup-assets/tops-western-09.jpg", path: "/collections?category=Tops" },
  { title: "Indo-Western", count: 8, image: "/mockup-assets/indowesteern-03.jpg", path: "/collections?category=Indo-Western" },
  { title: "Indian Co-ords", count: 17, image: "/mockup-assets/coord-indian-04.jpg", path: "/collections?category=Indian%20Co-ords" },
  { title: "Jumpsuits", count: 4, image: "/mockup-assets/jumpsuits-02.jpg", path: "/collections?category=Jumpsuits" },
  { title: "Bottoms", count: 6, image: "/mockup-assets/bottoms-03.jpg", path: "/collections?category=Bottoms" },
  { title: "Western Co-ords", count: 7, image: "/mockup-assets/coord-western-02.jpg", path: "/collections?category=Western%20Co-ords" },
  { title: "View All Pieces", count: 311, image: "/mockup-assets/lengha-12.jpg", path: "/collections" },
];

// Featured Ateliers Rail
const FEATURED_ATELIERS = [
  { name: "Atelier Vindhya", city: "Hyderabad", pieces: 24, rating: 4.8, reviews: 96, image: "/mockup-assets/lengha-30.jpg", slug: "vindhya" },
  { name: "Kamala House", city: "Chennai", pieces: 21, rating: 4.8, reviews: 412, image: "/mockup-assets/saree-15.jpg", slug: "kamala" },
  { name: "Noor Bagh", city: "Lucknow", pieces: 24, rating: 4.9, reviews: 296, image: "/mockup-assets/indowesteern-03.jpg", slug: "noor" },
  { name: "Ruh Studio", city: "Goa", pieces: 34, rating: 4.7, reviews: 289, image: "/mockup-assets/dresses-western-25.jpg", slug: "ruh" },
  { name: "Thaila Co.", city: "Jaipur", pieces: 20, rating: 4.8, reviews: 612, image: "/mockup-assets/bags-14.jpg", slug: "thaila" },
  { name: "Juti House", city: "Amritsar", pieces: 24, rating: 4.9, reviews: 728, image: "/mockup-assets/shoes-14.jpg", slug: "juti" },
  { name: "Saanjh Label", city: "Bengaluru", pieces: 17, rating: 4.8, reviews: 344, image: "/mockup-assets/tops-western-09.jpg", slug: "saanjh" },
  { name: "Rangreza", city: "Jaipur", pieces: 18, rating: 4.8, reviews: 508, image: "/mockup-assets/coord-indian-04.jpg", slug: "rangreza" },
];

export default function Index() {
  const { data: catalogData } = useCatalogProducts();
  const designs = catalogData?.designs || [];
  const navigate = useNavigate();

  // City animation rotator
  const [cityIndex, setCityIndex] = useState(0);
  const [isCityFading, setIsCityFading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsCityFading(true);
      setTimeout(() => {
        setCityIndex((prev) => (prev + 1) % CITY_PAIRS.length);
        setIsCityFading(false);
      }, 500);
    }, 3400);

    return () => clearInterval(timer);
  }, []);

  const [cityA, cityB] = CITY_PAIRS[cityIndex];

  // New In Pieces (first 8 real items)
  const newInPieces = useMemo(() => designs.slice(0, 8), [designs]);

  // Under ₹12,000 Pieces
  const under12kPieces = useMemo(() => {
    return designs.filter((d) => d.price <= 12000).slice(0, 4);
  }, [designs]);

  // Floating Hero "Shop This Look" piece
  const heroFeaturedPiece = designs[0] || {
    title: "Gulaab Lehenga",
    boutique: "Atelier Vindhya",
    city: "Hyderabad",
    price: 9300,
    originalPrice: 12400,
    slug: "gulaab-lehenga",
  };

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col selection:bg-rose selection:text-white">
      <Header />

      <main className="flex-1">
        {/* ============================================================ */}
        {/* 1. HERO BANNER (.banner) with Animated City Rotator         */}
        {/* ============================================================ */}
        <section className="relative min-h-[460px] sm:min-h-[520px] overflow-hidden bg-stone flex items-center">
          {/* Background image */}
          <img
            src="/mockup-assets/lengha-03.jpg"
            alt="OGURA Indian Fashion Atelier"
            className="absolute inset-0 w-full h-full object-cover object-[50%_28%]"
          />

          {/* Contrast Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-ink/80 via-ink/40 to-transparent" />

          {/* Hero Content */}
          <div className="relative max-w-[1320px] mx-auto px-4 sm:px-8 py-16 sm:py-24 text-white z-10 w-full">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-85 text-rose-light">
                311 original pieces · 40 ateliers · new drops weekly
              </p>

              <h1 className="mt-4 font-sans text-3xl sm:text-5xl lg:text-6xl font-medium tracking-tight leading-[1.08]">
                Sit in{" "}
                <span
                  className={`font-serif italic font-normal inline-block transition-all duration-500 text-white ${
                    isCityFading ? "opacity-0 -translate-y-2" : "opacity-100 translate-y-0"
                  }`}
                >
                  {cityA}
                </span>
                .<br />
                Order from a boutique in{" "}
                <span
                  className={`font-serif italic font-normal inline-block transition-all duration-500 text-white ${
                    isCityFading ? "opacity-0 -translate-y-2" : "opacity-100 translate-y-0"
                  }`}
                >
                  {cityB}
                </span>
                .
              </h1>

              <p className="mt-4 text-sm sm:text-base leading-relaxed opacity-90 max-w-lg">
                311 pieces from 40 independent studios across India — the kind you only find by walking in. Most ship this week, and you can talk to a designer before you order.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  to="/collections?sort=new"
                  className="rounded-sm bg-white px-7 py-3 text-xs font-semibold text-ink tracking-wide hover:bg-wash transition shadow-md"
                >
                  Shop new in
                </Link>
                <Link
                  to="/how-it-works"
                  className="rounded-sm border border-white/80 px-7 py-3 text-xs font-medium text-white tracking-wide hover:bg-white/10 transition"
                >
                  How the call works
                </Link>
              </div>
            </div>
          </div>

          {/* Floating "Shop This Look" Card (.shopthis) */}
          <div className="hidden lg:block absolute right-8 bottom-8 z-20 bg-white/95 rounded-sm p-4 min-w-[220px] shadow-2xl border border-line backdrop-blur-sm">
            <p className="text-[10px] font-medium tracking-widest uppercase text-grey-muted">
              {heroFeaturedPiece.boutique} · {heroFeaturedPiece.city || "Hyderabad"}
            </p>
            <p className="font-serif italic text-lg leading-tight text-ink mt-1 font-normal">
              {heroFeaturedPiece.title}
            </p>
            <p className="text-xs font-semibold text-ink mt-1 flex items-baseline gap-2">
              <span>{formatINR(heroFeaturedPiece.price)}</span>
              {heroFeaturedPiece.originalPrice && (
                <span className="text-[11px] text-grey-muted line-through font-normal">
                  {formatINR(heroFeaturedPiece.originalPrice)}
                </span>
              )}
            </p>
            <Link
              to={`/product/${heroFeaturedPiece.slug}`}
              className="inline-block text-xs font-semibold text-rose mt-2 hover:underline"
            >
              Shop this look →
            </Link>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 2. THREE PROMO TILES (.promos)                              */}
        {/* ============================================================ */}
        <section className="max-w-[1320px] mx-auto px-4 sm:px-8 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Tile 1 */}
            <Link
              to="/collections?price=under12"
              className="group relative aspect-[16/7] overflow-hidden bg-stone rounded-sm"
            >
              <img
                src="/mockup-assets/tops-western-09.jpg"
                alt="Under ₹12,000"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,0.8,0.28,1)] group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-ink/75 to-ink/20" />
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-white">
                <b className="block text-base sm:text-lg font-medium tracking-tight">Under ₹12,000</b>
                <span className="inline-block mt-1 text-xs opacity-90 border-b border-white/70 pb-0.5">
                  Curated luxury pieces
                </span>
              </div>
            </Link>

            {/* Tile 2 */}
            <Link
              to="/collections?availability=order"
              className="group relative aspect-[16/7] overflow-hidden bg-stone rounded-sm"
            >
              <img
                src="/mockup-assets/lengha-07.jpg"
                alt="Made to order"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,0.8,0.28,1)] group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-ink/75 to-ink/20" />
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-white">
                <b className="block text-base sm:text-lg font-medium tracking-tight">Made on order</b>
                <span className="inline-block mt-1 text-xs opacity-90 border-b border-white/70 pb-0.5">
                  Cut for your exact fit
                </span>
              </div>
            </Link>

            {/* Tile 3 */}
            <Link
              to="/collections?availability=stock"
              className="group relative aspect-[16/7] overflow-hidden bg-stone rounded-sm"
            >
              <img
                src="/mockup-assets/bags-14.jpg"
                alt="Ships in 48 hrs"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,0.8,0.28,1)] group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-ink/75 to-ink/20" />
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-white">
                <b className="block text-base sm:text-lg font-medium tracking-tight">Ships in 48 hrs</b>
                <span className="inline-block mt-1 text-xs opacity-90 border-b border-white/70 pb-0.5">
                  Ready in studio now
                </span>
              </div>
            </Link>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 3. SHOP BY CATEGORY (.cblocks)                              */}
        {/* ============================================================ */}
        <section className="max-w-[1320px] mx-auto px-4 sm:px-8 pt-12 sm:pt-16">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl sm:text-2xl font-medium tracking-tight text-ink font-sans">
              Shop by category
            </h2>
            <Link
              to="/collections"
              className="text-xs font-semibold text-grey-soft hover:text-rose transition border-b border-line pb-0.5"
            >
              View all
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {CATEGORY_BLOCKS.map((c, i) => (
              <Link
                key={i}
                to={c.path}
                className="group relative aspect-[4/5] overflow-hidden bg-stone rounded-sm"
              >
                <img
                  src={c.image}
                  alt={c.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,0.8,0.28,1)] group-hover:scale-106"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3.5 text-white">
                  <b className="block text-sm sm:text-base font-medium leading-tight">
                    {c.title}
                  </b>
                  <span className="text-[11px] opacity-85">{c.count} pieces</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ============================================================ */}
        {/* 4. THE STUDIOS BEHIND THEM (.arail)                         */}
        {/* ============================================================ */}
        <section className="max-w-[1320px] mx-auto px-4 sm:px-8 pt-14 sm:pt-18">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl sm:text-2xl font-medium tracking-tight text-ink font-sans">
                The studios behind them
              </h2>
              <p className="text-xs text-grey-soft mt-0.5">
                Verified independent creators across India
              </p>
            </div>
            <Link
              to="/designers"
              className="text-xs font-semibold text-grey-soft hover:text-rose transition border-b border-line pb-0.5"
            >
              Meet all 40 ateliers
            </Link>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none">
            {FEATURED_ATELIERS.map((a, i) => (
              <Link
                key={i}
                to={`/collections?atelier=${encodeURIComponent(a.name)}`}
                className="group shrink-0 w-[190px] sm:w-[210px] block cursor-pointer"
              >
                <div className="aspect-[5/4] overflow-hidden rounded-sm bg-stone">
                  <img
                    src={a.image}
                    alt={a.name}
                    className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,0.8,0.28,1)] group-hover:scale-105"
                  />
                </div>
                <p className="text-sm font-semibold text-ink mt-2.5 group-hover:text-rose transition leading-snug">
                  {a.name}
                </p>
                <p className="text-xs text-grey-soft mt-0.5">
                  {a.city} · {a.pieces} pieces
                </p>
                <p className="text-[11px] text-grey-soft mt-1 flex items-center gap-1">
                  <span className="text-rose font-bold">★</span>
                  <span className="font-semibold text-ink">{a.rating}</span>
                  <span className="text-grey-muted">({a.reviews})</span>
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* ============================================================ */}
        {/* 5. NEW IN THIS WEEK (Product Grid)                          */}
        {/* ============================================================ */}
        <section className="max-w-[1320px] mx-auto px-4 sm:px-8 pt-14 sm:pt-18">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl sm:text-2xl font-medium tracking-tight text-ink font-sans">
                New in this week
              </h2>
              <p className="text-xs text-grey-soft mt-0.5">
                Fresh drops directly from atelier workrooms
              </p>
            </div>
            <Link
              to="/collections?sort=new"
              className="text-xs font-semibold text-grey-soft hover:text-rose transition border-b border-line pb-0.5"
            >
              Shop all new in
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {newInPieces.map((d) => (
              <DesignCard key={d.slug} design={d} />
            ))}
          </div>
        </section>

        {/* ============================================================ */}
        {/* 6. CURATED EDITS / UNDER ₹12,000                            */}
        {/* ============================================================ */}
        {under12kPieces.length > 0 && (
          <section className="max-w-[1320px] mx-auto px-4 sm:px-8 pt-14 sm:pt-18">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl sm:text-2xl font-medium tracking-tight text-ink font-sans">
                  Under ₹12,000
                </h2>
                <p className="text-xs text-grey-soft mt-0.5">
                  Artisanal luxury within accessible reach
                </p>
              </div>
              <Link
                to="/collections?price=under12"
                className="text-xs font-semibold text-grey-soft hover:text-rose transition border-b border-line pb-0.5"
              >
                Shop all {under12kPieces.length}+ pieces
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
              {under12kPieces.map((d) => (
                <DesignCard key={d.slug} design={d} />
              ))}
            </div>
          </section>
        )}

        {/* ============================================================ */}
        {/* 7. THE TRUST LAYER (.trust)                                 */}
        {/* ============================================================ */}
        <section className="max-w-[1320px] mx-auto px-4 sm:px-8 pt-16 sm:pt-20">
          <div className="bg-wash border border-line rounded-sm p-6 sm:p-10">
            <div className="max-w-xl">
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-rose">
                The Trust Layer
              </span>
              <h2 className="font-sans text-2xl sm:text-3xl font-medium text-ink mt-1.5 tracking-tight">
                WHY OGURA
              </h2>
              <p className="text-xs sm:text-sm text-grey-soft mt-1 leading-relaxed">
                Independent creator brands. One trusted, escrow-protected marketplace.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-8 mt-8 pt-6 border-t border-line">
              <div>
                <span className="font-serif italic text-2xl text-rose block">01</span>
                <h3 className="text-sm font-semibold text-ink mt-1.5">Original creator studios</h3>
                <p className="text-xs text-grey-soft mt-1 leading-relaxed">
                  Every piece is sourced directly from verified ateliers. Zero unauthorized resellers or mass copies.
                </p>
              </div>
              <div>
                <span className="font-serif italic text-2xl text-rose block">02</span>
                <h3 className="text-sm font-semibold text-ink mt-1.5">Curated by OGURA</h3>
                <p className="text-xs text-grey-soft mt-1 leading-relaxed">
                  Selected for exceptional textile heritage, artisanal distinction, and rigorous finishing.
                </p>
              </div>
              <div>
                <span className="font-serif italic text-2xl text-rose block">03</span>
                <h3 className="text-sm font-semibold text-ink mt-1.5">Secure payment</h3>
                <p className="text-xs text-grey-soft mt-1 leading-relaxed">
                  Bank-grade encrypted Razorpay transactions with server-authoritative settlement.
                </p>
              </div>
              <div>
                <span className="font-serif italic text-2xl text-rose block">04</span>
                <h3 className="text-sm font-semibold text-ink mt-1.5">Direct studio delivery</h3>
                <p className="text-xs text-grey-soft mt-1 leading-relaxed">
                  Dispatched directly from the maker&apos;s workshop with tracked express courier to your doorstep.
                </p>
              </div>
              <div>
                <span className="font-serif italic text-2xl text-rose block">05</span>
                <h3 className="text-sm font-semibold text-ink mt-1.5">Fit & alteration assist</h3>
                <p className="text-xs text-grey-soft mt-1 leading-relaxed">
                  Direct concierge consult with maker before cutting, plus 7-day alteration assistance.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 8. SELLER ONBOARDING CTA                                    */}
        {/* ============================================================ */}
        <section className="max-w-[1320px] mx-auto px-4 sm:px-8 py-16 sm:py-20 text-center">
          <div className="max-w-2xl mx-auto space-y-4">
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-rose">
              For Independent Boutiques & Ateliers
            </span>
            <h2 className="font-sans text-2xl sm:text-4xl font-medium tracking-tight text-ink">
              Reach customers nationwide without sending inventory to a warehouse.
            </h2>
            <p className="text-xs sm:text-sm text-grey-soft max-w-lg mx-auto leading-relaxed">
              No SKU minimum. No stock consignment. Photograph your creations, set lead times, and retain direct courier dispatch. OGURA handles discovery, escrow payment, and concierge support.
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <a
                href="/seller-login"
                className="rounded-sm bg-ink px-7 py-3 text-xs font-semibold text-white hover:bg-rose transition shadow-sm"
              >
                List your atelier on OGURA
              </a>
              <Link
                to="/how-it-works"
                className="rounded-sm border border-line px-7 py-3 text-xs font-medium text-ink hover:bg-wash transition"
              >
                Learn how it works
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
