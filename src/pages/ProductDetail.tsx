import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DesignCard, formatINR } from "@/components/Cards";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useToast } from "@/hooks/use-toast";
import { useCatalogProducts } from "@/hooks/useCatalogProducts";
import { useDesigners } from "@/hooks/useDesigners";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types";
import { normalizeProductSizes, normalizeProductColors, getAtelierCity } from "@/lib/adapters/productAdapter";
import { Heart, Check, MapPin, Sparkles, MessageCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { isInWishlist, addItem: addWishlist, removeItem: removeWishlist } = useWishlist();
  const { toast } = useToast();

  const [apiProduct, setApiProduct] = useState<Product | null>(null);
  const [isApiLoading, setIsApiLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [pincode, setPincode] = useState("560001");
  const [pincodeCity, setPincodeCity] = useState("Bengaluru");
  const [isEditingPincode, setIsEditingPincode] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  // Fetch product directly from Supabase
  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      setIsApiLoading(true);

      try {
        const { data: row, error } = await supabase
          .from("products")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (error) console.error("[PDP] DB error:", error);

        if (row) {
          const authoritativePrice =
            typeof (row as any).price === "number" && (row as any).price > 0
              ? (row as any).price
              : 0;

          const rawImages = Array.isArray((row as any).images) && (row as any).images.length
            ? ((row as any).images as string[]).filter(Boolean)
            : [];

          const mapped: Product = {
            id: String(row.id),
            name: (row as any).title ?? "Artisanal Piece",
            price: authoritativePrice,
            originalPrice: (row as any).original_price
              ? Number((row as any).original_price)
              : Math.round(authoritativePrice * 1.3),
            images: rawImages.length > 0 ? rawImages : ["/mockup-assets/lengha-03.jpg"],
            videoUrl: (row as any).video_url ?? undefined,
            brand: (row as any).brand ?? "OGURA Atelier",
            category: (row as any).category ?? "Lehengas",
            sizes: normalizeProductSizes((row as any).sizes),
            colors: normalizeProductColors((row as any).colors),
            inStock: (row as any).is_available ?? true,
            rating: 4.8,
            reviews: 96,
            tags: (row as any).style_tags ?? [],
            description: (row as any).description ?? "Handcrafted artisanal piece from verified creator studio.",
            colorVariants: [],
            occasions: (row as any).occasion_tags ?? [],
            material: (row as any).material ?? (row as any).fabric ?? "Artisanal textile",
          } as Product;

          setApiProduct(mapped);
        }
      } catch (err) {
        console.error("[PDP] Fetch error:", err);
      } finally {
        setIsApiLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const currentProduct = apiProduct;

  // Set default size and color
  useEffect(() => {
    if (currentProduct) {
      const sizes = currentProduct.sizes || [];
      const colors = currentProduct.colors || [];
      setSelectedSize((prev) => (prev && sizes.includes(prev) ? prev : sizes[0] || "S"));
      setSelectedColor((prev) => (prev && colors.some((c) => c.name === prev) ? prev : colors[0]?.name || "Studio Original"));
    }
  }, [currentProduct]);

  // Catalog products for "More from this Atelier"
  const { data: catalogData } = useCatalogProducts();
  const allDesigns = useMemo(() => catalogData?.designs || [], [catalogData]);

  const sameAtelierDesigns = useMemo(() => {
    if (!currentProduct) return [];
    return allDesigns
      .filter((d) => d.slug !== id && d.boutique.toLowerCase() === currentProduct.brand.toLowerCase())
      .slice(0, 4);
  }, [allDesigns, id, currentProduct]);

  const crossCategoryDesigns = useMemo(() => {
    if (!currentProduct) return [];
    return allDesigns
      .filter((d) => d.slug !== id && d.category.toLowerCase() === currentProduct.category.toLowerCase())
      .slice(0, 4);
  }, [allDesigns, id, currentProduct]);

  // Atelier details
  const { data: designers = [] } = useDesigners();
  const atelierInfo = useMemo(() => {
    if (!currentProduct) return null;
    return designers.find(
      (d) =>
        d.brand_name?.toLowerCase() === currentProduct.brand?.toLowerCase() ||
        d.name?.toLowerCase() === currentProduct.brand?.toLowerCase()
    );
  }, [designers, currentProduct]);

  if (isApiLoading) {
    return (
      <div className="min-h-screen bg-paper text-ink flex flex-col">
        <Header />
        <main className="flex-1 max-w-[1320px] mx-auto px-4 sm:px-8 py-10 w-full">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-10">
            <Skeleton className="aspect-[3/4] rounded-sm bg-stone" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-32 bg-stone" />
              <Skeleton className="h-10 w-3/4 bg-stone" />
              <Skeleton className="h-6 w-24 bg-stone" />
              <Skeleton className="h-24 w-full bg-stone" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!currentProduct) {
    return (
      <div className="min-h-screen bg-paper text-ink flex flex-col">
        <Header />
        <main className="flex-1 max-w-[1320px] mx-auto px-4 sm:px-8 py-20 text-center">
          <h1 className="font-serif italic text-3xl font-normal">Piece not found</h1>
          <p className="mt-2 text-xs text-grey-soft">
            This creation is no longer active in the atelier catalogue.
          </p>
          <div className="mt-6">
            <Link
              to="/collections"
              className="rounded-sm bg-ink px-6 py-2.5 text-xs font-semibold text-white hover:bg-rose transition"
            >
              Browse All Creations
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const galleryImages = currentProduct.images.length > 0 ? currentProduct.images : ["/mockup-assets/lengha-03.jpg"];
  // If only 1 image, populate supplementary thumbnails from category assets so gallery is complete
  const thumbnails = galleryImages.length >= 2 
    ? galleryImages 
    : [
        galleryImages[0],
        "/mockup-assets/lengha-12.jpg",
        "/mockup-assets/lengha-21.jpg",
        "/mockup-assets/lengha-07.jpg",
      ];

  const currentDisplayImage = thumbnails[selectedImageIndex] || thumbnails[0];
  const wishlisted = isInWishlist(currentProduct.id);

  const discountPercent =
    currentProduct.originalPrice && currentProduct.originalPrice > currentProduct.price
      ? Math.round((1 - currentProduct.price / currentProduct.originalPrice) * 100)
      : null;

  const atelierCity = getAtelierCity(currentProduct.brand);

  const handleWishlistToggle = () => {
    if (wishlisted) removeWishlist(currentProduct.id);
    else addWishlist(currentProduct);
  };

  const handleAddToCart = () => {
    addItem(currentProduct, selectedSize, selectedColor, 1);
    toast({
      title: "Added to Bag",
      description: `${currentProduct.name} (${selectedSize}) is now in your shopping bag.`,
    });
  };

  const handlePincodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditingPincode(false);
    if (pincode.startsWith("11") || pincode.startsWith("12")) setPincodeCity("Delhi NCR");
    else if (pincode.startsWith("40")) setPincodeCity("Mumbai");
    else if (pincode.startsWith("50")) setPincodeCity("Hyderabad");
    else if (pincode.startsWith("30")) setPincodeCity("Jaipur");
    else setPincodeCity("Metro India");
    toast({ title: "Pincode Updated", description: `Delivery available to ${pincode}` });
  };

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col selection:bg-rose selection:text-white">
      <Header />

      <main className="flex-1 max-w-[1320px] mx-auto w-full px-4 sm:px-8 py-5 sm:py-7">
        {/* Breadcrumbs (.crumbs) */}
        <p className="text-xs text-grey-muted mb-4">
          <Link to="/" className="hover:text-ink transition">Home</Link>
          <span className="mx-2">/</span>
          <Link to={`/collections?category=${encodeURIComponent(currentProduct.category)}`} className="hover:text-ink transition">
            {currentProduct.category}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-ink font-medium">{currentProduct.name}</span>
        </p>

        {/* 2-Column PDP Layout (.pdp) */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-8 lg:gap-12 items-start">
          {/* Left: Gallery (.gal) */}
          <div className="grid grid-cols-1 sm:grid-cols-[76px_1fr] gap-3 items-start">
            {/* Vertical Thumbnail Strip (.th) */}
            <div className="hidden sm:flex flex-col gap-2.5">
              {thumbnails.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`aspect-[3/4] overflow-hidden rounded-sm bg-stone transition border-2 ${
                    selectedImageIndex === idx ? "border-ink opacity-100 ring-1 ring-ink" : "border-transparent opacity-60 hover:opacity-90"
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>

            {/* Main Stage Image (.main) */}
            <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-stone shadow-sm">
              <img
                src={currentDisplayImage}
                alt={currentProduct.name}
                className="h-full w-full object-cover"
              />

              {/* Wishlist Button */}
              <button
                type="button"
                onClick={handleWishlistToggle}
                className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-ink shadow-sm transition hover:scale-110"
                aria-label="Toggle wishlist"
              >
                <Heart className={`h-4 w-4 ${wishlisted ? "fill-rose text-rose" : "text-ink hover:text-rose"}`} />
              </button>

              {/* Stock Badge */}
              <span className="absolute bottom-3 left-3 bg-white/95 text-green-atelier text-[10px] font-semibold px-2.5 py-1 rounded-sm shadow-sm">
                {currentProduct.inStock ? "In studio · 2 pieces left" : "Made on order"}
              </span>
            </div>

            {/* Mobile Thumbnails Row */}
            <div className="flex sm:hidden gap-2 overflow-x-auto pb-1 mt-2">
              {thumbnails.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`shrink-0 w-16 aspect-[3/4] overflow-hidden rounded-sm bg-stone border-2 ${
                    selectedImageIndex === idx ? "border-ink" : "border-transparent opacity-60"
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Right: Buy Box (.buy) */}
          <div className="space-y-5">
            {/* Atelier Attribution */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.11em] text-grey-muted">
                {currentProduct.brand} · {atelierCity}
              </p>

              {/* Product Title in Instrument Serif italic */}
              <h1 className="font-serif italic font-normal text-3xl sm:text-4xl text-ink leading-[1.08] mt-1.5">
                {currentProduct.name}
              </h1>

              {/* Description */}
              <p className="text-sm text-grey-soft mt-2 leading-relaxed">
                {currentProduct.description}
              </p>

              {/* Price Line (.price) */}
              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
                  {formatINR(currentProduct.price)}
                </span>
                {currentProduct.originalPrice && currentProduct.originalPrice > currentProduct.price && (
                  <>
                    <span className="text-base text-grey-muted line-through font-normal">
                      {formatINR(currentProduct.originalPrice)}
                    </span>
                    <span className="text-xs font-bold text-sale-crimson">
                      −{discountPercent}%
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Verified Atelier Box (.atbox) */}
            <div className="flex items-center gap-3 border border-line rounded-sm p-3 bg-wash/60">
              <div className="h-11 w-11 rounded-full overflow-hidden bg-stone shrink-0 border border-line">
                <img
                  src={atelierInfo?.profile_image || "/mockup-assets/lengha-30.jpg"}
                  alt={currentProduct.brand}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-bold text-ink truncate">{currentProduct.brand}</span>
                  <span className="text-[10px] font-semibold text-green-atelier border border-green-atelier rounded-sm px-1.5 py-0.2">
                    Verified
                  </span>
                </div>
                <p className="text-xs text-grey-soft mt-0.5 truncate">
                  {atelierCity} · <span className="text-rose font-bold">★</span> 4.8 (96) · replies in ~2h · joined 2023
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsFollowing(!isFollowing)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-sm transition border shrink-0 ${
                  isFollowing
                    ? "bg-ink text-white border-ink"
                    : "border-line text-ink hover:border-ink"
                }`}
              >
                {isFollowing ? "Following" : "Follow"}
              </button>
            </div>

            {/* Colour Options (.opt) */}
            <div className="border-t border-line pt-4">
              <h4 className="text-[11px] font-bold uppercase tracking-[0.11em] text-grey-soft mb-2.5">
                Colour: <span className="text-ink font-semibold">{selectedColor}</span>
              </h4>
              <div className="flex items-center gap-2">
                {[
                  { name: "Ruby Rose", hex: "#8d3350" },
                  { name: "Emerald Studio", hex: "#2C4638" },
                  { name: "Gold Zari", hex: "#DFC48A" },
                  { name: "Midnight Indigo", hex: "#3B4C7A" },
                ].map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setSelectedColor(c.name)}
                    className={`h-7 w-7 rounded-full transition shadow-sm ${
                      selectedColor === c.name
                        ? "ring-2 ring-ink ring-offset-2 scale-110"
                        : "ring-1 ring-line hover:scale-105"
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            {/* Size Options (.opt) */}
            <div className="border-t border-line pt-4">
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-[11px] font-bold uppercase tracking-[0.11em] text-grey-soft">
                  Size: <span className="text-ink font-semibold">{selectedSize}</span>
                </h4>
                <a
                  href={`https://wa.me/917742698970?text=${encodeURIComponent(
                    `Hi OGURA! Can you help me with sizing for ${currentProduct.name}?`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-rose font-medium hover:underline"
                >
                  Size Consultation →
                </a>
              </div>

              <div className="flex flex-wrap gap-2">
                {["XS", "S", "M", "L", "XL", "Made to my measurements"].map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setSelectedSize(sz)}
                    className={`px-3.5 py-2 text-xs rounded-sm transition font-medium border ${
                      selectedSize === sz
                        ? "border-ink text-ink font-bold bg-white ring-1 ring-ink shadow-sm"
                        : "border-line text-grey-soft bg-white hover:border-ink hover:text-ink"
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Primary Action Buttons (.ctas) */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={handleAddToCart}
                className="w-full py-4 bg-ink text-white font-semibold text-sm rounded-sm hover:bg-rose transition shadow-md flex items-center justify-center gap-2"
              >
                <span>Add to bag — {formatINR(currentProduct.price)}</span>
              </button>

              <a
                href={`https://wa.me/917742698970?text=${encodeURIComponent(
                  `Hi OGURA! I am looking at ${currentProduct.name} by ${currentProduct.brand} (₹${currentProduct.price}) and would like to talk to the designer before ordering.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 border-1.5 border-ink text-ink font-medium text-xs rounded-sm hover:bg-wash transition flex items-center justify-center gap-2"
              >
                <MessageCircle className="h-3.5 w-3.5 text-rose" />
                <span>Talk to Ogura&apos;s designer first</span>
              </a>
            </div>

            {/* Delivery Pincode Checker (.pin) */}
            <div className="flex items-center justify-between bg-wash border border-line p-3 text-xs text-grey-soft rounded-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-ink shrink-0" />
                <span>Deliver to <b>{pincode} · {pincodeCity}</b></span>
                <span className="text-green-atelier font-semibold ml-1">Arrives in 3 days</span>
              </div>

              {!isEditingPincode ? (
                <button
                  type="button"
                  onClick={() => setIsEditingPincode(true)}
                  className="text-xs font-semibold text-ink border-b border-line hover:border-rose hover:text-rose transition"
                >
                  Change
                </button>
              ) : (
                <form onSubmit={handlePincodeSubmit} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-16 bg-white border border-line px-1.5 py-0.5 text-xs text-ink rounded-sm"
                  />
                  <button type="submit" className="text-xs font-bold text-rose">
                    Check
                  </button>
                </form>
              )}
            </div>

            {/* The 4 Trust Invariants (.trust) */}
            <div className="bg-wash/70 border border-line p-4 space-y-2.5 text-xs text-grey-soft rounded-sm">
              <div className="flex items-start gap-2.5">
                <span className="text-green-atelier font-bold text-sm leading-none">✓</span>
                <span>
                  <b className="text-ink">In the studio now.</b> Two pieces left, ships in three days.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-green-atelier font-bold text-sm leading-none">✓</span>
                <span>
                  <b className="text-ink">Money held in escrow</b> until you confirm the fit.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-green-atelier font-bold text-sm leading-none">✓</span>
                <span>
                  <b className="text-ink">One free alteration</b> anywhere in India.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-green-atelier font-bold text-sm leading-none">✓</span>
                <span>
                  <b className="text-ink">Atelier verified</b> — studio vetted by OGURA.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* MORE FROM THIS ATELIER                                       */}
        {/* ============================================================ */}
        {sameAtelierDesigns.length > 0 && (
          <section className="mt-20 pt-10 border-t border-line">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl sm:text-2xl font-medium font-sans text-ink">
                More from {currentProduct.brand}
              </h2>
              <Link
                to={`/collections?atelier=${encodeURIComponent(currentProduct.brand)}`}
                className="text-xs font-semibold text-grey-soft hover:text-rose border-b border-line pb-0.5"
              >
                View all atelier pieces
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
              {sameAtelierDesigns.map((d) => (
                <DesignCard key={d.slug} design={d} />
              ))}
            </div>
          </section>
        )}

        {/* ============================================================ */}
        {/* SIMILAR CATEGORY PIECES                                      */}
        {/* ============================================================ */}
        {crossCategoryDesigns.length > 0 && (
          <section className="mt-14">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl sm:text-2xl font-medium font-sans text-ink">
                You may also like in {currentProduct.category}
              </h2>
              <Link
                to={`/collections?category=${encodeURIComponent(currentProduct.category)}`}
                className="text-xs font-semibold text-grey-soft hover:text-rose border-b border-line pb-0.5"
              >
                Shop category
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
              {crossCategoryDesigns.map((d) => (
                <DesignCard key={d.slug} design={d} />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
