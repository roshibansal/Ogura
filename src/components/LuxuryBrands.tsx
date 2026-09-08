import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Tilt3D } from "@/components/luxury3d/Tilt3D";
import { useGsapReveal } from "@/hooks/useGsapReveal";

const brands = [
  { name: "RARA AVIS", logo: "R" },
  { name: "TWEEDTM", logo: "T" },
  { name: "LOOM", logo: "L" },
  { name: "KAVITA", logo: "K" },
  { name: "GULMOHR", logo: "G" },
  { name: "INDIGO", logo: "I" },
  { name: "DARZAA", logo: "D" },
  { name: "FAE", logo: "F" },
];

export const LuxuryBrands = () => {
  const sectionRef = useRef<HTMLElement>(null);
  useGsapReveal(sectionRef, { selector: "[data-reveal]", stagger: 0.1, y: 50 });

  return (
    <section ref={sectionRef} className="relative py-24 md:py-36 overflow-hidden isolate">
      {/* Orbital rings — "Houses in orbit" */}
      <div className="museum-orbit" aria-hidden />

      <div className="relative z-10 container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-16">
          <div>
            <span data-reveal className="museum-eyebrow mb-6">
              Gallery 05 — The Brand Universe
            </span>
            <h2 data-reveal className="museum-display mt-5">
              Houses in <em>orbit</em>
            </h2>
            <p data-reveal className="museum-lede mt-6">
              Every maison circles the centre. Step closer and the houses lean toward you.
            </p>
          </div>
          <Link to="/brands" data-reveal className="mt-8 md:mt-0">
            <span className="museum-cta">
              View All
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </span>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-7">
          {brands.map((brand, index) => (
            <Tilt3D key={index} max={12} scale={1.04} style={{ opacity: 0 }}>
              <div data-reveal>
                <Link
                  to={`/brands/${brand.name.toLowerCase().replace(/\s/g, "-")}`}
                  className="group relative aspect-square flex items-center justify-center museum-card museum-spotlight"
                >
                  <div className="text-center relative z-10 px-4">
                    <div
                      className="text-5xl md:text-6xl font-light text-[#EAE3D9]/85 group-hover:text-[#EAE3D9] transition-colors mb-3"
                      style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}
                    >
                      {brand.logo}
                    </div>
                    <span className="museum-rule mx-auto mb-3" />
                    <p className="text-[10px] md:text-[11px] font-light text-[#f4efe6]/65 uppercase tracking-[0.32em] group-hover:text-[#f4efe6] transition-colors">
                      {brand.name}
                    </p>
                  </div>
                </Link>
              </div>
            </Tilt3D>
          ))}
        </div>
      </div>
    </section>
  );
};
