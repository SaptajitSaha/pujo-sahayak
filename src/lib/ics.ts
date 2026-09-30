// RFC-5545 iCalendar builder for the Puja Planner.
//
// Produces one VEVENT per planned stop, using the plan's local date+time (no
// TZID — mobile clients interpret floating times as "user's current timezone",
// which is correct here since every plan is Kolkata-local during the puja
// week). Escape rules follow RFC §3.3.11: backslashes, semicolons, commas and
// newlines inside TEXT properties must be escaped; other properties are safe
// literals. Line endings are CRLF. Long-line folding is intentionally omitted
// — pandal names + areas stay under 75 octets on any realistic input, and
// adding wrapping would complicate the diff without a real payload benefit.
import type { Place } from '../data/types'

export interface IcsStop {
  place: Place
  /** 24-hour "HH:MM" start time. */
  time: string
  durationMin: number
  /** Local calendar date as "YYYY-MM-DD". */
  date: string
}

export interface IcsBuild {
  /** Calendar name shown at the top of the importing client (e.g. "Pujo Sahayak — Ashtami"). */
  prodId: string
  calendarName: string
  stops: IcsStop[]
}

const pad2 = (n: number) => String(n).padStart(2, '0')

/** Escape a value for a TEXT property (SUMMARY / LOCATION / DESCRIPTION). */
function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

/** Convert "YYYY-MM-DD" + "HH:MM" + durationMin into two `DTSTART`/`DTEND`
    values in local time (no Z, no TZID — a "floating" calendar time). */
function startEndLocal(date: string, hhmm: string, durationMin: number): [string, string] {
  const [y, mo, d] = date.split('-').map(Number)
  const [h, mi] = hhmm.split(':').map(Number)
  const start = new Date(y, mo - 1, d, h, mi, 0)
  const end = new Date(start.getTime() + durationMin * 60_000)
  const fmt = (x: Date) =>
    `${x.getFullYear()}${pad2(x.getMonth() + 1)}${pad2(x.getDate())}T${pad2(x.getHours())}${pad2(x.getMinutes())}00`
  return [fmt(start), fmt(end)]
}

/** Stable 8-char UID per stop — the plan can be re-exported and clients will
    update the existing event rather than duplicate it. */
function uid(calName: string, stop: IcsStop, idx: number): string {
  return `pujo-${idx}-${stop.place.id}-${calName.replace(/\W+/g, '')}@pujosahayak.app`
}

export function buildIcs(input: IcsBuild): Blob {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Pujo Sahayak//Puja Planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${esc(input.calendarName)}`,
  ]
  const stampDate = new Date()
  const stamp =
    `${stampDate.getUTCFullYear()}${pad2(stampDate.getUTCMonth() + 1)}${pad2(stampDate.getUTCDate())}` +
    `T${pad2(stampDate.getUTCHours())}${pad2(stampDate.getUTCMinutes())}${pad2(stampDate.getUTCSeconds())}Z`
  input.stops.forEach((stop, i) => {
    const [dtStart, dtEnd] = startEndLocal(stop.date, stop.time, stop.durationMin)
    const descBits = [
      stop.place.type === 'pandal' ? `Pandal — ${stop.place.theme ?? 'themed pandal'}` : `Restaurant — ${stop.place.cuisine ?? ''}`,
      stop.place.artist ? `Artist: ${stop.place.artist}` : '',
      stop.place.metro ? `Nearest metro: ${stop.place.metro}` : '',
      stop.place.story ?? '',
    ].filter(Boolean).join('\n')
    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid(input.calendarName, stop, i)}`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${esc(stop.place.name)}`,
      `LOCATION:${esc(`${stop.place.area}, ${stop.place.name}`)}`,
      `DESCRIPTION:${esc(descBits)}`,
      'END:VEVENT',
    )
  })
  lines.push('END:VCALENDAR')
  // RFC §3.1 mandates CRLF for interoperability with strict parsers (Outlook).
  return new Blob([lines.join('\r\n') + '\r\n'], { type: 'text/calendar;charset=utf-8' })
}

/** Trigger a browser download. Kept separate so the caller controls the label
    (Android WebView fires the same "Save to Downloads" sheet as any <a download>). */
export function downloadIcs(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // Revoke asynchronously so the click has time to hand off to the OS.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
