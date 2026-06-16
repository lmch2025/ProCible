'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users, Contact, Megaphone, Coins,
  Bell, Settings, Cpu, MessageSquare, FileText, Shield,
  Menu, X, Grid3X3, Sparkles
} from 'lucide-react'
import dynamic from 'next/dynamic'

// Lazy load tab components for code splitting
const DashboardTab = dynamic(() => import('./components/DashboardTab'), { ssr: false })
const UsersTab = dynamic(() => import('./components/UsersTab'), { ssr: false })
const LeadsTab = dynamic(() => import('./components/LeadsTab'), { ssr: false })
const CampaignsTab = dynamic(() => import('./components/CampaignsTab'), { ssr: false })
const CreditsTab = dynamic(() => import('./components/CreditsTab'), { ssr: false })
const NotificationsTab = dynamic(() => import('./components/NotificationsTab'), { ssr: false })
const AISettingsTab = dynamic(() => import('./components/AISettingsTab'), { ssr: false })
const ContactsTab = dynamic(() => import('./components/ContactsTab'), { ssr: false })
const AuditLogTab = dynamic(() => import('./components/AuditLogTab'), { ssr: false })
const SystemTab = dynamic(() => import('./components/SystemTab'), { ssr: false })
const AIFollowUpPlansTab = dynamic(() => import('./components/AIFollowUpPlansTab'), { ssr: false })

type AdminTab = 'dashboard' | 'users' | 'leads' | 'campaigns' | 'credits' | 'notifications' | 'ai' | 'contacts' | 'audit' | 'system' | 'ai_plans'

interface TabDef {
  id: AdminTab
  label: string
  icon: typeof LayoutDashboard
  color: string
  section?: string
}

const tabs: TabDef[] = [
  { id: 'dashboard', label: 'Stats', icon: LayoutDashboard, color: 'from-[#FF7B54] to-[#FFB347]', section: 'principal' },
  { id: 'users', label: 'Utilisateurs', icon: Users, color: 'from-[#FF7B54] to-[#FFB347]', section: 'principal' },
  { id: 'leads', label: 'Clients', icon: Contact, color: 'from-[#6C3FA9] to-[#FF7B54]', section: 'principal' },
  { id: 'credits', label: 'Crédits', icon: Coins, color: 'from-[#FFB347] to-[#FF7B54]', section: 'principal' },
  { id: 'notifications', label: 'Alertes', icon: Bell, color: 'from-[#6C3FA9] to-[#2EC4B6]', section: 'principal' },
  { id: 'campaigns', label: 'Campagnes', icon: Megaphone, color: 'from-[#2EC4B6] to-[#4CAF50]', section: 'donnees' },
  { id: 'contacts', label: 'Contacts', icon: MessageSquare, color: 'from-[#2EC4B6] to-[#6C3FA9]', section: 'donnees' },
  { id: 'ai_plans', label: 'Plans IA', icon: Sparkles, color: 'from-[#6C3FA9] to-[#FFB347]', section: 'donnees' },
  { id: 'ai', label: 'IA Config', icon: Cpu, color: 'from-[#6C3FA9] to-[#FF7B54]', section: 'config' },
  { id: 'audit', label: 'Journal', icon: FileText, color: 'from-[#FFB347] to-[#2EC4B6]', section: 'config' },
  { id: 'system', label: 'Système', icon: Settings, color: 'from-[#2EC4B6] to-[#4CAF50]', section: 'config' },
]

// Bottom nav shows first 5 tabs
const bottomNavTabs = tabs.slice(0, 5)

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)

  const tabComponents: Record<AdminTab, React.ComponentType> = {
    dashboard: DashboardTab,
    users: UsersTab,
    leads: LeadsTab,
    campaigns: CampaignsTab,
    credits: CreditsTab,
    notifications: NotificationsTab,
    ai: AISettingsTab,
    ai_plans: AIFollowUpPlansTab,
    contacts: ContactsTab,
    audit: AuditLogTab,
    system: SystemTab,
  }

  const switchTab = (tab: AdminTab) => {
    setActiveTab(tab)
    setSidebarOpen(false)
    setMoreMenuOpen(false)
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Top header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm shrink-0">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 rounded-xl hover:bg-gray-100 active:scale-95 transition-transform">
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

        {/* Scrollable horizontal tab bar for medium+ screens */}
        <div className="hidden md:flex items-center gap-1 px-4 pb-2 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => switchTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-[#FF7B54]/10 to-[#6C3FA9]/10 text-[#FF7B54]'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex flex-col w-56 bg-white border-r border-gray-200 overflow-y-auto shrink-0">
          <nav className="flex-1 py-4 px-3 space-y-1">
            {['principal', 'donnees', 'config'].map(section => (
              <div key={section}>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-2">
                  {section === 'principal' ? 'Principal' : section === 'donnees' ? 'Données' : 'Configuration'}
                </p>
                {tabs.filter(t => t.section === section).map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => switchTab(tab.id)}
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
              </div>
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
                <nav className="py-4 px-3 space-y-1 overflow-y-auto max-h-[calc(100vh-80px)]">
                  {['principal', 'donnees', 'config'].map(section => (
                    <div key={section}>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-2">
                        {section === 'principal' ? 'Principal' : section === 'donnees' ? 'Données' : 'Configuration'}
                      </p>
                      {tabs.filter(t => t.section === section).map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => switchTab(tab.id)}
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
                    </div>
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
              {(() => {
                const TabComponent = tabComponents[activeTab]
                return TabComponent ? <TabComponent /> : null
              })()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile bottom navigation - 5 main tabs + More button */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-gray-200 pb-safe">
        <div className="flex items-center justify-around py-1.5">
          {bottomNavTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => switchTab(tab.id)}
              className={`flex flex-col items-center gap-0.5 py-1.5 px-2 min-w-[52px] rounded-xl transition-all ${
                activeTab === tab.id ? 'text-[#FF7B54]' : 'text-gray-400'
              }`}
            >
              <tab.icon className="w-5 h-5" strokeWidth={activeTab === tab.id ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          ))}
          {/* More button */}
          <button
            onClick={() => setMoreMenuOpen(true)}
            className={`flex flex-col items-center gap-0.5 py-1.5 px-2 min-w-[52px] rounded-xl transition-all ${
              !bottomNavTabs.find(t => t.id === activeTab) ? 'text-[#FF7B54]' : 'text-gray-400'
            }`}
          >
            <Grid3X3 className="w-5 h-5" strokeWidth={!bottomNavTabs.find(t => t.id === activeTab) ? 2.5 : 1.5} />
            <span className="text-[10px] font-medium">Plus</span>
          </button>
        </div>
      </nav>

      {/* More Menu - Bottom Sheet Grid */}
      <AnimatePresence>
        {moreMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-50" onClick={() => setMoreMenuOpen(false)} />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl pb-safe"
            >
              <div className="px-5 pt-4 pb-3 border-b border-gray-100">
                <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
                <h3 className="text-lg font-bold text-gray-900">Toutes les sections</h3>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-3 gap-3">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => switchTab(tab.id)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all active:scale-95 ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-br from-[#FF7B54]/10 to-[#6C3FA9]/10 ring-2 ring-[#FF7B54]/30'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tab.color} flex items-center justify-center`}>
                        <tab.icon className="w-5 h-5 text-white" />
                      </div>
                      <span className={`text-[11px] font-medium ${activeTab === tab.id ? 'text-[#FF7B54]' : 'text-gray-600'}`}>
                        {tab.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
