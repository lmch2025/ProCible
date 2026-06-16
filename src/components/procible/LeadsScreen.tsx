'use client'

import { motion } from 'framer-motion'
import { useProcibleStore, STAGE_CONFIG, STAGE_ORDER, type LeadStage } from '@/store/procible-store'
import { Search, Clock, ChevronRight } from 'lucide-react'
import ProspectionCTA from './ProspectionCTA'

const sourceConfig: Record<string, { bg: string; text: string; label: string }> = {
  maps: { bg: 'bg-[#4CAF50]/10', text: 'text-[#4CAF50]', label: 'Maps' },
  facebook: { bg: 'bg-[#1877F2]/10', text: 'text-[#1877F2]', label: 'FB' },
  instagram: { bg: 'bg-[#E4405F]/10', text: 'text-[#E4405F]', label: 'Insta' },
  linkedin: { bg: 'bg-[#0A66C2]/10', text: 'text-[#0A66C2]', label: 'In' },
}

export default function LeadsScreen() {
  const { leads, activeStageFilter, setActiveStageFilter, navigateTo, setSelectedLeadId } = useProcibleStore()

  const filteredLeads = activeStageFilter === 'all'
    ? leads
    : leads.filter(l => l.stage === activeStageFilter)

  const stageCounts = STAGE_ORDER.reduce((acc, stage) => {
    acc[stage] = leads.filter(l => l.stage === stage).length
    return acc
  }, {} as Record<LeadStage, number>)

  return (
    <div className="flex flex-col h-full pb-28">
      {/* Header - sticky */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl px-5 pt-6 pb-3">
        <h1 className="text-2xl font-bold">Mes Clients</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{leads.length} clients au total</p>

        {/* Stage tabs - scrollable */}
        <div className="mt-3 -mx-5 px-5 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          <button
            onClick={() => setActiveStageFilter('all')}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              activeStageFilter === 'all'
                ? 'procible-gradient text-white shadow-md'
                : 'bg-secondary text-secondary-foreground'
            }`}
          >
            Tous ({leads.length})
          </button>
          {STAGE_ORDER.map((stage) => {
            const config = STAGE_CONFIG[stage]
            return (
              <button
                key={stage}
                onClick={() => setActiveStageFilter(stage)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-1.5 ${
                  activeStageFilter === stage
                    ? `${config.bg} ${config.color} ring-2 ring-current/20`
                    : 'bg-secondary text-secondary-foreground'
                }`}
              >
                <span>{config.icon}</span>
                {config.label} ({stageCounts[stage]})
              </button>
            )
          })}
        </div>
      </div>

      {/* Sticky CTA — appears below header, stays fixed when scrolling */}
      <ProspectionCTA />

      {/* Leads list */}
      <div className="flex-1 px-5 mt-4 overflow-y-auto custom-scrollbar">
        {filteredLeads.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16"
          >
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-3">
              <Search className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="font-semibold mb-1">Aucun client ici</p>
            <p className="text-sm text-muted-foreground text-center">
              {activeStageFilter === 'all'
                ? 'ProCible trouvera des clients pour vous cette nuit.'
                : `Aucun client à l'étape "${STAGE_CONFIG[activeStageFilter].label}".`}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {filteredLeads.map((lead, i) => (
              <LeadCard key={lead.id} lead={lead} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function LeadCard({ lead, index }: { lead: ReturnType<typeof useProcibleStore>['leads'][0]; index: number }) {
  const { navigateTo, setSelectedLeadId } = useProcibleStore()
  const stageConfig = STAGE_CONFIG[lead.stage]
  const srcConfig = sourceConfig[lead.source] || sourceConfig.maps

  const scoreColor = lead.score >= 80 ? 'text-[#4CAF50]' : lead.score >= 50 ? 'text-[#FFB347]' : 'text-[#EF4444]'
  const scoreBg = lead.score >= 80 ? 'bg-[#4CAF50]/10' : lead.score >= 50 ? 'bg-[#FFB347]/10' : 'bg-[#EF4444]/10'

  const daysSince = lead.lastContactAt
    ? Math.floor((Date.now() - new Date(lead.lastContactAt).getTime()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={() => {
        setSelectedLeadId(lead.id)
        navigateTo('lead-detail')
      }}
      className="w-full flex items-center gap-3 bg-card rounded-2xl p-4 border border-border/50 shadow-sm transition-all active:scale-[0.99] text-left"
    >
      <div className="relative">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF7B54] to-[#6C3FA9] flex items-center justify-center text-white font-bold text-lg">
          {lead.name.charAt(0)}
        </div>
        <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full ${stageConfig.bg} flex items-center justify-center text-[8px] ${stageConfig.color}`}>
          {stageConfig.icon}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sm truncate">{lead.name}</p>
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${srcConfig.bg} ${srcConfig.text}`}>
            {srcConfig.label}
          </span>
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {lead.business || lead.sector || ''} {lead.city ? `· ${lead.city}` : ''}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${stageConfig.bg} ${stageConfig.color}`}>
            {stageConfig.label}
          </span>
          {daysSince !== null && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5" />
              {daysSince === 0 ? "Aujourd'hui" : daysSince === 1 ? 'Hier' : `il y a ${daysSince}j`}
            </span>
          )}
          {lead.contactCount > 0 && (
            <span className="text-[10px] text-muted-foreground">{lead.contactCount} contact{lead.contactCount > 1 ? 's' : ''}</span>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center gap-1">
        <div className={`w-10 h-10 rounded-xl ${scoreBg} flex items-center justify-center`}>
          <span className={`text-xs font-bold ${scoreColor}`}>{lead.score}</span>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
      </div>
    </motion.button>
  )
}
