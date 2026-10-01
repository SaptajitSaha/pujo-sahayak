// ─── Transport & services directory integrity ──────────────────────────────
// The dedicated Metro page and the shared /services/:cat directory render from
// data/transport.ts. Two invariants keep those pages honest and non-empty:
//   1. Coverage — every category the Categories tiles link to resolves to a
//      directory with a title, a disclaimer and at least one row.
//   2. Honesty — the sample dataset never carries a fabricated live advisory,
//      and fares/timings are internally well-formed (min ≤ max, both set).
import { describe, expect, it } from 'vitest'
import {
  SERVICE_DIRECTORIES, busRoutes, directoryItems, metroLines, metroServiceAdvisories, metroStations,
} from '../data/transport'
import type { ServiceCategory } from '../data/types'

const CATS = Object.keys(SERVICE_DIRECTORIES) as ServiceCategory[]
const uniqueIds = (ids: string[]) => new Set(ids).size === ids.length

describe('service directories', () => {
  it('every category has a title, blurb and disclaimer', () => {
    for (const c of CATS) {
      const d = SERVICE_DIRECTORIES[c]
      expect(d.title, `${c} title`).toBeTruthy()
      expect(d.blurb, `${c} blurb`).toBeTruthy()
      expect(d.disclaimer, `${c} must carry an honesty caption`).toBeTruthy()
    }
  })

  it('every directory renders at least one row', () => {
    for (const c of CATS) {
      const count = c === 'bus' ? busRoutes.length : directoryItems(c).length
      expect(count, `${c} is empty`).toBeGreaterThan(0)
    }
  })

  it('point rows all carry a name and an area, with unique ids', () => {
    for (const c of CATS.filter((x) => x !== 'bus')) {
      const items = directoryItems(c)
      expect(uniqueIds(items.map((i) => i.id)), `${c} duplicate ids`).toBe(true)
      for (const i of items) {
        expect(i.name, `${c} row without a name`).toBeTruthy()
        expect(i.area, `${c}/${i.id} row without an area`).toBeTruthy()
      }
    }
  })
})

describe('bus routes', () => {
  it('are well-formed: corridor set, fares ordered, timings present', () => {
    expect(uniqueIds(busRoutes.map((r) => r.id))).toBe(true)
    for (const r of busRoutes) {
      expect(r.from, `${r.id} origin`).toBeTruthy()
      expect(r.to, `${r.id} destination`).toBeTruthy()
      expect(r.fareINR[0], `${r.id} fare min ≤ max`).toBeLessThanOrEqual(r.fareINR[1])
      expect(r.firstTrip, `${r.id} first trip`).toBeTruthy()
      expect(r.lastTrip, `${r.id} last trip`).toBeTruthy()
    }
  })
})

describe('metro lines', () => {
  it('have ordered fares, both terminals and a real station run', () => {
    for (const l of metroLines) {
      expect(l.stations.length, `${l.id} needs stations`).toBeGreaterThanOrEqual(2)
      expect(l.fareRange[0], `${l.id} fare min ≤ max`).toBeLessThanOrEqual(l.fareRange[1])
      expect(l.terminals[0], `${l.id} terminal A`).toBeTruthy()
      expect(l.terminals[1], `${l.id} terminal B`).toBeTruthy()
      expect(l.firstTrain, `${l.id} first train`).toBeTruthy()
      expect(l.lastTrain, `${l.id} last train`).toBeTruthy()
    }
  })

  it('declare interchanges only for stations that are actually on the line', () => {
    for (const l of metroLines) {
      for (const name of l.interchange) {
        expect(l.stations, `${l.id} lists interchange “${name}” not on its route`).toContain(name)
      }
    }
  })

  it('flag a station as interchange exactly when two or more lines touch it', () => {
    for (const s of metroStations) {
      expect(s.interchange, `${s.name} on ${s.lines.length} line(s)`).toBe(s.lines.length > 1)
    }
  })

  it('ship no fabricated live advisories in the seed data', () => {
    // A closure / maintenance notice is only ever real from the authority feed,
    // never authored here. This asserts the sample file stays disruption-free.
    expect(metroServiceAdvisories).toEqual([])
  })
})
