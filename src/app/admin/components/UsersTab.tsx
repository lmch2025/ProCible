'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Edit3, Trash2, Check, ChevronRight, Phone, Calendar, Contact, Megaphone, Coins, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { SearchBar, FilterSelect, Pagination, EmptyState, LoadingSkeleton, AvatarInitial, Badge, BottomSheet, DetailRow, PLAN_COLORS, SectionHeader, ActionButton, ConfirmDialog } from './SharedComponents'

export default function UsersTab() {
  const [users, setUsers] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [editForm, setEditForm] = useState({ plan: '', credits: 0, name: '', onboarded: false })
  const [showEdit, setShowEdit] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20', search, plan: planFilter })
      const res = await fetch(`/admin/api/users?${params}`)
      const data = await res.json()
      setUsers(data.users || [])
      setTotal(data.total || 0)
    } catch { toast.error('Erreur de chargement') }
    setLoading(false)
  }, [page, search, planFilter])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const startEdit = (user: any) => {
    setEditForm({ plan: user.plan, credits: user.credits, name: user.name || '', onboarded: user.onboarded })
    setShowEdit(true)
    setSelectedUser(user)
  }

  const saveEdit = async () => {
    if (!selectedUser) return
    await fetch('/admin/api/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selectedUser.id, ...editForm }),
    })
    // Audit log
    await fetch('/admin/api/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', entity: 'user', entityId: selectedUser.id, adminEmail: 'admin@procible.app', details: editForm }),
    })
    toast.success('Utilisateur mis a jour')
    setShowEdit(false)
    setSelectedUser(null)
    fetchUsers()
  }

  const deleteUser = async (id: string) => {
    await fetch(`/admin/api/users?id=${id}`, { method: 'DELETE' })
    await fetch('/admin/api/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', entity: 'user', entityId: id, adminEmail: 'admin@procible.app' }),
    })
    toast.success('Utilisateur supprime')
    setConfirmDelete(null)
    fetchUsers()
  }

  const totalPages = Math.ceil(total / 20)
  const planOptions = [
    { value: 'free', label: 'Gratuit' },
    { value: 'starter', label: 'Starter' },
    { value: 'pro', label: 'Pro' },
  ]

  return (
    <div className="p-4 space-y-4">
      <SectionHeader title="Utilisateurs" subtitle={`${total} inscrits`} />

      <div className="flex gap-2">
        <div className="flex-1">
          <SearchBar value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Nom, telephone..." />
        </div>
        <FilterSelect value={planFilter} onChange={v => { setPlanFilter(v); setPage(1) }} options={planOptions} placeholder="Tous plans" />
      </div>

      {loading ? <LoadingSkeleton /> : (
        <div className="space-y-2">
          {users.map((user: any) => (
            <div key={user.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <AvatarInitial name={user.name || user.phone || 'U'} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{user.name || 'Sans nom'}</p>
                    <p className="text-xs text-gray-500 truncate">{user.phone}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge label={user.plan} color={PLAN_COLORS[user.plan] || PLAN_COLORS.free} />
                    <span className="text-[10px] text-gray-400">{user.credits}cr</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-2 pt-2 border-t border-gray-50 text-[10px] text-gray-400">
                  <span className="flex items-center gap-1"><Contact className="w-3 h-3" />{user._count?.leads || 0} clients</span>
                  <span className="flex items-center gap-1"><Megaphone className="w-3 h-3" />{user._count?.campaigns || 0} camp.</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(user.createdAt).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
              <div className="flex border-t border-gray-100">
                <button onClick={() => { setSelectedUser(user); }} className="flex-1 py-2.5 text-xs font-medium text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors flex items-center justify-center gap-1">
                  <ChevronRight className="w-3 h-3" />Details
                </button>
                <div className="w-px bg-gray-100" />
                <button onClick={() => startEdit(user)} className="flex-1 py-2.5 text-xs font-medium text-[#FF7B54] hover:bg-[#FF7B54]/5 active:bg-[#FF7B54]/10 transition-colors flex items-center justify-center gap-1">
                  <Edit3 className="w-3 h-3" />Modifier
                </button>
                <div className="w-px bg-gray-100" />
                <button onClick={() => setConfirmDelete(user.id)} className="flex-1 py-2.5 text-xs font-medium text-red-500 hover:bg-red-50 active:bg-red-100 transition-colors flex items-center justify-center gap-1">
                  <Trash2 className="w-3 h-3" />Suppr.
                </button>
              </div>
            </div>
          ))}
          {users.length === 0 && <EmptyState message="Aucun utilisateur trouve" />}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} setPage={setPage} />

      {/* Edit Bottom Sheet */}
      <BottomSheet open={showEdit} onClose={() => setShowEdit(false)} title="Modifier l'utilisateur">
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Nom</label>
            <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7B54]/30" placeholder="Nom" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Plan</label>
            <select value={editForm.plan} onChange={e => setEditForm(f => ({ ...f, plan: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none">
              <option value="free">Gratuit</option>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Credits</label>
            <input type="number" value={editForm.credits} onChange={e => setEditForm(f => ({ ...f, credits: parseInt(e.target.value) || 0 }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7B54]/30" />
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-700">Onboarded</span>
            <button onClick={() => setEditForm(f => ({ ...f, onboarded: !f.onboarded }))} className={`w-12 h-6 rounded-full transition-colors ${editForm.onboarded ? 'bg-[#4CAF50]' : 'bg-gray-300'}`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${editForm.onboarded ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <button onClick={saveEdit} className="w-full py-3 bg-[#FF7B54] text-white rounded-xl text-sm font-medium active:scale-[0.98] transition-transform flex items-center justify-center gap-2">
            <Check className="w-4 h-4" />Sauvegarder
          </button>
        </div>
      </BottomSheet>

      {/* User Detail Bottom Sheet */}
      <BottomSheet open={!!selectedUser && !showEdit} onClose={() => setSelectedUser(null)} title="Details utilisateur">
        {selectedUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <AvatarInitial name={selectedUser.name || selectedUser.phone || 'U'} size="lg" />
              <div>
                <p className="font-bold text-gray-900">{selectedUser.name || 'Sans nom'}</p>
                <p className="text-sm text-gray-500">{selectedUser.phone}</p>
                <Badge label={selectedUser.plan} color={PLAN_COLORS[selectedUser.plan] || PLAN_COLORS.free} />
              </div>
            </div>
            <DetailRow label="ID" value={selectedUser.id} mono />
            <DetailRow label="Credits" value={selectedUser.credits} />
            <DetailRow label="Onboarded" value={selectedUser.onboarded ? 'Oui' : 'Non'} />
            <DetailRow label="Clients" value={selectedUser._count?.leads || 0} />
            <DetailRow label="Campagnes" value={selectedUser._count?.campaigns || 0} />
            <DetailRow label="Notifications" value={selectedUser._count?.notifications || 0} />
            <DetailRow label="Inscrit le" value={new Date(selectedUser.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} />
            {selectedUser.preferences && (
              <>
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 mb-2">PREFERENCES</p>
                  <DetailRow label="Secteurs" value={selectedUser.preferences.sectors || 'Aucun'} />
                  <DetailRow label="Villes" value={selectedUser.preferences.cities || 'Aucune'} />
                  <DetailRow label="Type business" value={selectedUser.preferences.businessType || 'Aucun'} />
                </div>
              </>
            )}
            <button onClick={() => { startEdit(selectedUser) }} className="w-full py-3 bg-[#FF7B54] text-white rounded-xl text-sm font-medium active:scale-[0.98] transition-transform flex items-center justify-center gap-2">
              <Edit3 className="w-4 h-4" />Modifier cet utilisateur
            </button>
          </div>
        )}
      </BottomSheet>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && deleteUser(confirmDelete)}
        title="Supprimer l'utilisateur"
        message="Cette action est irreversible. Toutes les donnees associees seront perdues."
      />
    </div>
  )
}
