import { useRef } from "react";
import { MapPin, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Tilt3D } from "@/components/luxury3d/Tilt3D";
import { ParallaxLayer } from "@/components/luxury3d/ParallaxLayer";
import { useGsapReveal } from "@/hooks/useGsapReveal";

const stores = [
  { name: "Mumbai Flagship", address: "High Street Phoenix, Lower Parel", city: "Mumbai" },
  { name: "Delhi", address: "Select Citywalk, Saket", city: "Delhi" },
  { name: "Bangalore", address: "UB City Mall, Vittal Mallya Road", city: "Bengaluru" },
];

export const LuxuryStoreLocator = () => {
  const sectionRef = useRef<HTMLElement>(null);
  useGsapReveal(sectionRef, { selector: "[data-reveal]", stagger: 0.14, y: 60 });

  return (
    <section ref={sectionRef} className="relative min-h-[85vh] py-24 md:py-36 overflow-hidden isolate">
      {/* Parallax Background Image */}
      <ParallaxLayer speed={100} className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center scale-125"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&q=80)",
          }}
        />
      </ParallaxLayer>

      {/* Cinematic overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#08070a]/85 via-[#0c0a08]/75 to-[#08070a]/90 z-[2]" />
      <div
        aria-hidden
        className="absolute inset-0 z-[2] pointer-events-none"
        style={{ background: "radial-gradient(120% 90% at 50% 40%, transparent 35%, rgba(0,0,0,0.7) 100%)", mixBlendMode: "multiply" }}
      />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center container mx-auto px-4">
        <span data-reveal className="museum-eyebrow mb-7">
          Gallery 07 — Stores
        </span>

        <h2 data-reveal className="museum-display mb-6">
          Windows you can <em>walk into</em>
        </h2>

        <p data-reveal className="museum-lede mx-auto text-center mb-14">
          Each boutique becomes a lit showroom window, hovering in the dark. The last room before you leave the building.
        </p>

        <div className="flex flex-col md:flex-row gap-6 md:gap-10 mb-14 w-full max-w-5xl">
          {stores.map((store, index) => (
            <Tilt3D key={index} max={10} scale={1.04} className="flex-1" style={{ opacity: 0 }}>
              <div data-reveal>
                <div className="text-left museum-card museum-spotlight px-8 py-9">
                  <MapPin className="h-5 w-5 text-[#EAE3D9] mb-5 relative z-10" strokeWidth={1.25} />
                  <p className="text-[10px] text-[#c9a56b] italic tracking-[0.32em] uppercase mb-3 font-serif">
                    {store.city}
                  </p>
                  <h3 className="museum-display-sm mb-3">
                    {store.name}
                  </h3>
                  <p className="text-[#f4efe6]/65 text-sm tracking-wide leading-relaxed mb-5">
                    {store.address}
                  </p>
                  <div className="museum-meta">
                    <div>
                      <span className="k">By appointment</span>
                      Always
                    </div>
                  </div>
                </div>
              </div>
            </Tilt3D>
          ))}
        </div>

        <div data-reveal>
          <Link to="/stores" className="museum-cta">
            Find All Stores
            <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
};
