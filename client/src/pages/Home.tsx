
import { useState } from "react";
import { useLocation } from "wouter";
import { useStations } from "@/hooks/use-stations";
import { RouteIcon } from "@/components/RouteIcon";
import { Train, Search, Check, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function Home() {
  const [selectedStationIds, setSelectedStationIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const { data: stations, isLoading } = useStations();
  const [, navigate] = useLocation();

  const filteredStations = stations?.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.line.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const toggleStation = (id: string) => {
    setSelectedStationIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleViewDepartures = () => {
    if (selectedStationIds.size > 0) {
      const ids = Array.from(selectedStationIds).join(",");
      navigate(`/departures/${ids}`);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-background to-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
        
        <div className="text-center mb-12 space-y-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center justify-center p-3 bg-white/5 rounded-full ring-1 ring-white/10 mb-4 shadow-2xl"
          >
            <Train className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">
            NYC Subway Tracker
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto">
            Select one or more stations to view real-time subway arrivals.
          </p>
        </div>

        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="Search stations or lines (e.g. 'Times Sq', 'A C E')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 bg-secondary/50 border-white/10 text-base"
              data-testid="input-search"
            />
          </div>

          {selectedStationIds.size > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-4 bg-primary/10 border border-primary/20 rounded-xl"
            >
              <span className="text-sm text-white">
                {selectedStationIds.size} station{selectedStationIds.size !== 1 ? 's' : ''} selected
              </span>
              <Button 
                onClick={handleViewDepartures}
                className="gap-2"
                data-testid="button-view-departures"
              >
                View Departures
                <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          )}
        </div>

        <div className="space-y-2">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading stations...
            </div>
          ) : filteredStations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No stations found matching "{searchQuery}"
            </div>
          ) : (
            filteredStations.map((station) => {
              const isSelected = selectedStationIds.has(station.id);
              return (
                <motion.button
                  key={station.id}
                  onClick={() => toggleStation(station.id)}
                  className={cn(
                    "w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-200 text-left",
                    isSelected 
                      ? "bg-primary/10 border-primary/30 ring-1 ring-primary/20" 
                      : "bg-card/50 border-white/5 hover:bg-card hover:border-white/10"
                  )}
                  whileTap={{ scale: 0.99 }}
                  data-testid={`button-station-${station.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors",
                      isSelected ? "bg-primary border-primary" : "border-white/20"
                    )}>
                      {isSelected && <Check className="w-4 h-4 text-primary-foreground" />}
                    </div>
                    <span className="font-medium text-white">{station.name}</span>
                  </div>
                  
                  <div className="flex -space-x-1">
                    {station.line.split(" ").map((route, i) => (
                      <RouteIcon 
                        key={`${station.id}-${route}-${i}`} 
                        routeId={route} 
                        size="sm" 
                        className="w-6 h-6 text-xs ring-1 ring-background" 
                      />
                    ))}
                  </div>
                </motion.button>
              );
            })
          )}
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-sm text-muted-foreground/50 mt-16"
        >
          Data provided by MTA GTFS-Realtime Feed. Covers lines 1-6, A, C, E, G, and S.
        </motion.div>
      </div>
    </div>
  );
}
