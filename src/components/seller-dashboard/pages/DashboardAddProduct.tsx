import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, X, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ImageUploadZone } from "@/components/ImageUploadZone";

interface Props {
  onBack: () => void;
}

const categories = ["Sarees", "Lehengas", "Suits", "Kurtas", "Dresses", "Tops", "Bottoms", "Accessories"];
const sizeOptions = ["XS", "S", "M", "L", "XL", "XXL", "Free Size"];
const colorOptions = [
  { name: "Black", hex: "#000000" }, { name: "White", hex: "#FFFFFF" },
  { name: "Red", hex: "#EF4444" }, { name: "Blue", hex: "#3B82F6" },
  { name: "Green", hex: "#22C55E" }, { name: "Pink", hex: "#5A0A26" },
  { name: "Beige", hex: "#D4A574" }, { name: "Brown", hex: "#92400E" },
  { name: "Navy", hex: "#1E3A5F" }, { name: "Maroon", hex: "#800000" },
];
const occasionOptions = ["Wedding", "Festive", "Party", "Casual", "Work", "Brunch", "Date Night", "Vacation"];
const styleOptions = ["Boho", "Minimal", "Ethnic", "Western", "Indo-Western", "Streetwear", "Classic", "Contemporary"];


export const DashboardAddProduct = ({ onBack }: Props) => {
  const { user } = useAuth();
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [category, setCategory] = useState("");
  const [material, setMaterial] = useState("");
  const [sizes, setSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<{ name: string; hex: string }[]>([]);
  const [occasionTags, setOccasionTags] = useState<string[]>([]);
  const [styleTags, setStyleTags] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (!user?.id) {
      setSellerId(null);
      setLoading(false);
      return;
    }
    supabase.from("sellers").select("id").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setSellerId(data?.id ?? null));
  }, [user?.id]);

  const toggleSize = (s: string) => setSizes(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);
  const toggleColor = (c: { name: string; hex: string }) =>
    setColors(p => p.find(x => x.name === c.name) ? p.filter(x => x.name !== c.name) : [...p, c]);
  const toggleOccasion = (t: string) => setOccasionTags(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t]);
  const toggleStyle = (t: string) => setStyleTags(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t]);
  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const uploadImages = async (): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of imageFiles) {
      const path = `${sellerId}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
      urls.push(urlData.publicUrl);
    }
    return urls;
  };

  const handleSubmit = async () => {
    if (!sellerId) {
      toast({ title: "Not authorized", description: "You must be an approved seller.", variant: "destructive" });
      return;
    }
    if (!title.trim() || !price || !category) {
      toast({ title: "Missing fields", description: "Title, price, and category are required.", variant: "destructive" });
      return;
    }
    if (imageFiles.length === 0) {
      toast({ title: "No images", description: "Please upload at least one product image.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const imageUrls = await uploadImages();
      const { error } = await supabase.from("products").insert({
        seller_id: sellerId,
        title: title.trim(),
        description: description.trim() || null,
        price: Math.round(Number(price)),
        original_price: originalPrice ? Math.round(Number(originalPrice)) : null,
        category,
        material: material.trim() || null,
        images: imageUrls,
        sizes,
        colors,
        occasion_tags: occasionTags,
        style_tags: styleTags,
        status: "submitted",
        is_available: true,
      });
      if (error) throw error;
      toast({ title: "Product saved!", description: "Your product has been submitted for review." });
      onBack();
    } catch (err: any) {
      toast({ title: "Error saving product", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
        <h1 className="text-xl font-semibold text-foreground">Add product</h1>
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-6">
        <div className="space-y-4">
          {/* Title & Description */}
          <Card className="shadow-sm">
            <CardContent className="p-4 space-y-4">
              <div>
                <Label className="text-xs font-medium">Title *</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Short sleeve t-shirt" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs font-medium">Description</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Write a description..." className="mt-1 min-h-[120px]" />
              </div>
            </CardContent>
          </Card>

          {/* Media */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Media *</CardTitle></CardHeader>
            <CardContent>
              <ImageUploadZone onFilesSelected={setImageFiles} maxFiles={9} maxSizeMB={20} />
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Pricing</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium">Price *</Label>
                  <Input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="₹ 0" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs font-medium">Compare-at price</Label>
                  <Input type="number" value={originalPrice} onChange={e => setOriginalPrice(e.target.value)} placeholder="₹ 0" className="mt-1" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sizes */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Sizes</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {sizeOptions.map(s => (
                  <button key={s} onClick={() => toggleSize(s)}
                    className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${sizes.includes(s) ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:border-primary/50"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Colors */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Colors</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map(c => {
                  const selected = colors.find(x => x.name === c.name);
                  return (
                    <button key={c.name} onClick={() => toggleColor(c)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border transition-colors ${selected ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:border-primary/50"}`}>
                      <span className="w-3 h-3 rounded-full border" style={{ backgroundColor: c.hex }} />
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Tags</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs font-medium mb-2 block">Occasion</Label>
                <div className="flex flex-wrap gap-2">
                  {occasionOptions.map(t => (
                    <Badge key={t} variant={occasionTags.includes(t) ? "default" : "outline"}
                      className="cursor-pointer" onClick={() => toggleOccasion(t)}>{t}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium mb-2 block">Style</Label>
                <div className="flex flex-wrap gap-2">
                  {styleOptions.map(t => (
                    <Badge key={t} variant={styleTags.includes(t) ? "default" : "outline"}
                      className="cursor-pointer" onClick={() => toggleStyle(t)}>{t}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Material */}
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <Label className="text-xs font-medium">Material / Fabric</Label>
              <Input value={material} onChange={e => setMaterial(e.target.value)} placeholder="e.g. Silk, Cotton" className="mt-1" />
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Category *</CardTitle></CardHeader>
            <CardContent>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background">
                <option value="">Select category</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Custom Tags</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input placeholder="Add tag" value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())} />
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {tags.map(t => (
                    <Badge key={t} variant="secondary" className="gap-1">
                      {t}<X className="h-3 w-3 cursor-pointer" onClick={() => setTags(tags.filter(x => x !== t))} />
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>

      <div className="flex justify-end gap-3 pb-4">
        <Button variant="outline" onClick={onBack}>Discard</Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</> : "Save product"}
        </Button>
      </div>
    </div>
  );
};
