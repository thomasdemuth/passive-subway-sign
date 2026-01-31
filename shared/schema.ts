
import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === DATA MODELS ===
// We don't necessarily need a DB for this since it's real-time, 
// but we'll follow the pattern for consistency and potential future caching.

export const stations = pgTable("stations", {
  id: text("id").primaryKey(), // GTFS Stop ID (e.g., "120")
  name: text("name").notNull(),
  line: text("line").notNull(), // e.g., "1 2 3"
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  tags: text("tags").array(), // Searchable alternative names/spellings
});

// === SCHEMAS ===
export const stationSchema = createInsertSchema(stations);

export type Station = typeof stations.$inferSelect;

// === API TYPES ===
export type Arrival = {
  routeId: string;       // e.g., "1", "A"
  destination: string;   // e.g., "Van Cortlandt Park - 242 St"
  arrivalTime: string;   // ISO string
  direction: "Uptown" | "Downtown";
  status: string;        // e.g., "On Time", "Delayed"
};

export type StationResponse = Station;
export type ArrivalsResponse = Arrival[];

// Service Alerts
export type ServiceAlert = {
  id: string;
  routeId: string;        // Affected route (e.g., "1", "A")
  alertType: string;      // e.g., "Delays", "Service Change", "Planned Work"
  headerText: string;     // Short summary
  descriptionText: string; // Full description
  activePeriodStart?: string;
  activePeriodEnd?: string;
  severity: number;       // Higher = more severe
};

export type AlertsResponse = ServiceAlert[];
