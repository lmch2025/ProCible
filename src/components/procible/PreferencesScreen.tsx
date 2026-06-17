'use client'

import { motion } from 'framer-motion'
import { useProcibleStore, type UserPreference } from '@/store/procible-store'
import { ArrowLeft, Store, MapPin, Building2, Utensils, Scissors, Wrench, Car, Monitor, Shirt, Heart, Dumbbell, GraduationCap, Briefcase } from 'lucide-react'
import { useState } from 'react'
import { useI18n } from '@/lib/i18n'

const sectors = [
  { id: 'restauration', labelKey: 'preferences.sectors_list.restauration', icon: Utensils, color: '#FF7B54' },
  { id: 'commerce', labelKey: 'preferences.sectors_list.commerce', icon: Store, color: '#6C3FA9' },
  { id: 'beaute', labelKey: 'preferences.sectors_list.beaute', icon: Scissors, color: '#E4405F' },
  { id: 'technologie', labelKey: 'preferences.sectors_list.tech', icon: Monitor, color: '#2EC4B6' },
  { id: 'mode', labelKey: 'preferences.sectors_list.mode', icon: Shirt, color: '#FFB347' },
  { id: 'automobile', labelKey: 'preferences.sectors_list.auto', icon: Car, color: '#0A66C2' },
  { id: 'sante', labelKey: 'preferences.sectors_list.sante', icon: Heart, color: '#4CAF50' },
  { id: 'services', labelKey: 'preferences.sectors_list.services', icon: Wrench, color: '#9B6FD0' },
  { id: 'sport', labelKey: 'preferences.sectors_list.sport', icon: Dumbbell, color: '#FF7B54' },
  { id: 'education', labelKey: 'preferences.sectors_list.education', icon: GraduationCap, color: '#6C3FA9' },
  { id: 'btp', labelKey: 'preferences.sectors_list.btp', icon: Building2, color: '#2EC4B6' },
  { id: 'finance', labelKey: 'preferences.sectors_list.finance', icon: Briefcase, color: '#FFB347' },
]

const cities = [
  { id: 'douala', labelKey: 'preferences.cities.Douala' },
  { id: 'yaounde', labelKey: 'preferences.cities.Yaoundé' },
  { id: 'bafoussam', labelKey: 'preferences.cities.Bafoussam' },
  { id: 'garoua', labelKey: 'preferences.cities.Garoua' },
  { id: 'buea', labelKey: 'preferences.cities.Buea' },
  { id: 'maroua', labelKey: 'preferences.cities.Maroua' },
  { id: 'bamenda', labelKey: 'preferences.cities.Bamenda' },
  { id: 'ebolowa', labelKey: 'preferences.cities.Ebolowa' },
  { id: 'douala-akwa', labelKey: 'preferences.cities.Akwa' },
  { id: 'douala-bonapriso', labelKey: 'preferences.cities.Bonapriso' },
  { id: 'yaounde-bastos', labelKey: 'preferences.cities.Bastos' },
  { id: 'yaounde-centre', labelKey: 'preferences.cities.Centre' },
]

export default function PreferencesScreen() {
  const { preferences, setPreferences, goBack } = useProcibleStore()
  const { t, locale } = useI18n()
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

  const handleSave = async () => {
    setPreferences(localPrefs)
    // Persist to backend
    try {
      await fetch('/api/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-locale': locale },
        body: JSON.stringify(localPrefs),
      })
    } catch {}
    goBack()
  }

  return (
    <div className="pb-28">
      {/* Header - sticky */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl px-5 pt-4 pb-4 flex items-center gap-3">
        <button onClick={goBack} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-secondary-foreground" />
        </button>
        <h1 className="text-lg font-bold">{t('preferences.title')}</h1>
      </div>

      <div className="px-5 mt-2">
        {/* Sectors */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
            <Store className="w-4 h-4 text-[#FF7B54]" />
            {t('preferences.sectors')}
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
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSelected ? 'bg-[#FF7B54]/15' : 'bg-secondary'}`}>
                    <IconComp className="w-5 h-5" style={{ color: isSelected ? sector.color : undefined }} />
                  </div>
                  <span className={`text-[11px] font-medium ${isSelected ? 'text-[#FF7B54]' : 'text-muted-foreground'}`}>
                    {t(sector.labelKey)}
                  </span>
                </motion.button>
              )
            })}
          </div>
        </motion.div>

        {/* Cities */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
          <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#6C3FA9]" />
            {t('preferences.zones')}
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
                    {t(city.labelKey)}
                  </span>
                </motion.button>
              )
            })}
          </div>
        </motion.div>

        {/* Save button */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <button
            onClick={handleSave}
            className="w-full py-4 rounded-2xl procible-gradient text-white font-bold text-lg shadow-lg transition-all active:scale-[0.98]"
            style={{ minHeight: 56 }}
          >
            {t('preferences.save')}
          </button>
          <p className="text-xs text-center text-muted-foreground mt-2">
            {t('preferences.helper')}
          </p>
        </motion.div>
      </div>
    </div>
  )
}
