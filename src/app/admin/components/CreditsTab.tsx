'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Minus, Edit3, Settings, Receipt, Users, Zap, Save, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { SearchBar, EmptyState, LoadingSkeleton, AvatarInitial, Badge, BottomSheet, PLAN_COLORS, SectionHeader } from './SharedComponents'

type SubTab = 'users' | 'rules' | 'transactions'

interface CreditRule {
  id: string
  action: string
  label: string
  cost: number
  description: string | null
  enabled: boolean
  freeQuotaPerDay: number
}

interface CreditTransaction {
  id: string
  amount: number
  balanceAfter: number
  action: string
  label: string
  entityId: string | null
  note: string | null
  userId: string
  userName?: string
  userPhone?: string
  createdAt: string
}

export default function CreditsTab() {
  const [subTab, setSubTab] = useState<SubTab>('users')

  return (
    <div className="p-4 space-y-4">
      <SectionHeader title="Crédits & Plans" subtitle="Gérer les crédits, règles et transactions" />

      {/* Sub-tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 sticky top-0 z-10">
        {[
          { id: 'users' as const, label: 'Utilisateurs', icon: Users },
          { id: 'rules' as const, label: 'Règles', icon: Settings },
          { id: 'transactions' as const, label: 'Transactions', icon: Receipt },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setSubTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors ${
              subTab === id ? 'bg-white text-[#FF7B54] shadow-sm' : 'text-gray-500'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {subTab === 'users' && <UsersCreditsSubTab />}
      {subTab === 'rules' && <RulesSubTab />}
      {subTab === 'transactions' && <TransactionsSubTab />}
    </div>
  )
}

// ============================================================================
// Sub-tab 1: Users — list users, grant/set credits, change plan
// ============================================================================

function UsersCreditsSubTab() {
  const [users, setUsers] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [creditAmount, setCreditAmount] = useState(10)
  const [actionMode, setActionMode] = useState<'add' | 'set' | 'plan'>('add')

  const refreshUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/admin/api/users?limit=100')
      const d = await res.json()
      setUsers(d.users || [])
    } catch {}
    setLoading(false)
  }

  const init = useRef(false)
  useEffect(() => {
    if (init.current) return
    init.current = true
    refreshUsers()
  }, [])

  const addCredits = async (userId: string, amount: number) => {
    const res = await fetch('/admin/api/credits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, amount, note: amount > 0 ? 'Bonus manuel admin' : 'Retrait manuel admin' }),
    })
    if (res.ok) {
      toast.success(`${amount > 0 ? '+' : ''}${amount} crédits`)
      setSelectedUser(null)
      refreshUsers()
    } else {
      const err = await res.json().catch(() => ({}))
      toast.error(err.error || 'Erreur')
    }
  }

  const setCredits = async (userId: string, credits: number) => {
    const res = await fetch('/admin/api/credits', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, credits }),
    })
    if (res.ok) {
      toast.success(`Solde fixé à ${credits} crédits`)
      setSelectedUser(null)
      refreshUsers()
    } else {
      toast.error('Erreur')
    }
  }

  const changePlan = async (userId: string, plan: string) => {
    const res = await fetch('/admin/api/credits', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, plan }),
    })
    if (res.ok) {
      toast.success(`Plan changé en ${plan}`)
      setSelectedUser(null)
      refreshUsers()
    }
  }

  const filtered = users.filter((u: any) =>
    (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
    u.phone.includes(search)
  )

  const totalCredits = users.reduce((s: number, u: any) => s + u.credits, 0)
  const avgCredits = users.length > 0 ? Math.round(totalCredits / users.length) : 0

  if (loading) return <LoadingSkeleton />

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Crédits totaux</p>
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
            <button
              onClick={() => { setSelectedUser(user); setActionMode('add') }}
              className="w-full mt-2 py-2 bg-gray-50 rounded-xl text-xs text-gray-500 font-medium flex items-center justify-center gap-1 active:bg-gray-100 transition-colors"
            >
              <Edit3 className="w-3 h-3" />Modifier crédits / plan
            </button>
          </div>
        ))}
        {filtered.length === 0 && <EmptyState message="Aucun utilisateur" />}
      </div>

      <BottomSheet open={!!selectedUser} onClose={() => setSelectedUser(null)} title="Modifier crédits & plan">
        {selectedUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <AvatarInitial name={selectedUser.name || 'U'} size="lg" />
              <div>
                <p className="font-bold">{selectedUser.name || 'Sans nom'}</p>
                <p className="text-sm text-gray-500">{selectedUser.credits} crédits · <span className="font-medium">{selectedUser.plan}</span></p>
              </div>
            </div>

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
                <p className="text-[11px] text-gray-400">Les ajouts/retraits sont tracés dans l'onglet Transactions avec horodatage.</p>
              </div>
            )}

            {actionMode === 'set' && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={creditAmount}
                    onChange={e => setCreditAmount(parseInt(e.target.value) || 0)}
                    className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7B54]/30"
                  />
                  <button onClick={() => setCredits(selectedUser.id, creditAmount)} className="px-5 py-2.5 bg-[#6C3FA9] text-white rounded-xl text-sm font-medium active:scale-95 transition-transform">Fixer</button>
                </div>
              </div>
            )}

            {actionMode === 'plan' && (
              <div className="grid grid-cols-3 gap-2">
                {['free', 'starter', 'pro'].map(p => (
                  <button
                    key={p}
                    onClick={() => changePlan(selectedUser.id, p)}
                    className={`py-3 rounded-xl text-sm font-medium capitalize active:scale-95 transition-transform ${selectedUser.plan === p ? 'bg-[#FF7B54] text-white' : 'bg-gray-100 text-gray-600'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </BottomSheet>
    </div>
  )
}

// ============================================================================
// Sub-tab 2: Rules — CRUD credit rules
// ============================================================================

function RulesSubTab() {
  const [rules, setRules] = useState<CreditRule[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<CreditRule | null>(null)
  const [creating, setCreating] = useState(false)

  const refresh = async () => {
    setLoading(true)
    try {
      const res = await fetch('/admin/api/credit-rules')
      const d = await res.json()
      setRules(d.rules || [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { refresh() }, [])

  const toggleEnabled = async (rule: CreditRule) => {
    const res = await fetch('/admin/api/credit-rules', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: rule.id, enabled: !rule.enabled }),
    })
    if (res.ok) {
      toast.success(`Règle ${!rule.enabled ? 'activée' : 'désactivée'}`)
      refresh()
    } else {
      toast.error('Erreur')
    }
  }

  const updateCost = async (rule: CreditRule, cost: number) => {
    if (cost < 0) return
    const res = await fetch('/admin/api/credit-rules', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: rule.id, cost }),
    })
    if (res.ok) {
      toast.success(`Coût mis à jour : ${cost}`)
      refresh()
    }
  }

  const updateQuota = async (rule: CreditRule, freeQuotaPerDay: number) => {
    if (freeQuotaPerDay < 0) return
    const res = await fetch('/admin/api/credit-rules', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: rule.id, freeQuotaPerDay }),
    })
    if (res.ok) {
      toast.success(`Quota gratuit mis à jour : ${freeQuotaPerDay}/jour`)
      refresh()
    }
  }

  const deleteRule = async (rule: CreditRule) => {
    if (!confirm(`Supprimer la règle "${rule.label}" ?`)) return
    const res = await fetch(`/admin/api/credit-rules?action=${encodeURIComponent(rule.action)}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Règle supprimée')
      refresh()
    }
  }

  if (loading) return <LoadingSkeleton />

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">{rules.length} règle(s) — chaque action à valeur ajoutée consomme des crédits selon ces règles.</p>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF7B54] text-white rounded-xl text-xs font-medium active:scale-95 transition-transform shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />Nouvelle règle
        </button>
      </div>

      {rules.map(rule => (
        <div key={rule.id} className={`bg-white rounded-2xl shadow-sm border p-4 ${rule.enabled ? 'border-gray-100' : 'border-gray-200 opacity-60'}`}>
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${rule.enabled ? 'bg-gradient-to-br from-[#FF7B54] to-[#6C3FA9]' : 'bg-gray-200'}`}>
              <Zap className={`w-5 h-5 ${rule.enabled ? 'text-white' : 'text-gray-400'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-sm">{rule.label}</p>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5 truncate">{rule.action}</p>
                </div>
                <button
                  onClick={() => toggleEnabled(rule)}
                  className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${rule.enabled ? 'bg-[#4CAF50]' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${rule.enabled ? 'left-[18px]' : 'left-0.5'}`} />
                </button>
              </div>
              {rule.description && <p className="text-xs text-gray-500 mt-1.5">{rule.description}</p>}

              <div className="grid grid-cols-2 gap-3 mt-3">
                <label className="block">
                  <span className="text-[10px] text-gray-400 uppercase font-semibold">Coût (crédits)</span>
                  <input
                    type="number"
                    min={0}
                    defaultValue={rule.cost}
                    onBlur={(e) => {
                      const v = parseInt(e.target.value) || 0
                      if (v !== rule.cost) updateCost(rule, v)
                    }}
                    className="w-full mt-1 px-2 py-1.5 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FF7B54]/30"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] text-gray-400 uppercase font-semibold">Quota gratuit /jour</span>
                  <input
                    type="number"
                    min={0}
                    defaultValue={rule.freeQuotaPerDay}
                    onBlur={(e) => {
                      const v = parseInt(e.target.value) || 0
                      if (v !== rule.freeQuotaPerDay) updateQuota(rule, v)
                    }}
                    className="w-full mt-1 px-2 py-1.5 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FF7B54]/30"
                  />
                </label>
              </div>

              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => setEditing(rule)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-gray-50 rounded-lg text-[11px] text-gray-500 font-medium active:scale-95"
                >
                  <Edit3 className="w-3 h-3" />Éditer
                </button>
                <button
                  onClick={() => deleteRule(rule)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-red-50 rounded-lg text-[11px] text-red-600 font-medium active:scale-95"
                >
                  <Trash2 className="w-3 h-3" />Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {rules.length === 0 && <EmptyState message="Aucune règle. Cliquez sur Nouvelle règle." />}

      <BottomSheet open={!!editing || creating} onClose={() => { setEditing(null); setCreating(false) }} title={editing ? 'Éditer la règle' : 'Nouvelle règle'}>
        <RuleForm
          rule={editing}
          onSaved={() => { setEditing(null); setCreating(false); refresh() }}
        />
      </BottomSheet>
    </div>
  )
}

function RuleForm({ rule, onSaved }: { rule: CreditRule | null; onSaved: () => void }) {
  const [action, setAction] = useState(rule?.action || '')
  const [label, setLabel] = useState(rule?.label || '')
  const [cost, setCost] = useState(rule?.cost ?? 1)
  const [description, setDescription] = useState(rule?.description || '')
  const [enabled, setEnabled] = useState(rule?.enabled ?? true)
  const [freeQuotaPerDay, setFreeQuotaPerDay] = useState(rule?.freeQuotaPerDay ?? 0)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!action.trim() || !label.trim()) {
      toast.error('Action et label requis')
      return
    }
    setSaving(true)
    try {
      const body = { action: action.trim(), label: label.trim(), cost, description, enabled, freeQuotaPerDay }
      const res = await fetch('/admin/api/credit-rules', {
        method: rule ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule ? { id: rule.id, ...body } : body),
      })
      if (res.ok) {
        toast.success(rule ? 'Règle mise à jour' : 'Règle créée')
        onSaved()
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'Erreur')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-[10px] text-gray-400 uppercase font-semibold">Clé d'action</label>
        <input
          type="text"
          value={action}
          onChange={(e) => setAction(e.target.value)}
          placeholder="ex: prospection.launch"
          disabled={!!rule}
          className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#FF7B54]/30 disabled:bg-gray-50"
        />
        <p className="text-[10px] text-gray-400 mt-1">Format : module.action. Ne peut pas être modifié après création.</p>
      </div>
      <div>
        <label className="text-[10px] text-gray-400 uppercase font-semibold">Label</label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="ex: Lancer une campagne"
          className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7B54]/30"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] text-gray-400 uppercase font-semibold">Coût (crédits)</label>
          <input
            type="number"
            min={0}
            value={cost}
            onChange={(e) => setCost(parseInt(e.target.value) || 0)}
            className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7B54]/30"
          />
        </div>
        <div>
          <label className="text-[10px] text-gray-400 uppercase font-semibold">Quota gratuit /jour</label>
          <input
            type="number"
            min={0}
            value={freeQuotaPerDay}
            onChange={(e) => setFreeQuotaPerDay(parseInt(e.target.value) || 0)}
            className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7B54]/30"
          />
        </div>
      </div>
      <div>
        <label className="text-[10px] text-gray-400 uppercase font-semibold">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description affichée dans l'admin"
          rows={2}
          className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7B54]/30"
        />
      </div>
      <label className="flex items-center gap-2 py-1">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="w-4 h-4 rounded accent-[#FF7B54]"
        />
        <span className="text-sm text-gray-600">Règle active (si désactivée, l'action est gratuite)</span>
      </label>
      <button
        onClick={save}
        disabled={saving}
        className="w-full py-3 bg-[#FF7B54] text-white rounded-xl text-sm font-medium active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {rule ? 'Enregistrer' : 'Créer la règle'}
      </button>
    </div>
  )
}

// ============================================================================
// Sub-tab 3: Transactions — full audit log of credit movements
// ============================================================================

function TransactionsSubTab() {
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  const refresh = async () => {
    setLoading(true)
    try {
      const res = await fetch('/admin/api/credit-transactions?limit=200')
      const d = await res.json()
      setTransactions(d.transactions || [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { refresh() }, [])

  const filtered = transactions.filter(t => {
    if (!filter) return true
    const q = filter.toLowerCase()
    return (
      t.action.toLowerCase().includes(q) ||
      t.label.toLowerCase().includes(q) ||
      (t.userName || '').toLowerCase().includes(q) ||
      (t.userPhone || '').includes(q) ||
      (t.note || '').toLowerCase().includes(q)
    )
  })

  const totalIn = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
  const totalOut = transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)

  if (loading) return <LoadingSkeleton />

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
            <Plus className="w-3 h-3 text-green-500" />Crédits distribués
          </p>
          <p className="text-2xl font-bold text-green-600">+{totalIn}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
            <Minus className="w-3 h-3 text-red-500" />Crédits consommés
          </p>
          <p className="text-2xl font-bold text-red-600">-{totalOut}</p>
        </div>
      </div>

      <SearchBar value={filter} onChange={setFilter} placeholder="Filtrer par action, user, note..." />

      <div className="space-y-2">
        {filtered.map(t => (
          <div key={t.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${t.amount >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              {t.amount >= 0 ? <Plus className="w-5 h-5 text-green-600" /> : <Minus className="w-5 h-5 text-red-600" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{t.label}</p>
              <p className="text-[10px] text-gray-400 truncate">
                {t.userName || t.userPhone || 'user'}
                {t.note ? ` · ${t.note}` : ''}
                {' · '}
                <span className="font-mono">{t.action}</span>
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className={`font-bold text-sm ${t.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {t.amount > 0 ? '+' : ''}{t.amount}
              </p>
              <p className="text-[10px] text-gray-400">solde: {t.balanceAfter}</p>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <EmptyState message="Aucune transaction" />}
      </div>
    </div>
  )
}
