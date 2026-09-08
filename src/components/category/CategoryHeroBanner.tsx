import { ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

interface CategoryHeroBannerProps {
  title: string;
  subtitle: string;
  heroImage: string;
  heroVideo?: string;
  heroPoster?: string;
  ctaText?: string;
  ctaLink?: string;
}

export const CategoryHeroBanner = ({
  title,
  subtitle,
  heroImage,
  heroVideo,
  heroPoster,
  ctaText,
  ctaLink,
}: CategoryHeroBannerProps) => {
  const [videoError, setVideoError] = useState(false);
  const hasVideo = heroVideo && !videoError;

  return (
    <section className="relative h-[280px] md:h-[400px] lg:h-[500px] w-full overflow-hidden">
      {/* Background Video or Image */}
      {hasVideo ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          poster={heroPoster || heroImage}
          className="w-full h-full object-cover object-center"
          onError={() => setVideoError(true)}
        >
          <source src={heroVideo} type="video/mp4" />
        </video>
      ) : (
        <img
          src={heroImage}
          alt={title}
          className="w-full h-full object-cover object-center"
        />
      )}
      
      {/* Cinematic Dark Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
      {hasVideo && <div className="absolute inset-0 bg-black/10" />}
      
      {/* Back Button */}
      <Link
        to="/"
        className="absolute top-6 left-4 md:left-8 lg:left-16 flex items-center gap-2 text-white/80 hover:text-white transition-colors z-10"
      >
        <ChevronLeft className="w-5 h-5" />
        <span className="text-sm font-medium">Back</span>
      </Link>
      
      {/* Content */}
      <div className="absolute bottom-8 md:bottom-12 lg:bottom-16 left-4 md:left-8 lg:left-16 right-4 md:right-auto max-w-2xl">
        {/* Gold Gradient Title */}
        <h1 
          className={`text-3xl md:text-4xl lg:text-6xl font-serif tracking-wide mb-2 md:mb-4 animate-fade-in ${
            hasVideo 
              ? "text-transparent bg-clip-text bg-gradient-to-r from-[#F5E6C8] via-[#C9A56B] to-[#F5E6C8]" 
              : "text-white"
          }`}
        >
          {title}
        </h1>
        
        {/* Subtitle */}
        <p 
          className={`text-base md:text-lg lg:text-xl font-light mb-4 md:mb-6 animate-fade-in [animation-delay:200ms] ${
            hasVideo ? "text-[#E8D5B7]/90" : "text-white/80"
          }`}
        >
          {subtitle}
        </p>
        
        {/* CTA Button */}
        {ctaText && (
          <Link to={ctaLink || "#products"}>
            <button 
              className={`px-6 md:px-8 py-2.5 md:py-3 border-2 font-medium tracking-widest uppercase text-sm transition-all duration-300 animate-fade-in [animation-delay:400ms] ${
                hasVideo 
                  ? "border-[#C9A56B] text-[#C9A56B] hover:bg-[#C9A56B] hover:text-black hover:shadow-[0_0_25px_rgba(212,175,55,0.5)]" 
                  : "border-white text-white hover:bg-white hover:text-black"
              }`}
            >
              {ctaText}
            </button>
          </Link>
        )}
      </div>
      
      {/* Bottom Gradient for smooth transition */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};
