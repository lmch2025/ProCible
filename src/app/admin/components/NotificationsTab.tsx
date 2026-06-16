'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Check, Trash2, Send, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Pagination, EmptyState, LoadingSkeleton, Badge, BottomSheet, TYPE_COLORS, TYPE_LABELS, SectionHeader } from './SharedComponents'

export default function NotificationsTab() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showBroadcast, setShowBroadcast] = useState(false)
  const [createForm, setCreateForm] = useState({ userId: '', type: 'system', title: '', message: '' })
  const [broadcastForm, setBroadcastForm] = useState({ type: 'system', title: '', message: '' })
  const [users, setUsers] = useState<any[]>([])

  const fetchNotifs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      const res = await fetch(`/admin/api/notifications?${params}`)
      const data = await res.json()
      setNotifications(data.notifications || [])
      setTotal(data.total || 0)
    } catch {}
    setLoading(false)
  }, [page])

  const init = useRef(false)
  useEffect(() => {
    if (init.current) return
    init.current = true
    ;(async () => {
      const [notifsRes, usersRes] = await Promise.all([
        fetch('/admin/api/notifications?page=1&limit=20'),
        fetch('/admin/api/users?limit=100'),
      ])
      const notifsData = await notifsRes.json()
      const usersData = await usersRes.json()
      setNotifications(notifsData.notifications || [])
      setTotal(notifsData.total || 0)
      setUsers(usersData.users || [])
      setLoading(false)
    })()
  }, [])

  const markAllRead = async () => {
    await fetch('/admin/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ markAllRead: true }) })
    toast.success('Toutes marquees comme lues')
    fetchNotifs()
  }

  const createNotif = async () => {
    if (!createForm.userId || !createForm.title || !createForm.message) return
    await fetch('/admin/api/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(createForm) })
    await fetch('/admin/api/audit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create', entity: 'notification', adminEmail: 'admin@procible.app' }) })
    toast.success('Notification envoyee')
    setShowCreate(false)
    setCreateForm({ userId: '', type: 'system', title: '', message: '' })
    fetchNotifs()
  }

  const broadcastNotif = async () => {
    if (!broadcastForm.title || !broadcastForm.message) return
    for (const user of users) {
      await fetch('/admin/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, type: broadcastForm.type, title: broadcastForm.title, message: broadcastForm.message }),
      })
    }
    await fetch('/admin/api/audit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'bulk', entity: 'notification', adminEmail: 'admin@procible.app', details: { type: 'broadcast', count: users.length } }) })
    toast.success(`Notification envoyee a ${users.length} utilisateurs`)
    setShowBroadcast(false)
    setBroadcastForm({ type: 'system', title: '', message: '' })
    fetchNotifs()
  }

  const deleteNotif = async (id: string) => {
    await fetch(`/admin/api/notifications?id=${id}`, { method: 'DELETE' })
    toast.success('Supprimee')
    fetchNotifs()
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <SectionHeader title="Alertes" subtitle={`${total} notifications`} />
      </div>

      <div className="flex gap-2">
        <button onClick={markAllRead} className="flex-1 py-2.5 bg-gray-100 rounded-xl text-xs font-medium text-gray-600 flex items-center justify-center gap-1 active:scale-95 transition-transform"><Check className="w-3 h-3" />Tout lire</button>
        <button onClick={() => setShowBroadcast(true)} className="flex-1 py-2.5 bg-[#6C3FA9] text-white rounded-xl text-xs font-medium flex items-center justify-center gap-1 active:scale-95 transition-transform"><Send className="w-3 h-3" />Diffuser</button>
        <button onClick={() => setShowCreate(true)} className="flex-1 py-2.5 bg-[#FF7B54] text-white rounded-xl text-xs font-medium flex items-center justify-center gap-1 active:scale-95 transition-transform"><Plus className="w-3 h-3" />Envoyer</button>
      </div>

      {loading ? <LoadingSkeleton /> : (
        <div className="space-y-2">
          {notifications.map((notif: any) => (
            <div key={notif.id} className={`bg-white rounded-2xl p-4 shadow-sm border ${notif.read ? 'border-gray-100' : 'border-[#FF7B54]/20 bg-[#FF7B54]/5'}`}>
              <div className="flex items-start gap-3">
                <Badge label={TYPE_LABELS[notif.type] || notif.type} color={TYPE_COLORS[notif.type] || 'bg-gray-100'} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{notif.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                </div>
                <button onClick={() => deleteNotif(notif.id)} className="shrink-0 p-1 rounded-lg hover:bg-red-50 active:scale-95 transition-transform"><Trash2 className="w-3 h-3 text-red-400" /></button>
              </div>
              <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-400">
                {notif.user && <span>{notif.user.name || notif.user.phone}</span>}
                <span>{new Date(notif.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                {!notif.read && <span className="w-2 h-2 bg-[#FF7B54] rounded-full" />}
              </div>
            </div>
          ))}
          {notifications.length === 0 && <EmptyState message="Aucune notification" />}
        </div>
      )}

      <Pagination page={page} totalPages={Math.ceil(total / 20)} setPage={setPage} />

      {/* Create single notification */}
      <BottomSheet open={showCreate} onClose={() => setShowCreate(false)} title="Envoyer une notification">
        <div className="space-y-3">
          <select value={createForm.userId} onChange={e => setCreateForm(f => ({ ...f, userId: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none">
            <option value="">Choisir un utilisateur</option>
            {users.map((u: any) => <option key={u.id} value={u.id}>{u.name || u.phone}</option>)}
          </select>
          <select value={createForm.type} onChange={e => setCreateForm(f => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none">
            {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input value={createForm.title} onChange={e => setCreateForm(f => ({ ...f, title: e.target.value }))} placeholder="Titre" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7B54]/30" />
          <textarea value={createForm.message} onChange={e => setCreateForm(f => ({ ...f, message: e.target.value }))} placeholder="Message" rows={3} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#FF7B54]/30" />
          <button onClick={createNotif} className="w-full py-3 bg-[#FF7B54] text-white rounded-xl text-sm font-medium active:scale-[0.98] transition-transform flex items-center justify-center gap-2"><Send className="w-4 h-4" />Envoyer</button>
        </div>
      </BottomSheet>

      {/* Broadcast notification */}
      <BottomSheet open={showBroadcast} onClose={() => setShowBroadcast(false)} title="Diffuser a tous">
        <div className="space-y-3">
          <div className="bg-[#6C3FA9]/5 rounded-xl p-3 border border-[#6C3FA9]/10">
            <p className="text-xs text-[#6C3FA9] font-medium">Cette notification sera envoyee a {users.length} utilisateurs</p>
          </div>
          <select value={broadcastForm.type} onChange={e => setBroadcastForm(f => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none">
            {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input value={broadcastForm.title} onChange={e => setBroadcastForm(f => ({ ...f, title: e.target.value }))} placeholder="Titre" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7B54]/30" />
          <textarea value={broadcastForm.message} onChange={e => setBroadcastForm(f => ({ ...f, message: e.target.value }))} placeholder="Message" rows={3} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#FF7B54]/30" />
          <button onClick={broadcastNotif} className="w-full py-3 bg-[#6C3FA9] text-white rounded-xl text-sm font-medium active:scale-[0.98] transition-transform flex items-center justify-center gap-2"><Send className="w-4 h-4" />Diffuser a {users.length} utilisateurs</button>
        </div>
      </BottomSheet>
    </div>
  )
}
