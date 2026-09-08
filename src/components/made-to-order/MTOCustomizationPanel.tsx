import { useState, useEffect } from "react";
import { useMadeToOrder } from "@/contexts/MadeToOrderContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, Sparkles, Info, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { triggerSocialPost, generateSocialDescription } from "@/services/socialPostService";

const dressTypes = ["Lehenga", "Saree", "Gown", "Anarkali", "Suit"];
const fabrics = [
  { name: "Silk", priceMultiplier: 1.0 },
  { name: "Velvet", priceMultiplier: 1.2 },
  { name: "Georgette", priceMultiplier: 0.8 },
  { name: "Organza", priceMultiplier: 1.1 },
  { name: "Net", priceMultiplier: 0.7 },
  { name: "Brocade", priceMultiplier: 1.3 },
];
const colors = [
  { name: "Maroon", value: "#8B0000" },
  { name: "Royal Blue", value: "#4169E1" },
  { name: "Emerald", value: "#50C878" },
  { name: "Gold", value: "#C9A56B" },
  { name: "Blush Pink", value: "#FFB6C1" },
  { name: "Ivory", value: "#FFFFF0" },
  { name: "Burgundy", value: "#722F37" },
  { name: "Teal", value: "#008080" },
  { name: "Champagne", value: "#F7E7CE" },
  { name: "Navy", value: "#000080" },
  { name: "Coral", value: "#FF7F50" },
  { name: "Lavender", value: "#E6E6FA" },
];
const embroideryLevels = [
  { name: "Minimal", priceAdd: 0, description: "Subtle accents" },
  { name: "Moderate", priceAdd: 15000, description: "Balanced detailing" },
  { name: "Heavy", priceAdd: 35000, description: "Rich embellishments" },
  { name: "Royal", priceAdd: 60000, description: "Opulent craftsmanship" },
];

interface MTOCustomizationPanelProps {
  onProceed: () => void;
}

