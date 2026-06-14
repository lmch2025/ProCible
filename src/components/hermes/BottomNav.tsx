'use client'

import { useHermesStore, type Screen } from '@/store/hermes-store'
import { Home, Users, Bell, User } from 'lucide-react'
import { motion } from 'framer-motion'

const navItems: { screen: Screen; icon: typeof Home; label: string }[] = [
  { screen: 'home', icon: Home, label: 'Accueil' },
  { screen: 'leads', icon: Users, label: 'Leads' },
  { screen: 'notifications', icon: Bell, label: 'Alertes' },
  { screen: 'profile', icon: User, label: 'Profil' },
]

export default function BottomNav() {
  const { currentScreen, navigateTo, notifications } = useHermesStore()
  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-border/50 pb-safe">
      <div className="max-w-lg mx-auto flex items-center justify-around py-2">
        {navItems.map(({ screen, icon: Icon, label }) => {
          const isActive = currentScreen === screen || 
            (screen === 'leads' && currentScreen === 'lead-detail') ||
            (screen === 'profile' && currentScreen === 'preferences')
          
          return (
            <button
              key={screen}
              onClick={() => navigateTo(screen)}
              className="relative flex flex-col items-center gap-1 py-2 px-4 min-w-[64px] transition-colors"
            >
              <div className="relative">
                <Icon
                  className={`w-6 h-6 transition-colors ${isActive ? 'text-[#FF7B54]' : 'text-muted-foreground'}`}
                  strokeWidth={isActive ? 2.5 : 1.5}
                />
                {/* Notification badge */}
                {screen === 'notifications' && unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#FF7B54] rounded-full flex items-center justify-center"
                  >
                    <span className="text-[10px] text-white font-bold">{unreadCount}</span>
                  </motion.span>
                )}
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#FF7B54]"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </div>
              <span className={`text-[11px] font-medium ${isActive ? 'text-[#FF7B54]' : 'text-muted-foreground'}`}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
