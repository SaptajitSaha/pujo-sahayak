import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Search as SearchIcon, Crosshair, Plus, Home as HomeIcon, Briefcase,
  MapPin, Trash2, Check, Loader2, Navigation, Map as MapIcon,
} from 'lucide-react'
import { Button, Page } from '../components/ui'
import MapPicker from '../components/MapPicker'
import { useApp } from '../store'
import { useT } from '../i18n'
import type { AddressType } from '../data/types'
import { describeCurrentLocation, searchLocations, type GeoResult } from '../lib/geo'

const TYPE_ICON: Record<AddressType, typeof HomeIcon> = {
  home: HomeIcon,
  work: Briefcase,
  other: MapPin,
}

export default function LocationPicker() {
  const t = useT()
  const nav = useNavigate()
  const currentAddress = useApp((s) => s.currentAddress)
  const setCurrentAddress = useApp((s) => s.setCurrentAddress)
  const savedAddresses = useApp((s) => s.savedAddresses)
  const addAddress = useApp((s) => s.addAddress)
  const removeAddress = useApp((s) => s.removeAddress)

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GeoResult[]>([])
  const [searching, setSearching] = useState(false)
  const [searchErr, setSearchErr] = useState('')

  const [detecting, setDetecting] = useState(false)
  const [notice, setNotice] = useState('')
  const [showMap, setShowMap] = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [label, setLabel] = useState('')
  const [type, setType] = useState<AddressType>('home')
  const [details, setDetails] = useState('')

  const pick = (address: string) => {
    setCurrentAddress(address)
    nav(-1)
  }

  // Debounced live search against Nominatim (real geocoder).
  // Deps are the trimmed query only — `t` from useT() is a fresh function each
  // render, so including it would re-fire this effect in an endless loop.
  const timer = useRef<number | undefined>(undefined)
  const noResultsMsg = t('noResults')
  useEffect(() => {
    window.clearTimeout(timer.current)
    const q = query.trim()
    if (q.length < 3) {
      setResults([])
      setSearching(false)
      setSearchErr('')
      return
    }
    setSearching(true)
    timer.current = window.setTimeout(async () => {
      try {
        const r = await searchLocations(q)
        setResults(r)
        setSearchErr(r.length ? '' : noResultsMsg)
      } catch {
        setResults([])
        setSearchErr('Search needs the internet — add the address manually below.')
      } finally {
        setSearching(false)
      }
    }, 500)
    return () => window.clearTimeout(timer.current)
  }, [query, noResultsMsg])

  const useCurrent = async () => {
    setDetecting(true)
    setNotice('')
    try {
      const name = await describeCurrentLocation()
      pick(name)
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Could not fetch your location.')
    } finally {
      setDetecting(false)
    }
  }

  const saveNew = () => {
    const addr = details.trim()
    if (!addr) return
    const lbl = label.trim() || t(`label${type === 'home' ? 'Home' : type === 'work' ? 'Work' : 'Other'}` as 'labelHome')
    addAddress({ label: lbl, type, address: addr })
    setCurrentAddress(addr)
    nav(-1)
  }

  const TYPES: { key: AddressType; icon: typeof HomeIcon; text: string }[] = [
    { key: 'home', icon: HomeIcon, text: t('labelHome') },
    { key: 'work', icon: Briefcase, text: t('labelWork') },
    { key: 'other', icon: MapPin, text: t('labelOther') },
  ]

  return (
    <Page>
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <button
          aria-label="Back"
          onClick={() => nav(-1)}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full glass text-ink active:scale-95"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-lg font-semibold text-ink">{t('chooseLocation')}</h1>
      </div>

      {/* Search */}
      <div className="relative">
        <SearchIcon size={16} className="absolute left-4 top-1/2 z-10 -translate-y-1/2 text-faint" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('searchLocation')}
          aria-label={t('searchLocation')}
          className="glass w-full rounded-full py-3 pl-10 pr-10 text-sm text-ink outline-none placeholder:text-faint focus:ring-2 focus:ring-vermilion/40"
        />
        {searching && <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-faint" />}
      </div>

      {(results.length > 0 || searchErr) && (
        <div className="mt-2 overflow-hidden rounded-2xl glass">
          {results.map((r, i) => (
            <button
              key={`${r.lat}-${r.lng}-${i}`}
              onClick={() => pick(r.name)}
              className="flex w-full items-start gap-2.5 border-b border-ink/5 px-4 py-3 text-left last:border-0 active:bg-ink/5"
            >
              <MapPin size={16} className="mt-0.5 shrink-0 text-vermilion" />
              <span className="text-sm text-ink">{r.name}</span>
            </button>
          ))}
          {searchErr && <p className="px-4 py-3 text-xs text-faint">{searchErr}</p>}
        </div>
      )}

      {/* Actions row */}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={useCurrent} disabled={detecting}>
          {detecting ? <Loader2 size={15} className="animate-spin" /> : <Crosshair size={15} />}
          {detecting ? t('detecting') : t('useCurrentLocation')}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus size={15} />
          {t('addNewAddress')}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setShowMap(true)}>
          <MapIcon size={15} />
          {t('chooseOnMap')}
        </Button>
      </div>
      {notice && <p className="mt-2 text-xs text-vermilion">{notice}</p>}

      {/* Add-new-address form */}
      {showForm && (
        <div className="mt-3 space-y-3 rounded-2xl glass p-4">
          <div className="flex gap-2">
            {TYPES.map(({ key, icon: Icon, text }) => (
              <button
                key={key}
                onClick={() => setType(key)}
                aria-pressed={type === key}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-xs font-medium transition-colors ${
                  type === key
                    ? 'border-vermilion bg-vermilion text-white'
                    : 'border-ink/12 text-ink-soft'
                }`}
              >
                <Icon size={14} />
                {text}
              </button>
            ))}
          </div>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={t('addressLabelHint')}
            aria-label={t('addressLabelHint')}
            className="w-full rounded-full border border-ink/12 bg-transparent px-4 py-2.5 text-sm text-ink outline-none placeholder:text-faint focus:border-vermilion/50"
          />
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder={t('addressDetailsHint')}
            aria-label={t('addressDetailsHint')}
            rows={3}
            className="w-full resize-none rounded-2xl border border-ink/12 bg-transparent px-4 py-2.5 text-sm text-ink outline-none placeholder:text-faint focus:border-vermilion/50"
          />
          <Button className="w-full" onClick={saveNew} disabled={!details.trim()}>
            <Check size={16} />
            {t('save')}
          </Button>
        </div>
      )}

      {/* Saved addresses */}
      <h2 className="mt-6 mb-2 flex items-center gap-2 text-[15px] font-semibold text-ink">
        <Navigation size={15} className="text-vermilion" />
        {t('savedAddresses')}
      </h2>
      <div className="space-y-2.5">
        {savedAddresses.map((a) => {
          const Icon = TYPE_ICON[a.type]
          const isCurrent = a.address === currentAddress
          return (
            <div
              key={a.id}
              className={`flex items-center gap-3 rounded-2xl glass p-3 transition-shadow ${
                isCurrent ? 'ring-1 ring-vermilion/40' : ''
              }`}
            >
              <button
                onClick={() => pick(a.address)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-vermilion-tint text-vermilion">
                  <Icon size={18} />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-ink">{a.label}</span>
                    {isCurrent && (
                      <span className="rounded-full bg-vermilion/12 px-1.5 py-0.5 text-[10px] font-semibold text-vermilion">
                        {t('current')}
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-ink-soft">{a.address}</span>
                </span>
              </button>
              <button
                aria-label={`Remove ${a.label}`}
                onClick={() => removeAddress(a.id)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-faint active:bg-ink/5"
              >
                <Trash2 size={15} />
              </button>
            </div>
          )
        })}
      </div>

      {showMap && (
        <MapPicker
          onConfirm={(addr) => { setCurrentAddress(addr); nav(-1) }}
          onClose={() => setShowMap(false)}
        />
      )}
    </Page>
  )
}
