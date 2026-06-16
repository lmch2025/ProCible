'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Sparkles, Calendar, User, ChevronRight, MessageCircle, Phone,
  Send, MapPin, Copy, Check, Cpu, Clock, Layers, AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  SearchBar, FilterSelect, Pagination, EmptyState, LoadingSkeleton,
  Badge, BottomSheet, DetailRow, STAGE_COLORS, STAGE_LABELS,
  SectionHeader,
} from './SharedComponents'

/* ---------- Types ---------- */

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

interface PlanItem {
  leadId: string
  leadName: string
  leadBusiness: string | null
  leadCity: string | null
  leadStage: string
  leadScore: number
  leadContactCount: number
  leadCreatedAt: string
  leadNextFollowUpAt: string | null
  userPhone: string | null
  userName: string | null
  plan: FollowUpPlan
  modelDisplay: string
}

interface ModelStat {
  id: string
  display: string
  count: number
}

/* ---------- Constants ---------- */

const channelLabels: Record<string, string> = {
  whatsapp: 'WhatsApp',
  appel: 'Appel',
  email: 'Email',
  visite: 'Visite',
  sms: 'SMS',
}

const channelColors: Record<string, string> = {
  whatsapp: 'bg-[#25D366]/10 text-[#25D366]',
  appel: 'bg-[#2EC4B6]/10 text-[#2EC4B6]',
  email: 'bg-[#6C3FA9]/10 text-[#6C3FA9]',
  visite: 'bg-[#FF7B54]/10 text-[#FF7B54]',
  sms: 'bg-[#FFB347]/10 text-[#FFB347]',
}

const channelIcons: Record<string, typeof Phone> = {
  whatsapp: MessageCircle,
  appel: Phone,
  email: Send,
  visite: MapPin,
  sms: MessageCircle,
}

/** Color the model badge by capability tier (larger = more premium hue). */
function modelBadgeColor(modelId: string): string {
  if (modelId.includes('local-fallback')) return 'bg-gray-200 text-gray-600'
  if (modelId.includes('550b') || modelId.includes('405b')) return 'bg-[#6C3FA9]/10 text-[#6C3FA9]'
  if (modelId.includes('120b')) return 'bg-[#FF7B54]/10 text-[#FF7B54]'
  if (modelId.includes('80b')) return 'bg-[#2EC4B6]/10 text-[#2EC4B6]'
  return 'bg-[#FFB347]/10 text-[#FFB347]'
}

/* ---------- Component ---------- */

