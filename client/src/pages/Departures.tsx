
import { useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { useStations, useArrivals } from "@/hooks/use-stations";
import { ArrivalCard } from "@/components/ArrivalCard";
import { RouteIcon } from "@/components/RouteIcon";
import { ArrowDownCircle, ArrowUpCircle, ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

function StationDepartures({ stationId, stationName, stationLine }: { stationId: string; stationName: string; stationLine: string }) {
  const { data: arrivals, isLoading, dataUpdatedAt } = useArrivals(stationId);
  const availableLines = stationLine.split(" ");
  const [selectedLines, setSelectedLines] = useState<Set<string>>(new Set(availableLines));
  
  const toggleLine = (line: string) => {
    setSelectedLines(prev => {
      const next = new Set(prev);
      if (next.has(line)) {
        if (next.size > 1) {
          next.delete(line);
        }
      } else {
        next.add(line);
      }
      return next;
    });
  };
  
  const selectAllLines = () => {
    setSelectedLines(new Set(availableLines));
  };

  const filteredArrivals = useMemo(() => {
    if (!arrivals) return [];
    return arrivals.filter(a => selectedLines.has(a.routeId) || selectedLines.has(a.routeId.replace('X', '')));
  }, [arrivals, selectedLines]);

  const uptownArrivals = filteredArrivals.filter(a => a.direction === "Uptown").slice(0, 3);
  const downtownArrivals = filteredArrivals.filter(a => a.direction === "Downtown").slice(0, 3);

  return (
    <Card className="bg-card/50 border-white/10 w-[calc(100vw-24px)] sm:w-[320px] md:w-[360px] flex-shrink-0">
      <CardHeader className="pb-2 px-3 sm:px-4 pt-3 sm:pt-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm sm:text-base truncate">{stationName}</CardTitle>
          {dataUpdatedAt && (
            <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-muted-foreground flex-shrink-0">
              <RefreshCw className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              {new Date(dataUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>
        {availableLines.length > 1 && (
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[9px] sm:text-[10px] text-muted-foreground mr-1">Filter:</span>
            {availableLines.map((line, i) => (
              <button
                key={`${stationId}-filter-${line}-${i}`}
                onClick={() => toggleLine(line)}
                className={cn(
                  "transition-all duration-200",
                  selectedLines.has(line) ? "opacity-100 scale-100" : "opacity-30 scale-90"
                )}
                data-testid={`button-filter-${line}`}
              >
                <RouteIcon 
                  routeId={line} 
                  size="sm" 
                  className="w-5 h-5 sm:w-6 sm:h-6 text-[9px] sm:text-[10px] ring-1 ring-background" 
                />
              </button>
            ))}
            {selectedLines.size < availableLines.length && (
              <button
                onClick={selectAllLines}
                className="text-[9px] sm:text-[10px] text-primary hover:underline ml-1"
                data-testid="button-show-all"
              >
                Show all
              </button>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4 pt-2 space-y-3 sm:space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : arrivals?.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            No active trains
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex items-center gap-2 pb-1 border-b border-white/10">
                <ArrowUpCircle className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                <span className="text-[10px] sm:text-xs font-semibold text-white">Uptown</span>
              </div>
              <div className="space-y-1.5">
                {uptownArrivals.length > 0 ? (
                  uptownArrivals.map((arrival, i) => (
                    <ArrivalCard 
                      key={`${arrival.routeId}-${arrival.arrivalTime}-${i}`} 
                      arrival={arrival} 
                      index={i} 
                    />
                  ))
                ) : (
                  <div className="py-3 text-center text-xs text-muted-foreground italic">
                    No Uptown trains
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 pb-1 border-b border-white/10">
                <ArrowDownCircle className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                <span className="text-[10px] sm:text-xs font-semibold text-white">Downtown</span>
              </div>
              <div className="space-y-1.5">
                {downtownArrivals.length > 0 ? (
                  downtownArrivals.map((arrival, i) => (
                    <ArrivalCard 
                      key={`${arrival.routeId}-${arrival.arrivalTime}-${i}`} 
                      arrival={arrival} 
                      index={i} 
                    />
                  ))
                ) : (
                  <div className="py-3 text-center text-xs text-muted-foreground italic">
                    No Downtown trains
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function Departures() {
  const params = useParams<{ ids: string }>();
  const [, navigate] = useLocation();
  const { data: stations, isLoading: stationsLoading } = useStations();

  const stationIds = params.ids?.split(",") || [];
  const selectedStations = stations?.filter(s => stationIds.includes(s.id)) || [];

  return (
    <div className="h-screen flex flex-col bg-background text-foreground bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-background to-background">
      <div className="flex items-center gap-2 sm:gap-4 px-3 sm:px-4 py-2 sm:py-3 border-b border-white/10">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate("/")}
          className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
          data-testid="button-back"
        >
          <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
          Back
        </Button>
        <div className="flex-1" />
        <span className="text-[10px] sm:text-xs text-muted-foreground">
          {selectedStations.length} station{selectedStations.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex-1 overflow-hidden">
        {stationsLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : selectedStations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p className="text-lg">No stations selected</p>
            <Button 
              variant="outline" 
              onClick={() => navigate("/")} 
              className="mt-4"
              data-testid="button-select-stations"
            >
              Select Stations
            </Button>
          </div>
        ) : (
          <ScrollArea className="h-full w-full">
            <AnimatePresence>
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex gap-3 p-3 sm:p-4"
              >
                {selectedStations.map((station) => (
                  <StationDepartures 
                    key={station.id}
                    stationId={station.id}
                    stationName={station.name}
                    stationLine={station.line}
                  />
                ))}
              </motion.div>
            </AnimatePresence>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}
      </div>

      <div className="text-center text-[9px] sm:text-[10px] text-muted-foreground/50 py-1.5 sm:py-2 border-t border-white/10">
        MTA GTFS-Realtime • Updates every 30s
      </div>
    </div>
  );
}
