// ─── Kolkata Metro network — SCHEMATIC layout (matches the official map) ─────
// The full network — operational + sanctioned — as a stylised diagram, used only
// by the animated network map on the Metro guide's subpage.
//
// THIS IS A SCHEMATIC, NOT A GEOGRAPHIC MAP. Each station carries an author-chosen
// (x, y) in an abstract, north-up / east-right grid, laid out by hand to reproduce
// the SHAPE of the official Kolkata Metro network map: the Blue line as a tall
// spine with a south-east diagonal, the Pink line running vertically up the west,
// the Green line crossing east–west, the Purple line down the south-west, the
// Orange line up the east and looping through New Town, and the Yellow airport
// line arcing out to Barasat in the north-east. Distances are NOT to scale and
// positions are NOT real coordinates — the topology (which stations, in what
// order, which interchanges) is what is faithful, transcribed from the official
// map and the OpenStreetMap station set (© OpenStreetMap contributors, ODbL).
//
// HONESTY: the page captions this as a schematic and asks riders to verify with
// the official Kolkata Metro map. Under-construction stations may not be open.
// No live service status is implied.

/** A station on the schematic. `x`/`y` are diagram-grid units (larger y = south).
    Shared stations (e.g. Esplanade) appear ONCE; multiple lines list the same id,
    which the layout reads as an interchange. */
export interface MetroNetStation { id: string; name: string; x: number; y: number }

/** One metro line (or branch): ordered station ids (travel order, one direction).
    Branches of the same coloured line are separate entries sharing a `color`. */
export interface MetroNetLine { id: string; name: string; short: string; color: string; stationIds: string[] }

