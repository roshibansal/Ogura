import { useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const SHOP_LINKS = [
  { label: "New In", to: "/collections?sort=newest" },
  { label: "Lehengas", to: "/collections/lehengas" },
  { label: "Sarees", to: "/collections/sarees" },
  { label: "Kurta Sets", to: "/collections/indian-coords" },
  { label: "Dresses", to: "/collections/dresses" },
  { label: "Made to Order", to: "/collections?availability=made-to-order" },
];

const OGURA_LINKS = [
  { label: "How Ogura Works", to: "/how-it-works" },
  { label: "Meet the Ateliers", to: "/designers" },
  { label: "Sell on Ogura", to: "/sell" },
  { label: "Careers", to: "/careers" },
];

export const LuxuryFooter = () => {
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);

  return (
    <footer className="bg-foreground text-background">
      {/* First look */}
      <div className="border-b border-background/10">
        <div className="container mx-auto px-4 py-14 text-center">
          <h3 className="text-2xl md:text-3xl font-light uppercase tracking-[0.2em] mb-4">
            New Pieces, First
          </h3>
          <p className="text-background/60 text-sm mb-8 max-w-md mx-auto leading-relaxed">
            Boutiques list in small batches, and one-off pieces go quickly. We write
            when something new lands — nothing else.
          </p>
          {joined ? (
            <p className="text-sm text-background/80 max-w-md mx-auto">
              You're on the list. We'll be in touch when the next pieces land.
            </p>
          ) : (
            <form
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
              onSubmit={(e) => {
                e.preventDefault();
                if (email.trim()) setJoined(true);
              }}
            >
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                aria-label="Email address"
                className="bg-transparent border-background/30 text-background placeholder:text-background/40 focus:border-background"
              />
              <Button
                type="submit"
                variant="outline"
                className="border-background/50 bg-transparent text-background hover:bg-background hover:text-foreground tracking-widest uppercase text-xs"
              >
                Subscribe
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Main Footer */}
      <div className="container mx-auto px-4 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-14">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="inline-block" aria-label="OGURA home">
              <span className="font-serif font-bold text-3xl tracking-tight text-background">
                OGURA
              </span>
            </Link>
            <p className="mt-4 text-sm text-background/60 leading-relaxed max-w-xs">
              Original designs, bought straight from the independent boutiques and
              ateliers that make them. No resellers, no dropshippers.
            </p>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-[0.2em] mb-6">Shop</h4>
            <ul className="space-y-3">
              {SHOP_LINKS.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    className="text-sm text-background/60 hover:text-background transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-[0.2em] mb-6">Ogura</h4>
            <ul className="space-y-3">
              {OGURA_LINKS.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    className="text-sm text-background/60 hover:text-background transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-2 md:col-span-1">
            <h4 className="text-xs uppercase tracking-[0.2em] mb-6">Talk to Us</h4>
            <p className="text-sm text-background/60 leading-relaxed mb-4 max-w-xs">
              Every piece is made or finished by the boutique that lists it. If a size
              needs adjusting in the first seven days, we sort it out with them for you.
            </p>
            <a
              href="mailto:foundercares@ogura.in"
              className="text-sm text-background hover:text-background/70 transition-colors underline underline-offset-4"
            >
              foundercares@ogura.in
            </a>
            <div className="mt-4">
              <Link
                to="/contact"
                className="text-sm text-background/60 hover:text-background transition-colors"
              >
                Contact us
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-background/10">
        <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-background/40">
            © {new Date().getFullYear()} Ogura. Designs belong to the boutiques that made them.
          </p>
          <div className="flex gap-6">
            <Link to="/privacy" className="text-xs text-background/60 hover:text-background transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-xs text-background/60 hover:text-background transition-colors">
              Terms of Use
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
