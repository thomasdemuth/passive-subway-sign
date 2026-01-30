import { motion } from "framer-motion";
import { Clock, AlertCircle } from "lucide-react";
import { RouteIcon } from "./RouteIcon";
import { formatDistanceToNow, parseISO } from "date-fns";
import type { Arrival } from "@shared/schema";

interface ArrivalCardProps {
  arrival: Arrival;
  index: number;
}

export function ArrivalCard({ arrival, index }: ArrivalCardProps) {
  const arrivalDate = parseISO(arrival.arrivalTime);
  
  // Calculate raw minutes for logic
  const diffInMinutes = Math.max(0, Math.round((arrivalDate.getTime() - new Date().getTime()) / 60000));
  
  // Display text
  const timeDisplay = diffInMinutes === 0 ? "Now" : `${diffInMinutes} min`;
  
  const isDelayed = arrival.status.toLowerCase().includes("delay");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      className="group relative overflow-hidden bg-card/50 hover:bg-card border border-white/5 hover:border-white/10 rounded-xl p-4 transition-all duration-300"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <RouteIcon routeId={arrival.routeId} size="md" className="shrink-0 shadow-lg" />
          
          <div className="space-y-1">
            <h3 className="font-semibold text-lg leading-none tracking-tight text-white/90 group-hover:text-white transition-colors">
              {arrival.destination}
            </h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {isDelayed ? (
                <span className="flex items-center text-red-400 gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {arrival.status}
                </span>
              ) : (
                <span className="text-emerald-400/80">On Time</span>
              )}
              <span>•</span>
              <span className="uppercase tracking-wider text-xs font-mono">{arrival.direction}</span>
            </div>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="flex items-baseline justify-end gap-1">
            <span className="text-2xl font-bold font-mono tracking-tighter text-white">
              {timeDisplay.replace(" min", "")}
            </span>
            {diffInMinutes > 0 && (
              <span className="text-xs text-muted-foreground font-medium uppercase">min</span>
            )}
          </div>
          <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground mt-1 opacity-50 group-hover:opacity-100 transition-opacity">
            <Clock className="w-3 h-3" />
            {formatDistanceToNow(arrivalDate, { addSuffix: true })}
          </div>
        </div>
      </div>
      
      {/* Subtle progress bar visual for imminent arrivals */}
      {diffInMinutes <= 2 && (
        <div className="absolute bottom-0 left-0 h-1 bg-white/10 w-full">
          <motion.div 
            className="h-full bg-emerald-500/50" 
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        </div>
      )}
    </motion.div>
  );
}
