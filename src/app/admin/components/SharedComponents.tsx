'use client'

import { motion } from 'framer-motion'
import { AlertTriangle, Loader2 } from 'lucide-react'

/* ==================== LOADING SKELETON ==================== */
export function LoadingSkeleton() {
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

/* ==================== EMPTY STATE ==================== */
export function EmptyState({ message, icon: Icon = AlertTriangle }: { message: string; icon?: typeof AlertTriangle }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
        <Icon className="w-7 h-7 text-gray-300" />
      </div>
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  )
}

/* ==================== PAGINATION ==================== */
export function Pagination({ page, totalPages, setPage }: { page: number; totalPages: number; setPage: (p: number) => void }) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-2 pt-4 pb-2">
      <button
        onClick={() => setPage(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium disabled:opacity-40 active:scale-95 transition-transform"
      >
        Prec.
      </button>
      <span className="text-xs text-gray-500 min-w-[60px] text-center">{page} / {totalPages}</span>
      <button
        onClick={() => setPage(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium disabled:opacity-40 active:scale-95 transition-transform"
      >
        Suiv.
      </button>
    </div>
  )
}

/* ==================== SECTION HEADER ==================== */
export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

/* ==================== SEARCH BAR ==================== */
export function SearchBar({ value, onChange, placeholder = 'Rechercher...' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7B54]/30 focus:border-[#FF7B54] transition-colors"
      />
    </div>
  )
}

/* ==================== FILTER SELECT ==================== */
export function FilterSelect({ value, onChange, options, placeholder = 'Tous' }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; placeholder?: string }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7B54]/30 min-w-[100px]"
    >
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

/* ==================== STAT CARD ==================== */
export function StatCard({ label, value, sub, icon: Icon, color }: { label: string; value: string | number; sub?: string; icon: typeof AlertTriangle; color: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
          <Icon className="w-4.5 h-4.5 text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-[11px] text-gray-500 mt-0.5">{sub || label}</p>
    </motion.div>
  )
}

/* ==================== AVATAR INITIAL ==================== */
export function AvatarInitial({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-12 h-12 text-base' : 'w-10 h-10 text-sm'
  return (
    <div className={`${sizeClass} rounded-xl bg-gradient-to-br from-[#FF7B54] to-[#6C3FA9] flex items-center justify-center text-white font-bold shrink-0`}>
      {(name || 'U').charAt(0).toUpperCase()}
    </div>
  )
}

/* ==================== BADGE ==================== */
export function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${color}`}>{label}</span>
  )
}

/* ==================== ACTION BUTTON ==================== */
export function ActionButton({ label, icon: Icon, onClick, variant = 'primary' }: { label: string; icon?: typeof AlertTriangle; onClick: () => void; variant?: 'primary' | 'secondary' | 'danger' }) {
  const colors = {
    primary: 'bg-[#FF7B54] text-white',
    secondary: 'bg-gray-100 text-gray-600',
    danger: 'bg-red-50 text-red-600',
  }
  return (
    <button onClick={onClick} className={`px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 active:scale-95 transition-transform ${colors[variant]}`}>
      {Icon && <Icon className="w-4 h-4" />}
      {label}
    </button>
  )
}

/* ==================== BOTTOM SHEET ==================== */
export function BottomSheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto pb-safe"
      >
        <div className="sticky top-0 bg-white px-5 pt-4 pb-3 border-b border-gray-100 z-10">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 active:scale-95 transition-transform">
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
        <div className="p-5">
          {children}
        </div>
      </motion.div>
    </>
  )
}

/* ==================== DETAIL ROW ==================== */
export function DetailRow({ label, value, mono = false }: { label: string; value: string | number | null | undefined; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-sm font-medium text-gray-900 ${mono ? 'font-mono text-xs' : ''}`}>{value || '—'}</span>
    </div>
  )
}

/* ==================== REFRESH BUTTON ==================== */
export function RefreshButton({ onClick, loading }: { onClick: () => void; loading?: boolean }) {
  return (
    <button onClick={onClick} disabled={loading} className="p-2 rounded-xl hover:bg-gray-100 active:scale-95 transition-transform">
      <Loader2 className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
    </button>
  )
}

