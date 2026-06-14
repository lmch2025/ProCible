'use client'

import { motion } from 'framer-motion'
import { useHermesStore } from '@/store/hermes-store'
import { Sparkles, ArrowRight, Moon, TrendingUp } from 'lucide-react'

export default function HomeScreen() {
  const { leads, newLeadsCount, navigateTo, plan, credits } = useHermesStore()
  const newLeads = leads.filter(l => l.status === 'new').length
  const savedLeads = leads.filter(l => l.status === 'saved').length

  return (
    <div className="min-h-screen px-5 pt-6 pb-28">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <p className="text-sm text-muted-foreground">Bonjour 👋</p>
          <h1 className="text-2xl font-bold hermes-gradient-text">Hermes</h1>
        </div>
        <div className="flex items-center gap-2 bg-secondary rounded-full px-3 py-1.5">
          <Sparkles className="w-4 h-4 text-[#FF7B54]" />
          <span className="text-sm font-medium text-secondary-foreground">{credits} crédits</span>
        </div>
      </motion.div>

      {/* Main card - New prospects */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative overflow-hidden rounded-3xl hermes-gradient p-6 mb-6 shadow-xl"
      >
        {/* Decorative circles */}
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
        <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-white/5 rounded-full" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Moon className="w-5 h-5 text-white/80" />
            <span className="text-white/80 text-sm">Cette nuit</span>
          </div>

          <motion.div
            className="mb-4"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <span className="text-6xl font-bold text-white">{newLeads || newLeadsCount || 0}</span>
            <span className="text-xl text-white/80 ml-2">nouveaux</span>
          </motion.div>
          <p className="text-white/80 text-lg mb-6">prospects trouvés par Hermes</p>

          <button
            onClick={() => navigateTo('leads')}
            className="w-full py-4 bg-white rounded-2xl text-[#FF7B54] font-bold text-lg flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98]"
          >
            Voir mes leads
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </motion.div>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-2 gap-4 mb-6"
      >
        <div className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-[#FF7B54]/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-[#FF7B54]" />
            </div>
          </div>
          <p className="text-2xl font-bold">{savedLeads}</p>
          <p className="text-sm text-muted-foreground">Sauvegardés</p>
        </div>

        <div className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-[#6C3FA9]/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#6C3FA9]" />
            </div>
          </div>
          <p className="text-2xl font-bold capitalize">{plan}</p>
          <p className="text-sm text-muted-foreground">Abonnement</p>
        </div>
      </motion.div>

      {/* Quick access - Recent leads */}
      {leads.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h2 className="text-lg font-semibold mb-3">Récents</h2>
          <div className="space-y-3">
            {leads.slice(0, 3).map((lead, i) => (
              <motion.button
                key={lead.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                onClick={() => {
                  useHermesStore.getState().setSelectedLeadId(lead.id)
                  navigateTo('lead-detail')
                }}
                className="w-full flex items-center gap-3 bg-card rounded-2xl p-4 border border-border/50 shadow-sm transition-all active:scale-[0.99]"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF7B54] to-[#6C3FA9] flex items-center justify-center text-white font-bold text-sm">
                  {lead.name.charAt(0)}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-sm">{lead.name}</p>
                  <p className="text-xs text-muted-foreground">{lead.business} · {lead.city}</p>
                </div>
                <SourceBadge source={lead.source} />
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}

function SourceBadge({ source }: { source: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    maps: { bg: 'bg-[#4CAF50]/10', text: 'text-[#4CAF50]', label: 'Maps' },
    facebook: { bg: 'bg-[#1877F2]/10', text: 'text-[#1877F2]', label: 'FB' },
    instagram: { bg: 'bg-[#E4405F]/10', text: 'text-[#E4405F]', label: 'Insta' },
    linkedin: { bg: 'bg-[#0A66C2]/10', text: 'text-[#0A66C2]', label: 'In' },
  }
  const c = config[source] || config.maps

  return (
    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  )
}