export const metroNetStations: MetroNetStation[] = [
  // ── Blue Line (Line 1) — the tall central spine: south-east diagonal up to
  //    Noapara, then a short north-west spur to Dakshineshwar ──
  { id: 'kavi-subhash', name: 'Kavi Subhash', x: 470, y: 785 }, // interchange with Orange
  { id: 'shahid-khudiram', name: 'Shahid Khudiram', x: 445, y: 808 },
  { id: 'kavi-nazrul', name: 'Kavi Nazrul', x: 410, y: 795 },
  { id: 'gitanjali', name: 'Gitanjali', x: 378, y: 780 },
  { id: 'masterda-surya-sen', name: 'Masterda Surya Sen', x: 345, y: 762 },
  { id: 'netaji', name: 'Netaji', x: 315, y: 742 },
  { id: 'mahanayak-uttam-kumar', name: 'Mahanayak Uttam Kumar', x: 292, y: 718 },
  { id: 'rabindra-sarobar', name: 'Rabindra Sarobar', x: 280, y: 690 },
  { id: 'kalighat', name: 'Kalighat', x: 274, y: 662 },
  { id: 'jatin-das-park', name: 'Jatin Das Park', x: 270, y: 634 },
  { id: 'netaji-bhavan', name: 'Netaji Bhavan', x: 266, y: 606 },
  { id: 'rabindra-sadan', name: 'Rabindra Sadan', x: 262, y: 578 },
  { id: 'maidan', name: 'Maidan', x: 258, y: 552 },
  { id: 'park-street', name: 'Park Street', x: 254, y: 536 },
  { id: 'esplanade', name: 'Esplanade', x: 250, y: 522 }, // interchange with Green
  { id: 'chandni-chowk', name: 'Chandni Chowk', x: 252, y: 502 },
  { id: 'central', name: 'Central', x: 258, y: 484 },
  { id: 'mahatma-gandhi-road', name: 'Mahatma Gandhi Road', x: 268, y: 466 },
  { id: 'girish-park', name: 'Girish Park', x: 282, y: 450 },
  { id: 'shobhabazar-sutanuti', name: 'Shobhabazar Sutanuti', x: 298, y: 432 },
  { id: 'shyambazar', name: 'Shyambazar', x: 312, y: 410 },
  { id: 'belgachia', name: 'Belgachia', x: 322, y: 385 },
  { id: 'dum-dum', name: 'Dum Dum', x: 328, y: 355 },
  { id: 'noapara', name: 'Noapara', x: 330, y: 300 }, // interchange with Pink + Yellow
  { id: 'baranagar', name: 'Baranagar', x: 295, y: 278 },
  { id: 'dakshineshwar', name: 'Dakshineshwar', x: 250, y: 262 },

  // ── Pink Line — Barrackpore ↔ Noapara, a straight vertical column up the west ──
  { id: 'barrackpore', name: 'Barrackpore', x: 200, y: 40 },
  { id: 'talpukur', name: 'Talpukur', x: 200, y: 75 },
  { id: 'titagarh', name: 'Titagarh', x: 200, y: 110 },
  { id: 'tata-gate', name: 'Tata Gate', x: 200, y: 145 },
  { id: 'khardaha', name: 'Khardaha', x: 200, y: 180 },
  { id: 'subhash-nagar', name: 'Subhash Nagar', x: 200, y: 215 },
  { id: 'panihati', name: 'Panihati', x: 200, y: 250 },
  { id: 'sodepur', name: 'Sodepur', x: 200, y: 285 },
  { id: 'agarapara', name: 'Agarapara', x: 202, y: 320 },
  { id: 'kamarkhati', name: 'Kamarkhati', x: 208, y: 352 },
  // (noapara shared with Blue)

  // ── Yellow Line (Airport) — Noapara east then arcing north to Barasat ──
  // (noapara shared with Blue)
  { id: 'dum-dum-road', name: 'Dum Dum Road', x: 372, y: 285 },
  { id: 'jessore-road', name: 'Jessore Road', x: 415, y: 275 },
  { id: 'biman-bandar', name: 'Biman Bandar', x: 470, y: 285 }, // interchange with Orange
  { id: 'birati', name: 'Birati', x: 492, y: 250 },
  { id: 'madhyamgram', name: 'Madhyamgram', x: 508, y: 215 },
  { id: 'new-barrackpore', name: 'New Barrackpore', x: 528, y: 182 },
  { id: 'michael-nagar', name: 'Michael Nagar', x: 555, y: 158 },
  { id: 'hridaypur', name: 'Hridaypur', x: 585, y: 138 },
  { id: 'barasat', name: 'Barasat', x: 612, y: 120 },

  // ── Green Line (Line 3 / East–West) — Howrah Maidan across to Esplanade, then
  //    east through Salt Lake and up to Raghunathpur ──
  { id: 'howrah-maidan', name: 'Howrah Maidan', x: 55, y: 505 },
  { id: 'howrah', name: 'Howrah', x: 98, y: 505 },
  { id: 'mahakaran', name: 'Mahakaran', x: 155, y: 512 },
  // (esplanade shared with Blue)
  { id: 'sealdah', name: 'Sealdah', x: 300, y: 528 },
  { id: 'phoolbagan', name: 'Phoolbagan', x: 348, y: 520 },
  { id: 'salt-lake-stadium', name: 'Salt Lake Stadium', x: 392, y: 505 },
  { id: 'bengal-chemical', name: 'Bengal Chemical', x: 428, y: 482 },
  { id: 'city-centre', name: 'City Centre', x: 452, y: 456 },
  { id: 'central-park', name: 'Central Park', x: 470, y: 430 },
  { id: 'karunamoyee', name: 'Karunamoyee', x: 495, y: 452 },
  { id: 'nicco-park', name: 'Nicco Park', x: 512, y: 478 },
  { id: 'salt-lake-sector-v', name: 'Salt Lake Sector V', x: 520, y: 505 }, // interchange with Orange
  { id: 'baguiati', name: 'Baguiati', x: 500, y: 410 },
  { id: 'keshutpur', name: 'Keshutpur', x: 470, y: 398 },
  { id: 'dum-park', name: 'Dum Park', x: 440, y: 392 },
  { id: 'raghunathpur', name: 'Raghunathpur', x: 412, y: 388 },

  // ── Orange Line (Line 2/4) — Kavi Subhash up the east, then the New Town loop
  //    on the right, closing at Biman Bandar ──
  // (kavi-subhash shared with Blue)
  { id: 'satyajit-roy', name: 'Satyajit Roy', x: 452, y: 750 },
  { id: 'jyotirindra-nandi', name: 'Jyotirindra Nandi', x: 438, y: 715 },
  { id: 'kavi-sukanta', name: 'Kavi Sukanta', x: 430, y: 680 },
  { id: 'hemanta-mukhopadhyay', name: 'Hemanta Mukhopadhyay', x: 428, y: 645 },
  { id: 'vip-bazar', name: 'VIP Bazar', x: 432, y: 612 },
  { id: 'ritwik-ghatak', name: 'Ritwik Ghatak', x: 440, y: 580 },
  { id: 'barun-sengupta', name: 'Barun Sengupta', x: 448, y: 550 },
  { id: 'beleghata', name: 'Beleghata', x: 452, y: 528 },
  { id: 'gour-kishor-ghosh', name: 'Gour Kishor Ghosh', x: 470, y: 516 },
  // (salt-lake-sector-v shared with Green)
  { id: 'technopolis', name: 'Technopolis', x: 556, y: 505 },
  { id: 'bidhan-nagar', name: 'Bidhan Nagar', x: 590, y: 500 },
  { id: 'sub-cbd-1', name: 'Sub CBD 1', x: 622, y: 490 },
  { id: 'cbd-1', name: 'CBD 1', x: 650, y: 472 },
  { id: 'kalakshetra', name: 'Kalakshetra', x: 668, y: 445 },
  { id: 'new-town', name: 'New Town', x: 676, y: 415 },
  { id: 'convention-centre', name: 'Convention Centre', x: 666, y: 385 },
  { id: 'sub-cbd-2', name: 'Sub CBD 2', x: 640, y: 360 },
  { id: 'titumir', name: 'Titumir', x: 600, y: 342 },
  // (biman-bandar shared with Yellow)

  // ── Purple Line (Line 2) — Victoria down the south-west to Joka, with the
  //    Diamond Park branch off Thakurpukur ──
  { id: 'victoria', name: 'Victoria', x: 150, y: 555 },
  { id: 'kidderpore', name: 'Kidderpore', x: 140, y: 585 },
  { id: 'mominpur', name: 'Mominpur', x: 130, y: 618 },
  { id: 'majerhat', name: 'Majerhat', x: 125, y: 650 },
  { id: 'taratala', name: 'Taratala', x: 122, y: 682 },
  { id: 'behala-bazar', name: 'Behala Bazar', x: 122, y: 712 },
  { id: 'behala-chowrasta', name: 'Behala Chowrasta', x: 125, y: 742 },
  { id: 'sakher-bazar', name: 'Sakher Bazar', x: 130, y: 770 },
  { id: 'thakurpukur', name: 'Thakurpukur', x: 138, y: 798 }, // junction with south branch
  { id: 'joka', name: 'Joka', x: 150, y: 828 },
  // (thakurpukur shared with the branch)
  { id: 'iim', name: 'IIM', x: 185, y: 840 },
  { id: 'diamond-park', name: 'Diamond Park', x: 222, y: 845 },
]

