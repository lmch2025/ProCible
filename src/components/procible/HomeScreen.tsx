'use client'

import { motion } from 'framer-motion'
import { useProcibleStore, STAGE_ORDER, STAGE_CONFIG, type LeadStage } from '@/store/procible-store'
import { Coins, ArrowRight, Moon, TrendingUp, AlertTriangle, RotateCcw, Trophy, Megaphone, MapPin } from 'lucide-react'

export default function HomeScreen() {
  const { leads, newLeadsCount, navigateTo, plan, credits, campaigns } = useProcibleStore()

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

  return (
    <div className="pb-28">
      {/* Header - sticky */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl px-5 pt-6 pb-3">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Bonjour</p>
            <h1 className="text-2xl font-bold procible-gradient-text">ProCible</h1>
          </div>
          <div className="flex items-center gap-2 bg-secondary rounded-full px-3 py-1.5">
            <Coins className="w-4 h-4 text-[#FF7B54]" />
            <span className="text-sm font-medium text-secondary-foreground">{credits} crédits</span>
          </div>
        </motion.div>
      </div>

      <div className="px-5 mt-4">
        {/* Main card - New prospects */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative overflow-hidden rounded-3xl procible-gradient p-6 mb-5 shadow-xl">
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
          <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-white/5 rounded-full" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Moon className="w-5 h-5 text-white/80" />
              <span className="text-white/80 text-sm">Cette nuit</span>
            </div>
            <motion.div className="mb-4" animate={{ scale: [1, 1.02, 1] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
              <span className="text-6xl font-bold text-white">{nouveaux || newLeadsCount || 0}</span>
              <span className="text-xl text-white/80 ml-2">nouveaux</span>
            </motion.div>
            <p className="text-white/80 text-lg mb-5">clients trouvés par ProCible</p>
            <button onClick={() => navigateTo('leads')} className="w-full py-4 bg-white rounded-2xl text-[#FF7B54] font-bold text-lg flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98]">
              Voir mes clients
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>

        {/* Active campaigns */}
        {activeCampaigns.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="mb-5">
            <h2 className="text-base font-semibold mb-3">Campagnes actives</h2>
            <div className="space-y-2">
              {activeCampaigns.slice(0, 2).map((camp) => (
                <div key={camp.id} className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF7B54] to-[#6C3FA9] flex items-center justify-center">
                    <Megaphone className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{camp.productName}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{camp.city} · {camp.leadsFound} clients
                    </p>
                  </div>
                  <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-[#4CAF50]/10 text-[#4CAF50]">Active</span>
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
                <p className="font-semibold text-sm text-[#FFB347]">Relances à faire</p>
                <p className="text-xs text-muted-foreground">{aRelancer} à relancer · {toFollowUp} suivis en attente</p>
              </div>
              <ArrowRight className="w-4 h-4 text-[#FFB347]" />
            </button>
          </motion.div>
        )}

        {/* CRM Pipeline stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-5">
          <h2 className="text-base font-semibold mb-3">Pipeline</h2>
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
                  <p className="text-[10px] text-muted-foreground">{config.label}</p>
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
            <p className="text-xs text-muted-foreground">Clients gagnés</p>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-[#6C3FA9]/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-[#6C3FA9]" />
              </div>
            </div>
            <p className="text-2xl font-bold">{avgScore}</p>
            <p className="text-xs text-muted-foreground">Score moyen</p>
          </div>
        </motion.div>

        {/* Recent leads */}
        {leads.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <h2 className="text-base font-semibold mb-3">Actions récentes</h2>
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
                    <p className="text-xs text-muted-foreground truncate">{lead.business || ''} · {STAGE_CONFIG[lead.stage].label}</p>
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
