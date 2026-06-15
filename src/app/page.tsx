'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useHermesStore, type Screen, type Lead, type AppNotification } from '@/store/hermes-store'
import Onboarding from '@/components/hermes/Onboarding'
import HomeScreen from '@/components/hermes/HomeScreen'
import LeadsScreen from '@/components/hermes/LeadsScreen'
import LeadDetail from '@/components/hermes/LeadDetail'
import NotificationsScreen from '@/components/hermes/NotificationsScreen'
import ProfileScreen from '@/components/hermes/ProfileScreen'
import PreferencesScreen from '@/components/hermes/PreferencesScreen'
import BottomNav from '@/components/hermes/BottomNav'
import { SkeletonCard } from '@/components/hermes/SkeletonLoaders'

const screenComponents: Record<Screen, React.ComponentType> = {
  onboarding: Onboarding,
  home: HomeScreen,
  leads: LeadsScreen,
  'lead-detail': LeadDetail,
  notifications: NotificationsScreen,
  profile: ProfileScreen,
  preferences: PreferencesScreen,
}

export default function Home() {
  const { currentScreen, isOnboarded, setLeads, setNotifications, setNewLeadsCount } = useHermesStore()
  const [loading, setLocalLoading] = useState(true)

  // Service worker registration disabled for testing
  // useEffect(() => {
  //   if ('serviceWorker' in navigator) {
  //     navigator.serviceWorker.register('/sw.js').catch(() => {})
  //   }
  // }, [])

  useEffect(() => {
    async function seedAndLoad() {
      try {
        const seedRes = await fetch('/api/seed', { method: 'POST' })
        if (seedRes.ok) {
          const leadsRes = await fetch('/api/leads')
          if (leadsRes.ok) {
            const leadsData: Lead[] = await leadsRes.json()
            setLeads(leadsData)
            const newCount = leadsData.filter((l) => l.stage === 'nouveau').length
            setNewLeadsCount(newCount)
          }

          const notifRes = await fetch('/api/notifications')
          if (notifRes.ok) {
            const notifData: AppNotification[] = await notifRes.json()
            setNotifications(notifData)
          }
        }
      } catch {
        // Fallback demo data
        setLeads([
          { id: '1', name: 'Marie Ndongo', business: 'Restaurant Le Palmier', sector: 'Restauration', city: 'Douala', phone: '+237699112233', whatsapp: '+237699112233', source: 'maps', stage: 'nouveau', notes: null, email: null, address: 'Bonapriso, Douala', createdAt: new Date().toISOString(), lastContactAt: null, nextFollowUpAt: null, contactCount: 0, aiSuggestion: null, score: 55 },
          { id: '2', name: 'Jean-Pierre Fotso', business: 'Fotso Electronics', sector: 'Commerce', city: 'Yaoundé', phone: '+237677445566', whatsapp: '+237677445566', source: 'facebook', stage: 'contacte', notes: null, email: null, address: 'Bastos, Yaoundé', createdAt: new Date().toISOString(), lastContactAt: new Date().toISOString(), nextFollowUpAt: null, contactCount: 1, aiSuggestion: null, score: 60 },
          { id: '3', name: 'Fatou Amadou', business: 'Salon Beauté Fatou', sector: 'Beauté', city: 'Douala', phone: '+237655778899', whatsapp: '+237655778899', source: 'instagram', stage: 'en_discussion', notes: null, email: null, address: 'Akwa, Douala', createdAt: new Date().toISOString(), lastContactAt: new Date().toISOString(), nextFollowUpAt: null, contactCount: 2, aiSuggestion: 'Proposez un rendez-vous pour conclure.', score: 75 },
          { id: '4', name: 'Paul Essomba', business: 'Cyber Cafe Digital', sector: 'Services', city: 'Bafoussam', phone: '+237644332211', whatsapp: '+237644332211', source: 'linkedin', stage: 'a_relancer', notes: null, email: null, address: 'Centre Ville, Bafoussam', createdAt: new Date().toISOString(), lastContactAt: new Date().toISOString(), nextFollowUpAt: null, contactCount: 1, aiSuggestion: 'Relance urgente requise.', score: 40 },
          { id: '5', name: 'Sylvie Ngassa', business: 'Ngassa Catering', sector: 'Restauration', city: 'Douala', phone: '+237611009988', whatsapp: '+237611009988', source: 'facebook', stage: 'gagne', notes: null, email: null, address: 'Bonamoussadi, Douala', createdAt: new Date().toISOString(), lastContactAt: new Date().toISOString(), nextFollowUpAt: null, contactCount: 4, aiSuggestion: null, score: 95 },
        ])
        setNewLeadsCount(1)
        setNotifications([
          { id: 'n1', type: 'new_leads', title: 'Nouveaux prospects', message: 'Hermes a trouvé de nouveaux prospects.', read: false, createdAt: new Date().toISOString(), leadId: null },
          { id: 'n2', type: 'follow_up', title: 'Suivi requis', message: 'Un lead attend votre relance.', read: false, createdAt: new Date().toISOString(), leadId: '4' },
        ])
      }
      setLocalLoading(false)
    }
    seedAndLoad()
  }, [setLeads, setNotifications, setNewLeadsCount, setLocalLoading])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-5">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-sm">
          <SkeletonCard />
        </motion.div>
      </div>
    )
  }

  const ScreenComponent = screenComponents[currentScreen]
  const showNav = currentScreen !== 'onboarding' && isOnboarded

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto relative overflow-hidden">
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
      {showNav && <BottomNav />}
    </div>
  )
}
