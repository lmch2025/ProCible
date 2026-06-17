'use client'

import { useEffect, useState, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useProcibleStore, type Lead, type AppNotification } from '@/store/procible-store'
import Onboarding from '@/components/procible/Onboarding'
import HomeScreen from '@/components/procible/HomeScreen'
import LeadsScreen from '@/components/procible/LeadsScreen'
import LeadDetail from '@/components/procible/LeadDetail'
import NotificationsScreen from '@/components/procible/NotificationsScreen'
import ProfileScreen from '@/components/procible/ProfileScreen'
import PreferencesScreen from '@/components/procible/PreferencesScreen'
import CreditsScreen from '@/components/procible/CreditsScreen'
import BottomNav from '@/components/procible/BottomNav'
import ProspectionForm from '@/components/procible/ProspectionForm'
import { SkeletonCard } from '@/components/procible/SkeletonLoaders'
import { useI18n } from '@/lib/i18n'

const screenComponents: Record<string, React.ComponentType> = {
  onboarding: Onboarding,
  home: HomeScreen,
  leads: LeadsScreen,
  'lead-detail': LeadDetail,
  notifications: NotificationsScreen,
  profile: ProfileScreen,
  preferences: PreferencesScreen,
  credits: CreditsScreen,
}

export default function Home() {
  const { currentScreen, isOnboarded, setLeads, setNotifications, setNewLeadsCount } = useProcibleStore()
  const { locale } = useI18n()
  const [loading, setLocalLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Reset scroll position when screen changes
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'instant' })
  }, [currentScreen])

  // Reload data when locale changes so server-stored notification titles/messages
  // get re-fetched in the new language.
  useEffect(() => {
    async function seedAndLoad() {
      try {
        const headers = { 'x-locale': locale }
        const seedRes = await fetch('/api/seed', { method: 'POST', headers })
        if (seedRes.ok) {
          const leadsRes = await fetch('/api/leads', { headers })
          if (leadsRes.ok) {
            const leadsData: Lead[] = await leadsRes.json()
            setLeads(leadsData)
            const newCount = leadsData.filter((l) => l.stage === 'nouveau').length
            setNewLeadsCount(newCount)
          }

          const notifRes = await fetch('/api/notifications', { headers })
          if (notifRes.ok) {
            const notifData: AppNotification[] = await notifRes.json()
            setNotifications(notifData)
          }
        }
      } catch {
        // Fallback demo data
        setLeads([
          { id: '1', name: 'Marie Ndongo', business: 'Restaurant Le Palmier', sector: 'Restauration', city: 'Douala', phone: '+237699112233', whatsapp: '+237699112233', email: null, address: 'Bonapriso, Douala', source: 'maps', stage: 'nouveau', notes: null, lastContactAt: null, nextFollowUpAt: null, contactCount: 0, aiSuggestion: null, score: 55, createdAt: new Date().toISOString() },
          { id: '2', name: 'Jean-Pierre Fotso', business: 'Fotso Electronics', sector: 'Commerce', city: 'Yaoundé', phone: '+237677445566', whatsapp: '+237677445566', source: 'facebook', stage: 'contacte', notes: null, email: null, address: 'Bastos, Yaoundé', createdAt: new Date().toISOString(), lastContactAt: new Date().toISOString(), nextFollowUpAt: null, contactCount: 1, aiSuggestion: null, score: 60 },
          { id: '3', name: 'Fatou Amadou', business: 'Salon Beauté Fatou', sector: 'Beauté', city: 'Douala', phone: '+237655778899', whatsapp: '+237655778899', source: 'instagram', stage: 'en_discussion', notes: null, email: null, address: 'Akwa, Douala', createdAt: new Date().toISOString(), lastContactAt: new Date().toISOString(), nextFollowUpAt: null, contactCount: 2, aiSuggestion: 'Proposez un rendez-vous pour conclure.', score: 75 },
          { id: '4', name: 'Paul Essomba', business: 'Cyber Cafe Digital', sector: 'Services', city: 'Bafoussam', phone: '+237644332211', whatsapp: '+237644332211', source: 'linkedin', stage: 'a_relancer', notes: null, email: null, address: 'Centre Ville, Bafoussam', createdAt: new Date().toISOString(), lastContactAt: new Date().toISOString(), nextFollowUpAt: null, contactCount: 1, aiSuggestion: 'Relance urgente requise.', score: 40 },
          { id: '5', name: 'Sylvie Ngassa', business: 'Ngassa Catering', sector: 'Restauration', city: 'Douala', phone: '+237611009988', whatsapp: '+237611009988', source: 'facebook', stage: 'gagne', notes: null, email: null, address: 'Bonamoussadi, Douala', createdAt: new Date().toISOString(), lastContactAt: new Date().toISOString(), nextFollowUpAt: null, contactCount: 4, aiSuggestion: null, score: 95 },
        ])
        setNewLeadsCount(1)
        setNotifications([
          { id: 'n1', type: 'new_leads', title: 'Nouveaux clients', message: 'ProCible a trouvé de nouveaux clients.', read: false, createdAt: new Date().toISOString(), leadId: null },
          { id: 'n2', type: 'follow_up', title: 'Suivi requis', message: 'Un client attend votre relance.', read: false, createdAt: new Date().toISOString(), leadId: '4' },
        ])
      }
      setLocalLoading(false)
    }
    seedAndLoad()
  }, [setLeads, setNotifications, setNewLeadsCount, locale])

  if (loading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center px-5">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-sm">
          <SkeletonCard />
        </motion.div>
      </div>
    )
  }

  const ScreenComponent = screenComponents[currentScreen] || HomeScreen
  const showNav = currentScreen !== 'onboarding' && isOnboarded

  return (
    <div className="h-screen flex flex-col bg-background max-w-lg mx-auto relative">
      {/* Scrollable container - sticky headers stick to top of this container */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScreen}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <ScreenComponent />
          </motion.div>
        </AnimatePresence>
      </div>

      {showNav && <BottomNav />}
      {showNav && <ProspectionForm />}
    </div>
  )
}
