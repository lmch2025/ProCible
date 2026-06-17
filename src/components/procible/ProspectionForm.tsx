'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useProcibleStore } from '@/store/procible-store'
import { X, Image as ImageIcon, MapPin, Send, Loader2, Plus, Check, Globe2, Search, AlertCircle, Coins, Zap, Cpu } from 'lucide-react'
import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { toast } from 'sonner'
import { modelDisplayName, modelBadgeColor } from '@/lib/ai-content'
import { useI18n } from '@/lib/i18n'
import {
  ALL_COUNTRIES,
  iso2ToFlag,
  countryNameFR,
  parseLocations,
  countLocations,
} from '@/lib/locations'

interface SelectedEntry {
  raw: string // "ISO2:CityName" or "ISO2:all"
  iso2: string
  city: string | null
}

interface CitySuggestion {
  name: string
  country: string // ISO2 lowercase
  state?: string
  county?: string
}

interface CreditRuleLite {
  action: string
  label: string
  cost: number
  freeQuotaPerDay: number
  enabled: boolean
  description: string | null
}

export default function ProspectionForm() {
  const { showProspectionForm, setShowProspectionForm, addCampaign, prospectionSubmitting, setProspectionSubmitting, credits, navigateTo } = useProcibleStore()
  const { t, tp, locale } = useI18n()

  const [productName, setProductName] = useState('')
  const [selected, setSelected] = useState<SelectedEntry[]>([])
  const [images, setImages] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // --- Credit rule for prospection.launch ---
  const [launchRule, setLaunchRule] = useState<CreditRuleLite | null>(null)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/credits', { headers: { 'x-locale': locale } })
        if (!res.ok) return
        const data = await res.json()
        if (cancelled) return
        const rule = (data.rules || []).find((r: CreditRuleLite) => r.action === 'prospection.launch')
        if (rule) setLaunchRule(rule)
      } catch {
        /* silent — rule stays null, button shows no cost */
      }
    })()
    return () => { cancelled = true }
  }, [])

  const launchCost = launchRule?.cost ?? 0
  const insufficientCredits = launchCost > 0 && credits < launchCost

  // --- Country autocomplete state ---
  const [countryQuery, setCountryQuery] = useState('')
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [highlightedCountry, setHighlightedCountry] = useState(-1)
  const countryInputRef = useRef<HTMLInputElement>(null)

  // --- City autocomplete state ---
  const [cityQuery, setCityQuery] = useState('')
  const [activeCountry, setActiveCountry] = useState<string>('') // ISO2, defaults to empty (= worldwide)
  const [showCityDropdown, setShowCityDropdown] = useState(false)
  const [citySuggestions, setCitySuggestions] = useState<CitySuggestion[]>([])
  const [cityLoading, setCityLoading] = useState(false)
  const [highlightedCity, setHighlightedCity] = useState(-1)
  const cityInputRef = useRef<HTMLInputElement>(null)
  const cityAbortRef = useRef<AbortController | null>(null)
  const cityDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ---- Filtering ----
  const filteredCountries = useMemo(() => {
    const q = countryQuery.trim().toLowerCase()
    if (!q) return ALL_COUNTRIES.slice(0, 50)
    return ALL_COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.iso2.toLowerCase() === q ||
        countryNameFR(c.iso2, c.name).toLowerCase().includes(q),
    ).slice(0, 50)
  }, [countryQuery])

  // ---- Selection helpers ----
  const isSelected = (iso2: string, city: string | null) =>
    selected.some((s) => s.iso2 === iso2 && s.city === city)

  const addCitySelection = (iso2: string, city: string) => {
    if (isSelected(iso2, city)) return
    // If "whole country" was already selected for this country, keep it AND
    // add the specific city — the parser handles duplicates gracefully and
    // the user might want both. (Per LOCATIONS format, both can coexist.)
    setSelected((prev) => [...prev, { raw: `${iso2}:${city}`, iso2, city }])
  }

  const addWholeCountrySelection = (iso2: string) => {
    if (isSelected(iso2, null)) return
    setSelected((prev) => [...prev, { raw: `${iso2}:all`, iso2, city: null }])
  }

  const removeSelected = (raw: string) =>
    setSelected((prev) => prev.filter((s) => s.raw !== raw))

  // ---- City search (debounced, hits /api/cities which proxies Nominatim) ----
  const searchCities = useCallback(async (q: string, countryIso: string) => {
    if (cityAbortRef.current) cityAbortRef.current.abort()
    const ctrl = new AbortController()
    cityAbortRef.current = ctrl
    try {
      const params = new URLSearchParams({ q, limit: '8' })
      if (countryIso) params.set('country', countryIso)
      const res = await fetch(`/api/cities?${params.toString()}`, { signal: ctrl.signal })
      if (!res.ok) {
        setCitySuggestions([])
        return
      }
      const data = await res.json()
      const sugg: CitySuggestion[] = (data.suggestions || []).map((s: any) => ({
        name: s.name,
        country: (s.country || '').toUpperCase(),
        state: s.state,
        county: s.county,
      }))
      setCitySuggestions(sugg)
      setHighlightedCity(-1)
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        setCitySuggestions([])
      }
    } finally {
      setCityLoading(false)
    }
  }, [])

  const onCityQueryChange = (val: string) => {
    setCityQuery(val)
    setShowCityDropdown(true)
    if (cityDebounceRef.current) clearTimeout(cityDebounceRef.current)
    if (val.trim().length < 2) {
      setCitySuggestions([])
      setCityLoading(false)
      return
    }
    setCityLoading(true)
    cityDebounceRef.current = setTimeout(() => {
      searchCities(val.trim(), activeCountry)
    }, 350)
  }

  const pickCity = (s: CitySuggestion) => {
    addCitySelection(s.country, s.name)
    setCityQuery('')
    setCitySuggestions([])
    setShowCityDropdown(false)
    setCityLoading(false)
    cityInputRef.current?.focus()
  }

  const pickCountryFromAutocomplete = (iso2: string) => {
    addWholeCountrySelection(iso2)
    setCountryQuery('')
    setShowCountryDropdown(false)
    setActiveCountry(iso2) // pre-select it as filter for city search
    // Focus city input next
    setTimeout(() => cityInputRef.current?.focus(), 50)
  }

  // ---- Submit ----
  const locationsString = useMemo(() => selected.map((s) => s.raw).join(','), [selected])
  const locationCount = selected.length

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    Array.from(files).slice(0, 3).forEach((file) => {
      const reader = new FileReader()
      reader.onload = () => setImages((prev) => [...prev, reader.result as string])
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (idx: number) => setImages((prev) => prev.filter((_, i) => i !== idx))

  const handleSubmit = async () => {
    if (!productName.trim()) {
      toast.error(t('prospection.toast_product_required'))
      return
    }
    if (selected.length === 0) {
      toast.error(t('prospection.toast_zones_required'))
      return
    }

    setProspectionSubmitting(true)
    try {
      const res = await fetch('/api/prospection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-locale': locale },
        body: JSON.stringify({
          productName: productName.trim(),
          locations: locationsString,
          images: images.join(','),
        }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.campaign) addCampaign(data.campaign)
        const leadsCount = data.leadsFound ?? 0
        // Update local balance if returned
        if (typeof data.balanceAfter === 'number') {
          const store = useProcibleStore.getState()
          store.setCredits(data.balanceAfter)
        }

        // Build a rich description from the AI interpretation if available.
        let description: string | undefined
        if (data.interpretation) {
          const interp = data.interpretation
          const targets = interp.targetSegments?.slice(0, 3).join(', ')
          const exclusions = interp.exclusions?.slice(0, 2).join(', ')
          const parts: string[] = []
          if (targets) parts.push(t('prospection.toast_targets', { targets: `${targets}${interp.targetSegments.length > 3 ? '…' : ''}` }))
          if (exclusions) parts.push(t('prospection.toast_excluded', { targets: `${exclusions}${interp.exclusions.length > 2 ? '…' : ''}` }))
          if (data.creditsUsed > 0) parts.push(t('prospection.toast_free_quota', { count: data.creditsUsed }))
          description = parts.join(' · ')
        } else if (data.creditsUsed > 0) {
          description = t('prospection.toast_free_quota', { count: data.creditsUsed })
        }

        toast.success(
          t('prospection.toast_launched', { leads: leadsCount, zones: locationCount }),
          description ? { description, duration: 7000 } : undefined,
        )

        // If interpretation was generated, show a second informational toast
        if (data.interpretation?.buyerPersona) {
          const interp = data.interpretation
          const modelId = interp.model || ''
          const modelLabel = modelDisplayName(modelId)
          const personaDescription = modelLabel
            ? `${interp.buyerPersona} · ${t('lead_detail.proposed_by', { model: modelLabel })}`
            : interp.buyerPersona
          setTimeout(() => {
            toast.info(t('prospection.toast_ai_applied'), {
              description: personaDescription,
              duration: 6500,
              icon: modelId ? (
                <span
                  className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[8px] font-bold ${modelBadgeColor(modelId)}`}
                  title={t('lead_detail.ai_model_label', { model: modelLabel })}
                >
                  <Cpu className="w-2.5 h-2.5" />
                </span>
              ) : undefined,
            })
          }, 800)
        }

        setProductName('')
        setSelected([])
        setCountryQuery('')
        setCityQuery('')
        setActiveCountry('')
        setImages([])
        setShowProspectionForm(false)
      } else if (res.status === 402) {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || t('prospection.toast_insufficient'), {
          description: err.balance !== undefined ? t('prospection.toast_balance_required', { balance: err.balance, required: err.required }) : undefined,
          duration: 6000,
        })
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || t('prospection.toast_launch_failed'))
      }
    } catch {
      toast.error(t('prospection.toast_connection_error'))
    }
    setProspectionSubmitting(false)
  }

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (cityDebounceRef.current) clearTimeout(cityDebounceRef.current)
      if (cityAbortRef.current) cityAbortRef.current.abort()
    }
  }, [])

  const selectedCountryObj = activeCountry ? ALL_COUNTRIES.find((c) => c.iso2 === activeCountry) : null

  return (
    <AnimatePresence>
      {showProspectionForm && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowProspectionForm(false)}
            className="fixed inset-0 bg-black/50 z-50"
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl max-h-[90vh] overflow-y-auto pb-safe"
          >
            <div className="w-10 h-1 bg-border rounded-full mx-auto mt-3 mb-4" />

            <div className="px-5 pb-4 flex items-center justify-between border-b border-border/30">
              <div>
                <h2 className="text-xl font-bold">{t('prospection.title')}</h2>
                <p className="text-sm text-muted-foreground">{t('prospection.subtitle')}</p>
              </div>
              <button
                onClick={() => setShowProspectionForm(false)}
                className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Product name */}
              <div>
                <label className="text-sm font-medium mb-2 block">{t('prospection.product_label')}</label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder={t('prospection.product_placeholder')}
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7B54]/30"
                />
              </div>

              {/* Zones cibles */}
              <div>
                <label className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Globe2 className="w-4 h-4 text-[#FF7B54]" />
                  {t('prospection.zones_label')}
                  {locationCount > 0 && (
                    <span className="ml-auto text-xs bg-[#FF7B54]/10 text-[#FF7B54] px-2 py-0.5 rounded-full font-medium">
                      {tp(`prospection.zones_count_${locationCount === 1 ? 'one' : 'other'}`, locationCount, { count: locationCount })}
                    </span>
                  )}
                </label>

                {/* Selected chips */}
                {selected.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selected.map((s) => (
                      <div
                        key={s.raw}
                        className="inline-flex items-center gap-1.5 bg-[#FF7B54]/10 text-[#FF7B54] text-xs font-medium px-2.5 py-1.5 rounded-full"
                      >
                        <span>{iso2ToFlag(s.iso2)}</span>
                        <span>{s.city || t('prospection.whole_country', { country: countryNameFR(s.iso2) })}</span>
                        <button onClick={() => removeSelected(s.raw)} className="ml-0.5">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Country autocomplete */}
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    ref={countryInputRef}
                    type="text"
                    value={countryQuery}
                    onChange={(e) => {
                      setCountryQuery(e.target.value)
                      setShowCountryDropdown(true)
                      setHighlightedCountry(-1)
                    }}
                    onFocus={() => setShowCountryDropdown(true)}
                    onBlur={() => setTimeout(() => setShowCountryDropdown(false), 150)}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowDown') {
                        e.preventDefault()
                        setHighlightedCountry((h) => Math.min(h + 1, filteredCountries.length - 1))
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault()
                        setHighlightedCountry((h) => Math.max(h - 1, 0))
                      } else if (e.key === 'Enter' && highlightedCountry >= 0) {
                        e.preventDefault()
                        const c = filteredCountries[highlightedCountry]
                        if (c) pickCountryFromAutocomplete(c.iso2)
                      } else if (e.key === 'Escape') {
                        setShowCountryDropdown(false)
                      }
                    }}
                    placeholder={t('prospection.add_country_placeholder')}
                    className="w-full pl-10 pr-24 py-3 rounded-xl bg-secondary border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7B54]/30"
                  />
                  {selectedCountryObj && (
                    <button
                      onClick={() => {
                        setActiveCountry('')
                        countryInputRef.current?.focus()
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-[#FF7B54]/10 text-[#FF7B54] text-[11px] font-medium px-2 py-1 rounded-full"
                      title={t('prospection.country_filter_title')}
                    >
                      <span>{iso2ToFlag(selectedCountryObj.iso2)}</span>
                      <span className="max-w-[80px] truncate">{countryNameFR(selectedCountryObj.iso2)}</span>
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  {showCountryDropdown && filteredCountries.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-card rounded-xl shadow-lg border border-border/50 max-h-60 overflow-y-auto z-20">
                      {filteredCountries.map((c, idx) => {
                        const fr = countryNameFR(c.iso2, c.name)
                        const alreadySelected = isSelected(c.iso2, null)
                        return (
                          <button
                            key={c.iso2}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => pickCountryFromAutocomplete(c.iso2)}
                            onMouseEnter={() => setHighlightedCountry(idx)}
                            className={`w-full px-3 py-2.5 text-left text-sm hover:bg-secondary flex items-center gap-2.5 ${
                              idx === highlightedCountry ? 'bg-secondary' : ''
                            }`}
                          >
                            <span className="text-lg">{iso2ToFlag(c.iso2)}</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{fr}</p>
                              {fr.toLowerCase() !== c.name.toLowerCase() && (
                                <p className="text-[10px] text-muted-foreground truncate">{c.name}</p>
                              )}
                            </div>
                            <span className="text-[10px] text-muted-foreground">{c.dialCode}</span>
                            {alreadySelected && <Check className="w-3.5 h-3.5 text-[#FF7B54]" />}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Quick "Tout le pays" toggle for the active country */}
                {selectedCountryObj && !isSelected(selectedCountryObj.iso2, null) && (
                  <button
                    onClick={() => addWholeCountrySelection(selectedCountryObj.iso2)}
                    className="text-[11px] text-[#FF7B54] font-medium mb-2 inline-flex items-center gap-1 hover:underline"
                  >
                    <Plus className="w-3 h-3" />
                    {t('prospection.add_whole_country', { country: countryNameFR(selectedCountryObj.iso2) })}
                  </button>
                )}

                {/* City autocomplete */}
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    ref={cityInputRef}
                    type="text"
                    value={cityQuery}
                    onChange={(e) => onCityQueryChange(e.target.value)}
                    onFocus={() => cityQuery.length >= 2 && setShowCityDropdown(true)}
                    onBlur={() => setTimeout(() => setShowCityDropdown(false), 150)}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowDown') {
                        e.preventDefault()
                        setHighlightedCity((h) => Math.min(h + 1, citySuggestions.length - 1))
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault()
                        setHighlightedCity((h) => Math.max(h - 1, 0))
                      } else if (e.key === 'Enter' && highlightedCity >= 0) {
                        e.preventDefault()
                        const s = citySuggestions[highlightedCity]
                        if (s) pickCity(s)
                      } else if (e.key === 'Escape') {
                        setShowCityDropdown(false)
                      }
                    }}
                    placeholder={
                      selectedCountryObj
                        ? t('prospection.city_in_country_placeholder', { country: countryNameFR(selectedCountryObj.iso2) })
                        : t('prospection.city_any_placeholder')
                    }
                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-secondary border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7B54]/30"
                  />
                  {cityLoading && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                  {showCityDropdown && citySuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-card rounded-xl shadow-lg border border-border/50 max-h-60 overflow-y-auto z-20">
                      {citySuggestions.map((s, idx) => {
                        const already = isSelected(s.country, s.name)
                        return (
                          <button
                            key={`${s.country}-${s.name}-${idx}`}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => pickCity(s)}
                            onMouseEnter={() => setHighlightedCity(idx)}
                            className={`w-full px-3 py-2.5 text-left text-sm hover:bg-secondary flex items-center gap-2.5 ${
                              idx === highlightedCity ? 'bg-secondary' : ''
                            }`}
                          >
                            <span className="text-base">{iso2ToFlag(s.country)}</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{s.name}</p>
                              <p className="text-[10px] text-muted-foreground truncate">
                                {[s.county, s.state, countryNameFR(s.country)].filter(Boolean).join(', ')}
                              </p>
                            </div>
                            {already && <Check className="w-3.5 h-3.5 text-[#FF7B54]" />}
                          </button>
                        )
                      })}
                    </div>
                  )}
                  {showCityDropdown && !cityLoading && cityQuery.trim().length >= 2 && citySuggestions.length === 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-card rounded-xl shadow-lg border border-border/50 p-3 text-xs text-muted-foreground flex items-start gap-2 z-20">
                      <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>
                        {t('prospection.city_empty', { query: cityQuery.trim(), country: selectedCountryObj ? countryNameFR(selectedCountryObj.iso2) : '' })}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  {t('prospection.city_helper')}
                </p>
              </div>

              {/* Images */}
              <div>
                <label className="text-sm font-medium mb-2 block">{t('prospection.images_label')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {images.map((img, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                  {images.length < 3 && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 hover:border-[#FF7B54] hover:bg-[#FF7B54]/5 transition-colors"
                    >
                      <ImageIcon className="w-6 h-6 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">{t('prospection.add')}</span>
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              {/* Insufficient credits warning */}
              {insufficientCredits && !prospectionSubmitting && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#EF4444]/8 border border-[#EF4444]/25"
                >
                  <AlertCircle className="w-5 h-5 text-[#EF4444] shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#EF4444]">
                      {t('prospection.insufficient_credits')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t('prospection.balance_required', { balance: credits, required: launchCost })}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setShowProspectionForm(false)
                        navigateTo('credits')
                      }}
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#FF7B54] hover:text-[#FF7B54]/80 transition-colors"
                    >
                      <Coins className="w-3.5 h-3.5" />
                      {t('prospection.recharge')}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={prospectionSubmitting || !productName.trim() || selected.length === 0 || insufficientCredits}
                className={`w-full py-4 rounded-2xl text-white font-bold text-base shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                  insufficientCredits
                    ? 'bg-gradient-to-r from-[#EF4444] to-[#FF7B54]'
                    : 'procible-gradient'
                }`}
                style={{ minHeight: 56 }}
              >
                {prospectionSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t('prospection.submitting')}
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>{t('prospection.submit')}</span>
                    {locationCount > 0 && (
                      <span className="opacity-80 text-sm font-semibold">{tp(`prospection.submit_zones_${locationCount === 1 ? 'one' : 'other'}`, locationCount, { count: locationCount })}</span>
                    )}
                    {launchCost > 0 && (
                      <span
                        className={`ml-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                          insufficientCredits ? 'bg-white/20' : 'bg-white/15'
                        }`}
                      >
                        <Coins className="w-3.5 h-3.5" />
                        {launchCost}
                      </span>
                    )}
                  </>
                )}
              </button>

              <p className="text-xs text-center text-muted-foreground">
                {locationCount > 0
                  ? t('prospection.final_helper_zones', { count: locationCount })
                  : t('prospection.final_helper_single')}
                {launchCost > 0 && (
                  <>
                    {' · '}
                    <span className="inline-flex items-center gap-1 text-[#FF7B54] font-medium">
                      <Zap className="w-3 h-3" />
                      {t('prospection.credit_cost', { count: launchCost })}
                    </span>
                  </>
                )}
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
