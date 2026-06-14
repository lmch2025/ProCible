'use client'

import { motion } from 'framer-motion'
import { useHermesStore, type Lead } from '@/store/hermes-store'
import { Phone, MessageCircle, Heart, MapPin, Building2, ArrowLeft, Volume2, Share2, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import ConfettiEffect from './ConfettiEffect'

const sourceConfig: Record<string, { bg: string; text: string; label: string }> = {
  maps: { bg: 'bg-[#4CAF50]', text: 'text-white', label: 'Google Maps' },
  facebook: { bg: 'bg-[#1877F2]', text: 'text-white', label: 'Facebook' },
  instagram: { bg: 'bg-[#E4405F]', text: 'text-white', label: 'Instagram' },
  linkedin: { bg: 'bg-[#0A66C2]', text: 'text-white', label: 'LinkedIn' },
}

export default function LeadDetail() {
  const { leads, selectedLeadId, updateLeadStatus, goBack, decrementCredits } = useHermesStore()
  const [showConfetti, setShowConfetti] = useState(false)
  const [called, setCalled] = useState(false)
  const [messaged, setMessaged] = useState(false)

  const lead = leads.find(l => l.id === selectedLeadId)

  if (!lead) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Lead introuvable</p>
      </div>
    )
  }

  const isSaved = lead.status === 'saved'

  const handleSave = () => {
    updateLeadStatus(lead.id, 'saved')
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 1500)
  }

  const handleCall = () => {
    setCalled(true)
    decrementCredits()
    if (lead.phone) {
      window.open(`tel:${lead.phone}`, '_self')
    }
  }

  const handleWhatsApp = () => {
    setMessaged(true)
    decrementCredits()
    const phone = lead.whatsapp || lead.phone || ''
    const cleanPhone = phone.replace(/\s/g, '')
    window.open(`https://wa.me/${cleanPhone.replace('+', '')}`, '_blank')
  }

  const handleSpeak = () => {
    const utterance = new SpeechSynthesisUtterance(
      `${lead.name}. ${lead.business || ''}. Secteur: ${lead.sector || ''}. Ville: ${lead.city || ''}. ${lead.address || ''}`
    )
    utterance.lang = 'fr-FR'
    speechSynthesis.speak(utterance)
  }

  return (
    <div className="min-h-screen pb-28">
      {showConfetti && <ConfettiEffect />}

      {/* Header */}
      <div className="px-5 pt-4 pb-2 flex items-center gap-3">
        <button onClick={goBack} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-secondary-foreground" />
        </button>
        <h1 className="text-lg font-bold flex-1">Détail du lead</h1>
        <button onClick={handleSpeak} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
          <Volume2 className="w-4 h-4 text-secondary-foreground" />
        </button>
      </div>

      {/* Hero card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 py-4"
      >
        <div className="bg-card rounded-3xl shadow-xl border border-border/30 overflow-hidden">
          {/* Source color bar */}
          <div className={`h-2 w-full ${sourceConfig[lead.source]?.bg || 'bg-[#4CAF50]'}`} />

          <div className="p-6">
            {/* Avatar + Name */}
            <div className="flex items-start gap-4 mb-5">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#FF7B54] to-[#6C3FA9] flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                {lead.name.charAt(0)}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{lead.name}</h2>
                {lead.business && (
                  <p className="text-muted-foreground flex items-center gap-1.5 mt-1">
                    <Building2 className="w-4 h-4" />
                    {lead.business}
                  </p>
                )}
              </div>
            </div>

            {/* Info grid */}
            <div className="space-y-3 mb-6">
              {lead.sector && (
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium">
                    {lead.sector}
                  </span>
                </div>
              )}
              {lead.city && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{lead.city}</span>
                </div>
              )}
              {lead.address && (
                <p className="text-sm text-muted-foreground pl-6">{lead.address}</p>
              )}
              {lead.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm">{lead.phone}</span>
                </div>
              )}
              {lead.email && (
                <p className="text-sm text-muted-foreground pl-6">{lead.email}</p>
              )}
            </div>

            {/* Source badge */}
            <div className="flex items-center justify-between">
              <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${sourceConfig[lead.source]?.bg || 'bg-[#4CAF50]'} ${sourceConfig[lead.source]?.text || 'text-white'}`}>
                {sourceConfig[lead.source]?.label || 'Maps'}
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date(lead.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Action buttons - Giant */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="px-5 space-y-3"
      >
        <button
          onClick={handleCall}
          className="w-full py-5 rounded-2xl bg-[#2EC4B6] text-white font-bold text-lg flex items-center justify-center gap-3 shadow-lg transition-all active:scale-[0.98]"
          style={{ minHeight: 56 }}
        >
          <Phone className="w-6 h-6" />
          Appeler
          {called && <span className="ml-1 text-sm opacity-80">✓</span>}
        </button>

        <button
          onClick={handleWhatsApp}
          className="w-full py-5 rounded-2xl bg-[#25D366] text-white font-bold text-lg flex items-center justify-center gap-3 shadow-lg transition-all active:scale-[0.98]"
          style={{ minHeight: 56 }}
        >
          <MessageCircle className="w-6 h-6" />
          WhatsApp
          {messaged && <span className="ml-1 text-sm opacity-80">✓</span>}
        </button>

        {!isSaved && (
          <button
            onClick={handleSave}
            className="w-full py-5 rounded-2xl hermes-gradient text-white font-bold text-lg flex items-center justify-center gap-3 shadow-lg transition-all active:scale-[0.98]"
            style={{ minHeight: 56 }}
          >
            <Heart className="w-6 h-6" />
            Sauvegarder
          </button>
        )}

        {isSaved && (
          <div className="py-3 text-center text-[#FF7B54] font-semibold flex items-center justify-center gap-2">
            <Heart className="w-5 h-5 fill-[#FF7B54]" />
            Déjà sauvegardé
          </div>
        )}
      </motion.div>
    </div>
  )
}
