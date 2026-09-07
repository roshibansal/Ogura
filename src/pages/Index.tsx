import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DesignCard, formatINR } from "@/components/Cards";
import { useCatalogProducts } from "@/hooks/useCatalogProducts";
import { ArrowRight, ChevronRight, ShoppingBag } from "lucide-react";

// City pairs for animated hero value proposition
const CITY_PAIRS = [
  ["Delhi", "Mumbai"],
  ["Bengaluru", "Lucknow"],
  ["Kolkata", "Jaipur"],
  ["Chennai", "Amritsar"],
  ["Pune", "Hyderabad"],
];

// Rotating Hero Lookbook Looks with high-res editorial assets
const HERO_LOOKS = [
  {
    id: "look-1",
    image: "/mockup-assets/lengha-03.jpg",
    alt: "Handloom Embroidered Bridal Lehenga",
    label: "LOOK 01 | HANDLOOM HERITAGE",
    boutique: "Atelier Vindhya",
    city: "Hyderabad",
    title: "Gulaab Handloom Lehenga",
    price: 9300,
    originalPrice: 12400,
    slug: "gulaab-lehenga",
  },
  {
    id: "look-2",
    image: "/mockup-assets/saree-15.jpg",
    alt: "Kanjeevaram Temple Border Silk Saree",
    label: "LOOK 02 | PURE MULBERRY SILK",
    boutique: "Kamala House",
    city: "Chennai",
    title: "Temple Border Pure Silk Saree",
    price: 11800,
    originalPrice: 14500,
    slug: "temple-border-saree",
  },
  {
    id: "look-3",
    image: "/mockup-assets/dresses-western-25.jpg",
    alt: "Contemporary Draped Evening Gown",
    label: "LOOK 03 | SCULPTURAL SILHOUETTE",
    boutique: "Ruh Studio",
    city: "Goa",
    title: "Draped Asymmetric Satin Gown",
    price: 8400,
    originalPrice: 10500,
    slug: "draped-asymmetric-gown",
  },
  {
    id: "look-4",
    image: "/mockup-assets/bags-14.jpg",
    alt: "Sculpted Handcrafted Bag",
    label: "LOOK 04 | ARTISANAL LEATHER & SILK",
    boutique: "Thaila Co.",
    city: "Jaipur",
    title: "Sculpted Silk Envelope Bag",
    price: 4999,
    originalPrice: 6999,
    slug: "sculpted-envelope-bag",
  },
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
];

// Featured Ateliers
const FEATURED_ATELIERS = [
  { name: "Atelier Vindhya", city: "Hyderabad", pieces: 24, craft: "Heritage Handloom", image: "/mockup-assets/lengha-30.jpg" },
  { name: "Kamala House", city: "Chennai", pieces: 21, craft: "Pure Mulberry Zari", image: "/mockup-assets/saree-15.jpg" },
  { name: "Noor Bagh", city: "Lucknow", pieces: 24, craft: "Shadow Work & Zardozi", image: "/mockup-assets/indowesteern-03.jpg" },
  { name: "Ruh Studio", city: "Goa", pieces: 34, craft: "Sculptural Draping", image: "/mockup-assets/dresses-western-25.jpg" },
  { name: "Thaila Co.", city: "Jaipur", pieces: 20, craft: "Vegetable Dyed Silk", image: "/mockup-assets/bags-14.jpg" },
  { name: "Juti House", city: "Amritsar", pieces: 24, craft: "Hand-Embroidered Juttis", image: "/mockup-assets/shoes-14.jpg" },
  { name: "Saanjh Label", city: "Bengaluru", pieces: 17, craft: "Raw Silk Tailoring", image: "/mockup-assets/tops-western-09.jpg" },
  { name: "Rangreza", city: "Jaipur", pieces: 18, craft: "Bandhani & Blockprint", image: "/mockup-assets/coord-indian-04.jpg" },
];

