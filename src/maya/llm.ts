// ─── Optional LLM layer over Maya's on-device brain ────────────────────────
// Same convention as the Google Maps pin picker: everything works offline
// without a key; drop a real key into `.env.local` to light up free-form chat.
//
// To enable:
//   1. Create a project at platform.openai.com → add billing.
//   2. Generate an API key → restrict to Chat Completions.
//   3. Copy .env.example → .env.local, set VITE_OPENAI_KEY (optionally
//      VITE_OPENAI_MODEL, defaults to gpt-4o-mini).
//   4. `npm run dev` picks it up. For the APK, rebuild after setting the key —
//      env vars are baked at build time (this is intentional: keys are NOT
//      bundled if unset, so a public APK never leaks one).
//
// The system prompt keeps Maya in-role: she answers anything Puja / Kolkata
// related, refuses off-topic or unsafe questions warmly, and stays grounded in
// the retrieved context so she never invents pandal names, prices, or timings.

import { pandals, restaurants, shopping } from '../data/demo'
import type { Place } from '../data/types'
import type { MayaReply } from './brain'

export interface ChatTurn {
  from: 'user' | 'maya'
  text: string
}

const SYSTEM_PROMPT = `You are Maya, the in-app guide for "Pujo Sahayak" — a Kolkata Durga Puja companion.

STRICT ROLE:
- Help with anything Durga Puja, pandals, Kolkata logistics, food, shopping, culture, rituals, routes, safety, and quick Bengali.
- If a question is clearly off-topic or unsafe (NSFW, violence, politics, gambling, hacking, coding, celebrity gossip, sports unrelated to Puja, homework, astrology), decline warmly IN-CHARACTER: "I'm Pujo Sahayak's guide — I only help with the Puja and the city." Do NOT lecture.
- Ground every factual claim in the [CONTEXT] block from the app's local dataset. If it's not in the context and you don't confidently know it, say you don't have verified info. NEVER fabricate pandal names, prices, timings, artist names, or historical dates.
- Keep answers under 90 words. Speak warmly. End with one suggested follow-up when helpful.
- Match the user's language (English / বাংলা / हिन्दी). Default to English when unclear.
- Return plain text only, no markdown, no bullet lists.`

function buildContext(ctx?: Place | null): string {
  const topPandals = pandals.slice(0, 6).map((p) => `- ${p.name} (${p.area}) — theme: ${p.theme}, artist: ${p.artist ?? 'n/a'}, metro: ${p.metro ?? 'n/a'}`).join('\n')
  const topFood = restaurants.slice(0, 4).map((r) => `- ${r.name} (${r.cuisine}, ${r.distanceKm} km)`).join('\n')
  const topShopping = shopping.slice(0, 5).map((s) => `- ${s.name} at ${s.mall} (${s.area}) — ₹${s.price} (was ₹${s.originalPrice})`).join('\n')
  const ctxLine = ctx ? `\n\nThe user is currently looking at: ${ctx.name} — ${ctx.area}. Theme: ${ctx.theme}. Story: ${ctx.story ?? 'n/a'}.` : ''
  return `TOP PANDALS:\n${topPandals}\n\nTOP NEARBY FOOD:\n${topFood}\n\nPUJO SALE PICKS:\n${topShopping}${ctxLine}`
}

const KEY = import.meta.env.VITE_OPENAI_KEY as string | undefined
const MODEL = (import.meta.env.VITE_OPENAI_MODEL as string | undefined) || 'gpt-4o-mini'

export const isLLMEnabled = (): boolean => !!KEY

/**
 * Call OpenAI Chat Completions. Returns null when the key is unset, the
 * network fails, or the response is malformed — the caller falls back to the
 * offline brain so Maya keeps working in every case.
 */
export async function askLLM(q: string, ctx: Place | null | undefined, history: ChatTurn[]): Promise<MayaReply | null> {
  if (!KEY) return null
  try {
    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: `${SYSTEM_PROMPT}\n\n[CONTEXT]\n${buildContext(ctx)}` },
    ]
    // Include the last 6 turns so Maya remembers the thread.
    for (const t of history.slice(-6)) {
      messages.push({ role: t.from === 'user' ? 'user' : 'assistant', content: t.text })
    }
    messages.push({ role: 'user', content: q })

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
      body: JSON.stringify({ model: MODEL, messages, max_tokens: 280, temperature: 0.55 }),
    })
    if (!res.ok) return null
    const data = await res.json()
    const text: string | undefined = data?.choices?.[0]?.message?.content?.trim()
    if (!text) return null
    return { text, audio: false }
  } catch {
    return null
  }
}
