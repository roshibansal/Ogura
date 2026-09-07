import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUploadZone } from "@/components/ImageUploadZone";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { z } from "zod";

const applicationSchema = z.object({
  full_name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  brand_name: z.string().trim().min(2, "Brand name must be at least 2 characters").max(100),
  email: z.string().trim().email("Please enter a valid email"),
  phone: z.string().trim().min(10, "Please enter a valid phone number").max(15),
  city: z.string().trim().min(2, "City is required").max(100),
  category: z.string().min(1, "Please select a category"),
  portfolio_link: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
});

const SellerApply = () => {
  const [form, setForm] = useState({
    full_name: "",
    brand_name: "",
    email: "",
    phone: "",
    city: "",
    category: "",
    portfolio_link: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const uploadImages = async (): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of imageFiles) {
      const ext = file.name.split(".").pop();
      const path = `applications/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
      urls.push(urlData.publicUrl);
    }
    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = applicationSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setSubmitting(true);
    try {
      const imageUrls = imageFiles.length > 0 ? await uploadImages() : [];
      const { error } = await supabase.from("seller_applications" as any).insert({
        full_name: form.full_name.trim(),
        brand_name: form.brand_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        city: form.city.trim(),
        category: form.category,
        portfolio_link: form.portfolio_link.trim() || null,
        sample_images: imageUrls,
      } as any);
      if (error) throw error;
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-paper text-ink flex flex-col">
        <Header />
        <main className="flex-1 py-20">
          <div className="container mx-auto px-4 max-w-lg text-center">
            <div className="w-16 h-16 bg-green-atelier/10 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-8 h-8 text-green-atelier" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold font-sans text-ink mb-3">
              Application Submitted
            </h1>
            <p className="text-grey-soft text-xs sm:text-sm mb-6 leading-relaxed">
              Your boutique application has been submitted to OGURA. Our curation team will review your catalogue and reach out within 48 hours.
            </p>
            <Link to="/">
              <Button variant="outline" className="gap-2 text-xs">
                <ArrowLeft className="w-4 h-4" /> Back to OGURA
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-2xl">
          <Link to="/join" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>

          <div className="text-center mb-10">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              Apply to Join Ogura
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Fill in your details below. We review each application individually.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <Card className="border-border/50">
              <CardContent className="p-6 md:p-8 space-y-6">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={form.full_name}
                    onChange={(e) => handleChange("full_name", e.target.value)}
                    placeholder="Your full name"
                  />
                  {errors.full_name && <p className="text-sm text-destructive">{errors.full_name}</p>}
                </div>

                {/* Brand Name */}
                <div className="space-y-2">
                  <Label htmlFor="brand_name">Brand / Studio Name *</Label>
                  <Input
                    id="brand_name"
                    value={form.brand_name}
                    onChange={(e) => handleChange("brand_name", e.target.value)}
                    placeholder="Your brand or studio name"
                  />
                  {errors.brand_name && <p className="text-sm text-destructive">{errors.brand_name}</p>}
                </div>

                {/* Email & Phone */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder="you@example.com"
                    />
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={form.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      placeholder="+91 98765 43210"
                    />
                    {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                  </div>
                </div>

                {/* City & Category */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City / Location *</Label>
                    <Input
                      id="city"
                      value={form.city}
                      onChange={(e) => handleChange("city", e.target.value)}
                      placeholder="e.g. Mumbai"
                    />
                    {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <Select value={form.category} onValueChange={(v) => handleChange("category", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Fashion Designer">Fashion Designer</SelectItem>
                        <SelectItem value="Boutique">Boutique</SelectItem>
                        <SelectItem value="Custom Tailor">Custom Tailor</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
                  </div>
                </div>

                {/* Portfolio */}
                <div className="space-y-2">
                  <Label htmlFor="portfolio_link">Portfolio / Instagram Link</Label>
                  <Input
                    id="portfolio_link"
                    value={form.portfolio_link}
                    onChange={(e) => handleChange("portfolio_link", e.target.value)}
                    placeholder="https://instagram.com/yourbrand"
                  />
                  {errors.portfolio_link && <p className="text-sm text-destructive">{errors.portfolio_link}</p>}
                </div>

                {/* Sample Designs */}
                <div className="space-y-2">
                  <Label>Upload Sample Designs</Label>
                  <ImageUploadZone
                    onFilesSelected={setImageFiles}
                    maxFiles={5}
                    maxSizeMB={5}
                  />
                </div>

                <Button type="submit" className="w-full py-6 text-base font-semibold" disabled={submitting}>
                  {submitting ? "Submitting…" : "Submit Application"}
                </Button>
              </CardContent>
            </Card>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SellerApply;
