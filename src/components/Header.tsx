import { ShoppingBag, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { MegaMenu } from "@/components/MegaMenu";
import { MegaMenuMobile } from "@/components/MegaMenuMobile";
import { HeaderLocationIndicator } from "@/components/HeaderLocationIndicator";
import { AlgoliaSearchDropdown, AlgoliaMobileSearch } from "@/components/search";
import { UserMenu } from "@/components/auth/UserMenu";
import oguraLogo from "@/assets/ogura-logo.png.asset.json";

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { totalItems } = useCart();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/5 bg-ivory/85 backdrop-blur-md text-ink">
      {/* Location bar for desktop */}
      <div className="hidden md:block border-b border-black/5 bg-parchment/40">
        <div className="max-w-7xl mx-auto px-5">
          <div className="flex h-7 items-center justify-between text-xs text-ink-soft">
            <HeaderLocationIndicator variant="compact" />
            <div className="flex items-center gap-4">
              <Link to="/how-it-works" className="hover:text-ink transition">How it works</Link>
              <span className="text-black/20">|</span>
              <a href="/seller-login" className="hover:text-ink transition">For Boutiques & Ateliers</a>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-5">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="md:hidden text-ink hover:bg-parchment/60" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <Menu className="h-5 w-5" />
            </Button>
            
            {/* Artisanal Wordmark */}
            <Link to="/" className="flex items-center gap-2.5" aria-label="OGURA home">
              <svg viewBox="0 0 32 32" className="h-7 w-7 flex-shrink-0" aria-hidden>
                <path d="M4 22c0-8 5.5-13 12-13s12 4 12 9-5 8-10 8c-4 0-7-2-7-5s2.5-5 5.5-5" fill="none" stroke="#b0512c" strokeWidth="1.6" strokeLinecap="round" />
                <circle cx="16.5" cy="16" r="1.8" fill="#a3853f" />
              </svg>
              <span className="font-display text-2xl tracking-tight text-ink font-normal">Ogura</span>
            </Link>

            {/* Mobile location indicator */}
            <div className="md:hidden">
              <HeaderLocationIndicator variant="compact" />
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-sm text-ink-soft">
            <Link to="/collections" className="transition hover:text-ink font-medium">Designs</Link>
            <Link to="/designers" className="transition hover:text-ink font-medium">Boutiques</Link>
            <Link to="/occasions" className="transition hover:text-ink font-medium">Occasions</Link>
            <Link to="/how-it-works" className="transition hover:text-ink font-medium">How it works</Link>
          </nav>

          <div className="flex items-center gap-3">
            {/* Desktop Algolia Search */}
            <div className="hidden lg:block w-52">
              <AlgoliaSearchDropdown isScrolled={true} />
            </div>

            {/* CTA Pill */}
            <Link
              to="/designers"
              className="hidden sm:inline-flex rounded-full bg-ink px-4 py-2 text-xs font-medium text-ivory transition hover:bg-clay"
            >
              Find a boutique
            </Link>

            {/* User Menu */}
            <UserMenu isScrolled={true} />

            {/* Cart Button */}
            <Button
              variant="ghost"
              size="icon"
              className="relative text-ink hover:bg-parchment/60"
              onClick={() => navigate('/cart')}
              aria-label={`Shopping bag with ${totalItems} items`}
            >
              <ShoppingBag className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-clay text-[10px] font-medium text-white flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Algolia Search */}
        <div className="md:hidden pb-3">
          <AlgoliaMobileSearch />
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-black/5 bg-ivory">
          <div className="px-5 py-4 space-y-3">
            <nav className="flex flex-col gap-2">
              <Link to="/collections" className="text-base font-medium py-2 text-ink hover:text-clay transition" onClick={() => setIsMenuOpen(false)}>Designs</Link>
              <Link to="/designers" className="text-base font-medium py-2 text-ink hover:text-clay transition" onClick={() => setIsMenuOpen(false)}>Boutiques</Link>
              <Link to="/occasions" className="text-base font-medium py-2 text-ink hover:text-clay transition" onClick={() => setIsMenuOpen(false)}>Occasions</Link>
              <Link to="/how-it-works" className="text-base font-medium py-2 text-ink hover:text-clay transition" onClick={() => setIsMenuOpen(false)}>How it works</Link>
              <Link to="/seller-login" className="text-sm font-medium py-2 text-ink-soft hover:text-ink transition border-t border-black/5 pt-3" onClick={() => setIsMenuOpen(false)}>For Boutiques</Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};
