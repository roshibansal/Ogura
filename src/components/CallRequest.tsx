import React, { useEffect, useState } from "react";

const TOPICS = [
  "Sizing & fit",
  "Other colours",
  "Custom measurements",
  "Fabric & embroidery",
  "Delivery timeline",
  "Bespoke budget",
];

const LANGUAGES = ["English", "Hindi", "Tamil", "Bengali", "Telugu", "Marathi"];

function nextSlots() {
  const out: { day: string; date: string; times: string[] }[] = [];
  const now = new Date();
  for (let i = 1; i <= 3; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    out.push({
      day: d.toLocaleDateString("en-IN", { weekday: "short" }),
      date: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      times: ["11:00 am", "2:30 pm", "5:00 pm", "7:30 pm"],
    });
  }
  return out;
}

export function CallRequest({
  boutique = "OGURA Atelier",
  owner = "Styling Director",
  respondsIn = "2 hours",
  design,
  variant = "solid",
  label = "Request a call with the designer",
}: {
  boutique?: string;
  owner?: string;
  respondsIn?: string;
  design?: string;
  variant?: "solid" | "outline" | "mini";
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [topics, setTopics] = useState<string[]>(design ? ["Sizing & fit"] : []);
  const [mode, setMode] = useState<"Video" | "Voice">("Video");
  const [language, setLanguage] = useState("English");
  const [slot, setSlot] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const slots = nextSlots();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const toggleTopic = (t: string) =>
    setTopics((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const reset = () => {
    setOpen(false);
    setTimeout(() => {
      setStep(1);
      setSlot(null);
      setName("");
      setPhone("");
      setWhatsappUrl("");
    }, 200);
  };

  const phoneOk = /^[6-9]\d{9}$/.test(phone.replace(/\D/g, ""));

  const handleRequestCall = () => {
    const rawDigits = phone.replace(/\D/g, "");
    const message = 
`Hi OGURA Support! I would like to request a styling consultation with ${owner} (${boutique}).
• Interested in: ${design ? `"${design}"` : "Custom Couture"}
• Consultation Format: ${mode} Call
• Preferred Language: ${language}
• Preferred Slot: ${slot || "Next available"}
• Consultation Topics: ${topics.join(", ") || "General Styling"}
• My Name: ${name}
• My Phone: +91 ${rawDigits}

Please confirm the appointment link. Thank you!`;

    const url = `https://wa.me/917742698970?text=${encodeURIComponent(message)}`;
    setWhatsappUrl(url);
    setStep(4);
    
    // Automatically trigger WhatsApp in a safe manner
    try {
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      // Fallback handled gracefully in UI
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          variant === "solid"
            ? "w-full rounded-full bg-ink px-6 py-3.5 text-sm font-medium text-ivory transition hover:bg-clay"
            : variant === "outline"
              ? "w-full rounded-full border border-ink/25 px-6 py-3.5 text-sm font-medium text-ink transition hover:border-ink hover:bg-parchment/60"
              : "inline-flex items-center gap-1.5 rounded-full border border-ink/20 px-3.5 py-1.5 text-xs font-medium text-ink-soft transition hover:border-clay hover:bg-clay hover:text-ivory"
        }
      >
        {variant === "mini" && (
          <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
            <path d="M3 4.5c0 5 3.5 8.5 8.5 8.5l1.5-2-2.6-1.4-1.3 1.2A9.6 9.6 0 0 1 5.2 6.9l1.2-1.3L5 3 3 4.5Z" strokeLinejoin="round" />
          </svg>
        )}
        {label}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={reset}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-ivory p-6 shadow-2xl sm:p-8 text-ink"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={reset}
              aria-label="Close dialog"
              className="absolute right-5 top-5 text-xl text-ink-soft hover:text-ink transition"
            >
              ✕
            </button>

            {step < 4 ? (
              <>
                <div className="flex items-center justify-between border-b border-black/5 pb-4">
                  <div>
                    <span className="font-display text-lg tracking-tight">The Call is the Product</span>
                    <p className="text-xs text-ink-soft mt-0.5">
                      Chat with {owner} at {boutique}, on Ogura
                    </p>
                  </div>
                  <span className="text-xs font-medium text-ink-soft">Step {step} of 3</span>
                </div>

                {step === 1 && (
                  <div className="mt-6 space-y-5">
                    <div>
                      <h3 className="font-display text-xl">What would you like to discuss?</h3>
                      <p className="mt-1 text-xs text-ink-soft">Pick as many as you need.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      {TOPICS.map((t) => {
                        const active = topics.includes(t);
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => toggleTopic(t)}
                            className={`rounded-xl border p-3 text-left text-xs font-medium transition ${
                              active
                                ? "border-clay bg-clay/10 text-clay"
                                : "border-ink/15 hover:border-ink/40 bg-white/50 text-ink"
                            }`}
                          >
                            {t}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="w-full rounded-full bg-ink py-3 text-sm font-medium text-ivory transition hover:bg-clay"
                    >
                      Continue
                    </button>
                  </div>
                )}

                {step === 2 && (
                  <div className="mt-6 space-y-5">
                    <div>
                      <h3 className="font-display text-xl">Choose your format & slot</h3>
                      <p className="mt-1 text-xs text-ink-soft">Free 15-minute consultation directly with the atelier.</p>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-ink-soft uppercase tracking-wider">Format</label>
                      <div className="mt-2 grid grid-cols-2 gap-3">
                        {(["Video", "Voice"] as const).map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setMode(m)}
                            className={`rounded-xl border py-2.5 text-xs font-medium transition ${
                              mode === m ? "border-clay bg-clay/10 text-clay" : "border-ink/15 text-ink"
                            }`}
                          >
                            {m} Call
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-ink-soft uppercase tracking-wider">Language</label>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="mt-2 w-full rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-xs text-ink outline-none"
                      >
                        {LANGUAGES.map((l) => (
                          <option key={l} value={l}>{l}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-ink-soft uppercase tracking-wider">Select Slot</label>
                      <div className="mt-2 space-y-3">
                        {slots.map((s) => (
                          <div key={s.date} className="rounded-xl border border-ink/10 bg-white/40 p-2.5">
                            <p className="text-xs font-medium text-ink">{s.day}, {s.date}</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {s.times.map((t) => {
                                const selected = slot === `${s.date} at ${t}`;
                                return (
                                  <button
                                    key={t}
                                    type="button"
                                    onClick={() => setSlot(`${s.date} at ${t}`)}
                                    className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition ${
                                      selected
                                        ? "bg-clay text-white"
                                        : "bg-parchment/70 hover:bg-parchment text-ink"
                                    }`}
                                  >
                                    {t}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="rounded-full border border-ink/20 px-5 py-2.5 text-xs font-medium text-ink hover:bg-parchment"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        disabled={!slot}
                        onClick={() => setStep(3)}
                        className="flex-1 rounded-full bg-ink py-2.5 text-xs font-medium text-ivory transition hover:bg-clay disabled:opacity-40"
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="mt-6 space-y-5">
                    <div>
                      <h3 className="font-display text-xl">Your contact details</h3>
                      <p className="mt-1 text-xs text-ink-soft">
                        We send the consultation confirmation via WhatsApp.
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-ink-soft uppercase tracking-wider">Your Full Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Ananya Sharma"
                        className="mt-2 w-full rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-xs text-ink outline-none focus:border-clay"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-ink-soft uppercase tracking-wider">Mobile Number (WhatsApp)</label>
                      <div className="mt-2 flex items-center rounded-xl border border-ink/15 bg-white px-3 focus-within:border-clay">
                        <span className="text-xs font-medium text-ink-soft mr-2">+91</span>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="98765 43210"
                          maxLength={10}
                          className="w-full bg-transparent py-2.5 text-xs text-ink outline-none"
                        />
                      </div>
                      <p className="mt-1.5 text-[11px] text-ink-soft">
                        Your number is protected and used strictly for scheduling this styling call.
                      </p>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="rounded-full border border-ink/20 px-5 py-2.5 text-xs font-medium text-ink hover:bg-parchment"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        disabled={!name.trim() || !phoneOk}
                        onClick={handleRequestCall}
                        className="flex-1 rounded-full bg-ink py-2.5 text-xs font-medium text-ivory transition hover:bg-clay disabled:opacity-40"
                      >
                        Send Request on WhatsApp
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="py-4 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-forest text-2xl text-ivory">
                  ✓
                </div>
                <h3 className="mt-4 font-display text-2xl">Consultation Link Generated</h3>
                <p className="mt-2 text-xs text-ink-soft leading-relaxed">
                  Your styling request for <span className="font-semibold text-ink">{owner}</span> at <span className="font-semibold text-ink">{boutique}</span> is ready to send via WhatsApp.
                </p>

                <div className="mt-6 space-y-2 rounded-xl bg-parchment/60 p-4 text-left text-xs">
                  <div className="flex justify-between">
                    <span className="text-ink-soft">Preferred Slot:</span>
                    <span className="font-medium text-ink">{slot}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-soft">Call Format:</span>
                    <span className="font-medium text-ink">{mode} ({language})</span>
                  </div>
                  {design && (
                    <div className="flex justify-between">
                      <span className="text-ink-soft">Piece:</span>
                      <span className="font-medium text-ink">{design}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-ink-soft">Customer:</span>
                    <span className="font-medium text-ink">{name} (+91 {phone})</span>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-2">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full rounded-full bg-[#25D366] px-6 py-3 text-xs font-semibold text-white shadow-sm hover:bg-[#20ba5a] transition flex items-center justify-center gap-2"
                  >
                    Open WhatsApp to Send Message
                  </a>
                  <button
                    type="button"
                    onClick={reset}
                    className="w-full rounded-full border border-ink/20 py-2.5 text-xs font-medium text-ink hover:bg-parchment"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
