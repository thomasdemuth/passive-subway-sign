import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, ChevronRight, ChevronLeft, Search, MapPin, Check, Train, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  targetSelector?: string;
  interactive?: boolean;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "welcome",
    title: "Welcome to Passive Subway Sign",
    description: "This app shows real-time NYC subway arrivals. Let's walk through the main features.",
    icon: <Train className="w-8 h-8" />,
  },
  {
    id: "search",
    title: "Search for Stations",
    description: "Use the search bar to find stations by name or subway line (like 'Times Sq')",
    icon: <Search className="w-8 h-8" />,
    targetSelector: "[data-testid='input-search']",
    interactive: true,
  },
  {
    id: "location",
    title: "Enable Location",
    description: "Tap the location button to sort stations by distance and see estimated walk times.",
    icon: <MapPin className="w-8 h-8" />,
    targetSelector: "[data-testid='button-toggle-location']",
    interactive: true,
  },
  {
    id: "select",
    title: "Select Your Stations",
    description: "Tap on one or more stations to select them. You can monitor multiple stations at once.",
    icon: <Check className="w-8 h-8" />,
  },
  {
    id: "departures",
    title: "View Real-Time Arrivals",
    description: "After selecting stations, the 'View Departures' button appears. Tap it to see live train arrival times.",
    icon: <Train className="w-8 h-8" />,
  },
];

const TUTORIAL_STORAGE_KEY = "subway-tutorial-completed";

export function useTutorial() {
  const [showTutorial, setShowTutorial] = useState(false);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(true);

  useEffect(() => {
    const completed = localStorage.getItem(TUTORIAL_STORAGE_KEY);
    if (!completed) {
      setHasSeenTutorial(false);
      setShowTutorial(true);
    }
  }, []);

  const completeTutorial = () => {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
    setShowTutorial(false);
    setHasSeenTutorial(true);
  };

  const dismissTutorial = () => {
    setShowTutorial(false);
  };

  const resetTutorial = () => {
    localStorage.removeItem(TUTORIAL_STORAGE_KEY);
    setHasSeenTutorial(false);
    setShowTutorial(true);
  };

  const startTutorial = () => {
    setShowTutorial(true);
  };

  return {
    showTutorial,
    hasSeenTutorial,
    completeTutorial,
    dismissTutorial,
    resetTutorial,
    startTutorial,
  };
}

interface HighlightInfo {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface TutorialProps {
  onComplete: () => void;
  onDismiss: () => void;
}

export function Tutorial({ onComplete, onDismiss }: TutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightInfo, setHighlightInfo] = useState<HighlightInfo | null>(null);
  const step = TUTORIAL_STEPS[currentStep];
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  const updateHighlight = useCallback(() => {
    if (step.targetSelector) {
      const element = document.querySelector(step.targetSelector);
      if (element) {
        const rect = element.getBoundingClientRect();
        const padding = 8;
        setHighlightInfo({
          top: rect.top - padding,
          left: rect.left - padding,
          width: rect.width + padding * 2,
          height: rect.height + padding * 2,
        });
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        setHighlightInfo(null);
      }
    } else {
      setHighlightInfo(null);
    }
  }, [step.targetSelector]);

  useEffect(() => {
    updateHighlight();
    const handleUpdate = () => updateHighlight();
    window.addEventListener("resize", handleUpdate);
    window.addEventListener("scroll", handleUpdate, true);
    return () => {
      window.removeEventListener("resize", handleUpdate);
      window.removeEventListener("scroll", handleUpdate, true);
    };
  }, [updateHighlight]);

  const nextStep = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
  const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100]" data-testid="tutorial-overlay">
        {highlightInfo && step.interactive ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute bg-black/80 backdrop-blur-sm"
              style={{
                top: 0,
                left: 0,
                right: 0,
                height: highlightInfo.top,
              }}
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute bg-black/80 backdrop-blur-sm"
              style={{
                top: highlightInfo.top + highlightInfo.height,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute bg-black/80 backdrop-blur-sm"
              style={{
                top: highlightInfo.top,
                left: 0,
                width: highlightInfo.left,
                height: highlightInfo.height,
              }}
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute bg-black/80 backdrop-blur-sm"
              style={{
                top: highlightInfo.top,
                left: highlightInfo.left + highlightInfo.width,
                right: 0,
                height: highlightInfo.height,
              }}
            />
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
        )}

        {highlightInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute pointer-events-none"
            style={{
              top: highlightInfo.top,
              left: highlightInfo.left,
              width: highlightInfo.width,
              height: highlightInfo.height,
            }}
          >
            <div className="absolute inset-0 rounded-lg ring-2 ring-primary ring-offset-2 ring-offset-transparent" />
            <motion.div
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute inset-0 rounded-lg bg-primary/10"
            />
          </motion.div>
        )}

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className={cn(
            "absolute bg-card border border-white/10 rounded-2xl shadow-2xl max-w-md w-[calc(100%-2rem)] overflow-hidden",
            highlightInfo
              ? "bottom-8 left-1/2 -translate-x-1/2"
              : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          )}
          data-testid="tutorial-card"
        >
          <div className="relative p-6 sm:p-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={onDismiss}
              className="absolute top-3 right-3"
              data-testid="button-dismiss-tutorial"
            >
              <X className="w-5 h-5" />
            </Button>

            <div className="flex flex-col items-center text-center space-y-4">
              <motion.div
                key={step.id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary"
              >
                {step.icon}
              </motion.div>

              <motion.div
                key={`${step.id}-content`}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="space-y-2"
              >
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  {step.title}
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </motion.div>

              <div className="flex items-center gap-1.5 pt-2">
                {TUTORIAL_STEPS.map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "w-2 h-2 rounded-full transition-colors",
                      index === currentStep
                        ? "bg-primary"
                        : index < currentStep
                        ? "bg-primary/50"
                        : "bg-white/20"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border-t border-white/10 bg-white/5">
            <Button
              variant="ghost"
              onClick={prevStep}
              disabled={isFirstStep}
              className={cn(isFirstStep && "invisible")}
              data-testid="button-prev-step"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>

            <Button
              onClick={nextStep}
              className="gap-1"
              data-testid="button-next-step"
            >
              {isLastStep ? "Get Started" : "Next"}
              {!isLastStep && <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

interface TutorialButtonProps {
  onClick: () => void;
  className?: string;
}

export function TutorialButton({ onClick, className }: TutorialButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn("text-muted-foreground", className)}
      data-testid="button-restart-tutorial"
    >
      <HelpCircle className="w-4 h-4 mr-1.5" />
      Tutorial
    </Button>
  );
}