/* ==================== CONFIRM DIALOG ==================== */
export function ConfirmDialog({ open, onClose, onConfirm, title, message }: { open: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string }) {
  if (!open) return null
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
        <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
          <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-500 mb-5">{message}</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 bg-gray-100 rounded-xl text-sm font-medium text-gray-600 active:scale-95 transition-transform">Annuler</button>
            <button onClick={() => { onConfirm(); onClose() }} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium active:scale-95 transition-transform">Confirmer</button>
          </div>
        </div>
      </div>
    </>
  )
}

/* ==================== STAGE HELPERS ==================== */
export const STAGE_COLORS: Record<string, string> = {
  nouveau: 'bg-[#FF7B54]/10 text-[#FF7B54]',
  contacte: 'bg-[#2EC4B6]/10 text-[#2EC4B6]',
  en_discussion: 'bg-[#6C3FA9]/10 text-[#6C3FA9]',
  a_relancer: 'bg-[#FFB347]/10 text-[#FFB347]',
  gagne: 'bg-[#4CAF50]/10 text-[#4CAF50]',
  perdu: 'bg-[#EF4444]/10 text-[#EF4444]',
}

export const STAGE_LABELS: Record<string, string> = {
  nouveau: 'Nouveau', contacte: 'Contacte', en_discussion: 'Discussion',
  a_relancer: 'Relancer', gagne: 'Gagne', perdu: 'Perdu',
}

export const PLAN_COLORS: Record<string, string> = {
  pro: 'bg-[#6C3FA9]/10 text-[#6C3FA9]',
  starter: 'bg-[#FF7B54]/10 text-[#FF7B54]',
  free: 'bg-gray-100 text-gray-500',
}

export const TYPE_COLORS: Record<string, string> = {
  new_leads: 'bg-[#FF7B54]/10 text-[#FF7B54]',
  system: 'bg-[#6C3FA9]/10 text-[#6C3FA9]',
  subscription: 'bg-[#2EC4B6]/10 text-[#2EC4B6]',
  follow_up: 'bg-[#FFB347]/10 text-[#FFB347]',
  relance: 'bg-[#E4405F]/10 text-[#E4405F]',
  ai_suggestion: 'bg-[#6C3FA9]/10 text-[#6C3FA9]',
}

export const TYPE_LABELS: Record<string, string> = {
  new_leads: 'Nouveaux clients', system: 'Systeme', subscription: 'Abonnement',
  follow_up: 'Suivi', relance: 'Relance', ai_suggestion: 'Conseil IA',
}

export const STATUS_COLORS: Record<string, string> = {
  active: 'bg-[#4CAF50]/10 text-[#4CAF50]',
  completed: 'bg-[#6C3FA9]/10 text-[#6C3FA9]',
  paused: 'bg-[#FFB347]/10 text-[#FFB347]',
}

export const STATUS_LABELS: Record<string, string> = { active: 'Active', completed: 'Terminee', paused: 'En pause' }

export const CONTACT_TYPE_LABELS: Record<string, string> = {
  appel: 'Appel', whatsapp: 'WhatsApp', email: 'Email', visite: 'Visite', note: 'Note',
}

export const CONTACT_TYPE_COLORS: Record<string, string> = {
  appel: 'bg-[#2EC4B6]/10 text-[#2EC4B6]',
  whatsapp: 'bg-[#4CAF50]/10 text-[#4CAF50]',
  email: 'bg-[#FF7B54]/10 text-[#FF7B54]',
  visite: 'bg-[#6C3FA9]/10 text-[#6C3FA9]',
  note: 'bg-gray-100 text-gray-600',
}

export const ACTION_COLORS: Record<string, string> = {
  create: 'bg-[#4CAF50]/10 text-[#4CAF50]',
  update: 'bg-[#FFB347]/10 text-[#FFB347]',
  delete: 'bg-[#EF4444]/10 text-[#EF4444]',
  login: 'bg-[#6C3FA9]/10 text-[#6C3FA9]',
  export: 'bg-[#2EC4B6]/10 text-[#2EC4B6]',
  bulk: 'bg-[#FF7B54]/10 text-[#FF7B54]',
}

export const ACTION_LABELS: Record<string, string> = {
  create: 'Creation', update: 'Modification', delete: 'Suppression',
  login: 'Connexion', export: 'Export', bulk: 'Action lot',
}
