'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useProcibleStore, STAGE_CONFIG, STAGE_ORDER, type LeadStage } from '@/store/procible-store'
import { Phone, MessageCircle, MapPin, Building2, ArrowLeft, Volume2, Clock, Copy, Check, ChevronDown, Send, FileText, Lightbulb, Zap } from 'lucide-react'
import { useState } from 'react'
import ConfettiEffect from './ConfettiEffect'

const sourceConfig: Record<string, { bg: string; text: string; label: string }> = {
  maps: { bg: 'bg-[#4CAF50]', text: 'text-white', label: 'Google Maps' },
  facebook: { bg: 'bg-[#1877F2]', text: 'text-white', label: 'Facebook' },
  instagram: { bg: 'bg-[#E4405F]', text: 'text-white', label: 'Instagram' },
  linkedin: { bg: 'bg-[#0A66C2]', text: 'text-white', label: 'LinkedIn' },
}

const contactTypeIcons: Record<string, { icon: typeof Phone; color: string; label: string }> = {
  appel: { icon: Phone, color: 'text-[#2EC4B6]', label: 'Appel' },
  whatsapp: { icon: MessageCircle, color: 'text-[#25D366]', label: 'WhatsApp' },
  email: { icon: Send, color: 'text-[#6C3FA9]', label: 'Email' },
  visite: { icon: MapPin, color: 'text-[#FF7B54]', label: 'Visite' },
  note: { icon: FileText, color: 'text-[#FFB347]', label: 'Note' },
}

