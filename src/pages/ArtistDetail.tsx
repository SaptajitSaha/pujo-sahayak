import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronRight, Palette as PaletteIcon } from 'lucide-react'
import { Button, Card, Img, Page, Reveal, SectionHeader } from '../components/ui'
import { RailCard } from '../components/PlaceCard'
import { artists, pandals, placeById } from '../data/demo'
import { useT } from '../i18n'

/**
 * Artist profile — reachable from a Pandal's artist chip and from Explore.
 * The `id` URL param accepts the seeded artist id (e.g. "artist-paresh-das")
 * or an artist name string (from `place.artist`), so pandals that only know
 * the display name can still deep-link here without a data migration.
 */
export default function ArtistDetail() {
  const { id = '' } = useParams()
  const t = useT()
  const nav = useNavigate()

  const artist = useMemo(() => {
    return artists.find((a) => a.id === id) ?? artists.find((a) => a.name.toLowerCase() === decodeURIComponent(id).toLowerCase())
  }, [id])

  const theirPandals = useMemo(() => {
    if (!artist) return []
    // Prefer explicit pandalIds, but also cover any pandal whose `artist`
    // string matches this artist's name — pandal data currently stores just
    // a display name and isn't yet fully linked.
    const direct = artist.pandalIds.map((pid) => placeById(pid)).filter((p) => !!p)
    const byName = pandals.filter((p) => p.artist?.toLowerCase() === artist.name.toLowerCase() && !artist.pandalIds.includes(p.id))
    const seen = new Set<string>()
    return [...direct, ...byName].filter((p) => {
      if (!p || seen.has(p.id)) return false
      seen.add(p.id)
      return true
    })
  }, [artist])

  if (!artist) {
    return (
      <Page>
        <p className="pt-20 text-center text-sm text-faint">Artist not found.</p>
      </Page>
    )
  }

  return (
    <Page>
      <button onClick={() => nav(-1)} className="mb-3 inline-flex items-center gap-1 text-sm text-faint">
        <ChevronRight size={14} className="rotate-180" /> Back
      </button>

      <Reveal>
        <Card className="overflow-hidden p-0">
          <Img palette={artist.palette} alt={artist.name} className="h-40 w-full" />
          <div className="p-4">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-faint">
              <PaletteIcon size={13} className="text-vermilion" /> {artist.specialty}
            </div>
            <h1 className="mt-1 font-display text-2xl">{artist.name}</h1>
            {artist.nameBn && <p className="bn mt-0.5 text-sm text-ink-soft">{artist.nameBn}</p>}
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">{artist.bio}</p>
            {artist.bioBn && (
              <p className="bn mt-2 text-[13px] leading-relaxed text-ink-soft">{artist.bioBn}</p>
            )}
          </div>
        </Card>
      </Reveal>

      {theirPandals.length > 0 && (
        <section className="mt-5">
          <SectionHeader title={`Their pandals (${theirPandals.length})`} />
          <div className="grid grid-cols-2 gap-3">
            {theirPandals.map((p) => p && <RailCard key={p.id} place={p} />)}
          </div>
        </section>
      )}

      <Button variant="outline" className="mt-6 w-full" onClick={() => nav('/explore')}>
        {t('viewAll')} pandals
      </Button>
    </Page>
  )
}
