import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: number;
  label: string;
}

const steps: Step[] = [
  { id: 0, label: "Start" },
  { id: 1, label: "Inspiration" },
  { id: 2, label: "Designer" },
  { id: 3, label: "Customize" },
  { id: 4, label: "Preview" },
  { id: 5, label: "Review" },
  { id: 6, label: "Order" },
];

interface MTOProgressIndicatorProps {
  currentStep: number;
  className?: string;
}

export const MTOProgressIndicator = ({
  currentStep,
  className,
}: MTOProgressIndicatorProps) => {
  return (
    <div
      className={cn(
        "sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50 py-4",
        className
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2 md:pb-0">
          {steps.map((step, index) => {
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <div key={step.id} className="flex items-center">
                {/* Step Circle */}
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300",
                      isCompleted &&
                        "bg-[#C9A56B] text-white",
                      isCurrent &&
                        "bg-gradient-to-r from-[#C9A56B] to-[#D6285F] text-white ring-4 ring-[#C9A56B]/20",
                      !isCompleted &&
                        !isCurrent &&
                        "bg-muted text-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      step.id
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-xs mt-1 whitespace-nowrap hidden md:block",
                      isCurrent
                        ? "text-[#C9A56B] font-medium"
                        : "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </span>
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "w-8 md:w-12 h-0.5 mx-1",
                      isCompleted ? "bg-[#C9A56B]" : "bg-muted"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
