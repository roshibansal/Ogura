import { Card } from "@/components/ui/card";
import { Upload, Users, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

interface EntryPath {
  id: "inspiration" | "designer" | "base-design";
  icon: React.ReactNode;
  title: string;
  description: string;
}

const entryPaths: EntryPath[] = [
  {
    id: "inspiration",
    icon: <Upload className="w-8 h-8" />,
    title: "Start from Inspiration",
    description:
      "Upload reference images and let our designers bring your vision to life",
  },
  {
    id: "designer",
    icon: <Users className="w-8 h-8" />,
    title: "Start with a Designer",
    description:
      "Browse our curated designers and begin your journey with an expert",
  },
  {
    id: "base-design",
    icon: <LayoutGrid className="w-8 h-8" />,
    title: "Start from a Base Design",
    description:
      "Customize one of our signature designs with your personal touches",
  },
];

interface MTOEntryPathsProps {
  onSelectPath: (path: "inspiration" | "designer" | "base-design") => void;
}

export const MTOEntryPaths = ({ onSelectPath }: MTOEntryPathsProps) => {
  return (
    <section
      id="mto-entry-paths"
      className="py-16 md:py-24 bg-gradient-to-b from-background to-secondary/20"
    >
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-serif font-light tracking-wide mb-4">
            Begin Your Journey
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Choose how you'd like to start creating your bespoke outfit
          </p>
        </div>

        {/* Entry Path Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
          {entryPaths.map((path) => (
            <Card
              key={path.id}
              onClick={() => onSelectPath(path.id)}
              className={cn(
                "group relative p-8 md:p-10 cursor-pointer",
                "bg-card hover:bg-card/80",
                "border border-border/50 hover:border-[#C9A56B]/50",
                "rounded-2xl shadow-sm hover:shadow-xl hover:shadow-black/5",
                "transition-all duration-300 hover:-translate-y-1"
              )}
            >
              {/* Icon */}
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#C9A56B]/10 to-[#C9A56B]/5 flex items-center justify-center mb-6 text-[#C9A56B] group-hover:scale-110 transition-transform duration-300">
                {path.icon}
              </div>

              {/* Title */}
              <h3 className="text-xl font-medium mb-3 group-hover:text-[#C9A56B] transition-colors">
                {path.title}
              </h3>

              {/* Description */}
              <p className="text-muted-foreground text-sm leading-relaxed">
                {path.description}
              </p>

              {/* Hover Indicator */}
              <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-8 h-8 rounded-full bg-[#C9A56B] flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
