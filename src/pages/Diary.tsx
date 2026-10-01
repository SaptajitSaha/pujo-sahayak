import { useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ChevronLeft, Lock, Pencil, Plus, Share2, Trash2 } from 'lucide-react'
import { Button, Card, Page, SectionHeader } from '../components/ui'
import { placeById } from '../data/demo'
import type { DiaryEntry } from '../data/types'
import { useApp } from '../store'
import { useT } from '../i18n'

const MOODS: { mood: NonNullable<DiaryEntry['mood']>; key: 'moodAmazed' | 'moodHappy' | 'moodPeaceful' | 'moodCrowded' | 'moodTired' }[] = [
  { mood: 'amazed', key: 'moodAmazed' },
  { mood: 'happy', key: 'moodHappy' },
  { mood: 'peaceful', key: 'moodPeaceful' },
  { mood: 'crowded', key: 'moodCrowded' },
  { mood: 'tired', key: 'moodTired' },
]

const todayISO = () => {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/**
 * Puja Diary — private, date-stamped notes kept in the local `diary` slice.
 * Entries can attach a place the user has actually visited (check-ins / visited
 * list only — never the whole catalog) and an optional mood. Nothing is ever
 * uploaded: this is a personal record, and the UI says so.
 */
export default function Diary() {
  const t = useT()
  const nav = useNavigate()
  const flags = useApp((s) => s.featureFlags)
  const diary = useApp((s) => s.diary)
  const checkins = useApp((s) => s.checkins)
  const visited = useApp((s) => s.visited)
  const addDiary = useApp((s) => s.addDiary)
  const updateDiary = useApp((s) => s.updateDiary)
  const removeDiary = useApp((s) => s.removeDiary)

  const [editing, setEditing] = useState(false)
  const [draftId, setDraftId] = useState<string | null>(null)
  const [date, setDate] = useState(todayISO())
  const [text, setText] = useState('')
  const [mood, setMood] = useState<DiaryEntry['mood']>(undefined)
  const [placeId, setPlaceId] = useState<string | undefined>(undefined)

  // Only places the user has genuinely been — derived from the honest slices.
  const placeOptions = useMemo(() => {
    const ids = [...new Set([...checkins.map((c) => c.placeId), ...visited])]
    return ids.map((id) => placeById(id)).filter((p): p is NonNullable<typeof p> => !!p)
  }, [checkins, visited])

  if (!flags.ENABLE_PUJA_DIARY) return <Navigate to="/profile" replace />

  const resetForm = () => {
    setEditing(false); setDraftId(null); setDate(todayISO()); setText(''); setMood(undefined); setPlaceId(undefined)
  }
  const startNew = () => { resetForm(); setEditing(true) }
  const startEdit = (e: DiaryEntry) => {
    setEditing(true); setDraftId(e.id); setDate(e.date); setText(e.text); setMood(e.mood); setPlaceId(e.placeId)
  }
  const save = () => {
    if (!text.trim()) return
    const payload = { date, text: text.trim(), mood, placeId }
    if (draftId) updateDiary(draftId, payload)
    else addDiary(payload)
    resetForm()
  }
  const shareEntry = async (e: DiaryEntry) => {
    const where = e.placeId ? placeById(e.placeId)?.name : undefined
    const body = `${e.date}${where ? ` · ${where}` : ''}${e.mood ? ` · ${t(MOODS.find((m) => m.mood === e.mood)!.key)}` : ''}\n${e.text}`
    if (navigator.share) { try { await navigator.share({ title: 'Puja Diary', text: body }); return } catch { /* cancelled */ } }
    try { await navigator.clipboard.writeText(body) } catch { /* unavailable */ }
  }

  const sorted = [...diary].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))

  return (
    <Page>
      <header className="flex items-center gap-2">
        <button aria-label="Back" onClick={() => nav(-1)} className="text-ink-soft"><ChevronLeft size={20} /></button>
        <div className="flex-1">
          <h1 className="flex items-center gap-1.5 text-xl font-semibold"><Lock size={16} className="text-ink-soft" /> {t('diary')}</h1>
          <p className="text-[11px] text-faint">{t('diarySub')}</p>
        </div>
      </header>

      {editing ? (
        <Card className="mt-4 p-3.5">
          <div className="flex items-center gap-2">
            <label className="text-xs text-ink-soft">{t('diaryDate')}</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-md border border-ink/15 bg-transparent px-2 py-1 text-sm" />
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('diaryText')}
            rows={4}
            className="mt-3 w-full rounded-md border border-ink/15 bg-transparent p-2 text-sm outline-none focus:border-vermilion"
          />
          <div className="mt-3">
            <p className="text-xs text-ink-soft">{t('diaryMood')}</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {MOODS.map((m) => (
                <button
                  key={m.mood}
                  onClick={() => setMood(mood === m.mood ? undefined : m.mood)}
                  className={`rounded-full border px-2.5 py-1 text-xs ${mood === m.mood ? 'border-vermilion bg-vermilion/10 text-vermilion' : 'border-ink/10 text-ink-soft'}`}
                >
                  {t(m.key)}
                </button>
              ))}
            </div>
          </div>
          {placeOptions.length > 0 && (
            <div className="mt-3">
              <label className="text-xs text-ink-soft" htmlFor="diary-place">{t('diaryPlace')}</label>
              <select id="diary-place" value={placeId ?? ''} onChange={(e) => setPlaceId(e.target.value || undefined)} className="mt-1 w-full rounded-md border border-ink/15 bg-transparent px-2 py-1.5 text-sm">
                <option value="">{t('diaryNone')}</option>
                {placeOptions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}
          <div className="mt-3 flex gap-2">
            <Button size="sm" className="flex-1" onClick={save}>{t('diarySave')}</Button>
            <Button size="sm" variant="outline" onClick={resetForm}>{t('diaryCancel')}</Button>
          </div>
        </Card>
      ) : (
        <button onClick={startNew} className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-card border border-dashed border-ink/20 py-2.5 text-sm font-medium text-ink-soft">
          <Plus size={15} /> {t('diaryAdd')}
        </button>
      )}

      <section className="mt-5">
        <SectionHeader title={t('diary')} />
        {sorted.length === 0 ? (
          <Card className="p-4 text-[13px] leading-snug text-ink-soft">{t('diaryEmpty')}</Card>
        ) : (
          <div className="space-y-2.5">
            {sorted.map((e) => {
              const where = e.placeId ? placeById(e.placeId)?.name : undefined
              const moodLabel = e.mood ? t(MOODS.find((m) => m.mood === e.mood)!.key) : undefined
              return (
                <Card key={e.id} className="p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold text-vermilion">{e.date}</p>
                    <div className="flex gap-1 text-faint">
                      <button aria-label={t('diaryEdit')} onClick={() => startEdit(e)} className="p-1"><Pencil size={13} /></button>
                      <button aria-label={t('recapShare')} onClick={() => shareEntry(e)} className="p-1"><Share2 size={13} /></button>
                      <button aria-label={t('diaryDelete')} onClick={() => removeDiary(e.id)} className="p-1 hover:text-vermilion"><Trash2 size={13} /></button>
                    </div>
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-ink">{e.text}</p>
                  {(where || moodLabel) && (
                    <p className="mt-1.5 flex flex-wrap gap-1.5 text-[11px] text-faint">
                      {where && <span className="rounded-full bg-ivory-deep px-2 py-0.5">{where}</span>}
                      {moodLabel && <span className="rounded-full bg-ivory-deep px-2 py-0.5">{moodLabel}</span>}
                    </p>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </section>
    </Page>
  )
}
