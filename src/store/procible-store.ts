import { create } from 'zustand'

// ProCible - renamed from Hermes. "Leads" → "Clients" throughout.
// All Sparkles (✨) references removed — too AI-looking.

export type Screen = 'onboarding' | 'home' | 'leads' | 'notifications' | 'profile' | 'preferences' | 'lead-detail' | 'credits'

export type LeadStage = 'nouveau' | 'contacte' | 'en_discussion' | 'a_relancer' | 'gagne' | 'perdu'

export interface ContactEntry {
  id: string
  type: string // appel, whatsapp, email, visite, note
  content: string | null
  aiGenerated: boolean
  createdAt: string
}

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
  source: string
  stage: LeadStage
  notes: string | null
  lastContactAt: string | null
  nextFollowUpAt: string | null
  contactCount: number
  aiSuggestion: string | null
  score: number
  createdAt: string
  contacts?: ContactEntry[]
}

export interface UserPreference {
  sectors: string[]
  cities: string[]
  businessType: string[]
}

export type NotificationType = 'new_leads' | 'system' | 'subscription' | 'follow_up' | 'relance' | 'ai_suggestion'

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  leadId: string | null
  createdAt: string
}

export interface ProspectionCampaign {
  id: string
  productName: string
  images: string
  city: string
  locations: string // comma-separated "ISO2:CityName" entries, "ISO2:all" = whole country
  status: 'active' | 'completed' | 'paused'
  leadsFound: number
  userId: string
  createdAt: string
}

// Stage config — removed emoji icons (too AI-looking). Use clean dot indicator.
export const STAGE_CONFIG: Record<LeadStage, { label: string; color: string; bg: string; icon: string }> = {
  nouveau: { label: 'Nouveau', color: 'text-[#FF7B54]', bg: 'bg-[#FF7B54]/10', icon: '●' },
  contacte: { label: 'Contacté', color: 'text-[#2EC4B6]', bg: 'bg-[#2EC4B6]/10', icon: '●' },
  en_discussion: { label: 'En discussion', color: 'text-[#6C3FA9]', bg: 'bg-[#6C3FA9]/10', icon: '●' },
  a_relancer: { label: 'À relancer', color: 'text-[#FFB347]', bg: 'bg-[#FFB347]/10', icon: '●' },
  gagne: { label: 'Gagné', color: 'text-[#4CAF50]', bg: 'bg-[#4CAF50]/10', icon: '●' },
  perdu: { label: 'Perdu', color: 'text-[#EF4444]', bg: 'bg-[#EF4444]/10', icon: '●' },
}

export const STAGE_ORDER: LeadStage[] = ['nouveau', 'contacte', 'en_discussion', 'a_relancer', 'gagne', 'perdu']

export interface ProcibleState {
  // Auth
  isAuthenticated: boolean
  userId: string | null
  phone: string | null
  userName: string | null

  // Onboarding
  onboardingStep: number
  isOnboarded: boolean

  // Navigation
  currentScreen: Screen
  previousScreen: Screen | null

  // CRM Data
  leads: Lead[]
  selectedLeadId: string | null
  activeStageFilter: LeadStage | 'all'
  notifications: AppNotification[]
  preferences: UserPreference
  newLeadsCount: number

  // Campaigns
  campaigns: ProspectionCampaign[]
  activeCampaignId: string | null
  showProspectionForm: boolean
  prospectionSubmitting: boolean

  // AI
  aiDraft: string | null
  aiDraftLoading: boolean
  aiModel: string | null

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
  updateLeadStage: (id: string, stage: LeadStage) => void
  updateLead: (id: string, data: Partial<Lead>) => void
  setSelectedLeadId: (id: string | null) => void
  setActiveStageFilter: (filter: LeadStage | 'all') => void
  setNotifications: (notifications: AppNotification[]) => void
  addNotification: (notif: AppNotification) => void
  markNotificationRead: (id: string) => void
  setPreferences: (prefs: UserPreference) => void
  setNewLeadsCount: (count: number) => void
  setPlan: (plan: 'free' | 'starter' | 'pro') => void
  setCredits: (credits: number) => void
  setLoading: (loading: boolean) => void
  decrementCredits: () => void
  setAiDraft: (draft: string | null) => void
  setAiDraftLoading: (loading: boolean) => void
  setAiModel: (model: string | null) => void
  logContact: (leadId: string, type: string, content?: string, aiGenerated?: boolean) => void

  // Campaign actions
  setCampaigns: (campaigns: ProspectionCampaign[]) => void
  addCampaign: (campaign: ProspectionCampaign) => void
  updateCampaign: (id: string, data: Partial<ProspectionCampaign>) => void
  setActiveCampaignId: (id: string | null) => void
  setShowProspectionForm: (show: boolean) => void
  setProspectionSubmitting: (submitting: boolean) => void
}

