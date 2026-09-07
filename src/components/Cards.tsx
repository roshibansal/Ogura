import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
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
}: {
  product?: Product;
  design?: DesignVM;
  priority?: boolean;
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
      description: `${d.title} (${size}) added directly to your bag.`,
    });
  };

  const discountPercent =
    d.originalPrice && d.originalPrice > d.price
      ? Math.round((1 - d.price / d.originalPrice) * 100)
      : null;

  return (
    <article className="group relative flex flex-col text-ink cursor-pointer">
      {/* Product Image Wrapper (.pw) with Dual Image Hover */}
      <div className="relative aspect-[3/4] overflow-hidden bg-stone rounded-sm">
        <Link to={`/product/${d.slug}`} className="block h-full w-full">
          {/* Main Image */}
          <img
            src={d.image}
            alt={d.title}
            loading={priority ? "eager" : "lazy"}
            className="h-full w-full object-cover transition-all duration-700 ease-[cubic-bezier(0.16,0.8,0.28,1)] group-hover:opacity-0"
          />

          {/* Alternate Image on Hover */}
          <img
            src={d.altImage || d.image}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover opacity-0 transition-all duration-700 ease-[cubic-bezier(0.16,0.8,0.28,1)] group-hover:opacity-100 group-hover:scale-105"
          />
        </Link>

        {/* Top Left: Discount Badge */}
        {discountPercent && discountPercent > 0 && (
          <span className="absolute left-2.5 top-2.5 z-10 rounded-sm bg-white/95 px-2 py-0.5 text-[11px] font-semibold tracking-tight text-sale-crimson shadow-sm">
            Save {discountPercent}%
          </span>
        )}

        {/* Top Right: Heart Wishlist Button */}
        {d.rawProduct && (
          <button
            type="button"
            onClick={handleWishlistToggle}
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            className="absolute right-2.5 top-2.5 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-ink shadow-sm transition hover:scale-110"
          >
            <Heart
              className={`h-3.5 w-3.5 transition ${
                wishlisted ? "fill-rose text-rose" : "text-ink hover:text-rose"
              }`}
            />
          </button>
        )}

        {/* Bottom Left: Stock Status Badge (.stk) */}
        <div className="absolute bottom-2.5 left-2.5 z-10">
          <span
            className={`rounded-sm bg-white/95 px-2 py-0.5 text-[10px] font-medium tracking-tight shadow-sm ${
              d.readyStock ? "text-green-atelier" : "text-grey-soft"
            }`}
          >
            {d.readyStock ? "In studio" : "Made on order"}
          </span>
        </div>

        {/* Hover Quick Size Selector (.quick) */}
        <div className="absolute inset-x-2.5 bottom-2.5 z-20 hidden sm:flex items-center justify-center gap-1.5 rounded-sm bg-white/97 py-2 px-1 text-[11px] font-medium text-ink shadow-md opacity-0 translate-y-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0">
          {(d.sizes.length > 0 ? d.sizes : ["XS", "S", "M", "L"]).slice(0, 4).map((sz) => (
            <button
              key={sz}
              type="button"
              onClick={(e) => handleQuickAdd(e, sz)}
              className="rounded px-1.5 py-0.5 text-grey-soft hover:bg-wash hover:text-ink transition font-semibold"
            >
              {sz}
            </button>
          ))}
          <button
            type="button"
            onClick={(e) => handleQuickAdd(e, "+ custom")}
            className="text-[10px] font-bold text-grey-muted hover:text-rose transition ml-1"
          >
            + custom
          </button>
        </div>
      </div>

      {/* Product Details (.pb) */}
      <div className="pt-2.5 pb-1 flex flex-col justify-between flex-1">
        <div>
          {/* Atelier Attribution */}
          <Link to={`/collections?atelier=${encodeURIComponent(d.boutique)}`} className="block">
            <p className="text-[11px] font-medium uppercase tracking-[0.09em] text-grey-muted hover:text-rose transition line-clamp-1">
              {d.boutique} · {d.city}
            </p>
          </Link>

          {/* Product Title in Instrument Serif italic */}
          <Link to={`/product/${d.slug}`} className="block mt-1">
            <h3 className="font-serif italic font-normal text-[1.18rem] text-ink leading-tight transition group-hover:text-rose line-clamp-1">
              {d.title}
            </h3>
            {d.subtitle && (
              <p className="text-xs text-grey-soft mt-0.5 line-clamp-1 font-normal">
                {d.subtitle}
              </p>
            )}
          </Link>

          {/* Price Line (.pp) */}
          <div className="mt-1.5 flex items-baseline gap-2 text-sm font-semibold text-ink">
            <span>{formatINR(d.price)}</span>
            {d.originalPrice && d.originalPrice > d.price && (
              <>
                <span className="text-xs text-grey-muted line-through font-normal">
                  {formatINR(d.originalPrice)}
                </span>
                <span className="text-xs font-semibold text-sale-crimson">
                  −{discountPercent}%
                </span>
              </>
            )}
          </div>

          {/* Rating & Response Line (.rt) */}
          <p className="mt-1 text-[11px] text-grey-soft flex items-center gap-1">
            <span className="text-rose font-bold">★</span>
            <span className="font-semibold text-ink">{d.rating.toFixed(1)}</span>
            <span className="text-grey-muted">({d.reviewCount})</span>
            <span className="text-grey-muted">· replies in ~{d.replyTime}</span>
          </p>

          {/* Color Swatch Dots (.sws) */}
          <div className="flex items-center gap-1 mt-2">
            {(d.colours && d.colours.length > 0 ? d.colours : ["Studio Original"]).slice(0, 4).map((c, i) => {
              const bgColors = ["#8d3350", "#2C4638", "#DFC48A", "#3B4C7A", "#1B1714"];
              return (
                <span
                  key={i}
                  className="h-2.5 w-2.5 rounded-full ring-1 ring-line/80"
                  style={{ backgroundColor: bgColors[i % bgColors.length] }}
                />
              );
            })}
          </div>

          {/* Talk to Atelier Link (.talk) */}
          <a
            href={`https://wa.me/917742698970?text=${encodeURIComponent(
              `Hi OGURA! I am looking at ${d.title} by ${d.boutique} (₹${d.price}) and would like to ask a question.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="mt-2.5 inline-block text-[11px] font-medium text-ink border-b border-line pb-0.5 transition hover:border-rose hover:text-rose"
          >
            Talk to Ogura&apos;s designer →
          </a>
        </div>
      </div>
    </article>
  );
}

export function BoutiqueCard({ b, count }: { b: BoutiqueVM; count?: number }) {
  return (
    <Link to={`/designers/${b.slug}`} className="group block text-ink">
      <div className="overflow-hidden rounded-sm aspect-[5/4] bg-stone">
        <img
          src={b.image}
          alt={`${b.name}, ${b.city}`}
          className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,0.8,0.28,1)] group-hover:scale-105"
        />
      </div>
      <div className="mt-2.5">
        <h3 className="font-serif italic text-lg font-normal transition group-hover:text-rose leading-snug">
          {b.name}
        </h3>
        <p className="text-xs text-grey-soft mt-0.5 font-medium">
          {b.city} · {count || 24} creations
        </p>
        <p className="mt-1 text-xs text-grey-soft flex items-center gap-1">
          <span className="text-rose font-bold">★</span>
          <span className="font-semibold text-ink">4.8</span>
          <span className="text-grey-muted">(96)</span>
        </p>
      </div>
    </Link>
  );
}
