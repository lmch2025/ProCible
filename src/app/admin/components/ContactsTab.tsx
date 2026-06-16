'use client'

import { useState, useEffect, useRef } from 'react'
import { Phone, MessageSquare, Mail, Eye, MapPin, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { SearchBar, FilterSelect, Pagination, EmptyState, LoadingSkeleton, Badge, BottomSheet, DetailRow, CONTACT_TYPE_LABELS, CONTACT_TYPE_COLORS, STAGE_LABELS, SectionHeader, ConfirmDialog } from './SharedComponents'

export default function ContactsTab() {
  const [contacts, setContacts] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedContact, setSelectedContact] = useState<any>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const init = useRef(false)
  useEffect(() => {
    if (init.current) return
    init.current = true
    fetchContacts()
  }, [page])

  const fetchContacts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      const res = await fetch(`/admin/api/contacts?${params}`)
      const data = await res.json()
      setContacts(data.contacts || [])
      setTotal(data.total || 0)
    } catch {}
    setLoading(false)
  }

  const deleteContact = async (id: string) => {
    await fetch(`/admin/api/contacts?id=${id}`, { method: 'DELETE' })
    toast.success('Contact supprime')
    setConfirmDelete(null)
    fetchContacts()
  }

  const typeOptions = Object.entries(CONTACT_TYPE_LABELS).map(([k, v]) => ({ value: k, label: v }))
  const filtered = contacts.filter((c: any) => {
    if (typeFilter && c.type !== typeFilter) return false
    if (search) {
      const s = search.toLowerCase()
      return (c.lead?.name || '').toLowerCase().includes(s) || (c.content || '').toLowerCase().includes(s)
    }
    return true
  })

  return (
    <div className="p-4 space-y-4">
      <SectionHeader title="Historique contacts" subtitle={`${total} enregistrements`} />

      <div className="flex gap-2">
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} placeholder="Nom du client, contenu..." />
        </div>
        <FilterSelect value={typeFilter} onChange={setTypeFilter} options={typeOptions} placeholder="Tous types" />
      </div>

      {loading ? <LoadingSkeleton /> : (
        <div className="space-y-2">
          {filtered.map((contact: any) => (
            <div key={contact.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <Badge label={CONTACT_TYPE_LABELS[contact.type] || contact.type} color={CONTACT_TYPE_COLORS[contact.type] || 'bg-gray-100'} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900">{contact.lead?.name || 'Client inconnu'}</p>
                    {contact.content && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{contact.content}</p>}
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                      <span>{new Date(contact.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      {contact.lead?.user && <span>via {contact.lead.user.name || contact.lead.user.phone}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {contact.aiGenerated && <Badge label="IA" color="bg-[#6C3FA9]/10 text-[#6C3FA9]" />}
                  </div>
                </div>
              </div>
              <div className="flex border-t border-gray-100">
                <button onClick={() => setSelectedContact(contact)} className="flex-1 py-2.5 text-xs font-medium text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors">Details</button>
                <div className="w-px bg-gray-100" />
                <button onClick={() => setConfirmDelete(contact.id)} className="flex-1 py-2.5 text-xs font-medium text-red-500 hover:bg-red-50 active:bg-red-100 transition-colors">Suppr.</button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <EmptyState message="Aucun contact trouve" />}
        </div>
      )}

      <Pagination page={page} totalPages={Math.ceil(total / 20)} setPage={p => { setPage(p); fetchContacts() }} />

      <BottomSheet open={!!selectedContact} onClose={() => setSelectedContact(null)} title="Details du contact">
        {selectedContact && (
          <div className="space-y-3">
            <DetailRow label="ID" value={selectedContact.id} mono />
            <DetailRow label="Type" value={CONTACT_TYPE_LABELS[selectedContact.type] || selectedContact.type} />
            <DetailRow label="Client" value={selectedContact.lead?.name || '—'} />
            <DetailRow label="Entreprise" value={selectedContact.lead?.business || '—'} />
            <DetailRow label="Etape client" value={STAGE_LABELS[selectedContact.lead?.stage] || '—'} />
            <DetailRow label="Genere par IA" value={selectedContact.aiGenerated ? 'Oui' : 'Non'} />
            <DetailRow label="Proprietaire" value={selectedContact.lead?.user?.name || selectedContact.lead?.user?.phone || '—'} />
            <DetailRow label="Date" value={new Date(selectedContact.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} />
            {selectedContact.content && (
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] text-gray-500 font-semibold mb-1">CONTENU</p>
                <p className="text-xs text-gray-700 whitespace-pre-wrap">{selectedContact.content}</p>
              </div>
            )}
          </div>
        )}
      </BottomSheet>

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && deleteContact(confirmDelete)}
        title="Supprimer ce contact"
        message="Cette action est irreversible."
      />
    </div>
  )
}
