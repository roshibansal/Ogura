import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Play, X } from "lucide-react";
import {
  DEMO_EVENT,
  SellerStage,
  endDemo,
  getDemoState,
  setDemoStage,
  startDemo,
} from "@/lib/seller/demoSeller";

const STEPS: { stage: SellerStage; label: string; caption: string }[] = [
  { stage: "anonymous", label: "Signed out", caption: "Anyone landing on Ogura" },
  { stage: "application", label: "Signed in", caption: "Google account confirmed" },
  { stage: "review", label: "Under review", caption: "Originality check pending" },
  { stage: "active", label: "Verified", caption: "Dashboard unlocked" },
];

/**
 * Stage stepper for presenting the seller journey without touching the network.
 * Only rendered while demo mode is on, so it can never appear for a real seller.
 */
export const DemoStageControl = () => {
  const [state, setState] = useState(() => getDemoState());

  useEffect(() => {
    const sync = () => setState(getDemoState());
    window.addEventListener(DEMO_EVENT, sync);
    return () => window.removeEventListener(DEMO_EVENT, sync);
  }, []);

  if (!state.active) return null;

  const index = STEPS.findIndex((s) => s.stage === state.stage);

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] w-[min(92vw,640px)]">
      <div className="rounded-lg border border-[#5A0A26]/15 bg-white/95 backdrop-blur shadow-[0_8px_30px_rgba(90,10,38,0.16)] px-3 py-2.5">
        <div className="flex items-center gap-3">
          <span className="shrink-0 inline-flex items-center gap-1.5 rounded-sm bg-[#5A0A26] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
            <Play className="h-3 w-3" /> Demo
          </span>

          <div className="flex-1 flex items-center gap-1 overflow-x-auto">
            {STEPS.map((s, i) => (
              <button
                key={s.stage}
                type="button"
                onClick={() => setDemoStage(s.stage)}
                className={`shrink-0 rounded-sm px-2.5 py-1.5 text-left transition ${
                  i === index
                    ? "bg-[#5A0A26] text-white"
                    : i < index
                      ? "bg-[#5A0A26]/8 text-[#5A0A26]"
                      : "text-[#5A0A26]/50 hover:bg-[#5A0A26]/5"
                }`}
              >
                <span className="block text-[11px] font-bold leading-tight">{s.label}</span>
                <span
                  className={`block text-[9px] leading-tight ${
                    i === index ? "text-white/75" : "text-[#5A0A26]/45"
                  }`}
                >
                  {s.caption}
                </span>
              </button>
            ))}
          </div>

          <div className="shrink-0 flex items-center gap-0.5">
            <button
              type="button"
              aria-label="Previous stage"
              disabled={index <= 0}
              onClick={() => setDemoStage(STEPS[index - 1].stage)}
              className="p-1.5 rounded-sm text-[#5A0A26] disabled:opacity-25 hover:bg-[#5A0A26]/8"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Next stage"
              disabled={index >= STEPS.length - 1}
              onClick={() => setDemoStage(STEPS[index + 1].stage)}
              className="p-1.5 rounded-sm text-[#5A0A26] disabled:opacity-25 hover:bg-[#5A0A26]/8"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Exit demo mode"
              onClick={endDemo}
              className="p-1.5 rounded-sm text-[#5A0A26]/60 hover:bg-[#5A0A26]/8"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/** Small "start the walkthrough" affordance for the signed-out seller page. */
export const DemoStartLink = () => (
  <button
    type="button"
    onClick={() => startDemo("anonymous")}
    className="text-xs text-ink/45 hover:text-[#5A0A26] underline underline-offset-4 transition"
  >
    Run the guided walkthrough
  </button>
);
