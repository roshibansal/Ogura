import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, ShoppingBag } from "lucide-react";
import { DesignVM, transformProductToDesignStrict } from "@/lib/adapters/productAdapter";
import { BoutiqueVM } from "@/lib/adapters/boutiqueAdapter";
import { Product } from "@/types";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";

export function formatINR(price: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
}

export function DesignCard({
  product,
  design,
  priority = false,
  compact = false,
}: {
  product?: Product;
  design?: DesignVM;
  priority?: boolean;
  compact?: boolean;
}) {
  const d: DesignVM = design || (product ? transformProductToDesignStrict(product) : ({} as DesignVM));
  const { isInWishlist, addItem: addWishlist, removeItem: removeWishlist } = useWishlist();
  const { addItem: addCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();

  const wishlisted = d.rawProduct ? isInWishlist(d.rawProduct.id) : false;

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!d.rawProduct) return;
    if (wishlisted) {
      removeWishlist(d.rawProduct.id);
    } else {
      addWishlist(d.rawProduct);
    }
  };

  const handleQuickAdd = (e: React.MouseEvent, size: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!d.rawProduct) return;
    
    if (size === "+ custom") {
      navigate(`/product/${d.slug}`);
      return;
    }

    addCart(d.rawProduct, size, d.colours[0] || "Studio Original", 1);
    toast({
      title: "Added to Bag",
      description: `${d.title} (${size}) is ready in your bag.`,
      action: (
        <button
          type="button"
          onClick={() => navigate("/checkout")}
          className="bg-[#5A0A26] text-white border border-[#3D0618] text-[11px] font-bold px-3 py-1 rounded-sm hover:bg-[#3D0618] transition shadow-xs shrink-0"
        >
          Buy Now →
        </button>
      ),
    });
  };

  const handleDirectBuy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!d.rawProduct) return;
    const sizeToUse = d.sizes && d.sizes.length > 0 ? d.sizes[0] : "Standard";
    const colorToUse = d.colours && d.colours.length > 0 ? d.colours[0] : "Studio Original";
    addCart(d.rawProduct, sizeToUse, colorToUse, 1);
    navigate("/checkout");
  };

  const discountPercent =
    d.originalPrice && d.originalPrice > d.price
      ? Math.round((1 - d.price / d.originalPrice) * 100)
      : null;

  return (
    <article
      className={`group relative flex flex-col text-ink cursor-pointer bg-white/95 rounded-sm border border-[#EAE3D9] shadow-[0_0_10px_rgba(226,209,163,0.18)] hover:shadow-[0_0_18px_rgba(226,209,163,0.35)] transition-all hover:border-[#C9A56B] ${
        compact ? "p-2 sm:p-2.5" : "p-3.5 sm:p-4"
      }`}
    >
      {/* Product Image Wrapper with Dual Image Hover */}
      <div className="relative aspect-[3/4] overflow-hidden bg-stone rounded-sm">
        <Link to={`/product/${d.slug}`} className="block h-full w-full">
          {/* Main image. Cross-fades only when a genuine second photo exists;
              otherwise it simply scales, so hover never reveals another product. */}
          <img
            src={d.image}
            alt={d.title}
            loading={priority ? "eager" : "lazy"}
            className={`h-full w-full object-cover transition-all duration-700 ease-[cubic-bezier(0.16,0.8,0.28,1)] ${
              d.altImage ? "group-hover:opacity-0" : "group-hover:scale-105"
            }`}
          />

          {d.altImage ? (
            <img
              src={d.altImage}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition-all duration-700 ease-[cubic-bezier(0.16,0.8,0.28,1)] group-hover:opacity-100 group-hover:scale-105"
            />
          ) : null}
        </Link>

        {/* Top Left: % Discount Badge */}
        {discountPercent && discountPercent > 0 ? (
          <div className="absolute left-2 top-2 z-10 flex items-center gap-0.5 rounded-sm bg-[#5A0A26] px-1.5 py-0.5 text-[11px] sm:text-xs font-black tracking-tight text-white shadow-md border border-[#3D0618]">
            <span>{discountPercent}% OFF</span>
          </div>
        ) : d.readyStock ? (
          <div className="absolute left-2 top-2 z-10 rounded-sm bg-white/95 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink border border-[#EAE3D9] shadow-xs">
            Ships 48h
          </div>
        ) : null}

        {/* Top Right: Wishlist Toggle */}
        {d.rawProduct && (
          <button
            type="button"
            onClick={handleWishlistToggle}
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            className="absolute right-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-ink shadow-xs transition hover:scale-110 border border-[#EAE3D9]/70"
          >
            <Heart
              className={`h-3.5 w-3.5 transition ${
                wishlisted ? "fill-ink text-ink" : "text-ink/60 hover:text-ink"
              }`}
            />
          </button>
        )}

        {/* Hover Quick Size Selector */}
        <div className="absolute inset-x-2 bottom-2 z-20 hidden sm:flex items-center justify-center gap-1.5 rounded-sm bg-white/97 py-1.5 px-2 text-xs font-semibold text-ink shadow-md opacity-0 translate-y-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 border border-[#EAE3D9]">
          {(d.sizes.length > 0 ? d.sizes : ["XS", "S", "M", "L"]).slice(0, 4).map((sz) => (
            <button
              key={sz}
              type="button"
              onClick={(e) => handleQuickAdd(e, sz)}
              className="rounded px-1.5 py-0.5 text-ink/90 hover:bg-neutral-100 hover:text-ink transition font-bold text-[11px]"
            >
              {sz}
            </button>
          ))}
        </div>
      </div>

      {/* Product Details */}
      <div className={`pt-2.5 pb-0.5 flex flex-col justify-between flex-1`}>
        <div>
          {/* Atelier Attribution */}
          <div className="flex items-center justify-between gap-1">
            <Link to={`/collections?atelier=${encodeURIComponent(d.boutique)}`} className="block min-w-0">
              <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.1em] text-ink/80 hover:text-[#5A0A26] transition truncate">
                {d.boutique} | {d.city}
              </p>
            </Link>
            <span className="text-[10px] font-mono font-extrabold text-[#5A0A26] uppercase tracking-wider shrink-0">
              VERIFIED
            </span>
          </div>

          {/* Product Title */}
          <Link to={`/product/${d.slug}`} className="block mt-1">
            <h3
              className={`font-serif italic font-normal text-ink leading-snug transition group-hover:text-[#5A0A26] line-clamp-1 ${
                compact ? "text-base sm:text-lg" : "text-lg sm:text-xl"
              }`}
            >
              {d.title}
            </h3>
          </Link>

          {/* Price Line */}
          <div className="mt-1.5 flex items-baseline gap-2 text-base font-bold text-ink">
            <span className={compact ? "text-base sm:text-lg" : "text-lg sm:text-xl"}>{formatINR(d.price)}</span>
            {d.originalPrice && d.originalPrice > d.price && (
              <>
                <span className="text-xs text-ink/40 line-through font-normal">
                  {formatINR(d.originalPrice)}
                </span>
                {!compact && (
                  <span className="text-xs font-black text-white bg-[#5A0A26] px-1 py-0.2 rounded-xs">
                    {discountPercent}% OFF
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Amazon Buying Psychology Buttons */}
        <div
          className={`pt-2 border-t border-[#EAE3D9]/60 ${
            compact ? "grid grid-cols-2 gap-1.5 mt-2" : "flex flex-col gap-2 mt-3"
          }`}
        >
          <button
            type="button"
            onClick={handleDirectBuy}
            className={`rounded-sm bg-[#5A0A26] hover:bg-[#3D0618] active:bg-[#96143E] text-white font-extrabold transition-all border border-[#3D0618] flex items-center justify-center text-center ${
              compact
                ? "py-1.5 px-1 text-[11px] sm:text-xs"
                : "w-full py-2.5 px-3 text-xs sm:text-sm shadow-xs"
            }`}
          >
            Buy Now
          </button>

          <button
            type="button"
            onClick={(e) => handleQuickAdd(e, d.sizes[0] || "Standard")}
            className={`rounded-sm bg-[#2B0F1E] hover:bg-[#3D1A2A] text-white font-bold transition-all flex items-center justify-center text-center ${
              compact
                ? "py-1.5 px-1 text-[11px] sm:text-xs gap-1"
                : "w-full py-2 px-3 text-xs sm:text-sm shadow-xs gap-2"
            }`}
          >
            <ShoppingBag className="h-3 w-3 text-white shrink-0" />
            <span className="truncate">Add to Bag</span>
          </button>
        </div>
      </div>
    </article>
  );
}

export function BoutiqueCard({ b, count }: { b: BoutiqueVM; count?: number }) {
  return (
    <Link to={`/designers/${b.slug}`} className="group block text-ink bg-white/95 p-4 rounded-sm border border-[#EAE3D9] hover:border-gold transition-all shadow-[0_0_12px_rgba(226,209,163,0.18)] hover:shadow-[0_0_22px_rgba(226,209,163,0.35)]">
      <div className="overflow-hidden rounded-sm aspect-[5/4] bg-stone border border-[#EAE3D9]/60">
        <img
          src={b.image}
          alt={`${b.name}, ${b.city}`}
          className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,0.8,0.28,1)] group-hover:scale-105"
        />
      </div>
      <div className="mt-3">
        <div className="flex items-center justify-between">
          <h3 className="font-serif italic text-xl font-normal transition group-hover:text-gold leading-snug text-ink">
            {b.name}
          </h3>
          <span className="text-[11px] font-mono text-gold font-bold uppercase tracking-wider">VERIFIED</span>
        </div>
        <p className="text-sm text-ink/80 mt-1 font-medium">
          {/* Only ever state a count we actually have. This used to fall back to
              a hardcoded 24, so every boutique without a real number claimed one. */}
          {b.city}
          {count ? ` · ${count} ${count === 1 ? "creation" : "creations"}` : ""}
        </p>
      </div>
    </Link>
  );
}
