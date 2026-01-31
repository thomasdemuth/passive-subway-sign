
import { type Station } from "@shared/schema";

// Line mappings based on official MTA GTFS data - station ID to daytime routes
const LINE_MAPPINGS: Record<string, string> = {
  // BMT Astoria Line
  "R01": "N W", // Astoria-Ditmars Blvd
  "R03": "N W", // Astoria Blvd
  "R04": "N W", // 30 Av
  "R05": "N W", // Broadway
  "R06": "N W", // 36 Av
  "R08": "N W", // 39 Av-Dutch Kills
  
  // BMT Broadway Line
  "R11": "N R W", // Lexington Av/59 St
  "R13": "N R W", // 5 Av/59 St
  "R14": "N Q R W", // 57 St-7 Av
  "R15": "N R W", // 49 St
  "R16": "N Q R W", // Times Sq-42 St
  "R17": "N Q R W", // 34 St-Herald Sq
  "R18": "R W", // 28 St
  "R19": "R W", // 23 St
  "R20": "N Q R W", // 14 St-Union Sq
  "R21": "R W", // 8 St-NYU
  "R22": "R W", // Prince St
  "R23": "R W", // Canal St
  "Q01": "N Q", // Canal St (Manhattan Bridge)
  "R24": "R W", // City Hall
  "R25": "R W", // Cortlandt St
  "R26": "R W", // Rector St
  "R27": "R W", // Whitehall St-South Ferry
  "R28": "R", // Court St
  "R29": "R", // Jay St-MetroTech
  "R30": "B Q R", // DeKalb Av
  "R31": "D N R", // Atlantic Av-Barclays Ctr
  "R32": "R", // Union St
  "R33": "R", // 4 Av-9 St
  "R34": "R", // Prospect Av
  "R35": "R", // 25 St
  "R36": "D N R", // 36 St
  "R39": "R", // 45 St
  "R40": "R", // 53 St
  "R41": "N R", // 59 St
  "R42": "R", // Bay Ridge Av
  "R43": "R", // 77 St
  "R44": "R", // 86 St
  "R45": "R", // Bay Ridge-95 St
  
  // BMT Broadway-Brighton
  "D24": "B Q", // Atlantic Av-Barclays Ctr
  "D25": "B Q", // 7 Av
  "D26": "B Q S", // Prospect Park
  "D27": "Q", // Parkside Av
  "D28": "B Q", // Church Av
  "D29": "Q", // Beverley Rd
  "D30": "Q", // Cortelyou Rd
  "D31": "B Q", // Newkirk Plaza
  "D32": "Q", // Avenue H
  "D33": "Q", // Avenue J
  "D34": "Q", // Avenue M
  "D35": "B Q", // Kings Hwy
  "D37": "Q", // Avenue U
  "D38": "Q", // Neck Rd
  "D39": "B Q", // Sheepshead Bay
  "D40": "B Q", // Brighton Beach
  "D41": "Q", // Ocean Pkwy
  "D42": "F Q", // W 8 St-NY Aquarium
  "D43": "D F N Q", // Coney Island-Stillwell Av
  
  // BMT West End
  "B12": "D", // 9 Av
  "B13": "D", // Fort Hamilton Pkwy
  "B14": "D", // 50 St
  "B15": "D", // 55 St
  "B16": "D", // 62 St
  "B17": "D", // 71 St
  "B18": "D", // 79 St
  "B19": "D", // 18 Av
  "B20": "D", // 20 Av
  "B21": "D", // Bay Pkwy
  "B22": "D", // 25 Av
  "B23": "D", // Bay 50 St
  
  // BMT Sea Beach
  "N02": "N", // 8 Av
  "N03": "N", // Fort Hamilton Pkwy
  "N04": "N", // New Utrecht Av
  "N05": "N", // 18 Av
  "N06": "N", // 20 Av
  "N07": "N", // Bay Pkwy
  "N08": "N", // Kings Hwy
  "N09": "N", // Avenue U
  "N10": "N", // 86 St
  
  // BMT Jamaica Line
  "J12": "J Z", // 121 St
  "J13": "J", // 111 St
  "J14": "J Z", // 104 St
  "J15": "J Z", // Woodhaven Blvd
  "J16": "J", // 85 St-Forest Pkwy
  "J17": "J Z", // 75 St-Elderts Ln
  "J19": "J", // Cypress Hills
  "J20": "J Z", // Crescent St
  "J21": "J Z", // Norwood Av
  "J22": "J", // Cleveland St
  "J23": "J Z", // Van Siclen Av
  "J24": "J Z", // Alabama Av
  "J27": "J Z", // Broadway Junction
  "J28": "J Z", // Chauncey St
  "J29": "J", // Halsey St
  "J30": "J Z", // Gates Av
  "J31": "J", // Kosciuszko St
  "M11": "J Z M", // Myrtle Av
  "M12": "J M", // Flushing Av
  "M13": "J M", // Lorimer St
  "M14": "J M", // Hewes St
  "M16": "J Z M", // Marcy Av
  "M18": "J Z M", // Delancey St-Essex St
  "M19": "J Z", // Bowery
  "M20": "J Z", // Canal St
  "M21": "J Z", // Chambers St
  "M22": "J Z", // Fulton St
  "M23": "J Z", // Broad St
  
  // BMT Myrtle Av Line
  "M01": "M", // Middle Village-Metropolitan Av
  "M04": "M", // Fresh Pond Rd
  "M05": "M", // Forest Av
  "M06": "M", // Seneca Av
  "M08": "M", // Myrtle-Wyckoff Avs
  "M09": "M", // Knickerbocker Av
  "M10": "M", // Central Av
  
  // BMT Canarsie Line (L)
  "L01": "L", // 8 Av
  "L02": "L", // 6 Av
  "L03": "L", // 14 St-Union Sq
  "L05": "L", // 3 Av
  "L06": "L", // 1 Av
  "L08": "L", // Bedford Av
  "L10": "L", // Lorimer St
  "L11": "L", // Graham Av
  "L12": "L", // Grand St
  "L13": "L", // Montrose Av
  "L14": "L", // Morgan Av
  "L15": "L", // Jefferson St
  "L16": "L", // DeKalb Av
  "L17": "L", // Myrtle-Wyckoff Avs
  "L19": "L", // Halsey St
  "L20": "L", // Wilson Av
  "L21": "L", // Bushwick Av-Aberdeen St
  "L22": "L", // Broadway Junction
  "L24": "L", // Atlantic Av
  "L25": "L", // Sutter Av
  "L26": "L", // Livonia Av
  "L27": "L", // New Lots Av
  "L28": "L", // East 105 St
  "L29": "L", // Canarsie-Rockaway Pkwy
  
  // BMT Franklin Shuttle
  "S01": "S", // Franklin Av
  "S03": "S", // Park Pl
  "S04": "S", // Botanic Garden
  
  // IND 8th Av Line
  "A02": "A", // Inwood-207 St
  "A03": "A", // Dyckman St
  "A05": "A", // 190 St
  "A06": "A", // 181 St
  "A07": "A", // 175 St
  "A09": "A C", // 168 St
  "A10": "C", // 163 St-Amsterdam Av
  "A11": "C", // 155 St
  "A12": "A C", // 145 St
  "A14": "B C", // 135 St
  "A15": "A B C D", // 125 St
  "A16": "B C", // 116 St
  "A17": "B C", // Cathedral Pkwy (110 St)
  "A18": "B C", // 103 St
  "A19": "B C", // 96 St
  "A20": "B C", // 86 St
  "A21": "B C", // 81 St-Museum of Natural History
  "A22": "B C", // 72 St
  "A24": "A B C D", // 59 St-Columbus Circle
  "A25": "C E", // 50 St
  "A27": "A C E", // 42 St-Port Authority Bus Terminal
  "A28": "A C E", // 34 St-Penn Station
  "A30": "C E", // 23 St
  "A31": "A C E", // 14 St
  "A32": "A C E", // W 4 St-Wash Sq
  "A33": "C E", // Spring St
  "A34": "A C E", // Canal St
  "A36": "A C", // Chambers St
  "E01": "E", // World Trade Center
  "A38": "A C", // Fulton St
  "A40": "A C", // High St
  "A41": "A C F", // Jay St-MetroTech
  "A42": "A C G", // Hoyt-Schermerhorn Sts
  "A43": "C", // Lafayette Av
  "A44": "C", // Clinton-Washington Avs
  "A45": "C", // Franklin Av
  "A46": "A C", // Nostrand Av
  "A47": "C", // Kingston-Throop Avs
  "A48": "A C", // Utica Av
  "A49": "C", // Ralph Av
  "A50": "C", // Rockaway Av
  "A51": "A C", // Broadway Junction
  "A52": "C", // Liberty Av
  "A53": "C", // Van Siclen Av
  "A54": "C", // Shepherd Av
  "A55": "A C", // Euclid Av
  "A57": "A", // Grant Av
  "A59": "A", // 80 St
  "A60": "A", // 88 St
  "A61": "A", // Rockaway Blvd
  "A63": "A", // 104 St
  "A64": "A", // 111 St
  "A65": "A", // Ozone Park-Lefferts Blvd
  
  // IND Rockaway Line
  "H01": "A", // Aqueduct Racetrack
  "H02": "A", // Aqueduct-N Conduit Av
  "H03": "A", // Howard Beach-JFK Airport
  "H04": "A S", // Broad Channel
  "H06": "A", // Beach 67 St
  "H07": "A", // Beach 60 St
  "H08": "A", // Beach 44 St
  "H09": "A", // Beach 36 St
  "H10": "A", // Beach 25 St
  "H11": "A", // Far Rockaway-Mott Av
  "H12": "A S", // Beach 90 St
  "H13": "A S", // Beach 98 St
  "H14": "A S", // Beach 105 St
  "H15": "A S", // Rockaway Park-Beach 116 St
  
  // IND Concourse Line
  "D01": "D", // Norwood-205 St
  "D03": "B D", // Bedford Park Blvd
  "D04": "B D", // Kingsbridge Rd
  "D05": "B D", // Fordham Rd
  "D06": "B D", // 182-183 Sts
  "D07": "B D", // Tremont Av
  "D08": "B D", // 174-175 Sts
  "D09": "B D", // 170 St
  "D10": "B D", // 167 St
  "D11": "B D", // 161 St-Yankee Stadium
  "D12": "B D", // 155 St
  "D13": "B D", // 145 St
  "D14": "B D E", // 7 Av
  "D15": "B D F M", // 47-50 Sts-Rockefeller Ctr
  "D16": "B D F M", // 42 St-Bryant Pk
  "D17": "B D F M", // 34 St-Herald Sq
  "D18": "F M", // 23 St
  "D19": "F M", // 14 St
  "D20": "B D F M", // W 4 St-Wash Sq
  "D21": "B D F M", // Broadway-Lafayette St
  "D22": "B D", // Grand St
  
  // IND 6th Av / Culver Line
  "F14": "F", // 2 Av
  "F15": "F", // Delancey St-Essex St
  "F16": "F", // East Broadway
  "F18": "F", // York St
  "F20": "F G", // Bergen St
  "F21": "F G", // Carroll St
  "F22": "F G", // Smith-9 Sts
  "F23": "F G", // 4 Av-9 St
  "F24": "F G", // 7 Av
  "F25": "F G", // 15 St-Prospect Park
  "F26": "F G", // Fort Hamilton Pkwy
  "F27": "F G", // Church Av
  "F29": "F", // Ditmas Av
  "F30": "F", // 18 Av
  "F31": "F", // Avenue I
  "F32": "F", // Bay Pkwy
  "F33": "F", // Avenue N
  "F34": "F", // Avenue P
  "F35": "F", // Kings Hwy
  "F36": "F", // Avenue U
  "F38": "F", // Avenue X
  "F39": "F", // Neptune Av
  
  // IND Queens Blvd Line
  "F01": "F", // Jamaica-179 St
  "F02": "F", // 169 St
  "F03": "F", // Parsons Blvd
  "F04": "F", // Sutphin Blvd
  "F05": "E F", // Briarwood
  "F06": "E F", // Kew Gardens-Union Tpke
  "F07": "E F", // 75 Av
  "G08": "E F M R", // Forest Hills-71 Av
  "G09": "M R", // 67 Av
  "G10": "M R", // 63 Dr-Rego Park
  "G11": "M R", // Woodhaven Blvd
  "G12": "M R", // Grand Av-Newtown
  "G13": "M R", // Elmhurst Av
  "G14": "E F M R", // Jackson Hts-Roosevelt Av
  "G15": "M R", // 65 St
  "G16": "M R", // Northern Blvd
  "G18": "M R", // 46 St
  "G19": "M R", // Steinway St
  "G20": "M R", // 36 St
  "G21": "E F R", // Queens Plaza
  "F09": "E F", // Court Sq-23 St
  "F11": "E F", // Lexington Av/53 St
  "F12": "E F", // 5 Av/53 St
  
  // IND 63rd St Line
  "B04": "M", // 21 St-Queensbridge
  "B06": "M", // Roosevelt Island
  "B08": "M Q", // Lexington Av/63 St
  "B10": "M", // 57 St
  
  // IND Queens-Archer Line
  "G05": "E J Z", // Jamaica Center-Parsons/Archer
  "G06": "E J Z", // Sutphin Blvd-Archer Av-JFK Airport
  "G07": "E", // Jamaica-Van Wyck
  
  // IND Crosstown Line (G)
  "G22": "G", // Court Sq
  "G24": "G", // 21 St
  "G26": "G", // Greenpoint Av
  "G28": "G", // Nassau Av
  "G29": "G", // Metropolitan Av
  "G30": "G", // Broadway
  "G31": "G", // Flushing Av
  "G32": "G", // Myrtle-Willoughby Avs
  "G33": "G", // Bedford-Nostrand Avs
  "G34": "G", // Classon Av
  "G35": "G", // Clinton-Washington Avs
  "G36": "G", // Fulton St
  
  // IRT Broadway-7th Av Line (1)
  "101": "1", // Van Cortlandt Park-242 St
  "103": "1", // 238 St
  "104": "1", // 231 St
  "106": "1", // Marble Hill-225 St
  "107": "1", // 215 St
  "108": "1", // 207 St
  "109": "1", // Dyckman St
  "110": "1", // 191 St
  "111": "1", // 181 St
  "112": "1", // 168 St
  "113": "1", // 157 St
  "114": "1", // 145 St
  "115": "1", // 137 St-City College
  "116": "1", // 125 St
  "117": "1", // 116 St-Columbia University
  "118": "1", // Cathedral Pkwy (110 St)
  "119": "1", // 103 St
  "120": "1 2 3", // 96 St
  "121": "1", // 86 St
  "122": "1", // 79 St
  "123": "1 2 3", // 72 St
  "124": "1", // 66 St-Lincoln Center
  "125": "1", // 59 St-Columbus Circle
  "126": "1", // 50 St
  "127": "1 2 3", // Times Sq-42 St
  "128": "1 2 3", // 34 St-Penn Station
  "129": "1", // 28 St
  "130": "1", // 23 St
  "131": "1", // 18 St
  "132": "1 2 3", // 14 St
  "133": "1", // Christopher St-Stonewall
  "134": "1", // Houston St
  "135": "1", // Canal St
  "136": "1", // Franklin St
  "137": "1 2 3", // Chambers St
  "138": "1", // WTC Cortlandt
  "139": "1", // Rector St
  "142": "1", // South Ferry
  
  // IRT Clark St / Eastern Pkwy Line (2, 3)
  "228": "2 3", // Park Place
  "229": "2 3", // Fulton St
  "230": "2 3", // Wall St
  "231": "2 3", // Clark St
  "232": "2 3", // Borough Hall
  "233": "2 3", // Hoyt St
  "234": "2 3 4 5", // Nevins St
  "235": "2 3 4 5", // Atlantic Av-Barclays Ctr
  "236": "2 3", // Bergen St
  "237": "2 3", // Grand Army Plaza
  "238": "2 3", // Eastern Pkwy-Brooklyn Museum
  "239": "2 3 4 5", // Franklin Av-Medgar Evers College
  "248": "3", // Nostrand Av
  "249": "3", // Kingston Av
  "250": "3 4", // Crown Hts-Utica Av
  "251": "3", // Sutter Av-Rutland Rd
  "252": "3", // Saratoga Av
  "253": "3", // Rockaway Av
  "254": "3", // Junius St
  "255": "3", // Pennsylvania Av
  "256": "3", // Van Siclen Av
  "257": "3", // New Lots Av
  
  // IRT Nostrand Av Line (2, 5)
  "241": "2 5", // President St
  "242": "2 5", // Sterling St
  "243": "2 5", // Winthrop St
  "244": "2 5", // Church Av
  "245": "2 5", // Beverly Rd
  "246": "2 5", // Newkirk Av
  "247": "2 5", // Flatbush Av-Brooklyn College
  
  // IRT White Plains Rd Line (2, 5)
  "201": "2 5", // Wakefield-241 St
  "204": "2 5", // Nereid Av
  "205": "2 5", // 233 St
  "206": "2 5", // 225 St
  "207": "2 5", // 219 St
  "208": "2 5", // Gun Hill Rd
  "209": "2 5", // Burke Av
  "210": "2 5", // Allerton Av
  "211": "2 5", // Pelham Pkwy
  "212": "2 5", // Bronx Park East
  "213": "2", // E 180 St
  "214": "2 5", // West Farms Sq-E Tremont Av
  "215": "2 5", // 174 St
  "216": "2 5", // Freeman St
  "217": "2 5", // Simpson St
  "218": "2 5", // Intervale Av
  "219": "2 5", // Prospect Av
  "220": "2 5", // Jackson Av
  "221": "2 5", // 3 Av-149 St
  "222": "2 5", // 149 St-Grand Concourse
  
  // IRT Lenox Line (2, 3)
  "224": "2 3", // Harlem-148 St
  "225": "2 3", // 145 St
  "226": "2 3", // 135 St
  "227": "2 3", // 125 St (Lenox)
  
  // IRT Lexington Av Line (4, 5, 6)
  "401": "4", // Woodlawn
  "402": "4", // Mosholu Pkwy
  "405": "4", // Bedford Park Blvd-Lehman College
  "406": "4", // Kingsbridge Rd
  "407": "4", // Fordham Rd
  "408": "4", // 183 St
  "409": "4", // Burnside Av
  "410": "4", // 176 St
  "411": "4", // Mt Eden Av
  "412": "4", // 170 St
  "413": "4", // 167 St
  "414": "4", // 161 St-Yankee Stadium
  "415": "4", // 149 St-Grand Concourse
  "416": "4", // 138 St-Grand Concourse
  "418": "4 5", // 125 St
  "419": "4 5 6", // 116 St
  "420": "4 5", // Bowling Green
  "423": "4 5 6", // 103 St
  "501": "5", // Eastchester-Dyre Av
  "502": "5", // Baychester Av
  "503": "5", // Gun Hill Rd (5)
  "504": "5", // Pelham Pkwy (5)
  "505": "5", // Morris Park
  "601": "6", // Pelham Bay Park
  "602": "6", // Buhre Av
  "603": "6", // Middletown Rd
  "604": "6", // Westchester Sq-E Tremont Av
  "606": "6", // Zerega Av
  "607": "6", // Castle Hill Av
  "608": "6", // Parkchester
  "609": "6", // St Lawrence Av
  "610": "6", // Morrison Av-Soundview
  "611": "6", // Elder Av
  "612": "6", // Whitlock Av
  "613": "6", // Hunts Point Av
  "614": "6", // Longwood Av
  "615": "6", // E 149 St
  "616": "6", // E 143 St-St Mary's St
  "617": "6", // Cypress Av
  "618": "6", // Brook Av
  "619": "6", // 3 Av-138 St
  "621": "4 5 6", // 138 St-Grand Concourse
  "622": "4 5 6", // 149 St-Grand Concourse
  "623": "4 5 6", // 161 St-Yankee Stadium
  "624": "4 5 6", // 167 St
  "625": "4 5 6", // 170 St
  "626": "4 5 6", // Mt Eden Av
  "627": "4 5 6", // 176 St
  "628": "4 5 6", // Burnside Av
  "629": "4 5 6", // 183 St
  "630": "4 5 6", // Fordham Rd
  "631": "4 5 6", // Kingsbridge Rd
  "632": "4 5 6", // Bedford Park Blvd
  "633": "4 5 6", // Mosholu Pkwy
  "634": "4 5 6", // Woodlawn
  "635": "4 5 6", // 59 St
  "636": "4 5 6", // 68 St-Hunter College
  "637": "4 5 6", // 77 St
  "638": "4 5 6", // 86 St
  "639": "4 5 6", // 96 St
  "640": "4 5 6", // 103 St
  "641": "4 5 6", // 110 St
  "642": "4 5 6", // 116 St
  "643": "4 5 6", // 125 St
  "644": "4 5 6", // Grand Central-42 St
  
  // IRT Flushing Line (7)
  "701": "7", // Flushing-Main St
  "702": "7", // Mets-Willets Point
  "705": "7", // 111 St
  "706": "7", // 103 St-Corona Plaza
  "707": "7", // Junction Blvd
  "708": "7", // 90 St-Elmhurst Av
  "709": "7", // 82 St-Jackson Hts
  "710": "7", // 74 St-Broadway
  "711": "7", // 69 St
  "712": "7", // Woodside-61 St
  "713": "7", // 52 St
  "714": "7", // 46 St-Bliss St
  "715": "7", // 40 St-Lowery St
  "716": "7", // 33 St-Rawson St
  "718": "7", // Queensboro Plaza
  "719": "7", // Court Sq
  "720": "7", // Hunters Point Av
  "721": "7", // Vernon Blvd-Jackson Av
  "723": "7", // Grand Central-42 St
  "724": "7", // 5 Av
  "725": "7", // Times Sq-42 St
  "726": "7", // 34 St-Hudson Yards
  
  // IRT 42nd St Shuttle
  "901": "S", // Grand Central-42 St
  "902": "S", // Times Sq-42 St
};

