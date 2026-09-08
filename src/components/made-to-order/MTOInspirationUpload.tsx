import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUploadZone } from "@/components/ImageUploadZone";
import { Sparkles, ArrowRight } from "lucide-react";
import { useMadeToOrder } from "@/contexts/MadeToOrderContext";

const occasions = [
  "Wedding",
  "Reception",
  "Engagement",
  "Sangeet",
  "Mehendi",
  "Cocktail Party",
  "Festival",
  "Anniversary",
  "Birthday",
  "Other",
];

interface MTOInspirationUploadProps {
  onProceed: () => void;
}

export const MTOInspirationUpload = ({ onProceed }: MTOInspirationUploadProps) => {
  const {
    state,
    setInspirationImages,
    setOccasion,
    setBudget,
    setNotes,
  } = useMadeToOrder();

  const [localBudget, setLocalBudget] = useState<number[]>([state.budget[0]]);

  const formatPrice = (value: number) => {
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`;
    }
    return `₹${(value / 1000).toFixed(0)}K`;
  };

  const handleBudgetChange = (value: number[]) => {
    setLocalBudget(value);
    setBudget([value[0], 500000]);
  };

  const handleFilesSelected = (files: File[]) => {
    setInspirationImages(files);
  };

  const canProceed = state.inspirationImages.length > 0 && state.occasion;

  return (
    <section className="py-12 md:py-20 bg-background">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Section Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-serif font-light tracking-wide mb-4">
            Share Your Inspiration
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Upload images that inspire your dream outfit. Our designers will
            bring your vision to life.
          </p>
        </div>

        <div className="space-y-8">
          {/* Image Upload */}
          <Card className="p-6 md:p-8 border-border/50">
            <ImageUploadZone
              onFilesSelected={handleFilesSelected}
              maxFiles={5}
              maxSizeMB={10}
            />
          </Card>

          {/* Style Cues Detected (Placeholder) */}
          {state.inspirationImages.length > 0 && (
            <Card className="p-4 bg-[#C9A56B]/5 border-[#C9A56B]/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#C9A56B]/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-[#C9A56B]" />
                </div>
                <div>
                  <p className="text-sm font-medium">Style Cues Detected</p>
                  <p className="text-xs text-muted-foreground">
                    Traditional, Embroidered, Rich Colors
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Occasion */}
            <div className="space-y-2">
              <Label>Occasion *</Label>
              <Select value={state.occasion} onValueChange={setOccasion}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select occasion" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  {occasions.map((occasion) => (
                    <SelectItem key={occasion} value={occasion}>
                      {occasion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Budget Range */}
            <div className="space-y-4">
              <Label>
                Budget Range:{" "}
                <span className="text-[#C9A56B] font-medium">
                  {formatPrice(localBudget[0])} - {formatPrice(500000)}+
                </span>
              </Label>
              <Slider
                value={localBudget}
                onValueChange={handleBudgetChange}
                min={25000}
                max={500000}
                step={5000}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>₹25K</span>
                <span>₹5L+</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Special Requirements (Optional)</Label>
            <Textarea
              value={state.notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tell us about any specific preferences, colors, styles, or requirements..."
              className="min-h-[120px] resize-none"
            />
          </div>

          {/* Proceed Button */}
          <div className="flex justify-end pt-4">
            <Button
              onClick={onProceed}
              disabled={!canProceed}
              size="lg"
              className="bg-gradient-to-r from-[#C9A56B] to-[#D6285F] hover:from-[#D6285F] hover:to-[#8B6914] text-white px-8"
            >
              Find Matching Designers
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
