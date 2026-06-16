'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useProcibleStore } from '@/store/procible-store'
import { X, Image as ImageIcon, MapPin, Send, Loader2, Plus, ChevronDown, ChevronRight, Globe2, Check, Trash2 } from 'lucide-react'
import { useState, useRef, useMemo } from 'react'
import { toast } from 'sonner'
import { COUNTRIES, parseLocations, countLocations } from '@/lib/locations'

interface SelectedEntry {
  raw: string // "ISO2:CityName" or "ISO2:all"
  iso2: string
  city: string | null
}

export default function ProspectionForm() {
  const { showProspectionForm, setShowProspectionForm, addCampaign, prospectionSubmitting, setProspectionSubmitting } = useProcibleStore()
  const [productName, setProductName] = useState('')
  const [selected, setSelected] = useState<SelectedEntry[]>([])
  const [expandedCountry, setExpandedCountry] = useState<string | null>('CM')
  const [countrySearch, setCountrySearch] = useState('')
  const [images, setImages] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filteredCountries = useMemo(() => {
    if (!countrySearch) return COUNTRIES
    const q = countrySearch.toLowerCase()
    return COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.iso2.toLowerCase().includes(q) || c.cities.some((city) => city.toLowerCase().includes(q)),
    )
  }, [countrySearch])

  const isSelected = (iso2: string, city: string | null) =>
    selected.some((s) => s.iso2 === iso2 && s.city === city)

  const toggleCity = (iso2: string, city: string) => {
    if (isSelected(iso2, city)) {
      setSelected((prev) => prev.filter((s) => !(s.iso2 === iso2 && s.city === city)))
    } else {
      // Adding a city unselects the "all country" entry (if any) for the same country.
      setSelected((prev) => [...prev.filter((s) => !(s.iso2 === iso2 && s.city === null)), { raw: `${iso2}:${city}`, iso2, city }])
    }
  }

  const toggleCountry = (iso2: string) => {
    if (isSelected(iso2, null)) {
      setSelected((prev) => prev.filter((s) => !(s.iso2 === iso2 && s.city === null)))
    } else {
      // Selecting "all country" removes individual city selections for that country.
      setSelected((prev) => [...prev.filter((s) => s.iso2 !== iso2), { raw: `${iso2}:all`, iso2, city: null }])
    }
  }

  const removeSelected = (raw: string) => setSelected((prev) => prev.filter((s) => s.raw !== raw))

  const locationsString = useMemo(() => selected.map((s) => s.raw).join(','), [selected])
  const locationCount = selected.length

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    Array.from(files).slice(0, 3).forEach(file => {
      const reader = new FileReader()
      reader.onload = () => setImages(prev => [...prev, reader.result as string])
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (idx: number) => setImages(prev => prev.filter((_, i) => i !== idx))

  const handleSubmit = async () => {
    if (!productName.trim()) {
      toast.error('Nom du produit requis')
      return
    }
    if (selected.length === 0) {
      toast.error('Sélectionnez au moins une ville ou un pays')
      return
    }

    setProspectionSubmitting(true)
    try {
      const res = await fetch('/api/prospection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: productName.trim(),
          locations: locationsString,
          images: images.join(','),
        }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.campaign) {
          addCampaign(data.campaign)
        }
        const leadsCount = data.leadsFound ?? 0
        toast.success(`Campagne lancée ! ${leadsCount} client${leadsCount > 1 ? 's' : ''} trouvé${leadsCount > 1 ? 's' : ''} dans ${locationCount} zone${locationCount > 1 ? 's' : ''}.`)
        // Reset
        setProductName('')
        setSelected([])
        setCountrySearch('')
        setImages([])
        setShowProspectionForm(false)
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'Erreur lors du lancement')
      }
    } catch {
      toast.error('Erreur de connexion')
    }
    setProspectionSubmitting(false)
  }

  const countryOf = (iso2: string) => COUNTRIES.find((c) => c.iso2 === iso2)

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
                <h2 className="text-xl font-bold">Nouvelle campagne</h2>
                <p className="text-sm text-muted-foreground">ProCible trouvera des clients pour vous</p>
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
                <label className="text-sm font-medium mb-2 block">Nom du produit / service</label>
                <input
                  type="text"
                  value={productName}
                  onChange={e => setProductName(e.target.value)}
                  placeholder="Ex : Restaurant Le Palmier"
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7B54]/30"
                />
              </div>

              {/* Location selector */}
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <Globe2 className="w-4 h-4 text-[#FF7B54]" />
                  Zones cibles
                  {locationCount > 0 && (
                    <span className="ml-auto text-xs bg-[#FF7B54]/10 text-[#FF7B54] px-2 py-0.5 rounded-full font-medium">
                      {locationCount} zone{locationCount > 1 ? 's' : ''}
                    </span>
                  )}
                </label>

                {/* Selected chips */}
                {selected.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selected.map((s) => {
                      const country = countryOf(s.iso2)
                      return (
                        <div
                          key={s.raw}
                          className="inline-flex items-center gap-1.5 bg-[#FF7B54]/10 text-[#FF7B54] text-xs font-medium px-2.5 py-1.5 rounded-full"
                        >
                          <span>{country?.flag}</span>
                          <span>{s.city || `Tout ${country?.name || s.iso2}`}</span>
                          <button onClick={() => removeSelected(s.raw)} className="ml-0.5">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Country search */}
                <div className="relative mb-2">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={countrySearch}
                    onChange={e => setCountrySearch(e.target.value)}
                    placeholder="Rechercher un pays ou une ville..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7B54]/30"
                  />
                </div>

                {/* Country list */}
                <div className="bg-card rounded-xl border border-border/50 max-h-72 overflow-y-auto">
                  {filteredCountries.length === 0 && (
                    <div className="p-4 text-sm text-muted-foreground text-center">Aucun résultat</div>
                  )}
                  {filteredCountries.map((country) => {
                    const isExpanded = expandedCountry === country.iso2
                    const isAllSelected = isSelected(country.iso2, null)
                    const selectedCitiesInCountry = selected.filter((s) => s.iso2 === country.iso2 && s.city !== null)
                    return (
                      <div key={country.iso2} className="border-b border-border/30 last:border-b-0">
                        {/* Country header */}
                        <div className="flex items-center">
                          <button
                            onClick={() => setExpandedCountry(isExpanded ? null : country.iso2)}
                            className="flex-1 px-3 py-3 flex items-center gap-2 text-left hover:bg-secondary/50"
                          >
                            {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                            <span className="text-lg">{country.flag}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{country.name}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {selectedCitiesInCountry.length > 0
                                  ? `${selectedCitiesInCountry.length} ville${selectedCitiesInCountry.length > 1 ? 's' : ''} sélectionnée${selectedCitiesInCountry.length > 1 ? 's' : ''}`
                                  : `${country.cities.length} villes`}
                              </p>
                            </div>
                          </button>
                          {/* Select whole country */}
                          <button
                            onClick={() => toggleCountry(country.iso2)}
                            className={`px-3 py-1.5 mr-2 rounded-full text-[10px] font-semibold transition-colors ${
                              isAllSelected
                                ? 'bg-[#FF7B54] text-white'
                                : 'bg-[#FF7B54]/10 text-[#FF7B54] hover:bg-[#FF7B54]/20'
                            }`}
                          >
                            {isAllSelected ? '✓ Tout' : 'Tout le pays'}
                          </button>
                        </div>

                        {/* Cities */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="px-3 pb-3 grid grid-cols-2 gap-1.5">
                                {country.cities.map((city) => {
                                  const sel = isSelected(country.iso2, city)
                                  return (
                                    <button
                                      key={city}
                                      onClick={() => toggleCity(country.iso2, city)}
                                      className={`px-2.5 py-2 rounded-lg text-xs text-left flex items-center gap-1.5 transition-colors ${
                                        sel
                                          ? 'bg-[#FF7B54] text-white font-medium'
                                          : 'bg-secondary/60 hover:bg-secondary'
                                      }`}
                                    >
                                      {sel ? <Check className="w-3 h-3 shrink-0" /> : <Plus className="w-3 h-3 shrink-0 opacity-50" />}
                                      <span className="truncate">{city}</span>
                                    </button>
                                  )
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  Sélectionnez une ou plusieurs villes, ou « Tout le pays » pour couvrir tout le territoire.
                </p>
              </div>

              {/* Images */}
              <div>
                <label className="text-sm font-medium mb-2 block">Images du produit (optionnel)</label>
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
                      <span className="text-[10px] text-muted-foreground">Ajouter</span>
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

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={prospectionSubmitting || !productName.trim() || selected.length === 0}
                className="w-full py-4 rounded-2xl procible-gradient text-white font-bold text-base shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ minHeight: 56 }}
              >
                {prospectionSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Lancement en cours...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Lancer la campagne{locationCount > 0 ? ` · ${locationCount} zone${locationCount > 1 ? 's' : ''}` : ''}
                  </>
                )}
              </button>

              <p className="text-xs text-center text-muted-foreground">
                ProCible analysera votre produit et cherchera des clients qualifiés dans {locationCount > 0 ? `${locationCount} zone${locationCount > 1 ? 's' : ''}` : 'les zones sélectionnées'}
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
