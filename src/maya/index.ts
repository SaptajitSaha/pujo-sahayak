// ─── Maya orchestrator ───────────────────────────────────────────────────────
// One entry point for the chatbot. Off-topic gate → LLM (if enabled) → offline
// brain fallback. Never returns null; Maya always answers something.

import { answer, isOffTopic, OFF_TOPIC_REPLY, type MayaReply } from './brain'
import { askLLM, type ChatTurn } from './llm'
import type { Place } from '../data/types'

export type { MayaReply, ChatTurn }

export async function askMaya(
  q: string,
  ctx?: Place | null,
  history: ChatTurn[] = [],
): Promise<MayaReply> {
  // Gate off-topic before spending a network call. Same reply in both modes.
  if (isOffTopic(q)) return OFF_TOPIC_REPLY

  if (import.meta.env.VITE_OPENAI_KEY) {
    const r = await askLLM(q, ctx ?? null, history)
    if (r) {
      // Even LLM answers can drift off-role — re-check the outbound text.
      if (isOffTopic(r.text)) return OFF_TOPIC_REPLY
      return r
    }
    // fall through to offline brain on any failure
  }

  return answer(q, ctx ?? null)
}
