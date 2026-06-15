'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Minus, Coins, Edit3 } from 'lucide-react'
import { toast } from 'sonner'
import { SearchBar, EmptyState, LoadingSkeleton, AvatarInitial, Badge, BottomSheet, DetailRow, PLAN_COLORS, SectionHeader } from './SharedComponents'

export default function CreditsTab() {
  const [users, setUsers] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [creditAmount, setCreditAmount] = useState(10)
  const [actionMode, setActionMode] = useState<'add' | 'set' | 'plan'>('add')

  const init = useRef(false)
  useEffect(() => {
    if (init.current) return
    init.current = true
    ;(async () => {
      try {
        const res = await fetch('/admin/api/users?limit=100')
        const d = await res.json()
        setUsers(d.users || [])
      } catch {}
      setLoading(false)
    })()
  }, [])

  const addCredits = async (userId: string, amount: number) => {
    await fetch('/admin/api/credits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, amount }),
    })
    await fetch('/admin/api/audit', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', entity: 'credit', entityId: userId, adminEmail: 'admin@procible.app', details: { action: 'add', amount } }),
    })
    toast.success(`${amount > 0 ? '+' : ''}${amount} credits`)
    refreshUsers()
  }

  const setCredits = async (userId: string, credits: number) => {
    await fetch('/admin/api/credits', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, credits }),
    })
    await fetch('/admin/api/audit', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', entity: 'credit', entityId: userId, adminEmail: 'admin@procible.app', details: { action: 'set', credits } }),
    })
    toast.success(`Credits fixes a ${credits}`)
    setSelectedUser(null)
    refreshUsers()
  }

  const changePlan = async (userId: string, plan: string) => {
    await fetch('/admin/api/credits', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, plan }),
    })
    await fetch('/admin/api/audit', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', entity: 'credit', entityId: userId, adminEmail: 'admin@procible.app', details: { action: 'plan_change', plan } }),
    })
    toast.success(`Plan change en ${plan}`)
    setSelectedUser(null)
    refreshUsers()
  }

  const refreshUsers = async () => {
    const res = await fetch('/admin/api/users?limit=100')
    const d = await res.json()
    setUsers(d.users || [])
  }

  const filtered = users.filter((u: any) =>
    (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
    u.phone.includes(search)
  )

  const totalCredits = users.reduce((s: number, u: any) => s + u.credits, 0)
  const avgCredits = users.length > 0 ? Math.round(totalCredits / users.length) : 0

  if (loading) return <LoadingSkeleton />

  return (
    <div className="p-4 space-y-4">
      <SectionHeader title="Credits & Plans" subtitle="Gerer les credits et abonnements" />

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Credits totaux</p>
          <p className="text-2xl font-bold">{totalCredits}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Moyenne / utilisateur</p>
          <p className="text-2xl font-bold">{avgCredits}</p>
        </div>
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Rechercher un utilisateur..." />

      <div className="space-y-2">
        {filtered.map((user: any) => (
          <div key={user.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <AvatarInitial name={user.name || 'U'} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{user.name || 'Sans nom'}</p>
                <p className="text-xs text-gray-500">{user.phone}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-bold text-[#FF7B54]">{user.credits}</p>
                <Badge label={user.plan} color={PLAN_COLORS[user.plan] || PLAN_COLORS.free} />
              </div>
            </div>
            <button onClick={() => { setSelectedUser(user); setActionMode('add') }} className="w-full mt-2 py-2 bg-gray-50 rounded-xl text-xs text-gray-500 font-medium flex items-center justify-center gap-1 active:bg-gray-100 transition-colors">
              <Edit3 className="w-3 h-3" />Modifier credits / plan
            </button>
          </div>
        ))}
        {filtered.length === 0 && <EmptyState message="Aucun utilisateur" />}
      </div>

      <BottomSheet open={!!selectedUser} onClose={() => setSelectedUser(null)} title="Modifier credits & plan">
        {selectedUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <AvatarInitial name={selectedUser.name || 'U'} size="lg" />
              <div>
                <p className="font-bold">{selectedUser.name || 'Sans nom'}</p>
                <p className="text-sm text-gray-500">{selectedUser.credits} credits - <span className="font-medium">{selectedUser.plan}</span></p>
              </div>
            </div>

            {/* Mode tabs */}
            <div className="flex bg-gray-100 rounded-xl p-1">
              {[
                { id: 'add' as const, label: 'Ajouter' },
                { id: 'set' as const, label: 'Fixer' },
                { id: 'plan' as const, label: 'Plan' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActionMode(tab.id)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${actionMode === tab.id ? 'bg-white text-[#FF7B54] shadow-sm' : 'text-gray-500'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {actionMode === 'add' && (
              <div className="space-y-3">
                <div className="grid grid-cols-4 gap-2">
                  <button onClick={() => addCredits(selectedUser.id, -5)} className="py-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium active:scale-95 transition-transform flex items-center justify-center gap-1"><Minus className="w-4 h-4" />5</button>
                  <button onClick={() => addCredits(selectedUser.id, 5)} className="py-3 bg-green-50 text-green-600 rounded-xl text-sm font-medium active:scale-95 transition-transform flex items-center justify-center gap-1"><Plus className="w-4 h-4" />5</button>
                  <button onClick={() => addCredits(selectedUser.id, 20)} className="py-3 bg-green-50 text-green-600 rounded-xl text-sm font-medium active:scale-95 transition-transform flex items-center justify-center gap-1"><Plus className="w-4 h-4" />20</button>
                  <button onClick={() => addCredits(selectedUser.id, 50)} className="py-3 bg-green-50 text-green-600 rounded-xl text-sm font-medium active:scale-95 transition-transform flex items-center justify-center gap-1"><Plus className="w-4 h-4" />50</button>
                </div>
              </div>
            )}

            {actionMode === 'set' && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input type="number" value={creditAmount} onChange={e => setCreditAmount(parseInt(e.target.value) || 0)} className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7B54]/30" />
                  <button onClick={() => setCredits(selectedUser.id, creditAmount)} className="px-5 py-2.5 bg-[#6C3FA9] text-white rounded-xl text-sm font-medium active:scale-95 transition-transform">Fixer</button>
                </div>
              </div>
            )}

            {actionMode === 'plan' && (
              <div className="grid grid-cols-3 gap-2">
                {['free', 'starter', 'pro'].map(p => (
                  <button key={p} onClick={() => changePlan(selectedUser.id, p)} className={`py-3 rounded-xl text-sm font-medium capitalize active:scale-95 transition-transform ${selectedUser.plan === p ? 'bg-[#FF7B54] text-white' : 'bg-gray-100 text-gray-600'}`}>{p}</button>
                ))}
              </div>
            )}
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
