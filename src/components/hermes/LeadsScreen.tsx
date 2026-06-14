'use client'

import { motion, useMotionValue, useTransform, AnimatePresence, PanInfo } from 'framer-motion'
import { useHermesStore, type Lead } from '@/store/hermes-store'
import { MapPin, Building2, Heart, X, ChevronLeft, Volume2 } from 'lucide-react'
import { useState } from 'react'
import ConfettiEffect from './ConfettiEffect'

const sourceConfig: Record<string, { bg: string; text: string; label: string; color: string }> = {
  maps: { bg: 'bg-[#4CAF50]', text: 'text-white', label: 'Maps', color: '#4CAF50' },
  facebook: { bg: 'bg-[#1877F2]', text: 'text-white', label: 'Facebook', color: '#1877F2' },
  instagram: { bg: 'bg-[#E4405F]', text: 'text-white', label: 'Instagram', color: '#E4405F' },
  linkedin: { bg: 'bg-[#0A66C2]', text: 'text-white', label: 'LinkedIn', color: '#0A66C2' },
}

export default function LeadsScreen() {
  const { leads, updateLeadStatus, navigateTo, setSelectedLeadId } = useHermesStore()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)
  const [direction, setDirection] = useState<'left' | 'right' | null>(null)

  const activeLeads = leads.filter(l => l.status === 'new')
  const currentLead = activeLeads[currentIndex]

  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-15, 15])
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5])
  const saveOpacity = useTransform(x, [0, 100], [0, 1])
  const skipOpacity = useTransform(x, [-100, 0], [1, 0])

  const handleSwipe = (swipeDirection: 'left' | 'right') => {
    if (!currentLead) return

    setDirection(swipeDirection)
    if (swipeDirection === 'right') {
      updateLeadStatus(currentLead.id, 'saved')
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 1500)
    } else {
      updateLeadStatus(currentLead.id, 'ignored')
    }

    setTimeout(() => {
      setCurrentIndex(Math.min(currentIndex + 1, activeLeads.length - 1))
      setDirection(null)
      x.set(0)
    }, 300)
  }

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 80
    if (info.offset.x > threshold) {
      handleSwipe('right')
    } else if (info.offset.x < -threshold) {
      handleSwipe('left')
    }
  }

  const handleOpenDetail = () => {
    if (currentLead) {
      setSelectedLeadId(currentLead.id)
      navigateTo('lead-detail')
    }
  }

  const handleSpeak = () => {
    if (!currentLead) return
    const utterance = new SpeechSynthesisUtterance(
      `${currentLead.name}. ${currentLead.business || ''}. ${currentLead.city || ''}`
    )
    utterance.lang = 'fr-FR'
    speechSynthesis.speak(utterance)
  }

  const savedLeads = leads.filter(l => l.status === 'saved')
  const ignoredLeads = leads.filter(l => l.status === 'ignored')

  return (
    <div className="min-h-screen flex flex-col pb-28">
      {showConfetti && <ConfettiEffect />}

      {/* Header */}
      <div className="px-5 pt-6 mb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Mes Leads</h1>
          <div className="flex gap-2">
            <span className="px-3 py-1 rounded-full bg-[#FF7B54]/10 text-[#FF7B54] text-xs font-bold">
              {activeLeads.length} nouveaux
            </span>
            <span className="px-3 py-1 rounded-full bg-[#6C3FA9]/10 text-[#6C3FA9] text-xs font-bold">
              {savedLeads.length} sauvés
            </span>
          </div>
        </div>
      </div>

      {/* Swipe cards area */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 relative">
        {currentLead ? (
          <div className="w-full max-w-sm relative" style={{ height: '420px' }}>
            {/* Save indicator */}
            <motion.div
              style={{ opacity: saveOpacity }}
              className="absolute top-6 left-6 z-20 px-4 py-2 bg-[#FF7B54] text-white rounded-xl font-bold text-lg shadow-lg"
            >
              ❤️ Sauver
            </motion.div>

            {/* Skip indicator */}
            <motion.div
              style={{ opacity: skipOpacity }}
              className="absolute top-6 right-6 z-20 px-4 py-2 bg-muted text-muted-foreground rounded-xl font-bold text-lg shadow-lg"
            >
              Ignorer ✕
            </motion.div>

            {/* Card */}
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              style={{ x, rotate, opacity }}
              onDragEnd={handleDragEnd}
              onClick={handleOpenDetail}
              className="absolute inset-0 bg-card rounded-3xl shadow-xl border border-border/30 cursor-grab active:cursor-grabbing overflow-hidden"
              whileTap={{ scale: 0.98 }}
            >
              {/* Top gradient bar */}
              <div className={`h-2 w-full ${sourceConfig[currentLead.source]?.bg || 'bg-[#4CAF50]'}`} />

              <div className="p-6">
                {/* Avatar and name */}
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF7B54] to-[#6C3FA9] flex items-center justify-center text-white text-2xl font-bold shadow-md">
                    {currentLead.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold">{currentLead.name}</h3>
                    {currentLead.business && (
                      <p className="text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3.5 h-3.5" />
                        {currentLead.business}
                      </p>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-3 mb-6">
                  {currentLead.sector && (
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-secondary text-secondary-foreground text-sm">
                        {currentLead.sector}
                      </span>
                    </div>
                  )}
                  {currentLead.city && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{currentLead.city}</span>
                    </div>
                  )}
                  {currentLead.address && (
                    <p className="text-xs text-muted-foreground pl-6">{currentLead.address}</p>
                  )}
                </div>

                {/* Source badge */}
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${sourceConfig[currentLead.source]?.bg || 'bg-[#4CAF50]'} ${sourceConfig[currentLead.source]?.text || 'text-white'}`}>
                    {sourceConfig[currentLead.source]?.label || 'Maps'}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleSpeak() }}
                    className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
                  >
                    <Volume2 className="w-4 h-4 text-secondary-foreground" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center px-8"
          >
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-[#FF7B54]" />
            </div>
            <h3 className="text-xl font-bold mb-2">Tout traité !</h3>
            <p className="text-muted-foreground mb-6">
              Revenez demain, Hermes cherchera de nouveaux prospects cette nuit.
            </p>
            {savedLeads.length > 0 && (
              <button
                onClick={() => navigateTo('leads')}
                className="px-6 py-3 rounded-2xl hermes-gradient text-white font-semibold"
              >
                Voir mes leads sauvés ({savedLeads.length})
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* Action buttons */}
      {currentLead && (
        <div className="px-5 py-4 flex items-center justify-center gap-6">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleSwipe('left')}
            className="w-16 h-16 rounded-full bg-muted flex items-center justify-center shadow-md"
          >
            <X className="w-7 h-7 text-muted-foreground" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleSwipe('right')}
            className="w-16 h-16 rounded-full hermes-gradient flex items-center justify-center shadow-lg"
          >
            <Heart className="w-7 h-7 text-white" />
          </motion.button>
        </div>
      )}

      {/* Saved leads list (accessible via swipe from bottom) */}
      {savedLeads.length > 0 && (
        <div className="px-5 pb-4">
          <button
            onClick={() => {
              // Toggle to show saved leads view
              setSelectedLeadId(savedLeads[0].id)
              navigateTo('lead-detail')
            }}
            className="w-full py-3 rounded-2xl bg-secondary text-secondary-foreground font-medium text-sm flex items-center justify-center gap-2"
          >
            <Heart className="w-4 h-4" />
            {savedLeads.length} leads sauvés · {ignoredLeads.length} ignorés
          </button>
        </div>
      )}
    </div>
  )
}
