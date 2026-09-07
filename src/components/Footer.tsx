import React from "react";
import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="mt-20 bg-wash border-t border-line text-ink">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-8 py-12 sm:py-16">
        <div className="flex flex-col md:flex-row justify-between gap-10 lg:gap-16 flex-wrap">
          {/* Brand & Blurb */}
          <div className="max-w-xs">
            <Link to="/" className="inline-block" aria-label="OGURA Home">
              <span className="font-sans font-extrabold text-2xl tracking-[-0.04em] text-rose">
                OGURA
              </span>
            </Link>
            <p className="mt-3 text-xs sm:text-sm text-grey-soft leading-relaxed">
              Boutique wear from independent Indian ateliers. Talk to a designer before you buy.
            </p>
          </div>

          {/* Links Columns (.cols) */}
          <div className="flex flex-wrap gap-10 sm:gap-16 text-xs">
            {/* Shop Column */}
            <div>
              <b className="block mb-3 text-[11px] font-bold uppercase tracking-[0.13em] text-grey-soft">
                Shop
              </b>
              <ul className="space-y-2 text-grey-soft">
                <li><Link to="/collections?sort=new" className="hover:text-ink transition">New in</Link></li>
                <li><Link to="/collections?category=Lehengas" className="hover:text-ink transition">Lehengas</Link></li>
                <li><Link to="/collections?category=Sarees" className="hover:text-ink transition">Sarees</Link></li>
                <li><Link to="/collections?availability=order" className="hover:text-ink transition">Made to order</Link></li>
                <li><Link to="/collections" className="hover:text-ink transition">All creations</Link></li>
              </ul>
            </div>

            {/* Help Column */}
            <div>
              <b className="block mb-3 text-[11px] font-bold uppercase tracking-[0.13em] text-grey-soft">
                Help
              </b>
              <ul className="space-y-2 text-grey-soft">
                <li><Link to="/how-it-works" className="hover:text-ink transition">Delivery</Link></li>
                <li><Link to="/how-it-works" className="hover:text-ink transition">Alteration assistance</Link></li>
                <li><Link to="/how-it-works" className="hover:text-ink transition">Size guide</Link></li>
                <li><Link to="/contact" className="hover:text-ink transition">Contact concierge</Link></li>
              </ul>
            </div>

            {/* Ogura Column */}
            <div>
              <b className="block mb-3 text-[11px] font-bold uppercase tracking-[0.13em] text-grey-soft">
                Ogura
              </b>
              <ul className="space-y-2 text-grey-soft">
                <li><Link to="/how-it-works" className="hover:text-ink transition">How it works</Link></li>
                <li><a href="/seller-login" className="text-rose font-semibold hover:underline">Sell on Ogura</a></li>
                <li><Link to="/designers" className="hover:text-ink transition">Our ateliers</Link></li>
                <li><Link to="/brand-waitlist" className="hover:text-ink transition">Atelier waitlist</Link></li>
              </ul>
            </div>

            {/* Legal Column */}
            <div>
              <b className="block mb-3 text-[11px] font-bold uppercase tracking-[0.13em] text-grey-soft">
                Legal
              </b>
              <ul className="space-y-2 text-grey-soft">
                <li><Link to="/privacy" className="hover:text-ink transition">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-ink transition">Terms of Use</Link></li>
                <li><Link to="/terms" className="hover:text-ink transition">Escrow & Settlement</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-line flex flex-wrap items-center justify-between gap-4 text-xs text-grey-muted">
          <p>© {new Date().getFullYear()} OGURA. Curated independent Indian fashion marketplace.</p>
          <div className="flex items-center gap-3">
            <span>Verified Ateliers</span>
            <span>·</span>
            <span>Zero Resellers</span>
            <span>·</span>
            <span>Escrow Protected</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
