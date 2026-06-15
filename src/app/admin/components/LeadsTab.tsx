'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Trash2, Edit3, Check, ChevronRight, MapPin, Phone as PhoneIcon, Mail, Calendar, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import { SearchBar, FilterSelect, Pagination, EmptyState, LoadingSkeleton, AvatarInitial, Badge, BottomSheet, DetailRow, STAGE_COLORS, STAGE_LABELS, SectionHeader, ConfirmDialog } from './SharedComponents'

export default function LeadsTab() {
  const [leads, setLeads] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedLead, setSelectedLead] = useState<any>(null)
  const [contactHistory, setContactHistory] = useState<any[]>([])
  const [editStage, setEditStage] = useState('')
  const [showStageEdit, setShowStageEdit] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20', search, stage: stageFilter })
      const res = await fetch(`/admin/api/leads?${params}`)
      const data = await res.json()
      setLeads(data.leads || [])
      setTotal(data.total || 0)
    } catch { toast.error('Erreur de chargement') }
    setLoading(false)
  }, [page, search, stageFilter])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  const openDetail = async (lead: any) => {
    setSelectedLead(lead)
    try {
      const res = await fetch(`/admin/api/contacts?leadId=${lead.id}&limit=20`)
      const data = await res.json()
      setContactHistory(data.contacts || [])
    } catch { setContactHistory([]) }
  }

  const updateStage = async (id: string, stage: string) => {
    await fetch('/admin/api/leads', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, stage }),
    })
    await fetch('/admin/api/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', entity: 'lead', entityId: id, adminEmail: 'admin@procible.app', details: { stage } }),
    })
    toast.success('Statut mis a jour')
    setShowStageEdit(false)
    fetchLeads()
  }

  const deleteLead = async (id: string) => {
    await fetch(`/admin/api/leads?id=${id}`, { method: 'DELETE' })
    await fetch('/admin/api/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', entity: 'lead', entityId: id, adminEmail: 'admin@procible.app' }),
    })
    toast.success('Client supprime')
    setConfirmDelete(null)
    setSelectedLead(null)
    fetchLeads()
  }

  const stageOptions = Object.entries(STAGE_LABELS).map(([k, v]) => ({ value: k, label: v }))

  const sourceLabels: Record<string, string> = { maps: 'Google Maps', facebook: 'Facebook', instagram: 'Instagram', linkedin: 'LinkedIn' }

  return (
    <div className="p-4 space-y-4">
      <SectionHeader title="Clients" subtitle={`${total} au total`} />

      <div className="flex gap-2">
        <div className="flex-1">
          <SearchBar value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Nom, entreprise, ville..." />
        </div>
        <FilterSelect value={stageFilter} onChange={v => { setStageFilter(v); setPage(1) }} options={stageOptions} placeholder="Tous" />
      </div>

      {loading ? <LoadingSkeleton /> : (
        <div className="space-y-2">
          {leads.map((lead: any) => (
            <div key={lead.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <AvatarInitial name={lead.name} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{lead.name}</p>
                    <p className="text-xs text-gray-500 truncate">{lead.business || lead.sector || ''} {lead.city ? `- ${lead.city}` : ''}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold">{lead.score}</p>
                    <p className="text-[10px] text-gray-400">score</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                  <Badge label={STAGE_LABELS[lead.stage] || lead.stage} color={STAGE_COLORS[lead.stage] || 'bg-gray-100 text-gray-600'} />
                  <div className="flex items-center gap-2 text-[10px] text-gray-400">
                    <span>{lead._count?.contacts || 0} contacts</span>
                    <span>{sourceLabels[lead.source] || lead.source}</span>
                    {lead.user && <span>{lead.user.name || lead.user.phone}</span>}
                  </div>
                </div>
              </div>
              <div className="flex border-t border-gray-100">
                <button onClick={() => openDetail(lead)} className="flex-1 py-2.5 text-xs font-medium text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors flex items-center justify-center gap-1">
                  <ChevronRight className="w-3 h-3" />Details
                </button>
                <div className="w-px bg-gray-100" />
                <button onClick={() => { setSelectedLead(lead); setEditStage(lead.stage); setShowStageEdit(true) }} className="flex-1 py-2.5 text-xs font-medium text-[#FF7B54] hover:bg-[#FF7B54]/5 active:bg-[#FF7B54]/10 transition-colors flex items-center justify-center gap-1">
                  <Edit3 className="w-3 h-3" />Etape
                </button>
                <div className="w-px bg-gray-100" />
                <button onClick={() => setConfirmDelete(lead.id)} className="flex-1 py-2.5 text-xs font-medium text-red-500 hover:bg-red-50 active:bg-red-100 transition-colors flex items-center justify-center gap-1">
                  <Trash2 className="w-3 h-3" />Suppr.
                </button>
              </div>
            </div>
          ))}
          {leads.length === 0 && <EmptyState message="Aucun client trouve" />}
        </div>
      )}

      <Pagination page={page} totalPages={Math.ceil(total / 20)} setPage={setPage} />

      {/* Lead Detail */}
      <BottomSheet open={!!selectedLead && !showStageEdit} onClose={() => setSelectedLead(null)} title="Details client">
        {selectedLead && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <AvatarInitial name={selectedLead.name} size="lg" />
              <div>
                <p className="font-bold text-gray-900">{selectedLead.name}</p>
                <p className="text-sm text-gray-500">{selectedLead.business || '—'}</p>
                <Badge label={STAGE_LABELS[selectedLead.stage] || selectedLead.stage} color={STAGE_COLORS[selectedLead.stage] || 'bg-gray-100 text-gray-600'} />
              </div>
            </div>
            <DetailRow label="ID" value={selectedLead.id} mono />
            <DetailRow label="Secteur" value={selectedLead.sector} />
            <DetailRow label="Ville" value={selectedLead.city} />
            <DetailRow label="Telephone" value={selectedLead.phone} />
            <DetailRow label="WhatsApp" value={selectedLead.whatsapp} />
            <DetailRow label="Email" value={selectedLead.email} />
            <DetailRow label="Adresse" value={selectedLead.address} />
            <DetailRow label="Source" value={sourceLabels[selectedLead.source] || selectedLead.source} />
            <DetailRow label="Score" value={selectedLead.score} />
            <DetailRow label="Contacts" value={selectedLead._count?.contacts || 0} />
            <DetailRow label="Proprietaire" value={selectedLead.user?.name || selectedLead.user?.phone || '—'} />
            <DetailRow label="Cree le" value={new Date(selectedLead.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} />
            {selectedLead.aiSuggestion && (
              <div className="bg-[#6C3FA9]/5 rounded-xl p-3 border border-[#6C3FA9]/10">
                <p className="text-[10px] text-[#6C3FA9] font-semibold mb-1">CONSEIL IA</p>
                <p className="text-xs text-gray-700">{selectedLead.aiSuggestion}</p>
              </div>
            )}
            {selectedLead.notes && (
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] text-gray-500 font-semibold mb-1">NOTES</p>
                <p className="text-xs text-gray-700">{selectedLead.notes}</p>
              </div>
            )}

            {/* Contact History */}
            {contactHistory.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">HISTORIQUE CONTACTS</p>
                <div className="space-y-2">
                  {contactHistory.map((c: any) => (
                    <div key={c.id} className="flex items-start gap-2 bg-gray-50 rounded-xl p-2.5">
                      <div className="w-2 h-2 rounded-full bg-[#FF7B54] mt-1.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 capitalize">{c.type}</p>
                        {c.content && <p className="text-[11px] text-gray-500 truncate">{c.content}</p>}
                        <p className="text-[10px] text-gray-400">{new Date(c.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      {c.aiGenerated && <Badge label="IA" color="bg-[#6C3FA9]/10 text-[#6C3FA9]" />}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </BottomSheet>

      {/* Stage Edit Bottom Sheet */}
      <BottomSheet open={showStageEdit} onClose={() => setShowStageEdit(false)} title="Changer l'etape">
        <div className="space-y-2">
          {Object.entries(STAGE_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => { if (selectedLead) updateStage(selectedLead.id, key) }}
              className={`w-full p-3 rounded-xl text-sm font-medium flex items-center gap-3 transition-colors ${
                editStage === key ? `ring-2 ring-[#FF7B54]/30 ${STAGE_COLORS[key]}` : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className={`w-3 h-3 rounded-full ${key === 'nouveau' ? 'bg-[#FF7B54]' : key === 'contacte' ? 'bg-[#2EC4B6]' : key === 'en_discussion' ? 'bg-[#6C3FA9]' : key === 'a_relancer' ? 'bg-[#FFB347]' : key === 'gagne' ? 'bg-[#4CAF50]' : 'bg-[#EF4444]'}`} />
              {label}
              {editStage === key && <Check className="w-4 h-4 ml-auto text-[#FF7B54]" />}
            </button>
          ))}
        </div>
      </BottomSheet>

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && deleteLead(confirmDelete)}
        title="Supprimer ce client"
        message="Cette action est irreversible. L'historique de contacts sera aussi supprime."
      />
    </div>
  )
}
