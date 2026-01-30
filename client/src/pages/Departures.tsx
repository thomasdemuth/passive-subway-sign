
import { useParams, useLocation } from "wouter";
import { useStations, useArrivals } from "@/hooks/use-stations";
import { ArrivalCard } from "@/components/ArrivalCard";
import { RouteIcon } from "@/components/RouteIcon";
import { ArrowDownCircle, ArrowUpCircle, ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";

function StationDepartures({ stationId, stationName, stationLine }: { stationId: string; stationName: string; stationLine: string }) {
  const { data: arrivals, isLoading, dataUpdatedAt } = useArrivals(stationId);

  const uptownArrivals = arrivals?.filter(a => a.direction === "Uptown").slice(0, 5) || [];
  const downtownArrivals = arrivals?.filter(a => a.direction === "Downtown").slice(0, 5) || [];

  return (
    <Card className="bg-card/50 border-white/10">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-1">
              {stationLine.split(" ").slice(0, 4).map((route, i) => (
                <RouteIcon 
                  key={`${stationId}-${route}-${i}`} 
                  routeId={route} 
                  size="sm" 
                  className="w-6 h-6 text-xs ring-2 ring-background" 
                />
              ))}
            </div>
            <CardTitle className="text-xl">{stationName}</CardTitle>
          </div>
          {dataUpdatedAt && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <RefreshCw className="w-3 h-3" />
              Updated {new Date(dataUpdatedAt).toLocaleTimeString()}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : arrivals?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No active trains at this station
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                <ArrowUpCircle className="w-5 h-5 text-white" />
                <h3 className="font-semibold text-white">Uptown / Queens</h3>
                <span className="ml-auto text-xs text-muted-foreground">{uptownArrivals.length} trains</span>
              </div>
              <div className="space-y-2">
                {uptownArrivals.length > 0 ? (
                  uptownArrivals.map((arrival, i) => (
                    <ArrivalCard 
                      key={`${arrival.routeId}-${arrival.arrivalTime}-${i}`} 
                      arrival={arrival} 
                      index={i} 
                    />
                  ))
                ) : (
                  <div className="py-6 text-center text-sm text-muted-foreground italic">
                    No upcoming Uptown trains
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                <ArrowDownCircle className="w-5 h-5 text-white" />
                <h3 className="font-semibold text-white">Downtown / Brooklyn</h3>
                <span className="ml-auto text-xs text-muted-foreground">{downtownArrivals.length} trains</span>
              </div>
              <div className="space-y-2">
                {downtownArrivals.length > 0 ? (
                  downtownArrivals.map((arrival, i) => (
                    <ArrivalCard 
                      key={`${arrival.routeId}-${arrival.arrivalTime}-${i}`} 
                      arrival={arrival} 
                      index={i} 
                    />
                  ))
                ) : (
                  <div className="py-6 text-center text-sm text-muted-foreground italic">
                    No upcoming Downtown trains
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Departures() {
  const params = useParams<{ ids: string }>();
  const [, navigate] = useLocation();
  const { data: stations } = useStations();

  const stationIds = params.ids?.split(",") || [];
  const selectedStations = stations?.filter(s => stationIds.includes(s.id)) || [];

  return (
    <div className="min-h-screen bg-background text-foreground bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-background to-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/")}
            className="gap-2"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Selection
          </Button>
          <div className="flex-1" />
          <span className="text-sm text-muted-foreground">
            Tracking {selectedStations.length} station{selectedStations.length !== 1 ? 's' : ''}
          </span>
        </div>

        <AnimatePresence>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
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

        {selectedStations.length === 0 && (
          <div className="text-center py-24 text-muted-foreground">
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
        )}

        <div className="text-center text-xs text-muted-foreground/50 mt-12">
          Data provided by MTA GTFS-Realtime Feed. Updates every 30s.
        </div>
      </div>
    </div>
  );
}