export default function Index() {
  const { data: catalogData } = useCatalogProducts();
  const designs = catalogData?.designs || [];
  const navigate = useNavigate();

  // 1. Rotating Hero Lookbook State
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    const heroTimer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % HERO_LOOKS.length);
    }, 4800);

    return () => clearInterval(heroTimer);
  }, []);

  const activeLook = HERO_LOOKS[heroIndex];

  // 2. City animation rotator
  const [cityIndex, setCityIndex] = useState(0);
  const [isCityFading, setIsCityFading] = useState(false);

  useEffect(() => {
    const cityTimer = setInterval(() => {
      setIsCityFading(true);
      setTimeout(() => {
        setCityIndex((prev) => (prev + 1) % CITY_PAIRS.length);
        setIsCityFading(false);
      }, 500);
    }, 3200);

    return () => clearInterval(cityTimer);
  }, []);

  const [cityA, cityB] = CITY_PAIRS[cityIndex];

  // Filtered Products for Sections
  const newInPieces = useMemo(() => designs.slice(0, 4), [designs]);

  const salePieces = useMemo(() => {
    return designs.filter((d) => d.originalPrice && d.originalPrice > d.price).slice(0, 4);
  }, [designs]);

  return (
    <div className="min-h-screen bg-[#f8d2f9] text-[#5A0A26] flex flex-col selection:bg-gold selection:text-ink">
      {/* Clean Pink Header */}
      <Header />

      <main className="flex-1 w-full space-y-8 sm:space-y-12 pb-16">
        {/* ============================================================ */}
        {/* SECTION 1: HERO LOOKBOOK (PROUD, EXPANSIVE & READABLE)       */}
        {/* ============================================================ */}
        <section className="relative h-[560px] sm:h-[640px] lg:h-[700px] w-full overflow-hidden flex items-center justify-center border-b border-[#fcb8fd] shadow-[0_4px_20px_rgba(252,184,253,0.3)]">
          {/* Rotating Lookbook Background Images with Smooth Cross-Fade */}
          {HERO_LOOKS.map((look, idx) => (
            <img
              key={look.id}
              src={look.image}
              alt={look.alt}
              className={`absolute inset-0 w-full h-full object-cover object-[50%_25%] transition-opacity duration-1000 ease-in-out ${
                idx === heroIndex ? "opacity-100 scale-100" : "opacity-0 scale-105 pointer-events-none"
              }`}
            />
          ))}

          {/* High-Contrast Editorial Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#4A091E]/95 via-[#4A091E]/65 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#4A091E]/55 to-transparent" />

          {/* Hero Content Frame */}
          <div className="relative max-w-[1360px] mx-auto px-4 sm:px-8 py-10 text-white z-10 w-full flex flex-col justify-center h-full">
            <div className="max-w-2xl">
              {/* Simple Category Intro Tag */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xs bg-white/20 backdrop-blur-md border border-white/40 mb-6 shadow-sm">
                <p className="text-xs sm:text-sm font-black uppercase tracking-[0.18em] text-white">
                  Shop 40 Verified Indian Boutiques
                </p>
              </div>

              {/* Headline with Large Typography */}
              <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-normal tracking-tight leading-[1.05] text-white drop-shadow-sm">
                Sit in{" "}
                <span
                  className={`italic text-white border-b-2 border-gold pb-1 inline-block transition-all duration-500 ${
                    isCityFading ? "opacity-0 -translate-y-2" : "opacity-100 translate-y-0"
                  }`}
                >
                  {cityA}
                </span>
                .<br />
                Order from a boutique in{" "}
                <span
                  className={`italic text-gold inline-block transition-all duration-500 ${
                    isCityFading ? "opacity-0 -translate-y-2" : "opacity-100 translate-y-0"
                  }`}
                >
                  {cityB}
                </span>
                .
              </h1>

              <p className="mt-5 text-base sm:text-xl leading-relaxed text-white/95 max-w-xl font-normal">
                Authentic handcrafted clothes from 40 independent boutique shops across India. Talk directly with the makers, get custom sizing, and enjoy fast home delivery.
              </p>

              {/* Amazon Psychology Buying Button & Outline */}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  to="/collections"
                  className="rounded-sm bg-[#FFA41C] hover:bg-[#FF8F00] active:bg-[#E07E00] px-9 py-4 text-base font-extrabold text-[#0F1111] tracking-wider uppercase transition shadow-md border border-[#FF8F00]"
                >
                  Explore Marketplace
                </Link>
                <Link
                  to="/how-it-works"
                  className="rounded-sm bg-white/20 backdrop-blur-md border border-white/90 px-8 py-4 text-base font-bold text-white tracking-wider uppercase hover:bg-white/30 transition"
                >
                  How it works
                </Link>
              </div>
            </div>
          </div>

          {/* Lookbook Rotating Indicators (Bottom Left) */}
          <div className="absolute left-4 sm:left-8 bottom-6 z-20 flex items-center gap-3">
            {HERO_LOOKS.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setHeroIndex(idx)}
                className={`h-3 transition-all duration-500 rounded-full cursor-pointer ${
                  idx === heroIndex ? "w-12 bg-gold shadow-xs" : "w-3 bg-white/40 hover:bg-white/80"
                }`}
                aria-label={`Switch to Look ${idx + 1}`}
              />
            ))}
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-gold ml-2">
              0{heroIndex + 1} / 0{HERO_LOOKS.length}
            </span>
          </div>

          {/* Floating "Shop This Look" Card with Faded Pink Glow */}
          <div className="hidden lg:block absolute right-8 bottom-6 z-20 bg-white/95 rounded-sm p-6 min-w-[340px] shadow-2xl border border-[#fcb8fd] shadow-[0_0_20px_rgba(252,184,253,0.35)] backdrop-blur-md transition-all duration-500">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold tracking-widest uppercase text-[#5A0A26]">
                {activeLook.boutique} | {activeLook.city}
              </p>
              <span className="text-[10px] font-mono font-extrabold text-gold uppercase px-2 py-0.5 rounded-xs bg-[#5A0A26] text-white">
                VERIFIED SHOP
              </span>
            </div>
            <p className="font-serif italic text-2xl leading-tight text-[#5A0A26] mt-2 font-normal">
              {activeLook.title}
            </p>
            <p className="text-base font-bold text-[#5A0A26] mt-2 flex items-baseline gap-2.5">
              <span className="text-xl font-extrabold">{formatINR(activeLook.price)}</span>
              {activeLook.originalPrice && (
                <span className="text-sm text-[#5A0A26]/50 line-through font-normal">
                  {formatINR(activeLook.originalPrice)}
                </span>
              )}
            </p>
            <Link
              to={`/product/${activeLook.slug}`}
              className="mt-3.5 block text-center py-3 px-4 rounded-sm bg-[#FFA41C] hover:bg-[#FF8F00] text-[#0F1111] font-extrabold text-sm border border-[#FF8F00] shadow-xs transition"
            >
              Shop this look →
            </Link>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 2: POPULAR WAYS TO SHOP (BIGGER WIDGETS)             */}
        {/* ============================================================ */}
        <section className="max-w-[1360px] mx-auto px-4 sm:px-8 pt-2">
          <div className="mb-6 flex items-end justify-between border-b border-[#fcb8fd] pb-3">
            <div>
              <span className="text-xs sm:text-sm font-black uppercase tracking-[0.2em] text-[#B38F24]">
                WAYS TO SHOP
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#5A0A26] tracking-tight mt-1">
                Find Your Perfect Style
              </h2>
            </div>
            <p className="hidden sm:block text-sm sm:text-base font-semibold text-[#5A0A26]/80">
              Ready to ship | Custom size stitching | Budget-friendly prices
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tile 1: Under 12k */}
            <Link
              to="/collections?price=under12"
              className="group relative aspect-[16/10] min-h-[290px] sm:min-h-[320px] overflow-hidden bg-white rounded-sm border border-[#fcb8fd] shadow-[0_0_15px_rgba(252,184,253,0.3)] hover:shadow-[0_0_25px_rgba(252,184,253,0.55)] transition-all hover:border-[#fe84ff]"
            >
              <img
                src="/mockup-assets/tops-western-09.jpg"
                alt="Under ₹12,000"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,0.8,0.28,1)] group-hover:scale-106"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#4A091E]/95 via-[#4A091E]/60 to-transparent" />
              <div className="absolute left-7 top-1/2 -translate-y-1/2 text-white">
                <span className="text-xs font-black uppercase tracking-widest text-[#FFA41C] block mb-1">
                  % SALE SPECIAL
                </span>
                <b className="block text-3xl sm:text-4xl lg:text-5xl font-serif italic font-normal tracking-tight text-white drop-shadow-xs">
                  Under ₹12,000
                </b>
                <p className="text-sm sm:text-base text-white/95 mt-2 max-w-[280px] leading-relaxed font-medium">
                  Beautiful sarees, dresses and tops at easy everyday prices.
                </p>
                <span className="inline-block mt-4 text-sm font-extrabold text-[#FFA41C] border-b-2 border-[#FFA41C] pb-0.5">
                  See pieces under ₹12k →
                </span>
              </div>
            </Link>

            {/* Tile 2: Made to order */}
            <Link
              to="/collections?availability=order"
              className="group relative aspect-[16/10] min-h-[290px] sm:min-h-[320px] overflow-hidden bg-white rounded-sm border border-[#fcb8fd] shadow-[0_0_15px_rgba(252,184,253,0.3)] hover:shadow-[0_0_25px_rgba(252,184,253,0.55)] transition-all hover:border-[#fe84ff]"
            >
              <img
                src="/mockup-assets/lengha-07.jpg"
                alt="Made to order"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,0.8,0.28,1)] group-hover:scale-106"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#4A091E]/95 via-[#4A091E]/60 to-transparent" />
              <div className="absolute left-7 top-1/2 -translate-y-1/2 text-white">
                <span className="text-xs font-black uppercase tracking-widest text-gold block mb-1">
                  CUSTOM STITCHING
                </span>
                <b className="block text-3xl sm:text-4xl lg:text-5xl font-serif italic font-normal tracking-tight text-white drop-shadow-xs">
                  Made on order
                </b>
                <p className="text-sm sm:text-base text-white/95 mt-2 max-w-[280px] leading-relaxed font-medium">
                  Stitched to your exact measurements directly by boutique tailors.
                </p>
                <span className="inline-block mt-4 text-sm font-extrabold text-gold border-b-2 border-gold pb-0.5">
                  See custom fit pieces →
                </span>
              </div>
            </Link>

            {/* Tile 3: Ships in 48 hrs */}
            <Link
              to="/collections?availability=stock"
              className="group relative aspect-[16/10] min-h-[290px] sm:min-h-[320px] overflow-hidden bg-white rounded-sm border border-[#fcb8fd] shadow-[0_0_15px_rgba(252,184,253,0.3)] hover:shadow-[0_0_25px_rgba(252,184,253,0.55)] transition-all hover:border-[#fe84ff]"
            >
              <img
                src="/mockup-assets/bags-14.jpg"
                alt="Ships in 48 hrs"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,0.8,0.28,1)] group-hover:scale-106"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#4A091E]/95 via-[#4A091E]/60 to-transparent" />
              <div className="absolute left-7 top-1/2 -translate-y-1/2 text-white">
                <span className="text-xs font-black uppercase tracking-widest text-[#FFA41C] block mb-1">
                  FAST DELIVERY
                </span>
                <b className="block text-3xl sm:text-4xl lg:text-5xl font-serif italic font-normal tracking-tight text-white drop-shadow-xs">
                  Ships in 48 hrs
                </b>
                <p className="text-sm sm:text-base text-white/95 mt-2 max-w-[280px] leading-relaxed font-medium">
                  Ready in shop right now. Packed and dispatched quickly to your door.
                </p>
                <span className="inline-block mt-4 text-sm font-extrabold text-[#FFA41C] border-b-2 border-[#FFA41C] pb-0.5">
                  See ready-to-ship pieces →
                </span>
              </div>
            </Link>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 3: SHOP BY CATEGORY                                  */}
        {/* ============================================================ */}
        <section className="max-w-[1360px] mx-auto px-4 sm:px-8">
          <div className="flex items-end justify-between mb-6 border-b border-[#fcb8fd] pb-3">
            <div>
              <span className="text-xs sm:text-sm font-black uppercase tracking-[0.2em] text-[#B38F24]">
                POPULAR CATEGORIES
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#5A0A26] tracking-tight mt-1">
                Shop By Category
              </h2>
              <p className="text-sm sm:text-base text-[#5A0A26]/80 mt-1">
                Explore handloom lehengas, silk sarees, designer dresses, bags, and shoes.
              </p>
            </div>
            <Link
              to="/collections"
              className="text-sm font-extrabold text-[#5A0A26] hover:text-[#B38F24] transition border-b-2 border-[#B38F24] pb-0.5 shrink-0"
            >
              Browse All 311 Pieces →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {CATEGORY_BLOCKS.map((c, i) => (
              <Link
                key={i}
                to={c.path}
                className="group relative aspect-[4/3] min-h-[210px] overflow-hidden bg-white rounded-sm border border-[#fcb8fd] shadow-[0_0_12px_rgba(252,184,253,0.25)] hover:shadow-[0_0_20px_rgba(252,184,253,0.45)] transition-all hover:border-[#fe84ff]"
              >
                <img
                  src={c.image}
                  alt={c.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,0.8,0.28,1)] group-hover:scale-106"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#4A091E]/95 via-[#4A091E]/30 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                  <span className="text-xs font-mono text-gold block uppercase tracking-widest mb-0.5 font-extrabold">
                    0{i + 1}
                  </span>
                  <b className="block text-lg sm:text-2xl font-serif italic font-normal leading-tight text-white drop-shadow-xs">
                    {c.title}
                  </b>
                  <span className="text-xs sm:text-sm opacity-95 mt-1 block font-sans">{c.count} verified pieces</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Quick Taxonomy Links Bar */}
          <div className="mt-4 pt-3 border-t border-[#fcb8fd] flex flex-wrap items-center justify-between gap-3 text-sm text-[#5A0A26]">
            <span className="font-extrabold text-xs sm:text-sm uppercase tracking-wider text-[#5A0A26]/80">
              More Styles:
            </span>
            <div className="flex flex-wrap items-center gap-4 font-bold">
              <Link to="/collections?category=Jumpsuits" className="hover:text-[#B38F24] transition">Jumpsuits (4)</Link>
              <span>|</span>
              <Link to="/collections?category=Bottoms" className="hover:text-[#B38F24] transition">Bottoms (6)</Link>
              <span>|</span>
              <Link to="/collections?category=Western%20Co-ords" className="hover:text-[#B38F24] transition">Western Co-ords (7)</Link>
            </div>
            <Link to="/collections" className="font-extrabold text-[#B38F24] hover:underline ml-auto">
              View All 11 Categories →
            </Link>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 4: ARCHIVE SALE SPOTLIGHT (% DEALS WITH GLOW BORDER) */}
        {/* ============================================================ */}
        {salePieces.length > 0 && (
          <section className="max-w-[1360px] mx-auto px-4 sm:px-8">
            <div className="bg-white/95 border border-[#fcb8fd] shadow-[0_0_20px_rgba(252,184,253,0.3)] rounded-sm p-6 sm:p-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-[#fcb8fd] pb-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xs bg-[#FFA41C] text-[#0F1111] font-black text-xs sm:text-sm uppercase tracking-wider mb-2 shadow-2xs">
                    <span className="text-sm font-black">%</span> Special Sale Deals
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-serif text-[#5A0A26] tracking-tight">
                    Limited-Stock Pieces On Sale
                  </h2>
                  <p className="text-sm sm:text-base text-[#5A0A26]/80 mt-1">
                    Up to 35% off on genuine boutique samples and ready-to-ship outfits.
                  </p>
                </div>

                <Link
                  to="/collections?price=under12"
                  className="rounded-sm bg-[#0F1111] hover:bg-[#232F3E] text-white px-7 py-3 text-xs sm:text-sm font-extrabold uppercase tracking-wider transition shrink-0 self-start sm:self-auto border border-gold shadow-xs"
                >
                  View All Sale Items →
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                {salePieces.map((d) => (
                  <DesignCard key={d.slug} design={d} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ============================================================ */}
        {/* SECTION 5: MEET OUR SHOPS & DESIGNERS                        */}
        {/* ============================================================ */}
        <section className="max-w-[1360px] mx-auto px-4 sm:px-8">
          <div className="flex items-end justify-between mb-6 border-b border-[#fcb8fd] pb-3">
            <div>
              <span className="text-xs sm:text-sm font-black uppercase tracking-[0.2em] text-[#B38F24]">
                GENUINE SHOPS & CREATORS
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#5A0A26] tracking-tight mt-1">
                Meet Our Boutiques & Designers
              </h2>
              <p className="text-sm sm:text-base text-[#5A0A26]/80 mt-1">
                Buy directly from real shops in Jaipur, Chennai, Hyderabad, Goa and more.
              </p>
            </div>
            <Link
              to="/designers"
              className="text-sm font-extrabold text-[#B38F24] hover:underline transition border-b-2 border-[#B38F24] pb-0.5 shrink-0"
            >
              Meet all 40 shops →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURED_ATELIERS.slice(0, 4).map((a, i) => (
              <Link
                key={i}
                to={`/collections?atelier=${encodeURIComponent(a.name)}`}
                className="group block cursor-pointer bg-white/95 p-4 rounded-sm border border-[#fcb8fd] shadow-[0_0_15px_rgba(252,184,253,0.25)] hover:shadow-[0_0_22px_rgba(252,184,253,0.45)] transition-all hover:border-[#fe84ff]"
              >
                <div className="aspect-[4/3] overflow-hidden rounded-sm bg-stone border border-[#fcb8fd]/70">
                  <img
                    src={a.image}
                    alt={a.name}
                    className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,0.8,0.28,1)] group-hover:scale-105"
                  />
                </div>
                <div className="mt-3.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xl font-serif italic text-[#5A0A26] group-hover:text-gold transition leading-snug font-normal">
                      {a.name}
                    </p>
                    <span className="text-xs font-mono font-extrabold text-gold uppercase px-1.5 py-0.5 rounded-xs bg-[#5A0A26] text-white">
                      VERIFIED
                    </span>
                  </div>
                  <p className="text-sm text-[#5A0A26]/85 mt-1 font-semibold">
                    {a.city} | {a.pieces} pieces
                  </p>
                  <p className="text-xs sm:text-sm text-[#5A0A26]/75 mt-0.5 font-mono truncate">
                    Specialty: {a.craft}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {/* Regional Hubs Row */}
          <div className="mt-4 pt-3 border-t border-[#fcb8fd] flex items-center justify-between text-sm text-[#5A0A26]">
            <span className="font-extrabold text-xs sm:text-sm uppercase tracking-wider text-[#5A0A26]/80">
              Shop by City:
            </span>
            <div className="flex flex-wrap items-center gap-4 font-bold">
              <Link to="/collections?atelier=Thaila%20Co." className="hover:text-[#B38F24] transition">Jaipur</Link>
              <span>|</span>
              <Link to="/collections?atelier=Atelier%20Vindhya" className="hover:text-[#B38F24] transition">Hyderabad</Link>
              <span>|</span>
              <Link to="/collections?atelier=Kamala%20House" className="hover:text-[#B38F24] transition">Chennai</Link>
              <span>|</span>
              <Link to="/collections?atelier=Noor%20Bagh" className="hover:text-[#B38F24] transition">Lucknow</Link>
              <span>|</span>
              <Link to="/collections?atelier=Ruh%20Studio" className="hover:text-[#B38F24] transition">Goa</Link>
            </div>
            <Link to="/designers" className="font-extrabold text-[#B38F24] hover:underline">
              View All 40 Shops →
            </Link>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 6: FRESH STUDIO RELEASES (NEW IN THIS WEEK)          */}
        {/* ============================================================ */}
        <section className="max-w-[1360px] mx-auto px-4 sm:px-8">
          <div className="flex items-end justify-between mb-6 border-b border-[#fcb8fd] pb-3">
            <div>
              <span className="text-xs sm:text-sm font-black uppercase tracking-[0.2em] text-[#B38F24]">
                JUST ARRIVED
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#5A0A26] tracking-tight mt-1">
                New In This Week
              </h2>
              <p className="text-sm sm:text-base text-[#5A0A26]/80 mt-1">
                Freshly listed clothes and accessories directly from boutique workshops.
              </p>
            </div>
            <Link
              to="/collections?sort=new"
              className="text-sm font-extrabold text-[#B38F24] hover:underline transition border-b-2 border-[#B38F24] pb-0.5 shrink-0"
            >
              Shop All New In →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {newInPieces.map((d) => (
              <DesignCard key={d.slug} design={d} />
            ))}
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 7: WHY CHOOSE OGURA & SELLER ONBOARDING              */}
        {/* ============================================================ */}
        <section className="max-w-[1360px] mx-auto px-4 sm:px-8 space-y-6 sm:space-y-8">
          {/* Why Ogura Box */}
          <div className="bg-white/95 border border-[#fcb8fd] shadow-[0_0_20px_rgba(252,184,253,0.3)] rounded-sm p-6 sm:p-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#fcb8fd] pb-3 gap-2">
              <div>
                <span className="text-xs sm:text-sm font-black uppercase tracking-[0.2em] text-[#B38F24]">
                  SAFE & RELIABLE SHOPPING
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl text-[#5A0A26] mt-1 tracking-tight">
                  Why Shop With Ogura
                </h2>
              </div>
              <p className="text-sm font-semibold text-[#5A0A26]/80 text-left sm:text-right">
                Real boutiques across India | 100% money-back buyer protection
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-8 mt-6 pt-2">
              <div>
                <span className="font-serif italic text-3xl sm:text-4xl text-gold block leading-none">I.</span>
                <h3 className="text-base font-bold text-[#5A0A26] mt-2">Real Independent Shops</h3>
                <p className="text-xs sm:text-sm text-[#5A0A26]/80 mt-1 leading-relaxed">
                  Every product comes directly from genuine boutique shops. No middle warehouses or fake copies.
                </p>
              </div>
              <div>
                <span className="font-serif italic text-3xl sm:text-4xl text-gold block leading-none">II.</span>
                <h3 className="text-base font-bold text-[#5A0A26] mt-2">Checked for Quality</h3>
                <p className="text-xs sm:text-sm text-[#5A0A26]/80 mt-1 leading-relaxed">
                  Every garment is made with high quality fabrics, neat stitching, and beautiful original detailing.
                </p>
              </div>
              <div>
                <span className="font-serif italic text-3xl sm:text-4xl text-gold block leading-none">III.</span>
                <h3 className="text-base font-bold text-[#5A0A26] mt-2">100% Safe Payments</h3>
                <p className="text-xs sm:text-sm text-[#5A0A26]/80 mt-1 leading-relaxed">
                  Your money is 100% safe. The seller only receives payment after your package arrives safely.
                </p>
              </div>
              <div>
                <span className="font-serif italic text-3xl sm:text-4xl text-gold block leading-none">IV.</span>
                <h3 className="text-base font-bold text-[#5A0A26] mt-2">Direct Fast Delivery</h3>
                <p className="text-xs sm:text-sm text-[#5A0A26]/80 mt-1 leading-relaxed">
                  Packed and shipped straight from the maker to your house with live courier tracking.
                </p>
              </div>
              <div>
                <span className="font-serif italic text-3xl sm:text-4xl text-gold block leading-none">V.</span>
                <h3 className="text-base font-bold text-[#5A0A26] mt-2">Free Size Help & Fixes</h3>
                <p className="text-xs sm:text-sm text-[#5A0A26]/80 mt-1 leading-relaxed">
                  Chat with the designer to customize your measurements, plus 7-day free size adjustments if needed.
                </p>
              </div>
            </div>
          </div>

          {/* Seller Onboarding Banner */}
          <div className="bg-white/95 border border-[#fcb8fd] shadow-[0_0_18px_rgba(252,184,253,0.25)] rounded-sm p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-5">
            <div>
              <span className="text-xs font-black uppercase tracking-[0.2em] text-[#B38F24] block">
                DO YOU OWN A BOUTIQUE OR CLOTHING BRAND?
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl text-[#5A0A26] leading-snug mt-1">
                Sell to shoppers all across India directly from your shop.
              </h3>
              <p className="text-sm sm:text-base text-[#5A0A26]/80 mt-1.5 max-w-xl">
                No listing charges. Keep your clothes in your own store. Fast and reliable payouts directly to your bank account.
              </p>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <a
                href="/seller-login"
                className="rounded-sm bg-[#0F1111] hover:bg-[#232F3E] px-8 py-3.5 text-sm font-extrabold text-white tracking-wider uppercase transition shadow-sm border border-gold"
              >
                Start Selling
              </a>
              <Link
                to="/how-it-works"
                className="rounded-sm bg-white border border-[#fcb8fd] px-6 py-3.5 text-sm font-extrabold text-[#5A0A26] hover:border-[#fe84ff] transition"
              >
                Learn more
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
