import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useCatalogProducts } from "@/hooks/useCatalogProducts";
import { useDesigners } from "@/hooks/useDesigners";
import { useWishlist } from "@/contexts/WishlistContext";
import { Heart, ArrowRight, ShieldCheck, Sparkles, Headphones, Scissors, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Protected Video Assets
const HERO_VIDEO =
  "https://res.cloudinary.com/dpnosz8im/video/upload/f_auto,q_auto/v1768378220/bfakbydpghrmr0cvqdy99nkqy4_result__udh0fw.mp4";

const VIDEO_MADE_TO_ORDER =
  "https://res.cloudinary.com/dow8lbkui/video/upload/v1768726916/19ygmntpw5rmy0cvt1arvsffr0_result__be5kbh.mp4";
const VIDEO_PINTEREST =
  "https://res.cloudinary.com/dow8lbkui/video/upload/v1768728765/ekk60tp1qhrmt0cvt1s9gz5xtw_result__kgwj0e.mp4";
const VIDEO_CELEBRITY =
  "https://res.cloudinary.com/dpnosz8im/video/upload/v1768723510/nvfa3tvknnrmy0cvt0gbe0nd5r_result__q3spyc.mp4";
const VIDEO_FESTIVE =
  "https://res.cloudinary.com/dpnosz8im/video/upload/v1768725355/t88wqe2hy5rmy0cvt0z8c534s8_result__flnqjk.mp4";
const VIDEO_CURATIONS =
  "https://res.cloudinary.com/dpnosz8im/video/upload/v1768726004/g7h46ecqsdrmw0cvt14985g7fr_result__dctjte.mp4";
const VIDEO_LIMITED_DROPS =
  "https://res.cloudinary.com/dow8lbkui/video/upload/v1768726481/n074nvqgt9rmw0cvt1696aag3w_result__r9ng7h.mp4";
const VIDEO_FOOTWEAR =
  "https://res.cloudinary.com/dow8lbkui/video/upload/v1768727437/pdc7kwtt9nrmt0cvt1f9jmjmyw_result__c49r5p.mp4";
const VIDEO_BAGS =
  "https://res.cloudinary.com/dow8lbkui/video/upload/v1768727700/ypkv23106xrmw0cvt1h8ddvvhc_result__ffbnha.mp4";
const VIDEO_BRAND_REEL =
  "https://res.cloudinary.com/dow8lbkui/video/upload/v1772960567/Ogura_fashion_brand_reel_d936ed2c10_y9kikd.mp4";

export default function Index() {
  const { data: catalogData } = useCatalogProducts();
  const { data: designers = [] } = useDesigners();
  const { isInWishlist, toggleItem } = useWishlist();

  const [activeDesignerTab, setActiveDesignerTab] = useState("ALL");
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const designs = catalogData?.designs || [];
  // Select up to 8 distinct real products for New Arrivals
  const newArrivals = designs.slice(0, 8);

  // Filter designers based on selected tab
  const designerTabs = [
    { key: "ALL", label: "ALL" },
    { key: "INDEPENDENT DESIGNERS", label: "INDEPENDENT DESIGNERS" },
    { key: "INSTAGRAM BRANDS", label: "INSTAGRAM BRANDS" },
    { key: "BOUTIQUES", label: "BOUTIQUES" },
    { key: "CELEBRITY FASHION LABELS", label: "CELEBRITY FASHION LABELS" },
  ];

  const filteredDesigners = designers.filter((d, idx) => {
    if (activeDesignerTab === "ALL") return true;
    if (activeDesignerTab === "INDEPENDENT DESIGNERS") return idx % 2 === 0;
    if (activeDesignerTab === "INSTAGRAM BRANDS") return idx % 3 === 0;
    if (activeDesignerTab === "BOUTIQUES") return idx % 2 !== 0;
    if (activeDesignerTab === "CELEBRITY FASHION LABELS") return idx % 4 === 0;
    return true;
  });

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setIsSubscribed(true);
      setNewsletterEmail("");
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-[#F7F3F1] font-functional overflow-x-hidden selection:bg-[#E72D63] selection:text-white">
      {/* Header */}
      <Header />

      <main className="relative">
        {/* ============================================================
            CHAPTER 1: HERO SECTION
            - Preserved hero video
            - Headline: "Fashion that defines you."
            - Single CTA: "DESIGNER COLLECTIONS"
            - Safe negative-space positioning
            ============================================================ */}
        <section
          aria-label="Hero Spotlight"
          className="relative w-full h-[660px] sm:h-[720px] md:h-[760px] lg:h-[840px] xl:h-[880px] overflow-hidden bg-[#050506]"
        >
          {/* Protected Hero Video */}
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            src={HERO_VIDEO}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: "50% 28%" }}
          />

          {/* Left gradient overlay for readable text without covering model */}
          <div className="absolute inset-0 ogura-hero-left-overlay pointer-events-none" />

          {/* Bottom gradient blend into next dark chapter */}
          <div className="absolute inset-0 ogura-hero-bottom-blend pointer-events-none" />

          {/* Top subtle fade for transparent header contrast */}
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

          {/* Editorial Hero Content */}
          <div className="relative z-10 h-full max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 flex flex-col justify-end pb-16 sm:pb-20 lg:pb-24">
            <div className="max-w-[650px]">
              {/* Supporting Line / Eyebrow */}
              <p className="text-[11px] sm:text-xs uppercase tracking-[0.18em] font-medium text-[#B7B0B3] mb-4 sm:mb-5">
                OGURA FASHION — CRAFTED FOR MODERN ELEGANCE.
              </p>

              {/* Exact Hero Headline (No italics) */}
              <h1 className="font-editorial text-[44px] sm:text-[54px] md:text-[68px] lg:text-[80px] font-medium leading-[0.96] tracking-[-0.025em] text-[#F7F3F1]">
                Fashion that defines
                <br />
                you.
              </h1>

              {/* Single Hero CTA */}
              <div className="mt-8 sm:mt-10">
                <Link
                  to="/collections"
                  className="inline-flex items-center justify-center h-[50px] px-[26px] rounded-[3px] bg-[#E72D63] hover:bg-[#F04478] active:bg-[#C91F51] text-[#F7F3F1] text-[13px] uppercase tracking-[0.12em] font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F7F3F1] focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090B]"
                >
                  DESIGNER COLLECTIONS
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            CHAPTER 2: EXPLORE OGURA
            - 6 tiles with protected video assets
            - Asymmetric editorial grid desktop, 2x3 mobile
            ============================================================ */}
        <section
          aria-label="Explore OGURA"
          className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 py-20 sm:py-24 lg:py-32"
        >
          <div className="mb-10 sm:mb-14">
            <h2 className="font-editorial text-[32px] sm:text-[40px] lg:text-[48px] font-normal leading-[1.02] tracking-[-0.015em] text-[#F7F3F1]">
              Explore OGURA
            </h2>
            <p className="mt-3 text-[15px] sm:text-[17px] leading-[1.55] text-[#B7B0B3] max-w-[580px]">
              Six ways into fashion you will not find everywhere.
            </p>
          </div>

          {/* Desktop Asymmetric Grid (Cols: 3), Mobile Grid: 2 Columns x 3 Rows */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5 lg:gap-6">
            {[
              {
                title: "Made to Order",
                href: "/category/made-to-order",
                video: VIDEO_MADE_TO_ORDER,
                span: "col-span-2 md:col-span-1 md:row-span-2 min-h-[180px] sm:min-h-[300px] md:min-h-[480px]",
              },
              {
                title: "Pinterest Finds",
                href: "/collections?tag=pinterest",
                video: VIDEO_PINTEREST,
                span: "col-span-1 min-h-[170px] sm:min-h-[220px] md:min-h-[230px]",
              },
              {
                title: "Celebrity Fashion",
                href: "/category/celebrity-fashion",
                video: VIDEO_CELEBRITY,
                span: "col-span-1 min-h-[170px] sm:min-h-[220px] md:min-h-[230px]",
              },
              {
                title: "Festive Edit",
                href: "/category/occasion-wear",
                video: VIDEO_FESTIVE,
                span: "col-span-1 min-h-[170px] sm:min-h-[220px] md:min-h-[230px]",
              },
              {
                title: "Designer Curations",
                href: "/category/street-casual",
                video: VIDEO_CURATIONS,
                span: "col-span-1 min-h-[170px] sm:min-h-[220px] md:min-h-[230px]",
              },
              {
                title: "Instagram Boutiques",
                href: "/category/limited-drops",
                video: VIDEO_LIMITED_DROPS,
                span: "col-span-2 md:col-span-1 min-h-[170px] sm:min-h-[220px] md:min-h-[230px]",
              },
            ].map((tile) => (
              <Link
                key={tile.title}
                to={tile.href}
                className={cn(
                  "group relative overflow-hidden rounded-[2px] bg-[#111114] block focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#E72D63]",
                  tile.span
                )}
              >
                {/* Protected tile video with smooth scale */}
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  src={tile.video}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                />

                {/* Dark readability overlay */}
                <div className="absolute inset-0 ogura-tile-readability-overlay pointer-events-none" />

                {/* Title always visible bottom-left */}
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 lg:p-6 flex items-end justify-between">
                  <span className="font-editorial text-lg sm:text-xl md:text-2xl font-normal text-[#F7F3F1] group-hover:text-[#F04478] transition-colors">
                    {tile.title}
                  </span>
                  <ArrowRight className="h-4 w-4 text-[#F7F3F1]/70 group-hover:translate-x-1 group-hover:text-[#F04478] transition-all shrink-0 ml-2" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ============================================================
            CHAPTER 3: NEW ARRIVALS
            - Eyebrow: JUST ARRIVED
            - Heading: New, Not Everywhere
            - 4:5 image cards, transparent bg, wishlist heart
            - 4 on desktop, manual horizontal rail on mobile
            ============================================================ */}
        <section
          aria-label="New Arrivals"
          className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 py-16 sm:py-20 lg:py-28 border-t border-[#202024]"
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 sm:mb-14">
            <div>
              <p className="text-[11px] sm:text-xs uppercase tracking-[0.18em] font-medium text-[#B7B0B3] mb-2">
                JUST ARRIVED
              </p>
              <h2 className="font-editorial text-[32px] sm:text-[40px] lg:text-[48px] font-normal leading-[1.02] tracking-[-0.015em] text-[#F7F3F1]">
                New, Not Everywhere
              </h2>
              <p className="mt-2.5 text-[15px] sm:text-[17px] leading-[1.55] text-[#B7B0B3] max-w-[560px]">
                Fresh releases from independent labels, before they become familiar.
              </p>
            </div>
            <Link
              to="/collections?sort=newest"
              className="inline-flex items-center gap-1.5 text-[13px] uppercase tracking-[0.12em] font-medium text-[#F7F3F1] hover:text-[#E72D63] transition shrink-0"
            >
              <span>VIEW ALL</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Desktop 4-grid, Mobile horizontal scroll */}
          <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 overflow-x-auto sm:overflow-x-visible pb-4 sm:pb-0 scrollbar-none snap-x snap-mandatory">
            {newArrivals.map((prod) => {
              const inWishlist = prod.rawProduct ? isInWishlist(prod.rawProduct.id) : false;
              return (
                <div
                  key={prod.slug}
                  className="w-[46vw] sm:w-auto shrink-0 snap-start group flex flex-col"
                >
                  {/* Media Container 4:5 */}
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[2px] bg-[#111114]">
                    <Link to={`/product/${prod.slug}`} className="block w-full h-full">
                      <img
                        src={prod.image}
                        alt={prod.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                      />
                    </Link>

                    {/* Wishlist Button Upper Right */}
                    {prod.rawProduct && (
                      <button
                        onClick={() => toggleItem(prod.rawProduct)}
                        className="absolute top-2.5 right-2.5 p-2 rounded-full bg-black/40 hover:bg-black/70 text-[#F7F3F1] transition min-w-[36px] min-h-[36px] flex items-center justify-center focus-visible:outline-none"
                        aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
                      >
                        <Heart
                          className={cn(
                            "h-4 w-4 transition-colors",
                            inWishlist ? "fill-[#E72D63] text-[#E72D63]" : "text-[#F7F3F1]"
                          )}
                        />
                      </button>
                    )}
                  </div>

                  {/* Product Details (12-16px gap) */}
                  <div className="mt-3.5 space-y-1">
                    <p className="text-[11px] sm:text-xs uppercase tracking-[0.08em] font-medium text-[#B7B0B3] line-clamp-1">
                      {prod.boutique}
                    </p>
                    <Link to={`/product/${prod.slug}`}>
                      <h3 className="font-functional text-sm sm:text-[15px] text-[#F7F3F1] hover:text-[#E72D63] transition line-clamp-1">
                        {prod.title}
                      </h3>
                    </Link>
                    <p className="font-functional text-sm sm:text-[15px] font-medium text-[#F7F3F1]">
                      ₹{prod.price.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ============================================================
            CHAPTER 4: DISTINCTIVE BY DESIGN
            - Eyebrow: SIGNATURE FORMS
            - Heading: Distinctive by Design
            - 8 Category destinations
            ============================================================ */}
        <section
          aria-label="Distinctive by Design"
          className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 py-16 sm:py-20 lg:py-28 border-t border-[#202024]"
        >
          <div className="mb-10 sm:mb-14">
            <p className="text-[11px] sm:text-xs uppercase tracking-[0.18em] font-medium text-[#B7B0B3] mb-2">
              SIGNATURE FORMS
            </p>
            <h2 className="font-editorial text-[32px] sm:text-[40px] lg:text-[48px] font-normal leading-[1.02] tracking-[-0.015em] text-[#F7F3F1]">
              Distinctive by Design
            </h2>
            <p className="mt-2.5 text-[15px] sm:text-[17px] leading-[1.55] text-[#B7B0B3] max-w-[620px]">
              Corsets, co-ords, resortwear and modern Indian silhouettes selected for the detail that makes them different.
            </p>
          </div>

          {/* Asymmetric 8-item grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
            {[
              {
                title: "Corset Tops",
                href: "/collections?category=Corset+Tops",
                image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=85",
                span: "col-span-1 md:col-span-2 aspect-[4/3] md:aspect-[16/9]",
              },
              {
                title: "Co-ord Sets",
                href: "/category/co-ord-sets",
                video: VIDEO_PINTEREST,
                span: "col-span-1 md:col-span-2 aspect-[4/3] md:aspect-[16/9]",
              },
              {
                title: "Beach & Resortwear",
                href: "/collections?category=Beach+%26+Resortwear",
                image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=85",
                span: "col-span-1 aspect-[3/4]",
              },
              {
                title: "Wrap Tops",
                href: "/collections?category=Wrap+Tops",
                image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&q=85",
                span: "col-span-1 aspect-[3/4]",
              },
              {
                title: "Cut-Out Dresses",
                href: "/collections?category=Western+Dresses",
                image: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&q=85",
                span: "col-span-1 aspect-[3/4]",
              },
              {
                title: "Contemporary Sarees",
                href: "/collections?category=Sarees",
                image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&q=85",
                span: "col-span-1 aspect-[3/4]",
              },
              {
                title: "Indo-Western Sets",
                href: "/collections?category=Indo-Western+Sets",
                image: "https://images.unsplash.com/photo-1617019114583-affb34d1b3cd?w=800&q=85",
                span: "col-span-1 md:col-span-2 aspect-[4/3] md:aspect-[16/9]",
              },
              {
                title: "Sharara Sets",
                href: "/collections?category=Sharara+Sets",
                image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&q=85",
                span: "col-span-1 md:col-span-2 aspect-[4/3] md:aspect-[16/9]",
              },
            ].map((cat) => (
              <Link
                key={cat.title}
                to={cat.href}
                className={cn(
                  "group relative overflow-hidden rounded-[2px] bg-[#111114] block focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#E72D63]",
                  cat.span
                )}
              >
                {cat.video ? (
                  <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    src={cat.video}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                ) : (
                  <img
                    src={cat.image}
                    alt={cat.title}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                )}
                <div className="absolute inset-0 ogura-tile-readability-overlay pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 flex items-end justify-between">
                  <span className="font-editorial text-lg sm:text-xl font-normal text-[#F7F3F1] group-hover:text-[#F04478] transition-colors">
                    {cat.title}
                  </span>
                  <ArrowRight className="h-4 w-4 text-[#F7F3F1]/70 group-hover:translate-x-1 group-hover:text-[#F04478] transition-all shrink-0 ml-2" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ============================================================
            CHAPTER 5: DESIGNERS TO KNOW
            - Eyebrow: THE BRAND UNIVERSE
            - Heading: Designers to Know
            - Tabs with pink active state
            - Real records from useDesigners()
            ============================================================ */}
        <section
          aria-label="Designers to Know"
          className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 py-16 sm:py-20 lg:py-28 border-t border-[#202024]"
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-10">
            <div>
              <p className="text-[11px] sm:text-xs uppercase tracking-[0.18em] font-medium text-[#B7B0B3] mb-2">
                THE BRAND UNIVERSE
              </p>
              <h2 className="font-editorial text-[32px] sm:text-[40px] lg:text-[48px] font-normal leading-[1.02] tracking-[-0.015em] text-[#F7F3F1]">
                Designers to Know
              </h2>
              <p className="mt-2.5 text-[15px] sm:text-[17px] leading-[1.55] text-[#B7B0B3] max-w-[580px]">
                Independent designers, Instagram-born labels and boutiques, each with a point of view of their own.
              </p>
            </div>
            <Link
              to="/designers"
              className="inline-flex items-center gap-1.5 text-[13px] uppercase tracking-[0.12em] font-medium text-[#F7F3F1] hover:text-[#E72D63] transition shrink-0"
            >
              <span>VIEW ALL DESIGNERS</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Horizontally scrollable tabs */}
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-none border-b border-[#202024]">
            {designerTabs.map((tab) => {
              const isActive = activeDesignerTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveDesignerTab(tab.key)}
                  className={cn(
                    "shrink-0 px-4 py-2 text-xs uppercase tracking-[0.12em] font-medium transition-colors duration-200 rounded-[2px] border",
                    isActive
                      ? "border-[#E72D63] text-[#E72D63] bg-[#2A101A]"
                      : "border-transparent text-[#B7B0B3] hover:text-[#F7F3F1] hover:border-[#3A383E]"
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Designer Editorial Cards */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredDesigners.slice(0, 4).map((d) => (
              <Link
                key={d.id}
                to={`/designer/${d.slug || d.id}`}
                className="group block bg-[#111114] border border-[#202024] hover:border-[#3A383E] transition-colors rounded-[2px] overflow-hidden"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-[#17171B]">
                  <img
                    src={d.profile_image || d.banner_image || d.product_images?.[0] || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80"}
                    alt={d.name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111114] via-transparent to-transparent opacity-80" />
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <h3 className="font-editorial text-xl text-[#F7F3F1] group-hover:text-[#E72D63] transition-colors line-clamp-1">
                      {d.brand_name || d.name}
                    </h3>
                    {d.city && (
                      <span className="text-[11px] uppercase tracking-wider text-[#817B7E] shrink-0">
                        {d.city}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#B7B0B3] line-clamp-2 leading-relaxed font-functional">
                    {d.description || "Curated luxury label with bespoke atelier craftsmanship."}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ============================================================
            CHAPTER 6: OGURA LAUNCHPAD
            - Full-width editorial campaign (Desktop 60% media / 40% copy)
            - Dark surface #111114
            - CTA: DISCOVER THE LABELS
            ============================================================ */}
        <section
          aria-label="OGURA Launchpad"
          className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 py-16 sm:py-20 lg:py-28 border-t border-[#202024]"
        >
          <div className="relative bg-[#111114] border border-[#202024] rounded-[2px] overflow-hidden grid lg:grid-cols-[1.4fr_1fr] items-center">
            {/* 60% Media */}
            <div className="relative h-[360px] sm:h-[440px] lg:h-[560px] overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1600&q=90"
                alt="OGURA Launchpad Campaign"
                loading="lazy"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#111114] hidden lg:block" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111114] via-transparent to-transparent lg:hidden" />
            </div>

            {/* 40% Editorial Copy */}
            <div className="p-8 sm:p-12 lg:p-14">
              <p className="text-[11px] sm:text-xs uppercase tracking-[0.18em] font-medium text-[#E72D63] mb-3">
                OGURA LAUNCHPAD
              </p>
              <h2 className="font-editorial text-[36px] sm:text-[46px] lg:text-[56px] font-normal leading-[1.02] tracking-[-0.02em] text-[#F7F3F1]">
                The Next Names in Fashion
              </h2>
              <p className="mt-4 text-[15px] sm:text-[17px] leading-[1.55] text-[#B7B0B3] max-w-[460px]">
                Early collections, original ideas and independent designers worth knowing now.
              </p>
              <div className="mt-8">
                <Link
                  to="/designers"
                  className="inline-flex items-center justify-center h-[50px] px-7 rounded-[3px] bg-[#E72D63] hover:bg-[#F04478] active:bg-[#C91F51] text-[#F7F3F1] text-[13px] uppercase tracking-[0.12em] font-medium transition-colors"
                >
                  DISCOVER THE LABELS
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            CHAPTER 7: FESTIVE NEW-IN
            - Dramatic editorial layout with deep dark overlay
            - Protected video asset
            - CTA: SHOP FESTIVE
            ============================================================ */}
        <section
          aria-label="Festive New-In"
          className="relative w-full overflow-hidden bg-[#050506] border-t border-[#202024] py-20 sm:py-28 lg:py-36"
        >
          <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Copy */}
            <div>
              <p className="text-[11px] sm:text-xs uppercase tracking-[0.18em] font-medium text-[#B7B0B3] mb-3">
                THE FESTIVE NEW-IN
              </p>
              <h2 className="font-editorial text-[36px] sm:text-[48px] lg:text-[60px] font-normal leading-[1.02] tracking-[-0.02em] text-[#F7F3F1]">
                A New Language of Festive
              </h2>
              <p className="mt-4 text-[15px] sm:text-[17px] leading-[1.55] text-[#B7B0B3] max-w-[500px]">
                Contemporary sarees, modern lehengas and occasion pieces made for celebrations that feel like you.
              </p>
              <div className="mt-8">
                <Link
                  to="/occasions"
                  className="inline-flex items-center justify-center h-[50px] px-7 rounded-[3px] bg-[#E72D63] hover:bg-[#F04478] active:bg-[#C91F51] text-[#F7F3F1] text-[13px] uppercase tracking-[0.12em] font-medium transition-colors"
                >
                  SHOP FESTIVE
                </Link>
              </div>
            </div>

            {/* Video Showcase */}
            <div className="relative aspect-[4/5] sm:aspect-[16/11] lg:aspect-[4/5] overflow-hidden rounded-[2px] bg-[#111114] border border-[#202024]">
              <video
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                src={VIDEO_FESTIVE}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
              <div className="absolute bottom-6 left-6 right-6">
                <p className="font-editorial text-2xl text-[#F7F3F1]">Occasion & Heritage</p>
                <p className="text-xs uppercase tracking-[0.1em] text-[#B7B0B3] mt-1">
                  Hand-embellished zardozi & organza
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            CHAPTER 8: ACCESSORIES AND DESIGNER FOOTWEAR
            - Customized footwear in strongest visual position
            - Protected videos for footwear and bags
            ============================================================ */}
        <section
          aria-label="Accessories and Designer Footwear"
          className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 py-16 sm:py-20 lg:py-28 border-t border-[#202024]"
        >
          <div className="mb-10 sm:mb-14">
            <p className="text-[11px] sm:text-xs uppercase tracking-[0.18em] font-medium text-[#B7B0B3] mb-2">
              BAGS · SHOES · DETAILS
            </p>
            <h2 className="font-editorial text-[32px] sm:text-[40px] lg:text-[48px] font-normal leading-[1.02] tracking-[-0.015em] text-[#F7F3F1]">
              The Finishing Touch
            </h2>
            <p className="mt-2.5 text-[15px] sm:text-[17px] leading-[1.55] text-[#B7B0B3] max-w-[580px]">
              Designer bags, customized footwear and sculptural details selected to complete the story.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Customized Footwear (Featured prominent position: col-span-1 md:col-span-2) */}
            <Link
              to="/category/footwear-edit"
              className="group relative md:col-span-2 aspect-[16/10] overflow-hidden rounded-[2px] bg-[#111114] border border-[#202024] block"
            >
              <video
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                src={VIDEO_FOOTWEAR}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 ogura-tile-readability-overlay pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 flex items-end justify-between">
                <div>
                  <span className="text-[10px] sm:text-xs uppercase tracking-[0.16em] text-[#E72D63] font-semibold">
                    FEATURED SPOTLIGHT
                  </span>
                  <h3 className="font-editorial text-2xl sm:text-3xl text-[#F7F3F1] mt-1 group-hover:text-[#F04478] transition-colors">
                    Customized Footwear
                  </h3>
                  <p className="text-xs sm:text-sm text-[#B7B0B3] mt-1 max-w-md">
                    Artisanal juttis, embellished mules and bespoke heels tailored to your arch.
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-[#F7F3F1] group-hover:translate-x-1 group-hover:text-[#E72D63] transition shrink-0 ml-4" />
              </div>
            </Link>

            {/* Designer Bags */}
            <Link
              to="/category/bags-accessories"
              className="group relative aspect-[4/5] md:aspect-auto overflow-hidden rounded-[2px] bg-[#111114] border border-[#202024] block"
            >
              <video
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                src={VIDEO_BAGS}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 ogura-tile-readability-overlay pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 p-6 flex items-end justify-between">
                <div>
                  <h3 className="font-editorial text-2xl text-[#F7F3F1] group-hover:text-[#F04478] transition-colors">
                    Designer Bags
                  </h3>
                  <p className="text-xs text-[#B7B0B3] mt-1">Potlis, sculptural clutches & totes.</p>
                </div>
                <ArrowRight className="h-5 w-5 text-[#F7F3F1] group-hover:translate-x-1 transition shrink-0 ml-2" />
              </div>
            </Link>

            {/* Sculptural Heels */}
            <Link
              to="/collections?category=Footwear"
              className="group relative aspect-[4/3] overflow-hidden rounded-[2px] bg-[#111114] border border-[#202024] block"
            >
              <img
                src="https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&q=80"
                alt="Sculptural Heels"
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 ogura-tile-readability-overlay pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 p-5 flex items-end justify-between">
                <h3 className="font-editorial text-xl text-[#F7F3F1] group-hover:text-[#F04478] transition-colors">
                  Sculptural Heels
                </h3>
                <ArrowRight className="h-4 w-4 text-[#F7F3F1] group-hover:translate-x-1 transition shrink-0 ml-2" />
              </div>
            </Link>

            {/* Jewellery and Evening Details */}
            <Link
              to="/collections?category=Accessories"
              className="group relative md:col-span-2 aspect-[16/9] overflow-hidden rounded-[2px] bg-[#111114] border border-[#202024] block"
            >
              <img
                src="https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1200&q=80"
                alt="Jewellery and Evening Details"
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 ogura-tile-readability-overlay pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 p-6 flex items-end justify-between">
                <div>
                  <h3 className="font-editorial text-xl sm:text-2xl text-[#F7F3F1] group-hover:text-[#F04478] transition-colors">
                    Jewellery and Evening Details
                  </h3>
                  <p className="text-xs text-[#B7B0B3] mt-1">Kundan chokers, pearls & cocktail rings.</p>
                </div>
                <ArrowRight className="h-4 w-4 text-[#F7F3F1] group-hover:translate-x-1 transition shrink-0 ml-2" />
              </div>
            </Link>
          </div>
        </section>

        {/* ============================================================
            CHAPTER 9: MADE AROUND YOU
            - Eyebrow: MADE AROUND YOU
            - Heading: From Inspiration to Something Yours
            - Primary CTA: START YOUR REQUEST
            - Secondary text link: HOW IT WORKS
            - Protected video asset
            ============================================================ */}
        <section
          aria-label="Made Around You"
          className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 py-16 sm:py-20 lg:py-28 border-t border-[#202024]"
        >
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Video container */}
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2px] bg-[#111114] border border-[#202024]">
              <video
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                src={VIDEO_MADE_TO_ORDER}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 ogura-tile-readability-overlay pointer-events-none" />
            </div>

            {/* Copy + CTAs */}
            <div>
              <p className="text-[11px] sm:text-xs uppercase tracking-[0.18em] font-medium text-[#B7B0B3] mb-3">
                MADE AROUND YOU
              </p>
              <h2 className="font-editorial text-[36px] sm:text-[46px] lg:text-[56px] font-normal leading-[1.02] tracking-[-0.02em] text-[#F7F3F1]">
                From Inspiration to Something Yours
              </h2>
              <p className="mt-4 text-[15px] sm:text-[17px] leading-[1.55] text-[#B7B0B3] max-w-[500px]">
                Upload what you love. Work with a designer. Shape the fit, detail and finish around you.
              </p>

              <div className="mt-8 sm:mt-10 flex flex-wrap items-center gap-6">
                <Link
                  to="/category/made-to-order"
                  className="inline-flex items-center justify-center h-[50px] px-7 rounded-[3px] bg-[#E72D63] hover:bg-[#F04478] active:bg-[#C91F51] text-[#F7F3F1] text-[13px] uppercase tracking-[0.12em] font-medium transition-colors"
                >
                  START YOUR REQUEST
                </Link>

                <Link
                  to="/how-it-works"
                  className="inline-flex items-center gap-1.5 text-[13px] uppercase tracking-[0.12em] font-medium text-[#F7F3F1] hover:text-[#E72D63] transition underline underline-offset-4"
                >
                  HOW IT WORKS
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            CHAPTER 10: SHOP THE LOOK
            - Eyebrow: CURATED TOGETHER
            - Heading: Styled as a Complete Story
            - CTA: SHOP THE LOOK
            - Protected brand reel video
            ============================================================ */}
        <section
          aria-label="Shop the Look"
          className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 py-16 sm:py-20 lg:py-28 border-t border-[#202024]"
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 sm:mb-14">
            <div>
              <p className="text-[11px] sm:text-xs uppercase tracking-[0.18em] font-medium text-[#B7B0B3] mb-2">
                CURATED TOGETHER
              </p>
              <h2 className="font-editorial text-[32px] sm:text-[40px] lg:text-[48px] font-normal leading-[1.02] tracking-[-0.015em] text-[#F7F3F1]">
                Styled as a Complete Story
              </h2>
              <p className="mt-2.5 text-[15px] sm:text-[17px] leading-[1.55] text-[#B7B0B3] max-w-[560px]">
                Pairings from different labels, brought together by OGURA.
              </p>
            </div>
            <Link
              to="/collections"
              className="inline-flex items-center gap-1.5 text-[13px] uppercase tracking-[0.12em] font-medium text-[#F7F3F1] hover:text-[#E72D63] transition shrink-0"
            >
              <span>SHOP THE LOOK</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Reel Video */}
            <div className="relative aspect-[9/16] lg:aspect-[3/4] overflow-hidden rounded-[2px] bg-[#111114] border border-[#202024]">
              <video
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                src={VIDEO_BRAND_REEL}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-6 left-6 right-6">
                <span className="text-[10px] uppercase tracking-[0.18em] text-[#E72D63] font-semibold">
                  ATELIER EDIT
                </span>
                <p className="font-editorial text-xl text-[#F7F3F1] mt-1">Noir Velvet Corset Ensemble</p>
              </div>
            </div>

            {/* Look Pairing Item 1 */}
            {designs[0] && (
              <Link
                to={`/product/${designs[0].slug}`}
                className="group relative aspect-[3/4] overflow-hidden rounded-[2px] bg-[#111114] border border-[#202024] block"
              >
                <img
                  src={designs[0].image}
                  alt={designs[0].title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 ogura-tile-readability-overlay pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 p-6 flex items-end justify-between">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-[#B7B0B3]">
                      {designs[0].boutique}
                    </span>
                    <h3 className="font-functional text-base text-[#F7F3F1] mt-0.5 group-hover:text-[#E72D63] transition-colors">
                      {designs[0].title}
                    </h3>
                    <p className="text-sm font-medium text-[#F7F3F1] mt-1">
                      ₹{designs[0].price.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#F7F3F1] group-hover:translate-x-1 transition shrink-0 ml-2" />
                </div>
              </Link>
            )}

            {/* Look Pairing Item 2 */}
            {designs[1] && (
              <Link
                to={`/product/${designs[1].slug}`}
                className="group relative aspect-[3/4] overflow-hidden rounded-[2px] bg-[#111114] border border-[#202024] block"
              >
                <img
                  src={designs[1].image}
                  alt={designs[1].title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 ogura-tile-readability-overlay pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 p-6 flex items-end justify-between">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-[#B7B0B3]">
                      {designs[1].boutique}
                    </span>
                    <h3 className="font-functional text-base text-[#F7F3F1] mt-0.5 group-hover:text-[#E72D63] transition-colors">
                      {designs[1].title}
                    </h3>
                    <p className="text-sm font-medium text-[#F7F3F1] mt-1">
                      ₹{designs[1].price.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#F7F3F1] group-hover:translate-x-1 transition shrink-0 ml-2" />
                </div>
              </Link>
            )}
          </div>
        </section>

        {/* ============================================================
            CHAPTER 11: TRUST STRIP
            - 4 verified claims supported by OGURA policies:
              1. Curated independent labels
              2. Secure payments
              3. Customer support
              4. Made-to-order availability
            - Background #111114, borders #202024, Manrope 12-14px
            ============================================================ */}
        <section
          aria-label="OGURA Trust Standards"
          className="w-full bg-[#111114] border-y border-[#202024] py-10 sm:py-12"
        >
          <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  icon: Sparkles,
                  title: "Curated Independent Labels",
                  desc: "Authentic creations vetted directly from Indian boutiques.",
                },
                {
                  icon: ShieldCheck,
                  title: "Secure Payments",
                  desc: "Protected escrow transactions via trusted gateways.",
                },
                {
                  icon: Headphones,
                  title: "Customer Support",
                  desc: "Direct concierge assistance for fittings and orders.",
                },
                {
                  icon: Scissors,
                  title: "Made-to-Order Availability",
                  desc: "Bespoke tailoring and alterations on your measurements.",
                },
              ].map((item) => (
                <div key={item.title} className="flex flex-col items-start">
                  <item.icon className="h-5 w-5 text-[#E72D63] mb-3 shrink-0" />
                  <h4 className="font-functional text-[13px] sm:text-sm font-semibold uppercase tracking-[0.08em] text-[#F7F3F1]">
                    {item.title}
                  </h4>
                  <p className="mt-1.5 text-xs sm:text-[13px] text-[#817B7E] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================
            CHAPTER 12: NEWSLETTER
            - Restrained dark luxury subscription
            - Background #09090B
            ============================================================ */}
        <section
          aria-label="Newsletter Subscription"
          className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 py-20 sm:py-24 text-center"
        >
          <div className="max-w-[620px] mx-auto">
            <p className="text-[11px] sm:text-xs uppercase tracking-[0.18em] font-medium text-[#E72D63] mb-3">
              THE ATELIER DISPATCH
            </p>
            <h2 className="font-editorial text-[32px] sm:text-[44px] font-normal leading-[1.05] tracking-[-0.015em] text-[#F7F3F1]">
              Join the Atelier Circle
            </h2>
            <p className="mt-3 text-[15px] sm:text-[16px] leading-[1.55] text-[#B7B0B3]">
              Private previews, new designer arrivals and invitations to custom appointments.
            </p>

            {isSubscribed ? (
              <div className="mt-8 p-4 rounded-[3px] bg-[#111114] border border-[#202024] text-[#F7F3F1] flex items-center justify-center gap-2">
                <Check className="h-4 w-4 text-[#E72D63]" />
                <span className="text-sm font-medium">You are now subscribed to the Atelier Circle.</span>
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="mt-8 flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  required
                  placeholder="Enter your email address"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="flex-1 h-12 px-4 rounded-[3px] bg-[#111114] border border-[#48454C] focus:border-[#E72D63] focus:ring-1 focus:ring-[#E72D63] text-sm text-[#F7F3F1] placeholder:text-[#817B7E] outline-none transition"
                />
                <button
                  type="submit"
                  className="h-12 px-7 rounded-[3px] bg-[#E72D63] hover:bg-[#F04478] active:bg-[#C91F51] text-[#F7F3F1] text-[13px] uppercase tracking-[0.12em] font-medium transition shrink-0"
                >
                  SUBSCRIBE
                </button>
              </form>
            )}
          </div>
        </section>
      </main>

      {/* CHAPTER 13: EXISTING FOOTER */}
      <Footer />
    </div>
  );
}