export const useProcibleStore = create<ProcibleState>((set) => ({
  isAuthenticated: false,
  userId: null,
  phone: null,
  userName: null,

  onboardingStep: 0,
  isOnboarded: false,

  currentScreen: 'onboarding',
  previousScreen: null,

  leads: [],
  selectedLeadId: null,
  activeStageFilter: 'all',
  notifications: [],
  preferences: { sectors: [], cities: [], businessType: [] },
  newLeadsCount: 0,

  campaigns: [],
  activeCampaignId: null,
  showProspectionForm: false,
  prospectionSubmitting: false,

  aiDraft: null,
  aiDraftLoading: false,
  aiModel: null,

  plan: 'free',
  credits: 5,
  isLoading: false,

  setAuthenticated: (phone, userId) => set({ isAuthenticated: true, phone, userId }),
  setOnboardingStep: (step) => set({ onboardingStep: step }),
  completeOnboarding: () => set({ isOnboarded: true, onboardingStep: 3, currentScreen: 'home' }),
  navigateTo: (screen) => set((state) => ({ previousScreen: state.currentScreen, currentScreen: screen })),
  goBack: () => set((state) => ({ currentScreen: state.previousScreen || 'home', previousScreen: null })),

  setLeads: (leads) => set({ leads }),
  addLead: (lead) => set((state) => ({ leads: [lead, ...state.leads] })),
  updateLeadStage: (id, stage) => set((state) => ({
    leads: state.leads.map((l) => l.id === id ? { ...l, stage } : l),
  })),
  updateLead: (id, data) => set((state) => ({
    leads: state.leads.map((l) => l.id === id ? { ...l, ...data } : l),
  })),
  setSelectedLeadId: (id) => set({ selectedLeadId: id, aiDraft: null }),
  setActiveStageFilter: (filter) => set({ activeStageFilter: filter }),

  setNotifications: (notifications) => set({ notifications }),
  addNotification: (notif) => set((state) => ({ notifications: [notif, ...state.notifications] })),
  markNotificationRead: (id) => set((state) => ({
    notifications: state.notifications.map((n) => n.id === id ? { ...n, read: true } : n),
  })),
  setPreferences: (prefs) => set({ preferences: prefs }),
  setNewLeadsCount: (count) => set({ newLeadsCount: count }),
  setPlan: (plan) => set({ plan }),
  setCredits: (credits) => set({ credits }),
  setLoading: (loading) => set({ isLoading: loading }),
  decrementCredits: () => set((state) => ({ credits: Math.max(0, state.credits - 1) })),

  setAiDraft: (draft) => set({ aiDraft: draft }),
  setAiDraftLoading: (loading) => set({ aiDraftLoading: loading }),
  setAiModel: (model) => set({ aiModel: model }),

  logContact: (leadId, type, content, aiGenerated) => set((state) => {
    const lead = state.leads.find(l => l.id === leadId)
    if (!lead) return state

    const newCount = lead.contactCount + 1
    let newStage: LeadStage = lead.stage
    if (lead.stage === 'nouveau') newStage = 'contacte'
    else if (lead.stage === 'contacte' && newCount >= 2) newStage = 'en_discussion'

    const nextFollowUp = new Date()
    nextFollowUp.setDate(nextFollowUp.getDate() + 3)

    const newContact: ContactEntry = {
      id: `local-${Date.now()}`,
      type,
      content: content || null,
      aiGenerated: aiGenerated || false,
      createdAt: new Date().toISOString(),
    }

    return {
      leads: state.leads.map((l) =>
        l.id === leadId
          ? {
              ...l,
              stage: newStage,
              contactCount: newCount,
              lastContactAt: new Date().toISOString(),
              nextFollowUpAt: nextFollowUp.toISOString(),
              contacts: [newContact, ...(l.contacts || [])],
            }
          : l
      ),
    }
  }),

  // Campaign actions
  setCampaigns: (campaigns) => set({ campaigns }),
  addCampaign: (campaign) => set((state) => ({ campaigns: [campaign, ...state.campaigns] })),
  updateCampaign: (id, data) => set((state) => ({
    campaigns: state.campaigns.map((c) => c.id === id ? { ...c, ...data } : c),
  })),
  setActiveCampaignId: (id) => set({ activeCampaignId: id }),
  setShowProspectionForm: (show) => set({ showProspectionForm: show }),
  setProspectionSubmitting: (submitting) => set({ prospectionSubmitting: submitting }),
}))
