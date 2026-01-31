
import { type Station } from "@shared/schema";

// Line mappings based on station ID - each ID maps only to its specific platform's lines
const LINE_MAPPINGS: Record<string, string> = {
  // 1 line
  "101": "1", "103": "1", "104": "1", "106": "1", "107": "1", "108": "1", "109": "1",
  "110": "1", "111": "1", "112": "1", "113": "1", "114": "1 3", "115": "1",
  "116": "1", "117": "1", "118": "1", "119": "1", "120": "1 2 3", "121": "1",
  "122": "1", "123": "1 2 3", "124": "1", "125": "1", "126": "1",
  "127": "1 2 3", "128": "1 2 3", "129": "1", "130": "1",
  "131": "1", "132": "1 2 3", "133": "1", "134": "1", "135": "1", "136": "1",
  "137": "1 2 3", "138": "1", "139": "1", "140": "1", "142": "1",
  // 2 3 lines - Brooklyn IRT
  "201": "2 5", // Flatbush Av - terminal for 2 and 5
  "204": "2 5", "205": "2 5", "206": "2 5", "207": "2 5", "208": "2 5",
  "209": "2 5", // Winthrop St
  "210": "2 5", // Sterling St
  "211": "2 5", // President St
  "212": "2 5", // Church Av
  "213": "2 5", // Beverly Rd
  "214": "2 5", // Newkirk Av
  "215": "2 3", // Nevins St (2/3 platform)
  "418N": "4 5", // Nevins St (4/5 platform)
  "216": "2 3", // Hoyt St
  "217": "2 3 4 5", // Atlantic Av - Barclays Ctr
  "218": "2 3 4 5", // Franklin Av
  "219": "2 3", // Eastern Pkwy - Brooklyn Museum
  "220": "3 4", // Crown Heights - Utica Av
  "222": "3", // Sutter Av - Rutland Rd
  "224": "2 5", // President St
  "225": "2 3", // Sterling St
  "226": "2 3", // Winthrop St
  "227": "2 3", // 110 St - Central Park North (Malcom X Plaza)
  "228": "3", // Nostrand Av
  "229": "3", // Kingston Av
  "230": "3 4", // Utica Av
  "231": "2 3", // Clark St
  "232": "2 3", // Court St / Borough Hall
  "233": "2 3", // Hoyt St
  "234": "2 3", // Park Place
  "235": "2 3", // Franklin Av
  "236": "S", // Botanic Garden
  "237": "2 3", // Clark St
  "238": "2 3", // Borough Hall / Court St - just 2/3
  "239": "2 3", // Wall St
  "240": "2 3", // Fulton St
  "241": "2 3", // Park Place
  // 3 train Harlem
  "247": "3", // 145 St
  "248": "3", // Harlem - 148 St
  "249": "3", "250": "3", "251": "3",
  // Manhattan 2/3 stations
  "224M": "2 3", // 110 St
  "225M": "2 3", // 116 St
  "226M": "2 3", // 125 St
  // 4 5 6 lines
  "401": "4", "402": "4", "405": "4", "406": "4", "407": "4", "408": "4", "409": "4",
  "410": "4", "411": "4", "412": "4", "413": "4", "414": "4", "415": "4", "416": "4 5",
  "418": "4 5", // Borough Hall 4/5
  "419": "4 5", // Atlantic Av - Barclays Ctr
  "420": "4 5", // Franklin Av
  "423": "4 5", // Crown Heights - Utica Av
  "501": "5", "502": "5", "503": "5", "504": "5", "505": "5",
  "601": "6", "602": "6", "603": "6", "604": "6", "606": "6", "607": "6", "608": "6",
  "609": "6", "610": "6", "611": "6", "612": "6", "613": "6", "614": "6", "615": "6",
  "616": "6", "617": "6", "618": "6", "619": "6", "621": "6", "622": "6", "623": "6",
  "624": "6", "625": "6", "626": "6 4 5", "627": "6", "628": "4 5 6", "629": "4 5 6",
  "630": "4 5 6", "631": "4 5 6", "632": "4 5 6", "633": "4 5 6", "634": "4 5 6",
  "635": "4 5 6", "636": "4 5 6", "637": "4 5 6", "638": "4 5 6", "639": "4 5 6 J Z",
  "640": "4 5", "701": "7", "702": "7", "705": "7", "706": "7", "707": "7",
  "708": "7", "709": "7", "710": "7", "711": "7", "712": "7", "713": "7", "714": "7",
  "715": "7", "716": "7", "718": "7", "719": "7", "720": "7", "721": "7", "723": "7",
  "724": "7", "725": "7", "726": "7",
  // Shuttle
  "901": "S", "902": "S",
  // Rockaway Shuttle and A train at Broad Channel
  "H01": "A S", // Broad Channel
  "H02": "S", // Beach 90 St
  "H03": "S", // Beach 98 St
  "H04": "S", // Rockaway Park - Beach 116 St
  "H11": "A", // Far Rockaway - Mott Av
  "H12": "A", // Beach 25 St
  "H13": "A", // Beach 36 St
  "H14": "A", // Beach 44 St
  "H15": "A", // Beach 60 St
  "H19": "A", // Howard Beach - JFK Airport
  // A C E lines
  "A02": "A", // Inwood - 207 St
  "A03": "A", // Dyckman St
  "A05": "A", // 190 St
  "A06": "A", // 181 St
  "A07": "A", // 175 St
  "A09": "A C", // 168 St
  "A10": "A C", // 163 St - Amsterdam Av
  "A11": "A C", // 155 St
  "A12": "A C", // 145 St
  "A14": "A B C D", // 125 St
  "A15": "A B C D", // 125 St
  "A16": "B C", // 116 St
  "A17": "B C", // 110 St - Cathedral Pkwy
  "A18": "B C", // 103 St
  "A19": "B C", // 96 St
  "A20": "B C", // 86 St
  "A21": "B C", // 81 St - Museum of Natural History
  "A22": "B C", // 72 St
  "A24": "C E", // 50 St
  "A25": "C E", // 50 St - correct: only C and E stop here
  "A27": "A C E", // 42 St - Port Authority
  "A28": "A C E", // 34 St - Penn Station
  "A30": "A C E", // 23 St
  "A31": "A C E", // 14 St
  "A32": "A C E", // W 4 St - Washington Sq
  "A33": "A C E", // Spring St
  "A34": "A C E", // Canal St
  "A36": "E", // World Trade Center
  "E01": "E", // World Trade Center
  "A38": "A C", // Chambers St
  "A40": "A C", // Fulton St
  "A41": "A C", // High St
  "A42": "A C F", // Jay St - MetroTech
  "A43": "A C", // Hoyt - Schermerhorn Sts
  "A44": "C", // Lafayette Av
  "A45": "C", // Clinton - Washington Avs
  "A46": "C", // Franklin Av
  "A47": "A C", // Nostrand Av
  "A48": "C", // Kingston - Throop Avs
  "A49": "A C", // Utica Av
  "A50": "C", // Ralph Av
  "A51": "C", // Rockaway Av
  "A52": "A C", // Broadway Junction
  "A53": "C", // Liberty Av
  "A54": "C", // Van Siclen Av
  "A55": "C", // Shepherd Av
  "A57": "A C", // Euclid Av
  "A59": "A", // Grant Av
  "A60": "A", // 80 St
  "A61": "A", // 88 St
  "A63": "A", // Rockaway Blvd
  "A64": "A", // 104 St
  "A65": "A", // 111 St
  "A55C": "C", // Ozone Park - Lefferts Blvd (C terminal)
  // N Q R W lines
  "R14": "N Q R W", "R15": "N Q R W", "R16": "N Q R W S", "R17": "N Q R W",
  "R18": "N Q R W", "R19": "N Q R W", "R20": "N Q R W", "R21": "N R W",
  "R22": "R W", // 28 St
  "R23": "R W", // 23 St  
  "R24": "R W", // 8 St-NYU
  "R25": "R W", // Prince St
  "R26": "R W", "R27": "R W",
  "R28": "N R", // Canal St
  "R29": "R W", // City Hall
  "R30": "R W", // Cortlandt St
  "R31": "R W", // Rector St
  "R13": "N R W", // 49 St
  // Brooklyn N/Q/R lines
  "R24B": "W R", // 8 St-NYU
  "R30B": "B Q R", // DeKalb Av
  // Queens Blvd M R lines
  "G08": "E F R", // Queens Plaza
  "G09": "M R", // 36 St
  "G10": "M R", // Steinway St
  "G11": "M R", // 46 St
  "G12": "M R", // Northern Blvd
  "G13": "M R", // 65 St
  "G14": "M R", // Elmhurst Av
  "G15": "M R", // Grand Av - Newtown
  "G16": "M R", // Woodhaven Blvd
  "G18": "M R", // 63 Dr - Rego Park
  "G19": "M R", // 67 Av
  "G20": "E F M R", // Forest Hills - 71 Av
  "G21": "E F M R", // Jackson Hts - Roosevelt Av
  // E F lines
  "F01": "F", // Jamaica - 179 St
  "F02": "F", // 169 St
  "F03": "F", // Parsons Blvd
  "F04": "F", // Sutphin Blvd
  "F05": "F", // Briarwood
  "F06": "E F", // Kew Gardens - Union Tpke
  "F07": "F", // 75 Av
  "F09": "M R", // 63 Dr - Rego Park (F)
  "F11": "E F M R", // Forest Hills - 71 Av
  "F12": "E F M R", // Jackson Hts - Roosevelt Av
  "F25": "F G", // 15 St - Prospect Park
  // L line
  "L01": "L", "L02": "L", "L03": "L", "L05": "L", "L06": "L", "L08": "L",
  "L10": "L", "L11": "L", "L12": "L", "L13": "L", "L14": "L", "L15": "L",
  "L16": "L", "L17": "L", "L19": "L", "L20": "L", "L21": "L", "L22": "L",
  "L24": "L", "L25": "L", "L26": "L", "L27": "L", "L28": "L", "L29": "L",
};

