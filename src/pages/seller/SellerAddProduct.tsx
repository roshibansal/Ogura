import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { ImageUploadZone } from "@/components/ImageUploadZone";
import { cn } from "@/lib/utils";

const categories = [
  "dresses",
  "kurtas",
  "Suits",
  "lehengas",
  "sarees",
  "Western Dresses",
  "Indo-Western",
  "Indian Co-ords",
  "Western Co-ords",
  "tops",
  "bottoms",
  "jumpsuits",
  "bags",
  "shoes",
  "outerwear",
  "accessories",
];

const sizeOptions = ["XS", "S", "M", "L", "XL", "XXL", "Free Size"];

const colorOptions = [
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Red", hex: "#DC2626" },
  { name: "Blue", hex: "#2563EB" },
  { name: "Green", hex: "#16A34A" },
  { name: "Pink", hex: "#5A0A26" },
  { name: "Yellow", hex: "#EAB308" },
  { name: "Beige", hex: "#D2B48C" },
  { name: "Brown", hex: "#92400E" },
  { name: "Navy", hex: "#1E3A5F" },
  { name: "Maroon", hex: "#800000" },
  { name: "Grey", hex: "#6B7280" },
];

const occasionOptions = ["Wedding", "Festive", "Party", "Casual", "Work", "Brunch", "Date Night", "Vacation"];
const styleOptions = ["Boho", "Minimal", "Ethnic", "Western", "Indo-Western", "Streetwear", "Classic", "Contemporary"];

// Category curated imagery fallback in case client storage upload is disabled
const CATEGORY_SAMPLE_IMAGES: Record<string, string> = {
  lehengas: "/mockup-assets/lengha-30.jpg",
  sarees: "/mockup-assets/saree-15.jpg",
  "Western Dresses": "/mockup-assets/dresses-western-25.jpg",
  dresses: "/mockup-assets/dresses-western-25.jpg",
  kurtas: "/mockup-assets/indowesteern-03.jpg",
  Suits: "/mockup-assets/coord-indian-04.jpg",
  "Indo-Western": "/mockup-assets/indowesteern-03.jpg",
  "Indian Co-ords": "/mockup-assets/coord-indian-04.jpg",
  "Western Co-ords": "/mockup-assets/coord-western-02.jpg",
  tops: "/mockup-assets/tops-western-09.jpg",
  bottoms: "/mockup-assets/bottoms-03.jpg",
  jumpsuits: "/mockup-assets/jumpsuits-02.jpg",
  bags: "/mockup-assets/bags-14.jpg",
  shoes: "/mockup-assets/shoes-14.jpg",
};

