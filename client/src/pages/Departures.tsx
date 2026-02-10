
import { useState, useMemo, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useStations, useArrivals } from "@/hooks/use-stations";
import { useUserLocation, calculateWalkingTime } from "@/hooks/use-location";
import { ArrivalCard } from "@/components/ArrivalCard";
import { RouteIcon } from "@/components/RouteIcon";
import { ServiceAlertBanner } from "@/components/ServiceAlertBanner";
import { ArrowDownCircle, ArrowUpCircle, ArrowLeft, Loader2, PersonStanding, ZoomIn, ZoomOut, Maximize, Minimize, X, Volume2, VolumeX, GripVertical } from "lucide-react";
import { useSoundEffects } from "@/hooks/use-sound";
import { useWeather } from "@/hooks/use-weather";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragStartEvent, DragOverlay } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function useCurrentTime() {
  const [now, setNow] = useState(new Date());
  
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  
  return now;
}

function StationDepartures({ stationId, stationName, stationLine, walkingTime, debugMode, onClose }: { stationId: string; stationName: string; stationLine: string; walkingTime: number | null; debugMode?: boolean; onClose?: () => void }) {
  const { data: arrivals, isLoading, dataUpdatedAt } = useArrivals(stationId);
  const { playSound } = useSoundEffects();
  
  // Combine static lines with dynamically detected lines from arrivals
  const availableLines = useMemo(() => {
    const staticLines = new Set(stationLine.split(" ").filter(l => l));
    if (arrivals) {
      arrivals.forEach(a => {
        let routeId = a.routeId.replace('X', '');
        // Normalize route IDs
        if (routeId === 'SI') routeId = 'SIR';
        if (routeId === 'GS') routeId = 'S';
        staticLines.add(routeId);
      });
    }
    return Array.from(staticLines);
  }, [stationLine, arrivals]);
  
  const [selectedLines, setSelectedLines] = useState<Set<string>>(new Set(stationLine.split(" ").filter(l => l)));
  
  // Update selected lines when new routes are detected
  useEffect(() => {
    setSelectedLines(prev => {
      const updated = new Set(prev);
      availableLines.forEach(line => updated.add(line));
      return updated;
    });
  }, [availableLines]);
  
  const toggleLine = (line: string) => {
    playSound("toggle");
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
    return arrivals.filter(a => {
      const baseRoute = a.routeId.replace('X', '');
      // Handle route ID mismatches between MTA feed and display
      // SIR/SI: MTA feed uses "SI" but we display as "SIR"
      // GS/S: MTA feed uses "GS" for 42nd St Shuttle but we display as "S"
      let normalizedRoute = baseRoute;
      if (baseRoute === 'SI') normalizedRoute = 'SIR';
      if (baseRoute === 'GS') normalizedRoute = 'S';
      return selectedLines.has(a.routeId) || selectedLines.has(baseRoute) || selectedLines.has(normalizedRoute);
    });
  }, [arrivals, selectedLines]);

  // Terminal stations only show one direction with more departures
  const TERMINAL_STATIONS = [
    "D43", "F39",  // Coney Island-Stillwell Av
    "247",         // Flatbush Av-Brooklyn College (2/5)
    "L29",         // Canarsie-Rockaway Pkwy (L)
    "257",         // New Lots Av (3)
    "A54", "A65",  // Ozone Park-Lefferts Blvd (A)
    "F01",         // Jamaica-179 St (F)
    "701",         // Flushing-Main St (7)
    "601",         // Pelham Bay Park (6)
    "E01",         // World Trade Center (E)
    "101",         // Van Cortlandt Park-242 St (1)
    "401",         // Woodlawn (4)
    "D01",         // Norwood-205 St (D)
    "501",         // Eastchester-Dyre Av (5)
    "201",         // Wakefield-241 St (2)
    "G05",         // Jamaica Center-Parsons/Archer (E/J/Z)
    "R01",         // Astoria-Ditmars Blvd (N/W)
    "S31",         // St George (SIR)
    "R45",         // Bay Ridge-95 St (R)
    "M01",         // Middle Village-Metropolitan Av (M)
  ];
  const isTerminalStation = TERMINAL_STATIONS.includes(stationId);
  
  // Terminals where trains depart Downtown (uptown/northern end of line)
  const DOWNTOWN_TERMINALS = [
    "G05", "F01",  // Jamaica Center, Jamaica-179 St
    "101",         // Van Cortlandt Park-242 St (1)
    "201",         // Wakefield-241 St (2)
    "401",         // Woodlawn (4)
    "D01",         // Norwood-205 St (D)
    "601",         // Pelham Bay Park (6)
    "701",         // Flushing-Main St (7)
    "501",         // Eastchester-Dyre Av (5)
  ];
  // Note: M01/M22 are terminals but departures are "Uptown" direction (not Downtown)
  const isDowntownTerminal = DOWNTOWN_TERMINALS.includes(stationId);
  
  const uptownArrivals = filteredArrivals.filter(a => a.direction === "Uptown").slice(0, isTerminalStation ? 7 : 3);
  const downtownArrivals = filteredArrivals.filter(a => a.direction === "Downtown").slice(0, isTerminalStation ? 7 : 3);
  
  // For terminals, show the appropriate direction's departures
  const terminalArrivals = isDowntownTerminal ? downtownArrivals : uptownArrivals;

  return (
    <Card className="bg-card/60 backdrop-blur-sm border-white/10 w-[calc(100vw-24px)] sm:w-[320px] md:w-[360px] h-[420px] sm:h-[450px] flex-shrink-0 shadow-xl shadow-black/20 transition-all duration-300 hover:bg-card/70 hover:border-white/15 flex flex-col">
      <CardHeader className="pb-2 px-3 sm:px-4 pt-3 sm:pt-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-base sm:text-lg font-semibold truncate">{stationName}</span>
          <div className="flex items-center gap-2 flex-shrink-0">
            {walkingTime !== null && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <PersonStanding className="w-3.5 h-3.5" />
                <span>{walkingTime} min</span>
              </div>
            )}
            {debugMode && onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => { playSound("click"); onClose(); }}
                className="h-6 w-6 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                data-testid={`button-close-station-${stationId}`}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {availableLines.map((line, i) => (
            availableLines.length > 1 ? (
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
                  className="w-4 h-4 sm:w-5 sm:h-5 text-[8px] sm:text-[9px] ring-1 ring-background" 
                />
              </button>
            ) : (
              <RouteIcon 
                key={`${stationId}-line-${line}-${i}`}
                routeId={line} 
                size="sm" 
                className="w-4 h-4 sm:w-5 sm:h-5 text-[8px] sm:text-[9px] ring-1 ring-background" 
              />
            )
          ))}
          {availableLines.length > 1 && (
            <span className="text-[8px] sm:text-[9px] text-white/40 ml-1">
              {selectedLines.size < availableLines.length ? (
                <button
                  onClick={selectAllLines}
                  className="text-primary hover:underline"
                  data-testid="button-show-all"
                >
                  show all
                </button>
              ) : (
                "click to filter"
              )}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4 pt-2 flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 flex flex-col">
          {/* Uptown Section (or Departures for terminals) */}
          <div className={isTerminalStation ? "flex-1" : "flex-1"}>
            <div className="flex items-center gap-2 pb-1.5 border-b border-white/10">
              <ArrowUpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              <span className="text-[10px] sm:text-xs font-semibold text-white/90 uppercase tracking-wide">
                {isTerminalStation ? "Departures" : "Uptown"}
              </span>
            </div>
            <div className={cn("mt-1", isTerminalStation ? "h-[230px]" : "h-[99px]")}>
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {(isTerminalStation ? terminalArrivals : uptownArrivals).length > 0 ? (
                    <div className="space-y-0.5">
                      {(isTerminalStation ? terminalArrivals : uptownArrivals).map((arrival, i) => (
                        <ArrivalCard 
                          key={`${arrival.routeId}-${arrival.arrivalTime}-${i}`} 
                          arrival={arrival} 
                          index={i} 
                        />
                      ))}
                    </div>
                  ) : (
                    <motion.div 
                      className="h-full flex flex-col items-center justify-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <motion.div
                        className="flex items-center justify-center"
                        animate={{ opacity: [0.15, 0.35, 0.15] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <X className="w-12 h-12 text-red-500/25" strokeWidth={3} />
                      </motion.div>
                      <span className="text-xs text-muted-foreground/60 mt-1">No trains</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          </div>

          {/* Downtown Section - hidden for terminal stations */}
          {!isTerminalStation && (
            <div className="mt-0">
              <div className="flex items-center gap-2 pb-1.5 border-b border-white/10">
                <ArrowDownCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                <span className="text-[10px] sm:text-xs font-semibold text-white/90 uppercase tracking-wide">Downtown</span>
              </div>
              <div className="h-[130px] mt-1">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {downtownArrivals.length > 0 ? (
                      <div className="space-y-0.5">
                        {downtownArrivals.map((arrival, i) => (
                          <ArrivalCard 
                            key={`${arrival.routeId}-${arrival.arrivalTime}-${i}`} 
                            arrival={arrival} 
                            index={i} 
                          />
                        ))}
                      </div>
                    ) : (
                      <motion.div 
                        className="h-full flex flex-col items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <motion.div
                          className="flex items-center justify-center"
                          animate={{ opacity: [0.15, 0.35, 0.15] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <X className="w-12 h-12 text-red-500/25" strokeWidth={3} />
                        </motion.div>
                        <span className="text-xs text-muted-foreground/60 mt-1">No downtown trains</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface SortableStationProps {
  id: string;
  station: { id: string; name: string; line: string; lat?: number | null; lng?: number | null };
  walkingTime: number | null;
  debugMode: boolean;
  onClose: () => void;
  isFullscreen: boolean;
}

function SortableStation({ id, station, walkingTime, debugMode, onClose, isFullscreen }: SortableStationProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id, disabled: isFullscreen });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: transition || 'transform 200ms cubic-bezier(0.25, 1, 0.5, 1)',
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={cn(
        "relative group",
        isDragging && "opacity-30",
        isOver && !isFullscreen && "ring-2 ring-primary ring-offset-2 ring-offset-background rounded-xl"
      )}
    >
      {!isFullscreen && (
        <div
          {...attributes}
          {...listeners}
          className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 cursor-grab active:cursor-grabbing px-3 py-1 rounded-full bg-zinc-800/90 backdrop-blur-sm border border-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity touch-none flex items-center gap-1"
          data-testid={`drag-handle-${station.id}`}
        >
          <GripVertical className="w-3 h-3 text-white/70" />
          <span className="text-[10px] text-white/50">drag</span>
        </div>
      )}
      <StationDepartures
        stationId={station.id}
        stationName={station.name}
        stationLine={station.line}
        walkingTime={walkingTime}
        debugMode={debugMode}
        onClose={isFullscreen ? undefined : onClose}
      />
    </div>
  );
}

export default function Departures() {
  const [location, navigate] = useLocation();
  // Extract station IDs from URL path /departures/:ids
  const ids = location.startsWith("/departures/") ? location.replace("/departures/", "") : "";
  const { data: stations, isLoading: stationsLoading } = useStations();
  const { location: userLocation } = useUserLocation();
  const currentTime = useCurrentTime();
  const [zoom, setZoom] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hiddenStationIds, setHiddenStationIds] = useState<Set<string>>(new Set());
  
  // Read debug mode from localStorage (set on Home page)
  const debugMode = typeof window !== 'undefined' && localStorage.getItem("debugMode") === "true";
  
  const hideStation = (stationId: string) => {
    setHiddenStationIds(prev => {
      const next = new Set(prev);
      next.add(stationId);
      return next;
    });
  };
  
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [autoScale, setAutoScale] = useState(1);
  const initialScaleCalculated = useRef(false);
  const { isMuted, toggleMute, playSound } = useSoundEffects();
  const { weather } = useWeather();
  
  const zoomIn = () => {
    playSound("zoom");
    setZoom(prev => Math.min(prev + 0.1, 1.5));
  };
  const zoomOut = () => {
    playSound("zoom");
    setZoom(prev => Math.max(prev - 0.1, 0.5));
  };
  
  // Calculate auto-scale only once on initial load and on window resize
  // Don't recalculate when data refreshes to prevent box size jumping
  useEffect(() => {
    const calculateScale = () => {
      if (!containerRef.current || !contentRef.current) return;
      
      const containerHeight = containerRef.current.clientHeight;
      const availableHeight = containerHeight - 20; // 10px top + 10px bottom
      
      // Get the natural height of content at scale 1
      const contentHeight = contentRef.current.scrollHeight;
      
      if (contentHeight > 0 && availableHeight > 0) {
        const scale = Math.min(1.5, Math.max(0.6, availableHeight / contentHeight));
        setAutoScale(scale);
        initialScaleCalculated.current = true;
      }
    };
    
    const handleResize = () => {
      // Always recalculate on resize
      calculateScale();
    };
    
    // Only calculate initial scale once after content renders
    if (!initialScaleCalculated.current) {
      const timeout = setTimeout(calculateScale, 100);
      return () => clearTimeout(timeout);
    }
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [ids]);
  
  // Reset scale calculation flag when stations change
  useEffect(() => {
    initialScaleCalculated.current = false;
  }, [ids]);
  
  const effectiveScale = autoScale * zoom;
  
  const toggleFullscreen = async () => {
    playSound("toggle");
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };
  
  const handleToggleMute = () => {
    if (isMuted) {
      toggleMute();
      setTimeout(() => playSound("click"), 50);
    } else {
      playSound("click");
      toggleMute();
    }
  };
  
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);
  
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const hideControls = () => {
      timeout = setTimeout(() => setShowControls(false), 10000);
    };
    
    const handleActivity = () => {
      setShowControls(true);
      clearTimeout(timeout);
      hideControls();
    };
    
    hideControls();
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, []);
  
  const timeString = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateString = currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

  const stationIds = ids?.split(",").filter(Boolean) || [];
  
  // State to track ordered station IDs (for drag and drop reordering)
  const [orderedIds, setOrderedIds] = useState<string[]>(stationIds);
  
  // Sync orderedIds when URL changes (new stations added/removed)
  useEffect(() => {
    setOrderedIds(prev => {
      // Keep existing order, add new IDs at the end, remove IDs no longer present
      const existingOrder = prev.filter(id => stationIds.includes(id));
      const newIds = stationIds.filter(id => !prev.includes(id));
      return [...existingOrder, ...newIds];
    });
  }, [ids]);
  
  // Get stations in their ordered sequence
  const selectedStations = useMemo(() => {
    if (!stations) return [];
    const stationMap = new Map(stations.map(s => [s.id, s]));
    return orderedIds
      .filter(id => stationMap.has(id) && !hiddenStationIds.has(id))
      .map(id => stationMap.get(id)!);
  }, [stations, orderedIds, hiddenStationIds]);
  
  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Track the currently dragged station for DragOverlay
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeStation = useMemo(() => {
    if (!activeId || !stations) return null;
    return stations.find(s => s.id === activeId) || null;
  }, [activeId, stations]);
  
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    playSound("drag");
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    
    if (over && active.id !== over.id) {
      playSound("drop");
      setOrderedIds((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        // Update URL with new order
        navigate(`/departures/${newOrder.join(",")}`, { replace: true });
        return newOrder;
      });
    } else {
      playSound("click");
    }
  };
  
  const allRouteIds = useMemo(() => {
    const routes = new Set<string>();
    selectedStations.forEach(station => {
      station.line.split(" ").forEach(line => routes.add(line));
    });
    return Array.from(routes);
  }, [selectedStations]);
  
  const getWalkingTime = (station: { lat?: number | null; lng?: number | null }) => {
    if (!userLocation || !station.lat || !station.lng) return null;
    const baseTime = calculateWalkingTime(userLocation.lat, userLocation.lng, station.lat, station.lng);
    if (baseTime === null) return null;
    return baseTime + 2; // Add 2-minute buffer
  };

  return (
    <div className="h-screen flex flex-col bg-background text-foreground bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-background to-background">
      <div className="bg-background/80 backdrop-blur-md border-b border-white/10">
        <div className="px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-center relative">
          <div className={cn("absolute left-3 sm:left-6 flex items-center gap-1 sm:gap-2 transition-opacity duration-300", showControls ? "opacity-100" : "opacity-0 pointer-events-none")}>
            <Button
              variant="outline"
              size="icon"
              onClick={() => { playSound("whoosh"); navigate("/"); }}
              className="bg-background/80 backdrop-blur-md h-8 w-8 sm:h-9 sm:w-9 border-zinc-600 text-zinc-400"
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={zoomOut}
              className="bg-background/80 backdrop-blur-md h-8 w-8 sm:h-9 sm:w-9 border-zinc-600 text-zinc-400"
              data-testid="button-zoom-out"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={zoomIn}
              className="bg-background/80 backdrop-blur-md h-8 w-8 sm:h-9 sm:w-9 border-zinc-600 text-zinc-400"
              data-testid="button-zoom-in"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleFullscreen}
              className="bg-background/80 backdrop-blur-md h-8 w-8 sm:h-9 sm:w-9 border-zinc-600 text-zinc-400"
              data-testid="button-fullscreen"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleToggleMute}
              className="bg-background/80 backdrop-blur-md h-8 w-8 sm:h-9 sm:w-9 border-zinc-600 text-zinc-400"
              data-testid="button-mute"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-3xl sm:text-5xl font-bold tabular-nums text-white" data-testid="text-time">
              {timeString}
            </span>
            <span className="text-xs sm:text-sm text-muted-foreground" data-testid="text-date">
              {dateString}
            </span>
          </div>
          {weather && (
            <div className={cn("absolute right-3 sm:right-6 flex items-center gap-1.5 transition-opacity duration-300", showControls ? "opacity-100" : "opacity-0 pointer-events-none")} data-testid="weather-display">
              <span className="text-lg sm:text-xl">{weather.icon}</span>
              <div className="flex flex-col items-end">
                <span className="text-sm sm:text-base font-semibold text-white tabular-nums" data-testid="text-temperature">{weather.temperature}°F</span>
                <span className="text-[10px] sm:text-xs text-zinc-400 leading-tight" data-testid="text-conditions">{weather.description}</span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {allRouteIds.length > 0 && (
        <ServiceAlertBanner routeIds={allRouteIds} />
      )}
      
      <div ref={containerRef} className="flex-1 overflow-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] py-[10px]">
        {stationsLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : selectedStations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p className="text-lg">No stations selected</p>
            <Button 
              variant="outline" 
              onClick={() => { playSound("whoosh"); navigate("/"); }} 
              className="mt-4"
              data-testid="button-select-stations"
            >
              Select Stations
            </Button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div 
              ref={contentRef}
              className="h-full flex justify-center"
              style={{ transform: `scale(${effectiveScale})`, transformOrigin: 'top center' }}
            >
              <ScrollArea className="h-full">
                <SortableContext
                  items={selectedStations.map(s => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <AnimatePresence mode="wait">
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-wrap justify-center items-start gap-4 p-4 sm:p-6 portrait:flex-col portrait:items-center landscape:flex-row"
                    >
                      {selectedStations.map((station, index) => (
                        <motion.div
                          key={station.id}
                          initial={{ opacity: 0, y: 20, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ 
                            delay: index * 0.1, 
                            duration: 0.4, 
                            ease: [0.25, 0.46, 0.45, 0.94]
                          }}
                        >
                          <SortableStation
                            id={station.id}
                            station={station}
                            walkingTime={getWalkingTime(station)}
                            debugMode={debugMode}
                            onClose={() => hideStation(station.id)}
                            isFullscreen={isFullscreen}
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                  </AnimatePresence>
                </SortableContext>
                <ScrollBar orientation="horizontal" className="landscape:block portrait:hidden" />
                <ScrollBar orientation="vertical" className="portrait:block landscape:hidden" />
              </ScrollArea>
            </div>
            <DragOverlay dropAnimation={{
              duration: 200,
              easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
            }}>
              {activeStation ? (
                <div className="opacity-95 shadow-2xl shadow-black/50 ring-2 ring-primary rounded-xl">
                  <StationDepartures
                    stationId={activeStation.id}
                    stationName={activeStation.name}
                    stationLine={activeStation.line}
                    walkingTime={getWalkingTime(activeStation)}
                    debugMode={debugMode}
                    onClose={() => {}}
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      <div className="text-center text-[9px] sm:text-[10px] text-muted-foreground/50 py-1.5 sm:py-2 border-t border-white/10">
        MTA GTFS-Realtime • Updates every 30s
      </div>
      
    </div>
  );
}
