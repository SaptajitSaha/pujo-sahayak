// ─── Kolkata Metro network geometry (transcribed from the official map) ──────
// The full network — operational + sanctioned — as a spatial graph, used only by
// the animated network map on the Metro guide.
//
// PROVENANCE (two tiers, kept honest):
//  • OPERATIONAL CORE (Blue Line 1, Green Line 3, Purple Line 2, Orange Line 4
//    stations, plus Noapara/Jessore Road): real coordinates extracted from
//    OpenStreetMap (Kolkata subway route relations + station nodes). © OpenStreetMap
//    contributors, ODbL (data.openstreetmap.org). Fetched at build time and vendored
//    here so the map renders fully OFFLINE inside the APK — never calls Overpass at runtime.
//  • NEWER / EXTENDED LINES (Pink Barrackpore line, Yellow airport line to Barasat,
//    Green east to Keshutpur, Orange New Town loop, Purple branches): transcribed by
//    hand from the official Kolkata Metro network map. Their topology (which stations,
//    in what order, which interchanges) follows the official map; their coordinates are
//    APPROXIMATE (schematic), not surveyed. Under-construction stations may not be open.
//
// HONESTY: this is a *schematic* reference diagram, not satellite-accurate track
// geometry. Stations shared between lines merge to one interchange node. The page
// captions it and asks riders to verify with the official Kolkata Metro map. No live
// service status is implied.

/** A physical station. Shared stations (e.g. Esplanade) appear ONCE; multiple
    lines list the same id, which the layout reads as an interchange. */
export interface MetroNetStation { id: string; name: string; lat: number; lng: number }

/** One metro line (or branch): ordered station ids (travel order, one direction).
    Branches of the same coloured line are separate entries sharing a `color`. */
export interface MetroNetLine { id: string; name: string; short: string; color: string; stationIds: string[] }

