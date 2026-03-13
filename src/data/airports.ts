/**
 * World airports dataset with IATA codes.
 * Format: [IATA, Airport Name, City, Country ISO-2]
 * Sorted by traffic/importance for better search UX.
 */

export interface Airport {
  iata: string;
  name: string;
  city: string;
  country: string;
}

// Raw data: [IATA, Name, City, Country]
const RAW: [string, string, string, string][] = [
  // ── India ──────────────────────────────────────────────────────
  ["DEL", "Indira Gandhi International", "New Delhi", "IN"],
  ["BOM", "Chhatrapati Shivaji Maharaj International", "Mumbai", "IN"],
  ["BLR", "Kempegowda International", "Bengaluru", "IN"],
  ["MAA", "Chennai International", "Chennai", "IN"],
  ["CCU", "Netaji Subhas Chandra Bose International", "Kolkata", "IN"],
  ["HYD", "Rajiv Gandhi International", "Hyderabad", "IN"],
  ["COK", "Cochin International", "Kochi", "IN"],
  ["GOI", "Goa International (Dabolim)", "Goa", "IN"],
  ["AMD", "Sardar Vallabhbhai Patel International", "Ahmedabad", "IN"],
  ["PNQ", "Pune Airport", "Pune", "IN"],
  ["JAI", "Jaipur International", "Jaipur", "IN"],
  ["LKO", "Chaudhary Charan Singh International", "Lucknow", "IN"],
  ["TRV", "Trivandrum International", "Thiruvananthapuram", "IN"],
  ["GAU", "Lokpriya Gopinath Bordoloi International", "Guwahati", "IN"],
  ["IXC", "Chandigarh International", "Chandigarh", "IN"],
  ["VNS", "Lal Bahadur Shastri International", "Varanasi", "IN"],
  ["PAT", "Jay Prakash Narayan International", "Patna", "IN"],
  ["BBI", "Biju Patnaik International", "Bhubaneswar", "IN"],
  ["NAG", "Dr. Babasaheb Ambedkar International", "Nagpur", "IN"],
  ["IXR", "Birsa Munda Airport", "Ranchi", "IN"],
  ["SXR", "Sheikh ul-Alam International", "Srinagar", "IN"],
  ["ATQ", "Sri Guru Ram Dass Jee International", "Amritsar", "IN"],
  ["IXB", "Bagdogra Airport", "Siliguri", "IN"],
  ["RPR", "Swami Vivekananda Airport", "Raipur", "IN"],
  ["IDR", "Devi Ahilyabai Holkar Airport", "Indore", "IN"],
  ["VTZ", "Visakhapatnam Airport", "Visakhapatnam", "IN"],
  ["IXM", "Madurai Airport", "Madurai", "IN"],
  ["CJB", "Coimbatore International", "Coimbatore", "IN"],
  ["CCJ", "Calicut International", "Kozhikode", "IN"],
  ["IXA", "Agartala Airport", "Agartala", "IN"],
  ["IMF", "Imphal International", "Imphal", "IN"],
  ["DIB", "Dibrugarh Airport", "Dibrugarh", "IN"],
  ["IXJ", "Jammu Airport", "Jammu", "IN"],
  ["DED", "Jolly Grant Airport", "Dehradun", "IN"],
  ["IXE", "Mangalore International", "Mangalore", "IN"],
  ["UDR", "Maharana Pratap Airport", "Udaipur", "IN"],
  ["BDQ", "Vadodara Airport", "Vadodara", "IN"],
  ["RAJ", "Rajkot Airport", "Rajkot", "IN"],
  ["GOX", "Manohar International", "Goa (Mopa)", "IN"],
  ["JLR", "Jabalpur Airport", "Jabalpur", "IN"],
  ["TIR", "Tirupati Airport", "Tirupati", "IN"],
  ["STV", "Surat Airport", "Surat", "IN"],
  ["BHO", "Raja Bhoj Airport", "Bhopal", "IN"],
  ["DHM", "Kangra Airport", "Dharamshala", "IN"],
  ["IXL", "Kushok Bakula Rimpochee Airport", "Leh", "IN"],
  ["KUU", "Bhuntar Airport", "Kullu", "IN"],
  ["PGH", "Pantnagar Airport", "Pantnagar", "IN"],

  // ── South Asia ─────────────────────────────────────────────────
  ["CMB", "Bandaranaike International", "Colombo", "LK"],
  ["HRI", "Mattala Rajapaksa International", "Hambantota", "LK"],
  ["DAC", "Hazrat Shahjalal International", "Dhaka", "BD"],
  ["CGP", "Shah Amanat International", "Chattogram", "BD"],
  ["KTM", "Tribhuvan International", "Kathmandu", "NP"],
  ["ISB", "Islamabad International", "Islamabad", "PK"],
  ["KHI", "Jinnah International", "Karachi", "PK"],
  ["LHE", "Allama Iqbal International", "Lahore", "PK"],
  ["MLE", "Velana International", "Malé", "MV"],

  // ── Middle East ────────────────────────────────────────────────
  ["DXB", "Dubai International", "Dubai", "AE"],
  ["AUH", "Abu Dhabi International", "Abu Dhabi", "AE"],
  ["SHJ", "Sharjah International", "Sharjah", "AE"],
  ["DOH", "Hamad International", "Doha", "QA"],
  ["BAH", "Bahrain International", "Manama", "BH"],
  ["MCT", "Muscat International", "Muscat", "OM"],
  ["KWI", "Kuwait International", "Kuwait City", "KW"],
  ["RUH", "King Khalid International", "Riyadh", "SA"],
  ["JED", "King Abdulaziz International", "Jeddah", "SA"],
  ["DMM", "King Fahd International", "Dammam", "SA"],
  ["TLV", "Ben Gurion International", "Tel Aviv", "IL"],
  ["AMM", "Queen Alia International", "Amman", "JO"],
  ["BGW", "Baghdad International", "Baghdad", "IQ"],
  ["IKA", "Imam Khomeini International", "Tehran", "IR"],

  // ── Southeast Asia ─────────────────────────────────────────────
  ["SIN", "Changi Airport", "Singapore", "SG"],
  ["KUL", "Kuala Lumpur International", "Kuala Lumpur", "MY"],
  ["BKK", "Suvarnabhumi Airport", "Bangkok", "TH"],
  ["DMK", "Don Mueang International", "Bangkok", "TH"],
  ["HKT", "Phuket International", "Phuket", "TH"],
  ["CNX", "Chiang Mai International", "Chiang Mai", "TH"],
  ["CGK", "Soekarno-Hatta International", "Jakarta", "ID"],
  ["DPS", "Ngurah Rai International", "Bali (Denpasar)", "ID"],
  ["MNL", "Ninoy Aquino International", "Manila", "PH"],
  ["CEB", "Mactan-Cebu International", "Cebu", "PH"],
  ["SGN", "Tan Son Nhat International", "Ho Chi Minh City", "VN"],
  ["HAN", "Noi Bai International", "Hanoi", "VN"],
  ["DAD", "Da Nang International", "Da Nang", "VN"],
  ["RGN", "Yangon International", "Yangon", "MM"],
  ["PNH", "Phnom Penh International", "Phnom Penh", "KH"],
  ["REP", "Siem Reap International", "Siem Reap", "KH"],
  ["VTE", "Wattay International", "Vientiane", "LA"],

  // ── East Asia ──────────────────────────────────────────────────
  ["HKG", "Hong Kong International", "Hong Kong", "HK"],
  ["PEK", "Beijing Capital International", "Beijing", "CN"],
  ["PKX", "Beijing Daxing International", "Beijing", "CN"],
  ["PVG", "Shanghai Pudong International", "Shanghai", "CN"],
  ["SHA", "Shanghai Hongqiao International", "Shanghai", "CN"],
  ["CAN", "Guangzhou Baiyun International", "Guangzhou", "CN"],
  ["SZX", "Shenzhen Bao'an International", "Shenzhen", "CN"],
  ["CTU", "Chengdu Tianfu International", "Chengdu", "CN"],
  ["NRT", "Narita International", "Tokyo", "JP"],
  ["HND", "Haneda Airport", "Tokyo", "JP"],
  ["KIX", "Kansai International", "Osaka", "JP"],
  ["ICN", "Incheon International", "Seoul", "KR"],
  ["GMP", "Gimpo International", "Seoul", "KR"],
  ["TPE", "Taiwan Taoyuan International", "Taipei", "TW"],
  ["UBN", "Chinggis Khaan International", "Ulaanbaatar", "MN"],

  // ── Europe ─────────────────────────────────────────────────────
  ["LHR", "Heathrow Airport", "London", "GB"],
  ["LGW", "Gatwick Airport", "London", "GB"],
  ["STN", "Stansted Airport", "London", "GB"],
  ["LTN", "Luton Airport", "London", "GB"],
  ["MAN", "Manchester Airport", "Manchester", "GB"],
  ["EDI", "Edinburgh Airport", "Edinburgh", "GB"],
  ["BHX", "Birmingham Airport", "Birmingham", "GB"],
  ["CDG", "Charles de Gaulle Airport", "Paris", "FR"],
  ["ORY", "Orly Airport", "Paris", "FR"],
  ["NCE", "Nice Côte d'Azur Airport", "Nice", "FR"],
  ["LYS", "Lyon-Saint Exupéry Airport", "Lyon", "FR"],
  ["FRA", "Frankfurt Airport", "Frankfurt", "DE"],
  ["MUC", "Munich Airport", "Munich", "DE"],
  ["TXL", "Berlin Brandenburg Airport", "Berlin", "DE"],
  ["BER", "Berlin Brandenburg Airport", "Berlin", "DE"],
  ["DUS", "Düsseldorf Airport", "Düsseldorf", "DE"],
  ["HAM", "Hamburg Airport", "Hamburg", "DE"],
  ["AMS", "Amsterdam Schiphol", "Amsterdam", "NL"],
  ["BRU", "Brussels Airport", "Brussels", "BE"],
  ["MAD", "Adolfo Suárez Madrid-Barajas", "Madrid", "ES"],
  ["BCN", "Barcelona-El Prat", "Barcelona", "ES"],
  ["AGP", "Málaga Airport", "Málaga", "ES"],
  ["PMI", "Palma de Mallorca Airport", "Palma", "ES"],
  ["FCO", "Leonardo da Vinci–Fiumicino", "Rome", "IT"],
  ["MXP", "Milan Malpensa", "Milan", "IT"],
  ["LIN", "Milan Linate", "Milan", "IT"],
  ["VCE", "Venice Marco Polo", "Venice", "IT"],
  ["NAP", "Naples International", "Naples", "IT"],
  ["ZRH", "Zurich Airport", "Zurich", "CH"],
  ["GVA", "Geneva Airport", "Geneva", "CH"],
  ["VIE", "Vienna International", "Vienna", "AT"],
  ["LIS", "Lisbon Humberto Delgado", "Lisbon", "PT"],
  ["OPO", "Porto Airport", "Porto", "PT"],
  ["CPH", "Copenhagen Airport", "Copenhagen", "DK"],
  ["OSL", "Oslo Gardermoen", "Oslo", "NO"],
  ["ARN", "Stockholm Arlanda", "Stockholm", "SE"],
  ["HEL", "Helsinki-Vantaa", "Helsinki", "FI"],
  ["DUB", "Dublin Airport", "Dublin", "IE"],
  ["ATH", "Athens International", "Athens", "GR"],
  ["IST", "Istanbul Airport", "Istanbul", "TR"],
  ["SAW", "Sabiha Gökçen International", "Istanbul", "TR"],
  ["WAW", "Warsaw Chopin Airport", "Warsaw", "PL"],
  ["PRG", "Václav Havel Airport", "Prague", "CZ"],
  ["BUD", "Budapest Ferenc Liszt", "Budapest", "HU"],
  ["OTP", "Henri Coandă International", "Bucharest", "RO"],
  ["SOF", "Sofia Airport", "Sofia", "BG"],
  ["BEG", "Belgrade Nikola Tesla", "Belgrade", "RS"],
  ["ZAG", "Zagreb Franjo Tuđman", "Zagreb", "HR"],
  ["KBP", "Boryspil International", "Kyiv", "UA"],
  ["SVO", "Sheremetyevo International", "Moscow", "RU"],
  ["DME", "Domodedovo International", "Moscow", "RU"],
  ["LED", "Pulkovo Airport", "St. Petersburg", "RU"],
  ["RIX", "Riga International", "Riga", "LV"],
  ["TLL", "Tallinn Airport", "Tallinn", "EE"],
  ["VNO", "Vilnius Airport", "Vilnius", "LT"],
  ["KEF", "Keflavik International", "Reykjavik", "IS"],

  // ── North America ──────────────────────────────────────────────
  ["JFK", "John F. Kennedy International", "New York", "US"],
  ["EWR", "Newark Liberty International", "Newark/New York", "US"],
  ["LGA", "LaGuardia Airport", "New York", "US"],
  ["LAX", "Los Angeles International", "Los Angeles", "US"],
  ["SFO", "San Francisco International", "San Francisco", "US"],
  ["ORD", "O'Hare International", "Chicago", "US"],
  ["ATL", "Hartsfield-Jackson Atlanta International", "Atlanta", "US"],
  ["DFW", "Dallas/Fort Worth International", "Dallas", "US"],
  ["DEN", "Denver International", "Denver", "US"],
  ["MIA", "Miami International", "Miami", "US"],
  ["SEA", "Seattle-Tacoma International", "Seattle", "US"],
  ["IAD", "Washington Dulles International", "Washington D.C.", "US"],
  ["DCA", "Ronald Reagan Washington National", "Washington D.C.", "US"],
  ["BOS", "Boston Logan International", "Boston", "US"],
  ["IAH", "George Bush Intercontinental", "Houston", "US"],
  ["PHX", "Phoenix Sky Harbor International", "Phoenix", "US"],
  ["MSP", "Minneapolis-Saint Paul International", "Minneapolis", "US"],
  ["DTW", "Detroit Metropolitan Wayne County", "Detroit", "US"],
  ["FLL", "Fort Lauderdale-Hollywood International", "Fort Lauderdale", "US"],
  ["MCO", "Orlando International", "Orlando", "US"],
  ["CLT", "Charlotte Douglas International", "Charlotte", "US"],
  ["SAN", "San Diego International", "San Diego", "US"],
  ["TPA", "Tampa International", "Tampa", "US"],
  ["HNL", "Daniel K. Inouye International", "Honolulu", "US"],
  ["SLC", "Salt Lake City International", "Salt Lake City", "US"],
  ["AUS", "Austin-Bergstrom International", "Austin", "US"],
  ["YYZ", "Toronto Pearson International", "Toronto", "CA"],
  ["YVR", "Vancouver International", "Vancouver", "CA"],
  ["YUL", "Montréal-Trudeau International", "Montréal", "CA"],
  ["YOW", "Ottawa Macdonald-Cartier International", "Ottawa", "CA"],
  ["YYC", "Calgary International", "Calgary", "CA"],
  ["YEG", "Edmonton International", "Edmonton", "CA"],
  ["MEX", "Mexico City International", "Mexico City", "MX"],
  ["CUN", "Cancún International", "Cancún", "MX"],
  ["GDL", "Guadalajara International", "Guadalajara", "MX"],

  // ── Central America & Caribbean ────────────────────────────────
  ["PTY", "Tocumen International", "Panama City", "PA"],
  ["SJO", "Juan Santamaría International", "San José", "CR"],
  ["SAL", "El Salvador International", "San Salvador", "SV"],
  ["NAS", "Lynden Pindling International", "Nassau", "BS"],
  ["KIN", "Norman Manley International", "Kingston", "JM"],
  ["POS", "Piarco International", "Port of Spain", "TT"],

  // ── South America ──────────────────────────────────────────────
  ["GRU", "São Paulo-Guarulhos International", "São Paulo", "BR"],
  ["GIG", "Rio de Janeiro-Galeão International", "Rio de Janeiro", "BR"],
  ["EZE", "Ministro Pistarini International", "Buenos Aires", "AR"],
  ["SCL", "Arturo Merino Benítez International", "Santiago", "CL"],
  ["BOG", "El Dorado International", "Bogotá", "CO"],
  ["LIM", "Jorge Chávez International", "Lima", "PE"],
  ["UIO", "Mariscal Sucre International", "Quito", "EC"],
  ["CCS", "Simón Bolívar International", "Caracas", "VE"],
  ["MVD", "Carrasco International", "Montevideo", "UY"],

  // ── Africa ─────────────────────────────────────────────────────
  ["JNB", "O.R. Tambo International", "Johannesburg", "ZA"],
  ["CPT", "Cape Town International", "Cape Town", "ZA"],
  ["DUR", "King Shaka International", "Durban", "ZA"],
  ["NBO", "Jomo Kenyatta International", "Nairobi", "KE"],
  ["ADD", "Addis Ababa Bole International", "Addis Ababa", "ET"],
  ["CAI", "Cairo International", "Cairo", "EG"],
  ["CMN", "Mohammed V International", "Casablanca", "MA"],
  ["LOS", "Murtala Muhammed International", "Lagos", "NG"],
  ["ABV", "Nnamdi Azikiwe International", "Abuja", "NG"],
  ["DSS", "Blaise Diagne International", "Dakar", "SN"],
  ["ACC", "Kotoka International", "Accra", "GH"],
  ["DAR", "Julius Nyerere International", "Dar es Salaam", "TZ"],
  ["EBB", "Entebbe International", "Entebbe", "UG"],
  ["MRU", "Sir Seewoosagur Ramgoolam International", "Mauritius", "MU"],

  // ── Oceania ────────────────────────────────────────────────────
  ["SYD", "Sydney Kingsford Smith", "Sydney", "AU"],
  ["MEL", "Melbourne Tullamarine", "Melbourne", "AU"],
  ["BNE", "Brisbane Airport", "Brisbane", "AU"],
  ["PER", "Perth Airport", "Perth", "AU"],
  ["AKL", "Auckland Airport", "Auckland", "NZ"],
  ["WLG", "Wellington Airport", "Wellington", "NZ"],
  ["CHC", "Christchurch Airport", "Christchurch", "NZ"],
  ["NAN", "Nadi International", "Nadi", "FJ"],

  // ── Central Asia ───────────────────────────────────────────────
  ["TAS", "Islam Karimov International", "Tashkent", "UZ"],
  ["ALA", "Almaty International", "Almaty", "KZ"],
  ["NQZ", "Nursultan Nazarbayev International", "Astana", "KZ"],
  ["GYD", "Heydar Aliyev International", "Baku", "AZ"],
  ["TBS", "Tbilisi International", "Tbilisi", "GE"],
  ["EVN", "Zvartnots International", "Yerevan", "AM"],
];