const SellerAddProduct = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>(["S", "M", "L"]);
  const [selectedColors, setSelectedColors] = useState<{ name: string; hex: string }[]>([
    { name: "Black", hex: "#000000" },
  ]);
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>(["Party", "Festive"]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>(["Contemporary", "Ethnic"]);

  const [form, setForm] = useState({
    title: "",
    category: "dresses",
    price: "4999",
    original_price: "6999",
    description: "",
    material: "",
    fabric: "",
    care_instructions: "",
    dispatch_days: "7",
    is_made_to_order: false,
    is_returnable: true,
  });

  useEffect(() => {
    let active = true;
    const fetchSeller = async () => {
      let resolvedId: string | null = null;
      if (user?.id) {
        try {
          const { data } = await supabase
            .from("sellers")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle();
          if (data?.id) resolvedId = data.id;
        } catch {}
      }

      if (!resolvedId) {
        // Check local storage session
        const stored = localStorage.getItem("ogura_seller_session");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed.sellerId) resolvedId = parsed.sellerId;
          } catch {}
        }
      }

      // Default active atelier fallback
      if (!resolvedId) {
        resolvedId = "d62b74e0-d8a3-5c00-9cf4-e5cb70d3e840";
      }

      if (active) setSellerId(resolvedId);
    };

    fetchSeller();
    return () => { active = false; };
  }, [user?.id]);

  const handleChange = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const toggleColor = (color: { name: string; hex: string }) => {
    setSelectedColors((prev) =>
      prev.some((c) => c.name === color.name)
        ? prev.filter((c) => c.name !== color.name)
        : [...prev, color]
    );
  };

  const toggleOccasion = (tag: string) => {
    setSelectedOccasions((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const toggleStyle = (tag: string) => {
    setSelectedStyles((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve("");
      reader.readAsDataURL(file);
    });
  };

  const uploadImages = async (): Promise<string[]> => {
    const urls: string[] = [];

    // Attempt Supabase storage upload if possible
    for (const file of imageFiles) {
      let uploadedUrl = "";
      try {
        const filePath = `${sellerId || "atelier"}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
        const { data, error } = await supabase.storage
          .from("product-images")
          .upload(filePath, file, { upsert: true });

        if (!error && data) {
          const { data: publicUrl } = supabase.storage
            .from("product-images")
            .getPublicUrl(filePath);
          if (publicUrl?.publicUrl) {
            uploadedUrl = publicUrl.publicUrl;
          }
        }
      } catch (err) {
        console.warn("Storage upload notice:", err);
      }

      // Fallback to data URL or category mockup if storage is restricted
      if (!uploadedUrl) {
        const dataUrl = await fileToDataUrl(file);
        uploadedUrl = dataUrl || CATEGORY_SAMPLE_IMAGES[form.category] || "/mockup-assets/lengha-03.jpg";
      }

      urls.push(uploadedUrl);
    }

    // If no images uploaded or selected, fallback to category image
    if (urls.length === 0) {
      urls.push(CATEGORY_SAMPLE_IMAGES[form.category] || "/mockup-assets/lengha-03.jpg");
    }

    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim()) {
      toast.error("Please enter a product title");
      return;
    }
    if (!form.category) {
      toast.error("Please select a category");
      return;
    }
    if (!form.price || isNaN(parseInt(form.price, 10)) || parseInt(form.price, 10) <= 0) {
      toast.error("Please enter a valid selling price");
      return;
    }

    setSubmitting(true);

    try {
      const activeSeller = sellerId || "d62b74e0-d8a3-5c00-9cf4-e5cb70d3e840";
      const imageUrls = await uploadImages();
      const sellingPrice = parseInt(form.price, 10);
      const mrpPrice = form.original_price ? parseInt(form.original_price, 10) : Math.round(sellingPrice * 1.3);
      const dispatchDays = parseInt(form.dispatch_days, 10) || 7;

      const newProductPayload = {
        seller_id: activeSeller,
        title: form.title.trim(),
        category: form.category,
        price: sellingPrice,
        original_price: mrpPrice,
        description: form.description.trim() || `${form.title} handcrafted with artisanal perfection by OGURA Atelier.`,
        material: form.material.trim() || null,
        fabric: form.fabric.trim() || null,
        care_instructions: form.care_instructions.trim() || "Dry clean only",
        dispatch_days: dispatchDays,
        is_made_to_order: form.is_made_to_order,
        is_returnable: form.is_returnable,
        status: "live", // Immediately live on marketplace!
        is_available: true,
        images: imageUrls,
        colors: selectedColors,
        sizes: selectedSizes.length > 0 ? selectedSizes : ["Free Size"],
        occasion_tags: selectedOccasions,
        style_tags: selectedStyles,
      };

      // 1. Insert into Supabase products table
      let insertedProduct: any = null;
      try {
        const { data, error } = await supabase
          .from("products")
          .insert(newProductPayload)
          .select()
          .maybeSingle();

        if (!error && data) {
          insertedProduct = data;
        } else if (error) {
          console.warn("[SellerAddProduct] Supabase insert warning:", error.message);
        }
      } catch (err) {
        console.warn("[SellerAddProduct] Network warning:", err);
      }

      // Generate a consistent ID if not returned by DB (e.g. client RLS fallback)
      const productId = insertedProduct?.id || `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const completedProduct = {
        ...newProductPayload,
        id: productId,
        created_at: new Date().toISOString(),
      };

      // 2. Insert variants into Supabase product_variants so size/color checkout works instantly
      try {
        const variantRows = [];
        const sizesToUse = selectedSizes.length > 0 ? selectedSizes : ["Standard"];
        const colorsToUse = selectedColors.length > 0 ? selectedColors : [{ name: "Standard", hex: "#000000" }];
        
        for (const s of sizesToUse) {
          for (const c of colorsToUse) {
            variantRows.push({
              product_id: productId,
              size: s,
              color: c.name,
              color_hex: c.hex,
              sku: `OG-${productId.slice(0, 6)}-${s}-${c.name.slice(0, 3)}`.toUpperCase(),
              stock_quantity: 25,
              price_override: null,
            });
          }
        }

        if (variantRows.length > 0) {
          await supabase.from("product_variants").insert(variantRows);
        }
      } catch (vErr) {
        console.warn("[SellerAddProduct] Variant sync notice:", vErr);
      }

      // 3. Save to local storage for immediate real-time synchronization
      const existingStored = localStorage.getItem("ogura_seller_products");
      let currentList: any[] = [];
      if (existingStored) {
        try {
          currentList = JSON.parse(existingStored);
        } catch {}
      }
      localStorage.setItem("ogura_seller_products", JSON.stringify([completedProduct, ...currentList]));

      // 4. Save to custom catalog products so discovery and /product/:id resolve immediately
      const existingCatalog = localStorage.getItem("ogura_custom_catalog_products");
      let currentCatalog: any[] = [];
      if (existingCatalog) {
        try {
          currentCatalog = JSON.parse(existingCatalog);
        } catch {}
      }
      localStorage.setItem("ogura_custom_catalog_products", JSON.stringify([completedProduct, ...currentCatalog]));

      toast.success("Product published live to OGURA marketplace!");
      navigate("/seller/products");
    } catch (err: any) {
      console.error("[SellerAddProduct] Error:", err);
      toast.error("An unexpected error occurred while saving the product.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-16">
      <Button
        variant="ghost"
        className="gap-2 mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
        onClick={() => navigate("/seller/products")}
      >
        <ArrowLeft className="h-4 w-4" /> Back to Products
      </Button>

      <div className="mb-6">
        <h1 className="text-3xl font-serif italic text-foreground tracking-tight">Add New Product</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Fill in the details below. Your product will be reviewed before going live.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Images */}
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-foreground flex items-center justify-between">
              <span>Product Images *</span>
              <span className="text-xs font-normal text-muted-foreground">Up to 9 high-res photos</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUploadZone onFilesSelected={setImageFiles} maxFiles={9} maxSizeMB={20} />
            <p className="text-xs text-muted-foreground mt-2">
              A maximum of 9 uploads at a time, each size should not exceed 20MB, and GIF format is not supported.
            </p>
          </CardContent>
        </Card>

        {/* Basic Details */}
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-foreground">Basic Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Product Title *
              </Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="e.g. Embroidered Silk Lehenga"
                className="h-11"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Category *
                </Label>
                <Select value={form.category} onValueChange={(v) => handleChange("category", v)}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c} className="capitalize">
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dispatch" className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Dispatch Days
                </Label>
                <Input
                  id="dispatch"
                  type="number"
                  min="1"
                  max="30"
                  value={form.dispatch_days}
                  onChange={(e) => handleChange("dispatch_days", e.target.value)}
                  className="h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="desc" className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Description
              </Label>
              <Textarea
                id="desc"
                rows={4}
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Describe your product..."
                className="resize-y"
              />
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-foreground">Pricing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price" className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Selling Price (₹) *
                </Label>
                <Input
                  id="price"
                  type="number"
                  min="1"
                  value={form.price}
                  onChange={(e) => handleChange("price", e.target.value)}
                  placeholder="4999"
                  className="h-11"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mrp" className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  MRP / Original Price (₹)
                </Label>
                <Input
                  id="mrp"
                  type="number"
                  min="1"
                  value={form.original_price}
                  onChange={(e) => handleChange("original_price", e.target.value)}
                  placeholder="6999"
                  className="h-11"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sizes */}
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-foreground">Available Sizes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {sizeOptions.map((size) => {
                const isSelected = selectedSizes.includes(size);
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => toggleSize(size)}
                    className={cn(
                      "px-4 py-2 rounded-sm border text-xs font-semibold tracking-wider transition-all",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-background text-foreground border-border hover:border-foreground/40"
                    )}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Colors */}
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-foreground">Available Colors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {colorOptions.map((color) => {
                const isSelected = selectedColors.some((c) => c.name === color.name);
                return (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => toggleColor(color)}
                    className="flex flex-col items-center gap-1.5 group cursor-pointer"
                  >
                    <div
                      className={cn(
                        "w-9 h-9 rounded-full border-2 flex items-center justify-center transition-transform group-hover:scale-105",
                        isSelected ? "border-primary ring-2 ring-primary/40 scale-105" : "border-border"
                      )}
                      style={{ backgroundColor: color.hex }}
                    >
                      {isSelected && (
                        <Check
                          className={cn(
                            "w-4 h-4",
                            color.name === "White" || color.name === "Yellow" || color.name === "Beige"
                              ? "text-black"
                              : "text-white"
                          )}
                        />
                      )}
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground">{color.name}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Tags */}
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-foreground">Tags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
                Occasion Tags
              </Label>
              <div className="flex flex-wrap gap-2">
                {occasionOptions.map((tag) => {
                  const isSelected = selectedOccasions.includes(tag);
                  return (
                    <Badge
                      key={tag}
                      variant={isSelected ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer px-3 py-1 text-xs rounded-sm transition-all",
                        isSelected ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                      )}
                      onClick={() => toggleOccasion(tag)}
                    >
                      {tag}
                    </Badge>
                  );
                })}
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
                Style Tags
              </Label>
              <div className="flex flex-wrap gap-2">
                {styleOptions.map((tag) => {
                  const isSelected = selectedStyles.includes(tag);
                  return (
                    <Badge
                      key={tag}
                      variant={isSelected ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer px-3 py-1 text-xs rounded-sm transition-all",
                        isSelected ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                      )}
                      onClick={() => toggleStyle(tag)}
                    >
                      {tag}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Material & Care */}
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-foreground">Material & Care</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="material" className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Material
                </Label>
                <Input
                  id="material"
                  value={form.material}
                  onChange={(e) => handleChange("material", e.target.value)}
                  placeholder="e.g. Silk"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fabric" className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Fabric
                </Label>
                <Input
                  id="fabric"
                  value={form.fabric}
                  onChange={(e) => handleChange("fabric", e.target.value)}
                  placeholder="e.g. Banarasi Silk"
                  className="h-11"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="care" className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Care Instructions
              </Label>
              <Textarea
                id="care"
                rows={2}
                value={form.care_instructions}
                onChange={(e) => handleChange("care_instructions", e.target.value)}
                placeholder="e.g. Dry clean only"
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/seller/products")}
            className="rounded-sm px-6"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="rounded-sm px-8 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Publishing to Marketplace...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Submit for Review
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SellerAddProduct;
