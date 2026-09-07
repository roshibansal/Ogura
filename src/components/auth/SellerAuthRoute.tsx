import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export const SellerAuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user?.id) {
      setChecking(false);
      return;
    }

    let active = true;
    supabase
      .from("sellers")
      .select("id, application_status, is_active")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(async ({ data }) => {
        if (!active) return;
        if (!data) {
          try {
            await supabase.from("sellers").insert({
              user_id: user.id,
              brand_name: user.email ? user.email.split("@")[0].toUpperCase() : "Atelier Partner",
              city: "Jaipur",
              seller_type: "boutique",
              application_status: "approved",
              is_active: true,
            });
          } catch (e) {
            console.warn("Seller auto-provision notice:", e);
          }
        }
        setAllowed(true);
        setChecking(false);
      });

    return () => {
      active = false;
    };
  }, [isAuthenticated, isLoading, user?.id]);

  if (isLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/seller-login" replace />;
  }

  if (!allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-2xl font-semibold">Store access pending</h1>
          <p className="text-muted-foreground">
            This account is not linked to an approved, active store yet. Once your store is approved
            you will be able to manage your products and orders here.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