export const metroNetStations: MetroNetStation[] = [
  // ── Blue Line (Line 1) — Kavi Subhash ↔ Dakshineshwar (north–south spine) — REAL OSM ──
  { id: 'kavi-subhash', name: 'Kavi Subhash', lat: 22.47160, lng: 88.39813 }, // shared with Orange
  { id: 'shahid-khudiram', name: 'Shahid Khudiram', lat: 22.46585, lng: 88.39124 },
  { id: 'kavi-nazrul', name: 'Kavi Nazrul', lat: 22.46406, lng: 88.38004 },
  { id: 'gitanjali', name: 'Gitanjali', lat: 22.46936, lng: 88.37001 },
  { id: 'masterda-surya-sen', name: 'Masterda Surya Sen', lat: 22.47341, lng: 88.36083 },
  { id: 'netaji', name: 'Netaji', lat: 22.48127, lng: 88.34560 },
  { id: 'mahanayak-uttam-kumar', name: 'Mahanayak Uttam Kumar', lat: 22.49529, lng: 88.34498 },
  { id: 'rabindra-sarobar', name: 'Rabindra Sarobar', lat: 22.50761, lng: 88.34543 },
  { id: 'kalighat', name: 'Kalighat', lat: 22.51713, lng: 88.34578 },
  { id: 'jatin-das-park', name: 'Jatin Das Park', lat: 22.52425, lng: 88.34643 },
  { id: 'netaji-bhavan', name: 'Netaji Bhavan', lat: 22.53344, lng: 88.34592 },
  { id: 'rabindra-sadan', name: 'Rabindra Sadan', lat: 22.54179, lng: 88.34723 },
  { id: 'maidan', name: 'Maidan', lat: 22.54971, lng: 88.34875 },
  { id: 'park-street', name: 'Park Street', lat: 22.55528, lng: 88.35004 },
  { id: 'esplanade', name: 'Esplanade', lat: 22.56392, lng: 88.35069 }, // shared with Green
  { id: 'chandni-chowk', name: 'Chandni Chowk', lat: 22.56710, lng: 88.35431 },
  { id: 'central', name: 'Central', lat: 22.57265, lng: 88.35875 },
  { id: 'mahatma-gandhi-road', name: 'Mahatma Gandhi Road', lat: 22.58112, lng: 88.36134 },
  { id: 'girish-park', name: 'Girish Park', lat: 22.58736, lng: 88.36296 },
  { id: 'shobhabazar-sutanuti', name: 'Shobhabazar Sutanuti', lat: 22.59608, lng: 88.36510 },
  { id: 'shyambazar', name: 'Shyambazar', lat: 22.60149, lng: 88.37261 },
  { id: 'belgachia', name: 'Belgachia', lat: 22.60611, lng: 88.38660 },
  { id: 'dum-dum', name: 'Dum Dum', lat: 22.62134, lng: 88.39278 },
  { id: 'noapara', name: 'Noapara', lat: 22.63996, lng: 88.39414 }, // shared with Pink + Yellow
  { id: 'baranagar', name: 'Baranagar', lat: 22.65307, lng: 88.38067 },
  { id: 'dakshineshwar', name: 'Dakshineshwar', lat: 22.65402, lng: 88.36376 },

  // ── Pink Line — Barrackpore ↔ Noapara (B.T. Road corridor) — transcribed, approx coords ──
  { id: 'barrackpore', name: 'Barrackpore', lat: 22.77000, lng: 88.38000 },
  { id: 'talpukur', name: 'Talpukur', lat: 22.75700, lng: 88.37900 },
  { id: 'titagarh', name: 'Titagarh', lat: 22.74500, lng: 88.37900 },
  { id: 'tata-gate', name: 'Tata Gate', lat: 22.73300, lng: 88.38000 },
  { id: 'khardaha', name: 'Khardaha', lat: 22.72200, lng: 88.38100 },
  { id: 'subhash-nagar', name: 'Subhash Nagar', lat: 22.71000, lng: 88.38200 },
  { id: 'panihati', name: 'Panihati', lat: 22.69800, lng: 88.38300 },
  { id: 'sodepur', name: 'Sodepur', lat: 22.68500, lng: 88.38400 },
  { id: 'agarapara', name: 'Agarapara', lat: 22.67200, lng: 88.38600 },
  { id: 'kamarkhati', name: 'Kamarkhati', lat: 22.66200, lng: 88.38800 },
  // (noapara shared with Blue)

  // ── Yellow Line (Line 6, Airport) — Noapara ↔ Barasat — transcribed, approx coords ──
  // (noapara shared with Blue)
  { id: 'dum-dum-road', name: 'Dum Dum Road', lat: 22.63700, lng: 88.41200 },
  { id: 'jessore-road', name: 'Jessore Road', lat: 22.63924, lng: 88.42979 },
  { id: 'biman-bandar', name: 'Biman Bandar', lat: 22.65300, lng: 88.44700 }, // shared with Orange
  { id: 'birati', name: 'Birati', lat: 22.66800, lng: 88.45200 },
  { id: 'madhyamgram', name: 'Madhyamgram', lat: 22.68000, lng: 88.46200 },
  { id: 'new-barrackpore', name: 'New Barrackpore', lat: 22.69200, lng: 88.47200 },
  { id: 'michael-nagar', name: 'Michael Nagar', lat: 22.70200, lng: 88.48500 },
  { id: 'hridaypur', name: 'Hridaypur', lat: 22.70800, lng: 88.49800 },
  { id: 'barasat', name: 'Barasat', lat: 22.71700, lng: 88.51000 },

  // ── Green Line (Line 3 / East–West) — Howrah Maidan ↔ Raghunathpur — core REAL, east arm approx ──
  { id: 'howrah-maidan', name: 'Howrah Maidan', lat: 22.58378, lng: 88.33400 },
  { id: 'howrah', name: 'Howrah', lat: 22.58337, lng: 88.34016 },
  { id: 'mahakaran', name: 'Mahakaran', lat: 22.57205, lng: 88.35055 },
  // (esplanade shared with Blue)
  { id: 'sealdah', name: 'Sealdah', lat: 22.56647, lng: 88.37005 },
  { id: 'phoolbagan', name: 'Phoolbagan', lat: 22.57209, lng: 88.39026 },
  { id: 'salt-lake-stadium', name: 'Salt Lake Stadium', lat: 22.57297, lng: 88.40308 },
  { id: 'bengal-chemical', name: 'Bengal Chemical', lat: 22.57997, lng: 88.40134 },
  { id: 'city-centre', name: 'City Centre', lat: 22.58699, lng: 88.40792 },
  { id: 'central-park', name: 'Central Park', lat: 22.59040, lng: 88.41564 },
  { id: 'karunamoyee', name: 'Karunamoyee', lat: 22.58629, lng: 88.42157 },
  { id: 'nicco-park', name: 'Nicco Park', lat: 22.58500, lng: 88.42400 },
  { id: 'salt-lake-sector-v', name: 'Salt Lake Sector V', lat: 22.58094, lng: 88.42902 }, // shared with Orange
  { id: 'baguiati', name: 'Baguiati', lat: 22.58800, lng: 88.42100 },
  { id: 'keshutpur', name: 'Keshutpur', lat: 22.59600, lng: 88.42700 },
  { id: 'dum-park', name: 'Dum Park', lat: 22.60100, lng: 88.41600 },
  { id: 'raghunathpur', name: 'Raghunathpur', lat: 22.60700, lng: 88.40800 },

  // ── Orange Line (Line 2/4) — Kavi Subhash ↔ Biman Bandar (east–New Town loop) — core REAL, east arm approx ──
  // (kavi-subhash shared with Blue)
  { id: 'satyajit-roy', name: 'Satyajit Roy', lat: 22.48466, lng: 88.39268 },
  { id: 'jyotirindra-nandi', name: 'Jyotirindra Nandi', lat: 22.49561, lng: 88.39848 },
  { id: 'kavi-sukanta', name: 'Kavi Sukanta', lat: 22.50530, lng: 88.40103 },
  { id: 'hemanta-mukhopadhyay', name: 'Hemanta Mukhopadhyay', lat: 22.51486, lng: 88.40146 },
  { id: 'vip-bazar', name: 'VIP Bazar', lat: 22.52470, lng: 88.39627 },
  { id: 'ritwik-ghatak', name: 'Ritwik Ghatak', lat: 22.53299, lng: 88.39646 },
  { id: 'barun-sengupta', name: 'Barun Sengupta', lat: 22.54380, lng: 88.39930 },
  { id: 'beleghata', name: 'Beleghata', lat: 22.55068, lng: 88.40401 },
  { id: 'gour-kishor-ghosh', name: 'Gour Kishor Ghosh', lat: 22.57000, lng: 88.41200 },
  // (salt-lake-sector-v shared with Green)
  { id: 'technopolis', name: 'Technopolis', lat: 22.57500, lng: 88.43800 },
  { id: 'bidhan-nagar', name: 'Bidhan Nagar', lat: 22.57800, lng: 88.44500 },
  { id: 'sub-cbd-1', name: 'Sub CBD 1', lat: 22.57000, lng: 88.45500 },
  { id: 'cbd-1', name: 'CBD 1', lat: 22.58200, lng: 88.46200 },
  { id: 'kalakshetra', name: 'Kalakshetra', lat: 22.59000, lng: 88.46800 },
  { id: 'new-town', name: 'New Town', lat: 22.59800, lng: 88.47500 },
  { id: 'convention-centre', name: 'Convention Centre', lat: 22.58800, lng: 88.48200 },
  { id: 'sub-cbd-2', name: 'Sub CBD 2', lat: 22.57800, lng: 88.47800 },
  { id: 'titumir', name: 'Titumir', lat: 22.60000, lng: 88.45500 },
  // (biman-bandar shared with Yellow)

  // ── Purple Line (Line 2) — Victoria ↔ Joka — REAL core, north/south branches transcribed ──
  { id: 'victoria', name: 'Victoria', lat: 22.56000, lng: 88.33600 }, // name uncertain on official map
  { id: 'kidderpore', name: 'Kidderpore', lat: 22.54800, lng: 88.33200 },
  { id: 'mominpur', name: 'Mominpur', lat: 22.54000, lng: 88.32800 },
  { id: 'majerhat', name: 'Majerhat', lat: 22.51906, lng: 88.32366 },
  { id: 'taratala', name: 'Taratala', lat: 22.50770, lng: 88.32035 },
  { id: 'behala-bazar', name: 'Behala Bazar', lat: 22.49880, lng: 88.31736 },
  { id: 'behala-chowrasta', name: 'Behala Chowrasta', lat: 22.48740, lng: 88.31334 },
  { id: 'sakher-bazar', name: 'Sakher Bazar', lat: 22.47489, lng: 88.30994 },
  { id: 'thakurpukur', name: 'Thakurpukur', lat: 22.46441, lng: 88.30753 }, // junction with south branch
  { id: 'joka', name: 'Joka', lat: 22.45237, lng: 88.30185 },

  // ── Purple Line south branch — Thakurpukur ↔ Diamond Park (via IIM) — transcribed, approx ──
  // (thakurpukur shared with main Purple)
  { id: 'iim', name: 'IIM', lat: 22.45200, lng: 88.31200 },
  { id: 'diamond-park', name: 'Diamond Park', lat: 22.44500, lng: 88.32200 },
]

