import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="mt-24 border-t border-black/5 bg-parchment/60 text-ink">
      <div className="mx-auto max-w-7xl px-5 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2.5">
              <svg viewBox="0 0 32 32" className="h-7 w-7 flex-shrink-0" aria-hidden>
                <path d="M4 22c0-8 5.5-13 12-13s12 4 12 9-5 8-10 8c-4 0-7-2-7-5s2.5-5 5.5-5" fill="none" stroke="#b0512c" strokeWidth="1.6" strokeLinecap="round" />
                <circle cx="16.5" cy="16" r="1.8" fill="#a3853f" />
              </svg>
              <span className="font-display text-2xl tracking-tight text-ink font-normal">Ogura</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-ink-soft leading-relaxed">
              A marketplace for India&apos;s independent boutiques. Talk to the maker, then have it made
              for you. Minimum order: one.
            </p>
          </div>

          <div className="text-sm">
            <p className="font-semibold text-ink">Shop</p>
            <ul className="mt-3 space-y-2 text-ink-soft">
              <li><Link to="/collections" className="hover:text-ink transition">All Designs</Link></li>
              <li><Link to="/designers" className="hover:text-ink transition">All Boutiques</Link></li>
              <li><Link to="/collections?category=Lehengas" className="hover:text-ink transition">Lehengas</Link></li>
              <li><Link to="/collections?category=Sarees" className="hover:text-ink transition">Sarees</Link></li>
              <li><Link to="/collections?category=Western+Dresses" className="hover:text-ink transition">Western Dresses</Link></li>
              <li><Link to="/occasions" className="hover:text-ink transition">Occasion Wear</Link></li>
            </ul>
          </div>

          <div className="text-sm">
            <p className="font-semibold text-ink">How It Works</p>
            <ul className="mt-3 space-y-2 text-ink-soft">
              <li><Link to="/how-it-works" className="hover:text-ink transition">The Call Is the Product</Link></li>
              <li><Link to="/how-it-works" className="hover:text-ink transition">Custom Measurements</Link></li>
              <li><Link to="/shipping" className="hover:text-ink transition">Direct Studio Shipping</Link></li>
              <li><Link to="/returns" className="hover:text-ink transition">Buyer Protections & Returns</Link></li>
              <li><Link to="/size-guide" className="hover:text-ink transition">Size Guide</Link></li>
            </ul>
          </div>

          <div className="text-sm">
            <p className="font-semibold text-ink">For Boutiques & Legal</p>
            <ul className="mt-3 space-y-2 text-ink-soft">
              <li><a href="/seller-login" className="hover:text-ink transition font-medium text-clay">Boutique Portal Login</a></li>
              <li><Link to="/join" className="hover:text-ink transition">Join as Fashion Designer</Link></li>
              <li><Link to="/contact" className="hover:text-ink transition">Contact Concierge</Link></li>
              <li><Link to="/privacy" className="hover:text-ink transition">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-ink transition">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-black/5 pt-6 text-xs text-ink-soft">
          <p>© {new Date().getFullYear()} Ogura. Built for India&apos;s independent ateliers. Prices inclusive of all taxes.</p>
          <div className="flex gap-4">
            <Link to="/terms" className="hover:text-ink transition">Terms</Link>
            <Link to="/privacy" className="hover:text-ink transition">Privacy</Link>
            <Link to="/shipping" className="hover:text-ink transition">Shipping</Link>
            <Link to="/returns" className="hover:text-ink transition">Returns</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
