
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, addDynamicRoute, getStationWithDynamicRoutes } from "./storage";
import { api } from "@shared/routes";
import GtfsRealtimeBindings from "gtfs-realtime-bindings";
import { type Arrival, type ServiceAlert } from "@shared/schema";

const ALERTS_FEED = "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/camsys%2Fall-alerts";

// Stop ID to station name mapping for dynamic destination detection
const STOP_NAMES: Record<string, string> = {
  // IRT terminals (1-7 lines)
  "101": "Van Cortlandt Park-242 St", "142": "South Ferry",
  "201": "Wakefield-241 St", "247": "Flatbush Av-Brooklyn College",
  "301": "Harlem-148 St", "257": "New Lots Av",
  "401": "Woodlawn", "250": "Crown Hts-Utica Av", "469": "New Lots Av",
  "501": "Eastchester-Dyre Av", "416": "E 180 St",
  "601": "Pelham Bay Park", "640": "Brooklyn Bridge-City Hall",
  "701": "Flushing-Main St", "726": "34 St-Hudson Yards", "702": "Mets-Willets Point",
  // IND 8th Ave (A/C/E) terminals
  "A02": "Inwood-207 St", "A09": "168 St", "A55": "Euclid Av",
  "A65": "Ozone Park-Lefferts Blvd", "E01": "World Trade Center",
  // IND 6th Ave (B/D/F/M) terminals
  "D01": "Norwood-205 St", "D03": "Bedford Park Blvd", 
  "D40": "Brighton Beach", "D43": "Coney Island-Stillwell Av",
  "F01": "Jamaica-179 St", "F39": "Coney Island-Stillwell Av",
  "M01": "Forest Hills-71 Av", "M22": "Middle Village-Metropolitan Av",
  // Crosstown (G) terminals
  "G22": "Court Sq", "G35": "Church Av", "F27": "Church Av",
  // BMT Jamaica (J/Z) terminals  
  "G05": "Jamaica Center-Parsons/Archer", "M23": "Broad St",
  // BMT Canarsie (L) terminals
  "L01": "8 Av", "L29": "Canarsie-Rockaway Pkwy",
  // BMT Broadway (N/Q/R/W) terminals
  "R01": "Astoria-Ditmars Blvd", "N12": "86 St", "Q05": "96 St",
  "R45": "Bay Ridge-95 St", "R27": "Whitehall St-South Ferry",
  // Rockaway (A/H) terminals
  "H04": "Broad Channel", "H11": "Far Rockaway-Mott Av", "H15": "Rockaway Park-Beach 116 St",
  // 42 St Shuttle terminals
  "901": "Grand Central-42 St", "902": "Times Sq-42 St",
  // Franklin Shuttle terminals
  "S01": "Franklin Av", "S04": "Prospect Park",
  // Staten Island Railway terminals
  "S09": "St George", "S31": "Tottenville"
};

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
  // Times Sq - 42 St (each station shows only its own lines)
  // 127 = 1/2/3, R16 = N/Q/R/W, 725 = 7, 902 = S (GS)
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
  // Franklin Av (Franklin Shuttle + 2/3/4/5)
  "218": ["S01"], "S01": ["218", "239"], "239": ["S01"],
  // Botanic Garden / Prospect Park (Franklin Shuttle + B/Q)
  "S04": ["D26"], "D26": ["S04"],
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
    // Merge dynamic routes detected from GTFS data
    const stationsWithDynamic = stations.map(s => getStationWithDynamicRoutes(s));
    res.json(stationsWithDynamic);
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
                        
                        // Get dynamic destination from GTFS - last stop in the trip
                        let destination = direction;
                        const stopTimeUpdates = entity.tripUpdate?.stopTimeUpdate || [];
                        if (stopTimeUpdates.length > 0) {
                          // Get the last stop in this trip
                          const lastStop = stopTimeUpdates[stopTimeUpdates.length - 1];
                          const lastStopId = lastStop?.stopId?.replace(/[NS]$/, '') || '';
                          if (lastStopId && STOP_NAMES[lastStopId]) {
                            destination = STOP_NAMES[lastStopId];
                          }
                        }
                        
                        // Fallback to direction-based mapping if no GTFS destination found
                        if (destination === direction) {
                          const dests: Record<string, string> = {
                            '1': direction === 'Uptown' ? "Van Cortlandt Park-242 St" : "South Ferry",
                            '2': direction === 'Uptown' ? "Wakefield-241 St" : "Flatbush Av-Brooklyn College",
                            '3': direction === 'Uptown' ? "Harlem-148 St" : "New Lots Av",
                            '4': direction === 'Uptown' ? "Woodlawn" : "Crown Hts-Utica Av",
                            '5': direction === 'Uptown' ? "Eastchester-Dyre Av" : "Flatbush Av-Brooklyn College",
                            '6': direction === 'Uptown' ? "Pelham Bay Park" : "Brooklyn Bridge-City Hall",
                            '6X': direction === 'Uptown' ? "Pelham Bay Park" : "Brooklyn Bridge-City Hall",
                            '7': direction === 'Uptown' ? "Flushing-Main St" : "34 St-Hudson Yards",
                            '7X': direction === 'Uptown' ? "Flushing-Main St" : "34 St-Hudson Yards",
                            'A': direction === 'Uptown' ? "Inwood-207 St" : "Far Rockaway-Mott Av",
                            'C': direction === 'Uptown' ? "168 St" : "Euclid Av",
                            'E': direction === 'Uptown' ? "Jamaica Center-Parsons/Archer" : "World Trade Center",
                            'B': direction === 'Uptown' ? "Bedford Park Blvd" : "Brighton Beach",
                            'D': direction === 'Uptown' ? "Norwood-205 St" : "Coney Island-Stillwell Av",
                            'F': direction === 'Uptown' ? "Jamaica-179 St" : "Coney Island-Stillwell Av",
                            'M': direction === 'Uptown' ? "Forest Hills-71 Av" : "Middle Village-Metropolitan Av",
                            'G': direction === 'Uptown' ? "Court Sq" : "Church Av",
                            'J': direction === 'Uptown' ? "Jamaica Center-Parsons/Archer" : "Broad St",
                            'Z': direction === 'Uptown' ? "Jamaica Center-Parsons/Archer" : "Broad St",
                            'L': direction === 'Uptown' ? "8 Av" : "Canarsie-Rockaway Pkwy",
                            'N': direction === 'Uptown' ? "Astoria-Ditmars Blvd" : "Coney Island-Stillwell Av",
                            'Q': direction === 'Uptown' ? "96 St" : "Coney Island-Stillwell Av",
                            'R': direction === 'Uptown' ? "Forest Hills-71 Av" : "Bay Ridge-95 St",
                            'W': direction === 'Uptown' ? "Astoria-Ditmars Blvd" : "Whitehall St-South Ferry",
                            'S': direction === 'Uptown' ? "Times Sq-42 St" : "Grand Central-42 St",
                            'GS': direction === 'Uptown' ? "Times Sq-42 St" : "Grand Central-42 St",
                            'FS': direction === 'Uptown' ? "Franklin Av" : "Prospect Park",
                            'H': direction === 'Uptown' ? "Broad Channel" : "Rockaway Park-Beach 116 St",
                            'SI': direction === 'Uptown' ? "St George" : "Tottenville",
                            'SIR': direction === 'Uptown' ? "St George" : "Tottenville"
                          };
                          destination = dests[routeId] || direction;
                        }

                        // Track this route for dynamic line detection
                        addDynamicRoute(stationId, routeId);
                        
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

          // Only include subway alerts (single letter/number route IDs + shuttles)
          const subwayRoutes = Array.from(affectedRoutes).filter(r => 
            /^[1-7ABCDEFGJLMNQRSWZ]X?$/.test(r) || /^(FS|GS|H|SI|SIR)$/.test(r)
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
