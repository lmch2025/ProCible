'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Users, Contact, Megaphone, Coins, Bell, BarChart3, TrendingUp, Activity, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react'
import { StatCard, LoadingSkeleton } from './SharedComponents'

export default function DashboardTab() {
  const [stats, setStats] = useState<any>(null)
  const [health, setHealth] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const initialized = useRef(false)
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    let cancelled = false
    ;(async () => {
      try {
        const [statsRes, healthRes] = await Promise.all([
          fetch('/admin/api/stats'),
          fetch('/admin/api/health'),
        ])
        const statsData = await statsRes.json()
        const healthData = await healthRes.json()
        if (!cancelled) { setStats(statsData); setHealth(healthData); setLoading(false) }
      } catch { if (!cancelled) setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [])

  if (loading || !stats) return <LoadingSkeleton />

  const statCards = [
    { label: 'Utilisateurs', value: stats.users.total, sub: `+${stats.users.recentSignups} cette semaine`, icon: Users, color: 'from-[#FF7B54] to-[#FFB347]' },
    { label: 'Clients', value: stats.leads.total, sub: `+${stats.leads.recentLeads} cette semaine`, icon: Contact, color: 'from-[#6C3FA9] to-[#FF7B54]' },
    { label: 'Campagnes actives', value: stats.campaigns.active, sub: `${stats.campaigns.total} au total`, icon: Megaphone, color: 'from-[#2EC4B6] to-[#4CAF50]' },
    { label: 'Score moyen', value: stats.leads.avgScore, sub: 'sur 100', icon: BarChart3, color: 'from-[#FFB347] to-[#FF7B54]' },
    { label: 'Credits totaux', value: stats.users.totalCredits, sub: `${stats.users.total} utilisateurs`, icon: Coins, color: 'from-[#FF7B54] to-[#6C3FA9]' },
    { label: 'Non lues', value: stats.notifications.unread, sub: `${stats.notifications.total} total`, icon: Bell, color: 'from-[#6C3FA9] to-[#2EC4B6]' },
  ]

  const conversionRate = stats.leads.total > 0
    ? Math.round(((stats.leads.stages?.gagne || 0) / stats.leads.total) * 100)
    : 0

  const lossRate = stats.leads.total > 0
    ? Math.round(((stats.leads.stages?.perdu || 0) / stats.leads.total) * 100)
    : 0

  return (
    <div className="p-4 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Vue d&apos;ensemble</h2>
        <p className="text-sm text-gray-500">Tableau de bord ProCible</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3">
        {statCards.map((card, i) => (
          <StatCard key={card.label} label={card.label} value={card.value} sub={card.sub} icon={card.icon} color={card.color} />
        ))}
      </div>

      {/* Conversion rates */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#FF7B54]" />
          Taux de conversion
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#4CAF50]/5 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-[#4CAF50]">{conversionRate}%</p>
            <p className="text-[10px] text-gray-500">Gagne</p>
          </div>
          <div className="bg-[#EF4444]/5 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-[#EF4444]">{lossRate}%</p>
            <p className="text-[10px] text-gray-500">Perdu</p>
          </div>
        </div>
      </div>

      {/* Plans distribution */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Distribution des plans</h3>
        <div className="space-y-3">
          {[
            { label: 'Gratuit', count: stats.users.plans.free, color: 'bg-gray-400', total: stats.users.total },
            { label: 'Starter', count: stats.users.plans.starter, color: 'bg-[#FF7B54]', total: stats.users.total },
            { label: 'Pro', count: stats.users.plans.pro, color: 'bg-[#6C3FA9]', total: stats.users.total },
          ].map(p => (
            <div key={p.label}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-600">{p.label}</span>
                <span className="font-semibold">{p.count} ({p.total > 0 ? Math.round(p.count / p.total * 100) : 0}%)</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${p.total > 0 ? (p.count / p.total * 100) : 0}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`h-full ${p.color} rounded-full`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pipeline stages */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Pipeline clients</h3>
        <div className="grid grid-cols-3 gap-2">
          {[
            { stage: 'nouveau', label: 'Nouveau', color: 'text-[#FF7B54] bg-[#FF7B54]/10' },
            { stage: 'contacte', label: 'Contacte', color: 'text-[#2EC4B6] bg-[#2EC4B6]/10' },
            { stage: 'en_discussion', label: 'Discussion', color: 'text-[#6C3FA9] bg-[#6C3FA9]/10' },
            { stage: 'a_relancer', label: 'Relancer', color: 'text-[#FFB347] bg-[#FFB347]/10' },
            { stage: 'gagne', label: 'Gagne', color: 'text-[#4CAF50] bg-[#4CAF50]/10' },
            { stage: 'perdu', label: 'Perdu', color: 'text-[#EF4444] bg-[#EF4444]/10' },
          ].map(s => (
            <div key={s.stage} className={`rounded-xl p-3 text-center ${s.color}`}>
              <p className="text-lg font-bold">{stats.leads.stages[s.stage] || 0}</p>
              <p className="text-[10px] font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Sources distribution */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Sources des clients</h3>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(stats.leads.sources).map(([source, count]) => (
            <div key={source} className="flex items-center gap-2 bg-gray-50 rounded-xl p-2.5">
              <div>
                <p className="text-sm font-semibold">{count as number}</p>
                <p className="text-[10px] text-gray-500 capitalize">{source}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Health */}
      {health && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#2EC4B6]" />
            Sante du systeme
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] text-gray-500">Base de donnees</p>
              <p className="text-sm font-semibold flex items-center gap-1">
                <span className="w-2 h-2 bg-[#4CAF50] rounded-full" />
                {health.database?.status || 'OK'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] text-gray-500">IA OpenRouter</p>
              <p className="text-sm font-semibold flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${health.ai?.status === 'configured' ? 'bg-[#4CAF50]' : 'bg-[#FFB347]'}`} />
                {health.ai?.status === 'configured' ? 'Configure' : 'Non configure'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] text-gray-500">Taille BDD</p>
              <p className="text-sm font-semibold">{health.database?.size || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] text-gray-500">Environnement</p>
              <p className="text-sm font-semibold">{health.environment || 'dev'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Notification types */}
      {stats.notifications.types && Object.keys(stats.notifications.types).length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Types de notifications</h3>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(stats.notifications.types).map(([type, count]) => (
              <div key={type} className="bg-gray-50 rounded-xl p-2.5 text-center">
                <p className="text-sm font-bold">{count as number}</p>
                <p className="text-[9px] text-gray-500 capitalize">{type.replace('_', ' ')}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
