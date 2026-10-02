// ─── Maya orchestrator ───────────────────────────────────────────────────────
// One entry point for the chatbot. Off-topic gate → LLM (if enabled) → offline
// brain fallback. Never returns null; Maya always answers something.

import { answer, type LiveContext, type MayaReply, type UserActivity } from './brain'
import { isOffTopic, OFF_TOPIC_REPLY } from './topicGate'
import { askLLM, type ChatTurn } from './llm'
import { fetchOfficialNotices } from '../services/authority'
import { fetchLiveNotes } from '../services/liveNotes'
import type { Place } from '../data/types'

export type { MayaReply, ChatTurn, UserActivity }

/** Best-effort live context for a pandal. Any failure yields empty signals —
    Maya still answers from the static dataset, and never invents updates. */
async function loadLiveContext(placeId: string): Promise<LiveContext> {
  try {
    const [notices, notes] = await Promise.all([fetchOfficialNotices(placeId), fetchLiveNotes(placeId)])
    return { notices, notes }
  } catch {
    return { notices: [], notes: [] }
  }
}

export async function askMaya(
  q: string,
  ctx?: Place | null,
  history: ChatTurn[] = [],
  activity?: UserActivity | null,
): Promise<MayaReply> {
  // Gate off-topic before spending a network call. Same reply in both modes.
  if (isOffTopic(q)) return OFF_TOPIC_REPLY

  if (import.meta.env.VITE_OPENAI_KEY) {
    const r = await askLLM(q, ctx ?? null, history, activity)
    if (r) {
      // Even LLM answers can drift off-role — re-check the outbound text.
      if (isOffTopic(r.text)) return OFF_TOPIC_REPLY
      return r
    }
    // fall through to offline brain on any failure
  }

  // Offline brain — enrich with live notices/notes when a pandal is in context,
  // and with the user's real activity for the derived "what next / best time /
  // meet / recap" intents.
  const live = ctx?.type === 'pandal' ? await loadLiveContext(ctx.id) : null
  return answer(q, ctx ?? null, live, activity ?? null)
}