export default function LeadDetail() {
  const { leads, selectedLeadId, updateLeadStage, goBack, decrementCredits, aiDraft, aiDraftLoading, setAiDraft, setAiDraftLoading, setAiModel, logContact } = useProcibleStore()
  const [showConfetti, setShowConfetti] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showStagePicker, setShowStagePicker] = useState(false)
  const [showAiDraft, setShowAiDraft] = useState(false)
  const [aiChannel, setAiChannel] = useState<'whatsapp' | 'appel' | 'email'>('whatsapp')

  const lead = leads.find(l => l.id === selectedLeadId)

  if (!lead) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Client introuvable</p>
      </div>
    )
  }

  const stageConfig = STAGE_CONFIG[lead.stage]
  const contacts = lead.contacts || []

  const daysSince = lead.lastContactAt
    ? Math.floor((Date.now() - new Date(lead.lastContactAt).getTime()) / (1000 * 60 * 60 * 24))
    : null

  const handleGenerateDraft = async (channel: 'whatsapp' | 'appel' | 'email') => {
    setAiDraftLoading(true)
    setAiChannel(channel)
    setShowAiDraft(true)
    try {
      const res = await fetch('/api/ai/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id, channel }),
      })
      if (res.ok) {
        const data = await res.json()
        setAiDraft(data.draft)
        setAiModel(data.model)
      } else {
        const fallbacks: Record<string, string> = {
          whatsapp: `Bonjour ${lead.name} ! Je me permets de vous contacter suite à la découverte de votre activité${lead.business ? ` "${lead.business}"` : ''}. Seriez-vous disponible pour un échange rapide cette semaine ?`,
          appel: `Bonjour ${lead.name}, je vous appelle concernant votre activité${lead.business ? ` "${lead.business}"` : ''}. J'aimerais vous présenter une opportunité de collaboration. Quand seriez-vous disponible ?`,
          email: `Objet : Opportunité de collaboration\n\nBonjour ${lead.name},\n\nJ'ai découvert votre activité${lead.business ? ` "${lead.business}"` : ''} et je pense qu'il y a des synergies possibles.\n\nSeriez-vous disponible pour un échange ?\n\nCordialement`,
        }
        setAiDraft(fallbacks[channel])
        setAiModel('Local')
      }
    } catch {
      setAiDraft(`Bonjour ${lead.name} ! Je souhaiterais échanger avec vous concernant une opportunité de collaboration.`)
      setAiModel('Local')
    }
    setAiDraftLoading(false)
  }

  const handleCopyDraft = () => {
    if (aiDraft) {
      navigator.clipboard.writeText(aiDraft)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleLogAndAction = (type: 'appel' | 'whatsapp') => {
    logContact(lead.id, type)
    decrementCredits()

    if (type === 'appel' && lead.phone) {
      window.open(`tel:${lead.phone}`, '_self')
    } else if (type === 'whatsapp') {
      const phone = lead.whatsapp || lead.phone || ''
      window.open(`https://wa.me/${phone.replace(/\s|\+/g, '')}`, '_blank')
    }
  }

  const handleStageChange = (stage: LeadStage) => {
    updateLeadStage(lead.id, stage)
    if (stage === 'gagne') {
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 1500)
    }
    fetch('/api/crm/leads', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: lead.id, stage }),
    }).catch(() => {})
    setShowStagePicker(false)
  }

  const handleSpeak = () => {
    const utterance = new SpeechSynthesisUtterance(
      `${lead.name}. ${lead.business || ''}. Secteur: ${lead.sector || ''}. Ville: ${lead.city || ''}. Étape: ${stageConfig.label}. Score: ${lead.score} sur 100.`
    )
    utterance.lang = 'fr-FR'
    speechSynthesis.speak(utterance)
  }

  const scoreColor = lead.score >= 80 ? '#4CAF50' : lead.score >= 50 ? '#FFB347' : '#EF4444'

  return (
    <div className="pb-28">
      {showConfetti && <ConfettiEffect />}

      {/* Header - sticky */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl px-5 pt-4 pb-3 flex items-center gap-3">
        <button onClick={goBack} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-secondary-foreground" />
        </button>
        <h1 className="text-lg font-bold flex-1">Détail du client</h1>
        <button onClick={handleSpeak} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
          <Volume2 className="w-4 h-4 text-secondary-foreground" />
        </button>
      </div>

      {/* Lead Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="px-5 py-3">
        <div className="bg-card rounded-3xl shadow-xl border border-border/30 overflow-hidden">
          <div className={`h-2 w-full ${sourceConfig[lead.source]?.bg || 'bg-[#4CAF50]'}`} />
          <div className="p-5">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF7B54] to-[#6C3FA9] flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {lead.name.charAt(0)}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold">{lead.name}</h2>
                {lead.business && (
                  <p className="text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    <Building2 className="w-3.5 h-3.5" />{lead.business}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-center">
                <svg width="44" height="44" className="transform -rotate-90">
                  <circle cx="22" cy="22" r="18" fill="none" stroke="var(--border)" strokeWidth="4" />
                  <circle cx="22" cy="22" r="18" fill="none" stroke={scoreColor} strokeWidth="4" strokeDasharray={`${(lead.score / 100) * 113} 113`} strokeLinecap="round" />
                </svg>
                <span className="text-[10px] font-bold mt-0.5" style={{ color: scoreColor }}>{lead.score}</span>
              </div>
            </div>

            {/* Stage selector */}
            <div className="relative mb-4">
              <button
                onClick={() => setShowStagePicker(!showStagePicker)}
                className={`w-full px-4 py-2.5 rounded-xl ${stageConfig.bg} ${stageConfig.color} font-semibold text-sm flex items-center justify-between`}
              >
                <span className="flex items-center gap-2">
                  <span>{stageConfig.icon}</span>
                  {stageConfig.label}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showStagePicker ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showStagePicker && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="absolute top-full left-0 right-0 z-20 mt-1 bg-card rounded-xl shadow-lg border border-border/50 overflow-hidden"
                  >
                    {STAGE_ORDER.map((stage) => {
                      const config = STAGE_CONFIG[stage]
                      return (
                        <button
                          key={stage}
                          onClick={() => handleStageChange(stage)}
                          className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 transition-colors hover:bg-secondary ${
                            lead.stage === stage ? 'bg-secondary font-semibold' : ''
                          }`}
                        >
                          <span>{config.icon}</span>
                          <span className={config.color}>{config.label}</span>
                        </button>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-2 text-sm">
              {lead.sector && <p className="text-muted-foreground">Secteur : <span className="text-foreground font-medium">{lead.sector}</span></p>}
              {lead.city && <p className="text-muted-foreground flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{lead.city}</p>}
              {lead.phone && <p className="text-muted-foreground flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{lead.phone}</p>}
              {daysSince !== null && (
                <p className="text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Dernier contact : {daysSince === 0 ? "Aujourd'hui" : daysSince === 1 ? 'Hier' : `il y a ${daysSince}j`}
                  · {lead.contactCount} contact{lead.contactCount > 1 ? 's' : ''}
                </p>
              )}
            </div>

            {/* AI Suggestion */}
            {lead.aiSuggestion && (
              <div className="mt-4 p-3 rounded-xl bg-[#6C3FA9]/5 border border-[#6C3FA9]/10">
                <div className="flex items-center gap-1.5 mb-1">
                  <Lightbulb className="w-3.5 h-3.5 text-[#6C3FA9]" />
                  <span className="text-xs font-semibold text-[#6C3FA9]">Conseil IA</span>
                </div>
                <p className="text-xs text-foreground/80">{lead.aiSuggestion}</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Action buttons */}
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="px-5 space-y-3">
        <div className="flex gap-2">
          <button
            onClick={() => handleGenerateDraft('whatsapp')}
            disabled={aiDraftLoading}
            className="flex-1 py-3.5 rounded-2xl bg-[#6C3FA9] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
            style={{ minHeight: 48 }}
          >
            <Zap className="w-4 h-4" />
            Message IA
          </button>
          <button
            onClick={() => handleGenerateDraft('appel')}
            disabled={aiDraftLoading}
            className="flex-1 py-3.5 rounded-2xl bg-[#2EC4B6] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
            style={{ minHeight: 48 }}
          >
            <Zap className="w-4 h-4" />
            Script appel
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleLogAndAction('appel')}
            className="flex-1 py-4 rounded-2xl bg-[#2EC4B6] text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98]"
            style={{ minHeight: 56 }}
          >
            <Phone className="w-5 h-5" />
            Appeler
          </button>
          <button
            onClick={() => handleLogAndAction('whatsapp')}
            className="flex-1 py-4 rounded-2xl bg-[#25D366] text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98]"
            style={{ minHeight: 56 }}
          >
            <MessageCircle className="w-5 h-5" />
            WhatsApp
          </button>
        </div>
      </motion.div>

      {/* AI Draft panel */}
      <AnimatePresence>
        {showAiDraft && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-5 mt-4 overflow-hidden"
          >
            <div className="bg-card rounded-2xl border border-[#6C3FA9]/20 shadow-lg overflow-hidden">
              <div className="px-4 py-3 bg-[#6C3FA9]/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-[#6C3FA9]" />
                  <span className="text-sm font-semibold text-[#6C3FA9]">
                    Brouillon IA {aiDraftLoading ? '...' : `(${aiChannel})`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyDraft}
                    disabled={!aiDraft}
                    className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center"
                  >
                    {copied ? <Check className="w-4 h-4 text-[#4CAF50]" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                  </button>
                  <button
                    onClick={() => setShowAiDraft(false)}
                    className="text-xs text-muted-foreground"
                  >
                    Fermer
                  </button>
                </div>
              </div>
              <div className="p-4">
                {aiDraftLoading ? (
                  <div className="space-y-2">
                    <div className="h-4 w-full rounded skeleton-shimmer" />
                    <div className="h-4 w-3/4 rounded skeleton-shimmer" />
                    <div className="h-4 w-1/2 rounded skeleton-shimmer" />
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{aiDraft}</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contact History Timeline */}
      <div className="px-5 mt-4">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">Historique ({contacts.length})</h3>
        {contacts.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">Aucun contact enregistré</p>
        ) : (
          <div className="space-y-2">
            {contacts.slice(0, 5).map((contact) => {
              const typeConfig = contactTypeIcons[contact.type] || contactTypeIcons.note
              const IconComp = typeConfig.icon
              return (
                <div key={contact.id} className="flex items-start gap-3 p-3 bg-card rounded-xl border border-border/30">
                  <div className={`w-8 h-8 rounded-lg ${contact.type === 'appel' ? 'bg-[#2EC4B6]/10' : contact.type === 'whatsapp' ? 'bg-[#25D366]/10' : 'bg-secondary'} flex items-center justify-center shrink-0`}>
                    <IconComp className={`w-4 h-4 ${typeConfig.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold">{typeConfig.label}</span>
                      {contact.aiGenerated && (
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-[#6C3FA9]/10 text-[#6C3FA9]">IA</span>
                      )}
                    </div>
                    {contact.content && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{contact.content}</p>}
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                      {new Date(contact.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
