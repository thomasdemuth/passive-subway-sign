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

function AlertItem({ alert, compact = false }: { alert: ServiceAlert; compact?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  
  const severityColor = alert.severity >= 30 
    ? "bg-red-500/20 border-red-500/50" 
    : alert.severity >= 20 
      ? "bg-orange-500/20 border-orange-500/50" 
      : "bg-yellow-500/20 border-yellow-500/50";
  
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
          <div className="flex items-center gap-2">
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
  
  // Filter out planned work alerts - only show emergency/active alerts
  const activeAlerts = alerts.filter(alert => 
    alert.alertType !== "Planned Work" && 
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
  
  const highSeverityCount = uniqueAlerts.filter(a => a.severity >= 30).length;
  const mediumSeverityCount = uniqueAlerts.filter(a => a.severity >= 20 && a.severity < 30).length;
  const affectedRoutes = Array.from(new Set(uniqueAlerts.map(a => a.routeId)));
  
  return (
    <div className="bg-background/90 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
      <div className="px-3 sm:px-6 py-2">
        <div className="flex items-center justify-between gap-2">
          <button 
            className="flex items-center gap-2 flex-1"
            onClick={() => setExpanded(!expanded)}
            data-testid="button-toggle-alerts"
          >
            <AlertTriangle className={cn(
              "w-4 h-4 flex-shrink-0",
              highSeverityCount > 0 ? "text-red-500" : mediumSeverityCount > 0 ? "text-orange-500" : "text-yellow-500"
            )} />
            <span 
              className="text-xs sm:text-sm font-medium"
              data-testid="text-alert-summary"
            >
              {uniqueAlerts.length} Service Alert{uniqueAlerts.length !== 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-1" data-testid="container-affected-routes">
              {affectedRoutes.slice(0, 6).map((routeId, index) => (
                <RouteIcon 
                  key={routeId}
                  routeId={routeId} 
                  size="sm" 
                  className="w-4 h-4 text-[8px]" 
                  data-testid={`icon-route-alert-${index}`}
                />
              ))}
              {affectedRoutes.length > 6 && (
                <span className="text-xs text-muted-foreground" data-testid="text-more-routes">
                  +{affectedRoutes.length - 6}
                </span>
              )}
            </div>
            {expanded ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
          </button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-shrink-0 p-1"
            onClick={() => setDismissed(true)}
            data-testid="button-dismiss-alerts"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
        
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-3 space-y-2 max-h-[40vh] overflow-y-auto" data-testid="container-alerts-list">
                {uniqueAlerts.map((alert) => (
                  <AlertItem key={alert.id} alert={alert} compact />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
