'use client'

import { useEffect, useState, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import { useProcibleStore, type Lead, type AppNotification } from '@/store/procible-store'
import Onboarding from '@/components/procible/Onboarding'
import HomeScreen from '@/components/procible/HomeScreen'
import BottomNav from '@/components/procible/BottomNav'
import { SkeletonCard } from '@/components/procible/SkeletonLoaders'
import { useI18n } from '@/lib/i18n'

// ── Lazy-load secondary screens ───────────────────────────────────────────
// LeadDetail (753 lines) and ProspectionForm (672 lines) are the heaviest —
// load them only when the user actually navigates to them. Each becomes a
// separate ~10-30KB chunk, fetched in parallel when needed.
const LeadsScreen = dynamic(() => import('@/components/procible/LeadsScreen'), { ssr: false })
const LeadDetail = dynamic(() => import('@/components/procible/LeadDetail'), { ssr: false })
const NotificationsScreen = dynamic(() => import('@/components/procible/NotificationsScreen'), { ssr: false })
const ProfileScreen = dynamic(() => import('@/components/procible/ProfileScreen'), { ssr: false })
const PreferencesScreen = dynamic(() => import('@/components/procible/PreferencesScreen'), { ssr: false })
const CreditsScreen = dynamic(() => import('@/components/procible/CreditsScreen'), { ssr: false })
const ProspectionForm = dynamic(() => import('@/components/procible/ProspectionForm'), { ssr: false })

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

  // Load app data on mount + when locale changes (so server-stored notification
  // titles/messages get re-fetched in the new language).
  //
  // Performance: parallelize all network requests (was strictly sequential —
  // 3 round-trips back-to-back). We also add a 6s timeout so a slow API never
  // blocks the UI indefinitely — we fall back to demo data instead.
  useEffect(() => {
    let cancelled = false

    async function fetchWithTimeout(input: RequestInfo, init?: RequestInit, ms = 6000): Promise<Response> {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), ms)
      try {
        return await fetch(input, { ...init, signal: controller.signal })
      } finally {
        clearTimeout(timer)
      }
    }

    async function loadAll() {
      const headers = { 'x-locale': locale }
      try {
        // Fire all 3 requests in parallel. /api/seed must succeed for the
        // others to make sense (it creates the demo user if missing), so we
        // wait for it first — but it's just one POST, very fast.
        const seedPromise = fetchWithTimeout('/api/seed', { method: 'POST', headers })

        // Kick off leads + notifications in parallel with seed (they don't
        // depend on seed's response body, only on the demo user existing —
        // which seed creates synchronously server-side).
        const leadsPromise = seedPromise.then(() =>
          fetchWithTimeout('/api/leads', { headers }).then((r) => (r.ok ? r.json() : [])).catch(() => [])
        )
        const notifPromise = seedPromise.then(() =>
          fetchWithTimeout('/api/notifications', { headers }).then((r) => (r.ok ? r.json() : [])).catch(() => [])
        )

        const seedRes = await seedPromise
        if (!seedRes.ok) throw new Error('seed failed')

        const [leadsData, notifData] = await Promise.all([leadsPromise, notifPromise])

        if (cancelled) return

        setLeads(leadsData as Lead[])
        const newCount = (leadsData as Lead[]).filter((l) => l.stage === 'nouveau').length
        setNewLeadsCount(newCount)
        setNotifications(notifData as AppNotification[])
      } catch {
        if (cancelled) return
        // Fallback demo data (offline or API down)
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
      } finally {
        if (!cancelled) setLocalLoading(false)
      }
    }
    loadAll()
    return () => { cancelled = true }
  }, [setLeads, setNotifications, setNewLeadsCount, locale])

  // Preload the most-likely-next screens during browser idle time so they're
  // already cached when the user navigates. Uses requestIdleCallback to avoid
  // competing with the initial render.
  useEffect(() => {
    if (!isOnboarded || loading) return
    const preload = () => {
      // Trigger the dynamic imports in the background.
      import('@/components/procible/LeadsScreen')
      import('@/components/procible/NotificationsScreen')
      import('@/components/procible/ProspectionForm')
    }
    const ric = (window as unknown as { requestIdleCallback?: (cb: () => void) => void }).requestIdleCallback
    if (ric) {
      ric(preload)
    } else {
      setTimeout(preload, 1500)
    }
  }, [isOnboarded, loading])

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
