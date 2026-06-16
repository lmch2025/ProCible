'use client'

import { motion } from 'framer-motion'
import { useProcibleStore } from '@/store/procible-store'
import { User, CreditCard, Settings, Shield, ChevronRight, Star, Zap, Coins } from 'lucide-react'

export default function ProfileScreen() {
  const { userName, phone, plan, credits, navigateTo, leads } = useProcibleStore()

  const contactedLeads = leads.filter(l => l.contactCount > 0).length
  const wonLeads = leads.filter(l => l.stage === 'gagne').length

  const planConfig = {
    free: { label: 'Gratuit', color: 'text-muted-foreground', bg: 'bg-secondary', limit: '5 clients/nuit' },
    starter: { label: 'Starter', color: 'text-[#FF7B54]', bg: 'bg-[#FF7B54]/10', limit: '20 clients/nuit' },
    pro: { label: 'Pro', color: 'text-[#6C3FA9]', bg: 'bg-[#6C3FA9]/10', limit: '50 clients/nuit' },
  }

  const currentPlan = planConfig[plan]

  return (
    <div className="pb-28">
      {/* Header - sticky */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl px-5 pt-6 pb-4">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold">Mon Profil</h1>
        </motion.div>
      </div>

      <div className="px-5 mt-2 space-y-6">
        {/* Profile card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-3xl shadow-lg border border-border/30 p-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF7B54] to-[#6C3FA9] flex items-center justify-center text-white text-2xl font-bold shadow-md">
              {(userName || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{userName || 'Utilisateur'}</h2>
              <p className="text-sm text-muted-foreground">{phone || '+237 6XX XXX XXX'}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-border/50">
            <div className="text-center">
              <p className="text-xl font-bold text-[#FF7B54]">{leads.length}</p>
              <p className="text-xs text-muted-foreground">Clients</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-[#6C3FA9]">{contactedLeads}</p>
              <p className="text-xs text-muted-foreground">Contactés</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-[#4CAF50]">{wonLeads}</p>
              <p className="text-xs text-muted-foreground">Gagnés</p>
            </div>
          </div>
        </motion.div>

        {/* Subscription card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-3xl shadow-lg border border-border/30 p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF7B54] to-[#6C3FA9] flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold">Abonnement</h3>
              <p className="text-xs text-muted-foreground">{currentPlan.limit}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${currentPlan.bg} ${currentPlan.color}`}>
              {currentPlan.label}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {Object.entries(planConfig).map(([key, config]) => (
              <div
                key={key}
                className={`p-3 rounded-xl border text-center transition-all ${
                  plan === key
                    ? 'border-[#FF7B54] bg-[#FF7B54]/5'
                    : 'border-border/50 bg-background'
                }`}
              >
                <p className={`font-bold text-sm ${config.color}`}>{config.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{config.limit}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigateTo('credits')}
            className="w-full py-4 rounded-2xl procible-gradient text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98]"
            style={{ minHeight: 56 }}
          >
            <Coins className="w-5 h-5" />
            Recharger mes crédits
          </button>

          <div className="flex items-center justify-center gap-4 mt-3">
            {['Mobile Money', 'Orange Money', 'MTN Money'].map((method) => (
              <span key={method} className="text-[10px] text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                {method}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Settings list */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-3xl shadow-sm border border-border/30 overflow-hidden"
        >
          {[
            { icon: Settings, label: 'Préférences', screen: 'preferences' as const, color: 'text-[#FF7B54]' },
            { icon: Shield, label: 'Confidentialité', screen: null, color: 'text-[#6C3FA9]' },
            { icon: Star, label: 'Évaluer ProCible', screen: null, color: 'text-[#FFB347]' },
          ].map((item, i) => (
            <button
              key={i}
              onClick={() => item.screen && navigateTo(item.screen)}
              className="w-full flex items-center gap-3 px-5 py-4 hover:bg-secondary/50 transition-colors border-b border-border/30 last:border-0"
            >
              <item.icon className={`w-5 h-5 ${item.color}`} />
              <span className="flex-1 text-left font-medium text-sm">{item.label}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
        </motion.div>

        <p className="text-center text-xs text-muted-foreground/50">
          ProCible v1.0.0
        </p>
      </div>
    </div>
  )
}
