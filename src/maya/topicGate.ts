// ─── Maya's off-topic gate ───────────────────────────────────────────────────
// Extracted from brain.ts: the gate is a self-contained classifier over the
// raw query, independent of the dataset-grounded answer engine. Curated
// conservatively. A question is off-topic only when it clearly matches an
// inappropriate/out-of-scope pattern AND carries no Puja/Kolkata anchor — which
// avoids false positives on legitimate queries like "which pandal is near a
// cricket ground".

import type { MayaReply } from './brain'

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
