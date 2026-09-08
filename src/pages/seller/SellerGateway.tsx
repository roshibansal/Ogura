import { useEffect } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useSellerStatus } from "@/hooks/useSellerStatus";
import { applyDemoFromUrl } from "@/lib/seller/demoSeller";
import { SellerPublicLayout } from "@/layouts/SellerPublicLayout";
import SellerLanding from "@/pages/seller/SellerLanding";
import { SellerApplicationForm } from "@/components/seller/SellerApplicationForm";
import { SellerReviewStatus } from "@/components/seller/SellerReviewStatus";
import { DemoStageControl } from "@/components/seller/DemoStageControl";

/**
 * `/sell` — the one door into the seller side of Ogura.
 *
 * It used to be two: a marketing page that asked you to apply, and a header
 * link that dropped you straight into a dashboard you were auto-approved for.
 * Now a single route answers "what should this person see?" and verification
 * is a real gate rather than a claim on a landing page.
 */
export default function SellerGateway() {
  const location = useLocation();
  const navigate = useNavigate();
  const { stage, seller, identity, isDemo, loading, refresh } = useSellerStatus();

  // `?demo=review` etc. drops straight into a stage, then cleans the URL.
  useEffect(() => {
    if (applyDemoFromUrl(location.search)) {
      navigate(location.pathname, { replace: true });
    }
  }, [location.search, location.pathname, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-wash">
        <Loader2 className="h-7 w-7 animate-spin text-[#D6285F]" />
      </div>
    );
  }

  if (stage === "active") {
    return <Navigate to="/seller/dashboard" replace />;
  }

  return (
    <>
      {stage === "anonymous" && (
        <SellerPublicLayout>
          <SellerLanding />
        </SellerPublicLayout>
      )}

      {stage === "application" && (
        <SellerApplicationForm identity={identity} isDemo={isDemo} onSubmitted={refresh} />
      )}

      {(stage === "review" || stage === "rejected") && (
        <SellerReviewStatus
          seller={seller}
          identity={identity}
          rejected={stage === "rejected"}
        />
      )}

      <DemoStageControl />
    </>
  );
}
