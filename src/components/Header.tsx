import React, { useState, useEffect } from "react";
import { ShoppingBag, Menu, X, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, Link, useLocation as useRouterLocation } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { HeaderLocationIndicator } from "@/components/HeaderLocationIndicator";
import { AlgoliaSearchDropdown, AlgoliaMobileSearch } from "@/components/search";
import { UserMenu } from "@/components/auth/UserMenu";
import { cn } from "@/lib/utils";

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const routerLocation = useRouterLocation();
  const isHomepage = routerLocation.pathname === "/";

  const { totalItems: cartCount } = useCart();
  const { items: wishlistItems } = useWishlist();
  const wishlistCount = wishlistItems?.length || 0;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  // Close drawer on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Desktop navigation items (exact requirement: SHOP, BRANDS, DESIGNERS, OCCASIONS, MADE TO ORDER)
  const navItems = [
    { label: "SHOP", href: "/collections" },
    { label: "BRANDS", href: "/brands" },
    { label: "DESIGNERS", href: "/designers" },
    { label: "OCCASIONS", href: "/occasions" },
    { label: "MADE TO ORDER", href: "/category/made-to-order" },
  ];

  // Scrolled state vs initial transparent state
  const isSolid = !isHomepage || isScrolled;

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 w-full transition-colors duration-300 font-functional",
        isSolid
          ? "bg-[#09090BF2] backdrop-blur-md border-b border-[#202024]"
          : "bg-transparent border-b border-transparent"
      )}
    >
      {/* Top micro bar for location and concierge on desktop */}
      <div
        className={cn(
          "hidden lg:block border-b transition-colors duration-300 text-xs",
          isSolid
            ? "border-[#202024] bg-[#05050680] text-[#B7B0B3]"
            : "border-white/10 bg-black/20 text-[#B7B0B3]"
        )}
      >
        <div className="max-w-[1440px] mx-auto px-6 xl:px-16">
          <div className="flex h-7 items-center justify-between">
            <div className="flex items-center text-[#B7B0B3] hover:text-[#F7F3F1] transition">
              <HeaderLocationIndicator variant="compact" className="text-[#B7B0B3] hover:text-[#F7F3F1] hover:bg-transparent" />
            </div>
            <div className="flex items-center gap-5 text-[11px] uppercase tracking-[0.14em]">
              <Link to="/how-it-works" className="hover:text-[#E72D63] transition">
                Atelier Concierge
              </Link>
              <span className="text-[#3A383E]">|</span>
              <a href="/seller-login" className="hover:text-[#E72D63] transition">
                For Boutiques & Designers
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header Container (72-80px on desktop) */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 xl:px-16">
        <div className="hidden lg:flex h-[76px] items-center justify-between gap-6">
          {/* Brand Wordmark / Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 text-[#F7F3F1] shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#E72D63]"
            aria-label="OGURA Homepage"
          >
            <span className="font-editorial text-3xl sm:text-4xl font-normal tracking-[-0.03em] uppercase text-[#F7F3F1]">
              OGURA
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="flex items-center gap-7 text-[13px] uppercase tracking-[0.12em] font-medium text-[#F7F3F1]">
            {navItems.map((item) => {
              const isActive = routerLocation.pathname === item.href;
              return (
                <Link
                  key={item.label}
                  to={item.href}
                  className={cn(
                    "relative py-1 transition-colors hover:text-[#E72D63] focus-visible:outline-none focus-visible:text-[#E72D63]",
                    isActive ? "text-[#E72D63]" : "text-[#F7F3F1]"
                  )}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute -bottom-1 left-0 right-0 h-[2px] bg-[#E72D63]" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Search + Actions */}
          <div className="flex items-center gap-4">
            {/* Prominent Desktop Search (360-420px wide, 48px height) */}
            <div className="w-[360px] xl:w-[400px]">
              <AlgoliaSearchDropdown
                isScrolled={true}
                placeholder="Search products, designers & looks"
                className="w-full"
                inputClassName="h-12 bg-[#111114CC] border-[#48454C] text-[#F7F3F1] placeholder:text-[#817B7E] rounded-[4px] focus-visible:border-[#E72D63] focus-visible:ring-1 focus-visible:ring-[#E72D63] text-sm"
              />
            </div>

            {/* Wishlist Button */}
            <Link
              to="/wishlist"
              className="relative p-2 text-[#F7F3F1] hover:text-[#E72D63] transition min-w-[44px] min-h-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#E72D63] rounded-[3px]"
              aria-label={`Wishlist with ${wishlistCount} items`}
            >
              <Heart className="h-5 w-5" />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 h-4 min-w-[16px] px-1 rounded-full bg-[#E72D63] text-[10px] font-semibold text-[#F7F3F1] flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart / Bag Button */}
            <button
              onClick={() => navigate("/cart")}
              className="relative p-2 text-[#F7F3F1] hover:text-[#E72D63] transition min-w-[44px] min-h-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#E72D63] rounded-[3px]"
              aria-label={`Shopping bag with ${cartCount} items`}
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 h-4 min-w-[16px] px-1 rounded-full bg-[#E72D63] text-[10px] font-semibold text-[#F7F3F1] flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            {/* User Menu */}
            <div className="flex items-center min-w-[44px] min-h-[44px] justify-center">
              <UserMenu isScrolled={true} />
            </div>
          </div>
        </div>

        {/* Mobile Header (2 Rows) */}
        <div className="lg:hidden">
          {/* Row 1: Menu icon, Centered Logo, Wishlist, Bag (56-64px) */}
          <div className="flex h-14 items-center justify-between">
            <button
              onClick={() => setIsMenuOpen(true)}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#F7F3F1] hover:text-[#E72D63] transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#E72D63]"
              aria-label="Open navigation menu"
            >
              <Menu className="h-6 w-6" />
            </button>

            <Link to="/" className="flex items-center" aria-label="OGURA Homepage">
              <span className="font-editorial text-2xl tracking-tight uppercase text-[#F7F3F1]">
                OGURA
              </span>
            </Link>

            <div className="flex items-center gap-1">
              <Link
                to="/wishlist"
                className="relative min-w-[44px] min-h-[44px] flex items-center justify-center text-[#F7F3F1] hover:text-[#E72D63] transition focus-visible:outline-none"
                aria-label={`Wishlist with ${wishlistCount} items`}
              >
                <Heart className="h-5 w-5" />
                {wishlistCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-3.5 min-w-[14px] px-0.5 rounded-full bg-[#E72D63] text-[9px] font-bold text-[#F7F3F1] flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              <button
                onClick={() => navigate("/cart")}
                className="relative min-w-[44px] min-h-[44px] flex items-center justify-center text-[#F7F3F1] hover:text-[#E72D63] transition focus-visible:outline-none"
                aria-label={`Shopping bag with ${cartCount} items`}
              >
                <ShoppingBag className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-3.5 min-w-[14px] px-0.5 rounded-full bg-[#E72D63] text-[9px] font-bold text-[#F7F3F1] flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Row 2: Full-width search (44-48px) */}
          <div className="pb-3 pt-1">
            <AlgoliaMobileSearch />
          </div>
        </div>
      </div>

      {/* Mobile Drawer (with backdrop and focus trapping) */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Mobile Navigation">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="fixed inset-y-0 left-0 w-[300px] sm:w-[340px] bg-[#111114] border-r border-[#202024] p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-left duration-300">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-6 border-b border-[#202024]">
                <Link
                  to="/"
                  onClick={() => setIsMenuOpen(false)}
                  className="font-editorial text-2xl tracking-tight uppercase text-[#F7F3F1]"
                >
                  OGURA
                </Link>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#B7B0B3] hover:text-[#F7F3F1] focus-visible:outline-none"
                  aria-label="Close navigation menu"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Drawer Links (Order: Shop, Brands, Designers, Occasions, Made to Order) */}
              <nav className="mt-8 flex flex-col gap-5 text-base tracking-[0.06em] font-medium">
                <Link
                  to="/collections"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-[#F7F3F1] hover:text-[#E72D63] transition py-1"
                >
                  Shop
                </Link>
                <Link
                  to="/brands"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-[#F7F3F1] hover:text-[#E72D63] transition py-1"
                >
                  Brands
                </Link>
                <Link
                  to="/designers"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-[#F7F3F1] hover:text-[#E72D63] transition py-1"
                >
                  Designers
                </Link>
                <Link
                  to="/occasions"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-[#F7F3F1] hover:text-[#E72D63] transition py-1"
                >
                  Occasions
                </Link>
                <Link
                  to="/category/made-to-order"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-[#F7F3F1] hover:text-[#E72D63] transition py-1"
                >
                  Made to Order
                </Link>
              </nav>

              <div className="mt-8 pt-6 border-t border-[#202024] space-y-4 text-xs tracking-wider text-[#B7B0B3] uppercase">
                <Link
                  to="/wishlist"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-between hover:text-[#F7F3F1] transition py-1"
                >
                  <span>Wishlist</span>
                  <span>{wishlistCount}</span>
                </Link>
                <Link
                  to="/cart"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-between hover:text-[#F7F3F1] transition py-1"
                >
                  <span>Shopping Bag</span>
                  <span>{cartCount}</span>
                </Link>
              </div>
            </div>

            {/* Bottom concierge contact */}
            <div className="pt-6 border-t border-[#202024]">
              <Link
                to="/how-it-works"
                onClick={() => setIsMenuOpen(false)}
                className="block text-xs uppercase tracking-[0.14em] text-[#E72D63] hover:underline"
              >
                Atelier Concierge →
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
