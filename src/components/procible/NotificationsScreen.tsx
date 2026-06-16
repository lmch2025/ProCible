'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useProcibleStore, type AppNotification } from '@/store/procible-store'
import { Bell, CreditCard, Check, RotateCcw, MessageSquare, Lightbulb, UserPlus } from 'lucide-react'

const typeConfig: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  new_leads: { icon: UserPlus, color: 'text-[#FF7B54]', bg: 'bg-[#FF7B54]/10' },
  system: { icon: Bell, color: 'text-[#6C3FA9]', bg: 'bg-[#6C3FA9]/10' },
  subscription: { icon: CreditCard, color: 'text-[#2EC4B6]', bg: 'bg-[#2EC4B6]/10' },
  follow_up: { icon: RotateCcw, color: 'text-[#FFB347]', bg: 'bg-[#FFB347]/10' },
  relance: { icon: MessageSquare, color: 'text-[#E4405F]', bg: 'bg-[#E4405F]/10' },
  ai_suggestion: { icon: Lightbulb, color: 'text-[#6C3FA9]', bg: 'bg-[#6C3FA9]/10' },
}

export default function NotificationsScreen() {
  const { notifications, markNotificationRead, navigateTo, setSelectedLeadId } = useProcibleStore()
  const unreadCount = notifications.filter(n => !n.read).length

  const handleNotifClick = (notif: AppNotification) => {
    markNotificationRead(notif.id)
    if (notif.leadId) {
      setSelectedLeadId(notif.leadId)
      navigateTo('lead-detail')
    }
  }

  return (
    <div className="pb-28">
      {/* Header - sticky */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl px-5 pt-6 pb-4">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Tout est lu'}
            </p>
          </div>
          {unreadCount > 0 && (
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }} className="w-10 h-10 rounded-full bg-[#FF7B54]/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-[#FF7B54]" />
            </motion.div>
          )}
        </motion.div>
      </div>

      <div className="px-5 mt-2">
        {notifications.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-semibold mb-1">Aucune notification</p>
            <p className="text-sm text-muted-foreground text-center">ProCible vous alertera pour les suivis et relances.</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {notifications.map((notif, i) => {
                const config = typeConfig[notif.type] || typeConfig.system
                const IconComp = config.icon
                return (
                  <motion.button
                    key={notif.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => handleNotifClick(notif)}
                    className={`w-full flex items-start gap-3 p-4 rounded-2xl border transition-all text-left ${
                      notif.read ? 'bg-card border-border/30' : 'bg-[#FF7B54]/5 border-[#FF7B54]/20 shadow-sm'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center shrink-0`}>
                      <IconComp className={`w-5 h-5 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className={`font-semibold text-sm ${notif.read ? 'text-muted-foreground' : ''}`}>{notif.title}</h3>
                        {!notif.read && <span className="w-2 h-2 rounded-full bg-[#FF7B54] shrink-0 mt-1.5" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        {new Date(notif.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </motion.button>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
