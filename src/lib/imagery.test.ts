// ─── Tile imagery integrity ──────────────────────────────────────────────────
// Every card in this app renders through <Img palette={…}>, which falls back to
// a bare gradient when the palette carries no `img`. A rail where some tiles
// have photos and some don't — or where two siblings share one photo — reads as
// a rendering bug, not as graceful degradation. That state kept creeping back in
// as new entities were added (dishes, marketplace, artists, meetups each shipped
// imageless), so the invariant is asserted here instead of eyeballed.
//
// Scope is what a single screen shows at once: a rail, a grid, or one detail
// page's hero + its own galleries. Reuse ACROSS screens is deliberately allowed
// and not asserted — the sample pool is finite and two different pages sharing
// a picture is invisible to a user.
import { describe, expect, it } from 'vitest'
import { artists, meetups, places, shopping, walks } from '../data/demo'
import { DEMO_PRODUCTS } from '../services/marketplace.mock'
import type { Palette } from '../data/types'

interface Tile {
  id: string
  img?: string
}

/* The 2nd and later occurrences of each photo — i.e. exactly the repeat visits
   a user would see as two identical cards. */
const dupeIds = (imgs: string[]) => imgs.filter((x, i) => imgs.indexOf(x) !== i)

/** Fail with the offending ids named — a bare `expected [] to equal []` tells
    a future editor nothing about which card lost its picture. */
function expectPhotos(label: string, tiles: Tile[]) {
  const imageless = tiles.filter((x) => !x.img).map((x) => x.id)
  expect(imageless, `${label}: tiles rendering a bare gradient`).toEqual([])
  const imgs = tiles.map((x) => x.img) as string[]
  expect(dupeIds(imgs), `${label}: two sibling tiles showing the same photo`).toEqual([])
  expect(imgs.every((p) => p.startsWith('/img/')), `${label}: every tile points at bundled imagery`).toBe(true)
}

const tile = (id: string, palette: Palette): Tile => ({ id, img: palette.img })

describe('place tiles', () => {
  it('every pandal and restaurant card has a photo', () => {
    const imageless = places.filter((p) => !p.palette.img).map((p) => p.id)
    expect(imageless, 'places rendering a bare gradient').toEqual([])
  })

  it('no two pandals in the same city share a photo', () => {
    // City is the screen: Explore/Search scope to the selected city, so its
    // cards are the ones a user compares side by side. Across cities, reuse is
    // fine and unseeable.
    const byCity = new Map<string, typeof places>()
    for (const p of places) {
      const group = byCity.get(p.cityId ?? 'kolkata')
      if (group) group.push(p)
      else byCity.set(p.cityId ?? 'kolkata', [p])
    }
    for (const [city, group] of byCity) {
      expectPhotos(`city ${city}`, group.map((p) => tile(p.id, p.palette)))
    }
  })

  it('every popular dish carries a photo, and none repeats inside one restaurant', () => {
    const dishes = places.flatMap((p) => p.popularDishes ?? [])
    expect(dishes.length).toBeGreaterThan(0)
    expect(dishes.every((d) => !!d.palette.img), 'a dish rendered with no photo').toBe(true)
    // The same dish legitimately appears on two restaurants' menus; only the
    // rail a single detail page draws has to be free of repeats.
    for (const p of places.filter((x) => x.popularDishes?.length)) {
      expectPhotos(`${p.name} dishes`, p.popularDishes!.map((d) => tile(d.id, d.palette)))
    }
  })

  it('a pandal page never repeats a photo across hero, past editions and top clicks', () => {
    for (const p of places.filter((x) => x.pastEditions?.length || x.topClicks?.length)) {
      const tiles: Tile[] = [
        tile(p.id, p.palette),
        ...(p.pastEditions ?? []).map((e) => tile(`${p.id}/${e.year}`, e.palette)),
        ...(p.topClicks ?? []).map((ph) => tile(`${p.id}/${ph.id}`, ph.palette)),
      ]
      expectPhotos(`${p.name} gallery`, tiles)
    }
  })
})

describe('commerce tiles', () => {
  it('every shopping product has its own photo', () => {
    expectPhotos('shopping', shopping.map((s) => tile(s.id, s.palette)))
  })

  it('every marketplace listing carries its own photo', () => {
    // Read through the field the UI actually renders, so a row that sets the
    // palette but forgets `images` still fails.
    expectPhotos(
      'marketplace',
      DEMO_PRODUCTS.map((p) => ({ id: p.id, img: p.images[0] })),
    )
  })
})

describe('discovery tiles', () => {
  it('every artist tile has its own photo', () => {
    expectPhotos('artists', artists.map((a) => tile(a.id, a.palette)))
  })

  it('every meetup tile has its own photo', () => {
    expectPhotos('meetups', meetups.map((m) => tile(m.id, m.palette)))
  })

  it('every curated walk has its own photo', () => {
    expectPhotos('walks', walks.map((w) => tile(w.id, w.palette)))
  })
})