export default function AIFollowUpPlansTab() {
  const [plans, setPlans] = useState<PlanItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('')
  const [modelFilter, setModelFilter] = useState('')
  const [modelStats, setModelStats] = useState<ModelStat[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<PlanItem | null>(null)
  const [expandedStage, setExpandedStage] = useState<number | null>(null)
  const [copiedStage, setCopiedStage] = useState<number | null>(null)

  const fetchPlans = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '25',
        search,
        stage: stageFilter,
        model: modelFilter,
      })
      const res = await fetch(`/admin/api/follow-up-plans?${params}`)
      const data = await res.json()
      setPlans(data.plans || [])
      setTotal(data.total || 0)
      setModelStats(data.modelStats || [])
    } catch {
      toast.error('Erreur de chargement')
    }
    setLoading(false)
  }, [page, search, stageFilter, modelFilter])

  useEffect(() => { fetchPlans() }, [fetchPlans])

  const stageOptions = Object.entries(STAGE_LABELS).map(([k, v]) => ({ value: k, label: v }))
  const modelOptions = modelStats.map((m) => ({
    value: m.id,
    label: `${m.display} (${m.count})`,
  }))

  const handleCopyScript = (stage: FollowUpStage) => {
    navigator.clipboard.writeText(stage.script)
    setCopiedStage(stage.step)
    setTimeout(() => setCopiedStage(null), 2000)
    toast.success('Script copié')
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

  const formatRelative = (iso: string | null) => {
    if (!iso) return null
    const date = new Date(iso)
    const now = new Date()
    const diffMs = date.getTime() - now.getTime()
    const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000))
    if (diffDays < 0) return `il y a ${Math.abs(diffDays)}j`
    if (diffDays === 0) return "aujourd'hui"
    if (diffDays === 1) return 'demain'
    return `dans ${diffDays}j`
  }

  return (
    <div className="p-4 space-y-4">
      <SectionHeader
        title="Plans de suivi IA"
        subtitle={`${total} plan${total > 1 ? 's' : ''} généré${total > 1 ? 's' : ''} par lead`}
      />

      {/* Model usage stats */}
      {modelStats.length > 0 && (
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Cpu className="w-3 h-3" /> Répartition par modèle
          </p>
          <div className="flex flex-wrap gap-1.5">
            {modelStats.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  setModelFilter(modelFilter === m.id ? '' : m.id)
                  setPage(1)
                }}
                className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-all flex items-center gap-1 ${
                  modelFilter === m.id
                    ? 'ring-2 ring-[#FF7B54]/30 ' + modelBadgeColor(m.id)
                    : modelBadgeColor(m.id) + ' hover:opacity-80'
                }`}
              >
                {m.display}
                <span className="bg-white/40 rounded px-1 text-[9px]">{m.count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1">
          <SearchBar
            value={search}
            onChange={(v) => { setSearch(v); setPage(1) }}
            placeholder="Nom, entreprise, ville..."
          />
        </div>
        <FilterSelect
          value={stageFilter}
          onChange={(v) => { setStageFilter(v); setPage(1) }}
          options={stageOptions}
          placeholder="Toutes étapes"
        />
        {modelOptions.length > 0 && (
          <FilterSelect
            value={modelFilter}
            onChange={(v) => { setModelFilter(v); setPage(1) }}
            options={modelOptions}
            placeholder="Tous modèles"
          />
        )}
      </div>

      {/* Plans list */}
      {loading ? (
        <LoadingSkeleton />
      ) : plans.length === 0 ? (
        <EmptyState
          message="Aucun plan de suivi IA généré pour le moment"
          icon={Sparkles}
        />
      ) : (
        <div className="space-y-2">
          {plans.map((item) => {
            const nextStage = item.leadNextFollowUpAt
              ? item.plan.stages.find((s) => {
                  const fireAt = new Date(item.leadCreatedAt).getTime() + s.dayOffset * 24 * 60 * 60 * 1000
                  return fireAt >= Date.now() - 24 * 60 * 60 * 1000
                })
              : null
            return (
              <div
                key={item.leadId}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  setSelected(item)
                  setExpandedStage(null)
                }}
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF7B54] to-[#6C3FA9] flex items-center justify-center shrink-0 text-white font-bold">
                      {item.leadName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm text-gray-900 truncate">{item.leadName}</p>
                        <Badge
                          label={STAGE_LABELS[item.leadStage] || item.leadStage}
                          color={STAGE_COLORS[item.leadStage] || 'bg-gray-100 text-gray-600'}
                        />
                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${modelBadgeColor(item.plan.model)}`}>
                          {item.modelDisplay}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {item.leadBusiness || '—'} {item.leadCity ? `· ${item.leadCity}` : ''}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-2 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Layers className="w-3 h-3" />
                          {item.plan.stages.length} étapes
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(item.plan.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {item.userName || item.userPhone || '—'}
                        </span>
                        {nextStage && (
                          <span className="flex items-center gap-1 text-[#FF7B54] font-medium">
                            <Clock className="w-3 h-3" />
                            Prochaine étape {formatRelative(item.leadNextFollowUpAt)}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold">{item.leadScore}</p>
                      <p className="text-[10px] text-gray-400">score</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 mt-3" />
                  </div>

                  {/* Strategy preview */}
                  <div className="mt-3 bg-[#6C3FA9]/5 rounded-xl p-2.5 border border-[#6C3FA9]/10">
                    <p className="text-[10px] font-semibold text-[#6C3FA9] uppercase tracking-wider mb-1">
                      Stratégie
                    </p>
                    <p className="text-xs text-gray-700 line-clamp-2">{item.plan.strategy}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Pagination page={page} totalPages={Math.max(1, Math.ceil(total / 25))} setPage={setPage} />

      {/* Detail bottom sheet */}
      <BottomSheet
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `Plan · ${selected.leadName}` : 'Plan'}
      >
        {selected && (
          <div className="space-y-4">
            {/* Lead info */}
            <div className="pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge
                  label={STAGE_LABELS[selected.leadStage] || selected.leadStage}
                  color={STAGE_COLORS[selected.leadStage] || 'bg-gray-100 text-gray-600'}
                />
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${modelBadgeColor(selected.plan.model)}`}>
                  Proposé par {selected.modelDisplay}
                </span>
                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Généré le {formatDate(selected.plan.createdAt)}
                </span>
              </div>
              <DetailRow label="Entreprise" value={selected.leadBusiness} />
              <DetailRow label="Ville" value={selected.leadCity} />
              <DetailRow label="Score" value={selected.leadScore} />
              <DetailRow label="Contacts déjà effectués" value={selected.leadContactCount} />
              <DetailRow label="Prochaine relance" value={formatRelative(selected.leadNextFollowUpAt) || '—'} />
              <DetailRow label="Utilisateur" value={selected.userName || selected.userPhone || '—'} />
            </div>

            {/* Strategy */}
            <div className="bg-[#6C3FA9]/5 rounded-xl p-3 border border-[#6C3FA9]/10">
              <p className="text-[10px] font-semibold text-[#6C3FA9] uppercase tracking-wider mb-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Stratégie globale
              </p>
              <p className="text-xs text-gray-700 leading-relaxed">{selected.plan.strategy}</p>
            </div>

            {/* Stages timeline */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" /> Étapes ({selected.plan.stages.length})
              </p>
              <div className="space-y-2">
                {selected.plan.stages.map((stage) => {
                  const isExpanded = expandedStage === stage.step
                  const ChannelIcon = channelIcons[stage.channel] || Phone
                  const chColor = channelColors[stage.channel] || 'bg-gray-100 text-gray-600'
                  const fireDate = new Date(selected.leadCreatedAt).getTime() + stage.dayOffset * 24 * 60 * 60 * 1000
                  return (
                    <div
                      key={stage.step}
                      className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedStage(isExpanded ? null : stage.step)}
                        className="w-full flex items-center gap-2 p-3 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className={`w-8 h-8 rounded-lg ${chColor} flex items-center justify-center shrink-0`}>
                          <ChannelIcon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-gray-900">Étape {stage.step}</span>
                            <span className="text-[9px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                              J+{stage.dayOffset}
                            </span>
                            <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${chColor}`}>
                              {channelLabels[stage.channel] || stage.channel}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5 truncate">{stage.objective}</p>
                        </div>
                        <ChevronRight
                          className={`w-4 h-4 text-gray-300 transition-transform shrink-0 ${
                            isExpanded ? 'rotate-90' : ''
                          }`}
                        />
                      </button>

                      {isExpanded && (
                        <div className="px-3 pb-3 space-y-2 border-t border-gray-100 pt-2">
                          <p className="text-[10px] text-gray-400">
                            Déclenchement : {new Date(fireDate).toLocaleDateString('fr-FR', {
                              day: 'numeric', month: 'long', year: 'numeric',
                            })}
                          </p>
                          <div className="bg-gray-50 rounded-lg p-2.5">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                                Script
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleCopyScript(stage)
                                }}
                                className="text-[10px] text-[#FF7B54] font-medium flex items-center gap-1 hover:opacity-70"
                              >
                                {copiedStage === stage.step ? (
                                  <><Check className="w-3 h-3" /> Copié</>
                                ) : (
                                  <><Copy className="w-3 h-3" /> Copier</>
                                )}
                              </button>
                            </div>
                            <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                              {stage.script}
                            </p>
                          </div>
                          {stage.tips.length > 0 && (
                            <div>
                              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                Conseils
                              </p>
                              <ul className="space-y-1">
                                {stage.tips.map((tip, i) => (
                                  <li
                                    key={i}
                                    className="text-[11px] text-gray-600 flex items-start gap-1.5"
                                  >
                                    <span className="text-[#FF7B54] mt-0.5">•</span>
                                    <span className="leading-relaxed">{tip}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Supportive note */}
            <div className="bg-[#FF7B54]/5 rounded-xl p-3 border border-[#FF7B54]/10 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-[#FF7B54] shrink-0 mt-0.5" />
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Ce plan a été généré automatiquement par l'IA pour aider l'utilisateur à structurer
                son suivi commercial. Pour le coaching, utilisez le script et les conseils comme
                point de départ d'une discussion personnalisée avec l'utilisateur.
              </p>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