// Station name overrides for correct display names
const STATION_NAME_OVERRIDES: Record<string, string> = {
  "218": "Franklin Av", // Was "Franklin Av / Botanic Garden"
  "235": "Franklin Av", // On 2/3
  "236": "Franklin Av", // Franklin Av, not Botanic Garden
  "227": "110 St-Malcom X Plaza", // Was "Central Park North (110 St)"
};

// Stations that share the same physical location but have different platform IDs
// Maps display name to the additional platform IDs that should be added as separate stations
const SPLIT_STATIONS: Record<string, { id: string; lines: string; name?: string }[]> = {
  "14 St - Union Sq": [
    { id: "L03", lines: "L" },
    { id: "R20", lines: "N Q R W" }
  ],
  "Times Sq - 42 St": [
    { id: "R16", lines: "N Q R W S" },
    { id: "725", lines: "7" },
    { id: "902", lines: "S" }
  ],
  "Grand Central - 42 St": [
    { id: "725", lines: "7" },
    { id: "901", lines: "S" }
  ],
  "34 St - Penn Station": [
    { id: "A28", lines: "A C E" }
  ],
  "59 St": [
    { id: "R17", lines: "N Q R W" }
  ],
  "South Ferry / Whitehall St": [
    { id: "R27", lines: "R W" }
  ],
  "96 St": [
    { id: "A19", lines: "B C" }
  ],
  "72 St": [
    { id: "A22", lines: "B C" }
  ],
  "86 St": [
    { id: "A20", lines: "B C" }
  ],
  "81 St - Museum of Natural History": [
    { id: "A21", lines: "B C" }
  ],
  "110 St - Cathedral Pkwy": [
    { id: "A17", lines: "B C" }
  ],
  "116 St": [
    { id: "A16", lines: "B C" }
  ],
  "135 St": [
    { id: "135_23", lines: "2 3" }
  ],
  "145 St": [
    { id: "D13", lines: "B D" },
    { id: "301", lines: "3" }
  ],
  "168 St": [
    { id: "A09", lines: "A C" }
  ],
  "125 St": [
    { id: "A14", lines: "A B C D" }
  ],
  "14 St": [
    { id: "A31", lines: "A C E", name: "14 St-8 Av" }
  ],
  "World Trade Center": [
    { id: "A36", lines: "E" }
  ],
  "Court St / Borough Hall": [
    { id: "418", lines: "4 5", name: "Borough Hall" }
  ],
  "W 4 St-Wash Sq": [
    { id: "D21", lines: "B D F M" }
  ],
  "DeKalb Av": [
    { id: "R30B", lines: "B Q R" }
  ],
  "Nevins St": [
    { id: "418N", lines: "4 5" }
  ],
};

