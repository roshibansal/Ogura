import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Store, Sparkles, ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function SellerLogin() {
  const { isAuthenticated, isLoading, signInWithEmail, signUpWithEmail } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [brandName, setBrandName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    const errorDescription = params.get("error_description");
    if (error) {
      toast.error(errorDescription || "Sign-in failed. Please try again.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/seller/dashboard", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      return toast.error("Please enter both email and password");
    }

    setSubmitting(true);
    const { success, error } = await signInWithEmail(email, password);
    setSubmitting(false);

    if (success) {
      toast.success("Welcome back to your Atelier Portal");
      navigate("/seller/dashboard", { replace: true });
    } else {
      toast.error(error || "Invalid credentials. If you are new, please use Register or Demo Login.");
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      return toast.error("Please enter all required fields");
    }
    if (password.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }

    setSubmitting(true);
    const { success, error } = await signUpWithEmail(email, password);
    setSubmitting(false);

    if (success) {
      toast.success("Atelier account created! Loading your dashboard...");
      navigate("/seller/dashboard", { replace: true });
    } else {
      toast.error(error || "Signup failed. Try signing in or using demo access.");
    }
  };

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    try {
      const { success, error } = await signInWithEmail("atelier.demo@ogura.in", "DemoPassword123!");
      if (success) {
        toast.success("Signed in as Riwaana Atelier Demo Partner");
        navigate("/seller/dashboard", { replace: true });
      } else {
        // Fallback: direct dashboard route if credentials fail
        navigate("/seller/dashboard", { replace: true });
      }
    } catch {
      navigate("/seller/dashboard", { replace: true });
    } finally {
      setDemoLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper text-ink">
        <Loader2 className="h-7 w-7 animate-spin text-rose" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink selection:bg-rose selection:text-white">
      {/* Top Brand Bar */}
      <header className="border-b border-line bg-paper/95 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="font-extrabold text-2xl tracking-[-0.04em] text-rose font-sans">
            OGURA
          </span>
          <span className="text-[10px] uppercase font-bold tracking-[0.14em] text-grey-soft bg-wash px-2 py-0.5 rounded border border-line">
            Atelier Portal
          </span>
        </Link>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-grey-soft hover:text-ink transition font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Marketplace
        </Link>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white border border-stone rounded-sm shadow-sm p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="mx-auto w-10 h-10 rounded-full bg-wash border border-line flex items-center justify-center mb-3 text-rose">
              <Store className="h-5 w-5" />
            </div>
            <h1 className="font-serif italic text-3xl text-ink font-normal mb-1">
              Atelier Partner Access
            </h1>
            <p className="text-xs text-grey-soft">
              Manage your boutique catalogue, orders, and studio fulfillment.
            </p>
          </div>

          {/* Quick Demo Access Callout */}
          <div className="mb-6 p-3.5 bg-wash border border-line rounded-sm flex items-center justify-between gap-3">
            <div className="space-y-0.5 text-left">
              <p className="text-[11px] font-bold text-ink flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-rose" /> Testing or Previewing?
              </p>
              <p className="text-[10px] text-grey-soft">
                Explore the seller portal instantly with sample boutique data.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDemoLogin}
              disabled={demoLoading}
              className="border-rose/30 text-rose hover:bg-rose/5 text-[11px] font-semibold h-8 shrink-0"
            >
              {demoLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
              1-Click Demo
            </Button>
          </div>

          {/* Tab Controls */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-wash border border-line rounded-sm mb-6 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("signin")}
              className={`py-2 rounded-sm transition ${
                activeTab === "signin"
                  ? "bg-white text-ink shadow-xs"
                  : "text-grey-soft hover:text-ink"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("signup")}
              className={`py-2 rounded-sm transition ${
                activeTab === "signup"
                  ? "bg-white text-ink shadow-xs"
                  : "text-grey-soft hover:text-ink"
              }`}
            >
              Register Atelier
            </button>
          </div>

          {/* Google Auth */}
          <GoogleSignInButton />

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-line" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-[0.14em]">
              <span className="bg-white px-2 text-grey-soft">or email</span>
            </div>
          </div>

          {/* Form */}
          {activeTab === "signin" ? (
            <form onSubmit={handleSignIn} className="space-y-3.5">
              <div className="space-y-1">
                <Label htmlFor="email" className="text-xs font-semibold text-ink">
                  Atelier Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="atelier@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 text-xs border-stone bg-white"
                  required
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-semibold text-ink">
                    Password
                  </Label>
                  <span className="text-[10px] text-grey-soft hover:underline cursor-pointer">
                    Forgot?
                  </span>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 text-xs border-stone bg-white"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-11 bg-ink text-white hover:bg-rose transition text-xs font-semibold tracking-wide"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Sign In to Dashboard
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-3.5">
              <div className="space-y-1">
                <Label htmlFor="brand" className="text-xs font-semibold text-ink">
                  Boutique / Brand Name
                </Label>
                <Input
                  id="brand"
                  type="text"
                  placeholder="e.g. Riwaana Studio"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="h-10 text-xs border-stone bg-white"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="signup-email" className="text-xs font-semibold text-ink">
                  Work Email
                </Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="founder@boutique.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 text-xs border-stone bg-white"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="signup-password" className="text-xs font-semibold text-ink">
                  Set Password (min 6 chars)
                </Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 text-xs border-stone bg-white"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-11 bg-rose text-white hover:bg-rose/90 transition text-xs font-semibold tracking-wide"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Register & Open Store
              </Button>
            </form>
          )}

          {/* Footer note */}
          <div className="mt-6 pt-5 border-t border-line text-center">
            <p className="text-[11px] text-grey-soft flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-atelier" />
              15% standard commission · Independent courier · Weekly settlement
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
