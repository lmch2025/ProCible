'use client'

import { useState, useEffect, useRef } from 'react'
import { Activity, Database, Download, Cpu, Shield, Clock, Server, Trash2, Check, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { LoadingSkeleton, DetailRow, Badge, SectionHeader } from './SharedComponents'

export default function SystemTab() {
  const [health, setHealth] = useState<any>(null)
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState<string | null>(null)
  const [maintenanceMode, setMaintenanceMode] = useState(false)

  const init = useRef(false)
  useEffect(() => {
    if (init.current) return
    init.current = true
    ;(async () => {
      try {
        const [healthRes, settingsRes] = await Promise.all([
          fetch('/admin/api/health'),
          fetch('/admin/api/settings'),
        ])
        const healthData = await healthRes.json()
        const settingsData = await settingsRes.json()
        const map: Record<string, string> = {}
        ;(settingsData.settings || []).forEach((s: any) => { map[s.key] = s.value })
        setHealth(healthData)
        setSettings(map)
        setMaintenanceMode(map.maintenance_mode === 'true')
      } catch {}
      setLoading(false)
    })()
  }, [])

  const exportData = async (entity: string) => {
    setExporting(entity)
    try {
      const res = await fetch(`/admin/api/export?entity=${entity}`)
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${entity}_proCible.csv`
        a.click()
        URL.revokeObjectURL(url)
        toast.success(`${entity} exporte en CSV`)
      } else {
        toast.error('Erreur export')
      }
    } catch {
      toast.error('Erreur export')
    }
    setExporting(null)
  }

  const toggleMaintenance = async () => {
    const newValue = !maintenanceMode
    await fetch('/admin/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'maintenance_mode', value: String(newValue) }),
    })
    setMaintenanceMode(newValue)
    toast.success(newValue ? 'Mode maintenance active' : 'Mode maintenance desactive')
  }

  const purgeAuditLogs = async () => {
    if (!confirm('Supprimer tous les logs d\'audit ? Cette action est irreversible.')) return
    // We'll just log this as an audit action since we don't have a bulk delete API for audit logs
    toast.info('Fonctionnalite a venir')
  }

  const exportEntities = [
    { id: 'users', label: 'Utilisateurs', icon: '👥' },
    { id: 'leads', label: 'Clients', icon: '📋' },
    { id: 'campaigns', label: 'Campagnes', icon: '📢' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
  ]

  if (loading) return <LoadingSkeleton />

  return (
    <div className="p-4 space-y-5">
      <SectionHeader title="Systeme" subtitle="Sante, export et maintenance" />

      {/* System Health */}
      {health && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#2EC4B6]" />
            Sante du systeme
          </h3>
          <div className="space-y-2">
            <DetailRow label="Statut" value={health.status === 'healthy' ? 'En bonne sante' : 'Probleme detecte'} />
            <DetailRow label="Base de donnees" value={health.database?.status || 'N/A'} />
            <DetailRow label="Taille BDD" value={health.database?.size || 'N/A'} />
            <DetailRow label="IA OpenRouter" value={health.ai?.status === 'configured' ? 'Configuree' : 'Non configuree'} />
            <DetailRow label="Environnement" value={health.environment || 'dev'} />
            <DetailRow label="Node.js" value={health.nodeVersion || 'N/A'} />
            <DetailRow label="Uptime" value={health.uptime ? `${Math.round(health.uptime / 60)} min` : 'N/A'} />
          </div>

          {/* Table counts */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-[10px] text-gray-500 font-semibold mb-2">ENREGISTREMENTS PAR TABLE</p>
            <div className="grid grid-cols-4 gap-2">
              {health.database?.tables && Object.entries(health.database.tables).map(([table, count]) => (
                <div key={table} className="bg-gray-50 rounded-xl p-2 text-center">
                  <p className="text-sm font-bold">{count as number}</p>
                  <p className="text-[9px] text-gray-500 capitalize">{table}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Export */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Download className="w-4 h-4 text-[#FF7B54]" />
          Export de donnees
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {exportEntities.map(e => (
            <button
              key={e.id}
              onClick={() => exportData(e.id)}
              disabled={exporting === e.id}
              className="bg-gray-50 rounded-xl p-3 text-left active:scale-[0.98] transition-transform disabled:opacity-50"
            >
              <span className="text-lg">{e.icon}</span>
              <p className="text-sm font-medium mt-1">{e.label}</p>
              <p className="text-[10px] text-gray-500">{exporting === e.id ? 'Export en cours...' : 'CSV'}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Maintenance Mode */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${maintenanceMode ? 'bg-[#FFB347]/10' : 'bg-[#4CAF50]/10'}`}>
              <Shield className={`w-5 h-5 ${maintenanceMode ? 'text-[#FFB347]' : 'text-[#4CAF50]'}`} />
            </div>
            <div>
              <p className="font-semibold text-sm">Mode maintenance</p>
              <p className="text-[10px] text-gray-500">{maintenanceMode ? 'Actif - App inaccessible' : 'Inactif - App en ligne'}</p>
            </div>
          </div>
          <button onClick={toggleMaintenance} className={`w-12 h-6 rounded-full transition-colors ${maintenanceMode ? 'bg-[#FFB347]' : 'bg-[#4CAF50]'}`}>
            <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${maintenanceMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>
      </div>

      {/* App Info */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Server className="w-4 h-4 text-[#6C3FA9]" />
          Informations applicatives
        </h3>
        <DetailRow label="Application" value="ProCible CRM" />
        <DetailRow label="Version" value="1.0.0" />
        <DetailRow label="Framework" value="Next.js 16" />
        <DetailRow label="Base de donnees" value="SQLite (Prisma)" />
        <DetailRow label="IA" value="OpenRouter (7 modeles)" />
      </div>
    </div>
  )
}
