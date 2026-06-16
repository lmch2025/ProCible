'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Megaphone, MapPin, Calendar, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { FilterSelect, Pagination, EmptyState, LoadingSkeleton, Badge, BottomSheet, DetailRow, STATUS_COLORS, STATUS_LABELS, SectionHeader, ConfirmDialog } from './SharedComponents'
import { formatLocations, parseLocations } from '@/lib/locations'

export default function CampaignsTab() {
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedCamp, setSelectedCamp] = useState<any>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const fetchCampaigns = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20', status: statusFilter })
      const res = await fetch(`/admin/api/campaigns?${params}`)
      const data = await res.json()
      setCampaigns(data.campaigns || [])
      setTotal(data.total || 0)
    } catch { toast.error('Erreur de chargement') }
    setLoading(false)
  }, [page, statusFilter])

  useEffect(() => { fetchCampaigns() }, [fetchCampaigns])

  const updateStatus = async (id: string, status: string) => {
    await fetch('/admin/api/campaigns', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    await fetch('/admin/api/audit', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', entity: 'campaign', entityId: id, adminEmail: 'admin@procible.app', details: { status } }),
    })
    toast.success('Statut campagne modifie')
    fetchCampaigns()
  }

  const deleteCampaign = async (id: string) => {
    await fetch(`/admin/api/campaigns?id=${id}`, { method: 'DELETE' })
    await fetch('/admin/api/audit', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', entity: 'campaign', entityId: id, adminEmail: 'admin@procible.app' }),
    })
    toast.success('Campagne supprimee')
    setConfirmDelete(null)
    fetchCampaigns()
  }

  const statusOptions = Object.entries(STATUS_LABELS).map(([k, v]) => ({ value: k, label: v }))

  return (
    <div className="p-4 space-y-4">
      <SectionHeader title="Campagnes" subtitle={`${total} campagnes`} />
      <FilterSelect value={statusFilter} onChange={v => { setStatusFilter(v); setPage(1) }} options={statusOptions} placeholder="Tous statuts" />

      {loading ? <LoadingSkeleton /> : (
        <div className="space-y-2">
          {campaigns.map((camp: any) => {
            const locSummary = camp.locations ? formatLocations(camp.locations) : camp.city || '—'
            const locCount = camp.locations ? parseLocations(camp.locations).length : 0
            return (
              <div key={camp.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF7B54] to-[#6C3FA9] flex items-center justify-center shrink-0">
                      <Megaphone className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{camp.productName}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{locSummary}</span>
                        {locCount > 1 && <span className="ml-1 shrink-0 bg-[#FF7B54]/10 text-[#FF7B54] px-1.5 py-0.5 rounded text-[10px] font-medium">{locCount} zones</span>}
                        <span className="ml-1 shrink-0">· {camp.leadsFound} clients</span>
                      </p>
                    </div>
                    <Badge label={STATUS_LABELS[camp.status] || camp.status} color={STATUS_COLORS[camp.status] || 'bg-gray-100'} />
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50 text-[10px] text-gray-400">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(camp.createdAt).toLocaleDateString('fr-FR')}</span>
                    {camp.user && <span>{camp.user.name || camp.user.phone}</span>}
                  </div>
                </div>
                <div className="flex border-t border-gray-100">
                  <select
                    value={camp.status}
                    onChange={e => updateStatus(camp.id, e.target.value)}
                    className="flex-1 py-2.5 text-xs font-medium text-[#FF7B54] bg-transparent focus:outline-none text-center"
                  >
                    {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  <div className="w-px bg-gray-100" />
                  <button onClick={() => setSelectedCamp(camp)} className="flex-1 py-2.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">Details</button>
                  <div className="w-px bg-gray-100" />
                  <button onClick={() => setConfirmDelete(camp.id)} className="flex-1 py-2.5 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors">Suppr.</button>
                </div>
              </div>
            )
          })}
          {campaigns.length === 0 && <EmptyState message="Aucune campagne" />}
        </div>
      )}

      <Pagination page={page} totalPages={Math.ceil(total / 20)} setPage={setPage} />

      <BottomSheet open={!!selectedCamp} onClose={() => setSelectedCamp(null)} title="Details campagne">
        {selectedCamp && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF7B54] to-[#6C3FA9] flex items-center justify-center">
                <Megaphone className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-900">{selectedCamp.productName}</p>
                <Badge label={STATUS_LABELS[selectedCamp.status] || selectedCamp.status} color={STATUS_COLORS[selectedCamp.status] || 'bg-gray-100'} />
              </div>
            </div>
            <DetailRow label="ID" value={selectedCamp.id} mono />
            {/* Multi-location list */}
            {selectedCamp.locations ? (
              <div className="space-y-1.5">
                <p className="text-[10px] text-gray-500 uppercase tracking-wide">Zones cibles</p>
                <div className="flex flex-wrap gap-1.5">
                  {parseLocations(selectedCamp.locations).map((loc) => (
                    <span
                      key={loc.raw}
                      className="inline-flex items-center gap-1 bg-[#FF7B54]/10 text-[#FF7B54] text-xs font-medium px-2 py-1 rounded-full"
                    >
                      <span>{loc.flag}</span>
                      <span>{loc.city || `Tout ${loc.country}`}</span>
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <DetailRow label="Ville" value={selectedCamp.city} />
            )}
            <DetailRow label="Clients trouves" value={selectedCamp.leadsFound} />
            <DetailRow label="Proprietaire" value={selectedCamp.user?.name || selectedCamp.user?.phone || '—'} />
            <DetailRow label="Creee le" value={new Date(selectedCamp.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} />
            {selectedCamp.images && (
              <DetailRow label="Images" value={selectedCamp.images.split(',').length + ' image(s)'} />
            )}
          </div>
        )}
      </BottomSheet>

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && deleteCampaign(confirmDelete)}
        title="Supprimer cette campagne"
        message="Cette action est irreversible."
      />
    </div>
  )
}
