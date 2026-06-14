import { create } from 'zustand'

export type Screen = 'onboarding' | 'home' | 'leads' | 'notifications' | 'profile' | 'preferences' | 'lead-detail'

export interface Lead {
  id: string
  name: string
  business: string | null
  sector: string | null
  city: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  address: string | null
  source: 'maps' | 'facebook' | 'instagram' | 'linkedin'
  status: 'new' | 'saved' | 'ignored' | 'contacted'
  notes: string | null
  createdAt: string
}

export interface UserPreference {
  sectors: string[]
  cities: string[]
  businessType: string[]
}

export interface AppNotification {
  id: string
  type: 'new_leads' | 'system' | 'subscription'
  title: string
  message: string
  read: boolean
  createdAt: string
}

export interface HermesState {
  // Auth
  isAuthenticated: boolean
  userId: string | null
  phone: string | null
  userName: string | null

  // Onboarding
  onboardingStep: number // 0, 1, 2
  isOnboarded: boolean

  // Navigation
  currentScreen: Screen
  previousScreen: Screen | null

  // Data
  leads: Lead[]
  selectedLeadId: string | null
  notifications: AppNotification[]
  preferences: UserPreference
  newLeadsCount: number

  // Subscription
  plan: 'free' | 'starter' | 'pro'
  credits: number

  // Loading
  isLoading: boolean

  // Actions
  setAuthenticated: (phone: string, userId: string) => void
  setOnboardingStep: (step: number) => void
  completeOnboarding: () => void
  navigateTo: (screen: Screen) => void
  goBack: () => void
  setLeads: (leads: Lead[]) => void
  addLead: (lead: Lead) => void
  updateLeadStatus: (id: string, status: Lead['status']) => void
  setSelectedLeadId: (id: string | null) => void
  setNotifications: (notifications: AppNotification[]) => void
  markNotificationRead: (id: string) => void
  setPreferences: (prefs: UserPreference) => void
  setNewLeadsCount: (count: number) => void
  setPlan: (plan: 'free' | 'starter' | 'pro') => void
  setCredits: (credits: number) => void
  setLoading: (loading: boolean) => void
  decrementCredits: () => void
}

export const useHermesStore = create<HermesState>((set, get) => ({
  // Auth
  isAuthenticated: false,
  userId: null,
  phone: null,
  userName: null,

  // Onboarding
  onboardingStep: 0,
  isOnboarded: false,

  // Navigation
  currentScreen: 'onboarding',
  previousScreen: null,

  // Data
  leads: [],
  selectedLeadId: null,
  notifications: [],
  preferences: {
    sectors: [],
    cities: [],
    businessType: [],
  },
  newLeadsCount: 0,

  // Subscription
  plan: 'free',
  credits: 5,

  // Loading
  isLoading: false,

  // Actions
  setAuthenticated: (phone, userId) => set({ isAuthenticated: true, phone, userId }),

  setOnboardingStep: (step) => set({ onboardingStep: step }),

  completeOnboarding: () => set({ isOnboarded: true, onboardingStep: 3, currentScreen: 'home' }),

  navigateTo: (screen) => set((state) => ({
    previousScreen: state.currentScreen,
    currentScreen: screen,
  })),

  goBack: () => set((state) => ({
    currentScreen: state.previousScreen || 'home',
    previousScreen: null,
  })),

  setLeads: (leads) => set({ leads }),

  addLead: (lead) => set((state) => ({
    leads: [lead, ...state.leads],
  })),

  updateLeadStatus: (id, status) => set((state) => ({
    leads: state.leads.map((l) => l.id === id ? { ...l, status } : l),
  })),

  setSelectedLeadId: (id) => set({ selectedLeadId: id }),

  setNotifications: (notifications) => set({ notifications }),

  markNotificationRead: (id) => set((state) => ({
    notifications: state.notifications.map((n) => n.id === id ? { ...n, read: true } : n),
  })),

  setPreferences: (prefs) => set({ preferences: prefs }),

  setNewLeadsCount: (count) => set({ newLeadsCount: count }),

  setPlan: (plan) => set({ plan }),

  setCredits: (credits) => set({ credits }),

  setLoading: (loading) => set({ isLoading: loading }),

  decrementCredits: () => set((state) => ({
    credits: Math.max(0, state.credits - 1),
  })),
}))
