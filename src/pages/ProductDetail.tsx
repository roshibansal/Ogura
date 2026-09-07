import React, { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingBag, Ruler, AlertCircle, Minus, Plus, Check, PhoneCall } from "lucide-react";
import { products as staticProducts } from "@/data/products";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useLocation } from "@/contexts/LocationContext";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { ProductImageGallery } from "@/components/ProductImageGallery";
import { SizeGuideModal } from "@/components/SizeGuideModal";
import { DeliveryChecker } from "@/components/DeliveryChecker";
import { AddressSelectionModal } from "@/components/AddressSelectionModal";
import { CallRequest } from "@/components/CallRequest";
import { DesignCard } from "@/components/Cards";
import { useCatalogProducts } from "@/hooks/useCatalogProducts";
import { Product, ColorVariant, UserAddress } from "@/types";
import { getUniformProductPrice, normalizeProductColors, normalizeProductSizes } from "@/lib/adapters/productAdapter";
import { cn } from "@/lib/utils";


export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { toggleItem, isInWishlist } = useWishlist();
  const { setShowAddressModal, showAddressModal, selectedAddress, setSelectedAddress } = useLocation();

  // Product fetch state
  const [apiProduct, setApiProduct] = useState<Product | null>(null);
  const [isApiLoading, setIsApiLoading] = useState(true);

  // User selections
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [pendingBuyNow, setPendingBuyNow] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Fetch product from Supabase, then static products
  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) {
        setIsApiLoading(false);
        return;
      }
      setIsApiLoading(true);

      try {
        const { data: row, error } = await supabase
          .from("products")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (error) console.error("[PDP] DB error:", error);

        if (row) {
          const price = getUniformProductPrice(String(row.id));
          const mapped: Product = {
            id: String(row.id),
            name: (row as any).title ?? "Artisanal Piece",
            price,
            originalPrice: (row as any).original_price ? Number((row as any).original_price) : Math.round(price * 1.3),
            images:
              Array.isArray((row as any).images) && (row as any).images.length
                ? ((row as any).images as string[])
                : ["/placeholder.svg"],
            videoUrl: (row as any).video_url ?? undefined,
            brand: (row as any).brand ?? "OGURA Atelier",
            category: (row as any).category ?? "dresses",
            sizes: normalizeProductSizes((row as any).sizes),
            colors: normalizeProductColors((row as any).colors),
            inStock: (row as any).is_available ?? true,
            rating: 4.9,
            reviews: 14,
            tags: (row as any).style_tags ?? [],
            description: (row as any).description ?? "",
            colorVariants: [],
            occasions: (row as any).occasion_tags ?? [],
            material: (row as any).material ?? (row as any).fabric ?? "Handwoven artisanal textile",
          } as Product;

          setApiProduct(mapped);
        } else {
          // Fallback to static catalog by ID
          const found = staticProducts.find((p) => p.id === id);
          if (found) {
            setApiProduct({
              ...found,
              price: getUniformProductPrice(found.id),
              sizes: normalizeProductSizes(found.sizes),
              colors: normalizeProductColors(found.colors),
            });
          }
        }
      } catch (err) {
        console.error("[PDP] Fetch error:", err);
      } finally {
        setIsApiLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Current product resolution
  const currentProduct = useMemo(() => {
    if (apiProduct) return apiProduct;
    return staticProducts.find((p) => p.id === id) || null;
  }, [apiProduct, id]);

  // Set default size and color when product loads or changes
  useEffect(() => {
    if (currentProduct) {
      const sizes = currentProduct.sizes || [];
      const colors = currentProduct.colors || [];
      setSelectedSize((prev) => (prev && sizes.includes(prev) ? prev : (sizes[0] || "Free Size")));
      setSelectedColor((prev) => (prev && colors.some((c) => c.name === prev) ? prev : (colors[0]?.name || "Studio Original")));
    }
  }, [currentProduct?.id]);


  // More designs from catalog
  const { data: catalogData } = useCatalogProducts();
  const moreDesigns = useMemo(() => {
    return (catalogData?.designs || [])
      .filter((d) => d.slug !== id)
      .slice(0, 4);
  }, [catalogData, id]);

  if (isApiLoading) {
    return (
      <div className="min-h-screen bg-ivory text-ink flex flex-col">
        <Header />
        <main className="flex-1 max-w-7xl mx-auto px-5 py-12 w-full">
          <div className="grid lg:grid-cols-2 gap-12">
            <Skeleton className="aspect-[4/5] rounded-xl bg-parchment" />
            <div className="space-y-6">
              <Skeleton className="h-6 w-32 bg-parchment" />
              <Skeleton className="h-10 w-3/4 bg-parchment" />
              <Skeleton className="h-8 w-24 bg-parchment" />
              <Skeleton className="h-24 w-full bg-parchment" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!currentProduct) {
    return (
      <div className="min-h-screen bg-ivory text-ink flex flex-col">
        <Header />
        <main className="flex-1 max-w-3xl mx-auto px-5 py-24 text-center">
          <h1 className="font-display text-4xl">Design Not Found</h1>
          <p className="mt-3 text-ink-soft">
            This piece may have been retired or made to order exclusively for another client.
          </p>
          <Link
            to="/collections"
            className="mt-6 inline-block rounded-full bg-ink px-7 py-3 text-sm font-medium text-ivory hover:bg-clay transition"
          >
            Return to Collection
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const isWishlisted = isInWishlist(currentProduct.id);

  const handleAddToCart = () => {
    if (!currentProduct) return;
    const colorToUse = selectedColor || currentProduct.colors[0]?.name || "Studio Original";
    const sizeToUse = selectedSize || currentProduct.sizes[0] || "Free Size";
    addItem(currentProduct, sizeToUse, colorToUse, quantity);
    toast({
      title: "Added to Bag",
      description: `${currentProduct.name} (${sizeToUse} · ${colorToUse}) added to your shopping bag.`,
    });
  };

  const handleBuyNow = () => {
    if (!currentProduct) return;
    const colorToUse = selectedColor || currentProduct.colors[0]?.name || "Studio Original";
    const sizeToUse = selectedSize || currentProduct.sizes[0] || "Free Size";
    addItem(currentProduct, sizeToUse, colorToUse, quantity);
    navigate("/cart");
  };

  const handleAddressSelect = (address: UserAddress) => {
    setSelectedAddress(address);
    if (pendingBuyNow) {
      setPendingBuyNow(false);
      navigate("/checkout");
    }
  };


  const handleWishlistToggle = () => {
    toggleItem(currentProduct);
    toast({
      title: isWishlisted ? "Removed from Wishlist" : "Saved to Wishlist",
    });
  };

  const images = currentProduct.images && currentProduct.images.length > 0 
    ? currentProduct.images 
    : ["/placeholder.svg"];

  return (
    <div className="min-h-screen bg-ivory text-ink grain flex flex-col selection:bg-clay selection:text-white">
      <Header />

      <main className="flex-1 mx-auto max-w-7xl px-5 py-8 sm:py-12 w-full">
        {/* Breadcrumb link */}
        <Link to="/collections" className="text-xs uppercase tracking-[0.16em] font-medium text-ink-soft hover:text-ink transition flex items-center gap-1">
          ← Back to collection
        </Link>

        {/* 2-Column Editorial PDP */}
        <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_1fr]">
          {/* Left Column: Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-parchment shadow-sm">
              <img
                src={images[activeImageIndex] || images[0]}
                alt={currentProduct.name}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={handleWishlistToggle}
                aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-ivory/80 text-ink backdrop-blur-sm transition hover:bg-ivory hover:text-clay"
              >
                <Heart className={`h-5 w-5 ${isWishlisted ? "fill-clay text-clay" : "text-ink"}`} />
              </button>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {images.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveImageIndex(i)}
                    className={`aspect-square overflow-hidden rounded-xl border-2 transition ${
                      activeImageIndex === i ? "border-clay" : "border-transparent opacity-75 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt={`Angle ${i + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Editorial Product Narrative & Commerce Actions */}
          <div className="space-y-6">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] font-semibold text-clay">
                {currentProduct.brand} · India
              </p>
              <h1 className="mt-2 font-display text-3xl sm:text-4xl font-normal leading-tight">
                {currentProduct.name}
              </h1>
              {currentProduct.description && (
                <p className="mt-2 text-sm sm:text-base text-ink-soft leading-relaxed">
                  {currentProduct.description}
                </p>
              )}
              <div className="mt-4 flex items-baseline gap-3">
                <span className="font-display text-3xl font-normal">
                  ₹{currentProduct.price.toLocaleString("en-IN")}
                </span>
                {currentProduct.originalPrice && currentProduct.originalPrice > currentProduct.price && (
                  <span className="text-sm text-ink-soft line-through">
                    ₹{currentProduct.originalPrice.toLocaleString("en-IN")}
                  </span>
                )}
                <span className="text-xs text-ink-soft">Inclusive of all taxes</span>
              </div>
            </div>

            {/* Studio Stock Status Banner */}
            {currentProduct.inStock ? (
              <div className="rounded-xl border border-forest/25 bg-forest/5 p-4 text-xs sm:text-sm">
                <p className="font-medium text-forest">In the studio right now</p>
                <p className="mt-1 text-ink-soft">
                  Ships in 2–3 days. Once this studio piece is claimed, the atelier remakes it to order.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-ink/15 bg-parchment p-4 text-xs sm:text-sm">
                <p className="font-medium text-ink">Bespoke creation — made on order</p>
                <p className="mt-1 text-ink-soft">
                  Tailored to your specific measurements in 10–14 days. Begins with a designer call.
                </p>
              </div>
            )}

            {/* Fabric Specification */}
            <div className="border-t border-black/5 pt-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Artisanal Fabric</span>
              <p className="mt-1 text-sm font-medium">{currentProduct.material || "Pure handloom silk blend"}</p>
            </div>

            {/* Sizes Selection */}
            {currentProduct.sizes && currentProduct.sizes.length > 0 && (
              <div className="border-t border-black/5 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Select Size</span>
                    {selectedSize && (
                      <span className="text-xs font-semibold text-clay bg-clay/10 px-2 py-0.5 rounded-md">
                        {selectedSize}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSizeGuide(true)}
                    className="text-xs font-medium text-clay hover:underline flex items-center gap-1"
                  >
                    <Ruler className="h-3 w-3" /> Size Guide
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {currentProduct.sizes.map((s) => {
                    const isSelected = selectedSize === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSelectedSize(s)}
                        className={cn(
                          "min-w-[48px] rounded-full px-4 py-2 text-xs font-semibold tracking-wide transition-all",
                          isSelected
                            ? "bg-ink text-ivory shadow-md ring-2 ring-ink ring-offset-2 scale-[1.03]"
                            : "border border-ink/20 bg-white/70 text-ink hover:border-ink hover:bg-white"
                        )}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Colors Selection */}
            {currentProduct.colors && currentProduct.colors.length > 0 && (
              <div className="border-t border-black/5 pt-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Color Variant</span>
                  {selectedColor && (
                    <span className="text-xs font-semibold text-clay bg-clay/10 px-2 py-0.5 rounded-md">
                      {selectedColor}
                    </span>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {currentProduct.colors.map((c) => {
                    const isSelected = selectedColor === c.name;
                    return (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setSelectedColor(c.name)}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all",
                          isSelected
                            ? "border-2 border-clay bg-white text-ink shadow-sm ring-2 ring-clay/20 font-semibold"
                            : "border border-ink/20 bg-white/70 text-ink-soft hover:border-ink hover:text-ink"
                        )}
                      >
                        <span
                          className="h-3.5 w-3.5 rounded-full border border-black/15 shrink-0"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span>{c.name}</span>
                        {isSelected && <Check className="h-3 w-3 text-clay stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-4 border-t border-black/5 pt-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Quantity</span>
              <div className="flex items-center rounded-full border border-ink/20 bg-white px-2 py-1">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="p-1 text-ink-soft hover:text-ink disabled:opacity-30"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-8 text-center text-xs font-medium">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-1 text-ink-soft hover:text-ink"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Commerce Action Buttons */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="button"
                  onClick={handleAddToCart}
                  className="flex-1 rounded-full bg-ink py-6 text-sm font-medium text-ivory hover:bg-clay transition shadow-md hover:shadow-lg"
                >
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Add to Bag · ₹{(currentProduct.price * quantity).toLocaleString("en-IN")}
                </Button>
                <Button
                  type="button"
                  onClick={handleBuyNow}
                  className="flex-1 rounded-full border border-ink bg-transparent py-6 text-sm font-medium text-ink hover:bg-ink hover:text-ivory transition"
                >
                  Buy Now with One-Click
                </Button>
              </div>

              {/* Atelier Call Consultation Trigger - Talk to OGURA's Atelier */}
              <div className="rounded-2xl border border-clay/30 bg-clay/5 p-4 sm:p-5 mt-2">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-clay/10 p-2.5 text-clay shrink-0 mt-0.5">
                    <PhoneCall className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-base font-semibold text-ink">
                        Talk to OGURA&apos;s Atelier
                      </h3>
                      <span className="rounded-full bg-forest/10 px-2 py-0.5 text-[10px] font-semibold text-forest uppercase tracking-wider">
                        Complimentary
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-ink-soft leading-relaxed">
                      Custom measurements, custom sleeve/neckline, or specific dye colors? Connect directly with the head designer of {currentProduct.brand || "OGURA Atelier"} before ordering.
                    </p>
                    <div className="mt-3">
                      <CallRequest
                        boutique={currentProduct.brand || "OGURA Atelier"}
                        owner="Head Atelier Couturier"
                        design={currentProduct.name}
                        variant="solid"
                        label="Talk to OGURA's Atelier · Request a Call"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-center text-xs text-ink-soft pt-1">
                Ogura Buyer Protection: Your payment is held safely until you verify fit. One complimentary alteration included anywhere in India.
              </p>
            </div>

            {/* Delivery Checker Component */}
            <div className="border-t border-black/5 pt-6">
              <DeliveryChecker />
            </div>

            {/* "Nothing in your size?" Atelier Custom Guarantee */}
            <div className="rounded-xl border border-ink/10 bg-parchment/60 p-5 text-xs sm:text-sm">
              <p className="font-semibold text-ink">Need custom sleeve, neckline, or specific size?</p>
              <p className="mt-1.5 leading-relaxed text-ink-soft">
                That is why the consultation call exists. The atelier can customize this design to your exact body measurements, change the lining, or craft it in another shade. Click &quot;Talk to OGURA&apos;s Atelier&quot; above to coordinate directly with the studio.
              </p>
            </div>
          </div>
        </div>


        {/* More Creations from Ateliers */}
        {moreDesigns.length > 0 && (
          <section className="mt-24 border-t border-black/5 pt-14">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl sm:text-3xl font-normal">More from the ateliers</h2>
              <Link to="/collections" className="text-xs sm:text-sm font-medium text-clay hover:underline">
                View all collection →
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {moreDesigns.map((d) => (
                <DesignCard key={d.slug} design={d} />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Modals */}
      {showSizeGuide && (
        <SizeGuideModal
          isOpen={showSizeGuide}
          onClose={() => setShowSizeGuide(false)}
          category={currentProduct.category}
        />
      )}

      {showAddressModal && (
        <AddressSelectionModal
          open={showAddressModal}
          onOpenChange={setShowAddressModal}
          onAddressSelect={handleAddressSelect}
          selectedAddressId={selectedAddress?.id}
        />
      )}

      <Footer />
    </div>
  );
}
