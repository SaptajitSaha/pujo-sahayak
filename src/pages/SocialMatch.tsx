// ─── Social matching page ────────────────────────────────────────────────────
// "People with similar plans" — activity-based discovery, NOT dating.
// Preference editor + ranked match cards + privacy controls.
// Matching is real only when Supabase is configured; the editor still works
// locally so the flow is reviewable. We never invent people to match against.

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Flag, HeartHandshake, ShieldOff, Sparkles, Users } from 'lucide-react'
import { BackHeader, Button, Card, Chip, EASE, Page, QueryError, SectionHeader } from '../components/ui'
import { interests as INTERESTS, pandals } from '../data/demo'
import { useAuth, useUserId } from '../lib/auth'
import { useApp } from '../store'
import { useMatches, useMyPreferences, useUpdatePreferences } from '../services/social'
import type { SocialPreference } from '../data/types'

const TIMES = ['Morning', 'Afternoon', 'Evening', 'Late night']
const CROWDS = ['Quiet', 'Moderate', 'Lively']
const STYLES = ['Relaxed', 'Energetic']
const TITHIS = ['saptami', 'ashtami', 'navami', 'dashami']

/** Area labels pulled from the real pandal dataset — never invented. */
const AREAS = Array.from(new Set(pandals.map((p) => p.area)))

/** Deterministic soft gradient per person — no photo, no identity leak. */
function avatarFor(id: string) {
  const hues = ['#c8451f', '#7c3aed', '#0d9488', '#b45309', '#be185d', '#4338ca']
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360
  const a = hues[h % hues.length]
  const b = hues[(h + 3) % hues.length]
  return { backgroundImage: `linear-gradient(135deg, ${a}, ${b})` }
}

