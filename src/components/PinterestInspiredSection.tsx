import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { products } from "@/data/products";
import { SaveToPinterestButton } from "./SaveToPinterestButton";
import { OptimizedImage } from "./OptimizedImage";
import { ConnectPinterestButton } from "./ConnectPinterestButton";
import { UserPinterestBoards } from "./UserPinterestBoards";
import { Tilt3D } from "@/components/luxury3d/Tilt3D";
import { useGsapReveal } from "@/hooks/useGsapReveal";

const curatedProducts = products
  .filter((p) => p.images?.[0]?.startsWith("http"))
  .slice(0, 9);

export const PinterestInspiredSection = () => {
  const navigate = useNavigate();
  const baseUrl = window.location.origin;
  const sectionRef = useRef<HTMLElement>(null);
  useGsapReveal(sectionRef, { selector: "[data-reveal]", stagger: 0.1, y: 50 });

  return (
    <section ref={sectionRef} className="relative py-24 md:py-36 overflow-hidden isolate">
      <div className="container mx-auto px-4 relative z-10">
        {/* Header — museum gallery treatment */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <p data-reveal className="museum-eyebrow justify-center mb-6">
            Gallery 06 — Inspiration
          </p>
          <h2 data-reveal className="museum-display">
            A wall that <em>breathes</em>
          </h2>
          <p data-reveal className="museum-lede mt-7 mx-auto text-center">
            Mood and reference, layered across depth planes. Save your favourites or shop them instantly.
          </p>
          <div data-reveal className="mt-8 flex justify-center">
            <ConnectPinterestButton />
          </div>
        </div>

        {/* Masonry Grid */}
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 space-y-5">
          {curatedProducts.map((product, i) => {
            const productUrl = `${baseUrl}/product/${product.id}`;
            const imageUrl = product.images[0];
            const aspect = i % 3 === 0 ? "aspect-[3/4]" : i % 3 === 1 ? "aspect-[4/5]" : "aspect-[2/3]";

            const depths = [6, 10, 8, 12, 7, 9];
            const max = depths[i % depths.length];
            return (
              <Tilt3D
                key={product.id}
                max={max}
                scale={1.03}
                className="break-inside-avoid mb-5 block"
                style={{ opacity: 0 }}
              >
                <div data-reveal>
                  <div
                    className="group relative museum-card museum-spotlight cursor-pointer"
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    <OptimizedImage
                      src={imageUrl}
                      alt={product.name}
                      className={aspect}
                    />

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 flex flex-col items-center justify-end gap-3 p-6 z-10">
                      <span className="museum-cta">Shop This Look</span>
                      <span className="text-[#f4efe6]/85 text-xs line-clamp-1 tracking-wide">{product.name}</span>
                      <span
                        className="text-[#EAE3D9] font-light text-xl italic"
                        style={{ fontFamily: "'Cormorant Garamond', serif" }}
                      >
                        ₹{product.price.toLocaleString("en-IN")}
                      </span>
                    </div>

                    {/* Pinterest save */}
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                      <SaveToPinterestButton
                        productUrl={productUrl}
                        imageUrl={imageUrl}
                        description={`${product.name} — Shop now on Ogura`}
                      />
                    </div>

                    {/* Brand tag */}
                    <div className="absolute bottom-3 left-3 museum-glass rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-[#EAE3D9] italic font-serif opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      {product.brand || "Ogura"}
                    </div>
                  </div>
                </div>
              </Tilt3D>
            );
          })}
        </div>

        {/* User's Pinterest Boards */}
        <UserPinterestBoards />
      </div>
    </section>
  );
};
