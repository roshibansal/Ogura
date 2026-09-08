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
    <header className="sticky top-0 z-50 w-full bg-white border-b border-[#EAE3D9] shadow-[0_2px_12px_rgba(226,209,163,0.15)]">
      {/* 1. Top Announcement Bar - Clean on both mobile & desktop */}
      <div className="bg-[#FAFAFA] text-[#5A0A26] border-b border-[#EAE3D9]/60 flex items-center justify-center gap-3 sm:gap-8 py-1.5 px-3 text-[11px] sm:text-xs md:text-sm font-bold tracking-wide text-center">
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
            className="md:hidden p-1.5 text-[#5A0A26] hover:text-[#5A0A26] transition rounded-sm"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* OGURA Brand Logo - pure clean logo without marketplace */}
          <Link to="/" className="flex items-baseline group" aria-label="OGURA Home">
            <span className="font-serif font-bold text-2xl sm:text-4xl tracking-tight text-[#5A0A26] group-hover:text-[#5A0A26] transition">
              OGURA
            </span>
          </Link>
        </div>

        {/* Central Search Bar */}
        <div className="hidden md:flex flex-1 max-w-xl mx-4">
          <form
            onSubmit={handleSearchSubmit}
            className="w-full flex items-center gap-3 bg-white border border-[#EAE3D9] rounded-sm py-2 px-4 text-sm text-[#5A0A26] focus-within:border-[#5A0A26] focus-within:ring-2 focus-within:ring-[#5A0A26]/20 transition shadow-sm"
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
              className="text-sm font-bold text-[#5A0A26] hover:text-[#5A0A26] transition shrink-0 ml-auto border-l border-[#EAE3D9] pl-3"
            >
              Search
            </button>
          </form>
        </div>

        {/* Right Utility Bar */}
        <div className="flex items-center gap-2 sm:gap-3.5 text-sm font-semibold text-[#5A0A26]">

          {/* Saved / Wishlist */}
          <Link
            to="/wishlist"
            className="flex items-center gap-1.5 hover:text-[#5A0A26] transition text-sm font-semibold"
          >
            <Heart className="h-5 w-5" />
            <span className="hidden sm:inline">Saved</span>
            {wishlistItems.length > 0 && (
              <span className="text-xs font-bold text-[#5A0A26] bg-neutral-100 border border-[#EAE3D9] px-1.5 py-0.2 rounded-full">
                {wishlistItems.length}
              </span>
            )}
          </Link>

          {/* User Account */}
          <UserMenu isScrolled={true} />

          {/* Shopping Bag */}
          <Link
            to="/cart"
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-sm bg-[#2B0F1E] text-white hover:bg-[#3D1A2A] transition shadow-xs shrink-0"
          >
            <ShoppingBag className="h-4 w-4 text-white" />
            <span className="font-extrabold text-xs sm:text-sm">
              Bag <span className="text-gold">({totalItems})</span>
            </span>
          </Link>
        </div>
      </div>

      {/* 3. Category navigation — one taxonomy: what the garment IS.
             Occasion, price and availability are filters, not categories. */}
      <nav className="border-t border-[#EAE3D9]/60 bg-white">
        <div className="max-w-[1360px] mx-auto flex items-center gap-6 overflow-x-auto px-3 sm:px-8 py-2.5 scrollbar-none">
          {[
            { label: "New In", to: "/collections?sort=newest" },
            { label: "Kurta Sets", to: "/collections/indian-coords" },
            { label: "Tops", to: "/collections/tops" },
            { label: "Lehengas", to: "/collections/lehengas" },
            { label: "Sarees", to: "/collections/sarees" },
            { label: "Indo-Western", to: "/collections/indo-western" },
            { label: "Dresses", to: "/collections/dresses" },
            { label: "Co-ord Sets", to: "/collections/western-coords" },
            { label: "Bottoms", to: "/collections/bottoms" },
            { label: "Jumpsuits", to: "/collections/jumpsuits" },
            { label: "Bags", to: "/collections/bags" },
            { label: "Footwear", to: "/collections/shoes" },
          ].map((c) => (
            <Link
              key={c.label}
              to={c.to}
              className="shrink-0 whitespace-nowrap text-[13px] font-semibold text-[#5A0A26]/85 hover:text-[#5A0A26] transition border-b-2 border-transparent hover:border-[#5A0A26] pb-0.5"
            >
              {c.label}
            </Link>
          ))}

          <span className="shrink-0 h-4 w-px bg-[#EAE3D9]" aria-hidden />

          <Link
            to="/collections?availability=made-to-order"
            className="shrink-0 whitespace-nowrap text-[13px] font-bold text-[#5A0A26] hover:underline underline-offset-4"
          >
            Made to Order
          </Link>
          <Link
            to="/designers"
            className="shrink-0 whitespace-nowrap text-[13px] font-bold text-[#5A0A26] hover:text-[#5A0A26] transition"
          >
            Ateliers
          </Link>
        </div>
      </nav>

      {/* Mobile Search Bar */}
      <div className="md:hidden px-4 pb-3">
        <form
          onSubmit={handleSearchSubmit}
          className="w-full flex items-center gap-2 bg-white border border-[#EAE3D9] rounded-sm py-2 px-3 text-sm text-[#5A0A26]"
        >
          <Search className="h-4 w-4 text-[#5A0A26]/50 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search clothes, sarees, lehengas..."
            className="w-full bg-transparent text-[#5A0A26] placeholder:text-[#5A0A26]/50 text-sm focus:outline-none"
          />
          <button type="submit" className="text-xs font-bold text-[#5A0A26] bg-neutral-100 border border-[#EAE3D9] px-2.5 py-1 rounded-xs">
            Go
          </button>
        </form>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-[#EAE3D9] px-5 py-4 space-y-3 max-h-[75vh] overflow-y-auto shadow-md">
          <p className="text-xs font-black uppercase tracking-wider text-[#5A0A26] mb-2">
            Menu
          </p>
          <div className="flex flex-col gap-2 text-sm font-bold text-[#5A0A26]">
            <Link
              to="/marketplace"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-2.5 px-3 rounded-sm bg-neutral-50 hover:bg-neutral-100 transition flex items-center justify-between border border-[#EAE3D9]/60 font-black"
            >
              <span>Marketplace</span>
              <span className="text-xs font-semibold text-[#5A0A26]/70">Explore all styles →</span>
            </Link>
            <Link
              to="/marketplace?price=under2k"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-2 px-3 rounded-sm hover:bg-neutral-50 transition flex items-center gap-2 border border-[#EAE3D9]/60"
            >
              <span className="px-1.5 py-0.2 bg-[#5A0A26] text-white font-black rounded-xs text-xs">%</span>
              <span>Sale Deals (Under ₹2,000)</span>
            </Link>
            <Link
              to="/wishlist"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-2 px-3 rounded-sm hover:bg-neutral-50 transition flex items-center gap-2 border border-[#EAE3D9]/60"
            >
              <Heart className="h-4 w-4" />
              <span>Saved Pieces ({wishlistItems.length})</span>
            </Link>
          </div>

          <div className="pt-3 border-t border-[#EAE3D9] flex flex-col gap-2 text-sm font-bold text-[#5A0A26]">
          </div>
        </div>
      )}
    </header>
  );
};
