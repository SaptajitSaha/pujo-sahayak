// ─── Kolkata Metro network geometry (real, static) ──────────────────────────
// The operational metro network as a spatial graph, used only by the animated
// network map on the Metro guide. Coordinates and station order are REAL —
// extracted from OpenStreetMap (Kolkata subway route relations + station nodes,
// the community map of the state-run Kolkata Metro / Metro Railway lines).
//
// Source & licence: © OpenStreetMap contributors, ODbL (data.openstreetmap.org).
// Query: Overpass API, route=subway relations + member station nodes within the
// Kolkata bounding box. Fetched at build time and vendored here so the map
// renders fully OFFLINE inside the APK — the app never calls Overpass at runtime.
//
// HONESTY: positions are true but this is still a *schematic* rendering (a
// straight-segment diagram, not satellite-accurate track geometry), and stations
// shared between lines are merged to one interchange node. It is a reference map,
// not a survey; the page captions it and asks riders to verify with the official
// Kolkata Metro network map. No live service status is implied.

/** A physical station. Shared stations (e.g. Esplanade) appear ONCE; multiple
    lines list the same id, which the layout reads as an interchange. */
export interface MetroNetStation { id: string; name: string; lat: number; lng: number }

/** One metro line: ordered station ids (travel order, one direction). */
export interface MetroNetLine { id: string; name: string; short: string; color: string; stationIds: string[] }

export const metroNetStations: MetroNetStation[] = [
  // ── Blue Line (Line 1) — Kavi Subhash ↔ Dakshineshwar (north–south spine) ──
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
  { id: 'noapara', name: 'Noapara', lat: 22.63996, lng: 88.39414 }, // shared with Yellow
  { id: 'baranagar', name: 'Baranagar', lat: 22.65307, lng: 88.38067 },
  { id: 'dakshineshwar', name: 'Dakshineshwar', lat: 22.65402, lng: 88.36376 },

  // ── Green Line (Line 3 / East–West) — Howrah Maidan ↔ Salt Lake Sector V ──
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
  { id: 'salt-lake-sector-v', name: 'Salt Lake Sector V', lat: 22.58094, lng: 88.42902 },

  // ── Purple Line (Line 2) — Majerhat ↔ Joka ──
  { id: 'majerhat', name: 'Majerhat', lat: 22.51906, lng: 88.32366 },
  { id: 'taratala', name: 'Taratala', lat: 22.50770, lng: 88.32035 },
  { id: 'behala-bazar', name: 'Behala Bazar', lat: 22.49880, lng: 88.31736 },
  { id: 'behala-chowrasta', name: 'Behala Chowrasta', lat: 22.48740, lng: 88.31334 },
  { id: 'sakher-bazar', name: 'Sakher Bazar', lat: 22.47489, lng: 88.30994 },
  { id: 'thakurpukur', name: 'Thakurpukur', lat: 22.46441, lng: 88.30753 },
  { id: 'joka', name: 'Joka', lat: 22.45237, lng: 88.30185 },

  // ── Orange Line (Line 4) — Beleghata ↔ Kavi Subhash ──
  { id: 'beleghata', name: 'Beleghata', lat: 22.55068, lng: 88.40401 },
  { id: 'barun-sengupta', name: 'Barun Sengupta', lat: 22.54380, lng: 88.39930 },
  { id: 'ritwik-ghatak', name: 'Ritwik Ghatak', lat: 22.53299, lng: 88.39646 },
  { id: 'vip-bazar', name: 'VIP Bazar', lat: 22.52470, lng: 88.39627 },
  { id: 'hemanta-mukhopadhyay', name: 'Hemanta Mukhopadhyay', lat: 22.51486, lng: 88.40146 },
  { id: 'kavi-sukanta', name: 'Kavi Sukanta', lat: 22.50530, lng: 88.40103 },
  { id: 'jyotirindra-nandi', name: 'Jyotirindra Nandi', lat: 22.49561, lng: 88.39848 },
  { id: 'satyajit-roy', name: 'Satyajit Roy', lat: 22.48466, lng: 88.39268 },
  // (kavi-subhash shared with Blue)

  // ── Yellow Line (Line 1 northern spur) — Jai Hind ↔ Noapara ──
  { id: 'jai-hind', name: 'Jai Hind', lat: 22.64730, lng: 88.43733 },
  { id: 'jessore-road', name: 'Jessore Road', lat: 22.63924, lng: 88.42979 },
  { id: 'dum-dum-cantonment', name: 'Dum Dum Cantonment', lat: 22.63759, lng: 88.41219 },
  // (noapara shared with Blue)
]

// Display colours are chosen for contrast on both light and dark chrome, not
// copied verbatim from the raw OSM tags (some were unusable, e.g. pure #FFFF00).
export const metroNetLines: MetroNetLine[] = [
  {
    id: 'blue', name: 'Blue Line · Line 1', short: 'Line 1', color: '#2563EB',
    stationIds: ['kavi-subhash', 'shahid-khudiram', 'kavi-nazrul', 'gitanjali', 'masterda-surya-sen', 'netaji', 'mahanayak-uttam-kumar', 'rabindra-sarobar', 'kalighat', 'jatin-das-park', 'netaji-bhavan', 'rabindra-sadan', 'maidan', 'park-street', 'esplanade', 'chandni-chowk', 'central', 'mahatma-gandhi-road', 'girish-park', 'shobhabazar-sutanuti', 'shyambazar', 'belgachia', 'dum-dum', 'noapara', 'baranagar', 'dakshineshwar'],
  },
  {
    id: 'green', name: 'Green Line · Line 3', short: 'Line 3', color: '#16A34A',
    stationIds: ['howrah-maidan', 'howrah', 'mahakaran', 'esplanade', 'sealdah', 'phoolbagan', 'salt-lake-stadium', 'bengal-chemical', 'city-centre', 'central-park', 'karunamoyee', 'salt-lake-sector-v'],
  },
  {
    id: 'purple', name: 'Purple Line · Line 2', short: 'Line 2', color: '#7C3AED',
    stationIds: ['majerhat', 'taratala', 'behala-bazar', 'behala-chowrasta', 'sakher-bazar', 'thakurpukur', 'joka'],
  },
  {
    id: 'orange', name: 'Orange Line · Line 4', short: 'Line 4', color: '#EA580C',
    stationIds: ['beleghata', 'barun-sengupta', 'ritwik-ghatak', 'vip-bazar', 'hemanta-mukhopadhyay', 'kavi-sukanta', 'jyotirindra-nandi', 'satyajit-roy', 'kavi-subhash'],
  },
  {
    id: 'yellow', name: 'Yellow Line', short: 'Yellow', color: '#B45309',
    stationIds: ['jai-hind', 'jessore-road', 'dum-dum-cantonment', 'noapara'],
  },
]

/** Attribution line for the UI — required by ODbL for the vendored geometry. */
export const METRO_NET_ATTRIBUTION = 'Network shape © OpenStreetMap contributors (ODbL)'
