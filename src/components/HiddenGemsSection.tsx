import { useRef } from "react";
import { Link } from "react-router-dom";
import { Tilt3D } from "@/components/luxury3d/Tilt3D";
import { ParallaxLayer } from "@/components/luxury3d/ParallaxLayer";
import { useGsapReveal } from "@/hooks/useGsapReveal";
import chanderiShine from "@/assets/chanderi-shine.jpg";
import instaLoved from "@/assets/insta-loved.jpg";
import indieVogue from "@/assets/indie-vogue.jpg";
import urbanLoom from "@/assets/urban-loom.jpg";
import sareeSociety from "@/assets/saree-society.jpg";
import hiddenGemsHero from "@/assets/hidden-gems-hero.jpg";

const brands = [
  { name: "Chanderi Shine", image: chanderiShine, slug: "chanderi-shine" },
  { name: "Insta Loved", image: instaLoved, slug: "insta-loved" },
  { name: "Indie Vogue", image: indieVogue, slug: "indie-vogue" },
  { name: "Urban Loom", image: urbanLoom, slug: "urban-loom" },
  { name: "Saree Society", image: sareeSociety, slug: "saree-society" },
  { name: "Velvet Threads", image: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=600&q=80", slug: "velvet-threads" },
];

/** Diagonal gold light sweep that traverses a card on hover. */
const GoldSweep = () => (
  <div
    aria-hidden
    className="pointer-events-none absolute inset-0 overflow-hidden z-[3] motion-reduce:hidden"
  >
    <div
      className="absolute -inset-y-8 -left-1/2 w-1/2 rotate-12 bg-gradient-to-tr from-transparent via-[#EAE3D9]/25 to-transparent mix-blend-screen opacity-0 transition-[transform,opacity] duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-[300%] group-hover:opacity-100"
    />
  </div>
);

export const HiddenGemsSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  useGsapReveal(sectionRef, { selector: "[data-reveal]", stagger: 0.14, y: 60 });

  return (
    <section
      ref={sectionRef}
      className="relative py-24 md:py-36 px-4 md:px-8 lg:px-16 overflow-hidden isolate"
    >
      {/* Section Header — museum gallery treatment */}
      <div className="relative z-10 max-w-7xl mx-auto mb-16 md:mb-20">
        <p data-reveal className="museum-eyebrow mb-7">
          Gallery 01 — Hidden Gems
        </p>
        <h2 data-reveal className="museum-display max-w-4xl">
          Pieces that <em>find you</em>
        </h2>
        <p data-reveal className="museum-lede mt-7">
          Niche, homegrown labels discovered from Instagram creators. Rare finds float in their own light — move closer, the spotlight follows.
        </p>
      </div>

      {/* Split Layout */}
      <div className="relative z-10 max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/* Left - Large Editorial Feature */}
        <Tilt3D className="lg:w-1/2" max={4} scale={1.02} style={{ opacity: 0 }}>
          <div data-reveal className="group relative">
            <Link
              to="/collections?category=instagram"
              aria-label="Explore Hidden Gems on Instagram"
              className="relative block overflow-hidden rounded-sm ring-1 ring-white/10 shadow-2xl transition-[box-shadow,transform] duration-[500ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:ring-[#c9a56b]/40 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.75),0_0_60px_-20px_rgba(201,165,107,0.35)] will-change-transform"
            >
              <div style={{ aspectRatio: "3/4" }} className="relative overflow-hidden">
                <ParallaxLayer speed={100} className="absolute inset-0">
                  <img
                    src={hiddenGemsHero}
                    alt="Hidden Gems Collection"
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover scale-105 transition-transform duration-[1000ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.12] will-change-transform"
                  />
                </ParallaxLayer>

                {/* Cinematic overlays */}
                <div className="absolute inset-0 z-[2] bg-gradient-to-t from-[#0d0907] via-transparent to-transparent opacity-90 pointer-events-none" />
                <div className="absolute inset-0 z-[2] bg-[radial-gradient(circle_at_50%_25%,transparent_0%,transparent_45%,rgba(0,0,0,0.55)_100%)] pointer-events-none" />

                {/* Gold light sweep on hover */}
                <GoldSweep />

                {/* Editorial typography */}
                <div className="absolute inset-0 z-10 flex flex-col justify-end p-8 md:p-12 lg:p-16">
                  <div className="transform transition-transform duration-[700ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-2">
                    <p className="museum-eyebrow text-[10px] mb-5 text-[#EAE3D9]">
                      OGURA Social · Featured
                    </p>
                    <h3 className="museum-display-sm mb-5">
                      Hidden{" "}
                      <em className="text-[#EAE3D9] [text-shadow:0_0_24px_rgba(201,165,107,0.35)]">
                        Gems
                      </em>
                    </h3>
                    <p className="museum-lede mb-6 text-[13px] max-w-md">
                      Niche, homegrown labels discovered from Instagram creators.
                    </p>
                    <div className="museum-meta mb-6">
                      <div>
                        <span className="k">Now showing</span>
                        24 curated objects
                      </div>
                    </div>
                    <span className="museum-cta">Explore Instagram</span>
                  </div>
                </div>

                {/* Gilded inset frame — fades in on hover */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-4 md:inset-6 z-[11] border border-[#c9a56b]/10 opacity-0 transition-[opacity,inset] duration-[700ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:opacity-100 group-hover:border-[#c9a56b]/35"
                />
              </div>
            </Link>
          </div>
        </Tilt3D>

        {/* Right - Brand Cards Grid */}
        <div className="lg:w-1/2 grid grid-cols-2 gap-4 md:gap-6 content-start">
          {brands.map((brand) => (
            <Tilt3D key={brand.slug} max={7} scale={1.04} style={{ opacity: 0 }}>
              <div data-reveal className="group relative">
                <Link
                  to={`/collections/${brand.slug}`}
                  aria-label={brand.name}
                  className="relative block overflow-hidden rounded-sm ring-1 ring-white/5 shadow-xl transition-[box-shadow,transform] duration-[500ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:ring-[#c9a56b]/35 hover:shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7),0_0_40px_-15px_rgba(201,165,107,0.3)] will-change-transform"
                >
                  <div className="aspect-[3/4] overflow-hidden relative">
                    <img
                      src={brand.image}
                      alt={brand.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover transition-transform duration-[700ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.1] will-change-transform"
                    />

                    {/* Vignette gradient for legibility */}
                    <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                    {/* Gold light sweep on hover */}
                    <GoldSweep />

                    {/* Label stack — default label + hover glass plate */}
                    <div className="absolute inset-x-0 bottom-0 z-10 p-4 md:p-5">
                      {/* Glass name plate on hover */}
                      <div className="backdrop-blur-md bg-white/5 border-l-2 border-[#c9a56b] px-3 py-2 translate-y-2 opacity-0 transition-[opacity,transform] duration-[500ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0 group-hover:opacity-100">
                        <p className="font-serif text-[11px] tracking-[0.32em] uppercase text-[#EAE3D9]">
                          {brand.name}
                        </p>
                      </div>
                      {/* Default label */}
                      <p className="mt-2 font-serif italic text-[13px] tracking-[0.28em] uppercase text-white/90 text-center transition-opacity duration-300 group-hover:opacity-0">
                        {brand.name}
                      </p>
                    </div>

                    {/* Gilded inset frame on hover */}
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-2 z-[11] border border-[#c9a56b]/10 opacity-0 transition-opacity duration-[600ms] group-hover:opacity-100 group-hover:border-[#c9a56b]/30"
                    />
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
