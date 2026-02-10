
import { useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence, motion } from "framer-motion";
import Home from "@/pages/Home";
import DisplaySettings from "@/pages/DisplaySettings";
import Departures from "@/pages/Departures";
import NotFound from "@/pages/not-found";

const pageVariants = {
  initial: { 
    opacity: 0,
  },
  in: { 
    opacity: 1,
  },
  out: { 
    opacity: 0,
  }
};

const pageTransition = {
  duration: 0.3
};

function AnimatedPage({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="min-h-screen"
    >
      {children}
    </motion.div>
  );
}

function Router() {
  const [location] = useLocation();
  const isHome = location === "/";
  const isSettings = location.startsWith("/settings/");
  const isDepartures = location.startsWith("/departures/");
  
  return (
    <AnimatePresence mode="wait">
      {isHome && (
        <AnimatedPage key="home">
          <Home />
        </AnimatedPage>
      )}
      {isSettings && (
        <AnimatedPage key="settings">
          <DisplaySettings />
        </AnimatedPage>
      )}
      {isDepartures && (
        <AnimatedPage key="departures">
          <Departures />
        </AnimatedPage>
      )}
      {!isHome && !isSettings && !isDepartures && (
        <AnimatedPage key="notfound">
          <NotFound />
        </AnimatedPage>
      )}
    </AnimatePresence>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
