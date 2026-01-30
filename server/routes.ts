
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import GtfsRealtimeBindings from "gtfs-realtime-bindings";
import { type Arrival } from "@shared/schema";

const MTA_API_URL = "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs"; // Lines 1-6, S

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Initialize stations
  await storage.initStations();

  app.get(api.stations.list.path, async (req, res) => {
    const stations = await storage.getStations();
    res.json(stations);
  });

  app.get(api.stations.getArrivals.path, async (req, res) => {
    const stationId = req.params.id;
    const station = await storage.getStation(stationId);
    
    if (!station) {
      return res.status(404).json({ message: "Station not found" });
    }

    try {
      const headers: Record<string, string> = {};
      // If user provided an API key in secrets, use it. 
      // Otherwise try without (some endpoints are public or allow low volume).
      if (process.env.MTA_API_KEY) {
        headers["x-api-key"] = process.env.MTA_API_KEY;
      }

      const response = await fetch(MTA_API_URL, { headers });
      if (!response.ok) {
        throw new Error(`MTA API Error: ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
        new Uint8Array(buffer)
      );

      const arrivals: Arrival[] = [];
      const now = Date.now() / 1000;

      feed.entity.forEach((entity) => {
        if (entity.tripUpdate && entity.tripUpdate.stopTimeUpdate) {
          entity.tripUpdate.stopTimeUpdate.forEach((update) => {
            // Check if this update is for our station
            // Station IDs in feed are usually ParentID + N/S (e.g. "120N", "120S")
            const stopId = update.stopId;
            if (stopId && stopId.startsWith(stationId)) {
               // Determine direction
               const directionChar = stopId.slice(-1); // 'N' or 'S'
               const direction = directionChar === 'N' ? "Uptown" : "Downtown";
               
               // Get time
               const time = update.arrival?.time || update.departure?.time;
               if (time) {
                 const timeNum = Number(time);
                 // Only show future trains (or slightly past to account for delay)
                 if (timeNum > now - 60) {
                    const arrivalDate = new Date(timeNum * 1000);
                    
                    // Route ID
                    const routeId = entity.tripUpdate?.trip?.routeId || "Unknown";
                    
                    // Simple logic for destination based on direction and route (Can be improved with static data)
                    // For now, generic "Uptown" / "Downtown" or based on route
                    let destination = direction; 
                    if (routeId === '1') destination = direction === 'Uptown' ? "Van Cortlandt Park" : "South Ferry";
                    if (routeId === '2') destination = direction === 'Uptown' ? "Wakefield" : "Flatbush Av";
                    if (routeId === '3') destination = direction === 'Uptown' ? "Harlem 148 St" : "New Lots Av";
                    if (routeId === '4') destination = direction === 'Uptown' ? "Woodlawn" : "Utica Av";
                    if (routeId === '5') destination = direction === 'Uptown' ? "Eastchester" : "Brooklyn";
                    if (routeId === '6') destination = direction === 'Uptown' ? "Pelham Bay Park" : "Brooklyn Bridge";
                    if (routeId === 'S') destination = "Shuttle";

                    // Status
                    const status = "On Time"; // Simplified, would need alert feed for real status

                    arrivals.push({
                      routeId,
                      destination,
                      arrivalTime: arrivalDate.toISOString(),
                      direction,
                      status
                    });
                 }
               }
            }
          });
        }
      });

      // Sort by time
      arrivals.sort((a, b) => new Date(a.arrivalTime).getTime() - new Date(b.arrivalTime).getTime());

      res.json(arrivals);
    } catch (error) {
      console.error("Error fetching MTA data:", error);
      res.status(500).json({ message: "Failed to fetch real-time data" });
    }
  });

  return httpServer;
}
