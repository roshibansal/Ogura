import React, { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BoutiqueCard } from "@/components/Cards";
import { useDesigners } from "@/hooks/useDesigners";
import { transformDesignerToBoutiqueStrict } from "@/lib/adapters/boutiqueAdapter";
import { Skeleton } from "@/components/ui/skeleton";

export default function Designers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCity = searchParams.get("city") || "";

  const { data: designers = [], isLoading } = useDesigners();

  // Extract unique cities from live database
  const cities = useMemo(() => {
    const set = new Set<string>();
    for (const d of designers) {
      if (d.city && d.city.trim()) {
        set.add(d.city.trim());
      }
    }
    return Array.from(set);
  }, [designers]);

  // Filter boutiques by city
  const filteredBoutiques = useMemo(() => {
    return designers
      .filter((d) => {
        if (!selectedCity) return true;
        return (d.city || "").toLowerCase() === selectedCity.toLowerCase();
      })
      .map((d) => transformDesignerToBoutiqueStrict(d));
  }, [designers, selectedCity]);

  const setCity = (c: string) => {
    const next = new URLSearchParams(searchParams);
    if (!c) {
      next.delete("city");
    } else {
      next.set("city", c);
    }
    setSearchParams(next);
  };

  return (
    <div className="min-h-screen bg-ivory text-ink grain flex flex-col selection:bg-clay selection:text-white">
      <Header />

      <main className="flex-1 mx-auto max-w-7xl px-5 py-12 w-full">
        <div className="max-w-3xl">
          <span className="text-xs uppercase tracking-[0.2em] font-semibold text-clay">
            India&apos;s Independent Ateliers
          </span>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl font-normal tracking-tight">
            Boutiques
          </h1>
          <p className="mt-3 text-base sm:text-lg text-ink-soft leading-relaxed">
            Independent studios, each one verified before it opens a shop here. Chat with any boutique through Ogura, and we stay with the order from the first message to the day it arrives.
          </p>
        </div>

        {/* City Filter Pills */}
        <div className="mt-8 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCity("")}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
              !selectedCity
                ? "bg-clay text-white"
                : "border border-ink/15 bg-white/70 text-ink hover:border-ink/40"
            }`}
          >
            All Cities ({designers.length})
          </button>
          {cities.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => setCity(city)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
                selectedCity.toLowerCase() === city.toLowerCase()
                  ? "bg-clay text-white"
                  : "border border-ink/15 bg-white/70 text-ink hover:border-clay hover:text-clay"
              }`}
            >
              {city}
            </button>
          ))}
        </div>

        {/* Boutiques Grid */}
        {isLoading ? (
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[4/3] rounded-lg bg-parchment" />
                <Skeleton className="h-5 w-1/2 bg-parchment" />
                <Skeleton className="h-4 w-3/4 bg-parchment" />
              </div>
            ))}
          </div>
        ) : filteredBoutiques.length > 0 ? (
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filteredBoutiques.map((b) => (
              <BoutiqueCard key={b.id} b={b} count={b.productCount} />
            ))}
          </div>
        ) : (
          <div className="mt-16 text-center py-12 rounded-xl border border-dashed border-ink/20 max-w-md mx-auto bg-parchment/30">
            <h3 className="font-display text-2xl font-normal">No boutiques in {selectedCity}</h3>
            <p className="mt-2 text-xs text-ink-soft">
              We are constantly onboarding new master couturiers.
            </p>
            <button
              type="button"
              onClick={() => setCity("")}
              className="mt-5 rounded-full bg-ink px-6 py-2 text-xs font-medium text-ivory hover:bg-clay transition"
            >
              View All Cities
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
