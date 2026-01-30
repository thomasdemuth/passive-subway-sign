import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useStations } from "@/hooks/use-stations";
import { RouteIcon } from "@/components/RouteIcon";
import { Train, Search, Check, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const FEED_GROUPS: Record<string, { name: string; lines: string }> = {
  "123456S": { name: "1-6, S", lines: "1 2 3 4 5 6 S" },
  "ACE": { name: "A, C, E", lines: "A C E" },
  "BDFM": { name: "B, D, F, M", lines: "B D F M" },
  "G": { name: "G", lines: "G" },
  "JZ": { name: "J, Z", lines: "J Z" },
  "L": { name: "L", lines: "L" },
  "NQRW": { name: "N, Q, R, W", lines: "N Q R W" },
  "SI": { name: "Staten Island", lines: "SIR" },
};

function getFeedGroup(stationId: string): string {
  const firstChar = stationId.charAt(0);
  const numericId = parseInt(stationId);
  
  if (!isNaN(numericId) && numericId >= 100 && numericId < 800) {
    return "123456S";
  }
  if (firstChar === "A" || firstChar === "C" || firstChar === "E" || firstChar === "H") {
    return "ACE";
  }
  if (firstChar === "B" || firstChar === "D" || firstChar === "F" || firstChar === "M") {
    return "BDFM";
  }
  if (firstChar === "G") {
    return "G";
  }
  if (firstChar === "J" || firstChar === "Z") {
    return "JZ";
  }
  if (firstChar === "L") {
    return "L";
  }
  if (firstChar === "N" || firstChar === "Q" || firstChar === "R" || firstChar === "W") {
    return "NQRW";
  }
  if (firstChar === "S" && stationId.length > 1) {
    return "SI";
  }
  return "123456S";
}

export default function Home() {
  const [selectedStationIds, setSelectedStationIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const { data: stations, isLoading } = useStations();
  const [, navigate] = useLocation();

  const filteredStations = stations?.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.line.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const groupedStations = useMemo(() => {
    const groups: Record<string, typeof filteredStations> = {};
    for (const station of filteredStations) {
      const feedGroup = getFeedGroup(station.id);
      if (!groups[feedGroup]) {
        groups[feedGroup] = [];
      }
      groups[feedGroup].push(station);
    }
    return groups;
  }, [filteredStations]);

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

  const feedOrder = ["123456S", "ACE", "BDFM", "G", "JZ", "L", "NQRW", "SI"];

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

        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading stations...
            </div>
          ) : filteredStations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No stations found matching "{searchQuery}"
            </div>
          ) : (
            feedOrder.map(feedKey => {
              const stationsInGroup = groupedStations[feedKey];
              if (!stationsInGroup || stationsInGroup.length === 0) return null;
              
              const feedInfo = FEED_GROUPS[feedKey];
              
              return (
                <div key={feedKey} className="space-y-2">
                  <div className="flex items-center gap-3 px-1 pb-2 border-b border-white/10">
                    <div className="flex -space-x-1">
                      {feedInfo.lines.split(" ").slice(0, 4).map((line, i) => (
                        <RouteIcon 
                          key={`${feedKey}-${line}-${i}`} 
                          routeId={line} 
                          size="sm" 
                          className="w-5 h-5 text-[10px] ring-1 ring-background" 
                        />
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-white">{feedInfo.name}</span>
                    <span className="text-xs text-muted-foreground">({stationsInGroup.length})</span>
                  </div>
                  
                  <div className="space-y-1">
                    {stationsInGroup.map((station) => {
                      const isSelected = selectedStationIds.has(station.id);
                      return (
                        <motion.button
                          key={station.id}
                          onClick={() => toggleStation(station.id)}
                          className={cn(
                            "w-full flex items-center justify-between p-3 rounded-lg border transition-all duration-200 text-left",
                            isSelected 
                              ? "bg-primary/10 border-primary/30 ring-1 ring-primary/20" 
                              : "bg-card/30 border-white/5 hover:bg-card/50 hover:border-white/10"
                          )}
                          whileTap={{ scale: 0.99 }}
                          data-testid={`button-station-${station.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                              isSelected ? "bg-primary border-primary" : "border-white/20"
                            )}>
                              {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                            </div>
                            <span className="text-sm text-white">{station.name}</span>
                          </div>
                          
                          <div className="flex -space-x-0.5">
                            {station.line.split(" ").slice(0, 4).map((route, i) => (
                              <RouteIcon 
                                key={`${station.id}-${route}-${i}`} 
                                routeId={route} 
                                size="sm" 
                                className="w-5 h-5 text-[9px] ring-1 ring-background" 
                              />
                            ))}
                            {station.line.split(" ").length > 4 && (
                              <div className="w-5 h-5 rounded-full bg-zinc-700 ring-1 ring-background flex items-center justify-center text-[8px] text-zinc-300">
                                +{station.line.split(" ").length - 4}
                              </div>
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
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
          Data provided by MTA GTFS-Realtime Feed
        </motion.div>
      </div>
    </div>
  );
}
