import { useRef } from "react";
import { Shield, Truck, RefreshCw, Award } from "lucide-react";
import { useGsapReveal } from "@/hooks/useGsapReveal";
import { Tilt3D } from "@/components/luxury3d/Tilt3D";

const features = [
  { icon: Shield, title: "100% Authentic", description: "All products are genuine and certified" },
  { icon: Truck, title: "Free Shipping", description: "On orders above ₹1999" },
  { icon: RefreshCw, title: "Easy Returns", description: "15 days return policy" },
  { icon: Award, title: "Premium Quality", description: "Curated with excellence" },
];

export const LuxuryTrustBadges = () => {
  const ref = useRef<HTMLElement>(null);
  useGsapReveal(ref, { selector: "[data-reveal]", stagger: 0.1, y: 50 });

  return (
    <section ref={ref} className="relative py-24 md:py-32 overflow-hidden">
      <div className="relative z-10 container mx-auto px-4">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <p data-reveal className="museum-eyebrow justify-center mb-6">
            The Atelier Promise
          </p>
          <h2 data-reveal className="museum-display">
            Fashion, with <em>confidence</em>
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-7">
          {features.map((feature, index) => (
            <Tilt3D key={index} max={8} scale={1.03} style={{ opacity: 0 }}>
              <div data-reveal>
                <div className="text-center museum-card museum-spotlight px-6 py-10">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-[rgba(233,212,163,0.4)] mb-6 transition-all duration-500 hover:border-[#EAE3D9]">
                    <feature.icon className="h-6 w-6 text-[#EAE3D9]" strokeWidth={1.25} />
                  </div>
                  <h3 className="text-[#f4efe6] font-serif italic text-lg tracking-wide mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-[#f4efe6]/60 text-xs leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </Tilt3D>
          ))}
        </div>
      </div>
    </section>
  );
};
