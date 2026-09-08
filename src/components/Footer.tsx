import React from "react";
import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="mt-10 bg-white border-t border-[#E2D1A3] shadow-[0_-2px_14px_rgba(226,209,163,0.15)] text-[#5A0A26]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-8 py-10 sm:py-14">
        <div className="flex flex-col md:flex-row justify-between gap-8 lg:gap-14 flex-wrap">
          {/* Brand & Blurb */}
          <div className="max-w-sm">
            <Link to="/" className="inline-block" aria-label="OGURA Home">
              <span className="font-serif font-bold text-3xl sm:text-4xl tracking-tight text-[#5A0A26]">
                OGURA
              </span>
            </Link>
            <p className="mt-3 text-sm sm:text-base text-[#5A0A26]/85 leading-relaxed font-normal">
              Authentic clothes directly from real independent shops across India. Safe payments, custom sizing, and fast home delivery.
            </p>
          </div>

          {/* Links Columns (.cols) */}
          <div className="flex flex-wrap gap-10 sm:gap-14 text-sm">
            {/* Shop Column */}
            <div>
              <b className="block mb-3 text-xs sm:text-sm font-black uppercase tracking-[0.16em] text-[#B38F24]">
                Marketplace
              </b>
              <ul className="space-y-2.5 font-semibold text-[#5A0A26]/85">
                <li><Link to="/marketplace?sort=new" className="hover:text-[#B38F24] transition">New in this week</Link></li>
                <li><Link to="/marketplace?category=lehengas" className="hover:text-[#B38F24] transition">Lehengas</Link></li>
                <li><Link to="/marketplace?category=sarees" className="hover:text-[#B38F24] transition">Sarees</Link></li>
                <li><Link to="/marketplace?availability=order" className="hover:text-[#B38F24] transition">Made on order</Link></li>
                <li><Link to="/marketplace" className="hover:text-[#B38F24] transition">All 311 creations</Link></li>
              </ul>
            </div>

            {/* Help Column */}
            <div>
              <b className="block mb-3 text-xs sm:text-sm font-black uppercase tracking-[0.16em] text-[#B38F24]">
                Help & Support
              </b>
              <ul className="space-y-2.5 font-semibold text-[#5A0A26]/85">
                <li><Link to="/cart" className="hover:text-[#B38F24] transition">Track your order</Link></li>
                <li><Link to="/contact" className="hover:text-[#B38F24] transition">Contact customer care</Link></li>
                <li><Link to="/terms" className="hover:text-[#B38F24] transition">Free size alterations</Link></li>
                <li><Link to="/terms" className="hover:text-[#B38F24] transition">Fast home delivery</Link></li>
              </ul>
            </div>

            {/* Ogura Column */}
            <div>
              <b className="block mb-3 text-xs sm:text-sm font-black uppercase tracking-[0.16em] text-[#B38F24]">
                Sell With Us
              </b>
              <ul className="space-y-2.5 font-semibold text-[#5A0A26]/85">
                <li><a href="/seller-login" className="text-[#9F1239] font-black hover:underline">Sell on Ogura</a></li>
                <li><Link to="/seller-program" className="hover:text-[#B38F24] transition">Shop waitlist</Link></li>
                <li><a href="/seller/dashboard" className="hover:text-[#B38F24] transition">Seller Dashboard</a></li>
              </ul>
            </div>

            {/* Legal Column */}
            <div>
              <b className="block mb-3 text-xs sm:text-sm font-black uppercase tracking-[0.16em] text-[#B38F24]">
                Policies
              </b>
              <ul className="space-y-2.5 font-semibold text-[#5A0A26]/85">
                <li><Link to="/privacy" className="hover:text-[#B38F24] transition">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-[#B38F24] transition">Terms of Use</Link></li>
                <li><Link to="/terms" className="hover:text-[#B38F24] transition">Safe Payments & Returns</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-5 border-t border-[#E2D1A3] flex flex-wrap items-center justify-between gap-4 text-xs sm:text-sm font-medium text-[#5A0A26]/80">
          <p>© {new Date().getFullYear()} OGURA. Verified independent Indian fashion marketplace.</p>
          <div className="flex items-center gap-4 font-bold text-[#5A0A26]">
            <span>40 Verified Shops</span>
            <span>|</span>
            <span>Zero Resellers</span>
            <span>|</span>
            <span>100% Safe Payments</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
