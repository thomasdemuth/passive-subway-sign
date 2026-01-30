import { motion } from "framer-motion";
import { RouteIcon } from "./RouteIcon";
import { parseISO } from "date-fns";
import type { Arrival } from "@shared/schema";

interface ArrivalCardProps {
  arrival: Arrival;
  index: number;
}

export function ArrivalCard({ arrival, index }: ArrivalCardProps) {
  const arrivalDate = parseISO(arrival.arrivalTime);
  const diffInMinutes = Math.max(0, Math.round((arrivalDate.getTime() - new Date().getTime()) / 60000));

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.2 }}
      className="flex items-center gap-3 py-1.5"
    >
      <RouteIcon routeId={arrival.routeId} size="sm" className="w-6 h-6 text-xs shrink-0" />
      
      <span className="flex-1 text-sm text-white/80 truncate">
        {arrival.destination}
      </span>

      <div className="flex items-baseline gap-0.5 shrink-0">
        <span className="text-xl font-bold text-white tabular-nums">
          {diffInMinutes === 0 ? "Now" : diffInMinutes}
        </span>
        {diffInMinutes > 0 && (
          <span className="text-xs text-muted-foreground">min</span>
        )}
      </div>
    </motion.div>
  );
}
