
import { type Station } from "@shared/schema";

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
      // Hardcoded base list of important stations across multiple lines
      const initialStations: Station[] = [
        // 1 2 3
        { id: "127", name: "Times Sq - 42 St", line: "1 2 3 N Q R W S" },
        { id: "128", name: "34 St - Penn Station", line: "1 2 3 A C E" },
        { id: "120", name: "96 St", line: "1 2 3" },
        { id: "137", name: "Chambers St", line: "1 2 3" },
        // 4 5 6
        { id: "631", name: "Grand Central - 42 St", line: "4 5 6 7 S" },
        { id: "635", name: "14 St - Union Sq", line: "4 5 6 L N Q R W" },
        { id: "628", name: "86 St", line: "4 5 6" },
        // A C E
        { id: "A27", name: "42 St - Port Authority Bus Terminal", line: "A C E" },
        { id: "A31", name: "14 St", line: "A C E L" },
        { id: "A32", name: "W 4 St - Wash Sq", line: "A C E B D F M" },
        { id: "A41", name: "Fulton St", line: "A C J Z 2 3 4 5" },
        // G
        { id: "G22", name: "Court Sq", line: "G E M 7" },
        { id: "G29", name: "Nassau Av", line: "G" },
        { id: "G30", name: "Metropolitan Av", line: "G L" },
        { id: "G36", name: "Classon Av", line: "G" },
        { id: "G26", name: "Greenpoint Av", line: "G" }
      ];

      initialStations.forEach(s => this.stations.set(s.id, s));
      console.log(`Initialized ${this.stations.size} stations including ACE and G lines.`);
    } catch (e) {
      console.error("Failed to initialize stations", e);
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
