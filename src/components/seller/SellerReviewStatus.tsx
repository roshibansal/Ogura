import { Button } from "@/components/ui/button";
import { Check, Clock, Loader2, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import type { SellerRecord } from "@/hooks/useSellerStatus";

type CheckState = "done" | "pending";

const stateFor = (seller: SellerRecord | null): { label: string; detail: string; state: CheckState }[] => [
  {
    label: "Identity confirmed",
    detail: "Signed in with a verified Google account.",
    state: "done",
  },
  {
    label: "Studio details received",
    detail: seller
      ? `${seller.brand_name} — ${seller.city}${seller.instagram_handle ? ` · ${seller.instagram_handle}` : ""}`
      : "Brand name, city and Instagram on file.",
    state: "done",
  },
  {
    label: "Design originality review",
    detail:
      "A person on our team is going through your work to confirm the designs are your own — not resold, not dropshipped.",
    state: "pending",
  },
  {
    label: "Payout details",
    detail: seller?.gstin
      ? "GSTIN on file. Bank verification runs once your studio is approved."
      : "Add a GSTIN or PAN so settlements can reach your account.",
    state: seller?.gstin ? "done" : "pending",
  },
];

export const SellerReviewStatus = ({
  seller,
  identity,
  rejected = false,
}: {
  seller: SellerRecord | null;
  identity: { name: string; email: string } | null;
  rejected?: boolean;
}) => {
  const checks = stateFor(seller);
  const done = checks.filter((c) => c.state === "done").length;

  return (
    <div className="min-h-screen bg-wash">
      <div className="max-w-2xl mx-auto px-4 py-14 sm:py-20">
        <div className="rounded-lg border border-line bg-white overflow-hidden">
          <div className="bg-[#5A0A26] px-7 py-8 text-white">
            <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-white/60 mb-2">
              Step 3 of 3 — Verification
            </p>
            <h1 className="font-serif text-3xl mb-2">
              {rejected ? "We could not verify this studio" : "Your application is with our team"}
            </h1>
            <p className="text-sm text-white/70 leading-relaxed">
              {rejected
                ? "This usually means we could not confirm the designs are original to your studio. Reply to our email and we will take another look."
                : "Most studios hear back within two working days. We will email you the moment your dashboard opens."}
            </p>
          </div>

          {!rejected && (
            <div className="px-7 pt-6">
              <div className="flex items-center justify-between text-xs font-semibold text-ink/60 mb-2">
                <span>{done} of {checks.length} checks complete</span>
                <span>{Math.round((done / checks.length) * 100)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-stone overflow-hidden">
                <div
                  className="h-full bg-[#5A0A26] transition-all duration-700"
                  style={{ width: `${(done / checks.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          <ul className="px-7 py-6 space-y-5">
            {checks.map((c) => (
              <li key={c.label} className="flex gap-3.5">
                <span
                  className={`shrink-0 mt-0.5 h-6 w-6 rounded-full flex items-center justify-center ${
                    c.state === "done"
                      ? "bg-[#0C7A54]/10 text-[#0C7A54]"
                      : "bg-[#5A0A26]/10 text-[#5A0A26]"
                  }`}
                >
                  {c.state === "done" ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Clock className="h-3.5 w-3.5" />
                  )}
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink flex items-center gap-2">
                    {c.label}
                    {c.state === "pending" && !rejected && (
                      <Loader2 className="h-3 w-3 animate-spin text-[#5A0A26]" />
                    )}
                  </p>
                  <p className="text-xs text-ink/55 leading-relaxed mt-0.5">{c.detail}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="px-7 py-5 border-t border-line bg-wash flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-ink/55 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              {identity ? `We'll write to ${identity.email}` : "We'll write to your account email"}
            </p>
            <Button asChild variant="outline" size="sm" className="border-stone text-ink">
              <Link to="/collections">Browse the marketplace</Link>
            </Button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-ink/45 leading-relaxed max-w-md mx-auto">
          Ogura only lists studios whose designs are their own. That check is what a customer is
          really buying when they buy here, so we do it by hand.
        </p>
      </div>
    </div>
  );
};
