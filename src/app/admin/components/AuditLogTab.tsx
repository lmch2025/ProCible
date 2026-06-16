'use client'

import { useState, useEffect, useRef } from 'react'
import { Clock, User, FileText } from 'lucide-react'
import { FilterSelect, Pagination, EmptyState, LoadingSkeleton, Badge, BottomSheet, DetailRow, ACTION_COLORS, ACTION_LABELS, SectionHeader } from './SharedComponents'

export default function AuditLogTab() {
  const [logs, setLogs] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [actionFilter, setActionFilter] = useState('')
  const [entityFilter, setEntityFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedLog, setSelectedLog] = useState<any>(null)

  const init = useRef(false)
  useEffect(() => {
    if (init.current) return
    init.current = true
    fetchLogs()
  }, [page])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '30' })
      if (actionFilter) params.set('action', actionFilter)
      if (entityFilter) params.set('entity', entityFilter)
      const res = await fetch(`/admin/api/audit?${params}`)
      const data = await res.json()
      setLogs(data.logs || [])
      setTotal(data.total || 0)
    } catch {}
    setLoading(false)
  }

  const actionOptions = Object.entries(ACTION_LABELS).map(([k, v]) => ({ value: k, label: v }))
  const entityOptions = [
    { value: 'user', label: 'Utilisateur' },
    { value: 'lead', label: 'Client' },
    { value: 'campaign', label: 'Campagne' },
    { value: 'notification', label: 'Notification' },
    { value: 'settings', label: 'Parametres' },
    { value: 'credit', label: 'Credits' },
    { value: 'admin', label: 'Admin' },
  ]

  const entityLabels: Record<string, string> = {
    user: 'Utilisateur', lead: 'Client', campaign: 'Campagne',
    notification: 'Notification', settings: 'Parametres', credit: 'Credits', admin: 'Admin',
  }

  return (
    <div className="p-4 space-y-4">
      <SectionHeader title="Journal d'audit" subtitle={`${total} entrees`} />

      <div className="flex gap-2">
        <FilterSelect value={actionFilter} onChange={v => { setActionFilter(v); setPage(1); fetchLogs() }} options={actionOptions} placeholder="Toutes actions" />
        <FilterSelect value={entityFilter} onChange={v => { setEntityFilter(v); setPage(1); fetchLogs() }} options={entityOptions} placeholder="Toutes entites" />
      </div>

      {loading ? <LoadingSkeleton /> : (
        <div className="space-y-2">
          {logs.map((log: any) => (
            <div key={log.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100" onClick={() => setSelectedLog(log)}>
              <div className="flex items-start gap-3">
                <Badge label={ACTION_LABELS[log.action] || log.action} color={ACTION_COLORS[log.action] || 'bg-gray-100'} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{entityLabels[log.entity] || log.entity}{log.entityId ? ` #${log.entityId.slice(-6)}` : ''}</p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                    <span className="flex items-center gap-1"><User className="w-3 h-3" />{log.adminEmail}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(log.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {logs.length === 0 && <EmptyState message="Aucune entree d'audit" />}
        </div>
      )}

      <Pagination page={page} totalPages={Math.ceil(total / 30)} setPage={p => { setPage(p); fetchLogs() }} />

      <BottomSheet open={!!selectedLog} onClose={() => setSelectedLog(null)} title="Details de l'action">
        {selectedLog && (
          <div className="space-y-3">
            <DetailRow label="ID" value={selectedLog.id} mono />
            <DetailRow label="Action" value={ACTION_LABELS[selectedLog.action] || selectedLog.action} />
            <DetailRow label="Entite" value={entityLabels[selectedLog.entity] || selectedLog.entity} />
            <DetailRow label="ID Entite" value={selectedLog.entityId} mono />
            <DetailRow label="Admin" value={selectedLog.adminEmail} />
            <DetailRow label="IP" value={selectedLog.ip || '—'} />
            <DetailRow label="Date" value={new Date(selectedLog.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })} />
            {selectedLog.details && (
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] text-gray-500 font-semibold mb-1">DETAILS</p>
                <pre className="text-xs text-gray-700 whitespace-pre-wrap break-all">{(() => { try { return JSON.stringify(JSON.parse(selectedLog.details), null, 2) } catch { return selectedLog.details } })()}</pre>
              </div>
            )}
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
