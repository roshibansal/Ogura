import React from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const STEPS = [
  {
    n: "01",
    h: "Pick what you like from genuine shops",
    p: "Look through authentic lehengas, sarees, dresses, and bags from real independent shops in Jaipur, Chennai, Hyderabad, and Goa.",
  },
  {
    n: "02",
    h: "Free help before you order",
    p: "Send a quick WhatsApp message or schedule a quick video call with the shop to check colors, matching accessories, or ask questions.",
  },
  {
    n: "03",
    h: "Custom size stitching",
    p: "Want it made to your exact size? Tell the shop your measurements, or choose standard sizes (XS to XXL).",
  },
  {
    n: "04",
    h: "100% Safe Payments",
    p: "You pay Ogura safely online. The seller receives payment only after you get your package and check that it fits.",
  },
  {
    n: "05",
    h: "Fast home delivery",
    p: "Your order is packed carefully at the shop and shipped straight to your house with live courier tracking.",
  },
  {
    n: "06",
    h: "Free size fixes",
    p: "If the fit is slightly tight or loose, we provide one free size alteration anywhere in India so you feel confident wearing it.",
  },
];

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-white text-[#5A0A26] flex flex-col selection:bg-gold selection:text-ink">
      <Header />

      <main className="flex-1 mx-auto max-w-4xl px-5 py-10 sm:py-14 w-full">
        <span className="text-xs uppercase tracking-[0.2em] font-extrabold text-[#B38F24]">
          How Shopping Works
        </span>
        <h1 className="mt-2 font-serif text-4xl leading-tight sm:text-5xl font-normal text-[#5A0A26]">
          Simple, Safe & Direct Shopping.
        </h1>
        <p className="mt-4 text-base sm:text-lg leading-relaxed text-[#5A0A26]/85">
          We connect you directly to real independent fashion shops across India. Talk with the makers, get custom sizes, and enjoy 100% safe payments with zero middleman markups.
        </p>

        {/* 6 Core Steps */}
        <div className="mt-12 space-y-8">
          {STEPS.map((s) => (
            <div key={s.n} className="bg-white/95 border border-[#E2D1A3] p-6 rounded-sm shadow-xs grid gap-4 sm:grid-cols-[4rem_1fr] items-baseline">
              <p className="font-serif italic text-3xl text-[#B38F24] font-normal">{s.n}</p>
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#5A0A26]">{s.h}</h2>
                <p className="mt-1.5 max-w-2xl leading-relaxed text-sm sm:text-base text-[#5A0A26]/80">{s.p}</p>
              </div>
            </div>
          ))}
        </div>

        {/* The Honest Guidelines */}
        <h2 className="font-serif text-3xl font-normal text-[#5A0A26] mt-14">Helpful Things to Know</h2>
        <div className="mt-6 space-y-4 text-sm text-[#5A0A26]/85">
          <div className="rounded-sm border border-[#E2D1A3] bg-white/95 p-5 shadow-xs">
            <p className="font-bold text-[#5A0A26]">Handmade pieces take a little time to craft.</p>
            <p className="mt-1.5 leading-relaxed">
              Items already in shop ship in 2-3 days. Custom-stitched outfits take 1-2 weeks because they are tailored specifically for you.
            </p>
          </div>

          <div className="rounded-sm border border-[#E2D1A3] bg-white/95 p-5 shadow-xs">
            <p className="font-bold text-[#5A0A26]">Free size adjustments.</p>
            <p className="mt-1.5 leading-relaxed">
              Because custom-stitched clothes are made for your exact body, we offer one free alteration anywhere in India to make sure you get the perfect fit.
            </p>
          </div>

          <div className="rounded-sm border border-[#E2D1A3] bg-white/95 p-5 shadow-xs">
            <p className="font-bold text-[#5A0A26]">Real handloom fabrics.</p>
            <p className="mt-1.5 leading-relaxed">
              Hand-spun silks and hand-block prints have beautiful subtle textures that make each piece special and authentic.
            </p>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 rounded-sm bg-white/95 border border-[#E2D1A3] px-7 py-9 text-center shadow-xs">
          <h3 className="font-serif text-2xl sm:text-3xl text-[#5A0A26]">Ready to find your favorite outfit?</h3>
          <p className="mt-2 text-sm text-[#5A0A26]/80">
            Explore verified shops across India and buy directly with complete safety.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/marketplace"
              className="inline-block rounded-sm bg-[#FFA41C] hover:bg-[#FF8F00] px-8 py-3.5 text-sm font-extrabold text-[#0F1111] transition shadow-xs border border-[#FF8F00]"
            >
              Explore Marketplace
            </Link>
            <Link
              to="/designers"
              className="inline-block rounded-sm border border-[#E2D1A3] bg-white px-7 py-3.5 text-sm font-bold text-[#5A0A26] transition hover:border-[#D4AF37]"
            >
              Meet Our Shops
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
