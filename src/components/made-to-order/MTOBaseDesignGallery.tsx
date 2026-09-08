import { useState } from "react";
import { useMadeToOrder, BaseDesign } from "@/contexts/MadeToOrderContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const categoryFilters = ["All", "Lehenga", "Saree", "Gown", "Anarkali", "Suit"];

const baseDesigns: BaseDesign[] = [
  {
    id: "1",
    name: "Classic Bridal Lehenga",
    image: "https://images.unsplash.com/photo-1617922001439-4a2e6562f328?w=600&q=80",
    startingPrice: 85000,
    category: "Lehenga",
  },
  {
    id: "2",
    name: "Embroidered Silk Saree",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=80",
    startingPrice: 45000,
    category: "Saree",
  },
  {
    id: "3",
    name: "Contemporary Fusion Gown",
    image: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600&q=80",
    startingPrice: 65000,
    category: "Gown",
  },
  {
    id: "4",
    name: "Royal Anarkali Set",
    image: "https://images.unsplash.com/photo-1594819047050-99defca82545?w=600&q=80",
    startingPrice: 38000,
    category: "Anarkali",
  },
  {
    id: "5",
    name: "Designer Sharara Suit",
    image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600&q=80",
    startingPrice: 42000,
    category: "Suit",
  },
  {
    id: "6",
    name: "Velvet Reception Lehenga",
    image: "https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=600&q=80",
    startingPrice: 95000,
    category: "Lehenga",
  },
  {
    id: "7",
    name: "Pastel Organza Saree",
    image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=80",
    startingPrice: 52000,
    category: "Saree",
  },
  {
    id: "8",
    name: "Floor Length Anarkali",
    image: "https://images.unsplash.com/photo-1617019114583-affb34d1b3cd?w=600&q=80",
    startingPrice: 48000,
    category: "Anarkali",
  },
];

interface MTOBaseDesignGalleryProps {
  onProceed: () => void;
}

export const MTOBaseDesignGallery = ({ onProceed }: MTOBaseDesignGalleryProps) => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const { state, setSelectedBaseDesign, setCurrentStep } = useMadeToOrder();

  const filteredDesigns =
    selectedCategory === "All"
      ? baseDesigns
      : baseDesigns.filter((d) => d.category === selectedCategory);

  const handleSelectDesign = (design: BaseDesign) => {
    if (state.selectedBaseDesign?.id === design.id) {
      setSelectedBaseDesign(null);
    } else {
      setSelectedBaseDesign(design);
    }
  };

  const handleProceed = () => {
    if (state.selectedBaseDesign) {
      setCurrentStep(3);
      onProceed();
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <section className="py-12 md:py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-serif font-light tracking-wide mb-4">
            Choose a Base Design
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Start with one of our signature designs and customize it to make it
            uniquely yours.
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
                  "bg-[#C9A56B] hover:bg-[#5A0A26] border-[#C9A56B]"
              )}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Design Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {filteredDesigns.map((design) => {
            const isSelected = state.selectedBaseDesign?.id === design.id;

            return (
              <Card
                key={design.id}
                onClick={() => handleSelectDesign(design)}
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
                    src={design.image}
                    alt={design.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

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
                    {design.category}
                  </Badge>

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-white font-medium text-sm md:text-base leading-tight">
                      {design.name}
                    </h3>
                    <p className="text-[#C9A56B] text-sm mt-1 font-medium">
                      Starting from {formatPrice(design.startingPrice)}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Proceed Button */}
        <div className="flex justify-center mt-12">
          <Button
            onClick={handleProceed}
            disabled={!state.selectedBaseDesign}
            size="lg"
            className="bg-gradient-to-r from-[#C9A56B] to-[#5A0A26] hover:from-[#5A0A26] hover:to-[#8B6914] text-white px-10"
          >
            Customize This Design
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
};
