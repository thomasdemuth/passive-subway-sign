import { useState } from "react";
import { StationSearch } from "@/components/StationSearch";
import { ArrivalCard } from "@/components/ArrivalCard";
import { useArrivals, useStations } from "@/hooks/use-stations";
import { ArrowDownCircle, ArrowUpCircle, Train, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [selectedStationId, setSelectedStationId] = useState<string | undefined>();
  const { data: arrivals, isLoading } = useArrivals(selectedStationId || null);
  const { data: stations } = useStations();

  const selectedStation = stations?.find(s => s.id === selectedStationId);

  // Group arrivals by direction
  const uptownArrivals = arrivals?.filter(a => a.direction === "Uptown") || [];
  const downtownArrivals = arrivals?.filter(a => a.direction === "Downtown") || [];

  return (
    <div className="min-h-screen bg-background text-foreground bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-background to-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
        
        {/* Header Section */}
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
            Real-time arrival estimates for the New York City Subway system. 
            Select a station to see upcoming trains.
          </p>
        </div>

        {/* Search Section */}
        <div className="max-w-xl mx-auto mb-16 relative z-20">
          <StationSearch 
            onSelect={setSelectedStationId} 
            selectedStationId={selectedStationId} 
          />
        </div>

        {/* Results Section */}
        <AnimatePresence mode="wait">
          {selectedStationId && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="space-y-12"
            >
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-24 space-y-4 text-muted-foreground">
                  <Loader2 className="w-10 h-10 animate-spin text-primary" />
                  <p>Fetching real-time data from MTA...</p>
                </div>
              ) : arrivals?.length === 0 ? (
                <div className="text-center py-24 border border-dashed border-white/10 rounded-2xl bg-white/5">
                  <p className="text-xl font-medium text-white">No active trains found</p>
                  <p className="text-muted-foreground mt-2">There might be service changes or no upcoming arrivals.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                  
                  {/* Uptown Column */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                      <ArrowUpCircle className="w-6 h-6 text-white" />
                      <h2 className="text-xl font-bold text-white">Uptown / Queens</h2>
                      <span className="ml-auto text-xs font-mono px-2 py-1 rounded bg-white/5 text-muted-foreground">
                        {uptownArrivals.length} trains
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      {uptownArrivals.length > 0 ? (
                        uptownArrivals.map((arrival, i) => (
                          <ArrivalCard 
                            key={`${arrival.routeId}-${arrival.arrivalTime}-${i}`} 
                            arrival={arrival} 
                            index={i} 
                          />
                        ))
                      ) : (
                        <div className="py-8 text-center text-sm text-muted-foreground italic">
                          No upcoming Uptown trains
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Downtown Column */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                      <ArrowDownCircle className="w-6 h-6 text-white" />
                      <h2 className="text-xl font-bold text-white">Downtown / Brooklyn</h2>
                      <span className="ml-auto text-xs font-mono px-2 py-1 rounded bg-white/5 text-muted-foreground">
                        {downtownArrivals.length} trains
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      {downtownArrivals.length > 0 ? (
                        downtownArrivals.map((arrival, i) => (
                          <ArrivalCard 
                            key={`${arrival.routeId}-${arrival.arrivalTime}-${i}`} 
                            arrival={arrival} 
                            index={i} 
                          />
                        ))
                      ) : (
                        <div className="py-8 text-center text-sm text-muted-foreground italic">
                          No upcoming Downtown trains
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        
        {!selectedStationId && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-sm text-muted-foreground/50 mt-24"
          >
            Data provided by MTA GTFS-Realtime Feed. Updates every 30s.
          </motion.div>
        )}
      </div>
    </div>
  );
}
