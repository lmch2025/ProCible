'use client'

import { motion } from 'framer-motion'
import { useHermesStore, type UserPreference } from '@/store/hermes-store'
import { ArrowLeft, Store, MapPin, Building2, Utensils, Scissors, Wrench, Car, Monitor, Shirt, Heart, Dumbbell, GraduationCap, Briefcase } from 'lucide-react'
import { useState } from 'react'

const sectors = [
  { id: 'restauration', label: 'Restauration', icon: Utensils, color: '#FF7B54' },
  { id: 'commerce', label: 'Commerce', icon: Store, color: '#6C3FA9' },
  { id: 'beaute', label: 'Beauté', icon: Scissors, color: '#E4405F' },
  { id: 'technologie', label: 'Tech', icon: Monitor, color: '#2EC4B6' },
  { id: 'mode', label: 'Mode', icon: Shirt, color: '#FFB347' },
  { id: 'automobile', label: 'Auto', icon: Car, color: '#0A66C2' },
  { id: 'sante', label: 'Santé', icon: Heart, color: '#4CAF50' },
  { id: 'services', label: 'Services', icon: Wrench, color: '#9B6FD0' },
  { id: 'sport', label: 'Sport', icon: Dumbbell, color: '#FF7B54' },
  { id: 'education', label: 'Éducation', icon: GraduationCap, color: '#6C3FA9' },
  { id: 'btp', label: 'BTP', icon: Building2, color: '#2EC4B6' },
  { id: 'finance', label: 'Finance', icon: Briefcase, color: '#FFB347' },
]

const cities = [
  { id: 'douala', label: 'Douala' },
  { id: 'yaounde', label: 'Yaoundé' },
  { id: 'bafoussam', label: 'Bafoussam' },
  { id: 'garoua', label: 'Garoua' },
  { id: 'buea', label: 'Buea' },
  { id: 'maroua', label: 'Maroua' },
  { id: 'bamenda', label: 'Bamenda' },
  { id: 'ebolowa', label: 'Ebolowa' },
  { id: 'douala-akwa', label: 'Akwa' },
  { id: 'douala-bonapriso', label: 'Bonapriso' },
  { id: 'yaounde-bastos', label: 'Bastos' },
  { id: 'yaounde-centre', label: 'Centre' },
]

export default function PreferencesScreen() {
  const { preferences, setPreferences, goBack } = useHermesStore()
  const [localPrefs, setLocalPrefs] = useState<UserPreference>(preferences)

  const toggleSector = (id: string) => {
    setLocalPrefs(prev => ({
      ...prev,
      sectors: prev.sectors.includes(id)
        ? prev.sectors.filter(s => s !== id)
        : [...prev.sectors, id],
    }))
  }

  const toggleCity = (id: string) => {
    setLocalPrefs(prev => ({
      ...prev,
      cities: prev.cities.includes(id)
        ? prev.cities.filter(c => c !== id)
        : [...prev.cities, id],
    }))
  }

  const handleSave = () => {
    setPreferences(localPrefs)
    goBack()
  }

  return (
    <div className="min-h-screen pb-28">
      {/* Header */}
      <div className="px-5 pt-4 pb-4 flex items-center gap-3">
        <button onClick={goBack} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-secondary-foreground" />
        </button>
        <h1 className="text-lg font-bold">Préférences</h1>
      </div>

      {/* Sectors */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 mb-6"
      >
        <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
          <Store className="w-4 h-4 text-[#FF7B54]" />
          Secteurs d&apos;activité
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {sectors.map((sector) => {
            const isSelected = localPrefs.sectors.includes(sector.id)
            const IconComp = sector.icon
            return (
              <motion.button
                key={sector.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleSector(sector.id)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all ${
                  isSelected
                    ? 'border-[#FF7B54] bg-[#FF7B54]/5 shadow-sm'
                    : 'border-border/50 bg-card'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isSelected ? 'bg-[#FF7B54]/15' : 'bg-secondary'
                  }`}
                >
                  <IconComp
                    className="w-5 h-5"
                    style={{ color: isSelected ? sector.color : undefined }}
                  />
                </div>
                <span className={`text-[11px] font-medium ${isSelected ? 'text-[#FF7B54]' : 'text-muted-foreground'}`}>
                  {sector.label}
                </span>
              </motion.button>
            )
          })}
        </div>
      </motion.div>

      {/* Cities */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="px-5 mb-6"
      >
        <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#6C3FA9]" />
          Zones géographiques
        </h2>
        <div className="flex flex-wrap gap-2">
          {cities.map((city) => {
            const isSelected = localPrefs.cities.includes(city.id)
            return (
              <motion.button
                key={city.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleCity(city.id)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                  isSelected
                    ? 'border-[#6C3FA9] bg-[#6C3FA9]/10 text-[#6C3FA9]'
                    : 'border-border/50 bg-card text-muted-foreground'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3 h-3" />
                  {city.label}
                </span>
              </motion.button>
            )
          })}
        </div>
      </motion.div>

      {/* Save button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="px-5"
      >
        <button
          onClick={handleSave}
          className="w-full py-4 rounded-2xl hermes-gradient text-white font-bold text-lg shadow-lg transition-all active:scale-[0.98]"
          style={{ minHeight: 56 }}
        >
          Enregistrer
        </button>
        <p className="text-xs text-center text-muted-foreground mt-2">
          Hermes utilisera ces préférences pour ses recherches nocturnes
        </p>
      </motion.div>
    </div>
  )
}
