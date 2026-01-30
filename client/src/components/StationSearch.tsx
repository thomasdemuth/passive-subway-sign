import * as React from "react";
import { Check, Search, TrainFront } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useStations } from "@/hooks/use-stations";
import { RouteIcon } from "./RouteIcon";

interface StationSearchProps {
  onSelect: (stationId: string) => void;
  selectedStationId?: string;
}

export function StationSearch({ onSelect, selectedStationId }: StationSearchProps) {
  const [open, setOpen] = React.useState(false);
  const { data: stations, isLoading } = useStations();
  
  const selectedStation = stations?.find((s) => s.id === selectedStationId);

  // Group stations by line for better visual parsing if needed, 
  // but flattened list with search is usually better for direct access.

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-14 px-4 text-base bg-secondary/50 border-white/10 hover:bg-secondary/80 hover:text-white transition-all duration-300"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <Search className="h-5 w-5 opacity-50 shrink-0" />
            <span className={cn("truncate", !selectedStation && "text-muted-foreground")}>
              {selectedStation ? selectedStation.name : "Search for a station..."}
            </span>
          </div>
          {selectedStation && (
            <div className="flex -space-x-1 shrink-0 ml-2">
              {selectedStation.line.split(" ").slice(0, 3).map((route) => (
                <RouteIcon key={route} routeId={route} size="sm" className="w-5 h-5 text-[10px] ring-1 ring-background" />
              ))}
              {selectedStation.line.split(" ").length > 3 && (
                <div className="w-5 h-5 rounded-full bg-zinc-800 ring-1 ring-background flex items-center justify-center text-[10px] text-zinc-400">
                  +
                </div>
              )}
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-background border-white/10 shadow-2xl shadow-black/50">
        <Command className="bg-transparent" filter={(value, search) => {
          if (value.toLowerCase().includes(search.toLowerCase())) return 1;
          return 0;
        }}>
          <CommandInput placeholder="Search station (e.g. 'Times Sq', 'Bedford')..." className="h-12" />
          <CommandList className="max-h-[300px]">
            <CommandEmpty className="py-6 text-center text-muted-foreground">
              {isLoading ? "Loading stations..." : "No station found."}
            </CommandEmpty>
            <CommandGroup>
              {stations?.map((station) => (
                <CommandItem
                  key={station.id}
                  value={station.name + " " + station.line} // Allow searching by line too
                  onSelect={() => {
                    onSelect(station.id);
                    setOpen(false);
                  }}
                  className="flex items-center justify-between py-3 cursor-pointer aria-selected:bg-white/5"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <TrainFront className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate">{station.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex -space-x-1">
                      {station.line.split(" ").map((route, i) => (
                        <RouteIcon 
                          key={`${station.id}-${route}-${i}`} 
                          routeId={route} 
                          size="sm" 
                          className="w-5 h-5 text-[10px] ring-1 ring-background" 
                        />
                      ))}
                    </div>
                    {selectedStationId === station.id && (
                      <Check className="h-4 w-4 text-white ml-2" />
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
