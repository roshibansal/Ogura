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

  const navLinks = [
    { label: "Marketplace", path: "/collections" },
    { label: "Lehengas", path: "/collections?category=lehengas" },
    { label: "Sarees", path: "/collections?category=sarees" },
    { label: "Western Dresses", path: "/collections?category=dresses" },
    { label: "Bags", path: "/collections?category=bags" },
    { label: "Shoes", path: "/collections?category=shoes" },
    { label: "Made on Order", path: "/collections?availability=order" },
    { label: "Under ₹12,000", path: "/collections?price=under12" },
    { label: "Our Shops", path: "/designers" },
    { label: "How It Works", path: "/how-it-works" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-[#f8d2f9] border-b border-[#fcb8fd] shadow-[0_2px_12px_rgba(252,184,253,0.3)]">
      {/* 1. Top Announcement Bar - Simple Plain English */}
      <div className="bg-[#fcb8fd]/60 text-[#5A0A26] border-b border-[#fcb8fd] flex items-center justify-center gap-4 sm:gap-8 py-2 px-3 text-xs sm:text-sm font-bold tracking-wide overflow-hidden whitespace-nowrap">
        <span>Free delivery on orders over ₹2,500</span>
        <span className="hidden sm:inline text-[#5A0A26]/30">|</span>
        <span>Talk to the shop before you order</span>
        <span className="hidden md:inline text-[#5A0A26]/30">|</span>
        <span className="hidden md:inline">7-Day Free Size Help & Returns</span>
      </div>

      {/* 2. Main Header Bar */}
      <div className="max-w-[1360px] mx-auto px-4 sm:px-8 py-3.5 flex items-center gap-4 sm:gap-6 justify-between">
        <div className="flex items-center gap-3">
          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-[#5A0A26] hover:text-[#B38F24] transition"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          {/* OGURA Brand Logo */}
          <Link to="/" className="flex items-baseline gap-2 group" aria-label="OGURA Home">
            <span className="font-serif font-bold text-3xl sm:text-4xl tracking-tight text-[#5A0A26] group-hover:text-[#B38F24] transition">
              OGURA
            </span>
            <span className="hidden sm:inline-block text-[10px] uppercase tracking-[0.2em] px-2 py-0.5 rounded-xs bg-white text-[#5A0A26] border border-[#E2D1A3] font-black">
              Marketplace
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
        <div className="flex items-center gap-3 sm:gap-5 text-sm font-semibold text-[#5A0A26]">
          <Link
            to="/how-it-works"
            className="hidden sm:inline-block hover:text-[#B38F24] transition text-sm font-bold"
          >
            Help & Delivery
          </Link>

          <a
            href="/seller-login"
            className="hidden lg:inline-flex items-center gap-1 px-3 py-1.5 rounded-sm bg-white border border-[#E2D1A3] text-[#5A0A26] hover:border-[#B38F24] hover:text-[#B38F24] font-bold transition shadow-xs text-sm"
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
              <span className="text-xs font-bold text-[#5A0A26] bg-[#fcb8fd] px-1.5 py-0.2 rounded-full">
                {wishlistItems.length}
              </span>
            )}
          </Link>

          {/* User Account */}
          <UserMenu isScrolled={true} />

          {/* Shopping Bag */}
          <Link
            to="/cart"
            className="flex items-center gap-2 px-4 py-2 rounded-sm bg-[#0F1111] text-white hover:bg-[#232F3E] transition shadow-xs"
          >
            <ShoppingBag className="h-4 w-4 text-[#FFA41C]" />
            <span className="font-extrabold text-sm">
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
          <button type="submit" className="text-xs font-bold text-[#5A0A26] bg-[#fcb8fd] px-2.5 py-1 rounded-xs">
            Go
          </button>
        </form>
      </div>

      {/* 3. Clean, Well-Placed Navigation Rail (No Dropdown) */}
      <nav className="bg-[#f8d2f9] border-t border-[#fcb8fd] px-4 sm:px-8 text-sm font-semibold tracking-wide">
        <div className="max-w-[1360px] mx-auto flex items-center justify-between gap-2 overflow-x-auto scrollbar-none py-2">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {navLinks.map((link) => {
              const isActive =
                link.path === "/collections"
                  ? location.pathname === "/collections" && !location.search
                  : `${location.pathname}${location.search}` === link.path;

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`shrink-0 py-1.5 px-3 sm:px-3.5 rounded-sm text-xs sm:text-sm font-bold transition-all border ${
                    isActive
                      ? "bg-white text-[#5A0A26] border-[#E2D1A3] shadow-xs"
                      : "bg-transparent text-[#5A0A26]/85 hover:bg-white/70 hover:text-[#5A0A26] border-transparent"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Sale Highlight Badge on the Right */}
          <Link
            to="/collections?price=under12"
            className="shrink-0 py-1.5 px-3 text-[#5A0A26] font-extrabold transition rounded-sm text-xs sm:text-sm flex items-center gap-1.5 bg-white border border-[#E2D1A3] hover:border-[#FFA41C] shadow-2xs"
          >
            <span className="inline-block px-1.5 py-0.2 rounded-xs bg-[#FFA41C] text-[#0F1111] text-xs font-black">
              %
            </span>
            <span>Sale Deals</span>
          </Link>
        </div>
      </nav>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#f8d2f9] border-t border-[#fcb8fd] px-5 py-4 space-y-3 max-h-[75vh] overflow-y-auto">
          <p className="text-xs font-black uppercase tracking-wider text-[#5A0A26] mb-2">
            Categories
          </p>
          <div className="flex flex-col gap-2 text-sm font-bold text-[#5A0A26]">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-1.5 px-2 rounded-xs hover:bg-white transition"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="pt-3 border-t border-[#fcb8fd] flex flex-col gap-2 text-sm font-bold text-[#5A0A26]">
            <Link
              to="/how-it-works"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-1.5 px-2 hover:bg-white transition"
            >
              How It Works & Delivery Help
            </Link>
            <a
              href="/seller-login"
              className="py-1.5 px-2 text-[#9F1239] font-black hover:bg-white transition"
            >
              Sell on Ogura
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
