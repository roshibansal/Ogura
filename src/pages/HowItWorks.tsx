import React from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const STEPS = [
  {
    n: "01",
    h: "Find a studio, not a SKU",
    p: "Browse by city, craft or category. Every atelier page reveals the lead couturier, their specialization, studio timeline, and what they craft by hand.",
  },
  {
    n: "02",
    h: "Request a call — free, before you pay",
    p: "Pick a slot, specify what you want to consult on, choose video or voice in your preferred language. The studio confirms promptly. Fifteen minutes on a call answers what forty product photos cannot.",
  },
  {
    n: "03",
    h: "Agree on the piece and customizations",
    p: "Colour palette, neckline, sleeve length, fabric weight, delivery date, and custom accents. Everything settled on the call is documented directly in your bespoke order details.",
  },
  {
    n: "04",
    h: "Measurements, guided personally",
    p: "The designer or master tailor walks you through it on video — eight minutes and a measuring tape. We store your measurement block securely on file for all future commissions.",
  },
  {
    n: "05",
    h: "We protect your payment",
    p: "You pay Ogura through our secure Razorpay escrow pipeline, not the atelier directly. The studio receives funds after you receive the garment and confirm the fit.",
  },
  {
    n: "06",
    h: "It arrives, and it fits",
    p: "Insured courier directly from the atelier to your doorstep. If anything is imperfect, one complimentary alteration is included anywhere in India.",
  },
];

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-ivory text-ink grain flex flex-col selection:bg-clay selection:text-white">
      <Header />

      <main className="flex-1 mx-auto max-w-4xl px-5 py-14 w-full">
        <span className="text-xs uppercase tracking-[0.2em] font-semibold text-clay">
          Bespoke Consultation Architecture
        </span>
        <h1 className="mt-2 font-display text-4xl leading-tight sm:text-5xl font-normal">
          The call is the product.
        </h1>
        <p className="mt-4 text-base sm:text-lg leading-relaxed text-ink-soft">
          Buying a luxury made-to-order couture piece from an artisan studio 1,400 km away is a trust and personalization challenge, not a commodity catalog problem. Everything in Ogura exists to solve that.
        </p>

        {/* 6 Core Steps */}
        <div className="mt-14 space-y-12">
          {STEPS.map((s) => (
            <div key={s.n} className="grid gap-4 sm:grid-cols-[5rem_1fr] items-baseline">
              <p className="font-display text-3xl text-clay/60 font-normal">{s.n}</p>
              <div>
                <h2 className="font-display text-2xl font-normal text-ink">{s.h}</h2>
                <p className="mt-2 max-w-2xl leading-relaxed text-sm sm:text-base text-ink-soft">{s.p}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="rule my-14" />

        {/* The Honest Truth */}
        <h2 className="font-display text-3xl font-normal">The honest guidelines</h2>
        <div className="mt-6 space-y-6 text-sm text-ink-soft">
          <div className="rounded-xl border border-black/5 bg-parchment/50 p-5">
            <p className="font-medium text-ink">Bespoke creation takes craftsmanship time.</p>
            <p className="mt-1.5 leading-relaxed">
              Two weeks for artisanal tops and co-ords, up to eight to ten weeks for heavy bridal couture. If you need something off-the-rack by tomorrow, filter by &quot;Studio Stock&quot; or consult with us.
            </p>
          </div>

          <div className="rounded-xl border border-black/5 bg-parchment/50 p-5">
            <p className="font-medium text-ink">Custom garments cannot be returned for cash refunds.</p>
            <p className="mt-1.5 leading-relaxed">
              Because the garment is cut exclusively to your individual anatomy, standard returns are not possible. What you receive instead is one complimentary alteration anywhere in India and a direct consultation before scissors touch cloth.
            </p>
          </div>

          <div className="rounded-xl border border-black/5 bg-parchment/50 p-5">
            <p className="font-medium text-ink">Handmade weaving and dye variations.</p>
            <p className="mt-1.5 leading-relaxed">
              Hand-spun khadi, vegetable indigo vats, and hand-embroidery possess subtle natural characteristics that make each piece singular. The designer will show you fabric swatches during your video call.
            </p>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-14 rounded-2xl bg-parchment/70 border border-black/5 px-7 py-10 text-center">
          <h3 className="font-display text-2xl font-normal">Start with an atelier you connect with</h3>
          <p className="mt-2 text-xs sm:text-sm text-ink-soft">
            Explore vetted independent fashion houses across India and book a 15-minute styling consultation.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              to="/designers"
              className="inline-block rounded-full bg-ink px-7 py-3 text-xs font-medium text-ivory transition hover:bg-clay"
            >
              Browse Boutiques
            </Link>
            <Link
              to="/collections"
              className="inline-block rounded-full border border-ink/20 px-7 py-3 text-xs font-medium text-ink transition hover:bg-parchment"
            >
              Explore All Designs
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
