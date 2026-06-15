'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users, Contact, Megaphone, Coins,
  Bell, Settings, Search, ChevronRight, Shield, Menu, X,
  TrendingUp, UserPlus, Phone, MapPin, Calendar, Zap,
  ArrowUpRight, ArrowDownRight, Eye, Trash2, Edit3, Check,
  AlertTriangle, BarChart3, Clock, Send, Plus, Minus
} from 'lucide-react'
import { toast } from 'sonner'

type AdminTab = 'dashboard' | 'users' | 'leads' | 'campaigns' | 'credits' | 'notifications' | 'settings'

const tabs: { id: AdminTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Stats', icon: LayoutDashboard },
  { id: 'users', label: 'Utilisateurs', icon: Users },
  { id: 'leads', label: 'Clients', icon: Contact },
  { id: 'campaigns', label: 'Campagnes', icon: Megaphone },
  { id: 'credits', label: 'Crédits', icon: Coins },
  { id: 'notifications', label: 'Alertes', icon: Bell },
  { id: 'settings', label: 'Config', icon: Settings },
]

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 rounded-xl hover:bg-gray-100">
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#FF7B54]" />
                ProCible Admin
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
              Panel Administration
            </span>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF7B54] to-[#6C3FA9] flex items-center justify-center text-white text-xs font-bold">
              A
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex flex-col w-56 bg-white border-r border-gray-200 overflow-y-auto">
          <nav className="flex-1 py-4 px-3 space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-[#FF7B54]/10 to-[#6C3FA9]/10 text-[#FF7B54]'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-4.5 h-4.5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Mobile sidebar overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
              <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="fixed left-0 top-0 bottom-0 w-72 bg-white z-50 shadow-xl lg:hidden">
                <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-[#FF7B54]" />
                    Admin
                  </h2>
                  <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-xl hover:bg-gray-100">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <nav className="py-4 px-3 space-y-1">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => { setActiveTab(tab.id); setSidebarOpen(false) }}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-[#FF7B54]/10 to-[#6C3FA9]/10 text-[#FF7B54]'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <tab.icon className="w-5 h-5" />
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-6">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              {activeTab === 'dashboard' && <DashboardTab />}
              {activeTab === 'users' && <UsersTab />}
              {activeTab === 'leads' && <LeadsTab />}
              {activeTab === 'campaigns' && <CampaignsTab />}
              {activeTab === 'credits' && <CreditsTab />}
              {activeTab === 'notifications' && <NotificationsTab />}
              {activeTab === 'settings' && <SettingsTab />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-gray-200 pb-safe">
        <div className="flex items-center justify-around py-1.5">
          {tabs.slice(0, 5).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-0.5 py-1.5 px-2 min-w-[56px] rounded-xl transition-all ${
                activeTab === tab.id ? 'text-[#FF7B54]' : 'text-gray-400'
              }`}
            >
              <tab.icon className="w-5 h-5" strokeWidth={activeTab === tab.id ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          ))}
          {/* More button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex flex-col items-center gap-0.5 py-1.5 px-2 min-w-[56px] rounded-xl text-gray-400"
          >
            <Menu className="w-5 h-5" strokeWidth={1.5} />
            <span className="text-[10px] font-medium">Plus</span>
          </button>
        </div>
      </nav>
    </div>
  )
}

/* ==================== DASHBOARD TAB ==================== */
function DashboardTab() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const initialized = useRef(false)
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/admin/api/stats')
        const d = await res.json()
        if (!cancelled) { setStats(d); setLoading(false) }
      } catch { if (!cancelled) setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [])

  if (loading || !stats) return <LoadingSkeleton />

  const statCards = [
    { label: 'Utilisateurs', value: stats.users.total, sub: `+${stats.users.recentSignups} cette semaine`, icon: Users, color: 'from-[#FF7B54] to-[#FFB347]', trend: 'up' },
    { label: 'Clients', value: stats.leads.total, sub: `+${stats.leads.recentLeads} cette semaine`, icon: Contact, color: 'from-[#6C3FA9] to-[#FF7B54]', trend: 'up' },
    { label: 'Campagnes actives', value: stats.campaigns.active, sub: `${stats.campaigns.total} au total`, icon: Megaphone, color: 'from-[#2EC4B6] to-[#4CAF50]', trend: 'neutral' },
    { label: 'Score moyen', value: stats.leads.avgScore, sub: 'sur 100', icon: BarChart3, color: 'from-[#FFB347] to-[#FF7B54]', trend: stats.leads.avgScore >= 50 ? 'up' : 'down' },
  ]

  return (
    <div className="p-4 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Vue d&apos;ensemble</h2>
        <p className="text-sm text-gray-500">Tableau de bord ProCible</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3">
        {statCards.map(card => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                <card.icon className="w-4.5 h-4.5 text-white" />
              </div>
              {card.trend === 'up' ? <ArrowUpRight className="w-4 h-4 text-green-500" /> : card.trend === 'down' ? <ArrowDownRight className="w-4 h-4 text-red-500" /> : null}
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">{card.sub}</p>
          </motion.div>
        ))}
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
                <div className={`h-full ${p.color} rounded-full transition-all`} style={{ width: `${p.total > 0 ? (p.count / p.total * 100) : 0}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lead stages distribution */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Pipeline clients</h3>
        <div className="grid grid-cols-3 gap-2">
          {[
            { stage: 'nouveau', label: 'Nouveau', color: 'text-[#FF7B54] bg-[#FF7B54]/10' },
            { stage: 'contacte', label: 'Contacté', color: 'text-[#2EC4B6] bg-[#2EC4B6]/10' },
            { stage: 'en_discussion', label: 'En discussion', color: 'text-[#6C3FA9] bg-[#6C3FA9]/10' },
            { stage: 'a_relancer', label: 'À relancer', color: 'text-[#FFB347] bg-[#FFB347]/10' },
            { stage: 'gagne', label: 'Gagné', color: 'text-[#4CAF50] bg-[#4CAF50]/10' },
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
              <MapPin className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-sm font-semibold">{count as number}</p>
                <p className="text-[10px] text-gray-500 capitalize">{source}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Coins className="w-4 h-4 text-[#FFB347]" />
            <span className="text-xs text-gray-500">Crédits totaux</span>
          </div>
          <p className="text-xl font-bold">{stats.users.totalCredits}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="w-4 h-4 text-[#6C3FA9]" />
            <span className="text-xs text-gray-500">Non lues</span>
          </div>
          <p className="text-xl font-bold">{stats.notifications.unread}</p>
        </div>
      </div>
    </div>
  )
}

/* ==================== USERS TAB ==================== */
function UsersTab() {
  const [users, setUsers] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [editForm, setEditForm] = useState({ plan: '', credits: 0, name: '' })

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20', search, plan: planFilter })
    const res = await fetch(`/admin/api/users?${params}`)
    const data = await res.json()
    setUsers(data.users || [])
    setTotal(data.total || 0)
    setLoading(false)
  }, [page, search, planFilter])

  const usersInit = useRef(false)
  useEffect(() => {
    if (usersInit.current) return
    usersInit.current = true
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({ page: String(page), limit: '20', search, plan: planFilter })
        const res = await fetch(`/admin/api/users?${params}`)
        const data = await res.json()
        if (!cancelled) { setUsers(data.users || []); setTotal(data.total || 0); setLoading(false) }
      } catch { if (!cancelled) setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [page, search, planFilter])

  const startEdit = (user: any) => {
    setEditingUser(user.id)
    setEditForm({ plan: user.plan, credits: user.credits, name: user.name || '' })
  }

  const saveEdit = async () => {
    await fetch('/admin/api/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editingUser, ...editForm }),
    })
    toast.success('Utilisateur mis à jour')
    setEditingUser(null)
    fetchUsers()
  }

  const deleteUser = async (id: string) => {
    if (!confirm('Supprimer cet utilisateur ?')) return
    await fetch(`/admin/api/users?id=${id}`, { method: 'DELETE' })
    toast.success('Utilisateur supprimé')
    fetchUsers()
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Utilisateurs</h2>
        <p className="text-sm text-gray-500">{total} inscrits</p>
      </div>

      {/* Search + filter */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Rechercher..."
            className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7B54]/30 focus:border-[#FF7B54]"
          />
        </div>
        <select
          value={planFilter}
          onChange={e => { setPlanFilter(e.target.value); setPage(1) }}
          className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7B54]/30"
        >
          <option value="">Tous plans</option>
          <option value="free">Gratuit</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
        </select>
      </div>

      {/* Users list */}
      {loading ? <LoadingSkeleton /> : (
        <div className="space-y-2">
          {users.map((user: any) => (
            <div key={user.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              {editingUser === user.id ? (
                <div className="space-y-3">
                  <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border rounded-xl text-sm" placeholder="Nom" />
                  <div className="flex gap-2">
                    <select value={editForm.plan} onChange={e => setEditForm(f => ({ ...f, plan: e.target.value }))} className="flex-1 px-3 py-2 border rounded-xl text-sm">
                      <option value="free">Gratuit</option>
                      <option value="starter">Starter</option>
                      <option value="pro">Pro</option>
                    </select>
                    <input type="number" value={editForm.credits} onChange={e => setEditForm(f => ({ ...f, credits: parseInt(e.target.value) || 0 }))} className="w-20 px-3 py-2 border rounded-xl text-sm" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={saveEdit} className="flex-1 py-2 bg-[#4CAF50] text-white rounded-xl text-sm font-medium flex items-center justify-center gap-1"><Check className="w-4 h-4" />Sauver</button>
                    <button onClick={() => setEditingUser(null)} className="flex-1 py-2 bg-gray-100 rounded-xl text-sm font-medium">Annuler</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF7B54] to-[#6C3FA9] flex items-center justify-center text-white font-bold text-sm">
                    {(user.name || user.phone || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{user.name || 'Sans nom'}</p>
                    <p className="text-xs text-gray-500 truncate">{user.phone}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      user.plan === 'pro' ? 'bg-[#6C3FA9]/10 text-[#6C3FA9]' :
                      user.plan === 'starter' ? 'bg-[#FF7B54]/10 text-[#FF7B54]' :
                      'bg-gray-100 text-gray-500'
                    }`}>{user.plan}</span>
                    <span className="text-[10px] text-gray-400">{user.credits}cr</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => startEdit(user)} className="p-1.5 rounded-lg hover:bg-gray-100"><Edit3 className="w-3.5 h-3.5 text-gray-400" /></button>
                    <button onClick={() => deleteUser(user.id)} className="p-1.5 rounded-lg hover:bg-red-50"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-4 mt-2 pt-2 border-t border-gray-50 text-[10px] text-gray-400">
                <span className="flex items-center gap-1"><Contact className="w-3 h-3" />{user._count?.leads || 0} clients</span>
                <span className="flex items-center gap-1"><Megaphone className="w-3 h-3" />{user._count?.campaigns || 0} camp.</span>
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(user.createdAt).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} setPage={setPage} />}
    </div>
  )
}

/* ==================== LEADS TAB ==================== */
function LeadsTab() {
  const [leads, setLeads] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20', search, stage: stageFilter })
    const res = await fetch(`/admin/api/leads?${params}`)
    const data = await res.json()
    setLeads(data.leads || [])
    setTotal(data.total || 0)
    setLoading(false)
  }, [page, search, stageFilter])

  const leadsInit = useRef(false)
  useEffect(() => {
    if (leadsInit.current) return
    leadsInit.current = true
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({ page: String(page), limit: '20', search, stage: stageFilter })
        const res = await fetch(`/admin/api/leads?${params}`)
        const data = await res.json()
        if (!cancelled) { setLeads(data.leads || []); setTotal(data.total || 0); setLoading(false) }
      } catch { if (!cancelled) setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [page, search, stageFilter])

  const updateStage = async (id: string, stage: string) => {
    await fetch('/admin/api/leads', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, stage }),
    })
    toast.success('Statut mis à jour')
    fetchLeads()
  }

  const deleteLead = async (id: string) => {
    if (!confirm('Supprimer ce client ?')) return
    await fetch(`/admin/api/leads?id=${id}`, { method: 'DELETE' })
    toast.success('Client supprimé')
    fetchLeads()
  }

  const stageColors: Record<string, string> = {
    nouveau: 'bg-[#FF7B54]/10 text-[#FF7B54]',
    contacte: 'bg-[#2EC4B6]/10 text-[#2EC4B6]',
    en_discussion: 'bg-[#6C3FA9]/10 text-[#6C3FA9]',
    a_relancer: 'bg-[#FFB347]/10 text-[#FFB347]',
    gagne: 'bg-[#4CAF50]/10 text-[#4CAF50]',
    perdu: 'bg-[#EF4444]/10 text-[#EF4444]',
  }

  const stageLabels: Record<string, string> = {
    nouveau: 'Nouveau', contacte: 'Contacté', en_discussion: 'Discussion',
    a_relancer: 'Relancer', gagne: 'Gagné', perdu: 'Perdu',
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Clients</h2>
        <p className="text-sm text-gray-500">{total} au total</p>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Rechercher..." className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7B54]/30" />
        </div>
        <select value={stageFilter} onChange={e => { setStageFilter(e.target.value); setPage(1) }} className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none">
          <option value="">Tous</option>
          {Object.entries(stageLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {loading ? <LoadingSkeleton /> : (
        <div className="space-y-2">
          {leads.map((lead: any) => (
            <div key={lead.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF7B54] to-[#6C3FA9] flex items-center justify-center text-white font-bold text-sm">
                  {lead.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">{lead.name}</p>
                  <p className="text-xs text-gray-500 truncate">{lead.business || lead.sector || ''} {lead.city ? `· ${lead.city}` : ''}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold">{lead.score}</p>
                  <p className="text-[10px] text-gray-400">score</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                <select
                  value={lead.stage}
                  onChange={e => updateStage(lead.id, e.target.value)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-semibold ${stageColors[lead.stage] || 'bg-gray-100 text-gray-600'}`}
                >
                  {Object.entries(stageLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                  <span>{lead._count?.contacts || 0} contacts</span>
                  <span>· {lead.source}</span>
                  {lead.user && <span>· {lead.user.name || lead.user.phone}</span>}
                  <button onClick={() => deleteLead(lead.id)} className="p-1 rounded hover:bg-red-50"><Trash2 className="w-3 h-3 text-red-400" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {Math.ceil(total / 20) > 1 && <Pagination page={page} totalPages={Math.ceil(total / 20)} setPage={setPage} />}
    </div>
  )
}

/* ==================== CAMPAIGNS TAB ==================== */
function CampaignsTab() {
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchCampaigns = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20', status: statusFilter })
    const res = await fetch(`/admin/api/campaigns?${params}`)
    const data = await res.json()
    setCampaigns(data.campaigns || [])
    setTotal(data.total || 0)
    setLoading(false)
  }, [page, statusFilter])

  const campsInit = useRef(false)
  useEffect(() => {
    if (campsInit.current) return
    campsInit.current = true
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({ page: String(page), limit: '20', status: statusFilter })
        const res = await fetch(`/admin/api/campaigns?${params}`)
        const data = await res.json()
        if (!cancelled) { setCampaigns(data.campaigns || []); setTotal(data.total || 0); setLoading(false) }
      } catch { if (!cancelled) setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [page, statusFilter])

  const updateStatus = async (id: string, status: string) => {
    await fetch('/admin/api/campaigns', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    toast.success('Statut campagne modifié')
    fetchCampaigns()
  }

  const deleteCampaign = async (id: string) => {
    if (!confirm('Supprimer cette campagne ?')) return
    await fetch(`/admin/api/campaigns?id=${id}`, { method: 'DELETE' })
    toast.success('Campagne supprimée')
    fetchCampaigns()
  }

  const statusColors: Record<string, string> = {
    active: 'bg-[#4CAF50]/10 text-[#4CAF50]',
    completed: 'bg-[#6C3FA9]/10 text-[#6C3FA9]',
    paused: 'bg-[#FFB347]/10 text-[#FFB347]',
  }

  const statusLabels: Record<string, string> = { active: 'Active', completed: 'Terminée', paused: 'En pause' }

  return (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Campagnes</h2>
        <p className="text-sm text-gray-500">{total} campagnes</p>
      </div>

      <div className="flex gap-2">
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }} className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none">
          <option value="">Tous statuts</option>
          {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {loading ? <LoadingSkeleton /> : (
        <div className="space-y-2">
          {campaigns.map((camp: any) => (
            <div key={camp.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF7B54] to-[#6C3FA9] flex items-center justify-center">
                  <Megaphone className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">{camp.productName}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{camp.city} · {camp.leadsFound} clients</p>
                </div>
                <select
                  value={camp.status}
                  onChange={e => updateStatus(camp.id, e.target.value)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-semibold ${statusColors[camp.status] || 'bg-gray-100'}`}
                >
                  {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50 text-[10px] text-gray-400">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(camp.createdAt).toLocaleDateString('fr-FR')}</span>
                {camp.user && <span>{camp.user.name || camp.user.phone}</span>}
                <button onClick={() => deleteCampaign(camp.id)} className="p-1 rounded hover:bg-red-50"><Trash2 className="w-3 h-3 text-red-400" /></button>
              </div>
            </div>
          ))}
          {campaigns.length === 0 && <EmptyState message="Aucune campagne" />}
        </div>
      )}

      {Math.ceil(total / 20) > 1 && <Pagination page={page} totalPages={Math.ceil(total / 20)} setPage={setPage} />}
    </div>
  )
}

/* ==================== CREDITS TAB ==================== */
function CreditsTab() {
  const [users, setUsers] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [creditAmount, setCreditAmount] = useState(10)
  const [planChange, setPlanChange] = useState('')

  const creditsInit = useRef(false)
  useEffect(() => {
    if (creditsInit.current) return
    creditsInit.current = true
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/admin/api/users?limit=100')
        const d = await res.json()
        if (!cancelled) { setUsers(d.users || []); setLoading(false) }
      } catch { if (!cancelled) setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [])

  const addCredits = async (userId: string, amount: number) => {
    await fetch('/admin/api/credits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, amount }),
    })
    toast.success(`${amount > 0 ? '+' : ''}${amount} crédits`)
    setSelectedUser(null)
  }

  const setCredits = async (userId: string, credits: number) => {
    await fetch('/admin/api/credits', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, credits }),
    })
    toast.success(`Crédits fixés à ${credits}`)
    setSelectedUser(null)
  }

  const changePlan = async (userId: string, plan: string) => {
    await fetch('/admin/api/credits', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, plan }),
    })
    toast.success(`Plan changé en ${plan}`)
    setPlanChange('')
    setSelectedUser(null)
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
      <div>
        <h2 className="text-xl font-bold text-gray-900">Crédits & Plans</h2>
        <p className="text-sm text-gray-500">Gérer les crédits et abonnements</p>
      </div>

      {/* Summary */}
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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un utilisateur..." className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7B54]/30" />
      </div>

      {/* Users list with credit actions */}
      <div className="space-y-2">
        {filtered.map((user: any) => (
          <div key={user.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF7B54] to-[#6C3FA9] flex items-center justify-center text-white font-bold text-sm">
                {(user.name || 'U').charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{user.name || 'Sans nom'}</p>
                <p className="text-xs text-gray-500">{user.phone}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-bold text-[#FF7B54]">{user.credits}</p>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  user.plan === 'pro' ? 'bg-[#6C3FA9]/10 text-[#6C3FA9]' :
                  user.plan === 'starter' ? 'bg-[#FF7B54]/10 text-[#FF7B54]' :
                  'bg-gray-100 text-gray-500'
                }`}>{user.plan}</span>
              </div>
            </div>

            {selectedUser === user.id ? (
              <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                <div className="flex gap-2">
                  <button onClick={() => addCredits(user.id, -5)} className="flex-1 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-medium flex items-center justify-center gap-1"><Minus className="w-4 h-4" />5</button>
                  <button onClick={() => addCredits(user.id, 5)} className="flex-1 py-2 bg-green-50 text-green-600 rounded-xl text-sm font-medium flex items-center justify-center gap-1"><Plus className="w-4 h-4" />5</button>
                  <button onClick={() => addCredits(user.id, 20)} className="flex-1 py-2 bg-green-50 text-green-600 rounded-xl text-sm font-medium flex items-center justify-center gap-1"><Plus className="w-4 h-4" />20</button>
                  <button onClick={() => addCredits(user.id, 50)} className="flex-1 py-2 bg-green-50 text-green-600 rounded-xl text-sm font-medium flex items-center justify-center gap-1"><Plus className="w-4 h-4" />50</button>
                </div>
                <div className="flex gap-2">
                  <input type="number" value={creditAmount} onChange={e => setCreditAmount(parseInt(e.target.value) || 0)} className="flex-1 px-3 py-2 border rounded-xl text-sm" />
                  <button onClick={() => setCredits(user.id, creditAmount)} className="px-4 py-2 bg-[#6C3FA9] text-white rounded-xl text-sm font-medium">Fixer</button>
                </div>
                <div className="flex gap-2">
                  {['free', 'starter', 'pro'].map(p => (
                    <button key={p} onClick={() => changePlan(user.id, p)} className={`flex-1 py-2 rounded-xl text-sm font-medium capitalize ${user.plan === p ? 'bg-[#FF7B54] text-white' : 'bg-gray-100 text-gray-600'}`}>{p}</button>
                  ))}
                </div>
                <button onClick={() => setSelectedUser(null)} className="w-full py-2 bg-gray-100 rounded-xl text-sm font-medium text-gray-600">Fermer</button>
              </div>
            ) : (
              <button onClick={() => setSelectedUser(user.id)} className="w-full mt-2 py-1.5 bg-gray-50 rounded-xl text-xs text-gray-500 font-medium flex items-center justify-center gap-1">
                <Edit3 className="w-3 h-3" />Modifier crédits / plan
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ==================== NOTIFICATIONS TAB ==================== */
function NotificationsTab() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ userId: '', type: 'system', title: '', message: '' })
  const [users, setUsers] = useState<any[]>([])

  const fetchNotifs = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    const res = await fetch(`/admin/api/notifications?${params}`)
    const data = await res.json()
    setNotifications(data.notifications || [])
    setTotal(data.total || 0)
    setLoading(false)
  }, [page])

  const notifsInit = useRef(false)
  useEffect(() => {
    if (notifsInit.current) return
    notifsInit.current = true
    let cancelled = false
    ;(async () => {
      try {
        const params = new URLSearchParams({ page: String(page), limit: '20' })
        const [notifsRes, usersRes] = await Promise.all([
          fetch(`/admin/api/notifications?${params}`),
          fetch('/admin/api/users?limit=100'),
        ])
        const notifsData = await notifsRes.json()
        const usersData = await usersRes.json()
        if (!cancelled) {
          setNotifications(notifsData.notifications || [])
          setTotal(notifsData.total || 0)
          setLoading(false)
          setUsers(usersData.users || [])
        }
      } catch { if (!cancelled) setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [])

  const markAllRead = async () => {
    await fetch('/admin/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAllRead: true }),
    })
    toast.success('Toutes marquées comme lues')
    fetchNotifs()
  }

  const createNotif = async () => {
    if (!createForm.userId || !createForm.title || !createForm.message) return
    await fetch('/admin/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createForm),
    })
    toast.success('Notification envoyée')
    setShowCreate(false)
    setCreateForm({ userId: '', type: 'system', title: '', message: '' })
    fetchNotifs()
  }

  const deleteNotif = async (id: string) => {
    await fetch(`/admin/api/notifications?id=${id}`, { method: 'DELETE' })
    toast.success('Supprimée')
    fetchNotifs()
  }

  const typeLabels: Record<string, string> = {
    new_leads: 'Nouveaux clients', system: 'Système', subscription: 'Abonnement',
    follow_up: 'Suivi', relance: 'Relance', ai_suggestion: 'Conseil IA',
  }

  const typeColors: Record<string, string> = {
    new_leads: 'bg-[#FF7B54]/10 text-[#FF7B54]',
    system: 'bg-[#6C3FA9]/10 text-[#6C3FA9]',
    subscription: 'bg-[#2EC4B6]/10 text-[#2EC4B6]',
    follow_up: 'bg-[#FFB347]/10 text-[#FFB347]',
    relance: 'bg-[#E4405F]/10 text-[#E4405F]',
    ai_suggestion: 'bg-[#6C3FA9]/10 text-[#6C3FA9]',
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
          <p className="text-sm text-gray-500">{total} notifications</p>
        </div>
        <div className="flex gap-2">
          <button onClick={markAllRead} className="px-3 py-1.5 bg-gray-100 rounded-xl text-xs font-medium text-gray-600 flex items-center gap-1"><Check className="w-3 h-3" />Tout lire</button>
          <button onClick={() => setShowCreate(!showCreate)} className="px-3 py-1.5 bg-[#FF7B54] text-white rounded-xl text-xs font-medium flex items-center gap-1"><Plus className="w-3 h-3" />Envoyer</button>
        </div>
      </div>

      {/* Create notification form */}
      {showCreate && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
          <h3 className="text-sm font-semibold">Nouvelle notification</h3>
          <select value={createForm.userId} onChange={e => setCreateForm(f => ({ ...f, userId: e.target.value }))} className="w-full px-3 py-2 border rounded-xl text-sm">
            <option value="">Choisir un utilisateur</option>
            {users.map((u: any) => <option key={u.id} value={u.id}>{u.name || u.phone}</option>)}
          </select>
          <select value={createForm.type} onChange={e => setCreateForm(f => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2 border rounded-xl text-sm">
            {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input value={createForm.title} onChange={e => setCreateForm(f => ({ ...f, title: e.target.value }))} placeholder="Titre" className="w-full px-3 py-2 border rounded-xl text-sm" />
          <textarea value={createForm.message} onChange={e => setCreateForm(f => ({ ...f, message: e.target.value }))} placeholder="Message" rows={2} className="w-full px-3 py-2 border rounded-xl text-sm resize-none" />
          <button onClick={createNotif} className="w-full py-2.5 bg-[#FF7B54] text-white rounded-xl text-sm font-medium flex items-center justify-center gap-1"><Send className="w-4 h-4" />Envoyer</button>
        </div>
      )}

      {loading ? <LoadingSkeleton /> : (
        <div className="space-y-2">
          {notifications.map((notif: any) => (
            <div key={notif.id} className={`bg-white rounded-2xl p-4 shadow-sm border ${notif.read ? 'border-gray-100' : 'border-[#FF7B54]/20 bg-[#FF7B54]/5'}`}>
              <div className="flex items-start gap-3">
                <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold ${typeColors[notif.type] || 'bg-gray-100'}`}>
                  {typeLabels[notif.type] || notif.type}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{notif.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                </div>
                <button onClick={() => deleteNotif(notif.id)} className="shrink-0 p-1 rounded hover:bg-red-50"><Trash2 className="w-3 h-3 text-red-400" /></button>
              </div>
              <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-400">
                {notif.user && <span>{notif.user.name || notif.user.phone}</span>}
                <span>· {new Date(notif.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                {!notif.read && <span className="w-2 h-2 bg-[#FF7B54] rounded-full" />}
              </div>
            </div>
          ))}
          {notifications.length === 0 && <EmptyState message="Aucune notification" />}
        </div>
      )}

      {Math.ceil(total / 20) > 1 && <Pagination page={page} totalPages={Math.ceil(total / 20)} setPage={setPage} />}
    </div>
  )
}

/* ==================== SETTINGS TAB ==================== */
function SettingsTab() {
  const [settings, setSettings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const settingsInit = useRef(false)
  useEffect(() => {
    if (settingsInit.current) return
    settingsInit.current = true
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/admin/api/settings')
        const d = await res.json()
        if (!cancelled) { setSettings(d.settings || []); setLoading(false) }
      } catch { if (!cancelled) setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [])

  const saveSetting = async (key: string, value: string, description?: string) => {
    await fetch('/admin/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value, description }),
    })
    toast.success('Paramètre sauvegardé')
    setEditingKey(null)
    const res = await fetch('/admin/api/settings')
    const data = await res.json()
    setSettings(data.settings || [])
  }

  const addSetting = async () => {
    if (!newKey || !newValue) return
    await saveSetting(newKey, newValue, newDesc || undefined)
    setNewKey('')
    setNewValue('')
    setNewDesc('')
  }

  // Default settings suggestions
  const defaultSettings = [
    { key: 'free_plan_credits', value: '5', description: 'Crédits plan gratuit' },
    { key: 'starter_plan_credits', value: '20', description: 'Crédits plan Starter' },
    { key: 'pro_plan_credits', value: '50', description: 'Crédits plan Pro' },
    { key: 'ai_model_default', value: 'gpt-4o-mini', description: 'Modèle IA par défaut' },
    { key: 'ai_fallback_model', value: 'claude-3-haiku', description: 'Modèle IA de secours' },
    { key: 'max_prospection_leads', value: '20', description: 'Max clients par prospection' },
    { key: 'notification_enabled', value: 'true', description: 'Notifications actives' },
    { key: 'maintenance_mode', value: 'false', description: 'Mode maintenance' },
  ]

  if (loading) return <LoadingSkeleton />

  return (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Configuration</h2>
        <p className="text-sm text-gray-500">Paramètres de l&apos;application</p>
      </div>

      {/* Add new setting */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2"><Plus className="w-4 h-4 text-[#FF7B54]" />Ajouter un paramètre</h3>
        <input value={newKey} onChange={e => setNewKey(e.target.value)} placeholder="Clé (ex: free_plan_credits)" className="w-full px-3 py-2 border rounded-xl text-sm" />
        <input value={newValue} onChange={e => setNewValue(e.target.value)} placeholder="Valeur" className="w-full px-3 py-2 border rounded-xl text-sm" />
        <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Description (optionnel)" className="w-full px-3 py-2 border rounded-xl text-sm" />
        <button onClick={addSetting} className="w-full py-2.5 bg-[#FF7B54] text-white rounded-xl text-sm font-medium">Ajouter</button>
      </div>

      {/* Quick add defaults */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold mb-3">Paramètres recommandés</h3>
        <div className="flex flex-wrap gap-2">
          {defaultSettings.filter(ds => !settings.find((s: any) => s.key === ds.key)).map(ds => (
            <button
              key={ds.key}
              onClick={() => saveSetting(ds.key, ds.value, ds.description)}
              className="px-3 py-1.5 bg-gray-50 rounded-xl text-xs text-gray-600 hover:bg-[#FF7B54]/10 hover:text-[#FF7B54] transition-colors"
            >
              + {ds.key}
            </button>
          ))}
        </div>
      </div>

      {/* Current settings */}
      <div className="space-y-2">
        {settings.map((setting: any) => (
          <div key={setting.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            {editingKey === setting.key ? (
              <div className="space-y-2">
                <p className="text-xs font-mono text-gray-500">{setting.key}</p>
                <input value={editValue} onChange={e => setEditValue(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm" autoFocus />
                <div className="flex gap-2">
                  <button onClick={() => saveSetting(setting.key, editValue, setting.description || undefined)} className="flex-1 py-2 bg-[#4CAF50] text-white rounded-xl text-sm font-medium">Sauver</button>
                  <button onClick={() => setEditingKey(null)} className="flex-1 py-2 bg-gray-100 rounded-xl text-sm">Annuler</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono font-semibold text-gray-900">{setting.key}</p>
                  <p className="text-xs text-gray-500 truncate">{setting.description || 'Sans description'}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2 py-1 bg-gray-50 rounded-lg text-xs font-mono">{setting.value}</span>
                  <button onClick={() => { setEditingKey(setting.key); setEditValue(setting.value) }} className="p-1.5 rounded-lg hover:bg-gray-100"><Edit3 className="w-3.5 h-3.5 text-gray-400" /></button>
                </div>
              </div>
            )}
          </div>
        ))}
        {settings.length === 0 && <EmptyState message="Aucun paramètre configuré" />}
      </div>
    </div>
  )
}

/* ==================== SHARED COMPONENTS ==================== */
function LoadingSkeleton() {
  return (
    <div className="p-4 space-y-3">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
        <AlertTriangle className="w-7 h-7 text-gray-300" />
      </div>
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  )
}

function Pagination({ page, totalPages, setPage }: { page: number; totalPages: number; setPage: (p: number) => void }) {
  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="px-3 py-1.5 bg-white border rounded-xl text-sm disabled:opacity-40">Préc.</button>
      <span className="text-xs text-gray-500">{page} / {totalPages}</span>
      <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages} className="px-3 py-1.5 bg-white border rounded-xl text-sm disabled:opacity-40">Suiv.</button>
    </div>
  )
}
