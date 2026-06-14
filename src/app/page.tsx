'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useHermesStore, type Screen } from '@/store/hermes-store'
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

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // SW registration failed, app still works
      })
    }
  }, [])

  // Seed demo data on first load
  useEffect(() => {
    async function seedAndLoad() {
      try {
        // Seed demo data
        const seedRes = await fetch('/api/seed', { method: 'POST' })
        if (seedRes.ok) {
          // Load leads
          const leadsRes = await fetch('/api/leads')
          if (leadsRes.ok) {
            const leadsData = await leadsRes.json()
            setLeads(leadsData)
            const newCount = leadsData.filter((l: { status: string }) => l.status === 'new').length
            setNewLeadsCount(newCount)
          }

          // Load notifications
          const notifRes = await fetch('/api/notifications')
          if (notifRes.ok) {
            const notifData = await notifRes.json()
            setNotifications(notifData)
          }
        }
      } catch (error) {
        console.error('Failed to load data:', error)
        // Use fallback demo data
        setLeads([
          { id: '1', name: 'Marie Ndongo', business: 'Restaurant Le Palmier', sector: 'Restauration', city: 'Douala', phone: '+237699112233', whatsapp: '+237699112233', source: 'maps', status: 'new', notes: null, email: null, address: 'Bonapriso, Douala', createdAt: new Date().toISOString() },
          { id: '2', name: 'Jean-Pierre Fotso', business: 'Fotso Electronics', sector: 'Commerce', city: 'Yaoundé', phone: '+237677445566', whatsapp: '+237677445566', source: 'facebook', status: 'new', notes: null, email: null, address: 'Bastos, Yaoundé', createdAt: new Date().toISOString() },
          { id: '3', name: 'Fatou Amadou', business: 'Salon Beauté Fatou', sector: 'Beauté', city: 'Douala', phone: '+237655778899', whatsapp: '+237655778899', source: 'instagram', status: 'new', notes: null, email: null, address: 'Akwa, Douala', createdAt: new Date().toISOString() },
          { id: '4', name: 'Paul Essomba', business: 'Cyber Cafe Digital', sector: 'Services', city: 'Bafoussam', phone: '+237644332211', whatsapp: '+237644332211', source: 'linkedin', status: 'new', notes: null, email: null, address: 'Centre Ville, Bafoussam', createdAt: new Date().toISOString() },
          { id: '5', name: 'Chloé Mbarga', business: 'Mbarga Fashion House', sector: 'Mode', city: 'Douala', phone: '+237633221100', whatsapp: '+237633221100', source: 'instagram', status: 'new', notes: null, email: null, address: 'Deido, Douala', createdAt: new Date().toISOString() },
          { id: '6', name: 'Alain Toukam', business: 'Toukam Auto Parts', sector: 'Automobile', city: 'Yaoundé', phone: '+237622110099', whatsapp: '+237622110099', source: 'maps', status: 'new', notes: null, email: null, address: 'Nlongkak, Yaoundé', createdAt: new Date().toISOString() },
          { id: '7', name: 'Sylvie Ngassa', business: 'Ngassa Catering', sector: 'Restauration', city: 'Douala', phone: '+237611009988', whatsapp: '+237611009988', source: 'facebook', status: 'new', notes: null, email: null, address: 'Bonamoussadi, Douala', createdAt: new Date().toISOString() },
          { id: '8', name: 'Ibrahim Haman', business: 'Haman Tech Solutions', sector: 'Technologie', city: 'Garoua', phone: '+237600998877', whatsapp: '+237600998877', source: 'linkedin', status: 'new', notes: null, email: null, address: 'Quartier Commercial, Garoua', createdAt: new Date().toISOString() },
        ])
        setNewLeadsCount(8)
        setNotifications([
          { id: 'n1', type: 'new_leads', title: '8 nouveaux prospects', message: 'Hermes a trouvé 8 nouveaux prospects pendant la nuit dans votre zone.', read: false, createdAt: new Date().toISOString() },
          { id: 'n2', type: 'system', title: 'Bienvenue sur Hermes', message: 'Votre assistant de prospection est actif. Il cherche des prospects pour vous chaque nuit.', read: false, createdAt: new Date().toISOString() },
          { id: 'n3', type: 'subscription', title: 'Crédits disponibles', message: 'Vous avez 12 crédits restants sur votre plan Starter.', read: true, createdAt: new Date().toISOString() },
        ])
      }
      setLocalLoading(false)
    }
    seedAndLoad()
  }, [setLeads, setNotifications, setNewLeadsCount, setLocalLoading])

  // Show loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-5">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full max-w-sm"
        >
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
