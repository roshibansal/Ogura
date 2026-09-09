import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const Login = () => {
  const { isAuthenticated, isLoading, isNewUser, signInWithEmail, signUpWithEmail } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const nextParam = searchParams.get("next");
  const isSameOriginPath = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//");

  // Path saved before the Google OAuth round-trip (may return on the apex domain).
  const storedPath = (() => {
    try {
      const p = sessionStorage.getItem("ogura_post_auth_path");
      return p && p.startsWith("/") && !p.startsWith("//") && !p.startsWith("/login") ? p : null;
    } catch {
      return null;
    }
  })();

  const from = isSameOriginPath
    ? nextParam!
    : (location.state as any)?.from?.pathname || storedPath || "/dashboard";

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const fn = mode === "signin" ? signInWithEmail : signUpWithEmail;
    const { success, error } = await fn(email.trim(), password);
    setBusy(false);
    if (success) {
      toast.success(mode === "signin" ? "Welcome back" : "Account created");
      return;
    }
    if (mode === "signin" && /invalid login credentials/i.test(error || "")) {
      toast.error("No account with that email and password. Try creating one.");
      return;
    }
    toast.error(error || "Something went wrong. Please try again.");
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    const errorDescription = params.get('error_description');
    if (error) {
      toast.error(errorDescription || 'Sign-in failed. Please try again.');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      try {
        sessionStorage.removeItem("ogura_post_auth_path");
      } catch {
        // ignore
      }
      if (isNewUser && !isSameOriginPath) {
        navigate("/onboarding", { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    }
  }, [isAuthenticated, isLoading, isNewUser, navigate, from, isSameOriginPath]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/10 via-primary/5 to-background relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--primary)/0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,hsl(var(--accent)/0.15),transparent_50%)]" />
        <div className="relative z-10 flex flex-col justify-center px-12 lg:px-16">
          <Link to="/" className="mb-8">
            <h1 className="text-4xl font-light tracking-[0.3em] text-foreground">OGURA</h1>
          </Link>
          <h2 className="text-3xl lg:text-4xl font-light text-foreground leading-tight mb-6">
            India's Premier
            <br />
            <span className="text-primary">Fashion Marketplace</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-md leading-relaxed">
            Discover curated collections from India's finest designers. 
            Luxury fashion, artisanal craftsmanship, and timeless elegance—all in one place.
          </p>
          </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link to="/" className="lg:hidden flex justify-center mb-8">
            <h1 className="text-3xl font-light tracking-[0.3em] text-foreground">OGURA</h1>
          </Link>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-medium text-foreground mb-2">Welcome Back</h2>
            <p className="text-muted-foreground">
              Sign in to access your account, wishlist, and orders
            </p>
          </div>

          <div className="space-y-6">
            <GoogleSignInButton />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-4 text-muted-foreground">or use email</span>
              </div>
            </div>

            {/* Email sign-in. Google needs a client secret configured in Supabase
                before it can complete; email works today, so the page is never
                a dead end. */}
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full h-11 rounded-md border border-border bg-background px-3 text-sm"
              />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (at least 6 characters)"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                className="w-full h-11 rounded-md border border-border bg-background px-3 text-sm"
              />
              <button
                type="submit"
                disabled={busy}
                className="w-full h-11 rounded-md bg-[#5A0A26] hover:bg-[#3D0618] text-white text-sm font-semibold transition inline-flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === "signin" ? "Sign in" : "Create account"}
              </button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              {mode === "signin" ? "New to Ogura?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                className="text-[#5A0A26] font-semibold hover:underline"
              >
                {mode === "signin" ? "Create an account" : "Sign in"}
              </button>
            </p>

            <div className="text-center text-sm text-muted-foreground">
              <p>
                By continuing, you agree to our{" "}
                <Link to="/terms" className="text-primary hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
              </p>
            </div>

            <div className="pt-4 text-center">
              <Link
                to="/"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back to browsing
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
