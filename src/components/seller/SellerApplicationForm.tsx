import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { setDemoStage } from "@/lib/seller/demoSeller";

const CHECKS = [
  "We look at your existing work — Instagram, lookbook, or studio photos.",
  "We confirm the designs are yours, not resold or dropshipped.",
  "We verify GSTIN or PAN so payouts can settle to your account.",
];

export const SellerApplicationForm = ({
  identity,
  isDemo,
  onSubmitted,
}: {
  identity: { name: string; email: string } | null;
  isDemo: boolean;
  onSubmitted: () => void;
}) => {
  const { user } = useAuth();
  const [brandName, setBrandName] = useState(isDemo ? "Riwaana Atelier" : "");
  const [city, setCity] = useState(isDemo ? "Jaipur" : "");
  const [instagram, setInstagram] = useState(isDemo ? "@riwaana.atelier" : "");
  const [taxId, setTaxId] = useState(isDemo ? "08AABCR1234M1Z9" : "");
  const [sellerType, setSellerType] = useState("boutique");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim() || !city.trim()) {
      toast.error("Please add your brand name and city.");
      return;
    }

    if (isDemo) {
      setDemoStage("review", { brandName, city, instagram });
      toast.success("Application submitted for review");
      onSubmitted();
      return;
    }

    if (!user?.id) {
      toast.error("Please sign in again before applying.");
      return;
    }

    setSubmitting(true);
    // Applications land as `submitted` and unverified. Approval is a human
    // decision made against the checks below — never granted on sign-up.
    const { error } = await supabase.from("sellers").insert({
      user_id: user.id,
      brand_name: brandName.trim(),
      city: city.trim(),
      seller_type: sellerType,
      instagram_handle: instagram.trim() || null,
      gstin: taxId.trim() || null,
      application_status: "submitted",
      is_verified: false,
      is_active: false,
    });
    setSubmitting(false);

    if (error) {
      toast.error(error.message || "Could not submit your application.");
      return;
    }
    toast.success("Application submitted for review");
    onSubmitted();
  };

  return (
    <div className="min-h-screen bg-wash">
      <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-[#5A0A26] mb-3">
            Step 2 of 3 — Your atelier
          </p>
          <h1 className="font-serif text-4xl text-ink mb-3">Tell us about your studio</h1>
          <p className="text-sm text-ink/60 leading-relaxed mb-8 max-w-md">
            {identity ? (
              <>
                Signed in as <strong className="text-ink">{identity.email}</strong>. This is the
                account your dashboard and payouts will be tied to.
              </>
            ) : (
              "This is the account your dashboard and payouts will be tied to."
            )}
          </p>

          <form onSubmit={submit} className="space-y-5 max-w-md">
            <div className="space-y-1.5">
              <Label htmlFor="brand" className="text-xs font-semibold text-ink">
                Brand or studio name
              </Label>
              <Input
                id="brand"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Riwaana Atelier"
                className="h-11 bg-white border-stone"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="city" className="text-xs font-semibold text-ink">
                  City
                </Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Jaipur"
                  className="h-11 bg-white border-stone"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="type" className="text-xs font-semibold text-ink">
                  You are a
                </Label>
                <select
                  id="type"
                  value={sellerType}
                  onChange={(e) => setSellerType(e.target.value)}
                  className="h-11 w-full rounded-md border border-stone bg-white px-3 text-sm text-ink"
                >
                  <option value="boutique">Boutique with a studio</option>
                  <option value="designer">Independent designer</option>
                  <option value="label">Small-batch label</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ig" className="text-xs font-semibold text-ink">
                Instagram <span className="font-normal text-ink/40">— where we see your work</span>
              </Label>
              <Input
                id="ig"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="@yourstudio"
                className="h-11 bg-white border-stone"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tax" className="text-xs font-semibold text-ink">
                GSTIN or PAN <span className="font-normal text-ink/40">— for payouts</span>
              </Label>
              <Input
                id="tax"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder="08AABCR1234M1Z9"
                className="h-11 bg-white border-stone"
              />
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="h-11 px-8 bg-[#5A0A26] hover:bg-[#5A0A26] text-white font-semibold"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Submit for review
            </Button>
          </form>
        </div>

        <aside className="lg:pt-16">
          <div className="rounded-lg border border-line bg-white p-6">
            <div className="flex items-center gap-2 mb-4 text-[#5A0A26]">
              <ShieldCheck className="h-5 w-5" />
              <h2 className="font-semibold text-sm">What happens next</h2>
            </div>
            <ul className="space-y-4">
              {CHECKS.map((c, i) => (
                <li key={c} className="flex gap-3">
                  <span className="shrink-0 mt-0.5 h-5 w-5 rounded-full bg-[#5A0A26]/8 text-[#5A0A26] text-[11px] font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="text-sm text-ink/70 leading-relaxed">{c}</span>
                </li>
              ))}
            </ul>
            <p className="mt-5 pt-5 border-t border-line text-xs text-ink/50 leading-relaxed">
              Verification is the reason a customer trusts what they see on Ogura. It is the one
              step we do not automate.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};
