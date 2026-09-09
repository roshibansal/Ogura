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
import { normalizeProductSizes, normalizeProductColors, getAtelierCity, normalizeCatalogPrice } from "@/lib/adapters/productAdapter";
import { getEditorialProduct } from "@/lib/editorialLooks";
import { Heart, Check, MapPin, MessageCircle, ShoppingBag } from "lucide-react";
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
  const [showPincodeChange, setShowPincodeChange] = useState(false);
  const [isEditingPincode, setIsEditingPincode] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  // Catalog products for instant fallback & "More from this Atelier"
  const { data: catalogData, isLoading: isCatalogLoading } = useCatalogProducts();
  const allDesigns = useMemo(() => catalogData?.designs || [], [catalogData]);

  // Fetch product directly from Supabase or catalog
  useEffect(() => {
    let isCancelled = false;

    const fetchProduct = async () => {
      if (!id) return;

      // 0. Editorial look check (homepage hero spotlight looks)
      const editorial = getEditorialProduct(id);
      if (editorial) {
        if (!isCancelled) {
          setApiProduct(editorial);
          setIsApiLoading(false);
        }
        return;
      }

      // 1. Instant check from already-loaded catalog products
      if (catalogData?.rawProducts?.length) {
        const cached = catalogData.rawProducts.find(
          (p) => String(p.id) === String(id)
        );
        if (cached) {
          if (!isCancelled) {
            setApiProduct(cached);
            setIsApiLoading(false);
          }
          return;
        }
      }

      setIsApiLoading(true);

      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        
        let query = supabase.from('products').select('*');
        if (isUuid) {
          query = query.eq('id', id);
        } else {
          query = query.ilike('title', `%${id.replace(/-/g, ' ')}%`);
        }

        const { data: row, error } = await query.maybeSingle();

        if (error) {
          console.error("[PDP] DB query error:", error);
        }

        if (row && !isCancelled) {
          const { price: authoritativePrice, originalPrice: computedOriginalPrice } = normalizeCatalogPrice(
            (row as any).price,
            row.id || (row as any).title,
            (row as any).category
          );

          const rawImages = Array.isArray((row as any).images) && (row as any).images.length
            ? ((row as any).images as string[]).filter(Boolean)
            : [];

          const mapped: Product = {
            id: String(row.id),
            name: (row as any).title ?? "Artisanal Piece",
            price: authoritativePrice,
            originalPrice: computedOriginalPrice,
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
        } else if (!row && !isCancelled) {
          // Check local custom products (created via seller portal)
          try {
            const localCustom = localStorage.getItem("ogura_custom_catalog_products");
            if (localCustom) {
              const customItems = JSON.parse(localCustom);
              const foundCustom = customItems.find((cp: any) => String(cp.id) === String(id));
              if (foundCustom) {
                const { price: customPrice, originalPrice: customOriginalPrice } = normalizeCatalogPrice(
                  foundCustom.price,
                  foundCustom.id || foundCustom.title,
                  foundCustom.category
                );
                setApiProduct({
                  id: String(foundCustom.id),
                  name: foundCustom.title || "Artisanal Creation",
                  brand: foundCustom.brand || "OGURA Atelier",
                  price: customPrice,
                  originalPrice: customOriginalPrice,
                  category: (foundCustom.category || "dresses") as Product["category"],
                  images: Array.isArray(foundCustom.images) && foundCustom.images.length > 0 ? foundCustom.images : ["/placeholder.svg"],
                  sizes: normalizeProductSizes(foundCustom.sizes),
                  colors: normalizeProductColors(foundCustom.colors),
                  description: foundCustom.description || "",
                  material: foundCustom.material || foundCustom.fabric || "Pure silk / handloom textile",
                  inStock: true,
                  tags: Array.isArray(foundCustom.style_tags) ? foundCustom.style_tags : [],
                  occasions: Array.isArray(foundCustom.occasion_tags) ? foundCustom.occasion_tags : [],
                  rating: 5.0,
                  reviews: 1,
                });
              }
            }
          } catch {}
        }
      } catch (err) {
        console.error("[PDP] Fetch error:", err);
      } finally {
        if (!isCancelled) {
          setIsApiLoading(false);
        }
      }
    };

    fetchProduct();

    return () => {
      isCancelled = true;
    };
  }, [id, catalogData]);


  // Fallback chain: apiProduct -> rawProducts -> allDesigns -> null
  const currentProduct = useMemo(() => {
    if (apiProduct) return apiProduct;
    if (id && catalogData?.rawProducts?.length) {
      const fromRaw = catalogData.rawProducts.find((p) => String(p.id) === String(id));
      if (fromRaw) return fromRaw;
    }
    if (id && allDesigns.length) {
      const fromDesign = allDesigns.find((d) => String(d.slug) === String(id));
      if (fromDesign?.rawProduct) return fromDesign.rawProduct;
    }
    const editorial = getEditorialProduct(id);
    if (editorial) return editorial;
    return null;
  }, [apiProduct, id, catalogData, allDesigns]);

  // Set default size and color
  useEffect(() => {
    if (currentProduct) {
      const sizes = currentProduct.sizes || [];
      const colors = currentProduct.colors || [];
      setSelectedSize((prev) => (prev && sizes.includes(prev) ? prev : sizes[0] || "S"));
      setSelectedColor((prev) => (prev && colors.some((c) => c.name === prev) ? prev : colors[0]?.name || "Studio Original"));
    }
  }, [currentProduct]);

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

  if ((isApiLoading || isCatalogLoading) && !currentProduct) {
    return (
      <div className="min-h-screen bg-white text-[#5A0A26] flex flex-col">
        <Header />
        <main className="flex-1 max-w-[1320px] mx-auto px-4 sm:px-8 py-10 w-full">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-10">
            <Skeleton className="aspect-[3/4] rounded-sm bg-neutral-200" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-32 bg-neutral-200" />
              <Skeleton className="h-10 w-3/4 bg-neutral-200" />
              <Skeleton className="h-6 w-24 bg-neutral-200" />
              <Skeleton className="h-24 w-full bg-neutral-200" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!currentProduct) {
    return (
      <div className="min-h-screen bg-white text-[#5A0A26] flex flex-col">
        <Header />
        <main className="flex-1 max-w-[1320px] mx-auto px-4 sm:px-8 py-20 text-center">
          <h1 className="font-serif italic text-3xl font-normal text-[#5A0A26]">Piece not found</h1>
          <p className="mt-2 text-xs text-[#5A0A26]/70">
            This creation is no longer active in the atelier catalogue.
          </p>
          <div className="mt-6">
            <Link
              to="/marketplace"
              className="rounded-sm bg-[#5A0A26] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#881337] transition"
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

  // Only ever show genuine photographs of THIS piece. This used to pad any
  // single-image product with three fixed lehenga shots, so every such product
  // page displayed three unrelated garments in its thumbnail rail.
  const thumbnails = galleryImages;

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

  const handleBuyNow = () => {
    addItem(currentProduct, selectedSize, selectedColor, 1);
    navigate("/checkout");
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
    <div className="min-h-screen bg-white text-[#5A0A26] flex flex-col selection:bg-gold selection:text-ink">
      <Header />

      <main className="flex-1 max-w-[1360px] mx-auto w-full px-4 sm:px-8 pt-6 pb-24 sm:py-8">
        {/* Breadcrumbs (.crumbs) */}
        <p className="text-sm text-ink/75 mb-5 font-semibold">
          <Link to="/" className="hover:text-ink transition">Home</Link>
          <span className="mx-2 text-[#EAE3D9]">/</span>
          <Link to={`/marketplace?category=${encodeURIComponent(currentProduct.category)}`} className="hover:text-ink transition">
            {currentProduct.category}
          </Link>
          <span className="mx-2 text-[#EAE3D9]">/</span>
          <span className="text-ink font-bold">{currentProduct.name}</span>
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
            <div>              <p className="text-xs sm:text-sm font-bold tracking-[0.16em] uppercase text-ink/80">
                {currentProduct.brand} · {atelierCity}
              </p>

              {/* Product Title in Instrument Serif */}
              <h1 className="font-serif italic font-normal text-3xl sm:text-5xl text-ink leading-[1.08] mt-2">
                {currentProduct.name}
              </h1>

              {/* Description */}
              <p className="text-sm sm:text-base text-ink/85 mt-3 leading-relaxed">
                {currentProduct.description}
              </p>

              {/* Price Line (.price) */}
              <div className="mt-5 flex flex-wrap items-baseline gap-3.5">
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-ink">
                  {formatINR(currentProduct.price)}
                </span>
                {currentProduct.originalPrice && currentProduct.originalPrice > currentProduct.price && (
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs sm:text-sm font-black text-white bg-[#5A0A26] border border-[#3D0618] px-2.5 py-1 rounded-xs flex items-center gap-1 shadow-xs">
                      <span>SAVE {discountPercent}%</span>
                    </span>
                    <span className="text-base text-ink/40 line-through font-normal">
                      {formatINR(currentProduct.originalPrice)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Verified Atelier Box — the photo, name and badge all lead to the
                boutique, so a shopper can see everything else they make. */}
            <div className="flex items-center gap-4 border border-[#EAE3D9] rounded-sm p-4 bg-white/95 shadow-[0_0_15px_rgba(226,209,163,0.22)]">
              <Link
                to={atelierInfo?.id ? `/designers/${atelierInfo.id}` : `/collections?atelier=${encodeURIComponent(currentProduct.brand || "")}`}
                className="h-12 w-12 rounded-full overflow-hidden bg-stone shrink-0 border-2 border-[#EAE3D9] hover:border-[#5A0A26] transition"
                aria-label={`View all pieces by ${currentProduct.brand}`}
              >
                <img
                  src={atelierInfo?.profile_image || "/mockup-assets/lengha-30.jpg"}
                  alt={currentProduct.brand}
                  className="h-full w-full object-cover"
                />
              </Link>

              <div className="flex-1 min-w-0">
                <Link
                  to={atelierInfo?.id ? `/designers/${atelierInfo.id}` : `/collections?atelier=${encodeURIComponent(currentProduct.brand || "")}`}
                  className="group flex items-center gap-2 flex-wrap"
                >
                  <span className="text-base font-bold text-ink truncate group-hover:text-[#5A0A26] transition">
                    {currentProduct.brand}
                  </span>
                  <span className="text-xs font-mono font-extrabold text-gold border border-[#EAE3D9] rounded-sm px-2 py-0.5 uppercase tracking-wider bg-white">
                    VERIFIED ATELIER
                  </span>
                </Link>
                <p className="text-xs sm:text-sm text-ink/80 mt-0.5 truncate font-medium">
                  {atelierCity} · Handcrafted in studio · replies in ~2h
                </p>
                <Link
                  to={atelierInfo?.id ? `/designers/${atelierInfo.id}` : `/collections?atelier=${encodeURIComponent(currentProduct.brand || "")}`}
                  className="inline-block mt-1 text-xs font-bold text-[#5A0A26] hover:underline underline-offset-2"
                >
                  See everything from this boutique →
                </Link>
              </div>

              <button
                type="button"
                onClick={() => setIsFollowing(!isFollowing)}
                className={`text-xs sm:text-sm font-bold px-4 py-2 rounded-sm transition border shrink-0 ${
                  isFollowing
                    ? "bg-ink text-white border-ink"
                    : "border-[#EAE3D9] text-ink hover:border-gold hover:text-gold bg-white"
                }`}
              >
                {isFollowing ? "Following" : "Follow"}
              </button>
            </div>

            {/* Size Options (.opt) */}
            <div className="border-t border-line pt-4">
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-[11px] font-bold uppercase tracking-[0.11em] text-ink/75">
                  Size: <span className="text-ink font-semibold">{selectedSize}</span>
                </h4>
                <a
                  href={`https://wa.me/917742698970?text=${encodeURIComponent(
                    `Hi OGURA! Can you help me with sizing for ${currentProduct.name}?`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#5A0A26] font-bold hover:underline"
                >
                  Free Size Help →
                </a>
              </div>
              <div className="flex flex-wrap gap-2">
                {(currentProduct.sizes && currentProduct.sizes.length > 0
                  ? currentProduct.sizes
                  : ["XS", "S", "M", "L", "XL"]
                ).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setSelectedSize(sz)}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-sm border transition ${
                      selectedSize === sz
                        ? "bg-ink text-white border-ink shadow-xs"
                        : "bg-white text-ink border-line hover:border-gold"
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Primary Action Buttons (Amazon Psychology: Amazon Orange Buy Now, Black Add to Bag) */}
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="w-full py-4 bg-[#5A0A26] hover:bg-[#3D0618] active:bg-[#96143E] text-white font-extrabold text-base rounded-sm transition shadow-md flex items-center justify-center gap-2 border border-[#3D0618] group"
                >
                  <span>Buy Now — {formatINR(currentProduct.price)}</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="w-full py-4 bg-[#2B0F1E] hover:bg-[#3D1A2A] text-white font-bold text-base rounded-sm transition shadow-md flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="h-5 w-5 text-white" />
                  <span>Add to Bag</span>
                </button>
              </div>

              <a
                href={`https://wa.me/917742698970?text=${encodeURIComponent(
                  `Hi OGURA! I am looking at ${currentProduct.name} by ${currentProduct.brand} (₹${currentProduct.price}) and would like to talk to the designer before ordering.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 bg-white border border-[#EAE3D9] text-ink font-bold text-sm rounded-sm hover:border-gold transition flex items-center justify-center gap-2.5 shadow-[0_0_10px_rgba(226,209,163,0.15)]"
              >
                <MessageCircle className="h-4 w-4 text-gold" />
                <span>Chat with this boutique on Ogura</span>
                <span className="text-xs text-ink/70 font-medium">(Fit & styling consult)</span>
              </a>
            </div>

            {/* Delivery Pincode Checker (.pin) */}
            <div className="flex items-center justify-between bg-white/95 border border-[#EAE3D9] p-4 text-sm text-ink rounded-sm shadow-[0_0_12px_rgba(226,209,163,0.18)]">
              <div className="flex items-center gap-2.5">
                <MapPin className="h-4 w-4 text-ink shrink-0" />
                <span>Deliver to <b>{pincode} · {pincodeCity}</b></span>
                <span className="text-green-atelier font-bold ml-1">Arrives in 3 days</span>
              </div>

              {!isEditingPincode ? (
                <button
                  type="button"
                  onClick={() => setIsEditingPincode(true)}
                  className="text-sm font-bold text-ink border-b border-line hover:border-rose hover:text-rose transition"
                >
                  Change
                </button>
              ) : (
                <form onSubmit={handlePincodeSubmit} className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-20 bg-white border border-[#EAE3D9] px-2 py-1 text-sm text-ink rounded-sm font-bold"
                  />
                  <button type="submit" className="text-sm font-extrabold text-rose">
                    Check
                  </button>
                </form>
              )}
            </div>

            {/* The 4 Trust Invariants (.trust) */}
            <div className="bg-white/95 border border-[#EAE3D9] p-5 space-y-3 text-sm text-ink/85 rounded-sm shadow-xs">
              <div className="flex items-start gap-3">
                <span className="text-emerald-700 font-extrabold text-base leading-none">✓</span>
                <span>
                  <b className="text-ink">In the shop now.</b> Ready to ship in 2-3 days.
                </span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-emerald-700 font-extrabold text-base leading-none">✓</span>
                <span>
                  <b className="text-ink">Verified Shop</b> — quality checked directly by OGURA.
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

      {/* Mobile Sticky Buy & Add-to-Bag Bar */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white/98 backdrop-blur-md border-t border-[#EAE3D9] p-2.5 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] flex items-center gap-2">
        <button
          type="button"
          onClick={handleAddToCart}
          className="flex-1 py-3 bg-[#2B0F1E] hover:bg-[#3D1A2A] active:bg-black text-white font-extrabold text-xs rounded-sm transition flex items-center justify-center gap-1.5 shadow-xs"
        >
          <ShoppingBag className="h-3.5 w-3.5 text-[#5A0A26]" />
          <span>Add to Bag</span>
        </button>
        <button
          type="button"
          onClick={handleBuyNow}
          className="flex-1 py-3 bg-[#5A0A26] hover:bg-[#3D0618] active:bg-[#96143E] text-white font-black text-xs rounded-sm transition border border-[#3D0618] flex items-center justify-center shadow-md"
        >
          <span>Buy Now ({formatINR(currentProduct.price)})</span>
        </button>
      </div>

      <Footer />
    </div>
  );
}