// Display colours are chosen for contrast on both light and dark chrome.
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
    id: 'orange', name: 'Orange Line · Line 4', short: 'Line 4', color: '#EA580C',
    stationIds: ['kavi-subhash', 'satyajit-roy', 'jyotirindra-nandi', 'kavi-sukanta', 'hemanta-mukhopadhyay', 'vip-bazar', 'ritwik-ghatak', 'barun-sengupta', 'beleghata', 'gour-kishor-ghosh', 'salt-lake-sector-v', 'technopolis', 'bidhan-nagar', 'sub-cbd-1', 'cbd-1', 'kalakshetra', 'new-town', 'convention-centre', 'sub-cbd-2', 'titumir', 'biman-bandar'],
  },
  {
    id: 'yellow', name: 'Yellow Line · Airport', short: 'Airport', color: '#B45309',
    stationIds: ['noapara', 'dum-dum-road', 'jessore-road', 'biman-bandar', 'birati', 'madhyamgram', 'new-barrackpore', 'michael-nagar', 'hridaypur', 'barasat'],
  },
  {
    id: 'pink', name: 'Pink Line', short: 'Pink', color: '#DB2777',
    stationIds: ['barrackpore', 'talpukur', 'titagarh', 'tata-gate', 'khardaha', 'subhash-nagar', 'panihati', 'sodepur', 'agarapara', 'kamarkhati', 'noapara'],
  },
]

/** Distinct line colours — the legend shows one swatch per colour. */
export const metroNetColors = [...new Set(metroNetLines.map((l) => l.color))]

/** Attribution line for the UI — the station set/topology draws on OSM + the
    official map; positions here are schematic, not surveyed. */
export const METRO_NET_ATTRIBUTION = 'Schematic layout after the official Kolkata Metro map; station set per OpenStreetMap contributors (ODbL)'
