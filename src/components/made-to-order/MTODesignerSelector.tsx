import { useState } from "react";
import { useDesigners } from "@/hooks/useDesigners";
import { useMadeToOrder } from "@/contexts/MadeToOrderContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Designer } from "@/types";

const categoryFilters = [
  "All",
  "Bridal",
  "Couture",
  "Contemporary",
  "Luxury",
  "Fusion",
];

interface MTODesignerSelectorProps {
  onProceed: () => void;
}

export const MTODesignerSelector = ({ onProceed }: MTODesignerSelectorProps) => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const { data: designers, isLoading } = useDesigners({
    category: selectedCategory === "All" ? undefined : selectedCategory,
  });
  const { state, setSelectedDesigner, setCurrentStep } = useMadeToOrder();

  const handleSelectDesigner = (designer: Designer) => {
    if (state.selectedDesigner?.id === designer.id) {
      setSelectedDesigner(null);
    } else {
      setSelectedDesigner(designer);
    }
  };

  const handleProceed = () => {
    if (state.selectedDesigner) {
      setCurrentStep(3);
      onProceed();
    }
  };

  return (
    <section className="py-12 md:py-20 bg-secondary/10">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-serif font-light tracking-wide mb-4">
            Choose Your Designer
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Select a designer who resonates with your style. They'll personally
            guide your customization journey.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {categoryFilters.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className={cn(
                "rounded-full px-5",
                selectedCategory === category &&
                  "bg-[#C9A56B] hover:bg-[#D6285F] border-[#C9A56B]"
              )}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Designer Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {designers?.map((designer) => {
              const isSelected = state.selectedDesigner?.id === designer.id;

              return (
                <Card
                  key={designer.id}
                  onClick={() => handleSelectDesigner(designer)}
                  className={cn(
                    "group relative overflow-hidden cursor-pointer transition-all duration-300",
                    "border-2 rounded-2xl",
                    isSelected
                      ? "border-[#C9A56B] ring-4 ring-[#C9A56B]/20"
                      : "border-transparent hover:border-[#C9A56B]/30"
                  )}
                >
                  {/* Image */}
                  <div className="aspect-[3/4] relative">
                    <img
                      src={designer.profile_image || "/placeholder.svg"}
                      alt={designer.brand_name}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Selected Indicator */}
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[#C9A56B] flex items-center justify-center">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                    )}

                    {/* Category Badge */}
                    <Badge
                      variant="secondary"
                      className="absolute top-3 left-3 bg-white/90 text-foreground text-xs"
                    >
                      {designer.category}
                    </Badge>

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-white font-medium text-base md:text-lg leading-tight">
                        {designer.brand_name}
                      </h3>
                      <div className="flex items-center gap-1 text-white/70 text-sm mt-1">
                        <MapPin className="w-3 h-3" />
                        <span>{designer.city}</span>
                      </div>
                      <p className="text-white/60 text-xs mt-1">
                        {designer.price_range}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* No Results */}
        {!isLoading && designers?.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No designers found for this category.
            </p>
          </div>
        )}

        {/* Proceed Button */}
        <div className="flex justify-center mt-12">
          <Button
            onClick={handleProceed}
            disabled={!state.selectedDesigner}
            size="lg"
            className="bg-gradient-to-r from-[#C9A56B] to-[#D6285F] hover:from-[#D6285F] hover:to-[#8B6914] text-white px-10"
          >
            Continue with {state.selectedDesigner?.brand_name || "Designer"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
};
