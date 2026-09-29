// ─── Maya's brain (demo) ────────────────────────────────────────────────────
// Retrieval-only: every answer is grounded in the local dataset (doc §42).
// No LLM call, no invented facts. When data is missing, Maya says so.
// A real implementation swaps `answer()` for an LLM call with the same
// retrieved-context contract.
import { pandals, restaurants, safetyPoints } from '../data/demo'
import type { Place } from '../data/types'

export interface MayaReply {
  text: string
  textBn?: string
  chips?: string[]
  audio?: boolean // render the inline player row like the mockup
}

const NO_DATA: MayaReply = {
  text: "I don't have verified information about that yet.",
  textBn: 'এই মুহূর্তে আমি সেই বিষয়ে যাচাই করা তথ্য দিতে পারছি না।',
}

export function answer(qRaw: string, ctx?: Place | null): MayaReply {
  const q = qRaw.toLowerCase()
  const has = (...keys: string[]) => keys.some((k) => q.includes(k))

  // About the current-context pandal
  if (ctx && ctx.type === 'pandal' && has('theme', 'special', 'story', 'meaning', 'what is', 'এই প্যান্ডেল')) {
    return {
      text: `${ctx.name} — "${ctx.theme}". ${ctx.story ?? ''}`.trim(),
      textBn: ctx.storyBn ? `${ctx.name} — ${ctx.theme}. ${ctx.storyBn}` : undefined,
      audio: true,
      chips: ['More about the artist', 'Nearest Metro?'],
    }
  }
  if (ctx && has('artist', 'who made', 'carpet', 'design')) {
    return ctx.artist
      ? { text: `This year's artwork at ${ctx.name} is by ${ctx.artist}.`, audio: true, chips: ['What is the theme?', 'Where can I eat nearby?'] }
      : { ...NO_DATA, chips: ['What is the theme?'] }
  }
  if (has('metro')) {
    const m = ctx?.metro ?? pandals.find((p) => p.metro)?.metro
    return m
      ? { text: `The nearest metro option shown for ${ctx?.name ?? 'this area'} is ${m}. Distances are approximate — follow the signed route from the pandal exit.`, chips: ['Medical Camp?', 'Where can I eat nearby?'] }
      : NO_DATA
  }
  if (has('hospital', 'medical', 'doctor', 'ambulance')) {
    const med = safetyPoints.find((s) => s.kind === 'medical')
    return med
      ? { text: `${med.detail} is about ${med.distanceM} m away. For emergencies, call 112 or open the Safety Center.`, chips: ['Open Safety Center'] }
      : NO_DATA
  }
  if (has('eat', 'food', 'restaurant', 'dinner', 'lunch')) {
    const near = [...restaurants].sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 3)
    return {
      text: `Nearby options: ${near.map((r) => `${r.name} (${r.cuisine}, ${r.distanceKm} km)`).join('; ')}.`,
      chips: near.length ? ['Add dinner to my plan'] : undefined,
    }
  }
  if (has('crowd', 'busy', 'less crowded')) {
    const quiet = [...pandals].filter((p) => p.crowd).sort((a, b) => (a.crowd === 'low' ? -1 : 1) - (b.crowd === 'low' ? -1 : 1))
    return { text: `Based on recorded demo levels: ${quiet.slice(0, 3).map((p) => `${p.name} (${p.crowd} crowd)`).join(', ')}.`, audio: true }
  }
  if (has('plan', 'evening', 'itinerary', 'route')) {
    return {
      text: 'Here is a suggestion for your evening: Deshapriya Park (6:00 PM) → Mudiali Club (7:15 PM) → dinner at Oh! Calcutta (8:30 PM) → Suruchi Sangha (10:00 PM). Suggestions only — travel times may vary.',
      chips: ['Open Puja Planner'],
    }
  }
  if (has('next', 'after this', 'visit')) {
    const same = ctx
      ? pandals.filter((p) => p.id !== ctx.id && p.area === ctx.area).slice(0, 2)
      : pandals.slice(0, 2)
    return same.length
      ? { text: `Close by, you could also visit ${same.map((s) => s.name).join(' and ')}.`, chips: ['Where can I eat nearby?'] }
      : NO_DATA
  }
  if (has('past', 'previous', 'history', 'evolution')) {
    return ctx?.pastEditions?.length
      ? { text: `Past editions of ${ctx.name}: ${ctx.pastEditions.map((e) => `${e.year} — ${e.theme}`).join('; ')}.`, audio: true }
      : NO_DATA
  }
  return NO_DATA
}

/** Simulated camera match — picks the dataset pandal whose area is closest.
 *  Clearly demo: no real visual embedding is performed in v1. */
export function identifyDemo(): Place {
  const pool = pandals
  return pool[Math.floor(Math.random() * Math.min(4, pool.length))]
}
