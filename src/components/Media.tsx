import React, { useState } from "react";

export interface Palette {
  from: string;
  to: string;
  accent: string;
}

export function Media({
  src,
  alt,
  palette = { from: "#17130f", to: "#4a3e35", accent: "#b0512c" },
  label,
  sub,
  ratio = "aspect-[4/5]",
  className = "",
  priority = false,
  badge,
}: {
  src?: string;
  alt: string;
  palette?: Palette;
  label?: string;
  sub?: string;
  ratio?: string;
  className?: string;
  priority?: boolean;
  badge?: string;
}) {
  const [hasError, setHasError] = useState(false);

  const chip = badge ? (
    <span className="absolute left-3 top-3 z-10 rounded-full bg-ivory/95 px-2.5 py-1 text-[0.68rem] font-medium tracking-wide text-forest shadow-sm backdrop-blur-sm">
      {badge}
    </span>
  ) : null;

  if (src && !hasError) {
    return (
      <div className={`relative ${ratio} ${className} overflow-hidden rounded-lg bg-parchment`}>
        {chip}
        <img
          src={src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          onError={() => setHasError(true)}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        />
      </div>
    );
  }

  return (
    <div
      className={`swatch ${ratio} ${className} relative flex flex-col justify-end rounded-lg p-4 overflow-hidden`}
      style={{ background: `linear-gradient(155deg, ${palette.from}, ${palette.to})` }}
    >
      {chip}
      <div
        className="pointer-events-none absolute right-4 top-4 h-10 w-10 rounded-full opacity-70"
        style={{ background: palette.accent }}
      />
      {label && (
        <div className="relative z-10">
          <p className="font-display text-lg leading-tight text-white/95">{label}</p>
          {sub && <p className="mt-0.5 text-xs text-white/70">{sub}</p>}
        </div>
      )}
    </div>
  );
}
