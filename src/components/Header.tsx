import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, Heart, ShoppingBag, Menu, X, ArrowRight } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { AlgoliaSearchDropdown, AlgoliaMobileSearch } from "@/components/search";
import { UserMenu } from "@/components/auth/UserMenu";
import { CANONICAL_TAXONOMY } from "@/lib/adapters/productAdapter";

export const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { totalItems } = useCart();
  const { items: wishlistItems } = useWishlist();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/collections?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const currentCategory = new URLSearchParams(location.search).get("category") || "";

  const navLinks = [
    { label: "New in", path: "/collections?sort=new" },
    ...CANONICAL_TAXONOMY.map((cat) => ({
      label: cat,
      path: `/collections?category=${encodeURIComponent(cat)}`,
    })),
    { label: "Made to order", path: "/collections?availability=order" },
    { label: "Ateliers", path: "/designers" },
    { label: "Sale", path: "/collections?price=under12", isSale: true },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-paper border-b border-line shadow-sm">
      {/* 1. Promo Strip (.promo) */}
      <div className="bg-wash text-grey-soft border-b border-line flex items-center justify-center gap-6 sm:gap-11 py-2 px-3 text-[11px] font-normal tracking-wide overflow-hidden whitespace-nowrap">
        <span>Free direct studio delivery over ₹2,500</span>
        <span className="hidden sm:inline">·</span>
        <span>Talk to a designer before you order</span>
        <span className="hidden md:inline">·</span>
        <span className="hidden md:inline">Concierge alteration assistance on studio pieces</span>
      </div>

      {/* 2. Main Header Bar (.hd) */}
      <div className="max-w-[1320px] mx-auto px-4 sm:px-8 py-3.5 flex items-center gap-4 sm:gap-6 justify-between">
        <div className="flex items-center gap-3">
          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-1.5 text-ink hover:text-rose transition"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* OGURA Brand Logo (.wm) */}
          <Link to="/" className="flex items-center gap-2" aria-label="OGURA Home">
            <span className="font-sans font-extrabold text-2xl tracking-[-0.04em] text-rose">
              OGURA
            </span>
          </Link>
        </div>

        {/* Central Search Bar (.search) */}
        <div className="hidden md:flex flex-1 max-w-xl mx-4">
          <form
            onSubmit={handleSearchSubmit}
            className="w-full flex items-center gap-2.5 bg-white border border-line rounded-sm py-2 px-3.5 text-xs text-grey-muted focus-within:border-ink transition"
          >
            <Search className="h-3.5 w-3.5 text-grey-muted shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 311 original pieces from 40 creator studios"
              className="w-full bg-transparent text-ink placeholder:text-grey-muted text-xs focus:outline-none"
            />
            <button
              type="submit"
              className="text-xs font-semibold text-ink hover:text-rose transition shrink-0 ml-auto border-l border-line pl-2.5"
            >
              Search
            </button>
          </form>
        </div>

        {/* Right Utility Bar (.util) */}
        <div className="flex items-center gap-4 sm:gap-6 text-xs font-medium text-grey-soft">
          <Link
            to="/how-it-works"
            className="hidden sm:inline-block hover:text-ink transition"
          >
            Help
          </Link>

          <a
            href="/seller-login"
            className="hidden lg:inline-block text-grey-soft hover:text-rose transition"
          >
            Sell on Ogura
          </a>

          {/* Saved / Wishlist */}
          <Link
            to="/wishlist"
            className="flex items-center gap-1.5 hover:text-ink transition"
          >
            <Heart className="h-4 w-4" />
            <span className="hidden sm:inline">Saved</span>
            {wishlistItems.length > 0 && (
              <span className="text-[11px] font-semibold text-rose">
                ({wishlistItems.length})
              </span>
            )}
          </Link>

          {/* User Account */}
          <UserMenu isScrolled={true} />

          {/* Shopping Bag (.bg) */}
          <Link
            to="/cart"
            className="flex items-center gap-1.5 text-rose font-semibold hover:opacity-85 transition"
          >
            <ShoppingBag className="h-4 w-4 text-rose" />
            <span>Bag ({totalItems})</span>
          </Link>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="md:hidden px-4 pb-3">
        <form
          onSubmit={handleSearchSubmit}
          className="w-full flex items-center gap-2 bg-white border border-line rounded-sm py-2 px-3 text-xs text-grey-muted"
        >
          <Search className="h-3.5 w-3.5 text-grey-muted shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search 311 pieces from 40 studios..."
            className="w-full bg-transparent text-ink placeholder:text-grey-muted text-xs focus:outline-none"
          />
          <button type="submit" className="text-xs font-bold text-ink">
            Go
          </button>
        </form>
      </div>

      {/* 3. Sticky Main Navigation Rail (.mainnav) */}
      <nav className="bg-paper border-t border-line overflow-x-auto scrollbar-none flex items-center px-4 sm:px-8 text-xs font-medium tracking-wide">
        {navLinks.map((item, idx) => {
          const isActive =
            item.label === "New in"
              ? location.search.includes("sort=new")
              : currentCategory.toLowerCase() === item.label.toLowerCase();

          return (
            <Link
              key={idx}
              to={item.path}
              className={`shrink-0 py-3 px-3.5 sm:px-4 transition border-b-2 ${
                item.isSale
                  ? "text-sale-crimson font-semibold hover:text-rose border-transparent"
                  : isActive
                  ? "text-ink font-bold border-rose"
                  : "text-grey-soft hover:text-ink border-transparent"
              } ${idx === 0 ? "pl-0 sm:pl-0" : ""}`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-paper border-t border-line px-5 py-4 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="border-b border-line pb-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-rose mb-2">
              Browse Categories
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {CANONICAL_TAXONOMY.map((cat) => (
                <Link
                  key={cat}
                  to={`/collections?category=${encodeURIComponent(cat)}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-1 text-grey-soft hover:text-rose transition"
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2.5 text-xs text-grey-soft font-medium">
            <Link
              to="/designers"
              onClick={() => setIsMobileMenuOpen(false)}
              className="hover:text-ink transition flex items-center justify-between"
            >
              <span>Explore Independent Ateliers</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              to="/how-it-works"
              onClick={() => setIsMobileMenuOpen(false)}
              className="hover:text-ink transition flex items-center justify-between"
            >
              <span>How OGURA Works</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <a
              href="/seller-login"
              className="text-rose font-semibold hover:underline flex items-center justify-between pt-2 border-t border-line"
            >
              <span>Seller Login & Atelier Portal</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
