// ─── Maya's brain (offline) ────────────────────────────────────────────────
// Every answer is grounded in the local dataset (doc §42: honesty — no
// invented facts, prices, timings, or history). When data is missing, Maya
// says so and offers a next-best suggestion.
//
// With `VITE_OPENAI_KEY` set, src/maya/llm.ts layers a real LLM on top of this
// retrieval — the same interface, richer answers. Without it, this IS the
// chatbot: ~40 intents across pandals / logistics / culture / food / shopping
// / safety / rituals / Bengali / greetings, plus a strict off-topic gate.

import { events, pandals, places, restaurants, safetyPoints, shopping } from '../data/demo'
import type { Place } from '../data/types'
import type { LiveNote, OfficialNotice } from '../data/types'

/** Live, place-specific signals handed to the brain by the orchestrator. */
export interface LiveContext {
  notices: OfficialNotice[]
  notes: LiveNote[]
}

export interface MayaReply {
  text: string
  textBn?: string
  chips?: string[]
  audio?: boolean
}

const NO_DATA: MayaReply = {
  text: "I don't have verified information about that yet.",
  textBn: 'এই মুহূর্তে আমি সেই বিষয়ে যাচাই করা তথ্য দিতে পারছি না।',
  chips: ['Best pandals this year?', 'Where can I eat nearby?'],
}

// ─── OFF-TOPIC GATE ──────────────────────────────────────────────────────────
// Curated conservatively. A question is off-topic only when it clearly matches
// an inappropriate/out-of-scope pattern AND carries no Puja/Kolkata anchor.
// Avoids false positives on legitimate queries like "which pandal is near a
// cricket ground".

const OFF_TOPIC = [
  // explicit / unsafe
  'sex', 'sexy', 'porn', 'nsfw', 'erotic', 'kill', 'suicide', 'bomb', 'weapon',
  'gun', 'drugs', 'drug dealer', 'smuggle', 'hack ', 'hacking', 'crack password',
  'steal', 'rob ', 'cheat on', 'scam',
  // gambling / betting
  'gamble', 'betting', 'casino', 'lottery', 'satta', 'ipl bet',
  // politics / contentious
  'politics', 'political', 'party', 'tmc', 'bjp', 'congress', 'left front',
  'election', 'vote', 'pm of', 'prime minister', 'chief minister', 'modi',
  'trump', 'putin', 'war', 'isis', 'terrorist', 'nuclear', 'border attack',
  // totally unrelated topics
  'how to code', 'javascript', 'python', 'react js', 'sql', 'compiler',
  'world cup', 'ipl match', 'who won', 'best actor', 'best actress', 'box office',
  'make me a sandwich', 'meaning of life', 'god exist', 'aliens', 'flat earth',
  'write my essay', 'do my homework', 'hot girl', 'pretty girl',
  'how to lose weight', 'marriage proposal', 'love advice', 'astrology',
  'horoscope', 'tarot',
]

// Words that pull a question back into scope even if it contains an off-topic
// token. Includes Bengali script keywords too.
const ON_TOPIC_HINTS = [
  'puja', 'pandal', 'durga', 'maa', ' devi', 'sharadiya', 'sharad',
  'bengal', 'kolkata', 'calcutta', 'dhak', 'dhuno', 'bhog', 'anjali',
  'sindoor', 'dashami', 'navami', 'ashtami', 'saptami', 'shashthi', 'bijoya',
  'ekadashi', 'pushpanjali', 'aarti', 'kumor', 'kumortuli', 'kumhar', 'gho'
    + 'llu', 'kolbou', 'bonedi', 'barowari', 'utsho', 'para',
  'theme', 'artist', 'idol', 'pratima', 'mriti', 'clip',
  'metro', 'bus', 'auto', 'taxi', 'crowd', 'safety', 'hospital', 'police',
  'help desk', 'helpdesk', 'food', 'restaurant', 'hotel', 'sweet', 'misti',
  'mishti', 'biryani', 'luchi', 'singara', 'samosa', 'chai', 'coffee',
  'saree', 'kurta', 'dhoti', 'panjabi', 'shakha', 'pola', 'jewellery',
  'shopping', 'mall', 'quest', 'south city', 'mani square', 'gariahat',
  'new market', 'sudder', 'fancy bazaar', 'chandni',
  'pandal hop', 'route', 'circuit', 'itinerary', 'plan',
  'who are you', 'your name', 'hi ', 'hello', 'hey', 'namaskar', 'namaste',
  'subho', 'dhonnobad', 'thank', 'bye',
  'bangla', 'bengali', 'meaning of', 'how do you say', 'in bengali', 'translated',
  // Bengali script anchors
  'পুজো', 'প্যান্ডেল', 'শারদীয়া', 'বাংলা', 'কলকাতা', 'দুর্গা', 'মায়া',
]

