import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, Heart, ShoppingBag, Menu, X } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { UserMenu } from "@/components/auth/UserMenu";

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


  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-[#E2D1A3] shadow-[0_2px_12px_rgba(226,209,163,0.15)]">
      {/* 1. Top Announcement Bar - Clean on both mobile & desktop */}
      <div className="bg-[#FAFAFA] text-[#5A0A26] border-b border-[#E2D1A3]/60 flex items-center justify-center gap-3 sm:gap-8 py-1.5 px-3 text-[11px] sm:text-xs md:text-sm font-bold tracking-wide text-center">
        <span>Free delivery on orders over ₹2,500</span>
        <span className="hidden sm:inline text-[#5A0A26]/30">|</span>
        <span className="hidden sm:inline">Talk to the shop before you order</span>
        <span className="hidden md:inline text-[#5A0A26]/30">|</span>
        <span className="hidden md:inline">7-Day Free Size Help & Returns</span>
      </div>

      {/* 2. Main Header Bar */}
      <div className="max-w-[1360px] mx-auto px-3 sm:px-8 py-2.5 sm:py-3.5 flex items-center gap-3 sm:gap-6 justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-1.5 text-[#5A0A26] hover:text-[#B38F24] transition rounded-sm"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* OGURA Brand Logo - pure clean logo without marketplace */}
          <Link to="/" className="flex items-baseline group" aria-label="OGURA Home">
            <span className="font-serif font-bold text-2xl sm:text-4xl tracking-tight text-[#5A0A26] group-hover:text-[#B38F24] transition">
              OGURA
            </span>
          </Link>
        </div>

        {/* Central Search Bar */}
        <div className="hidden md:flex flex-1 max-w-xl mx-4">
          <form
            onSubmit={handleSearchSubmit}
            className="w-full flex items-center gap-3 bg-white border border-[#E2D1A3] rounded-sm py-2 px-4 text-sm text-[#5A0A26] focus-within:border-[#B38F24] focus-within:ring-2 focus-within:ring-[#B38F24]/20 transition shadow-sm"
          >
            <Search className="h-4 w-4 text-[#5A0A26]/50 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search lehengas, sarees, dresses, bags..."
              className="w-full bg-transparent text-[#5A0A26] placeholder:text-[#5A0A26]/50 text-sm focus:outline-none font-medium"
            />
            <button
              type="submit"
              className="text-sm font-bold text-[#5A0A26] hover:text-[#B38F24] transition shrink-0 ml-auto border-l border-[#E2D1A3] pl-3"
            >
              Search
            </button>
          </form>
        </div>

        {/* Right Utility Bar */}
        <div className="flex items-center gap-2 sm:gap-3.5 text-sm font-semibold text-[#5A0A26]">
          {/* Marketplace Button right beside search bar */}
          <Link
            to="/marketplace"
            className={`inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-sm font-bold transition text-xs sm:text-sm border ${
              location.pathname === "/marketplace" || location.pathname === "/collections"
                ? "bg-[#5A0A26] text-white border-[#5A0A26] shadow-xs"
                : "bg-white text-[#5A0A26] border-[#E2D1A3] hover:border-[#B38F24] hover:text-[#B38F24] shadow-xs"
            }`}
          >
            <span>Marketplace</span>
          </Link>

          {/* Sell on Ogura */}
          <a
            href="/seller-login"
            className="hidden sm:inline-flex items-center gap-1 px-3 sm:px-3.5 py-1.5 rounded-sm bg-white border border-[#E2D1A3] text-[#5A0A26] hover:border-[#B38F24] hover:text-[#B38F24] font-bold transition shadow-xs text-xs sm:text-sm"
          >
            Sell on Ogura
          </a>

          {/* Saved / Wishlist */}
          <Link
            to="/wishlist"
            className="flex items-center gap-1.5 hover:text-[#B38F24] transition text-sm font-semibold"
          >
            <Heart className="h-5 w-5" />
            <span className="hidden sm:inline">Saved</span>
            {wishlistItems.length > 0 && (
              <span className="text-xs font-bold text-[#5A0A26] bg-neutral-100 border border-[#E2D1A3] px-1.5 py-0.2 rounded-full">
                {wishlistItems.length}
              </span>
            )}
          </Link>

          {/* User Account */}
          <UserMenu isScrolled={true} />

          {/* Shopping Bag */}
          <Link
            to="/cart"
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-sm bg-[#0F1111] text-white hover:bg-[#232F3E] transition shadow-xs shrink-0"
          >
            <ShoppingBag className="h-4 w-4 text-[#FFA41C]" />
            <span className="font-extrabold text-xs sm:text-sm">
              Bag <span className="text-[#FFA41C]">({totalItems})</span>
            </span>
          </Link>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="md:hidden px-4 pb-3">
        <form
          onSubmit={handleSearchSubmit}
          className="w-full flex items-center gap-2 bg-white border border-[#E2D1A3] rounded-sm py-2 px-3 text-sm text-[#5A0A26]"
        >
          <Search className="h-4 w-4 text-[#5A0A26]/50 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search clothes, sarees, lehengas..."
            className="w-full bg-transparent text-[#5A0A26] placeholder:text-[#5A0A26]/50 text-sm focus:outline-none"
          />
          <button type="submit" className="text-xs font-bold text-[#5A0A26] bg-neutral-100 border border-[#E2D1A3] px-2.5 py-1 rounded-xs">
            Go
          </button>
        </form>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-[#E2D1A3] px-5 py-4 space-y-3 max-h-[75vh] overflow-y-auto shadow-md">
          <p className="text-xs font-black uppercase tracking-wider text-[#5A0A26] mb-2">
            Menu
          </p>
          <div className="flex flex-col gap-2 text-sm font-bold text-[#5A0A26]">
            <Link
              to="/marketplace"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-2.5 px-3 rounded-sm bg-neutral-50 hover:bg-neutral-100 transition flex items-center justify-between border border-[#E2D1A3]/60 font-black"
            >
              <span>Marketplace</span>
              <span className="text-xs font-semibold text-[#5A0A26]/70">Explore all styles →</span>
            </Link>
            <Link
              to="/marketplace?price=under3k"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-2 px-3 rounded-sm hover:bg-neutral-50 transition flex items-center gap-2 border border-[#E2D1A3]/60"
            >
              <span className="px-1.5 py-0.2 bg-[#FFA41C] text-[#0F1111] font-black rounded-xs text-xs">%</span>
              <span>Sale Deals (Under ₹3,000)</span>
            </Link>
            <Link
              to="/wishlist"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-2 px-3 rounded-sm hover:bg-neutral-50 transition flex items-center gap-2 border border-[#E2D1A3]/60"
            >
              <Heart className="h-4 w-4" />
              <span>Saved Pieces ({wishlistItems.length})</span>
            </Link>
          </div>

          <div className="pt-3 border-t border-[#E2D1A3] flex flex-col gap-2 text-sm font-bold text-[#5A0A26]">
            <a
              href="/seller-login"
              className="py-2.5 px-3 text-[#9F1239] font-black hover:bg-neutral-50 transition rounded-sm border border-[#E2D1A3] text-center"
            >
              Sell on Ogura
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
