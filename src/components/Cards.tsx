import React from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { Media } from "./Media";
import { CallRequest } from "./CallRequest";
import { DesignVM, transformProductToDesignStrict } from "@/lib/adapters/productAdapter";
import { BoutiqueVM } from "@/lib/adapters/boutiqueAdapter";
import { Product } from "@/types";
import { useWishlist } from "@/contexts/WishlistContext";

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
  const { isInWishlist, addItem, removeItem } = useWishlist();
  const wishlisted = d.rawProduct ? isInWishlist(d.rawProduct.id) : false;

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!d.rawProduct) return;
    if (wishlisted) {
      removeItem(d.rawProduct.id);
    } else {
      addItem(d.rawProduct);
    }
  };

  return (
    <article className="group flex flex-col text-ink">
      <div className="relative">
        <Link to={`/product/${d.slug}`} className="block">
          <Media
            src={d.image}
            alt={d.title}
            palette={d.palette}
            priority={priority}
            badge={d.readyStock ? "In studio" : undefined}
          />
        </Link>
        {d.rawProduct && (
          <button
            type="button"
            onClick={handleWishlistToggle}
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-ivory/80 text-ink backdrop-blur-sm transition hover:bg-ivory hover:text-clay"
          >
            <Heart
              className={`h-4 w-4 ${wishlisted ? "fill-clay text-clay" : "text-ink"}`}
            />
          </button>
        )}
      </div>

      <div className="mt-3 flex flex-1 flex-col justify-between">
        <div>
          <Link to={`/product/${d.slug}`} className="block">
            <h3 className="font-display text-base sm:text-lg leading-snug transition group-hover:text-clay font-normal">
              {d.title}
            </h3>
            {d.subtitle && (
              <p className="mt-0.5 text-xs text-ink-soft line-clamp-1">{d.subtitle}</p>
            )}
            <div className="mt-1.5 flex items-center gap-2 text-sm font-medium">
              <span>{formatINR(d.price)}</span>
              {d.originalPrice && d.originalPrice > d.price && (
                <span className="text-xs text-ink-soft line-through">
                  {formatINR(d.originalPrice)}
                </span>
              )}
            </div>
            <p className="mt-1 text-[11px] text-ink-soft">
              {d.readyStock ? (
                <>
                  <span className="font-medium text-forest">Studio Stock</span>
                  <span> · Ships in {d.shipsInDays} days</span>
                </>
              ) : (
                <span>Made to order · {d.leadTimeDays} days</span>
              )}
            </p>
          </Link>

          <p className="mt-2 text-xs font-semibold text-ink-soft">
            Atelier: <span className="text-ink font-medium">{d.boutique}</span>
          </p>
        </div>

        <div className="mt-3">
          <CallRequest
            boutique={d.boutique}
            owner="Atelier Designer"
            design={d.title}
            variant="mini"
            label="Call Atelier"
          />
        </div>
      </div>
    </article>
  );
}

export function BoutiqueCard({ b, count }: { b: BoutiqueVM; count?: number }) {
  return (
    <Link to={`/designers/${b.slug}`} className="group block text-ink">
      <Media
        src={b.image}
        alt={`${b.name}, ${b.city}`}
        palette={b.palette}
        ratio="aspect-[4/3]"
      />
      <div className="mt-3">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-display text-lg font-normal transition group-hover:text-clay">
            {b.name}
          </h3>
          <span className="shrink-0 text-xs text-ink-soft">
            {b.city}
          </span>
        </div>
        <p className="mt-1 line-clamp-2 text-xs text-ink-soft leading-relaxed">
          {b.blurb}
        </p>
        <p className="mt-2 text-[11px] text-ink-soft font-medium">
          {count ? `${count} designs · ` : ""}
          <span className="text-clay">{b.specialty}</span>
          {b.priceBandText ? ` · ${b.priceBandText}` : ""}
        </p>
      </div>
    </Link>
  );
}