export const AIRPORTS: Airport[] = RAW.map(([iata, name, city, country]) => ({
  iata,
  name,
  city,
  country,
}));

// Build search index for fast lookup
const airportMap = new Map<string, Airport>();
for (const a of AIRPORTS) {
  airportMap.set(a.iata, a);
}

/** Look up an airport by IATA code */
export function getAirport(iata: string): Airport | undefined {
  return airportMap.get(iata.toUpperCase());
}

/** Format airport for display: "DEL - Indira Gandhi International, New Delhi" */
export function formatAirport(iata: string): string {
  const a = getAirport(iata);
  if (!a) return iata;
  return `${a.iata} - ${a.name}, ${a.city}`;
}

/** Short format: "DEL (New Delhi)" */
export function formatAirportShort(iata: string): string {
  const a = getAirport(iata);
  if (!a) return iata;
  return `${a.iata} (${a.city})`;
}

/** Search airports by query (IATA, city, name, country) */
export function searchAirports(query: string, limit = 10): Airport[] {
  if (!query || query.length < 1) return [];
  const q = query.toLowerCase().trim();

  // Exact IATA match first
  const exact = getAirport(q.toUpperCase());

  const scored: [Airport, number][] = [];
  for (const a of AIRPORTS) {
    const iataLower = a.iata.toLowerCase();
    const cityLower = a.city.toLowerCase();
    const nameLower = a.name.toLowerCase();
    const countryLower = a.country.toLowerCase();

    let score = 0;
    if (iataLower === q) score = 100;
    else if (iataLower.startsWith(q)) score = 90;
    else if (cityLower === q) score = 85;
    else if (cityLower.startsWith(q)) score = 80;
    else if (nameLower.includes(q)) score = 60;
    else if (cityLower.includes(q)) score = 50;
    else if (countryLower === q) score = 30;
    else continue;

    scored.push([a, score]);
  }

  scored.sort((a, b) => b[1] - a[1]);

  const results = scored.slice(0, limit).map(([a]) => a);

  // Ensure exact IATA match is first
  if (exact && results[0]?.iata !== exact.iata) {
    return [exact, ...results.filter(a => a.iata !== exact.iata)].slice(0, limit);
  }

  return results;
}