export const MTOCustomizationPanel = ({ onProceed }: MTOCustomizationPanelProps) => {
  const { state, setCustomizations, setCurrentStep, setConsentToSocialShare } = useMadeToOrder();
  const [estimatedPrice, setEstimatedPrice] = useState<[number, number]>([45000, 65000]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const basePrice = state.selectedBaseDesign?.startingPrice || 50000;

  useEffect(() => {
    // Calculate price based on selections
    const fabric = fabrics.find((f) => f.name === state.customizations.fabric);
    const embroidery = embroideryLevels.find(
      (e) => e.name === state.customizations.embroideryLevel
    );

    const multiplier = fabric?.priceMultiplier || 1;
    const embroideryAdd = embroidery?.priceAdd || 0;

    const minPrice = Math.round(basePrice * multiplier + embroideryAdd);
    const maxPrice = Math.round(minPrice * 1.3);

    setEstimatedPrice([minPrice, maxPrice]);
  }, [state.customizations, basePrice]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleProceed = async () => {
    setIsSubmitting(true);
    
    // Trigger social post if user consented
    if (state.consentToSocialShare) {
      const colorName = colors.find(c => c.value === state.customizations.color)?.name || "Custom";
      const description = generateSocialDescription(
        {
          ...state.customizations,
          color: colorName,
          colorHex: state.customizations.color,
        },
        state.selectedDesigner?.brand_name
      );

      await triggerSocialPost({
        title: `Custom ${state.customizations.fabric} ${state.customizations.dressType}`,
        description,
        imageUrl: state.selectedBaseDesign?.image || "",
        designerName: state.selectedDesigner?.brand_name,
        designerCity: state.selectedDesigner?.city,
        customizations: {
          ...state.customizations,
          color: colorName,
          colorHex: state.customizations.color,
        },
        priceRange: `${formatPrice(estimatedPrice[0])} - ${formatPrice(estimatedPrice[1])}`,
        occasion: state.occasion,
        pageUrl: window.location.href,
      });
    }

    setIsSubmitting(false);
    setCurrentStep(4);
    onProceed();
  };

  return (
    <section className="py-12 md:py-20 bg-secondary/10">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-serif font-light tracking-wide mb-4">
            Customize Your Design
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Personalize every detail. Our designer will review and refine your
            selections.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 max-w-6xl mx-auto">
          {/* Preview Area */}
          <div className="lg:col-span-3">
            <Card className="overflow-hidden rounded-2xl">
              <div className="aspect-[4/5] relative bg-muted">
                <img
                  src={
                    state.selectedBaseDesign?.image ||
                    "https://images.unsplash.com/photo-1617922001439-4a2e6562f328?w=800&q=90"
                  }
                  alt="Design Preview"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {/* Color Overlay Indicator */}
                <div
                  className="absolute bottom-4 left-4 w-12 h-12 rounded-full border-4 border-white shadow-lg"
                  style={{ backgroundColor: state.customizations.color }}
                />
              </div>
            </Card>

            {/* Designer Info */}
            {state.selectedDesigner && (
              <Card className="mt-4 p-4 flex items-center gap-4">
                <img
                  src={state.selectedDesigner.profile_image || "/placeholder.svg"}
                  alt={state.selectedDesigner.brand_name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Designed with
                  </p>
                  <p className="font-medium">
                    {state.selectedDesigner.brand_name}
                  </p>
                </div>
              </Card>
            )}
          </div>

          {/* Customization Controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* Dress Type */}
            <Card className="p-5">
              <Label className="text-sm font-medium mb-3 block">
                Dress Type
              </Label>
              <Tabs
                value={state.customizations.dressType}
                onValueChange={(v) => setCustomizations({ dressType: v })}
              >
                <TabsList className="grid grid-cols-3 gap-1 h-auto">
                  {dressTypes.slice(0, 3).map((type) => (
                    <TabsTrigger
                      key={type}
                      value={type}
                      className="text-xs py-2 data-[state=active]:bg-[#C9A56B] data-[state=active]:text-white"
                    >
                      {type}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <TabsList className="grid grid-cols-2 gap-1 h-auto mt-1">
                  {dressTypes.slice(3).map((type) => (
                    <TabsTrigger
                      key={type}
                      value={type}
                      className="text-xs py-2 data-[state=active]:bg-[#C9A56B] data-[state=active]:text-white"
                    >
                      {type}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </Card>

            {/* Fabric */}
            <Card className="p-5">
              <Label className="text-sm font-medium mb-3 block">
                Fabric (Designer-Approved)
              </Label>
              <Select
                value={state.customizations.fabric}
                onValueChange={(v) => setCustomizations({ fabric: v })}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select fabric" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  {fabrics.map((fabric) => (
                    <SelectItem key={fabric.name} value={fabric.name}>
                      {fabric.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Card>

            {/* Color Palette */}
            <Card className="p-5">
              <Label className="text-sm font-medium mb-3 block">
                Color Palette
              </Label>
              <div className="grid grid-cols-6 gap-2">
                {colors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setCustomizations({ color: color.value })}
                    className={cn(
                      "w-full aspect-square rounded-full transition-all duration-200",
                      "ring-offset-2 ring-offset-background",
                      state.customizations.color === color.value
                        ? "ring-2 ring-[#C9A56B] scale-110"
                        : "hover:scale-105"
                    )}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Selected:{" "}
                {colors.find((c) => c.value === state.customizations.color)
                  ?.name || "Custom"}
              </p>
            </Card>

            {/* Embroidery Level */}
            <Card className="p-5">
              <Label className="text-sm font-medium mb-3 block">
                Embroidery Level
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {embroideryLevels.map((level) => (
                  <button
                    key={level.name}
                    onClick={() =>
                      setCustomizations({ embroideryLevel: level.name })
                    }
                    className={cn(
                      "p-3 rounded-lg text-left transition-all duration-200 border",
                      state.customizations.embroideryLevel === level.name
                        ? "border-[#C9A56B] bg-[#C9A56B]/10"
                        : "border-border hover:border-[#C9A56B]/50"
                    )}
                  >
                    <p className="font-medium text-sm">{level.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {level.description}
                    </p>
                  </button>
                ))}
              </div>
            </Card>

            {/* Price Estimate */}
            <Card className="p-5 bg-gradient-to-br from-[#C9A56B]/5 to-[#C9A56B]/10 border-[#C9A56B]/20">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Estimated Price Range
                  </p>
                  <p className="text-2xl font-serif font-medium text-[#C9A56B]">
                    {formatPrice(estimatedPrice[0])} -{" "}
                    {formatPrice(estimatedPrice[1])}
                  </p>
                </div>
                <Info className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Final price confirmed by designer after review
              </p>
            </Card>

            {/* Social Share Consent */}
            <Card className="p-5 border-dashed">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="social-consent"
                  checked={state.consentToSocialShare}
                  onCheckedChange={(checked) => setConsentToSocialShare(checked === true)}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <Label
                    htmlFor="social-consent"
                    className="text-sm font-medium cursor-pointer flex items-center gap-2"
                  >
                    <Share2 className="w-4 h-4 text-muted-foreground" />
                    Feature my design on Ogura's social media
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Help inspire others by sharing your custom creation
                  </p>
                </div>
              </div>
            </Card>

            {/* Proceed Button */}
            <Button
              onClick={handleProceed}
              size="lg"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-[#C9A56B] to-[#D6285F] hover:from-[#D6285F] hover:to-[#8B6914] text-white"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {isSubmitting ? "Processing..." : "Generate Design Variations"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
