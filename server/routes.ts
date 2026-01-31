
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import GtfsRealtimeBindings from "gtfs-realtime-bindings";
import { type Arrival, type ServiceAlert } from "@shared/schema";

const ALERTS_FEED = "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/camsys%2Fall-alerts";

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
// This allows showing all trains at a physical location regardless of which platform entry is selected
const COMBINED_STATIONS: Record<string, string[]> = {
  // South Ferry / Whitehall St
  "140": ["R27"], "R27": ["140"],
  // Times Sq - 42 St
  "127": ["725", "R16", "902", "A27"], "725": ["127", "R16", "902", "A27"], 
  "R16": ["127", "725", "902", "A27"], "902": ["127", "725", "R16", "A27"],
  "A27": ["127", "725", "R16", "902"],
  // Grand Central - 42 St
  "631": ["725", "901"], "901": ["631", "725"],
  // 14 St - Union Sq
  "635": ["L03", "R20"], "L03": ["635", "R20"], "R20": ["635", "L03"],
  // 96 St (1 2 3 + B C)
  "132": ["A19"], "A19": ["132"],
  // 86 St (1 + B C)
  "131": ["A20"], "A20": ["131"],
  // 81 St
  "A21": [],
  // 72 St (1 2 3 + B C)
  "120": ["A22"], "A22": ["120"],
  // 34 St - Penn Station
  "128": ["A28"], "A28": ["128"],
  // 14 St - 8 Av
  "A31": [],
  // Lexington Av / 59 St
  "629": ["R17"], "R17": ["629"],
  // Borough Hall / Court St (2 3 + 4 5)
  "238": ["418"], "418": ["238"],
  // Atlantic Av - Barclays Ctr
  "217": ["D24", "B37", "R36"], "D24": ["217", "B37", "R36"], 
  "B37": ["217", "D24", "R36"], "R36": ["217", "D24", "B37"],
  // Jay St - MetroTech
  "A42": ["R28"], "R28": ["A42"],
  // Fulton St
  "A40": ["639", "232"], "639": ["A40", "232"], "232": ["A40", "639"],
  // DeKalb Av
  "D22": ["R30"], "R30": ["D22"],
  // W 4 St - Wash Sq
  "A32": ["D21"], "D21": ["A32"],
  // Broadway Junction
  "A52": ["J27", "L22"], "J27": ["A52", "L22"], "L22": ["A52", "J27"],
  // Nevins St
  "215": ["418N"], "418N": ["215"],
  // Franklin Av
  "218": ["S04"], "S04": ["218"],
  // Hoyt-Schermerhorn
  "A43": ["G36"], "G36": ["A43"],
  // 125 St (various lines)
  "A14": ["224"], "224": ["A14"],
  // Jackson Hts - Roosevelt Av
  "G21": ["F12", "721"], "F12": ["G21", "721"], "721": ["G21", "F12"],
  // Forest Hills - 71 Av
  "G20": ["F11"], "F11": ["G20"],
  // Queens Plaza
  "G08": ["E01", "R09"], "E01": ["G08", "R09"], "R09": ["G08", "E01"],
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

  // Service alerts endpoint - fetches all subway alerts
  app.get(api.alerts.list.path, async (req, res) => {
    try {
      const headers: Record<string, string> = {};
      if (process.env.MTA_API_KEY) {
        headers["x-api-key"] = process.env.MTA_API_KEY;
      }

      const response = await fetch(ALERTS_FEED, { headers });
      if (!response.ok) {
        return res.status(502).json({ message: "Failed to fetch alerts from MTA" });
      }

      const buffer = await response.arrayBuffer();
      const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
        new Uint8Array(buffer)
      );

      const alerts: ServiceAlert[] = [];
      
      feed.entity.forEach((entity) => {
        if (entity.alert) {
          const alert = entity.alert;
          
          // Get affected routes
          const affectedRoutes = new Set<string>();
          alert.informedEntity?.forEach((ie) => {
            if (ie.routeId) {
              affectedRoutes.add(ie.routeId);
            }
          });

          // Only include subway alerts (single letter/number route IDs)
          const subwayRoutes = Array.from(affectedRoutes).filter(r => 
            /^[1-7ABCDEFGJLMNQRSWZ]X?$/.test(r)
          );

          if (subwayRoutes.length === 0) return;

          // Get header and description text
          const headerText = alert.headerText?.translation?.[0]?.text || "";
          const descriptionText = alert.descriptionText?.translation?.[0]?.text || "";
          
          // Skip if no meaningful content
          if (!headerText && !descriptionText) return;

          // Get active period
          const activePeriod = alert.activePeriod?.[0];
          const activePeriodStart = activePeriod?.start 
            ? new Date(Number(activePeriod.start) * 1000).toISOString() 
            : undefined;
          const activePeriodEnd = activePeriod?.end 
            ? new Date(Number(activePeriod.end) * 1000).toISOString() 
            : undefined;

          // Determine alert type from header text
          let alertType = "Service Alert";
          const headerLower = headerText.toLowerCase();
          if (headerLower.includes("delay")) alertType = "Delays";
          else if (headerLower.includes("suspend")) alertType = "Suspended";
          else if (headerLower.includes("planned work")) alertType = "Planned Work";
          else if (headerLower.includes("service change")) alertType = "Service Change";
          else if (headerLower.includes("slow")) alertType = "Slow Speeds";

          // Estimate severity based on alert type
          let severity = 10;
          if (alertType === "Delays") severity = 22;
          else if (alertType === "Suspended") severity = 39;
          else if (alertType === "Slow Speeds") severity = 16;
          else if (alertType === "Service Change") severity = 20;
          else if (alertType === "Planned Work") severity = 15;

          // Create an alert for each affected subway route
          subwayRoutes.forEach((routeId) => {
            alerts.push({
              id: `${entity.id}-${routeId}`,
              routeId,
              alertType,
              headerText,
              descriptionText,
              activePeriodStart,
              activePeriodEnd,
              severity
            });
          });
        }
      });

      // Sort by severity (highest first)
      alerts.sort((a, b) => b.severity - a.severity);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching service alerts:", error);
      res.status(500).json({ message: "Failed to fetch service alerts" });
    }
  });

  // Service alerts by route endpoint
  app.get(api.alerts.byRoute.path, async (req, res) => {
    const routeId = req.params.routeId as string;
    
    try {
      const headers: Record<string, string> = {};
      if (process.env.MTA_API_KEY) {
        headers["x-api-key"] = process.env.MTA_API_KEY;
      }

      const response = await fetch(ALERTS_FEED, { headers });
      if (!response.ok) {
        return res.status(502).json({ message: "Failed to fetch alerts from MTA" });
      }

      const buffer = await response.arrayBuffer();
      const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
        new Uint8Array(buffer)
      );

      const alerts: ServiceAlert[] = [];
      
      feed.entity.forEach((entity) => {
        if (entity.alert) {
          const alert = entity.alert;
          
          // Check if this alert affects the requested route
          const affectsRoute = alert.informedEntity?.some((ie) => 
            ie.routeId === routeId || ie.routeId === routeId.replace('X', '')
          );

          if (!affectsRoute) return;

          const headerText = alert.headerText?.translation?.[0]?.text || "";
          const descriptionText = alert.descriptionText?.translation?.[0]?.text || "";
          
          if (!headerText && !descriptionText) return;

          const activePeriod = alert.activePeriod?.[0];
          const activePeriodStart = activePeriod?.start 
            ? new Date(Number(activePeriod.start) * 1000).toISOString() 
            : undefined;
          const activePeriodEnd = activePeriod?.end 
            ? new Date(Number(activePeriod.end) * 1000).toISOString() 
            : undefined;

          let alertType = "Service Alert";
          const headerLower = headerText.toLowerCase();
          if (headerLower.includes("delay")) alertType = "Delays";
          else if (headerLower.includes("suspend")) alertType = "Suspended";
          else if (headerLower.includes("planned work")) alertType = "Planned Work";
          else if (headerLower.includes("service change")) alertType = "Service Change";
          else if (headerLower.includes("slow")) alertType = "Slow Speeds";

          let severity = 10;
          if (alertType === "Delays") severity = 22;
          else if (alertType === "Suspended") severity = 39;
          else if (alertType === "Slow Speeds") severity = 16;
          else if (alertType === "Service Change") severity = 20;
          else if (alertType === "Planned Work") severity = 15;

          alerts.push({
            id: `${entity.id}-${routeId}`,
            routeId,
            alertType,
            headerText,
            descriptionText,
            activePeriodStart,
            activePeriodEnd,
            severity
          });
        }
      });

      alerts.sort((a, b) => b.severity - a.severity);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching service alerts:", error);
      res.status(500).json({ message: "Failed to fetch service alerts" });
    }
  });

  return httpServer;
}