// Station name overrides for correct display names
const STATION_NAME_OVERRIDES: Record<string, string> = {
  "227": "110 St-Malcom X Plaza", // Was "Central Park North (110 St)" on 2/3
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
    { id: "723", lines: "7" },
    { id: "901", lines: "S" }
  ],
  "34 St - Penn Station": [
    { id: "A28", lines: "A C E" }
  ],
  "59 St": [
    { id: "R17", lines: "N Q R W" }
  ],
  "125 St": [
    { id: "A15", lines: "A B C D" }
  ],
  "145 St": [
    { id: "D13", lines: "B D" },
    { id: "A12", lines: "A C" }
  ],
  "168 St": [
    { id: "A09", lines: "A C" }
  ],
  "Court St / Borough Hall": [
    { id: "615", lines: "4 5", name: "Borough Hall" }
  ],
  "W 4 St-Wash Sq": [
    { id: "D20", lines: "B D F M" }
  ],
  "DeKalb Av": [
    { id: "R30", lines: "B Q R" }
  ],
  "Atlantic Av-Barclays Ctr": [
    { id: "D24", lines: "B Q" },
    { id: "R31", lines: "D N R" }
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
          
          // Default fallback based on prefix
          if (!line) {
            if (id.startsWith("A") || id.startsWith("H")) line = "A";
            if (id.startsWith("B")) line = "B D";
            if (id.startsWith("D")) line = "B D F M";
            if (id.startsWith("F")) line = "F";
            if (id.startsWith("G")) line = "G";
            if (id.startsWith("J")) line = "J Z";
            if (id.startsWith("L")) line = "L";
            if (id.startsWith("M")) line = "M";
            if (id.startsWith("N")) line = "N";
            if (id.startsWith("Q")) line = "N Q";
            if (id.startsWith("R")) line = "N R W";
            if (id.startsWith("S")) line = "S";
          }
          
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
        { id: "602", name: "Grand Central - 42 St", line: "4 5 6", lat: 40.751776, lng: -73.976848 },
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
