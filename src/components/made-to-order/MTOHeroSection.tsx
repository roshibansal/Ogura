import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

const VIDEO_URL =
  "https://res.cloudinary.com/dow8lbkui/video/upload/v1768726916/19ygmntpw5rmy0cvt1arvsffr0_result__be5kbh.mp4";
const POSTER_URL =
  "https://images.unsplash.com/photo-1617922001439-4a2e6562f328?w=1920&q=90";

interface MTOHeroSectionProps {
  onStartJourney: () => void;
}

export const MTOHeroSection = ({ onStartJourney }: MTOHeroSectionProps) => {
  const scrollToContent = () => {
    const element = document.getElementById("mto-entry-paths");
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative h-screen md:h-[90vh] w-full overflow-hidden">
      {/* Video Background */}
      <video
        autoPlay
        muted
        loop
        playsInline
        poster={POSTER_URL}
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src={VIDEO_URL} type="video/mp4" />
      </video>

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-4">
        <div className="max-w-3xl">
          {/* Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-light tracking-wide mb-6">
            <span className="bg-gradient-to-r from-[#F5E6C8] via-[#C9A56B] to-[#F5E6C8] bg-clip-text text-transparent">
              Designed With
            </span>
            <br />
            <span className="text-white">Fashion Designers</span>
          </h1>

          {/* Subtext */}
          <p className="text-white/80 text-lg md:text-xl font-light max-w-xl mx-auto mb-10">
            Co-create your outfit with expert boutique designers. Every design
            is personally reviewed and approved.
          </p>

          {/* CTA Button */}
          <Button
            onClick={onStartJourney}
            size="lg"
            className="bg-gradient-to-r from-[#C9A56B] to-[#5A0A26] hover:from-[#5A0A26] hover:to-[#8B6914] text-white border-0 px-8 py-6 text-lg font-medium rounded-full shadow-lg shadow-black/20 transition-all duration-300 hover:scale-105"
          >
            Design With a Fashion Designer
          </Button>
        </div>
      </div>

      {/* Scroll Indicator */}
      <button
        onClick={scrollToContent}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 hover:text-white/90 transition-colors animate-bounce"
      >
        <ChevronDown className="w-8 h-8" />
      </button>
    </section>
  );
};
