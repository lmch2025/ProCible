'use client'

import { useProcibleStore, type Screen } from '@/store/procible-store'
import { Home, Users, Bell, User, Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const navItems: { screen: Screen; icon: typeof Home; label: string }[] = [
  { screen: 'home', icon: Home, label: 'Accueil' },
  { screen: 'leads', icon: Users, label: 'Clients' },
  { screen: 'notifications', icon: Bell, label: 'Alertes' },
  { screen: 'profile', icon: User, label: 'Profil' },
]

export default function BottomNav() {
  const { currentScreen, navigateTo, notifications, setShowProspectionForm, credits } = useProcibleStore()
  const unreadCount = notifications.filter(n => !n.read).length

  // Low-credit warning persists across all screens via BottomNav
  const LOW_CREDIT_THRESHOLD = 2
  const isLowCredits = credits <= LOW_CREDIT_THRESHOLD

  // Split items: 2 left, central +, 2 right
  const leftItems = navItems.slice(0, 2)
  const rightItems = navItems.slice(2)

  const isActive = (screen: Screen) =>
    currentScreen === screen ||
    (screen === 'leads' && currentScreen === 'lead-detail') ||
    (screen === 'profile' && (currentScreen === 'preferences' || currentScreen === 'credits'))

  const handlePlusClick = () => {
    setShowProspectionForm(true)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-border/50 pb-safe">
      <div className="max-w-lg mx-auto flex items-center justify-around py-2 relative">
        {/* Left items */}
        {leftItems.map(({ screen, icon: Icon, label }) => {
          const active = isActive(screen)
          return (
            <button
              key={screen}
              onClick={() => navigateTo(screen)}
              className="relative flex flex-col items-center gap-1 py-2 px-3 min-w-[60px] transition-colors"
            >
              <div className="relative">
                <Icon
                  className={`w-6 h-6 transition-colors ${active ? 'text-[#FF7B54]' : 'text-muted-foreground'}`}
                  strokeWidth={active ? 2.5 : 1.5}
                />
                {active && (
                  <motion.div
                    layoutId="nav-indicator-left"
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#FF7B54]"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </div>
              <span className={`text-[11px] font-medium ${active ? 'text-[#FF7B54]' : 'text-muted-foreground'}`}>
                {label}
              </span>
            </button>
          )
        })}

        {/* Central + Button - immersive water surface effect */}
        <div className="relative flex flex-col items-center min-w-[80px] -mt-8">
          {/* Water ripples */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 pointer-events-none">
            <motion.div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#FF7B54]/30"
              animate={{
                width: [40, 70, 40],
                height: [40, 70, 40],
                opacity: [0.6, 0, 0.6],
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#6C3FA9]/30"
              animate={{
                width: [50, 85, 50],
                height: [50, 85, 50],
                opacity: [0.4, 0, 0.4],
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            />
          </div>

          {/* Glow halo */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#FF7B54]/30 to-[#6C3FA9]/30 blur-xl" />

          {/* The button itself - floats unstably like on water surface */}
          <motion.button
            onClick={handlePlusClick}
            className="relative w-16 h-16 rounded-full bg-gradient-to-br from-[#FF7B54] to-[#6C3FA9] flex items-center justify-center shadow-2xl shadow-[#FF7B54]/40 border-4 border-white"
            animate={{
              y: [0, -3, 0, 2, 0],
              rotate: [-2, 2, -1, 1, -2],
              scale: [1, 1.03, 1, 1.02, 1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            whileTap={{ scale: 0.9, rotate: 90 }}
            whileHover={{ scale: 1.08 }}
          >
            {/* Water shimmer overlay */}
            <motion.div
              className="absolute inset-0 rounded-full opacity-30 overflow-hidden"
              animate={{
                background: [
                  'linear-gradient(0deg, rgba(255,255,255,0.4) 0%, transparent 50%)',
                  'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 50%)',
                  'linear-gradient(0deg, rgba(255,255,255,0.4) 0%, transparent 50%)',
                ],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            <Plus className="w-8 h-8 text-white relative z-10" strokeWidth={3} />
          </motion.button>

          <span className="text-[10px] font-semibold text-[#FF7B54] mt-1">Nouveau</span>
        </div>

        {/* Right items */}
        {rightItems.map(({ screen, icon: Icon, label }) => {
          const active = isActive(screen)
          const showLowCreditPulse = screen === 'profile' && isLowCredits
          return (
            <button
              key={screen}
              onClick={() => navigateTo(screen)}
              aria-label={showLowCreditPulse ? `Profil — ${credits} crédit${credits > 1 ? 's' : ''} restant${credits > 1 ? 's' : ''}` : label}
              className="relative flex flex-col items-center gap-1 py-2 px-3 min-w-[60px] transition-colors"
            >
              <div className="relative">
                {/* Pulsing low-credit halo on profile icon */}
                {showLowCreditPulse && (
                  <motion.span
                    aria-hidden
                    className="absolute inset-0 rounded-full bg-[#EF4444]/30 pointer-events-none"
                    animate={{ scale: [1, 1.4, 1], opacity: [0.55, 0, 0.55] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
                <Icon
                  className={`w-6 h-6 transition-colors relative ${active ? 'text-[#FF7B54]' : showLowCreditPulse ? 'text-[#EF4444]' : 'text-muted-foreground'}`}
                  strokeWidth={active ? 2.5 : 1.5}
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
                {/* Low-credit badge on profile tab — shows exact remaining balance */}
                {showLowCreditPulse && (
                  <motion.span
                    aria-hidden
                    className={`absolute -top-1.5 -right-1.5 flex items-center justify-center rounded-full bg-[#EF4444] border-2 border-white font-bold text-white leading-none ${
                      credits >= 10 ? 'w-5 h-4 px-1 text-[9px]' : 'w-4 h-4 text-[10px]'
                    }`}
                    animate={{ scale: [1, 1.25, 1] }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    {credits}
                  </motion.span>
                )}
                {active && (
                  <motion.div
                    layoutId="nav-indicator-right"
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#FF7B54]"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </div>
              <span className={`text-[11px] font-medium ${active ? 'text-[#FF7B54]' : showLowCreditPulse ? 'text-[#EF4444]' : 'text-muted-foreground'}`}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
