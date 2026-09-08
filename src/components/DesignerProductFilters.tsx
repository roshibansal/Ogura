import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ProductFilters } from "@/types";
import { Filter, X } from "lucide-react";

interface DesignerProductFiltersProps {
  categories: string[];
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
}

const COLORS = [
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Red", hex: "#EF4444" },
  { name: "Blue", hex: "#3B82F6" },
  { name: "Green", hex: "#22C55E" },
  { name: "Pink", hex: "#5A0A26" },
  { name: "Yellow", hex: "#EAB308" },
  { name: "Purple", hex: "#A855F7" },
];

const MAX_PRICE = 100000;

export const DesignerProductFilters = ({
  categories,
  filters,
  onFiltersChange,
}: DesignerProductFiltersProps) => {
  const [priceRange, setPriceRange] = useState<[number, number]>(
    filters.priceRange || [0, MAX_PRICE]
  );

  const handleCategoryChange = (category: string) => {
    onFiltersChange({
      ...filters,
      category: filters.category === category ? undefined : category,
    });
  };

  const handlePriceChange = (values: number[]) => {
    const range: [number, number] = [values[0], values[1]];
    setPriceRange(range);
    onFiltersChange({
      ...filters,
      priceRange: range,
    });
  };

  const handleColorToggle = (colorName: string) => {
    const currentColors = filters.colors || [];
    const newColors = currentColors.includes(colorName)
      ? currentColors.filter((c) => c !== colorName)
      : [...currentColors, colorName];
    onFiltersChange({
      ...filters,
      colors: newColors.length > 0 ? newColors : undefined,
    });
  };

  const handleStockToggle = (checked: boolean) => {
    onFiltersChange({
      ...filters,
      inStockOnly: checked || undefined,
    });
  };

  const clearFilters = () => {
    setPriceRange([0, MAX_PRICE]);
    onFiltersChange({});
  };

  const hasActiveFilters =
    filters.category ||
    filters.priceRange ||
    (filters.colors && filters.colors.length > 0) ||
    filters.inStockOnly;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5" />
          <h3 className="font-semibold text-lg">Filters</h3>
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {/* Categories */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">
          Category
        </h4>
        <div className="space-y-3">
          {categories.map((category) => (
            <label
              key={category}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <Checkbox
                checked={filters.category === category}
                onCheckedChange={() => handleCategoryChange(category)}
              />
              <span className="text-sm group-hover:text-primary transition-colors">
                {category}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">
          Price Range
        </h4>
        <Slider
          value={priceRange}
          min={0}
          max={MAX_PRICE}
          step={1000}
          onValueChange={handlePriceChange}
          className="mt-6"
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>₹{priceRange[0].toLocaleString()}</span>
          <span>₹{priceRange[1].toLocaleString()}</span>
        </div>
      </div>

      {/* Colors */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">
          Colors
        </h4>
        <div className="flex flex-wrap gap-3">
          {COLORS.map((color) => (
            <button
              key={color.name}
              onClick={() => handleColorToggle(color.name)}
              className={`w-8 h-8 rounded-full border-2 transition-all ${
                filters.colors?.includes(color.name)
                  ? "ring-2 ring-primary ring-offset-2"
                  : "border-border hover:scale-110"
              }`}
              style={{ backgroundColor: color.hex }}
              title={color.name}
            />
          ))}
        </div>
      </div>

      {/* Availability */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">
          Availability
        </h4>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm">In Stock Only</span>
          <Switch
            checked={filters.inStockOnly || false}
            onCheckedChange={handleStockToggle}
          />
        </label>
      </div>
    </div>
  );
};
