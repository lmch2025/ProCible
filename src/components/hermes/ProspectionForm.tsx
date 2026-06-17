'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useHermesStore, type ProspectionCampaign } from '@/store/hermes-store'
import { CITIES, searchCities, getCityLabel } from '@/lib/constants'
import {
  Search, MapPin, Package, Camera, X, Check, ChevronRight,
  Sparkles, ImagePlus, Trash2, Zap, Loader2
} from 'lucide-react'

interface CitySuggestion {
  id: string
  label: string
  region: string
}

export default function ProspectionForm() {
  const {
    showProspectionForm, setShowProspectionForm,
    addCampaign, prospectionSubmitting, setProspectionSubmitting,
    userId
  } = useHermesStore()

  // Form state
  const [productName, setProductName] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [cityQuery, setCityQuery] = useState('')
  const [selectedCity, setSelectedCity] = useState<CitySuggestion | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const cityInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLDivElement>(null)

  // Predictive city search
  const handleCityInput = useCallback((value: string) => {
    setCityQuery(value)
    setSelectedCity(null)
    setError(null)

    if (value.trim().length > 0) {
      const results = searchCities(value)
      setSuggestions(results.map(c => ({ id: c.id, label: c.label, region: c.region })))
      setShowSuggestions(true)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [])

  const selectCity = useCallback((city: CitySuggestion) => {
    setSelectedCity(city)
    setCityQuery(city.label)
    setShowSuggestions(false)
    setError(null)
  }, [])

  // Image handling
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach(file => {
      if (images.length >= 5) return // Max 5 images
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        setImages(prev => {
          if (prev.length >= 5) return prev
          return [...prev, result]
        })
      }
      reader.readAsDataURL(file)
    })

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [images.length])

  const removeImage = useCallback((index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }, [])

  // Submit form
  const handleSubmit = useCallback(async () => {
    // Validate
    if (!productName.trim()) {
      setError('Veuillez entrer le nom de votre produit ou service')
      return
    }
    if (!selectedCity) {
      setError('Veuillez sélectionner une ville dans la liste')
      return
    }

    setProspectionSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/prospection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: productName.trim(),
          images,
          city: selectedCity.id,
          userId: userId || 'demo-user',
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Erreur lors de la création')
        return
      }

      const campaign = await res.json()

      // Add to store with properly typed images array
      const storeCampaign: ProspectionCampaign = {
        id: campaign.id,
        productName: campaign.productName,
        images: campaign.images ? campaign.images.split(',').filter((i: string) => i) : [],
        city: campaign.city,
        status: campaign.status,
        leadsFound: campaign.leadsFound,
        userId: campaign.userId,
        createdAt: campaign.createdAt,
        updatedAt: campaign.updatedAt,
      }
      addCampaign(storeCampaign)

      // Show success
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        setShowProspectionForm(false)
        // Reset form
        setProductName('')
        setImages([])
        setCityQuery('')
        setSelectedCity(null)
      }, 1500)

    } catch {
      setError('Erreur réseau. Veuillez réessayer.')
    } finally {
      setProspectionSubmitting(false)
    }
  }, [productName, selectedCity, images, userId, addCampaign, setProspectionSubmitting, setShowProspectionForm])

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (formRef.current && !formRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Reset form when opening
  useEffect(() => {
    if (showProspectionForm) {
      setProductName('')
      setImages([])
      setCityQuery('')
      setSelectedCity(null)
      setError(null)
      setSuccess(false)
    }
  }, [showProspectionForm])

  if (!showProspectionForm) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center"
        onClick={(e) => {
          if (e.target === e.currentTarget) setShowProspectionForm(false)
        }}
      >
        <motion.div
          ref={formRef}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-lg bg-background rounded-t-3xl max-h-[90vh] overflow-y-auto custom-scrollbar"
        >
          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-border" />
          </div>

          {/* Header */}
          <div className="px-5 pt-2 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold hermes-gradient-text">Lancer une prospection</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Hermes cherchera pour vous</p>
            </div>
            <button
              onClick={() => setShowProspectionForm(false)}
              className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
            >
              <X className="w-5 h-5 text-secondary-foreground" />
            </button>
          </div>

          {/* Success overlay */}
          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mx-5 mb-4 p-6 rounded-2xl bg-[#4CAF50]/10 border border-[#4CAF50]/30 flex flex-col items-center gap-2"
            >
              <div className="w-14 h-14 rounded-full bg-[#4CAF50]/20 flex items-center justify-center">
                <Check className="w-7 h-7 text-[#4CAF50]" />
              </div>
              <p className="font-bold text-[#4CAF50]">Prospection lancée !</p>
              <p className="text-xs text-muted-foreground text-center">
                Hermes va rechercher des prospects pour {productName} à {selectedCity?.label}
              </p>
            </motion.div>
          )}

          {!success && (
            <div className="px-5 pb-8 space-y-5">
              {/* Product/Service Name */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
              >
                <label className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#FF7B54]" />
                  Produit / Service
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => { setProductName(e.target.value); setError(null) }}
                    placeholder="Ex: Coiffure homme, Pizza, Réparation PC..."
                    className="w-full px-4 py-3.5 pl-11 rounded-2xl bg-card border-2 border-border/50 text-foreground placeholder:text-muted-foreground/50 focus:border-[#FF7B54] focus:outline-none transition-all text-sm"
                    style={{ minHeight: 56 }}
                    maxLength={100}
                  />
                  <Package className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5 ml-1">
                  Décrivez ce que vous vendez pour aider Hermes à cibler les bons prospects
                </p>
              </motion.div>

              {/* Images Upload */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <label className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-[#6C3FA9]" />
                  Photos du produit
                  <span className="text-[11px] text-muted-foreground font-normal">(optionnel, max 5)</span>
                </label>

                <div className="flex gap-2 flex-wrap">
                  {/* Existing images */}
                  {images.map((img, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-border/50"
                    >
                      <img
                        src={img}
                        alt={`Photo ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </motion.div>
                  ))}

                  {/* Add image button */}
                  {images.length < 5 && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-20 h-20 rounded-xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-1 hover:border-[#6C3FA9]/50 transition-colors bg-card"
                    >
                      <ImagePlus className="w-5 h-5 text-muted-foreground/50" />
                      <span className="text-[9px] text-muted-foreground/50">Ajouter</span>
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
              </motion.div>

              {/* City with predictive search */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="relative"
              >
                <label className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#2EC4B6]" />
                  Ville de prospection
                </label>
                <div className="relative">
                  <input
                    ref={cityInputRef}
                    type="text"
                    value={cityQuery}
                    onChange={(e) => handleCityInput(e.target.value)}
                    onFocus={() => {
                      if (cityQuery.trim().length > 0 && suggestions.length > 0) {
                        setShowSuggestions(true)
                      }
                    }}
                    placeholder="Tapez le nom d'une ville..."
                    className={`w-full px-4 py-3.5 pl-11 rounded-2xl bg-card border-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none transition-all text-sm ${
                      selectedCity
                        ? 'border-[#2EC4B6]'
                        : error && !selectedCity
                          ? 'border-[#EF4444]'
                          : 'border-border/50 focus:border-[#2EC4B6]'
                    }`}
                    style={{ minHeight: 56 }}
                  />
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                    {selectedCity ? (
                      <Check className="w-4 h-4 text-[#2EC4B6]" />
                    ) : (
                      <Search className="w-4 h-4 text-muted-foreground/40" />
                    )}
                  </div>
                  {selectedCity && (
                    <button
                      onClick={() => {
                        setSelectedCity(null)
                        setCityQuery('')
                        setShowSuggestions(false)
                      }}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#2EC4B6]/10 flex items-center justify-center"
                    >
                      <X className="w-3.5 h-3.5 text-[#2EC4B6]" />
                    </button>
                  )}
                </div>

                {/* Selected city chip */}
                {selectedCity && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2EC4B6]/10 w-fit"
                  >
                    <MapPin className="w-3 h-3 text-[#2EC4B6]" />
                    <span className="text-sm font-medium text-[#2EC4B6]">{selectedCity.label}</span>
                    <span className="text-[11px] text-muted-foreground">· {selectedCity.region}</span>
                  </motion.div>
                )}

                {/* Suggestions dropdown */}
                <AnimatePresence>
                  {showSuggestions && suggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="absolute z-50 w-full mt-1 bg-card rounded-2xl border border-border/50 shadow-xl overflow-hidden max-h-48 overflow-y-auto custom-scrollbar"
                    >
                      {suggestions.map((city) => (
                        <button
                          key={city.id}
                          onClick={() => selectCity(city)}
                          className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[#2EC4B6]/5 transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-lg bg-[#2EC4B6]/10 flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-4 h-4 text-[#2EC4B6]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{city.label}</p>
                            <p className="text-[11px] text-muted-foreground">{city.region}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground/30 flex-shrink-0" />
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* No results message */}
                {showSuggestions && cityQuery.trim().length > 0 && suggestions.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute z-50 w-full mt-1 bg-card rounded-2xl border border-border/50 shadow-xl p-4 text-center"
                  >
                    <p className="text-sm text-muted-foreground">Aucune ville trouvée</p>
                    <p className="text-[11px] text-muted-foreground/60 mt-1">
                      Veuillez sélectionner une ville de la liste
                    </p>
                  </motion.div>
                )}

                <p className="text-[11px] text-muted-foreground mt-1.5 ml-1">
                  Seules les villes du système sont sélectionnables
                </p>
              </motion.div>

              {/* Error message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-4 py-3 rounded-2xl bg-[#EF4444]/10 border border-[#EF4444]/30"
                  >
                    <p className="text-sm text-[#EF4444]">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit button */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                onClick={handleSubmit}
                disabled={prospectionSubmitting || !productName.trim() || !selectedCity}
                className="w-full py-4 rounded-2xl hermes-gradient text-white font-bold text-lg shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
                style={{ minHeight: 56 }}
              >
                {prospectionSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Lancement en cours...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Lancer la prospection
                  </>
                )}
              </motion.button>

              {/* Help text */}
              <div className="flex items-start gap-2 px-1">
                <Sparkles className="w-4 h-4 text-[#FF7B54] flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Hermes va rechercher automatiquement des prospects correspondant à votre produit dans la ville sélectionnée. Vous serez notifié dès que des leads sont trouvés.
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