export default function SocialMatch() {
  const nav = useNavigate()
  const { isAuthenticated } = useAuth()
  const userId = useUserId()
  const blockedUsers = useApp((s) => s.blockedUsers)
  const blockUser = useApp((s) => s.blockUser)

  const { data: saved } = useMyPreferences(userId)
  const update = useUpdatePreferences()

  // Editor state — seeded from the saved profile (or sensible defaults).
  const [interests, setInterestList] = useState<string[]>(saved?.interests ?? [])
  const [areasSel, setAreasSel] = useState<string[]>(saved?.preferred_areas ?? [])
  const [time, setTime] = useState(saved?.preferred_time ?? 'Evening')
  const [crowd, setCrowd] = useState(saved?.crowd_preference ?? 'Moderate')
  const [style, setStyle] = useState(saved?.outing_style ?? 'Relaxed')
  const [tithi, setTithi] = useState<string | null>(saved?.planned_tithi ?? null)
  const [visibility, setVisibility] = useState<'public' | 'hidden'>(saved?.visibility ?? 'public')
  const [toast, setToast] = useState<string | null>(null)
  const note = (s: string) => { setToast(s); setTimeout(() => setToast(null), 2400) }

  const toggle = (arr: string[], v: string, set: (x: string[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])

  const draft: SocialPreference = useMemo(
    () => ({
      user_id: userId ?? 'guest',
      interests, preferred_areas: areasSel, preferred_time: time,
      crowd_preference: crowd, language_preference: 'en', outing_style: style,
      planned_tithi: tithi, visibility, display_name: null,
    }),
    [userId, interests, areasSel, time, crowd, style, tithi, visibility],
  )

  const { cards: matches, isLoading: matchesLoading, isError: matchesError, refetch: refetchMatches } =
    useMatches(isAuthenticated ? draft : null, blockedUsers)

  const save = () => {
    if (!isAuthenticated) { nav('/auth'); return }
    const { user_id: _omit, ...rest } = draft
    update.mutate(rest as Omit<SocialPreference, 'user_id'>, {
      onSuccess: () => note('Preferences saved'),
      onError: (e) => note((e as Error).message),
    })
  }

  return (
    <Page>
      <BackHeader title="People with similar plans" />
      <p className="mt-1 text-sm text-ink-soft">
        Find companions for pandal-hopping, food crawls and photo walks. Activity matching only — never dating.
      </p>

      {/* ── Preference editor ── */}
      <section className="mt-4 space-y-4">
        <div>
          <SectionHeader title="Your interests" />
          <div className="mt-2 flex flex-wrap gap-2">
            {INTERESTS.map((i) => (
              <Chip key={i} active={interests.includes(i)} onClick={() => toggle(interests, i, setInterestList)}>{i}</Chip>
            ))}
          </div>
        </div>

        <div>
          <SectionHeader title="Areas you'll explore" />
          <div className="mt-2 flex flex-wrap gap-2">
            {AREAS.slice(0, 10).map((a) => (
              <Chip key={a} active={areasSel.includes(a)} onClick={() => toggle(areasSel, a, setAreasSel)}>{a}</Chip>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Labeled title="Time">
            {TIMES.map((v) => <Chip key={v} active={time === v} onClick={() => setTime(v)}>{v}</Chip>)}
          </Labeled>
          <Labeled title="Crowd">
            {CROWDS.map((v) => <Chip key={v} active={crowd === v} onClick={() => setCrowd(v)}>{v}</Chip>)}
          </Labeled>
          <Labeled title="Pace">
            {STYLES.map((v) => <Chip key={v} active={style === v} onClick={() => setStyle(v)}>{v}</Chip>)}
          </Labeled>
          <Labeled title="Planned day">
            {TITHIS.map((v) => <Chip key={v} active={tithi === v} onClick={() => setTithi(v)} className="capitalize">{v}</Chip>)}
          </Labeled>
        </div>

        <label className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 text-ink-soft"><ShieldOff size={14} /> Hide my profile from matches</span>
          <input
            type="checkbox"
            checked={visibility === 'hidden'}
            onChange={(e) => setVisibility(e.target.checked ? 'hidden' : 'public')}
            className="h-5 w-5 accent-[#7c3aed]"
            aria-label="Hide my profile"
          />
        </label>

        <Button className="w-full" onClick={save} disabled={update.isPending}>
          <Sparkles size={15} /> {isAuthenticated ? (update.isPending ? 'Saving…' : 'Save preferences') : 'Sign in to save'}
        </Button>
      </section>

      {/* ── Matches ── */}
      <section className="mt-6">
        <div className="flex items-center gap-1.5">
          <Users size={16} className="text-vermilion" />
          <h2 className="text-sm font-semibold">Nearby plans that fit yours</h2>
        </div>

        {!isAuthenticated ? (
          <p className="mt-2 text-xs text-ink-soft">Sign in to see people whose plans overlap with yours.</p>
        ) : matchesError ? (
          <QueryError onRetry={refetchMatches} message="Couldn’t load nearby plans." />
        ) : matchesLoading ? (
          <div className="mt-2 space-y-2">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-card bg-card" />)}</div>
        ) : matches.length === 0 ? (
          <div className="mt-2 rounded-card border border-dashed border-ink/15 p-4 text-center">
            <p className="text-sm text-ink-soft">No matches yet.</p>
            <p className="mt-1 text-[11px] text-faint">
              {visibility === 'hidden'
                ? 'Your profile is hidden — turn visibility on to be discovered.'
                : 'Nobody has joined with overlapping plans yet. Save your preferences and check back closer to the dates.'}
            </p>
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {matches.map((m, i) => (
              <motion.div
                key={m.userId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.4, ease: EASE }}
              >
                <Card className="p-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-11 w-11 shrink-0 rounded-full ${m.displayName === 'Anonymous' ? 'bg-ivory-deep' : ''}`} style={m.displayName === 'Anonymous' ? undefined : avatarFor(m.userId)}>
                      {m.displayName === 'Anonymous' && <div className="flex h-full items-center justify-center"><Users size={18} className="text-faint" /></div>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold">{m.displayName}</p>
                        <span className="rounded-full bg-vermilion-tint px-1.5 py-0.5 text-[10px] font-semibold text-vermilion">{m.matchScore}/8 match</span>
                      </div>
                      <p className="truncate text-[11px] text-faint">
                        {m.plannedArea}{m.plannedTithi ? ` · planning ${m.plannedTithi}` : ''}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {m.interests.slice(0, 3).map((x) => (
                          <span key={x} className="rounded-full bg-ivory-deep px-1.5 py-0.5 text-[10px] text-ink-soft">{x}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2.5 flex items-center gap-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => nav('/meets')}>
                      <HeartHandshake size={13} /> Join a meetup
                    </Button>
                    <button
                      onClick={() => { blockUser(m.userId); note('This profile is hidden from you.') }}
                      aria-label="Block and report this profile"
                      className="rounded-full p-2 text-faint transition-colors hover:text-vermilion"
                    >
                      <Flag size={14} />
                    </button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
        <p className="mt-2 text-[10px] text-faint">
          Matching uses shared interests and plans only. Exact locations are never shown — meet through a public meetup.
        </p>
      </section>

      {toast && (
        <div className="fixed inset-x-0 bottom-24 z-50 mx-auto w-fit max-w-[90%] rounded-full bg-night px-4 py-2 text-xs text-on-image shadow-lift">
          {toast}
        </div>
      )}
    </Page>
  )
}

function Labeled({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-ink-soft">{title}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  )
}
