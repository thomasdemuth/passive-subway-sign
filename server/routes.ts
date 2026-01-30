
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import GtfsRealtimeBindings from "gtfs-realtime-bindings";
import { type Arrival } from "@shared/schema";

const FEEDS = [
  "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs",      // 1-6, S
  "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-ace",  // A, C, E
  "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-g",    // G
  "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-nqrw", // N, Q, R, W
  "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-l",    // L
  "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-jz",   // J, Z
  "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-bdfm"  // B, D, F, M
];

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  await storage.initStations();

  app.get(api.stations.list.path, async (req, res) => {
    const stations = await storage.getStations();
    res.json(stations);
  });

  app.get(api.stations.getArrivals.path, async (req, res) => {
    const stationId = req.params.id as string;
    const station = await storage.getStation(stationId);
    
    if (!station) {
      return res.status(404).json({ message: "Station not found" });
    }

    try {
      const headers: Record<string, string> = {};
      if (process.env.MTA_API_KEY) {
        headers["x-api-key"] = process.env.MTA_API_KEY;
      }

      const allArrivals: Arrival[] = [];
      const now = Date.now() / 1000;

      // Fetch from all relevant feeds in parallel
      await Promise.all(FEEDS.map(async (url) => {
        try {
          const response = await fetch(url, { headers });
          if (!response.ok) return;

          const buffer = await response.arrayBuffer();
          const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
            new Uint8Array(buffer)
          );

          feed.entity.forEach((entity) => {
            if (entity.tripUpdate && entity.tripUpdate.stopTimeUpdate) {
              entity.tripUpdate.stopTimeUpdate.forEach((update) => {
                const stopId = update.stopId;
                if (stopId && stopId.startsWith(stationId)) {
                   const directionChar = stopId.slice(-1);
                   const direction = directionChar === 'N' ? "Uptown" : "Downtown";
                   
                   const time = update.arrival?.time || update.departure?.time;
                   if (time) {
                     const timeNum = Number(time);
                     if (timeNum > now - 60) {
                        const arrivalDate = new Date(timeNum * 1000);
                        const routeId = entity.tripUpdate?.trip?.routeId || "Unknown";
                        
                        let destination = direction;
                        // Basic destination mapping
                        const dests: Record<string, any> = {
                          '1': direction === 'Uptown' ? "242 St" : "South Ferry",
                          '2': direction === 'Uptown' ? "Wakefield" : "Flatbush Av",
                          '3': direction === 'Uptown' ? "Harlem 148 St" : "New Lots Av",
                          '4': direction === 'Uptown' ? "Woodlawn" : "Utica Av",
                          '5': direction === 'Uptown' ? "Eastchester" : "Flatbush Av",
                          '6': direction === 'Uptown' ? "Pelham Bay Park" : "Brooklyn Bridge",
                          'A': direction === 'Uptown' ? "Inwood - 207 St" : "Far Rockaway",
                          'C': direction === 'Uptown' ? "168 St" : "Euclid Av",
                          'E': direction === 'Uptown' ? "Jamaica Center" : "World Trade Center",
                          'G': direction === 'Uptown' ? "Court Sq" : "Church Av",
                          'N': direction === 'Uptown' ? "Ditmars Blvd" : "Coney Island",
                          'Q': direction === 'Uptown' ? "96 St" : "Coney Island",
                          'R': direction === 'Uptown' ? "Forest Hills" : "Bay Ridge",
                          'W': direction === 'Uptown' ? "Ditmars Blvd" : "Whitehall St",
                          'L': direction === 'Uptown' ? "8 Av" : "Canarsie",
                          'J': direction === 'Uptown' ? "Jamaica Center" : "Broad St",
                          'Z': direction === 'Uptown' ? "Jamaica Center" : "Broad St",
                          'B': direction === 'Uptown' ? "145 St" : "Brighton Beach",
                          'D': direction === 'Uptown' ? "Norwood - 205 St" : "Coney Island",
                          'F': direction === 'Uptown' ? "Jamaica - 179 St" : "Coney Island",
                          'M': direction === 'Uptown' ? "Forest Hills" : "Middle Village",
                          'S': "Shuttle"
                        };
                        destination = dests[routeId] || direction;

                        allArrivals.push({
                          routeId,
                          destination,
                          arrivalTime: arrivalDate.toISOString(),
                          direction,
                          status: "On Time"
                        });
                     }
                   }
                }
              });
            }
          });
        } catch (e) {
          console.error(`Error fetching feed ${url}:`, e);
        }
      }));

      allArrivals.sort((a, b) => new Date(a.arrivalTime).getTime() - new Date(b.arrivalTime).getTime());
      res.json(allArrivals);
    } catch (error) {
      console.error("Error processing MTA data:", error);
      res.status(500).json({ message: "Failed to fetch real-time data" });
    }
  });

  return httpServer;
}
