/**
 * Demo mode for the Atelier Portal.
 *
 * Live Google OAuth needs a network round-trip and an allow-listed redirect
 * origin. Neither is safe to depend on in front of a room, so this module can
 * stand in for a signed-in, verified seller entirely client-side.
 *
 * It is deliberately explicit: nothing here activates on its own. It is turned
 * on by `?demo=` in the URL or by the on-screen stage control, it announces
 * itself with a badge wherever it is in effect, and it never writes to Supabase.
 */

export type SellerStage = "anonymous" | "application" | "review" | "active";

export interface DemoSellerState {
  active: boolean;
  stage: SellerStage;
  name: string;
  email: string;
  brandName: string;
  city: string;
  instagram: string;
  sellerType: string;
  /** ISO date the application was "submitted" — drives the review timeline. */
  submittedAt: string;
}

const KEY = "ogura_demo_seller";
export const DEMO_EVENT = "ogura:demo-seller-changed";

export const DEMO_DEFAULTS: Omit<DemoSellerState, "active" | "stage" | "submittedAt"> = {
  name: "Riwaana Kapoor",
  email: "riwaana.atelier@gmail.com",
  brandName: "Riwaana Atelier",
  city: "Jaipur",
  instagram: "@riwaana.atelier",
  sellerType: "boutique",
};

const blank = (): DemoSellerState => ({
  active: false,
  stage: "anonymous",
  submittedAt: new Date().toISOString(),
  ...DEMO_DEFAULTS,
});

export const getDemoState = (): DemoSellerState => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return blank();
    return { ...blank(), ...JSON.parse(raw) };
  } catch {
    return blank();
  }
};

const write = (next: DemoSellerState) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Private mode — demo simply won't persist across reloads.
  }
  window.dispatchEvent(new CustomEvent(DEMO_EVENT));
};

export const isDemoActive = () => getDemoState().active;

/** Turn demo mode on at a given stage, optionally overriding the profile. */
export const startDemo = (
  stage: SellerStage = "anonymous",
  overrides: Partial<DemoSellerState> = {},
) => {
  write({ ...blank(), ...overrides, active: true, stage });
};

export const setDemoStage = (stage: SellerStage, overrides: Partial<DemoSellerState> = {}) => {
  const current = getDemoState();
  write({
    ...current,
    ...overrides,
    active: true,
    stage,
    submittedAt:
      stage === "review" && current.stage !== "review"
        ? new Date().toISOString()
        : current.submittedAt,
  });
};

export const endDemo = () => {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* no-op */
  }
  window.dispatchEvent(new CustomEvent(DEMO_EVENT));
};

/**
 * Reads `?demo=` on load. `?demo=1` starts at the signed-out landing;
 * `?demo=review` and `?demo=active` jump straight to a stage; `?demo=off` exits.
 */
export const applyDemoFromUrl = (search: string): boolean => {
  const value = new URLSearchParams(search).get("demo");
  if (value === null) return false;

  if (value === "off" || value === "0") {
    endDemo();
    return true;
  }

  const stage: SellerStage =
    value === "active" || value === "dashboard"
      ? "active"
      : value === "review"
        ? "review"
        : value === "application" || value === "apply"
          ? "application"
          : "anonymous";

  startDemo(stage);
  return true;
};
