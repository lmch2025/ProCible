'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useProcibleStore, STAGE_CONFIG, STAGE_ORDER, type LeadStage } from '@/store/procible-store'
import { Phone, MessageCircle, MapPin, Building2, ArrowLeft, Volume2, Clock, Copy, Check, ChevronDown, Send, FileText, Lightbulb, Zap, Coins, Loader2, Calendar, ChevronRight, Sparkles } from 'lucide-react'
import { useState, useEffect } from 'react'
import ConfettiEffect from './ConfettiEffect'
import { toast } from 'sonner'

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

// Follow-up plan types — mirror the AI service contract
interface FollowUpStage {
  step: number
  dayOffset: number
  channel: 'whatsapp' | 'appel' | 'email' | 'visite' | 'sms'
  objective: string
  script: string
  tips: string[]
}
interface FollowUpPlan {
  leadId: string
  stages: FollowUpStage[]
  strategy: string
  model: string
  createdAt: string
}

const channelConfig: Record<FollowUpStage['channel'], { icon: typeof Phone; color: string; bg: string; label: string }> = {
  whatsapp: { icon: MessageCircle, color: 'text-[#25D366]', bg: 'bg-[#25D366]/10', label: 'WhatsApp' },
  appel: { icon: Phone, color: 'text-[#2EC4B6]', bg: 'bg-[#2EC4B6]/10', label: 'Appel' },
  email: { icon: Send, color: 'text-[#6C3FA9]', bg: 'bg-[#6C3FA9]/10', label: 'Email' },
  visite: { icon: MapPin, color: 'text-[#FF7B54]', bg: 'bg-[#FF7B54]/10', label: 'Visite' },
  sms: { icon: MessageCircle, color: 'text-[#FFB347]', bg: 'bg-[#FFB347]/10', label: 'SMS' },
}

