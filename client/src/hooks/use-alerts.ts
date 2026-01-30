import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { ServiceAlert } from "@shared/schema";

export function useAlerts() {
  return useQuery<ServiceAlert[]>({
    queryKey: [api.alerts.list.path],
    queryFn: async () => {
      const res = await fetch(api.alerts.list.path);
      if (!res.ok) throw new Error("Failed to fetch alerts");
      return api.alerts.list.responses[200].parse(await res.json());
    },
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 2,
  });
}

export function useAlertsByRoute(routeId: string | null) {
  return useQuery<ServiceAlert[]>({
    queryKey: [api.alerts.byRoute.path, routeId],
    queryFn: async () => {
      if (!routeId) return [];
      const url = buildUrl(api.alerts.byRoute.path, { routeId });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch alerts");
      return api.alerts.byRoute.responses[200].parse(await res.json());
    },
    enabled: !!routeId,
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 2,
  });
}

export function useAlertsForRoutes(routeIds: string[]) {
  const sortedRouteKey = [...routeIds].sort().join(",");
  return useQuery<ServiceAlert[]>({
    queryKey: [api.alerts.list.path, "routes", sortedRouteKey],
    queryFn: async () => {
      const res = await fetch(api.alerts.list.path);
      if (!res.ok) throw new Error("Failed to fetch alerts");
      const allAlerts = api.alerts.list.responses[200].parse(await res.json()) as ServiceAlert[];
      return allAlerts.filter(alert => 
        routeIds.includes(alert.routeId) || 
        routeIds.includes(alert.routeId.replace('X', ''))
      );
    },
    enabled: routeIds.length > 0,
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 2,
  });
}
