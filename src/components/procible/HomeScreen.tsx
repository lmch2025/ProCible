'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useProcibleStore, STAGE_ORDER, STAGE_CONFIG, type LeadStage } from '@/store/procible-store'
import { Coins, ArrowRight, Moon, TrendingUp, AlertTriangle, RotateCcw, Trophy, Megaphone, MapPin, Plus } from 'lucide-react'
import ProspectionCTA from './ProspectionCTA'
import { useI18n } from '@/lib/i18n'

export default function HomeScreen() {
  const { leads, newLeadsCount, navigateTo, plan, credits, campaigns } = useProcibleStore()
  const { t, tp } = useI18n()

  const nouveaux = leads.filter(l => l.stage === 'nouveau').length
  const enDiscussion = leads.filter(l => l.stage === 'en_discussion').length
  const aRelancer = leads.filter(l => l.stage === 'a_relancer').length
  const gagnes = leads.filter(l => l.stage === 'gagne').length
  const totalLeads = leads.length

  const toFollowUp = leads.filter(l => {
    if (!l.nextFollowUpAt || l.stage === 'gagne' || l.stage === 'perdu') return false
    return new Date(l.nextFollowUpAt) <= new Date()
  }).length

  const avgScore = totalLeads > 0 ? Math.round(leads.reduce((sum, l) => sum + l.score, 0) / totalLeads) : 0

  const activeCampaigns = campaigns.filter(c => c.status === 'active')

  const LOW_CREDIT_THRESHOLD = 2
  const isLowCredits = credits <= LOW_CREDIT_THRESHOLD

  return (
    <div className="pb-28">
      {/* Header - sticky */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl px-5 pt-6 pb-3">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{t('home.greeting')}</p>
            <h1 className="text-2xl font-bold procible-gradient-text">{t('home.brand')}</h1>
          </div>
          <div className="relative">
            {/* Pulsing low-credit halo — only when credits ≤ 2 */}
            {isLowCredits && (
              <motion.span
                aria-hidden
                className="absolute inset-0 rounded-full bg-[#EF4444]/30 pointer-events-none"
                animate={{ scale: [1, 1.18, 1], opacity: [0.55, 0, 0.55] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
            <button
              type="button"
              onClick={() => navigateTo('credits')}
              aria-label={isLowCredits ? tp(`home.low_credit_aria_${credits === 1 ? 'one' : 'other'}`, credits, { count: credits }) : t('home.buy_credits')}
              className={`group relative flex items-center gap-2 rounded-full pl-2.5 pr-3 py-1.5 transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7B54]/40 ${
                isLowCredits
                  ? 'bg-[#EF4444]/10 hover:bg-[#EF4444]/15 ring-1 ring-[#EF4444]/40'
                  : 'bg-secondary hover:bg-secondary/70'
              }`}
            >
              <span className={`relative flex items-center justify-center w-6 h-6 rounded-full shadow-sm ${isLowCredits ? 'bg-gradient-to-br from-[#EF4444] to-[#FF7B54]' : 'bg-gradient-to-br from-[#FF7B54] to-[#6C3FA9]'}`}>
                <Coins className="w-3.5 h-3.5 text-white" />
                <span className="absolute -inset-1 rounded-full bg-[#FF7B54]/30 opacity-0 group-hover:opacity-100 blur-md transition-opacity" />
              </span>
              <span className={`text-sm font-semibold tabular-nums ${isLowCredits ? 'text-[#EF4444]' : 'text-secondary-foreground'}`}>{credits}</span>
              <span className="text-xs text-muted-foreground hidden xs:inline">{t('home.credits')}</span>
              <Plus className={`w-3.5 h-3.5 opacity-0 -ml-1 group-hover:opacity-100 group-hover:ml-0 transition-all ${isLowCredits ? 'text-[#EF4444]' : 'text-[#FF7B54]'}`} />

              {/* Small pulsing badge dot at top-right when low */}
              {isLowCredits && (
                <motion.span
                  aria-hidden
                  className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[#EF4444] border-2 border-background"
                  animate={{ scale: [1, 1.25, 1] }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <span className="text-[8px] font-bold text-white leading-none">!</span>
                </motion.span>
              )}
            </button>
          </div>
        </motion.div>

        {/* Low-credit inline banner */}
        <AnimatePresence>
          {isLowCredits && (
            <motion.button
              type="button"
              onClick={() => navigateTo('credits')}
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 10 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.25 }}
              className="w-full overflow-hidden flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-[#EF4444]/8 border border-[#EF4444]/25 text-left active:scale-[0.99] transition-transform"
            >
              <motion.span
                className="flex items-center justify-center w-7 h-7 rounded-full bg-[#EF4444] shrink-0"
                animate={{ scale: [1, 1.12, 1] }}
                transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
              >
                <AlertTriangle className="w-4 h-4 text-white" />
              </motion.span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#EF4444]">
                  {t('home.low_credit_title')} — {tp(`home.low_credit_message_${credits === 1 ? 'one' : 'other'}`, credits, { count: credits })}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {t('home.low_credit_hint')}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-[#EF4444] shrink-0" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Sticky CTA — appears below header, stays fixed when scrolling */}
      <ProspectionCTA />

      <div className="px-5 mt-4">
        {/* Main card - New prospects */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative overflow-hidden rounded-3xl procible-gradient p-6 mb-5 shadow-xl">
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
          <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-white/5 rounded-full" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Moon className="w-5 h-5 text-white/80" />
              <span className="text-white/80 text-sm">{t('home.last_night')}</span>
            </div>
            <motion.div className="mb-4" animate={{ scale: [1, 1.02, 1] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
              <span className="text-6xl font-bold text-white">{nouveaux || newLeadsCount || 0}</span>
              <span className="text-xl text-white/80 ml-2">{tp('home.new_other', nouveaux || newLeadsCount || 0)}</span>
            </motion.div>
            <p className="text-white/80 text-lg mb-5">{t('home.leads_found')}</p>
            <button onClick={() => navigateTo('leads')} className="w-full py-4 bg-white rounded-2xl text-[#FF7B54] font-bold text-lg flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98]">
              {t('home.view_leads')}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>

        {/* Active campaigns */}
        {activeCampaigns.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="mb-5">
            <h2 className="text-base font-semibold mb-3">{t('home.active_campaigns')}</h2>
            <div className="space-y-2">
              {activeCampaigns.slice(0, 2).map((camp) => (
                <div key={camp.id} className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF7B54] to-[#6C3FA9] flex items-center justify-center">
                    <Megaphone className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{camp.productName}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{camp.city} · {camp.leadsFound} {tp('home.clients_other', camp.leadsFound)}
                    </p>
                  </div>
                  <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-[#4CAF50]/10 text-[#4CAF50]">{t('home.active')}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Follow-up alert */}
        {(toFollowUp > 0 || aRelancer > 0) && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-5">
            <button onClick={() => navigateTo('leads')} className="w-full p-4 rounded-2xl bg-[#FFB347]/10 border border-[#FFB347]/30 flex items-center gap-3 transition-all active:scale-[0.99]">
              <div className="w-10 h-10 rounded-xl bg-[#FFB347]/20 flex items-center justify-center">
                <RotateCcw className="w-5 h-5 text-[#FFB347]" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-sm text-[#FFB347]">{t('home.followups')}</p>
                <p className="text-xs text-muted-foreground">{aRelancer} {t('home.to_followup')} · {toFollowUp} {t('home.pending')}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-[#FFB347]" />
            </button>
          </motion.div>
        )}

        {/* CRM Pipeline stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-5">
          <h2 className="text-base font-semibold mb-3">{t('home.pipeline')}</h2>
          <div className="grid grid-cols-3 gap-2">
            {STAGE_ORDER.map((stage) => {
              const config = STAGE_CONFIG[stage]
              const count = leads.filter(l => l.stage === stage).length
              return (
                <button
                  key={stage}
                  onClick={() => {
                    useProcibleStore.getState().setActiveStageFilter(stage)
                    navigateTo('leads')
                  }}
                  className="bg-card rounded-2xl p-3 border border-border/50 shadow-sm transition-all active:scale-[0.98]"
                >
                  <span className={`text-lg ${config.color}`}>{config.icon}</span>
                  <p className={`text-xl font-bold mt-1 ${config.color}`}>{count}</p>
                  <p className="text-[10px] text-muted-foreground">{t(config.labelKey)}</p>
                </button>
              )
            })}
          </div>
        </motion.div>

        {/* Quick stats row */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-[#4CAF50]/10 flex items-center justify-center">
                <Trophy className="w-4 h-4 text-[#4CAF50]" />
              </div>
            </div>
            <p className="text-2xl font-bold">{gagnes}</p>
            <p className="text-xs text-muted-foreground">{t('home.won_clients')}</p>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-[#6C3FA9]/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-[#6C3FA9]" />
              </div>
            </div>
            <p className="text-2xl font-bold">{avgScore}</p>
            <p className="text-xs text-muted-foreground">{t('home.avg_score')}</p>
          </div>
        </motion.div>

        {/* Recent leads */}
        {leads.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <h2 className="text-base font-semibold mb-3">{t('home.recent_actions')}</h2>
            <div className="space-y-2">
              {leads.filter(l => l.stage !== 'perdu').slice(0, 4).map((lead) => (
                <button
                  key={lead.id}
                  onClick={() => {
                    useProcibleStore.getState().setSelectedLeadId(lead.id)
                    navigateTo('lead-detail')
                  }}
                  className="w-full flex items-center gap-3 bg-card rounded-2xl p-3.5 border border-border/50 shadow-sm transition-all active:scale-[0.99]"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF7B54] to-[#6C3FA9] flex items-center justify-center text-white font-bold text-sm">
                    {lead.name.charAt(0)}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-semibold text-sm truncate">{lead.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{lead.business || ''} · {t(STAGE_CONFIG[lead.stage].labelKey)}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${STAGE_CONFIG[lead.stage].bg} ${STAGE_CONFIG[lead.stage].color}`}>
                    {lead.score}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