export default function LeadDetail() {
  const { leads, selectedLeadId, updateLeadStage, goBack, decrementCredits, aiDraft, aiDraftLoading, setAiDraft, setAiDraftLoading, setAiModel, logContact, credits, setCredits } = useProcibleStore()
  const [showConfetti, setShowConfetti] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showStagePicker, setShowStagePicker] = useState(false)
  const [showAiDraft, setShowAiDraft] = useState(false)
  const [aiChannel, setAiChannel] = useState<'whatsapp' | 'appel' | 'email'>('whatsapp')

  // Follow-up plan state
  const [plan, setPlan] = useState<FollowUpPlan | null>(null)
  const [planLoading, setPlanLoading] = useState(false)
  const [expandedStage, setExpandedStage] = useState<number | null>(null)
  const [completedStages, setCompletedStages] = useState<Set<number>>(new Set())
  const [copiedStage, setCopiedStage] = useState<number | null>(null)

  const lead = leads.find(l => l.id === selectedLeadId)

  // Load existing follow-up plan on mount / lead change
  useEffect(() => {
    setPlan(null)
    setExpandedStage(null)
    setCompletedStages(new Set())
    if (!lead) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/ai/follow-up-plan?leadId=${lead.id}`)
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled && data.hasPlan && data.plan) {
          setPlan(data.plan)
        }
      } catch {
        /* silent */
      }
    })()
    return () => { cancelled = true }
  }, [lead?.id])

  const handleGeneratePlan = async () => {
    if (!lead) return
    setPlanLoading(true)
    try {
      const res = await fetch('/api/ai/follow-up-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.plan) setPlan(data.plan)
        if (typeof data.balanceAfter === 'number') setCredits(data.balanceAfter)
        toast.success(
          `Plan de suivi généré ! ${data.plan?.stages.length || 0} étapes programmées.`,
          { description: data.creditsUsed > 0 ? `−${data.creditsUsed} crédits${data.creditsFreeQuotaUsed ? ' (quota gratuit)' : ''}` : 'Gratuit (quota)' },
        )
      } else if (res.status === 402) {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'Crédits insuffisants', {
          description: err.balance !== undefined ? `Solde : ${err.balance} · Requis : ${err.required}` : undefined,
          duration: 6000,
        })
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'Échec génération du plan')
      }
    } catch {
      toast.error('Erreur de connexion')
    }
    setPlanLoading(false)
  }

  const handleCopyStageScript = (stage: FollowUpStage) => {
    navigator.clipboard.writeText(stage.script)
    setCopiedStage(stage.step)
    setTimeout(() => setCopiedStage(null), 2000)
    toast.success('Script copié dans le presse-papier')
  }

  const handleExecuteStage = (stage: FollowUpStage) => {
    if (!lead) return
    // Log the contact in CRM
    logContact(lead.id, stage.channel === 'sms' ? 'whatsapp' : stage.channel, stage.script, false)
    setCompletedStages((prev) => new Set(prev).add(stage.step))
    // Open the channel
    if (stage.channel === 'appel' && lead.phone) {
      window.open(`tel:${lead.phone}`, '_self')
    } else if (stage.channel === 'whatsapp' || stage.channel === 'sms') {
      const phone = lead.whatsapp || lead.phone || ''
      const text = encodeURIComponent(stage.script)
      window.open(`https://wa.me/${phone.replace(/\s|\+/g, '')}?text=${text}`, '_blank')
    } else if (stage.channel === 'email' && lead.email) {
      const subject = encodeURIComponent(stage.objective)
      const body = encodeURIComponent(stage.script)
      window.open(`mailto:${lead.email}?subject=${subject}&body=${body}`, '_blank')
    }
    toast.success(`Étape ${stage.step} marquée comme effectuée`)
  }

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

      {/* AI Follow-Up Plan — hierarchical timeline */}
      <div className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#FF7B54]" />
            <h3 className="text-sm font-semibold text-muted-foreground">Plan de suivi IA</h3>
          </div>
          {plan && (
            <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
              {plan.stages.length} étapes · {plan.model?.split('/').pop()?.replace(':free', '') || 'IA'}
            </span>
          )}
        </div>

        {!plan ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-[#FF7B54]/8 to-[#6C3FA9]/8 rounded-2xl border border-[#FF7B54]/20 p-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF7B54] to-[#6C3FA9] flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  Planifiez le suivi de ce lead
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  L'IA génère un plan hiérarchisé en 4-5 étapes (J+1, J+3, J+7, J+14, J+30) avec scripts prêts à envoyer, conseils tactiques, et notifications intelligentes programmées automatiquement.
                </p>
                <button
                  onClick={handleGeneratePlan}
                  disabled={planLoading}
                  className="mt-3 w-full py-2.5 rounded-xl procible-gradient text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {planLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Générer le plan
                      <span className="ml-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/15 text-[11px]">
                        <Coins className="w-3 h-3" />
                        3
                      </span>
                    </>
                  )}
                </button>
                {credits < 3 && (
                  <p className="text-[11px] text-[#EF4444] mt-2 text-center">
                    Solde insuffisant ({credits} crédits) · 1 gratuit/jour
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {/* Strategy summary */}
            <div className="bg-[#6C3FA9]/5 rounded-2xl border border-[#6C3FA9]/20 p-3.5">
              <div className="flex items-center gap-2 mb-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-[#6C3FA9]" />
                <span className="text-xs font-semibold text-[#6C3FA9]">Stratégie</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">{plan.strategy}</p>
            </div>

            {/* Timeline stages */}
            <div className="relative pl-5">
              {/* Vertical line */}
              <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gradient-to-b from-[#FF7B54] via-[#6C3FA9] to-[#FF7B54]/20" />

              {plan.stages.map((stage, idx) => {
                const isCompleted = completedStages.has(stage.step)
                const isExpanded = expandedStage === stage.step
                const chCfg = channelConfig[stage.channel] || channelConfig.whatsapp
                const ChannelIcon = chCfg.icon
                const isLast = idx === plan.stages.length - 1
                return (
                  <motion.div
                    key={stage.step}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`relative mb-3 ${isLast ? 'mb-0' : ''}`}
                  >
                    {/* Timeline dot */}
                    <div
                      className={`absolute -left-[14px] top-3 w-3 h-3 rounded-full border-2 border-background ${
                        isCompleted ? 'bg-[#4CAF50]' : 'bg-[#FF7B54]'
                      }`}
                    />

                    {/* Stage card */}
                    <div
                      className={`rounded-2xl border overflow-hidden transition-all ${
                        isCompleted
                          ? 'bg-[#4CAF50]/5 border-[#4CAF50]/20'
                          : isExpanded
                          ? 'bg-card border-[#FF7B54]/30 shadow-md'
                          : 'bg-card border-border/40'
                      }`}
                    >
                      {/* Stage header (clickable to expand) */}
                      <button
                        onClick={() => setExpandedStage(isExpanded ? null : stage.step)}
                        className="w-full flex items-center gap-3 p-3 text-left"
                      >
                        <div className={`w-9 h-9 rounded-xl ${chCfg.bg} flex items-center justify-center shrink-0`}>
                          <ChannelIcon className={`w-4 h-4 ${chCfg.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-foreground">Étape {stage.step}</span>
                            <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full">
                              J+{stage.dayOffset}
                            </span>
                            <span className={`text-[10px] font-medium ${chCfg.color}`}>{chCfg.label}</span>
                            {isCompleted && (
                              <Check className="w-3.5 h-3.5 text-[#4CAF50]" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{stage.objective}</p>
                        </div>
                        <ChevronRight
                          className={`w-4 h-4 text-muted-foreground transition-transform shrink-0 ${
                            isExpanded ? 'rotate-90' : ''
                          }`}
                        />
                      </button>

                      {/* Expanded script + tips */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-3 pb-3 space-y-2.5">
                              {/* Script preview */}
                              <div className="bg-secondary/50 rounded-xl p-2.5">
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Script prêt</span>
                                  <button
                                    onClick={() => handleCopyStageScript(stage)}
                                    className="text-[10px] text-[#FF7B54] font-medium flex items-center gap-1 hover:text-[#FF7B54]/70 transition-colors"
                                  >
                                    {copiedStage === stage.step ? (
                                      <>
                                        <Check className="w-3 h-3" />
                                        Copié
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3 h-3" />
                                        Copier
                                      </>
                                    )}
                                  </button>
                                </div>
                                <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap">{stage.script}</p>
                              </div>

                              {/* Tips */}
                              {stage.tips.length > 0 && (
                                <div>
                                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Conseils</p>
                                  <ul className="space-y-1">
                                    {stage.tips.map((tip, i) => (
                                      <li key={i} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                                        <span className="text-[#FF7B54] mt-0.5">•</span>
                                        <span className="leading-relaxed">{tip}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Execute button */}
                              {!isCompleted && (
                                <button
                                  onClick={() => handleExecuteStage(stage)}
                                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#FF7B54] to-[#FFB347] text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
                                >
                                  <ChannelIcon className="w-3.5 h-3.5" />
                                  {stage.channel === 'appel' ? 'Appeler maintenant' : stage.channel === 'whatsapp' || stage.channel === 'sms' ? 'Envoyer sur WhatsApp' : stage.channel === 'email' ? 'Envoyer l\'email' : 'Marquer comme fait'}
                                </button>
                              )}
                              {isCompleted && (
                                <div className="text-center text-[11px] text-[#4CAF50] font-medium py-1">
                                  ✓ Étape effectuée
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Regenerate plan */}
            <button
              onClick={handleGeneratePlan}
              disabled={planLoading}
              className="w-full py-2 rounded-xl bg-secondary text-muted-foreground text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-secondary/70 transition-colors"
            >
              {planLoading ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Régénération...
                </>
              ) : (
                <>
                  <Zap className="w-3 h-3" />
                  Régénérer le plan
                </>
              )}
            </button>
          </motion.div>
        )}
      </div>

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
