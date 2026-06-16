'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useProcibleStore } from '@/store/procible-store'
import { X, Image as ImageIcon, MapPin, Send, Loader2 } from 'lucide-react'
import { useState, useRef } from 'react'
import { toast } from 'sonner'

const CITIES = [
  'Douala', 'Yaoundé', 'Bafoussam', 'Garoua', 'Buea', 'Maroua',
  'Bamenda', 'Ebolowa', 'Kribi', 'Limbé', 'Ngaoundéré', 'Bertoua',
]

export default function ProspectionForm() {
  const { showProspectionForm, setShowProspectionForm, addCampaign, prospectionSubmitting, setProspectionSubmitting } = useProcibleStore()
  const [productName, setProductName] = useState('')
  const [city, setCity] = useState('')
  const [citySearch, setCitySearch] = useState('')
  const [showCityDropdown, setShowCityDropdown] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filteredCities = CITIES.filter(c =>
    c.toLowerCase().includes(citySearch.toLowerCase())
  )

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    Array.from(files).slice(0, 3).forEach(file => {
      const reader = new FileReader()
      reader.onload = () => {
        setImages(prev => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = async () => {
    if (!productName.trim() || !city.trim()) {
      toast.error('Nom du produit et ville requis')
      return
    }

    setProspectionSubmitting(true)
    try {
      const res = await fetch('/api/prospection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: productName.trim(),
          city: city.trim(),
          images: images.join(','),
        }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.campaign) {
          addCampaign(data.campaign)
        }
        toast.success('Campagne lancée ! ProCible cherche des clients...')
        // Reset form
        setProductName('')
        setCity('')
        setCitySearch('')
        setImages([])
        setShowProspectionForm(false)
      } else {
        toast.error('Erreur lors du lancement')
      }
    } catch {
      toast.error('Erreur de connexion')
    }
    setProspectionSubmitting(false)
  }

  return (
    <AnimatePresence>
      {showProspectionForm && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowProspectionForm(false)}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl max-h-[90vh] overflow-y-auto pb-safe"
          >
            {/* Handle */}
            <div className="w-10 h-1 bg-border rounded-full mx-auto mt-3 mb-4" />

            {/* Header */}
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

              {/* City search */}
              <div className="relative">
                <label className="text-sm font-medium mb-2 block">Ville cible</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={citySearch || city}
                    onChange={e => {
                      setCitySearch(e.target.value)
                      setCity('')
                      setShowCityDropdown(true)
                    }}
                    onFocus={() => setShowCityDropdown(true)}
                    placeholder="Rechercher une ville..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7B54]/30"
                  />
                </div>
                {showCityDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-card rounded-xl shadow-lg border border-border/50 max-h-48 overflow-y-auto z-20">
                    {filteredCities.map(c => (
                      <button
                        key={c}
                        onClick={() => {
                          setCity(c)
                          setCitySearch(c)
                          setShowCityDropdown(false)
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-secondary flex items-center gap-2"
                      >
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                        {c}
                      </button>
                    ))}
                  </div>
                )}
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
                disabled={prospectionSubmitting || !productName.trim() || !city.trim()}
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
                    Lancer la campagne
                  </>
                )}
              </button>

              <p className="text-xs text-center text-muted-foreground">
                ProCible analysera votre produit et cherchera des clients qualifiés dans la ville choisie
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
