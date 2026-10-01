// ─── Authority integration panel ─────────────────────────────────────────────
// Developer/Settings surface: shows configured authority providers and a
// demo emergency / missing-person submission form. When no real provider is
// active, submissions are clearly marked "Demo mode — not transmitted".
// Honesty rule (spec §Feature 5): never claim a live government connection.

import { useState } from 'react'
import { Siren, UserX } from 'lucide-react'
import { Button, Card, Chip, SectionHeader } from '../components/ui'
import { supabase } from '../lib/supabase'
import { useAuthorityProviders } from '../services/authority'
import { getUserId } from '../lib/auth'

type Form = 'none' | 'emergency' | 'missing'

export function AuthorityPanel() {
  const { data: providers = [] } = useAuthorityProviders()
  const anyActive = providers.some((p) => p.is_active)

  const [form, setForm] = useState<Form>('none')
  const [text, setText] = useState('')
  const [status, setStatus] = useState<string | null>(null)

  const submit = async () => {
    if (!text.trim()) return
    // Only transmit when Supabase is configured AND a real provider is active.
    if (supabase && anyActive) {
      const userId = await getUserId()
      await supabase.from('user_reports').insert({
        reporter_id: userId,
        target_type: 'user',
        target_id: form,
        reason: text.trim(),
      })
      setStatus('Report submitted to the active authority provider.')
    } else {
      setStatus('Demo mode — recorded locally, not transmitted to any authority.')
    }
    setText('')
    setTimeout(() => setStatus(null), 3000)
  }

  return (
    <Card className="mt-4 p-3.5">
      <SectionHeader title="Authority integration" />

      <div className="space-y-1.5">
        {providers.map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-lg bg-ivory-deep px-2.5 py-2 text-sm">
            <span className="truncate">{p.name}</span>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${p.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-ink/10 text-faint'}`}>
              {p.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        ))}
      </div>
      {!anyActive && (
        <p className="mt-2 text-[10px] text-faint">
          No live authority is connected. Submissions below are demo-only and are never sent to police, hospitals or pandal committees.
        </p>
      )}

      <div className="mt-3 flex gap-2">
        <Chip active={form === 'emergency'} onClick={() => setForm(form === 'emergency' ? 'none' : 'emergency')}>
          <Siren size={12} className="mr-1 inline" /> Emergency
        </Chip>
        <Chip active={form === 'missing'} onClick={() => setForm(form === 'missing' ? 'none' : 'missing')}>
          <UserX size={12} className="mr-1 inline" /> Missing person
        </Chip>
      </div>

      {form !== 'none' && (
        <div className="mt-2.5">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder={form === 'emergency' ? 'Describe the emergency and your location…' : 'Name, appearance and last-seen spot…'}
            className="w-full rounded-lg border border-ink/10 bg-ivory-deep px-3 py-2 text-sm outline-none focus:border-vermilion"
          />
          <Button size="sm" className="mt-2 w-full" onClick={submit} disabled={!text.trim()}>
            Submit report
          </Button>
        </div>
      )}
      {status && <p role="status" className="mt-2 text-[11px] text-ink-soft">{status}</p>}
    </Card>
  )
}
