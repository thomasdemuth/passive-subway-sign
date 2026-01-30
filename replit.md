# NYC Subway Arrivals Tracker

## Overview

A real-time NYC subway arrivals tracker that displays upcoming train arrivals for selected stations. Users can search for and select multiple subway stations, then view live departure information with train routes, destinations, and arrival times. The application fetches data from the MTA's GTFS-realtime feeds and displays it with a modern, dark-themed UI featuring official MTA route colors.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack React Query for server state with 30-second polling for real-time updates
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style variant)
- **Animations**: Framer Motion for smooth transitions and arrival card animations
- **Build Tool**: Vite with path aliases (@/ for client/src, @shared/ for shared)

### Backend Architecture
- **Framework**: Express.js 5 with TypeScript
- **API Design**: RESTful endpoints defined in shared/routes.ts with Zod validation
- **Real-time Data**: Fetches from three MTA GTFS-realtime feeds (1-6/S, A/C/E, G lines)
- **Protocol Buffers**: Uses gtfs-realtime-bindings to parse GTFS-realtime binary data

### Data Flow
1. Client requests arrivals for a station ID
2. Server fetches from all relevant MTA GTFS feeds in parallel
3. Server parses protocol buffer responses and filters by station
4. Server returns JSON with route, destination, arrival time, and direction
5. Client polls every 30 seconds for updates

### Project Structure
```
client/           # React frontend
  src/
    components/   # UI components (ArrivalCard, RouteIcon, StationSearch, ServiceAlertBanner)
    pages/        # Route pages (Home, Departures)
    hooks/        # React Query hooks (use-stations, use-arrivals, use-alerts)
    lib/          # Utilities (queryClient, cn helper)
server/           # Express backend
  routes.ts       # API route handlers (arrivals, alerts)
  storage.ts      # In-memory station storage
  db.ts           # Database connection (Drizzle + PostgreSQL)
shared/           # Shared types and schemas
  schema.ts       # Drizzle schema + Zod types (Station, Arrival, ServiceAlert)
  routes.ts       # API route definitions with Zod validation
```

### Key Design Decisions
- **In-memory station storage**: Stations are hardcoded rather than fetched from DB since MTA stations rarely change. This reduces latency and complexity.
- **Shared route definitions**: API paths and response schemas defined once in shared/routes.ts for type safety across frontend and backend.
- **Multi-station view**: Users can select multiple stations and view departures for all simultaneously on /departures/:ids route.

## External Dependencies

### MTA GTFS-realtime API
- **Arrival Feeds**: Multiple endpoints for different subway lines
  - `https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs` (1-6, S)
  - `https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-ace` (A, C, E)
  - `https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-g` (G)
  - Additional feeds for N/Q/R/W, L, J/Z, B/D/F/M, and SI
- **Service Alerts Feed**: `https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/camsys%2Fall-alerts`
  - Returns real-time service alerts for all subway lines
  - Includes delay notices, service changes, planned work, suspensions
  - Parsed with severity levels (higher = more severe)
- **Authentication**: Optional API key via `MTA_API_KEY` environment variable (passed as x-api-key header)
- **Data Format**: Protocol Buffers (parsed with gtfs-realtime-bindings)

### Database
- **ORM**: Drizzle ORM with drizzle-zod for schema validation
- **Database**: PostgreSQL (connection via `DATABASE_URL` environment variable)
- **Migrations**: drizzle-kit for schema push (`npm run db:push`)
- **Note**: Currently station data is stored in-memory; database primarily for future caching/expansion

### Environment Variables
- `DATABASE_URL` (required): PostgreSQL connection string
- `MTA_API_KEY` (optional): MTA API key for higher rate limits