
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
  // 2 3 lines
  "201": "2", "204": "2 5", "205": "2 5", "206": "2 5", "207": "2 5", "208": "2 5",
  "209": "2 5", "210": "2 5", "211": "2 5", "212": "2 5", "213": "2 5",
  "220": "2 5", "222": "2 5", "224": "2 5", "225": "2 5", "226": "2 5", "227": "2 5",
  "228": "2 5", "229": "2 5", "230": "2 5", "231": "2 5", "232": "2 5", "233": "2 5",
  "234": "2 5", "235": "2 5", "236": "2 5", "237": "2 5", "238": "2 5", "239": "2 3", "241": "2 3",
  "247": "3", "248": "3", "249": "3", "250": "3", "251": "3",
  // 4 5 6 lines
  "401": "4", "402": "4", "405": "4", "406": "4", "407": "4", "408": "4", "409": "4",
  "410": "4", "411": "4", "412": "4", "413": "4", "414": "4", "415": "4", "416": "4 5",
  "418": "4 5", "419": "4 5", "420": "4 5", "423": "4 5",
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
  // A C E lines - split from combined
  "A12": "A C", "A15": "A C", "A16": "A C", "A17": "A C", "A18": "A C", "A19": "A C",
  "A20": "A C", "A21": "A C", "A22": "A C", "A24": "A C E", "A25": "A C E",
  "A27": "A C E", "A28": "A C E", "A30": "A C", "A31": "B C", "A32": "B C",
  // N Q R W lines
  "R14": "N Q R W", "R15": "N Q R W", "R16": "N Q R W S", "R17": "N Q R W",
  "R18": "N Q R W", "R19": "N Q R W", "R20": "N Q R W", "R21": "N R W",
  "R22": "N R W", "R23": "N R W", "R24": "R W", "R25": "R W", "R26": "R W", "R27": "R W",
  // L line
  "L01": "L", "L02": "L", "L03": "L", "L05": "L", "L06": "L", "L08": "L",
  "L10": "L", "L11": "L", "L12": "L", "L13": "L", "L14": "L", "L15": "L",
  "L16": "L", "L17": "L", "L19": "L", "L20": "L", "L21": "L", "L22": "L",
  "L24": "L", "L25": "L", "L26": "L", "L27": "L", "L28": "L", "L29": "L",
};

// Stations that share the same physical location but have different platform IDs
// Maps display name to the additional platform IDs that should be added as separate stations
const SPLIT_STATIONS: Record<string, { id: string; lines: string }[]> = {
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
  "Whitehall St": [
    { id: "R27", lines: "R W" }
  ],
  "96 St": [
    { id: "A32", lines: "B C" }
  ],
  "72 St": [
    { id: "A31", lines: "B C" }
  ],
  "168 St": [
    { id: "A12", lines: "A C" }
  ],
  "125 St": [
    { id: "A15", lines: "A B C D" }
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
          if (id.startsWith("B")) line = line || "B D";
          if (id.startsWith("D")) line = line || "B D F M";
          if (id.startsWith("F")) line = line || "F";
          if (id.startsWith("G")) line = line || "G";
          if (id.startsWith("H")) line = line || "S";
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

          this.stations.set(id, {
            id,
            name: station.name,
            line: line.trim(),
            lat: station.location?.[0] || null,
            lng: station.location?.[1] || null,
          });
          
          // Add split stations for this location
          const splitEntries = SPLIT_STATIONS[station.name];
          if (splitEntries) {
            splitEntries.forEach(({ id: splitId, lines }) => {
              // Only add if not already in the map
              if (!this.stations.has(splitId)) {
                this.stations.set(splitId, {
                  id: splitId,
                  name: station.name,
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
