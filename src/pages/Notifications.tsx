import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Gift, CalendarClock, Users, ShieldAlert, Sparkles, CheckCheck, BellOff, ChevronRight,
} from 'lucide-react'
import { Page, Reveal } from '../components/ui'
import { useApp } from '../store'
import { useT } from '../i18n'
import type { NotifKind } from '../data/types'

const KIND: Record<NotifKind, { icon: typeof Gift; tint: string; route?: string }> = {
  offer: { icon: Gift, tint: 'bg-vermilion-tint text-vermilion', route: '/' },
  reminder: { icon: CalendarClock, tint: 'bg-gold/15 text-gold', route: '/planner' },
  meetup: { icon: Users, tint: 'bg-maya/12 text-maya', route: '/meets' },
  safety: { icon: ShieldAlert, tint: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400', route: '/safety' },
  update: { icon: Sparkles, tint: 'bg-indigo-500/12 text-indigo-500', route: '/maya' },
}

export default function Notifications() {
  const t = useT()
  const nav = useNavigate()
  const notifications = useApp((s) => s.notifications)
  const markAllNotifsRead = useApp((s) => s.markAllNotifsRead)
  const markNotifRead = useApp((s) => s.markNotifRead)

  const unread = notifications.filter((n) => !n.read).length

  return (
    <Page>
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <button
          aria-label="Back"
          onClick={() => nav(-1)}
          className="glass grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink active:scale-95"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="flex-1 text-lg font-semibold text-ink">
          {t('notifications')}
          {unread > 0 && (
            <span className="ml-2 rounded-full bg-vermilion px-2 py-0.5 text-[11px] font-semibold text-white">
              {unread}
            </span>
          )}
        </h1>
        {unread > 0 && (
          <button
            onClick={markAllNotifsRead}
            className="flex items-center gap-1 text-xs font-medium text-vermilion active:opacity-70"
          >
            <CheckCheck size={15} />
            {t('markAllRead')}
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-2 pt-24 text-center text-faint">
          <BellOff size={28} />
          <p className="text-sm">{t('noNotifications')}</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {notifications.map((n, i) => {
            const { icon: Icon, tint, route } = KIND[n.kind]
            return (
              <Reveal key={n.id} delay={i * 0.05} y={14}>
                <button
                  onClick={() => {
                    markNotifRead(n.id)
                    const to = n.href ?? route
                    if (to) nav(to)
                  }}
                  className={`glass flex w-full items-start gap-3 rounded-2xl p-3.5 text-left transition-colors active:bg-ink/5 ${
                    n.read ? 'opacity-70' : ''
                  }`}
                >
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${tint}`}>
                    <Icon size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className={`text-sm ${n.read ? 'font-medium text-ink-soft' : 'font-semibold text-ink'}`}>
                        {n.title}
                      </span>
                      {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-vermilion" />}
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-ink-soft">{n.body}</span>
                    <span className="mt-1 block text-[11px] text-faint">{n.time}</span>
                  </span>
                  {(n.href ?? route) && (
                    <ChevronRight size={16} className="mt-1 shrink-0 text-faint" />
                  )}
                </button>
              </Reveal>
            )
          })}
        </div>
      )}
    </Page>
  )
}
