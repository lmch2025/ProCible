'use client'

import { motion } from 'framer-motion'
import { useProcibleStore } from '@/store/procible-store'
import { User, CreditCard, Settings, Shield, ChevronRight, Star, Zap, Coins, Globe } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

export default function ProfileScreen() {
  const { userName, phone, plan, credits, navigateTo, leads } = useProcibleStore()
  const { t, locale, setLocale } = useI18n()

  const contactedLeads = leads.filter(l => l.contactCount > 0).length
  const wonLeads = leads.filter(l => l.stage === 'gagne').length

  const planConfig = {
    free: { labelKey: 'profile.plan_free', color: 'text-muted-foreground', bg: 'bg-secondary', limitKey: 'profile.plan_limit_free' },
    starter: { labelKey: 'profile.plan_starter', color: 'text-[#FF7B54]', bg: 'bg-[#FF7B54]/10', limitKey: 'profile.plan_limit_starter' },
    pro: { labelKey: 'profile.plan_pro', color: 'text-[#6C3FA9]', bg: 'bg-[#6C3FA9]/10', limitKey: 'profile.plan_limit_pro' },
  }

  const currentPlan = planConfig[plan]

  return (
    <div className="pb-28">
      {/* Header - sticky */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl px-5 pt-6 pb-4">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold">{t('profile.title')}</h1>
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
              <h2 className="text-xl font-bold">{userName || t('profile.default_user')}</h2>
              <p className="text-sm text-muted-foreground">{phone || t('profile.default_phone')}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-border/50">
            <div className="text-center">
              <p className="text-xl font-bold text-[#FF7B54]">{leads.length}</p>
              <p className="text-xs text-muted-foreground">{t('profile.stats_clients')}</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-[#6C3FA9]">{contactedLeads}</p>
              <p className="text-xs text-muted-foreground">{t('profile.stats_contacted')}</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-[#4CAF50]">{wonLeads}</p>
              <p className="text-xs text-muted-foreground">{t('profile.stats_won')}</p>
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
              <h3 className="font-bold">{t('profile.subscription')}</h3>
              <p className="text-xs text-muted-foreground">{t(currentPlan.limitKey)}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${currentPlan.bg} ${currentPlan.color}`}>
              {t(currentPlan.labelKey)}
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
                <p className={`font-bold text-sm ${config.color}`}>{t(config.labelKey)}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{t(config.limitKey)}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigateTo('credits')}
            className="w-full py-4 rounded-2xl procible-gradient text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98]"
            style={{ minHeight: 56 }}
          >
            <Coins className="w-5 h-5" />
            {t('profile.recharge')}
          </button>

          <div className="flex items-center justify-center gap-4 mt-3">
            {[
              t('profile.payment_momo'),
              t('profile.payment_orange'),
              t('profile.payment_mtn'),
            ].map((method) => (
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
          {/* Language selector */}
          <div className="px-5 py-4 border-b border-border/30">
            <div className="flex items-center gap-3 mb-2">
              <Globe className="w-5 h-5 text-[#2EC4B6]" />
              <span className="flex-1 font-medium text-sm">{t('profile.settings_language')}</span>
            </div>
            <p className="text-xs text-muted-foreground mb-2 ml-8">{t('profile.language_description')}</p>
            <div className="flex gap-2 ml-8">
              <button
                type="button"
                onClick={() => setLocale('fr')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  locale === 'fr'
                    ? 'bg-[#FF7B54] text-white shadow-sm'
                    : 'bg-secondary text-secondary-foreground'
                }`}
              >
                {t('profile.language_fr')}
              </button>
              <button
                type="button"
                onClick={() => setLocale('en')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  locale === 'en'
                    ? 'bg-[#FF7B54] text-white shadow-sm'
                    : 'bg-secondary text-secondary-foreground'
                }`}
              >
                {t('profile.language_en')}
              </button>
            </div>
          </div>
          {[
            { icon: Settings, labelKey: 'profile.settings_preferences', screen: 'preferences' as const, color: 'text-[#FF7B54]' },
            { icon: Shield, labelKey: 'profile.settings_privacy', screen: null, color: 'text-[#6C3FA9]' },
            { icon: Star, labelKey: 'profile.settings_rate', screen: null, color: 'text-[#FFB347]' },
          ].map((item, i) => (
            <button
              key={i}
              onClick={() => item.screen && navigateTo(item.screen)}
              className="w-full flex items-center gap-3 px-5 py-4 hover:bg-secondary/50 transition-colors border-b border-border/30 last:border-0"
            >
              <item.icon className={`w-5 h-5 ${item.color}`} />
              <span className="flex-1 text-left font-medium text-sm">{t(item.labelKey)}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
        </motion.div>

        <p className="text-center text-xs text-muted-foreground/50">
          {t('profile.version')}
        </p>
      </div>
    </div>
  )
}
