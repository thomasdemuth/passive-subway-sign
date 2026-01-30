import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

// Hook to fetch the full list of stations
export function useStations() {
  return useQuery({
    queryKey: [api.stations.list.path],
    queryFn: async () => {
      const res = await fetch(api.stations.list.path);
      if (!res.ok) throw new Error("Failed to fetch stations");
      return api.stations.list.responses[200].parse(await res.json());
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour (stations rarely change)
  });
}

// Hook to fetch arrivals for a specific station
export function useArrivals(stationId: string | null) {
  return useQuery({
    queryKey: [api.stations.getArrivals.path, stationId],
    queryFn: async () => {
      if (!stationId) return [];
      const url = buildUrl(api.stations.getArrivals.path, { id: stationId });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch arrivals");
      return api.stations.getArrivals.responses[200].parse(await res.json());
    },
    enabled: !!stationId,
    refetchInterval: 30000, // Poll every 30 seconds for real-time updates
  });
}
