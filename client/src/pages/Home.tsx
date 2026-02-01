import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useStations } from "@/hooks/use-stations";
import { useUserLocation, calculateWalkingTime } from "@/hooks/use-location";
import { useSoundEffects } from "@/hooks/use-sound";
import { RouteIcon } from "@/components/RouteIcon";
import { Train, Search, Check, ArrowRight, MapPin, Loader2, Bug, X, CheckSquare, ListFilter, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Tutorial, TutorialButton, useTutorial } from "@/components/Tutorial";

const ALL_LINES = ["1", "2", "3", "4", "5", "6", "7", "A", "B", "C", "D", "E", "F", "G", "J", "L", "M", "N", "Q", "R", "S", "W", "Z", "FS", "H"];



export default function Home() {
  const [selectedStationIds, setSelectedStationIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [showDebugMenu, setShowDebugMenu] = useState(false);
  const { data: stations, isLoading } = useStations();
  const [, navigate] = useLocation();
  const { location: userLocation, loading: locationLoading, error: locationError, enabled: locationEnabled, requestLocation, disableLocation } = useUserLocation();
  const { showTutorial, completeTutorial, dismissTutorial, startTutorial } = useTutorial();
  const { playSound } = useSoundEffects();

  // Check for debug mode trigger
  const isDebugTrigger = searchQuery.toLowerCase() === "debug";
  
  // Debug menu functions
  const selectAllStations = () => {
    playSound("click");
    if (stations) {
      setSelectedStationIds(new Set(stations.map(s => s.id)));
    }
    setSearchQuery("");
    setShowDebugMenu(false);
  };
  
  const selectByLine = (line: string) => {
    playSound("click");
    if (stations) {
      const matchingStations = stations.filter(s => s.line.split(" ").includes(line));
      setSelectedStationIds(prev => {
        const next = new Set(prev);
        matchingStations.forEach(s => next.add(s.id));
        return next;
      });
    }
    setSearchQuery("");
    setShowDebugMenu(false);
  };
  
  const clearSelection = () => {
    playSound("click");
    setSelectedStationIds(new Set());
    setSearchQuery("");
    setShowDebugMenu(false);
  };
  
  const openDebugMenu = () => {
    playSound("click");
    setShowDebugMenu(true);
    setSearchQuery("");
  };

  const filteredStations = stations?.filter(s => {
    const query = searchQuery.toLowerCase();
    return s.name.toLowerCase().includes(query) ||
      s.line.toLowerCase().includes(query) ||
      (s.tags && s.tags.some(tag => tag.toLowerCase().includes(query)));
  }) || [];

  const sortedStations = useMemo(() => {
    const stationsCopy = [...filteredStations];
    // Sort by walking time if location enabled, otherwise alphabetically
    if (userLocation) {
      stationsCopy.sort((a, b) => {
        const timeA = a.lat && a.lng ? calculateWalkingTime(userLocation.lat, userLocation.lng, a.lat, a.lng) : Infinity;
        const timeB = b.lat && b.lng ? calculateWalkingTime(userLocation.lat, userLocation.lng, b.lat, b.lng) : Infinity;
        return (timeA ?? Infinity) - (timeB ?? Infinity);
      });
    } else {
      // Natural sort: numbers first (1, 2, 3...), then alphabetical
      stationsCopy.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
    }
    return stationsCopy;
  }, [filteredStations, userLocation]);

  const toggleStation = (id: string) => {
    playSound("toggle");
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
      playSound("click");
      const ids = Array.from(selectedStationIds).join(",");
      navigate(`/departures/${ids}`);
    }
  };
  
  const handleLocationToggle = () => {
    playSound("click");
    if (locationEnabled) {
      disableLocation();
    } else {
      requestLocation();
    }
  };


  return (
    <div className="min-h-screen bg-background text-foreground bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-background to-background">
      <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-16">
        
        <div className="text-center mb-6 sm:mb-12 space-y-2 sm:space-y-4">
          <motion.div
            initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="inline-flex items-center justify-center p-2 sm:p-3 bg-white/5 rounded-full ring-1 ring-white/10 mb-2 sm:mb-4 shadow-2xl"
          >
            <Train className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60"
          >
            Passive Subway Sign
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-sm sm:text-lg text-muted-foreground max-w-lg mx-auto"
          >
            Select one or more stations to view real-time subway arrivals.
          </motion.p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mb-4 sm:mb-8 space-y-3 sm:space-y-4"
        >
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              <Input 
                placeholder="Search stations or lines..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 sm:pl-12 h-11 sm:h-14 bg-secondary/50 border-white/10 text-sm sm:text-base"
                data-testid="input-search"
              />
            </div>
            <Button
              variant={locationEnabled ? "default" : "outline"}
              size="icon"
              className="h-11 sm:h-14 w-11 sm:w-14 shrink-0"
              onClick={handleLocationToggle}
              disabled={locationLoading}
              data-testid="button-toggle-location"
            >
              {locationLoading ? (
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
              ) : (
                <MapPin className={cn("w-4 h-4 sm:w-5 sm:h-5", locationEnabled && "fill-current")} />
              )}
            </Button>
          </div>
          
          {locationEnabled && userLocation && (
            <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span>Showing walking times from your location</span>
            </div>
          )}
          
          {locationError && (
            <div className="flex items-center gap-2 text-[10px] sm:text-xs text-red-400">
              <MapPin className="w-3 h-3" />
              <span>{locationError}</span>
            </div>
          )}

          {/* Debug mode trigger */}
          {isDebugTrigger && !showDebugMenu && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bug className="w-5 h-5 text-yellow-500" />
                  <span className="text-sm text-yellow-200">Debug mode detected</span>
                </div>
                <Button 
                  onClick={openDebugMenu}
                  variant="outline"
                  size="sm"
                  className="border-yellow-500/50 text-yellow-200 hover:bg-yellow-500/20"
                  data-testid="button-open-debug"
                >
                  Open Debug Menu
                </Button>
              </div>
            </motion.div>
          )}

          {/* Debug Menu */}
          <AnimatePresence>
            {showDebugMenu && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 bg-zinc-900 border border-yellow-500/30 rounded-xl space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bug className="w-5 h-5 text-yellow-500" />
                    <span className="text-sm font-semibold text-yellow-200">Debug Menu</span>
                  </div>
                  <Button 
                    onClick={() => { playSound("click"); setShowDebugMenu(false); }}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-white"
                    data-testid="button-close-debug"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Quick Actions */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Quick Actions</p>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      onClick={selectAllStations}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      data-testid="button-select-all"
                    >
                      <CheckSquare className="w-4 h-4" />
                      Select All Stations
                    </Button>
                    <Button 
                      onClick={clearSelection}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      data-testid="button-clear-selection"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear Selection
                    </Button>
                  </div>
                </div>

                {/* Select by Line */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    <ListFilter className="w-3 h-3" />
                    Select by Line
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_LINES.map((line) => (
                      <button
                        key={line}
                        onClick={() => selectByLine(line)}
                        className="hover:scale-110 transition-transform"
                        data-testid={`button-line-${line}`}
                      >
                        <RouteIcon routeId={line} size="sm" className="w-7 h-7 text-sm" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Debug Info */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Debug Info</p>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Total stations: {stations?.length || 0}</p>
                    <p>Selected: {selectedStationIds.size}</p>
                    <p>Location enabled: {locationEnabled ? "Yes" : "No"}</p>
                    {userLocation && (
                      <p>Coords: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {selectedStationIds.size > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-3 sm:p-4 bg-primary/10 border border-primary/20 rounded-xl"
            >
              <span className="text-xs sm:text-sm text-white">
                {selectedStationIds.size} station{selectedStationIds.size !== 1 ? 's' : ''} selected
              </span>
              <Button 
                onClick={handleViewDepartures}
                className="gap-1 sm:gap-2 text-xs sm:text-sm"
                size="sm"
                data-testid="button-view-departures"
              >
                View Departures
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </motion.div>
          )}
        </motion.div>

        <div className="space-y-2">
          {isLoading ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 text-muted-foreground"
            >
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              Loading stations...
            </motion.div>
          ) : sortedStations.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 text-muted-foreground"
            >
              No stations found matching "{searchQuery}"
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 gap-1">
              {sortedStations.map((station) => {
                const isSelected = selectedStationIds.has(station.id);
                const walkingTime = userLocation && station.lat && station.lng
                  ? calculateWalkingTime(userLocation.lat, userLocation.lng, station.lat, station.lng)
                  : null;
                return (
                  <button
                    key={station.id}
                    onClick={() => toggleStation(station.id)}
                    className={cn(
                      "w-full flex items-center justify-between p-2 sm:p-3 rounded-lg border transition-all duration-200 text-left gap-2",
                      isSelected 
                        ? "bg-primary/10 border-primary/30 ring-1 ring-primary/20" 
                        : "bg-card/30 border-white/5 hover:bg-card/50 hover:border-white/10"
                    )}
                    data-testid={`button-station-${station.id}`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <div className={cn(
                        "w-4 h-4 sm:w-5 sm:h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0",
                        isSelected ? "bg-primary border-primary" : "border-white/20"
                      )}>
                        {isSelected && <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary-foreground" />}
                      </div>
                      <span className="text-xs sm:text-sm text-white truncate">{station.name}</span>
                      {walkingTime !== null && (
                        <span className="text-[10px] sm:text-xs text-muted-foreground shrink-0">
                          {walkingTime} min
                        </span>
                      )}
                    </div>
                    
                    <div className="flex -space-x-0.5 flex-wrap justify-end gap-y-0.5 shrink-0">
                      {station.line.split(" ").map((route, i) => (
                        <RouteIcon 
                          key={`${station.id}-${route}-${i}`} 
                          routeId={route} 
                          size="sm" 
                          className="w-4 h-4 sm:w-5 sm:h-5 text-[8px] sm:text-[9px] ring-1 ring-background" 
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-[10px] sm:text-sm text-muted-foreground/50 mt-8 sm:mt-16 pb-4 space-y-2"
        >
          <div>Data provided by MTA GTFS-Realtime Feed - Made by Thomas Demuth</div>
          <TutorialButton onClick={() => { playSound("click"); startTutorial(); }} />
        </motion.div>
      </div>

      {showTutorial && (
        <Tutorial onComplete={completeTutorial} onDismiss={dismissTutorial} />
      )}
    </div>
  );
}
