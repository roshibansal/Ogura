import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useSellerStatus } from "@/hooks/useSellerStatus";
import { DemoStageControl } from "@/components/seller/DemoStageControl";

/**
 * Guards every /seller/* dashboard route.
 *
 * This used to auto-create an `approved`, `is_active` seller row for anyone who
 * signed in, which meant the verification we describe on the landing page did
 * not exist. Now an unverified account is sent back to /sell, where it sees
 * exactly which check is outstanding.
 */
export const SellerAuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { stage, loading, isDemo } = useSellerStatus();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (stage !== "active") {
    return <Navigate to="/sell" replace />;
  }

  return (
    <>
      {children}
      {isDemo && <DemoStageControl />}
    </>
  );
};
