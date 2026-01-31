import { useState } from "react";
import { useAlertsForRoutes } from "@/hooks/use-alerts";
import { RouteIcon } from "@/components/RouteIcon";
import { AlertTriangle, ChevronDown, ChevronUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import type { ServiceAlert } from "@shared/schema";

interface ServiceAlertBannerProps {
  routeIds: string[];
}

// Detect when an alert affects service based on active period
// Returns null if alert should not be shown (more than 1 hour away)
function getAlertTiming(alert: ServiceAlert): string | null {
  const now = new Date();
  const startTime = alert.activePeriodStart ? new Date(alert.activePeriodStart) : null;
  const endTime = alert.activePeriodEnd ? new Date(alert.activePeriodEnd) : null;
  
  // If no start time, assume it's currently active
  if (!startTime) {
    return "Now";
  }
  
  // Don't show alerts that start more than 1 hour from now
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
  if (startTime > oneHourFromNow) {
    return null;
  }
  
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  
  // Currently active (started and not ended yet)
  if (startTime <= now && (!endTime || endTime > now)) {
    return "Now";
  }
  
  // Starts within the next hour
  if (startTime > now && startTime <= oneHourFromNow) {
    const hour = startTime.getHours();
    if (hour >= 20 || hour < 5) {
      return "Tonight";
    } else if (hour >= 17) {
      return "This Evening";
    } else if (hour >= 12) {
      return "This Afternoon";
    } else {
      return "Soon";
    }
  }
  
  return "";
}

function AlertItem({ alert, compact = false }: { alert: ServiceAlert; compact?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const timing = getAlertTiming(alert) || "";
  
  const severityColor = alert.severity >= 30 
    ? "bg-red-500/20 border-red-500/50" 
    : alert.severity >= 20 
      ? "bg-orange-500/20 border-orange-500/50" 
      : "bg-yellow-500/20 border-yellow-500/50";
  
  const timingColor = timing === "Now" 
    ? "text-red-400" 
    : timing === "Tonight" || timing === "This Evening" 
      ? "text-orange-400" 
      : "text-yellow-400";
  
  return (
    <div 
      className={cn(
        "rounded-lg border p-2 sm:p-3 transition-all",
        severityColor,
        compact ? "text-xs" : "text-sm"
      )}
      data-testid={`card-alert-${alert.id}`}
    >
      <div className="flex items-start gap-2">
        <RouteIcon 
          routeId={alert.routeId} 
          size="sm" 
          className="w-5 h-5 text-[10px] flex-shrink-0" 
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {timing && (
              <span 
                className={cn("font-bold uppercase text-[10px]", timingColor)}
                data-testid={`text-alert-timing-${alert.id}`}
              >
                {timing}
              </span>
            )}
            <span 
              className="font-semibold text-foreground"
              data-testid={`text-alert-type-${alert.id}`}
            >
              {alert.alertType}
            </span>
          </div>
          <p 
            className={cn("text-muted-foreground mt-0.5", expanded ? "" : "line-clamp-2")}
            data-testid={`text-alert-header-${alert.id}`}
          >
            {alert.headerText}
          </p>
          {alert.descriptionText && expanded && (
            <p 
              className="text-muted-foreground/80 mt-2 whitespace-pre-wrap text-xs"
              data-testid={`text-alert-description-${alert.id}`}
            >
              {alert.descriptionText}
            </p>
          )}
        </div>
        {alert.descriptionText && (
          <Button
            variant="ghost"
            size="sm"
            className="flex-shrink-0 p-1"
            onClick={() => setExpanded(!expanded)}
            data-testid={`button-expand-alert-${alert.id}`}
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
        )}
      </div>
    </div>
  );
}

export function ServiceAlertBanner({ routeIds }: ServiceAlertBannerProps) {
  const { data: alerts, isLoading } = useAlertsForRoutes(routeIds);
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  
  if (isLoading || !alerts || alerts.length === 0 || dismissed) {
    return null;
  }
  
  // Filter out planned work and generic service alerts - only show emergency/active alerts
  const activeAlerts = alerts.filter(alert => 
    alert.alertType !== "Planned Work" && 
    alert.alertType !== "Service Alert" &&
    !alert.headerText.toLowerCase().includes("planned work")
  );
  
  if (activeAlerts.length === 0) {
    return null;
  }
  
  const uniqueAlerts = activeAlerts.reduce<ServiceAlert[]>((acc, alert) => {
    const exists = acc.some(a => a.headerText === alert.headerText);
    if (!exists) acc.push(alert);
    return acc;
  }, []);
  
  // Filter out alerts that are more than 1 hour away (timing is null)
  const visibleAlerts = uniqueAlerts.filter(alert => getAlertTiming(alert) !== null);
  
  if (visibleAlerts.length === 0) {
    return null;
  }
  
  const highSeverityCount = visibleAlerts.filter(a => a.severity >= 30).length;
  const mediumSeverityCount = visibleAlerts.filter(a => a.severity >= 20 && a.severity < 30).length;
  
  // Group alerts by timing + type and collect affected routes
  const alertsByTimingAndType = visibleAlerts.reduce<Record<string, { timing: string; type: string; routes: string[] }>>((acc, alert) => {
    const timing = getAlertTiming(alert) || "";
    const type = alert.alertType;
    const key = `${timing}-${type}`;
    if (!acc[key]) acc[key] = { timing, type, routes: [] };
    if (!acc[key].routes.includes(alert.routeId)) {
      acc[key].routes.push(alert.routeId);
    }
    return acc;
  }, {});
  
  // Sort by timing priority (Now first, then Tonight, etc.)
  const timingPriority: Record<string, number> = {
    "Now": 0,
    "Tonight": 1,
    "This Evening": 2,
    "This Afternoon": 3,
    "Soon": 4,
    "": 5
  };
  
  const sortedAlertGroups = Object.values(alertsByTimingAndType).sort((a, b) => 
    (timingPriority[a.timing] ?? 8) - (timingPriority[b.timing] ?? 8)
  );
  
  return (
    <div className="bg-background/90 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
      <div className="px-3 sm:px-6 py-3 sm:py-4 flex justify-center">
        <div className="flex items-center gap-3">
          <button 
            className="flex items-center gap-3 flex-1 flex-wrap"
            onClick={() => setExpanded(!expanded)}
            data-testid="button-toggle-alerts"
          >
            <AlertTriangle className={cn(
              "w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0",
              highSeverityCount > 0 ? "text-red-500" : mediumSeverityCount > 0 ? "text-orange-500" : "text-yellow-500"
            )} />
            <div className="flex items-center gap-3 sm:gap-4 flex-wrap" data-testid="text-alert-summary">
              {sortedAlertGroups.map(({ timing, type, routes }) => (
                <div key={`${timing}-${type}`} className="flex items-center gap-1.5">
                  {timing && (
                    <span className={cn(
                      "text-[10px] sm:text-xs font-bold uppercase",
                      timing === "Now" ? "text-red-400" : timing === "Tonight" || timing === "This Evening" ? "text-orange-400" : "text-yellow-400"
                    )}>
                      {timing}
                    </span>
                  )}
                  <span className="text-sm sm:text-base font-medium">{type}:</span>
                  <div className="flex items-center gap-1">
                    {routes.map((routeId) => (
                      <RouteIcon 
                        key={routeId}
                        routeId={routeId} 
                        size="sm" 
                        className="w-5 h-5 sm:w-6 sm:h-6 text-[9px] sm:text-[11px]" 
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {expanded ? <ChevronUp className="w-4 h-4 ml-auto flex-shrink-0" /> : <ChevronDown className="w-4 h-4 ml-auto flex-shrink-0" />}
          </button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-shrink-0 p-1.5"
            onClick={() => setDismissed(true)}
            data-testid="button-dismiss-alerts"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden flex justify-center px-3 sm:px-6"
          >
            <div className="pt-3 pb-2 space-y-2 max-h-[40vh] overflow-y-auto" data-testid="container-alerts-list">
              {visibleAlerts.map((alert) => (
                <AlertItem key={alert.id} alert={alert} compact />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
