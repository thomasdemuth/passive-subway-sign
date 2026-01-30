
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
  "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-bdfm", // B, D, F, M
  "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-si"    // Staten Island Railway
];

// Combined stations - maps a station ID to additional GTFS stop IDs to query
const COMBINED_STATIONS: Record<string, string[]> = {
  "140": ["R27"],  // South Ferry / Whitehall St (1 + R W)
  "127": ["725", "R16", "902"],  // Times Sq - 42 St (1 2 3 + N Q R W S + 7)
  "631": ["725", "901"],  // Grand Central - 42 St (4 5 6 + 7 + S)
  "635": ["L03", "R20"],  // 14 St - Union Sq (4 5 6 + L + N Q R W)
  "132": ["A32"],  // 96 St (1 2 3 + B C)
  "120": ["A31"],  // 72 St (1 2 3 + B C)
  "128": ["A28"],  // 34 St - Penn Station (1 2 3 + A C E)
  "629": ["R17"],  // Lexington Av / 59 St (4 5 6 + N Q R W)
  "R14": ["629"],  // Lexington Av / 59 St reverse lookup
  "725": ["127", "R16"],  // Times Sq reverse from 7
  "R16": ["127", "725"],  // Times Sq reverse from NQRW
  "R20": ["635", "L03"],  // Union Sq reverse
  "L03": ["635", "R20"],  // Union Sq reverse from L
  "A28": ["128"],  // Penn Station reverse
  "R17": ["629"],  // 59 St reverse
  "R27": ["140"],  // Whitehall reverse
};

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
      
      // Get all stop IDs to query (primary + combined stations)
      const stopIdsToQuery = [stationId, ...(COMBINED_STATIONS[stationId] || [])];

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
                // Check if this stop matches any of our station IDs
                const matchesStation = stopId && stopIdsToQuery.some(id => stopId.startsWith(id));
                if (matchesStation) {
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
