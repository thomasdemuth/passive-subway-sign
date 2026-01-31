import { motion } from "framer-motion";
import { RouteIcon } from "./RouteIcon";
import { parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import type { Arrival } from "@shared/schema";

interface ArrivalCardProps {
  arrival: Arrival;
  index: number;
}

export function ArrivalCard({ arrival, index }: ArrivalCardProps) {
  const arrivalDate = parseISO(arrival.arrivalTime);
  const diffInMinutes = Math.max(0, Math.round((arrivalDate.getTime() - new Date().getTime()) / 60000));
  const isArriving = diffInMinutes <= 1;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ delay: index * 0.05, duration: 0.25, ease: "easeOut" }}
      className={cn(
        "flex items-center gap-2 sm:gap-3 py-1.5 sm:py-2 px-2 rounded-lg transition-colors duration-300",
        isArriving && "bg-white/5"
      )}
    >
      <motion.div
        animate={isArriving ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 0.6, repeat: isArriving ? Infinity : 0, repeatDelay: 0.5 }}
      >
        <RouteIcon routeId={arrival.routeId} size="sm" className="w-5 h-5 sm:w-6 sm:h-6 text-[10px] sm:text-xs shrink-0" />
      </motion.div>
      
      <span className="flex-1 text-xs sm:text-sm text-white/80 truncate">
        {arrival.destination}
      </span>

      <div className="flex items-baseline gap-0.5 shrink-0">
        <motion.span 
          className={cn(
            "text-lg sm:text-xl font-bold tabular-nums transition-colors duration-300",
            isArriving ? "text-green-400" : "text-white"
          )}
          animate={isArriving ? { opacity: [1, 0.6, 1] } : {}}
          transition={{ duration: 1, repeat: isArriving ? Infinity : 0 }}
        >
          {diffInMinutes === 0 ? "Now" : diffInMinutes}
        </motion.span>
        {diffInMinutes > 0 && (
          <span className="text-[10px] sm:text-xs text-muted-foreground">min</span>
        )}
      </div>
    </motion.div>
  );
}