export interface IStorage {
  getStations(): Promise<Station[]>;
  getStation(id: string): Promise<Station | undefined>;
  initStations(): Promise<void>;
}

export class MemStorage implements IStorage {
  private stations: Map<string, Station>;

  constructor() {
    this.stations = new Map();
  }

  async initStations(): Promise<void> {
    try {
      const response = await fetch("https://raw.githubusercontent.com/jonthornton/MTAPI/master/data/stations.json");
      if (response.ok) {
        const data = await response.json();
        Object.entries(data).forEach(([id, station]: [string, any]) => {
          let line = LINE_MAPPINGS[id] || "";
          
          // Infer from letter prefix
          if (id.startsWith("A")) line = line || "A C";
          if (id.startsWith("B")) line = line || "B Q";
          if (id.startsWith("D")) line = line || "B D F M";
          if (id.startsWith("F")) line = line || "E F";
          if (id.startsWith("G")) line = line || "M R"; // Queens Blvd M/R stations
          if (id.startsWith("H")) line = line || "A S"; // Rockaway branch
          if (id.startsWith("J")) line = line || "J Z";
          if (id.startsWith("L")) line = line || "L";
          if (id.startsWith("M")) line = line || "M J Z";
          if (id.startsWith("N")) line = line || "N Q R W";
          if (id.startsWith("Q")) line = line || "Q";
          if (id.startsWith("R")) line = line || "N Q R W";
          if (id.startsWith("S")) line = line || "S";
          
          // Default fallback based on numeric range
          if (!line) {
            const numId = parseInt(id);
            if (numId >= 100 && numId < 200) line = "1";
            else if (numId >= 200 && numId < 300) line = "2 3";
            else if (numId >= 400 && numId < 500) line = "4";
            else if (numId >= 500 && numId < 600) line = "5";
            else if (numId >= 600 && numId < 700) line = "6";
            else if (numId >= 700 && numId < 800) line = "7";
            else if (numId >= 900 && numId < 1000) line = "S";
            else line = "?";
          }

          // Use name override if available
          const displayName = STATION_NAME_OVERRIDES[id] || station.name;
          
          this.stations.set(id, {
            id,
            name: displayName,
            line: line.trim(),
            lat: station.location?.[0] || null,
            lng: station.location?.[1] || null,
          });
          
          // Add split stations for this location
          const splitEntries = SPLIT_STATIONS[station.name];
          if (splitEntries) {
            splitEntries.forEach(({ id: splitId, lines, name: splitName }) => {
              // Only add if not already in the map
              if (!this.stations.has(splitId)) {
                this.stations.set(splitId, {
                  id: splitId,
                  name: splitName || station.name,
                  line: lines,
                  lat: station.location?.[0] || null,
                  lng: station.location?.[1] || null,
                });
              }
            });
          }
        });
        console.log(`Initialized ${this.stations.size} stations from MTA data.`);
      } else {
        throw new Error("Failed to fetch stations");
      }
    } catch (e) {
      console.error("Failed to fetch stations, using fallback:", e);
      // Fallback list
      const fallback: Station[] = [
        { id: "127", name: "Times Sq - 42 St", line: "1 2 3", lat: 40.755983, lng: -73.986229 },
        { id: "R16", name: "Times Sq - 42 St", line: "N Q R W S", lat: 40.755983, lng: -73.986229 },
        { id: "725", name: "Times Sq - 42 St", line: "7", lat: 40.755983, lng: -73.986229 },
        { id: "631", name: "Grand Central - 42 St", line: "4 5 6", lat: 40.751776, lng: -73.976848 },
        { id: "901", name: "Grand Central - 42 St", line: "S", lat: 40.751776, lng: -73.976848 },
        { id: "128", name: "34 St - Penn Station", line: "1 2 3", lat: 40.750373, lng: -73.991057 },
        { id: "A28", name: "34 St - Penn Station", line: "A C E", lat: 40.750373, lng: -73.991057 },
      ];
      fallback.forEach(s => this.stations.set(s.id, s));
    }
  }

  async getStations(): Promise<Station[]> {
    return Array.from(this.stations.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  async getStation(id: string): Promise<Station | undefined> {
    return this.stations.get(id);
  }
}

export const storage = new MemStorage();
