
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, addDynamicRoute, getStationWithDynamicRoutes } from "./storage";
import { api } from "@shared/routes";
import GtfsRealtimeBindings from "gtfs-realtime-bindings";
import { type Arrival, type ServiceAlert } from "@shared/schema";

const ALERTS_FEED = "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/camsys%2Fall-alerts";

// Comprehensive stop ID to station name mapping for dynamic destination detection
const STOP_NAMES: Record<string, string> = {
  // 1 line
  "101": "Van Cortlandt Park-242 St", "102": "238 St", "103": "231 St", "104": "Marble Hill-225 St",
  "105": "215 St", "106": "207 St", "107": "Dyckman St", "108": "191 St", "109": "181 St",
  "110": "168 St-Washington Hts", "111": "157 St", "112": "145 St", "113": "137 St-City College",
  "114": "125 St", "115": "116 St-Columbia", "116": "Cathedral Pkwy-110 St", "117": "103 St", 
  "118": "96 St", "119": "86 St", "120": "79 St", "121": "72 St", "122": "66 St-Lincoln Center",
  "123": "59 St-Columbus Circle", "124": "50 St", "125": "Times Sq-42 St", "126": "34 St-Penn Station",
  "127": "28 St", "128": "23 St", "129": "18 St", "130": "14 St", "131": "Christopher St-Sheridan Sq",
  "132": "Houston St", "133": "Canal St", "134": "Franklin St", "135": "Chambers St", 
  "136": "Cortlandt St", "137": "Rector St", "138": "South Ferry", "139": "South Ferry", "142": "South Ferry",
  // 2/3 line
  "201": "Wakefield-241 St", "204": "Nereid Av", "205": "233 St", "206": "225 St", "207": "219 St",
  "208": "Gun Hill Rd", "209": "Burke Av", "210": "Allerton Av", "211": "Pelham Pkwy", "212": "Bronx Park East",
  "213": "E 180 St", "214": "West Farms Sq-E Tremont Av", "215": "174 St", "216": "Freeman St",
  "217": "Simpson St", "218": "Intervale Av", "219": "Prospect Av", "220": "Jackson Av",
  "221": "3 Av-149 St", "222": "149 St-Grand Concourse", "224": "135 St", "225": "125 St",
  "226": "116 St", "227": "Central Park North-110 St", "228": "96 St", "229": "72 St", "230": "Times Sq-42 St",
  "231": "34 St-Penn Station", "232": "14 St", "233": "Chambers St", "234": "Park Pl", "235": "Fulton St",
  "236": "Wall St", "237": "Clark St", "238": "Borough Hall", "239": "Hoyt St", "241": "Nevins St",
  "247": "Flatbush Av-Brooklyn College", "248": "Beverly Rd", "249": "Church Av", "250": "Crown Hts-Utica Av",
  "251": "Nostrand Av", "252": "Kingston Av", "253": "Sutter Av-Rutland Rd", "254": "Saratoga Av",
  "255": "Rockaway Av", "256": "Junius St", "257": "New Lots Av", "301": "Harlem-148 St",
  // 4/5 line  
  "401": "Woodlawn", "402": "Mosholu Pkwy", "403": "Bedford Park Blvd-Lehman College", "404": "Kingsbridge Rd",
  "405": "Fordham Rd", "406": "183 St", "407": "Burnside Av", "408": "176 St", "409": "Mt Eden Av",
  "410": "170 St", "411": "167 St", "412": "161 St-Yankee Stadium", "413": "149 St-Grand Concourse",
  "414": "138 St-Grand Concourse", "415": "125 St", "416": "E 180 St", "417": "Morris Park",
  "418": "Pelham Pkwy", "419": "Gun Hill Rd", "420": "Baychester Av", "501": "Eastchester-Dyre Av",
  // 6 line
  "601": "Pelham Bay Park", "602": "Buhre Av", "603": "Middletown Rd", "604": "Westchester Sq-E Tremont Av",
  "605": "Zerega Av", "606": "Castle Hill Av", "607": "Parkchester", "608": "St Lawrence Av",
  "609": "Morrison Av-Soundview", "610": "Elder Av", "611": "Whitlock Av", "612": "Hunts Point Av",
  "613": "Longwood Av", "614": "E 149 St", "615": "E 143 St-St Mary's St", "616": "Cypress Av",
  "617": "Brook Av", "618": "3 Av-138 St", "619": "125 St", "621": "96 St", "622": "86 St",
  "623": "77 St", "624": "68 St-Hunter College", "625": "59 St", "626": "51 St", "627": "Grand Central-42 St",
  "628": "33 St", "629": "28 St", "630": "23 St", "631": "14 St-Union Sq", "632": "Astor Pl",
  "633": "Bleecker St", "634": "Spring St", "635": "Canal St", "636": "Brooklyn Bridge-City Hall", "640": "Brooklyn Bridge-City Hall",
  // 7 line
  "701": "Flushing-Main St", "702": "Mets-Willets Point", "705": "111 St", "706": "103 St-Corona Plaza",
  "707": "Junction Blvd", "708": "90 St-Elmhurst Av", "709": "82 St-Jackson Hts", "710": "74 St-Broadway",
  "711": "69 St", "712": "Woodside-61 St", "713": "52 St", "714": "46 St-Bliss St", "715": "40 St-Lowery St",
  "716": "33 St-Rawson St", "718": "Queensboro Plaza", "719": "Court Sq", "720": "Hunters Point Av",
  "721": "Vernon Blvd-Jackson Av", "723": "Grand Central-42 St", "724": "Times Sq-42 St", "725": "5 Av",
  "726": "34 St-Hudson Yards",
  // A/C line
  "A02": "Inwood-207 St", "A03": "Dyckman St", "A05": "190 St", "A06": "181 St", "A07": "175 St",
  "A09": "168 St", "A10": "163 St-Amsterdam Av", "A11": "155 St", "A12": "145 St", "A14": "125 St",
  "A15": "59 St-Columbus Circle", "A16": "50 St", "A17": "42 St-Port Authority", "A18": "34 St-Penn Station",
  "A19": "23 St", "A20": "14 St", "A21": "W 4 St-Washington Sq", "A22": "Spring St", "A24": "Canal St",
  "A25": "Chambers St", "A27": "Fulton St", "A28": "High St", "A30": "Jay St-MetroTech",
  "A31": "Hoyt-Schermerhorn Sts", "A32": "Lafayette Av", "A33": "Clinton-Washington Avs",
  "A34": "Franklin Av", "A36": "Nostrand Av", "A38": "Kingston-Throop Avs", "A40": "Utica Av",
  "A41": "Ralph Av", "A42": "Rockaway Av", "A43": "Broadway Junction", "A44": "Liberty Av",
  "A45": "Van Siclen Av", "A46": "Shepherd Av", "A47": "Euclid Av", "A48": "Grant Av",
  "A49": "80 St", "A50": "88 St", "A51": "Rockaway Blvd", "A52": "104 St", "A53": "111 St",
  "A54": "Ozone Park-Lefferts Blvd", "A55": "Euclid Av", "A57": "Aqueduct Racetrack",
  "A59": "Howard Beach-JFK Airport", "A60": "Broad Channel", "A61": "Beach 67 St", "A63": "Beach 44 St",
  "A64": "Beach 36 St", "A65": "Ozone Park-Lefferts Blvd",
  // E line
  "E01": "World Trade Center",
  // Rockaway (H line)
  "H01": "Aqueduct Racetrack", "H02": "Aqueduct-N Conduit Av", "H03": "Howard Beach-JFK Airport",
  "H04": "Broad Channel", "H06": "Beach 90 St", "H07": "Beach 98 St", "H08": "Beach 105 St",
  "H09": "Beach 116 St-Rockaway Park", "H10": "Beach 25 St", "H11": "Far Rockaway-Mott Av",
  "H12": "Beach 44 St", "H13": "Beach 60 St", "H14": "Beach 67 St", "H15": "Rockaway Park-Beach 116 St",
  // B/D line
  "D01": "Norwood-205 St", "D03": "Bedford Park Blvd", "D04": "Kingsbridge Rd", "D05": "Fordham Rd",
  "D06": "182-183 Sts", "D07": "Tremont Av", "D08": "174-175 Sts", "D09": "170 St", "D10": "167 St",
  "D11": "161 St-Yankee Stadium", "D12": "155 St", "D13": "145 St", "D14": "135 St",
  "D15": "125 St", "D16": "59 St-Columbus Circle", "D17": "7 Av", "D18": "47-50 Sts-Rockefeller Ctr",
  "D19": "42 St-Bryant Park", "D20": "34 St-Herald Sq", "D21": "W 4 St-Washington Sq",
  "D22": "Broadway-Lafayette St", "D24": "Grand St", "D25": "Atlantic Av-Barclays Ctr",
  "D26": "DeKalb Av", "D27": "7 Av", "D28": "Prospect Park", "D29": "Parkside Av",
  "D30": "Church Av", "D31": "Beverley Rd", "D32": "Cortelyou Rd", "D33": "Newkirk Plaza",
  "D34": "Ave H", "D35": "Ave J", "D37": "Ave M", "D38": "Kings Hwy", "D39": "Ave U",
  "D40": "Brighton Beach", "D41": "Ocean Pkwy", "D42": "West 8 St-NY Aquarium", "D43": "Coney Island-Stillwell Av",
  // F line
  "F01": "Jamaica-179 St", "F02": "169 St", "F03": "Parsons Blvd", "F04": "Sutphin Blvd",
  "F05": "Briarwood", "F06": "Kew Gardens-Union Tpke", "F07": "75 Av", "F09": "Forest Hills-71 Av",
  "F11": "67 Av", "F12": "63 Dr-Rego Park", "F14": "Woodhaven Blvd", "F15": "Grand Av-Newtown",
  "F16": "Elmhurst Av", "F18": "Jackson Hts-Roosevelt Av", "F20": "21 St-Queensbridge",
  "F21": "Roosevelt Island", "F22": "Lexington Av-63 St", "F23": "57 St", "F24": "47-50 Sts-Rockefeller Ctr",
  "F25": "42 St-Bryant Park", "F26": "34 St-Herald Sq", "F27": "Church Av", "F29": "4 Av-9 St",
  "F30": "Smith-9 Sts", "F31": "Carroll St", "F32": "Bergen St", "F33": "Jay St-MetroTech",
  "F34": "York St", "F35": "E Broadway", "F36": "Delancey St-Essex St", "F38": "2 Av",
  "F39": "Coney Island-Stillwell Av",
  // G line
  "G05": "Jamaica Center-Parsons/Archer", "G06": "Sutphin Blvd-Archer Av-JFK", "G07": "Jamaica-Van Wyck",
  "G08": "Kew Gardens-Union Tpke", "G09": "Briarwood", "G10": "Sutphin Blvd", "G11": "Parsons Blvd",
  "G12": "169 St", "G13": "Jamaica-179 St", "G14": "Court Sq-23 St", "G22": "Court Sq",
  "G24": "21 St", "G26": "Greenpoint Av", "G28": "Nassau Av", "G29": "Metropolitan Av",
  "G30": "Broadway", "G31": "Flushing Av", "G32": "Myrtle-Willoughby Avs", "G33": "Bedford-Nostrand Avs",
  "G34": "Classon Av", "G35": "Church Av", "G36": "Clinton-Washington Avs",
  // J/Z line
  "J12": "Jamaica Center-Parsons/Archer", "J13": "Sutphin Blvd-Archer Av", "J14": "Jamaica-Van Wyck",
  "J15": "121 St", "J16": "111 St", "J17": "104 St", "J19": "Woodhaven Blvd", "J20": "85 St-Forest Pkwy",
  "J21": "75 St-Elderts Ln", "J22": "Cypress Hills", "J23": "Crescent St", "J24": "Norwood Av",
  "J27": "Cleveland St", "J28": "Van Siclen Av", "J29": "Alabama Av", "J30": "Broadway Junction",
  "J31": "Chauncey St", "J32": "Halsey St", "J33": "Gates Av", "J34": "Kosciuszko St",
  "J35": "Myrtle Av-Broadway", "J36": "Flushing Av", "J37": "Lorimer St", "J38": "Hewes St",
  "J39": "Marcy Av", "M01": "Forest Hills-71 Av", "M04": "Metropolitan Av-Lorimer St",
  "M05": "Grand St", "M06": "Graham Av", "M08": "Montrose Av", "M09": "Morgan Av", "M10": "Jefferson St",
  "M11": "DeKalb Av", "M12": "Myrtle Av-Broadway", "M13": "Central Av", "M14": "Knickerbocker Av",
  "M16": "Seneca Av", "M18": "Myrtle-Wyckoff Avs", "M19": "Fresh Pond Rd", "M20": "Forest Av",
  "M21": "Ridgewood-Metropolitan Av", "M22": "Middle Village-Metropolitan Av", "M23": "Broad St",
  // L line
  "L01": "8 Av", "L02": "6 Av", "L03": "14 St-Union Sq", "L05": "3 Av", "L06": "1 Av",
  "L08": "Bedford Av", "L10": "Lorimer St", "L11": "Graham Av", "L12": "Grand St", "L13": "Montrose Av",
  "L14": "Morgan Av", "L15": "Jefferson St", "L16": "DeKalb Av", "L17": "Myrtle-Wyckoff Avs",
  "L19": "Halsey St", "L20": "Wilson Av", "L21": "Bushwick Av-Aberdeen St", "L22": "Broadway Junction",
  "L24": "Atlantic Av", "L25": "Sutter Av", "L26": "Livonia Av", "L27": "New Lots Av",
  "L28": "E 105 St", "L29": "Canarsie-Rockaway Pkwy",
  // N/Q/R/W line
  "R01": "Astoria-Ditmars Blvd", "R03": "Astoria Blvd", "R04": "30 Av", "R05": "Broadway",
  "R06": "36 Av", "R08": "39 Av-Dutch Kills", "R09": "Queensboro Plaza", "R11": "Lexington Av-59 St",
  "R13": "5 Av-59 St", "R14": "57 St-7 Av", "R15": "49 St", "R16": "Times Sq-42 St", "R17": "34 St-Herald Sq",
  "R18": "28 St", "R19": "23 St", "R20": "14 St-Union Sq", "R21": "8 St-NYU", "R22": "Prince St",
  "R23": "Canal St", "R24": "City Hall", "R25": "Cortlandt St", "R26": "Rector St",
  "R27": "Whitehall St-South Ferry", "R28": "Court St", "R29": "Jay St-MetroTech",
  "R30": "DeKalb Av", "R31": "Atlantic Av-Barclays Ctr", "R32": "Union St", "R33": "4 Av-9 St",
  "R34": "Prospect Av", "R35": "25 St", "R36": "36 St", "R39": "45 St", "R40": "53 St",
  "R41": "59 St", "R42": "Bay Ridge Av", "R43": "77 St", "R44": "86 St", "R45": "Bay Ridge-95 St",
  "N02": "Astoria-Ditmars Blvd", "N03": "Astoria Blvd", "N04": "30 Av", "N06": "Broadway",
  "N08": "36 Av", "N10": "39 Av-Dutch Kills", "N12": "86 St", "Q01": "57 St-7 Av", "Q03": "Lexington Av-63 St",
  "Q04": "72 St", "Q05": "96 St",
  // 42 St Shuttle
  "901": "Grand Central-42 St", "902": "Times Sq-42 St",
  // Franklin Shuttle
  "S01": "Franklin Av", "S03": "Park Pl", "S04": "Prospect Park",
  // Staten Island Railway
  "S09": "St George", "S11": "Tompkinsville", "S13": "Stapleton", "S14": "Clifton",
  "S15": "Grasmere", "S16": "Old Town", "S17": "Dongan Hills", "S18": "Jefferson Av",
  "S19": "Grant City", "S20": "New Dorp", "S21": "Oakwood Heights", "S22": "Bay Terrace",
  "S23": "Great Kills", "S24": "Eltingville", "S25": "Annadale", "S26": "Huguenot",
  "S27": "Prince's Bay", "S28": "Pleasant Plains", "S29": "Richmond Valley",
  "S30": "Arthur Kill", "S31": "Tottenville"
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
  // Queens Plaza (E/M/R at Queensboro Plaza area)
  "G08": ["R09"], "R09": ["G08"],
  // World Trade Center - E line terminal only (no combined stations)
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
          // Check for severe delays - MTA uses "severe delay", "severely delayed", or "delays...severely"
          const hasSevereDelay = headerLower.includes("severe delay") || 
            headerLower.includes("severely delayed") ||
            (headerLower.includes("delay") && headerLower.includes("severely"));
          
          if (hasSevereDelay) alertType = "Severe Delays";
          else if (headerLower.includes("delay")) alertType = "Delays";
          else if (headerLower.includes("suspend")) alertType = "Suspended";
          else if (headerLower.includes("planned work")) alertType = "Planned Work";
          else if (headerLower.includes("service change")) alertType = "Service Change";
          else if (headerLower.includes("slow")) alertType = "Slow Speeds";

          // Estimate severity based on alert type
          let severity = 10;
          if (alertType === "Severe Delays") severity = 35;
          else if (alertType === "Delays") severity = 22;
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
          // Check for severe delays - MTA uses "severe delay", "severely delayed", or "delays...severely"
          const hasSevereDelay = headerLower.includes("severe delay") || 
            headerLower.includes("severely delayed") ||
            (headerLower.includes("delay") && headerLower.includes("severely"));
          
          if (hasSevereDelay) alertType = "Severe Delays";
          else if (headerLower.includes("delay")) alertType = "Delays";
          else if (headerLower.includes("suspend")) alertType = "Suspended";
          else if (headerLower.includes("planned work")) alertType = "Planned Work";
          else if (headerLower.includes("service change")) alertType = "Service Change";
          else if (headerLower.includes("slow")) alertType = "Slow Speeds";

          let severity = 10;
          if (alertType === "Severe Delays") severity = 35;
          else if (alertType === "Delays") severity = 22;
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
