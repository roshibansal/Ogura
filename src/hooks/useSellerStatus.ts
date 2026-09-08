import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  DEMO_EVENT,
  DemoSellerState,
  SellerStage,
  getDemoState,
} from "@/lib/seller/demoSeller";

export interface SellerRecord {
  id: string;
  brand_name: string;
  city: string;
  seller_type: string;
  application_status: string;
  is_verified: boolean | null;
  is_active: boolean | null;
  instagram_handle: string | null;
  gstin: string | null;
  pan_number: string | null;
  created_at?: string | null;
}

export interface SellerStatus {
  /** Where this visitor is in the seller journey. */
  stage: SellerStage | "rejected";
  seller: SellerRecord | null;
  /** Signed-in identity — a real Supabase user, or the demo persona. */
  identity: { name: string; email: string } | null;
  isDemo: boolean;
  loading: boolean;
  refresh: () => void;
}

const demoSellerRecord = (d: DemoSellerState, verified: boolean): SellerRecord => ({
  id: "demo-seller",
  brand_name: d.brandName,
  city: d.city,
  seller_type: d.sellerType,
  application_status: verified ? "approved" : "submitted",
  is_verified: verified,
  is_active: verified,
  instagram_handle: d.instagram,
  gstin: "08AABCR1234M1Z9",
  pan_number: "AABCR1234M",
  created_at: d.submittedAt,
});

/**
 * Resolves the single question the seller entry point needs answered:
 * does this person get the pitch, the application, the review screen,
 * or the dashboard?
 */
export const useSellerStatus = (): SellerStatus => {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [demo, setDemo] = useState<DemoSellerState>(() => getDemoState());
  const [seller, setSeller] = useState<SellerRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    const sync = () => setDemo(getDemoState());
    window.addEventListener(DEMO_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(DEMO_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    if (demo.active) {
      setLoading(false);
      return;
    }
    if (authLoading) return;
    if (!isAuthenticated || !user?.id) {
      setSeller(null);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    supabase
      .from("sellers")
      .select(
        "id, brand_name, city, seller_type, application_status, is_verified, is_active, instagram_handle, gstin, pan_number, created_at",
      )
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        setSeller((data as SellerRecord) ?? null);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [demo.active, authLoading, isAuthenticated, user?.id, nonce]);

  if (demo.active) {
    const verified = demo.stage === "active";
    return {
      stage: demo.stage,
      seller: demo.stage === "anonymous" ? null : demoSellerRecord(demo, verified),
      identity: demo.stage === "anonymous" ? null : { name: demo.name, email: demo.email },
      isDemo: true,
      loading: false,
      refresh,
    };
  }

  const identity =
    isAuthenticated && user ? { name: user.name, email: user.email } : null;

  let stage: SellerStatus["stage"] = "anonymous";
  if (authLoading || loading) {
    stage = "anonymous";
  } else if (!isAuthenticated) {
    stage = "anonymous";
  } else if (!seller) {
    stage = "application";
  } else if (seller.application_status === "rejected") {
    stage = "rejected";
  } else if (
    seller.application_status === "approved" &&
    seller.is_verified === true &&
    seller.is_active !== false
  ) {
    stage = "active";
  } else {
    stage = "review";
  }

  return {
    stage,
    seller,
    identity,
    isDemo: false,
    loading: authLoading || loading,
    refresh,
  };
};