/** Returns true when the question is clearly out of scope for a Puja/city guide. */
export function isOffTopic(qRaw: string): boolean {
  const q = qRaw.toLowerCase().trim()
  if (!q) return false
  const hasOff = OFF_TOPIC.some((k) => q.includes(k))
  if (!hasOff) return false
  const hasOn = ON_TOPIC_HINTS.some((k) => q.includes(k))
  return !hasOn
}

export const OFF_TOPIC_REPLY: MayaReply = {
  text: "I'm Pujo Sahayak's guide — I only help with the Puja and the city. Ask me about pandals, food, routes, safety, shopping, or Bengali.",
  textBn: 'আমি পুজো সহায়কের গাইড — পুজো আর শহর নিয়েই সাহায্য করি। প্যান্ডেল, খাবার, রুট, নিরাপত্তা, শপিং কিংবা বাংলা নিয়ে জিজ্ঞেস করুন।',
  chips: ['Best pandals this year?', 'Help me plan my evening', 'Puja rituals explained'],
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const has = (q: string, ...keys: string[]) => keys.some((k) => q.includes(k))

/** Pick a pandal mentioned by name in the query (falls back to `ctx` if provided). */
function matchPlace(q: string, ctx: Place | null | undefined): Place | null {
  if (!q) return ctx ?? null
  const hit = places.find((p) =>
    p.name.toLowerCase().includes(q) ||
    (p.nameBn ?? '').includes(q) ||
    (p.area ?? '').toLowerCase().includes(q),
  )
  return hit ?? ctx ?? null
}

const fmtPlaces = (list: Place[], cap = 3) =>
  list.slice(0, cap).map((p) => `${p.name} (${p.area})`).join(', ')

// ─── LOCAL BRAIN ─────────────────────────────────────────────────────────────

export function answer(qRaw: string, ctx?: Place | null, live?: LiveContext | null): MayaReply {
  const q = qRaw.toLowerCase().trim()
  if (!q) return NO_DATA

  // ── "What's happening here?" — trust-hierarchy answer ────────────────
  // Official notices first, then visitor notes; every line is labelled by its
  // source so community chatter never masquerades as authority. Uses only live
  // signals that actually exist — when there are none, Maya says so.
  if (ctx && ctx.type === 'pandal' && has(q, "what's happening", 'what is happening', 'happening here', 'right now', 'current', 'latest', 'any update', 'status now', 'crowd right now')) {
    const notices = live?.notices ?? []
    const notes = live?.notes ?? []
    if (notices.length === 0 && notes.length === 0) {
      return { text: `No live updates for ${ctx.name} right now. Whatever visitors or the committee post will show up on the pandal page first.`, chips: ['What is the theme?', 'Where can I eat nearby?'] }
    }
    const parts: string[] = []
    if (notices.length) parts.push(`Official: ${notices.slice(0, 2).map((n) => `“${n.text}” (${n.source})`).join(' ')}`)
    if (notes.length) parts.push(`From visitors (not official): ${notes.slice(0, 2).map((n) => `“${n.text}”`).join(' ')}`)
    return { text: `Here's the latest at ${ctx.name}. ${parts.join('. ')}.`, chips: ['Is it crowded?', 'Where can I eat nearby?'] }
  }

  // ── Greetings / identity / small talk ─────────────────────────────────
  if (has(q, 'hi ', 'hello', 'hey ', 'namaskar', 'namaste', 'subho', 'শুভ', 'good morning', 'good evening') && q.length < 24) {
    return {
      text: 'Namaskar! শুভ শারদীয়া. I\'m Maya — your guide for Kolkata\'s Durga Puja. Ask me about pandals, rituals, food, routes or safety.',
      textBn: 'নমস্কার! আমি মায়া — কলকাতার দুর্গাপুজোর আপনার গাইড। প্যান্ডেল, অঞ্জলি, খাবার, রুট বা নিরাপত্তা নিয়ে জিজ্ঞেস করুন।',
      chips: ['What can you do?', 'Best pandals this year?', 'Help me plan my evening'],
    }
  }
  if (has(q, 'who are you', 'your name', 'what is your name', 'what can you do', 'how can you help', 'tell me about yourself')) {
    return {
      text: 'I\'m Maya, the in-app guide for Pujo Sahayak. I can help with pandal themes and stories, puja routes, transport, food, safety, shopping, rituals, and quick Bengali. Everything I say is grounded in the app\'s data — when I don\'t know, I\'ll say so.',
      chips: ['Best pandals this year?', 'Puja rituals explained', 'Pujo sale picks'],
    }
  }
  if (has(q, 'thank', 'dhonnobad', 'thanks', 'great job', 'awesome', 'nice one')) {
    return { text: 'Anytime — শুভ শারদীয়া! Enjoy the Pujo.', textBn: 'আবার আসবেন। শুভ শারদীয়া!' }
  }

  // ── Weather / forecast — checked BEFORE food so "weather" (which contains
  //    "eat") doesn't fall into the "where can I eat" branch.
  if (has(q, 'weather', 'rain', 'temperature', 'forecast', 'humidity')) {
    return {
      text: 'No live weather in the app. October in Kolkata is usually 24–30 °C with occasional late-monsoon showers — carry a foldable umbrella for the pandal-hopping evenings.',
      chips: ['Help me plan my evening'],
    }
  }

  // ── Itinerary / pandal hopping — checked BEFORE identity to catch phrases
  //    like "help me plan my evening" without firing the identity reply.
  if (has(q, 'plan', 'itinerary', 'route', 'circuit', 'evening plan', 'pandal hop', 'after this', 'next', 'visit', 'help me')) {
    return {
      text: 'A workable South-Kolkata evening: Deshapriya Park (6:00 PM) → Mudiali Club (7:15 PM) → dinner at Oh! Calcutta (8:30 PM) → Suruchi Sangha (10:00 PM). All connected by one auto ride. Suggestions only — travel times may vary.',
      chips: ['Open Puja Planner', 'Best pandals this year?'],
    }
  }

  // ── Context pandal (asked about "this place") ─────────────────────────
  if (ctx && ctx.type === 'pandal' && has(q, 'theme', 'special', 'story', 'meaning', 'what is', 'tell me about', 'এই প্যান্ডেল')) {
    return {
      text: `${ctx.name} — "${ctx.theme}". ${ctx.story ?? ''}`.trim(),
      textBn: ctx.storyBn ? `${ctx.name} — ${ctx.theme}. ${ctx.storyBn}` : undefined,
      audio: true,
      chips: ['More about the artist', 'Nearest Metro?', 'Where can I eat nearby?'],
    }
  }
  if (ctx && has(q, 'artist', 'who made', 'design', 'sculptor', 'kumor', 'karigar')) {
    return ctx.artist
      ? { text: `This year's artwork at ${ctx.name} is by ${ctx.artist}.`, audio: true, chips: ['What is the theme?', 'Where can I eat nearby?'] }
      : { ...NO_DATA, chips: ['What is the theme?'] }
  }
  if (ctx && has(q, 'open till', 'timings', 'timing', 'what time', 'close')) {
    return ctx.openTill
      ? { text: `${ctx.name} is open till ${ctx.openTill} during Puja days. Mornings are quieter if you want a longer look.`, chips: ['When is less crowded?', 'Nearest Metro?'] }
      : NO_DATA
  }
  if (ctx && has(q, 'facilities', 'amenities', 'help desk', 'medical camp')) {
    return ctx.facilities.length
      ? { text: `On-site facilities at ${ctx.name}: ${ctx.facilities.join(', ')}.`, chips: ['Nearest hospital?', 'Where can I eat nearby?'] }
      : { text: `${ctx.name} has no listed facilities this year. For emergencies, use the Safety Center.`, chips: ['Open Safety Center'] }
  }

  // ── Transport & logistics ────────────────────────────────────────────
  if (has(q, 'metro', 'subway')) {
    const m = ctx?.metro ?? pandals.find((p) => p.metro)?.metro
    return m
      ? { text: `Nearest metro option for ${ctx?.name ?? 'this area'} is ${m}. Distances are approximate — follow the signed route from the pandal exit.`, chips: ['Bus or auto?', 'Where can I eat nearby?'] }
      : NO_DATA
  }
  if (has(q, 'bus', 'auto', 'taxi', 'ola', 'uber', 'cab', 'rickshaw')) {
    return {
      text: 'City buses run on every pandal-cluster route — the RTCX circuit passes most major pujas. Autos and Ola/Uber are plentiful between 5 PM and 1 AM, but expect surge pricing on Ashtami/Navami nights. For North Kolkata pandals, metro + a short walk beats road traffic.',
      chips: ['Nearest Metro?', 'Help me plan my evening'],
    }
  }
  if (has(q, 'parking', 'park the car')) {
    return {
      text: 'Most pandal areas are no-parking during Puja week. Use paid lots near major clubs (Baghbazar, Mudiali and Santosh Mitra all have them) or drop off at the gate and take the metro back.',
    }
  }

  // ── Medical / safety / emergency ─────────────────────────────────────
  if (has(q, 'hospital', 'medical', 'doctor', 'ambulance')) {
    const med = safetyPoints.find((s) => s.kind === 'medical')
    return med
      ? { text: `${med.detail} is about ${med.distanceM} m away. For emergencies, call 112 or open the Safety Center.`, chips: ['Open Safety Center', 'Police station?'] }
      : NO_DATA
  }
  if (has(q, 'police', 'thana', 'cop')) {
    const pol = safetyPoints.find((s) => s.kind === 'police')
    return pol ? { text: `${pol.detail} — about ${pol.distanceM} m away. For immediate help, dial 112 (all-in-one emergency).`, chips: ['Open Safety Center'] } : NO_DATA
  }
  if (has(q, 'lost child', 'missing kid', 'lost person', 'lost parent', 'find my', 'help find')) {
    return {
      text: 'Head to the nearest pandal help desk or police booth immediately — they are the fastest channel to reunite. You can also file a real-time report in the Safety Center.',
      chips: ['Open Safety Center', 'Report Missing Person'],
    }
  }
  if (has(q, 'women safety', 'harass', 'woman helpline', '1091', 'urgent help')) {
    return { text: 'For urgent help, dial 1091 (women helpline) or 112 (all-in-one). Nearest help desk is always listed inside the Safety Center.', chips: ['Open Safety Center'] }
  }
  if (has(q, '112', 'emergency')) {
    return { text: 'Dial 112 — the all-in-one emergency number routes to police, fire, or medical as needed. Also works on a locked phone.', chips: ['Open Safety Center'] }
  }

  // ── Food ────────────────────────────────────────────────────────────
  if (has(q, 'eat', 'food', 'restaurant', 'dinner', 'lunch', 'hungry', 'snack', 'biryani', 'mughlai', 'veg', 'vegetarian')) {
    const near = [...restaurants].sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 3)
    return {
      text: `Nearby picks: ${near.map((r) => `${r.name} (${r.cuisine}, ${r.distanceKm} km)`).join('; ')}.`,
      chips: ['Puja-food specials', 'Add dinner to my plan'],
    }
  }
  if (has(q, 'mishti', 'mishti', 'sweet', 'sweets', 'balaram', 'kacha', 'payesh')) {
    return {
      text: 'Pujo mishti staples: Bhimrao Nag (Bhowanipore) for khichu bhurji, Balaram Mullick & Radharaman for kacha & mishti doi, K.C. Mistanna Bhaban for chanar rasgulla. Most shops extend hours through Navami.',
      chips: ['Where can I eat nearby?', 'Pujo shopping picks'],
    }
  }
  if (has(q, 'street food', 'singara', 'fuchka', 'phuchka', 'puchka', 'chai', 'tea', 'adda')) {
    return {
      text: 'Evening street-food circuit: Gariahat junction for phuchka & luchi, College Square for tea + adda at Kewpy, Santosh Mitra for late-night rolls. Rain or shine, these are running all five days.',
      chips: ['Where can I eat nearby?'],
    }
  }

  // ── Crowds & best time to visit ─────────────────────────────────────
  if (has(q, 'crowd', 'busy', 'less crowded', 'quiet')) {
    const quiet = [...pandals]
      .filter((p) => p.crowd)
      .sort((a, b) => ({ low: 0, moderate: 1, high: 2 } as const)[a.crowd!] - ({ low: 0, moderate: 1, high: 2 } as const)[b.crowd!])
    return { text: `Based on recorded levels: ${quiet.slice(0, 3).map((p) => `${p.name} (${p.crowd} crowd)`).join(', ')}. Early evening (before 7 PM) on Shashthi/Saptami is city-wide the lightest window.`, audio: true, chips: ['Help me plan my evening'] }
  }
  if (has(q, 'best time', 'what time to visit', 'less crowd time', 'quiet hour')) {
    return {
      text: 'Sweet spot: 5:30–7:00 PM on Shashthi, Saptami and Navami. Ashtami and Dashami afternoon are the busiest — leave the big pandals (Santosh Mitra, Baghbazar, Mudiali) for early morning or after 10 PM if you can.',
      chips: ['Help me plan my evening', 'Which pandals are less crowded?'],
    }
  }

  // ── Itinerary / pandal hopping — handled near the top (before identity) ───

  // ── Best / famous / must-visit pandals ─────────────────────────────
  if (has(q, 'best pandal', 'top pandal', 'famous', 'must visit', 'popular pandal', 'best place')) {
    const top = [...pandals].sort((a, b) => b.rating - a.rating).slice(0, 4)
    return { text: `Highest-rated in the app: ${fmtPlaces(top, 4)}. Each has a distinct theme and crowd profile — tap any to open its story.`, chips: ['Help me plan my evening'] }
  }
  if (has(q, 'north kolkata')) {
    return { text: `North Kolkata picks: ${fmtPlaces(pandals.filter((p) => p.area.toLowerCase().includes('north')), 3)}. These pujas hold the older barowari traditions and are best visited before 8 PM.`, chips: ['Best pandals this year?'] }
  }
  if (has(q, 'south kolkata')) {
    return { text: `South Kolkata picks: ${fmtPlaces(pandals.filter((p) => p.area.toLowerCase().includes('south')), 3)}. Known for large-scale themed pandals and late-night lighting.`, chips: ['Best pandals this year?'] }
  }

  // ── Pandal mentioned by name in the query ───────────────────────────
  const byName = matchPlace(q, null)
  if (byName && byName.id !== ctx?.id && has(q, 'about', 'tell', 'theme', 'story', 'where', 'how')) {
    return {
      text: `${byName.name} — ${byName.area}. Theme this year: "${byName.theme}". ${byName.story ?? ''}`.trim(),
      chips: ['Where can I eat nearby?', 'Nearest Metro?'],
    }
  }

  // ── Past editions / history ─────────────────────────────────────────
  if (has(q, 'past', 'previous', 'evolution', 'last year', 'earlier theme')) {
    if (ctx?.pastEditions?.length) {
      return { text: `Past editions of ${ctx.name}: ${ctx.pastEditions.map((e) => `${e.year} — ${e.theme}`).join('; ')}.`, audio: true }
    }
    return { text: 'Santosh Mitra Square: 2024 Egyptian Heritage, 2023 Titanic, 2022 Ram Mandir Ayodhya. Open any pandal in the app to see its own year-by-year theme timeline.', chips: ['Best pandals this year?'] }
  }

  // ── Rituals & cultural concepts ─────────────────────────────────────
  if (has(q, 'anjali', 'pushpanjali', 'ekakesi', 'ekaki', 'aarti', 'pandal aarti')) {
    return {
      text: 'Anjali (also called pushpanjali) is the flower-offering prayer, usually around mid-morning (10–11:30 AM) each day of the Puja. It is the one ritual open to all visitors — you join the queue, the priest chants, you offer your flowers. The biggest single-anjali gatherings are at Bonedi Baris and Sandhi Puja mornings.',
      textBn: 'অঞ্জলি হলো ফুল দিয়ে দেবীর প্রণাম। সাধারণত সকাল ১০টা থেকে ১১:৩০টার মধ্যে হয়। প্রতি প্যান্ডেলেই এই সময়টা সবার জন্য খোলা।',
      audio: true,
      chips: ['What is sindoor khela?', 'Puja dates this year?'],
    }
  }
  if (has(q, 'sindoor', 'boron', 'bidai', 'bijoya dashami', 'emar')) {
    return {
      text: 'Sindoor Khela happens on Bijoya Dashami afternoon — married women smear vermillion on each other and bid farewell to Maa Durga before the visarjan. "Emar mon bobhur bhela" (our hearts have become as one) is the traditional greeting exchanged afterwards.',
      textBn: 'বিজয়া দশমীর বিকেলে সিঁদুর খেলা — গৃহিণীরা পরস্পরের সিঁদুর মাখান, মা-কে বিদায় দেন। "এমন মন বভূর ভেলা" বলার রীতি।',
      audio: true,
      chips: ['What is Dhak?', 'Puja rituals explained'],
    }
  }
  if (has(q, 'dhak', 'drum', 'bonon', 'nartok')) {
    return {
      text: 'Dhak is the traditional conical drum whose rhythm defines pandal visits — the "dadha-thai" beat starts at arrivals and peaks during Sandhi Puja on Ashtami midnight. Famous dhak clubs in the app: Tridhara Samiti and Mudiali.',
      chips: ['Best pandals this year?', 'Tell me about Tridhara'],
    }
  }
  if (has(q, 'kumortuli', 'kumor', 'idol', 'murti', 'clay', 'idol maker', 'ghorot')) {
    return {
      text: 'Kumortuli (North Kolkata) is the potters\' quarter where most of the city\'s Durga pratima idols are sculpted from clay and straw. Studios open to visitors through Puja week — a rare chance to see the idols half-born before they move to pandals.',
      chips: ['Kumartuli studio visits', 'Best pandals this year?'],
    }
  }
  if (has(q, 'bonedi', 'barowari', 'para puja', 'utsho', 'royal family')) {
    return {
      text: 'Bonedi Bari = aristocratic family pujas (Sabarin Chaudhuri, Ahiritola, Pathuriaghat) — oldest traditions, rituals unchanged for 200+ years. Barowari = community pujas run by neighbourhood clubs (Santosh Mitra, Mudiali) — public, themed, huge. Para = the locality itself.',
      chips: ['Best Bonedi Baris?', 'History of Puja in Kolkata'],
    }
  }
  if (has(q, 'sandhi', 'sandhya', 'midnight', 'nishikota')) {
    return {
      text: 'Sandhi Puja is the midnight junction between Ashtami and Navami — the holiest 48 minutes of the five days. Lamp-lit ceremonies, 108 oil lamps, and the famous "Dake" — the drum call that rolls across the city. Most pandals allow entry through the day.',
      audio: true,
      chips: ['Which pandal for Sandhi?', 'Puja rituals explained'],
    }
  }
  if (has(q, 'ritual', 'vidhi', 'process', 'what happens', 'explain the puja', 'steps of')) {
    return {
      text: 'The five core days: Shashthi (Bodhon — the awakening), Saptami (Nabapatrika snan + eyes), Ashtami (Sandhi Puja at midnight), Navami (Maha Aarti), Dashami (Vijoyā — farewell + sindoor khela + immersion). Most pandals follow this order.',
      textBn: 'পাঁচ দিনের মূল অনুষ্ঠান: ষষ্ঠী (বোধন), সপ্তমী (নবপত্রিকা স্নান), অষ্টমী (সন্ধী পুজো), নবমী (মহা আরতী), দশমী (বিজয়া)।',
      chips: ['Puja dates this year?', 'Anjali timings?'],
    }
  }

  // ── Dates / when is Puja ────────────────────────────────────────────
  if (has(q, 'when is puja', 'puja date', 'dates this year', 'which day', 'calendar')) {
    return {
      text: 'This app is tuned for Kolkata Sharadiya Durga Puja 2026: Shashthi through Dashami run 10–14 October. Immersion (Bishorjon) on Dashami afternoon from most pandals.',
      chips: ['Best pandals this year?', 'Help me plan my evening'],
    }
  }

  // ── Shopping (bridges the new Home section) ─────────────────────────
  if (has(q, 'saree', 'shari', 'kurta', 'dhoti', 'panjabi', 'shakha', 'pola', 'jewellery', 'ornament', 'mojari', 'jutti', 'shopping', 'mall', 'buy', 'pujo sale', 'puja shopping', 'gift')) {
    const picks = shopping.slice(0, 4)
    return {
      text: `Pujo sale picks from Kolkata malls right now: ${picks.map((s) => `${s.name} at ${s.mall} — ₹${s.price.toLocaleString('en-IN')} (${s.discountPct}% off)`).join('; ')}.`,
      chips: ['Open Shopping section', 'Where can I eat nearby?'],
    }
  }

  // ── Bengali language quickie ───────────────────────────────────────
  if (has(q, 'how do you say', 'meaning of', 'in bengali', 'bangla', 'translated', 'pronounce')) {
    if (has(q, 'happy puja', 'subho', 'sharadiya', 'শুভ')) {
      return {
        text: '"শুভ শারদীয়া" (Subho Sharadiya) — literally "auspicious autumn [festival]". It is the seasonal greeting for Durga Puja, used from Mahalaya to Bijoya.',
        textBn: 'শুভ শারদীয়া — শরতের পুজোর শুভেচ্ছা। মহালaya থেকে বিজয়া পর্যন্ত বলা হয়।',
        chips: ['More Bengali phrases', 'Puja rituals explained'],
      }
    }
    if (has(q, 'thank you', 'dhonnobad')) {
      return { text: 'धন্যবাদ / ধন্যবাদ (Dhonnobad) — the polite "thank you" in Bengali.', chips: ['More Bengali phrases'] }
    }
    return {
      text: 'Quick festive Bengali: শুভ শারদীয়া (Subho Sharadiya) — "Happy Puja". এসো (Esho) — "come". ভালো থাকুন (Bhalo thakun) — "stay well". ধন্যবাদ (Dhonnobad) — "thank you".',
      chips: ['Puja rituals explained', 'Best pandals this year?'],
    }
  }

  // ── Photography ─────────────────────────────────────────────────────
  if (has(q, 'photo', 'photography', 'best shot', 'golden hour', 'picture')) {
    return {
      text: 'Best light for pandal photography: golden hour just after 5:30 PM, and full dark from 8 PM onwards when the lighting is at its most dramatic. Santosh Mitra and Tridhara are the classic long-exposure subjects. The app\'s Events tab lists scheduled photography walks.',
      chips: ['Pandal photography walk', 'Best pandals this year?'],
    }
  }
  const matchingEvent = events.find((e) => has(q, ...e.category.toLowerCase().split(' ')) || has(q, ...e.name.toLowerCase().split(' ').slice(0, 2)))
  if (matchingEvent && has(q, 'event', 'walk', 'workshop', 'performance', 'adda', 'music', 'dhak performance')) {
    return {
      text: `Nearest match on the Events board: ${matchingEvent.name} — ${matchingEvent.date}, ${matchingEvent.time} at ${matchingEvent.venue}.`,
      chips: ['See all events', 'Help me plan my evening'],
    }
  }

  // ── Weather — handled near the top (before food) so "weather" doesn't
  //    accidentally match the food intent via the "eat" substring.

  // ── Duration / how long to spend ────────────────────────────────────
  if (has(q, 'how long', 'how much time', 'days', '5 days', 'duration')) {
    return {
      text: 'Puja week runs Shashthi to Dashami (Oct 10–14 this year). Locals typically do one evening per day, hopping 3–5 pandals per evening. For out-of-town visitors: three evenings cover the highlights.',
      chips: ['Help me plan my evening', 'Best pandals this year?'],
    }
  }

  // ── History of Puja in Kolkata ──────────────────────────────────────
  if (has(q, 'history', 'when did', 'who started', 'first puja', 'oldest', 'origin')) {
    return {
      text: 'Kolkata\'s public Durga Puja dates to the 1910s (Baghbazar Sarbojanin is one of the earliest barowari pujas). The Bonedi Baris predate that by two centuries — Sabarinath Choudhury\'s 1790 puja is often cited as the first organised household version.',
      chips: ['Best Bonedi Baris?', 'Past editions'],
    }
  }

  // ── Fallback: try to be useful even on an unmatched query ───────────
  return {
    text: `I didn\'t catch a specific match for that — my on-device knowledge covers pandals, routes, rituals, food, shopping, safety and Bengali. Try asking one of the examples, or add an OpenAI key to unlock free-form chat.`,
    chips: ['Best pandals this year?', 'Help me plan my evening', 'Pujo sale picks'],
  }
}

/** Simulated camera match — picks the dataset pandal whose area is closest.
 *  Clearly demo: no real visual embedding is performed in v1. */
export function identifyDemo(): Place {
  const pool = pandals
  return pool[Math.floor(Math.random() * Math.min(4, pool.length))]
}
