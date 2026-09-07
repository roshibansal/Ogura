import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="mt-24 border-t border-[#202024] bg-[#050506] text-[#F7F3F1] font-functional">
      <div className="mx-auto max-w-[1440px] px-6 sm:px-8 lg:px-16 py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2.5" aria-label="OGURA Homepage">
              <span className="font-editorial text-3xl tracking-tight uppercase text-[#F7F3F1]">
                OGURA
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-[#B7B0B3] leading-relaxed">
              A marketplace for India&apos;s independent boutiques. Talk to the maker, then have it made
              for you. Minimum order: one.
            </p>
          </div>

          <div className="text-sm">
            <p className="font-semibold text-[#F7F3F1] uppercase tracking-[0.1em] text-xs">Shop</p>
            <ul className="mt-4 space-y-2.5 text-[#B7B0B3]">
              <li><Link to="/collections" className="hover:text-[#F7F3F1] transition">All Designs</Link></li>
              <li><Link to="/designers" className="hover:text-[#F7F3F1] transition">All Boutiques</Link></li>
              <li><Link to="/collections?category=Lehengas" className="hover:text-[#F7F3F1] transition">Lehengas</Link></li>
              <li><Link to="/collections?category=Sarees" className="hover:text-[#F7F3F1] transition">Sarees</Link></li>
              <li><Link to="/collections?category=Western+Dresses" className="hover:text-[#F7F3F1] transition">Western Dresses</Link></li>
              <li><Link to="/occasions" className="hover:text-[#F7F3F1] transition">Occasion Wear</Link></li>
            </ul>
          </div>

          <div className="text-sm">
            <p className="font-semibold text-[#F7F3F1] uppercase tracking-[0.1em] text-xs">How It Works</p>
            <ul className="mt-4 space-y-2.5 text-[#B7B0B3]">
              <li><Link to="/how-it-works" className="hover:text-[#F7F3F1] transition">The Call Is the Product</Link></li>
              <li><Link to="/how-it-works" className="hover:text-[#F7F3F1] transition">Custom Measurements</Link></li>
              <li><Link to="/shipping" className="hover:text-[#F7F3F1] transition">Direct Studio Shipping</Link></li>
              <li><Link to="/returns" className="hover:text-[#F7F3F1] transition">Buyer Protections & Returns</Link></li>
              <li><Link to="/size-guide" className="hover:text-[#F7F3F1] transition">Size Guide</Link></li>
            </ul>
          </div>

          <div className="text-sm">
            <p className="font-semibold text-[#F7F3F1] uppercase tracking-[0.1em] text-xs">For Boutiques & Legal</p>
            <ul className="mt-4 space-y-2.5 text-[#B7B0B3]">
              <li><a href="/seller-login" className="hover:text-[#E72D63] transition font-medium text-[#E72D63]">Boutique Portal Login</a></li>
              <li><Link to="/join" className="hover:text-[#F7F3F1] transition">Join as Fashion Designer</Link></li>
              <li><Link to="/careers" className="hover:text-[#F7F3F1] transition">Careers</Link></li>
              <li><Link to="/contact" className="hover:text-[#F7F3F1] transition">Contact Concierge</Link></li>
              <li><Link to="/privacy" className="hover:text-[#F7F3F1] transition">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-[#F7F3F1] transition">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-[#202024] pt-8 text-xs text-[#817B7E]">
          <p>© {new Date().getFullYear()} Ogura. Built for India&apos;s independent ateliers. Prices inclusive of all taxes.</p>
          <div className="flex gap-6">
            <Link to="/terms" className="hover:text-[#F7F3F1] transition">Terms</Link>
            <Link to="/privacy" className="hover:text-[#F7F3F1] transition">Privacy</Link>
            <Link to="/shipping" className="hover:text-[#F7F3F1] transition">Shipping</Link>
            <Link to="/returns" className="hover:text-[#F7F3F1] transition">Returns</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
