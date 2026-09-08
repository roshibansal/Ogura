import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Copy, Check, Truck, Gift, Sparkles } from "lucide-react";

const TOTAL_SECONDS = 24 * 60 * 60;

const pad = (n: number) => String(n).padStart(2, "0");

const particles = [
  { color: "#5A0A26", size: 18, top: "8%", left: "5%", dur: "7s", delay: "0s" },
  { color: "#facc15", size: 14, top: "15%", left: "85%", dur: "9s", delay: "1s" },
  { color: "#3b82f6", size: 20, top: "70%", left: "10%", dur: "8s", delay: "2s" },
  { color: "#a855f7", size: 12, top: "80%", left: "90%", dur: "6s", delay: "0.5s" },
  { color: "#f97316", size: 16, top: "25%", left: "50%", dur: "10s", delay: "3s" },
  { color: "#5A0A26", size: 10, top: "60%", left: "30%", dur: "7.5s", delay: "1.5s" },
  { color: "#facc15", size: 22, top: "40%", left: "75%", dur: "8.5s", delay: "2.5s" },
  { color: "#3b82f6", size: 15, top: "90%", left: "55%", dur: "9.5s", delay: "0.8s" },
  { color: "#a855f7", size: 13, top: "5%", left: "40%", dur: "6.5s", delay: "4s" },
  { color: "#f97316", size: 17, top: "50%", left: "20%", dur: "11s", delay: "1.2s" },
];

const HoliDhamakaSale = () => {
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setSecondsLeft((prev) => (prev <= 0 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const hours = Math.floor(secondsLeft / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText("FIRST200").then(() => {
      setCopied(true);
      toast.success("Coupon code copied!");
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-pink-50 via-purple-50 to-yellow-50 py-12 md:py-20">
      {/* Scoped keyframes */}
      <style>{`
        @keyframes holi-float {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.5; }
          50% { transform: translateY(-30px) scale(1.2); opacity: 0.8; }
        }
        @keyframes holi-pulse-ring {
          0% { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>

      {/* Floating particles */}
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: p.size,
            height: p.size,
            top: p.top,
            left: p.left,
            backgroundColor: p.color,
            animation: `holi-float ${p.dur} ease-in-out ${p.delay} infinite`,
            filter: "blur(1px)",
          }}
        />
      ))}

      {/* Main content */}
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 animate-fade-in">
        <div className="backdrop-blur-xl bg-white/70 border border-white/40 rounded-2xl shadow-2xl p-6 sm:p-10 md:p-14">
          <div className="flex flex-col lg:flex-row lg:items-center lg:gap-12">
            {/* Left: copy */}
            <div className="flex-1 text-center lg:text-left mb-8 lg:mb-0">
              {/* Badge */}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-200 px-4 py-1.5 text-xs font-semibold tracking-wide text-pink-700 mb-5">
                <Sparkles className="h-3.5 w-3.5" />
                Limited Time Holi Offer
              </span>

              {/* Headline */}
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight mb-4">
                <span className="bg-gradient-to-r from-pink-500 via-yellow-500 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                  Holi Dhamaka Sale is LIVE
                </span>{" "}
                🌈
              </h2>

              {/* Subheading */}
              <p className="text-base sm:text-lg text-muted-foreground mb-6 max-w-lg mx-auto lg:mx-0">
                Buy 1 Get 1 <span className="font-bold text-foreground">FREE</span> + Flat{" "}
                <span className="font-bold text-foreground">₹200 OFF</span> on First Order
              </p>

              {/* Coupon */}
              <div className="inline-flex items-center gap-3 border-2 border-dashed border-pink-300 rounded-xl bg-white/60 px-5 py-3 mb-6">
                <span className="text-xs text-muted-foreground">Use Code:</span>
                <span className="font-mono font-bold text-lg tracking-widest text-foreground">FIRST200</span>
                <button
                  onClick={handleCopy}
                  className="ml-1 rounded-lg bg-pink-100 hover:bg-pink-200 p-2 transition-colors"
                  aria-label="Copy coupon code"
                >
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 text-pink-600" />}
                </button>
              </div>

              {/* Free shipping */}
              <div className="flex items-center justify-center lg:justify-start gap-2 text-xs text-muted-foreground">
                <Truck className="h-4 w-4 text-pink-500" />
                <span>Free Shipping Above ₹500</span>
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-2 text-xs text-pink-600 font-semibold mt-1">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Valid for First 10,000 Orders Only</span>
              </div>
            </div>

            {/* Right: timer + CTAs */}
            <div className="flex-shrink-0 flex flex-col items-center gap-6">
              {/* Timer label */}
              <p className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
                Offer ends in
              </p>

              {/* Countdown */}
              <div className="flex items-center gap-3">
                {[
                  { value: pad(hours), label: "HRS" },
                  { value: pad(minutes), label: "MIN" },
                  { value: pad(seconds), label: "SEC" },
                ].map((t) => (
                  <div key={t.label} className="flex flex-col items-center">
                    <div className="relative backdrop-blur-md bg-white/60 border border-white/50 rounded-xl shadow-lg w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
                      <span className="text-2xl sm:text-3xl font-bold bg-gradient-to-b from-pink-600 to-purple-600 bg-clip-text text-transparent">
                        {t.value}
                      </span>
                      {/* Pulse ring */}
                      <div
                        className="absolute inset-0 rounded-xl border-2 border-pink-400/30 pointer-events-none"
                        style={{ animation: "holi-pulse-ring 2s ease-out infinite" }}
                      />
                    </div>
                    <span className="mt-1.5 text-[10px] font-semibold tracking-wider text-muted-foreground">
                      {t.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <Link
                  to="/collections"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                >
                  <Gift className="h-4 w-4" />
                  Shop Now
                </Link>
                <Link
                  to="/collections"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-pink-400 bg-white/50 px-8 py-3.5 text-sm font-semibold text-pink-600 hover:bg-pink-50 hover:scale-105 hover:shadow-lg transition-all duration-200"
                >
                  Grab BOGO Deal
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HoliDhamakaSale;