// Display colours are chosen for contrast on both light and dark chrome, not
// copied verbatim from the raw OSM tags (some were unusable, e.g. pure #FFFF00).
// Branches reuse their parent line's colour; the legend groups by colour.
export const metroNetLines: MetroNetLine[] = [
  {
    id: 'blue', name: 'Blue Line · Line 1', short: 'Line 1', color: '#2563EB',
    stationIds: ['kavi-subhash', 'shahid-khudiram', 'kavi-nazrul', 'gitanjali', 'masterda-surya-sen', 'netaji', 'mahanayak-uttam-kumar', 'rabindra-sarobar', 'kalighat', 'jatin-das-park', 'netaji-bhavan', 'rabindra-sadan', 'maidan', 'park-street', 'esplanade', 'chandni-chowk', 'central', 'mahatma-gandhi-road', 'girish-park', 'shobhabazar-sutanuti', 'shyambazar', 'belgachia', 'dum-dum', 'noapara', 'baranagar', 'dakshineshwar'],
  },
  {
    id: 'green', name: 'Green Line · Line 3', short: 'Line 3', color: '#16A34A',
    stationIds: ['howrah-maidan', 'howrah', 'mahakaran', 'esplanade', 'sealdah', 'phoolbagan', 'salt-lake-stadium', 'bengal-chemical', 'city-centre', 'central-park', 'karunamoyee', 'nicco-park', 'salt-lake-sector-v', 'baguiati', 'keshutpur', 'dum-park', 'raghunathpur'],
  },
  {
    id: 'purple', name: 'Purple Line · Line 2', short: 'Line 2', color: '#7C3AED',
    stationIds: ['victoria', 'kidderpore', 'mominpur', 'majerhat', 'taratala', 'behala-bazar', 'behala-chowrasta', 'sakher-bazar', 'thakurpukur', 'joka'],
  },
  {
    id: 'purple-south', name: 'Purple Line · Diamond Park branch', short: 'Line 2', color: '#7C3AED',
    stationIds: ['thakurpukur', 'iim', 'diamond-park'],
  },
  {
    id: 'orange', name: 'Orange Line · Line 2', short: 'Line 2', color: '#EA580C',
    stationIds: ['kavi-subhash', 'satyajit-roy', 'jyotirindra-nandi', 'kavi-sukanta', 'hemanta-mukhopadhyay', 'vip-bazar', 'ritwik-ghatak', 'barun-sengupta', 'beleghata', 'gour-kishor-ghosh', 'salt-lake-sector-v', 'technopolis', 'bidhan-nagar', 'sub-cbd-1', 'cbd-1', 'kalakshetra', 'new-town', 'convention-centre', 'sub-cbd-2', 'titumir', 'biman-bandar'],
  },
  {
    id: 'yellow', name: 'Yellow Line · Airport', short: 'Line 6', color: '#B45309',
    stationIds: ['noapara', 'dum-dum-road', 'jessore-road', 'biman-bandar', 'birati', 'madhyamgram', 'new-barrackpore', 'michael-nagar', 'hridaypur', 'barasat'],
  },
  {
    id: 'pink', name: 'Pink Line', short: 'Pink', color: '#DB2777',
    stationIds: ['barrackpore', 'talpukur', 'titagarh', 'tata-gate', 'khardaha', 'subhash-nagar', 'panihati', 'sodepur', 'agarapara', 'kamarkhati', 'noapara'],
  },
]

/** Distinct line colours — the legend shows one swatch per colour. */
export const metroNetColors = [...new Set(metroNetLines.map((l) => l.color))]

/** Attribution line for the UI — required by ODbL for the vendored core geometry. */
export const METRO_NET_ATTRIBUTION = 'Core geometry © OpenStreetMap contributors (ODbL); extensions per the official Kolkata Metro map'
