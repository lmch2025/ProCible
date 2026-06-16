/**
 * In-memory mock Prisma client used as a fallback when the SQLite database
 * is unavailable (e.g. on Vercel serverless where the filesystem is read-only).
 *
 * Implements the subset of the Prisma client API used by the admin routes:
 *  - findMany, findUnique, count, create, update, updateMany, delete, deleteMany, upsert
 *  - where: equality, { contains }, OR, AND
 *  - select, include (with _count), orderBy, skip, take
 *
 * The data is seeded once per cold start and stays in module scope. Writes are
 * applied to the in-memory store so the admin UI remains fully interactive
 * during a single session (changes do not persist across deployments).
 */

type AnyRecord = Record<string, any>

// --- Seed data -------------------------------------------------------------

const now = Date.now()
const daysAgo = (d: number) => new Date(now - d * 24 * 60 * 60 * 1000)

const USERS: AnyRecord[] = [
  { id: 'u1', phone: '+237690000001', name: 'Awa Ngono', plan: 'pro', credits: 42, onboarded: true, createdAt: daysAgo(2), updatedAt: daysAgo(1) },
  { id: 'u2', phone: '+237690000002', name: 'Jean Ekambi', plan: 'starter', credits: 18, onboarded: true, createdAt: daysAgo(5), updatedAt: daysAgo(3) },
  { id: 'u3', phone: '+237690000003', name: 'Fatou Diallo', plan: 'free', credits: 5, onboarded: false, createdAt: daysAgo(8), updatedAt: daysAgo(8) },
  { id: 'u4', phone: '+237690000004', name: 'Paul Mballa', plan: 'pro', credits: 30, onboarded: true, createdAt: daysAgo(12), updatedAt: daysAgo(6) },
  { id: 'u5', phone: '+237690000005', name: 'Sara Bello', plan: 'starter', credits: 9, onboarded: true, createdAt: daysAgo(15), updatedAt: daysAgo(10) },
  { id: 'u6', phone: '+237690000006', name: 'Ibrahim Toure', plan: 'free', credits: 2, onboarded: false, createdAt: daysAgo(20), updatedAt: daysAgo(20) },
]

const LEADS: AnyRecord[] = [
  { id: 'l1', name: 'Restaurant Le Baobab', business: 'Restaurant', sector: 'Restauration', city: 'Douala', phone: '+237699000001', whatsapp: '+237699000001', email: 'baobab@example.cm', address: 'Akwa, Douala', source: 'maps', stage: 'nouveau', notes: null, lastContactAt: null, nextFollowUpAt: daysAgo(-2), contactCount: 0, aiSuggestion: 'Premier contact recommandé par WhatsApp', score: 72, userId: 'u1', createdAt: daysAgo(1), updatedAt: daysAgo(1) },
  { id: 'l2', name: 'Pharmacie du Centre', business: 'Pharmacie', sector: 'Santé', city: 'Yaoundé', phone: '+237699000002', whatsapp: '+237699000002', email: 'centre@example.cm', address: 'Centre-ville, Yaoundé', source: 'facebook', stage: 'contacte', notes: 'Intéressé', lastContactAt: daysAgo(3), nextFollowUpAt: daysAgo(-1), contactCount: 1, aiSuggestion: 'Relancer par appel', score: 65, userId: 'u1', createdAt: daysAgo(4), updatedAt: daysAgo(3) },
  { id: 'l3', name: 'Garage Express', business: 'Garage auto', sector: 'Automobile', city: 'Bafoussam', phone: '+237699000003', whatsapp: '+237699000003', email: null, address: 'Marché A, Bafoussam', source: 'maps', stage: 'en_discussion', notes: 'Négociation en cours', lastContactAt: daysAgo(2), nextFollowUpAt: daysAgo(-3), contactCount: 2, aiSuggestion: 'Proposer une démo', score: 81, userId: 'u2', createdAt: daysAgo(6), updatedAt: daysAgo(2) },
  { id: 'l4', name: 'Boutique Élégance', business: 'Mode', sector: 'Vêtements', city: 'Douala', phone: '+237699000004', whatsapp: '+237699000004', email: 'elegance@example.cm', address: 'Bonapriso, Douala', source: 'instagram', stage: 'a_relancer', notes: 'Pas de réponse', lastContactAt: daysAgo(7), nextFollowUpAt: daysAgo(0), contactCount: 1, aiSuggestion: 'Envoyer un message de rappel', score: 45, userId: 'u2', createdAt: daysAgo(10), updatedAt: daysAgo(7) },
  { id: 'l5', name: 'Café Romarin', business: 'Café', sector: 'Restauration', city: 'Yaoundé', phone: '+237699000005', whatsapp: '+237699000005', email: null, address: 'Bastos, Yaoundé', source: 'maps', stage: 'gagne', notes: 'Client signé', lastContactAt: daysAgo(5), nextFollowUpAt: null, contactCount: 4, aiSuggestion: 'Suivi satisfaction', score: 95, userId: 'u4', createdAt: daysAgo(14), updatedAt: daysAgo(5) },
  { id: 'l6', name: 'Salon Beauté Plus', business: 'Salon', sector: 'Beauté', city: 'Douala', phone: '+237699000006', whatsapp: '+237699000006', email: null, address: 'Akwa, Douala', source: 'facebook', stage: 'perdu', notes: 'Budget insuffisant', lastContactAt: daysAgo(8), nextFollowUpAt: null, contactCount: 2, aiSuggestion: null, score: 20, userId: 'u5', createdAt: daysAgo(18), updatedAt: daysAgo(8) },
  { id: 'l7', name: 'Librairie Savoir', business: 'Librairie', sector: 'Éducation', city: 'Bafoussam', phone: '+237699000007', whatsapp: '+237699000007', email: 'savoir@example.cm', address: 'Centre, Bafoussam', source: 'maps', stage: 'nouveau', notes: null, lastContactAt: null, nextFollowUpAt: daysAgo(-4), contactCount: 0, aiSuggestion: 'Premier contact par WhatsApp', score: 58, userId: 'u3', createdAt: daysAgo(2), updatedAt: daysAgo(2) },
  { id: 'l8', name: 'Pâtisserie Dorée', business: 'Pâtisserie', sector: 'Restauration', city: 'Yaoundé', phone: '+237699000008', whatsapp: '+237699000008', email: null, address: 'Mvan, Yaoundé', source: 'instagram', stage: 'contacte', notes: 'Demande de devis', lastContactAt: daysAgo(1), nextFollowUpAt: daysAgo(-2), contactCount: 1, aiSuggestion: 'Envoyer le devis', score: 74, userId: 'u4', createdAt: daysAgo(3), updatedAt: daysAgo(1) },
]

const CONTACTS: AnyRecord[] = [
  { id: 'c1', type: 'whatsapp', content: 'Bonjour, je vous contacte concernant...', aiGenerated: true, leadId: 'l2', createdAt: daysAgo(3) },
  { id: 'c2', type: 'appel', content: 'Discussion de 15 min sur les offres', aiGenerated: false, leadId: 'l3', createdAt: daysAgo(2) },
  { id: 'c3', type: 'email', content: 'Devis envoyé', aiGenerated: false, leadId: 'l5', createdAt: daysAgo(6) },
  { id: 'c4', type: 'note', content: 'Client très intéressé, à recontacter', aiGenerated: false, leadId: 'l5', createdAt: daysAgo(5) },
  { id: 'c5', type: 'whatsapp', content: 'Rappel envoyé', aiGenerated: true, leadId: 'l4', createdAt: daysAgo(7) },
]

const CAMPAIGNS: AnyRecord[] = [
  { id: 'cmp1', productName: 'Cosmétiques naturels', images: '', city: 'Douala', status: 'active', leadsFound: 24, userId: 'u1', createdAt: daysAgo(7), updatedAt: daysAgo(1) },
  { id: 'cmp2', productName: 'Pièces auto', images: '', city: 'Yaoundé', status: 'active', leadsFound: 18, userId: 'u2', createdAt: daysAgo(10), updatedAt: daysAgo(2) },
  { id: 'cmp3', productName: 'Mode femme', images: '', city: 'Bafoussam', status: 'paused', leadsFound: 12, userId: 'u5', createdAt: daysAgo(15), updatedAt: daysAgo(8) },
  { id: 'cmp4', productName: 'Équipements bureau', images: '', city: 'Douala', status: 'completed', leadsFound: 35, userId: 'u4', createdAt: daysAgo(20), updatedAt: daysAgo(5) },
]

const NOTIFICATIONS: AnyRecord[] = [
  { id: 'n1', type: 'follow_up', title: 'Relance prévue', message: 'Pharmacie du Centre à rappeler aujourd\'hui', read: false, leadId: 'l2', userId: 'u1', createdAt: daysAgo(1) },
  { id: 'n2', type: 'new_leads', title: 'Nouveaux clients', message: '3 nouveaux clients trouvés à Douala', read: false, leadId: null, userId: 'u1', createdAt: daysAgo(2) },
  { id: 'n3', type: 'ai_suggestion', title: 'Suggestion IA', message: 'Garage Express : proposer une démo', read: true, leadId: 'l3', userId: 'u2', createdAt: daysAgo(3) },
  { id: 'n4', type: 'relance', title: 'Client à relancer', message: 'Boutique Élégance sans réponse depuis 7 jours', read: false, leadId: 'l4', userId: 'u2', createdAt: daysAgo(4) },
  { id: 'n5', type: 'system', title: 'Bienvenue', message: 'Configurez vos préférences de prospection', read: true, leadId: null, userId: 'u3', createdAt: daysAgo(8) },
]

const AUDIT_LOGS: AnyRecord[] = [
  { id: 'a1', action: 'login', entity: 'admin', entityId: null, adminEmail: 'admin@procible.app', details: JSON.stringify({ method: 'password' }), ip: '127.0.0.1', createdAt: daysAgo(0) },
  { id: 'a2', action: 'update', entity: 'lead', entityId: 'l3', adminEmail: 'admin@procible.app', details: JSON.stringify({ stage: 'en_discussion' }), ip: '127.0.0.1', createdAt: daysAgo(1) },
  { id: 'a3', action: 'export', entity: 'users', entityId: null, adminEmail: 'admin@procible.app', details: JSON.stringify({ records: 6 }), ip: '127.0.0.1', createdAt: daysAgo(2) },
  { id: 'a4', action: 'create', entity: 'notification', entityId: 'n1', adminEmail: 'admin@procible.app', details: null, ip: '127.0.0.1', createdAt: daysAgo(3) },
  { id: 'a5', action: 'bulk', entity: 'credits', entityId: null, adminEmail: 'admin@procible.app', details: JSON.stringify({ amount: 5, count: 3 }), ip: '127.0.0.1', createdAt: daysAgo(4) },
]

const SETTINGS: AnyRecord[] = [
  { id: 's1', key: 'openrouter_models', value: '7', description: 'Number of AI models available', updatedAt: daysAgo(10) },
  { id: 's2', key: 'free_credits_on_signup', value: '5', description: 'Credits given to new users', updatedAt: daysAgo(10) },
  { id: 's3', key: 'max_leads_per_campaign', value: '50', description: 'Maximum leads per prospection campaign', updatedAt: daysAgo(8) },
]

const PREFERENCES: AnyRecord[] = [
  { id: 'p1', sectors: 'Restauration,Santé,Beauté', cities: 'Douala,Yaoundé', businessType: 'PME', userId: 'u1', createdAt: daysAgo(2), updatedAt: daysAgo(1) },
  { id: 'p2', sectors: 'Automobile,Mode', cities: 'Bafoussam,Douala', businessType: 'Commerce', userId: 'u2', createdAt: daysAgo(5), updatedAt: daysAgo(3) },
]

const ADMINS: AnyRecord[] = [
  { id: 'adm1', email: 'admin@procible.app', name: 'Super Admin', role: 'super_admin', createdAt: daysAgo(30), updatedAt: daysAgo(1) },
]

// --- Store -----------------------------------------------------------------

const store: Record<string, AnyRecord[]> = {
  user: USERS,
  lead: LEADS,
  contactHistory: CONTACTS,
  prospectionCampaign: CAMPAIGNS,
  notification: NOTIFICATIONS,
  auditLog: AUDIT_LOGS,
  appSettings: SETTINGS,
  preference: PREFERENCES,
  admin: ADMINS,
}

const idCounters: Record<string, number> = {}

function genId(model: string): string {
  idCounters[model] = (idCounters[model] || 0) + 1
  return `${model}_${Date.now().toString(36)}_${idCounters[model]}`
}

// --- Where matching --------------------------------------------------------

function matchValue(recordVal: any, condition: any): boolean {
  if (condition === null || condition === undefined) {
    return recordVal === null || recordVal === undefined
  }
  if (typeof condition === 'object' && !Array.isArray(condition)) {
    if (condition.contains !== undefined) {
      return String(recordVal ?? '').toLowerCase().includes(String(condition.contains).toLowerCase())
    }
    if (condition.gt !== undefined) return recordVal > condition.gt
    if (condition.gte !== undefined) return recordVal >= condition.gte
    if (condition.lt !== undefined) return recordVal < condition.lt
    if (condition.lte !== undefined) return recordVal <= condition.lte
    if (condition.in !== undefined) return Array.isArray(condition.in) && condition.in.includes(recordVal)
    if (condition.not !== undefined) return !matchValue(recordVal, condition.not)
  }
  return recordVal === condition
}

function matchWhere(record: AnyRecord, where: AnyRecord | undefined): boolean {
  if (!where || Object.keys(where).length === 0) return true
  for (const [key, condition] of Object.entries(where)) {
    if (key === 'AND') {
      if (!Array.isArray(condition)) return false
      if (!condition.every((sub: AnyRecord) => matchWhere(record, sub))) return false
      continue
    }
    if (key === 'OR') {
      if (!Array.isArray(condition)) return false
      if (!condition.some((sub: AnyRecord) => matchWhere(record, sub))) return false
      continue
    }
    if (key === 'NOT') {
      if (typeof condition === 'object' && !Array.isArray(condition)) {
        if (matchWhere(record, condition)) return false
      }
      continue
    }
    if (!matchValue(record[key], condition)) return false
  }
  return true
}

// --- Select / Include ------------------------------------------------------

function applySelect(record: AnyRecord, select: AnyRecord | undefined): AnyRecord {
  if (!select) return { ...record }
  const out: AnyRecord = {}
  for (const [key, include] of Object.entries(select)) {
    if (key === '_count' && typeof include === 'object' && include) {
      const selectCounts = (include as AnyRecord).select || {}
      const counts: AnyRecord = {}
      for (const [relKey] of Object.entries(selectCounts)) {
        counts[relKey] = countRelation(record, relKey)
      }
      out._count = counts
      continue
    }
    out[key] = record[key]
  }
  return out
}

function countRelation(record: AnyRecord, relKey: string): number {
  // Map plural relation name back to model
  const map: Record<string, string> = {
    leads: 'lead',
    contacts: 'contactHistory',
    campaigns: 'prospectionCampaign',
    notifications: 'notification',
  }
  const model = map[relKey] || relKey
  const all = store[model] || []
  if (relKey === 'leads' || relKey === 'campaigns' || relKey === 'notifications') {
    return all.filter(r => r.userId === record.id).length
  }
  if (relKey === 'contacts') {
    return all.filter(r => r.leadId === record.id).length
  }
  return all.length
}

function applyInclude(record: AnyRecord, include: AnyRecord | undefined): AnyRecord {
  if (!include) return { ...record }
  const out: AnyRecord = { ...record }
  for (const [key, value] of Object.entries(include)) {
    if (key === '_count' && typeof value === 'object' && value) {
      const selectCounts = (value as AnyRecord).select || {}
      const counts: AnyRecord = {}
      for (const [relKey] of Object.entries(selectCounts)) {
        counts[relKey] = countRelation(record, relKey)
      }
      out._count = counts
      continue
    }
    if (key === 'user') {
      const u = store.user.find(x => x.id === record.userId)
      if (u && typeof value === 'object' && value !== null) {
        out.user = applySelect(u, (value as AnyRecord).select)
      } else {
        out.user = u ? { ...u } : null
      }
      continue
    }
    if (key === 'lead') {
      const l = store.lead.find(x => x.id === record.leadId)
      if (l && typeof value === 'object' && value !== null) {
        const nested = (value as AnyRecord).include || (value as AnyRecord).select
        if ((value as AnyRecord).include) out.lead = applyInclude(l, (value as AnyRecord).include)
        else if ((value as AnyRecord).select) out.lead = applySelect(l, (value as AnyRecord).select)
        else out.lead = { ...l }
      } else {
        out.lead = l ? { ...l } : null
      }
      continue
    }
    if (key === 'preferences') {
      out.preferences = store.preference.find(x => x.userId === record.id) || null
      continue
    }
  }
  return out
}

// --- Sorting ---------------------------------------------------------------

function sortRecords(records: AnyRecord[], orderBy?: AnyRecord): AnyRecord[] {
  if (!orderBy) return records
  const entries = Object.entries(orderBy)
  if (entries.length === 0) return records
  return [...records].sort((a, b) => {
    for (const [key, dir] of entries) {
      const av = a[key]
      const bv = b[key]
      if (av === bv) continue
      let cmp = 0
      if (av === null || av === undefined) cmp = -1
      else if (bv === null || bv === undefined) cmp = 1
      else if (av < bv) cmp = -1
      else if (av > bv) cmp = 1
      if (cmp !== 0) return dir === 'desc' ? -cmp : cmp
    }
    return 0
  })
}

// --- Model delegate --------------------------------------------------------

class ModelDelegate {
  constructor(private model: string) {}

  private collection(): AnyRecord[] {
    return store[this.model] || (store[this.model] = [])
  }

  async findMany(args?: AnyRecord): Promise<AnyRecord[]> {
    let records = this.collection().filter(r => matchWhere(r, args?.where))
    records = sortRecords(records, args?.orderBy)
    if (args?.skip !== undefined) records = records.slice(args.skip)
    if (args?.take !== undefined) {
      records = args.take >= 0 ? records.slice(0, args.take) : records.slice(args.take)
    }
    return records.map(r => {
      let out = r
      if (args?.include) out = applyInclude(r, args.include)
      else if (args?.select) out = applySelect(r, args.select)
      else out = { ...r }
      return out
    })
  }

  async findUnique(args: AnyRecord): Promise<AnyRecord | null> {
    const where = args?.where || {}
    const record = this.collection().find(r => {
      if (where.id !== undefined) return r.id === where.id
      // Try other unique fields
      for (const [k, v] of Object.entries(where)) {
        if (r[k] === v) return true
      }
      return false
    })
    if (!record) return null
    if (args?.include) return applyInclude(record, args.include)
    if (args?.select) return applySelect(record, args.select)
    return { ...record }
  }

  async count(args?: AnyRecord): Promise<number> {
    return this.collection().filter(r => matchWhere(r, args?.where)).length
  }

  async create(args: AnyRecord): Promise<AnyRecord> {
    const data = { ...args.data }
    if (!data.id) data.id = genId(this.model)
    if (!data.createdAt && (this.model !== 'appSettings' && this.model !== 'admin')) data.createdAt = new Date()
    if (!data.updatedAt && ['user', 'lead', 'prospectionCampaign', 'preference', 'admin', 'appSettings'].includes(this.model)) {
      data.updatedAt = new Date()
    }
    // Apply defaults for missing fields
    const defaults: Record<string, AnyRecord> = {
      user: { plan: 'free', credits: 5, onboarded: false },
      lead: { source: 'maps', stage: 'nouveau', contactCount: 0, score: 50 },
      notification: { type: 'new_leads', read: false },
      prospectionCampaign: { status: 'active', leadsFound: 0 },
      contactHistory: { aiGenerated: false },
      admin: { role: 'admin' },
    }
    if (defaults[this.model]) {
      for (const [k, v] of Object.entries(defaults[this.model])) {
        if (data[k] === undefined) data[k] = v
      }
    }
    this.collection().push(data)
    if (args?.include) return applyInclude(data, args.include)
    if (args?.select) return applySelect(data, args.select)
    return { ...data }
  }

  async update(args: AnyRecord): Promise<AnyRecord> {
    const where = args?.where || {}
    const record = this.collection().find(r => {
      if (where.id !== undefined) return r.id === where.id
      for (const [k, v] of Object.entries(where)) if (r[k] === v) return true
      return false
    })
    if (!record) throw new Error(`Record not found in ${this.model}`)
    const data = args.data || {}
    for (const [k, v] of Object.entries(data)) {
      if (v && typeof v === 'object' && 'increment' in v) {
        record[k] = (record[k] || 0) + v.increment
      } else {
        record[k] = v
      }
    }
    if (['user', 'lead', 'prospectionCampaign', 'preference', 'admin', 'appSettings'].includes(this.model)) {
      record.updatedAt = new Date()
    }
    if (args?.include) return applyInclude(record, args.include)
    if (args?.select) return applySelect(record, args.select)
    return { ...record }
  }

  async updateMany(args: AnyRecord): Promise<{ count: number }> {
    const matches = this.collection().filter(r => matchWhere(r, args?.where))
    const data = args.data || {}
    matches.forEach(record => {
      for (const [k, v] of Object.entries(data)) {
        if (v && typeof v === 'object' && 'increment' in v) {
          record[k] = (record[k] || 0) + v.increment
        } else {
          record[k] = v
        }
      }
    })
    return { count: matches.length }
  }

  async delete(args: AnyRecord): Promise<AnyRecord> {
    const where = args?.where || {}
    const arr = this.collection()
    const idx = arr.findIndex(r => {
      if (where.id !== undefined) return r.id === where.id
      for (const [k, v] of Object.entries(where)) if (r[k] === v) return true
      return false
    })
    if (idx === -1) throw new Error(`Record not found in ${this.model}`)
    const [removed] = arr.splice(idx, 1)
    return { ...removed }
  }

  async deleteMany(args: AnyRecord): Promise<{ count: number }> {
    const arr = this.collection()
    const matches = arr.filter(r => matchWhere(r, args?.where))
    const ids = new Set(matches.map(m => m.id))
    store[this.model] = arr.filter(r => !ids.has(r.id))
    return { count: matches.length }
  }

  async upsert(args: AnyRecord): Promise<AnyRecord> {
    const where = args?.where || {}
    const existing = this.collection().find(r => {
      if (where.id !== undefined) return r.id === where.id
      for (const [k, v] of Object.entries(where)) if (r[k] === v) return true
      return false
    })
    if (existing) {
      const data = args.update?.data || {}
      for (const [k, v] of Object.entries(data)) {
        if (v && typeof v === 'object' && 'increment' in v) {
          existing[k] = (existing[k] || 0) + v.increment
        } else {
          existing[k] = v
        }
      }
      existing.updatedAt = new Date()
      return { ...existing }
    }
    return this.create({ data: args.create?.data || {} })
  }
}

// --- Mock client -----------------------------------------------------------

export const mockDb = {
  user: new ModelDelegate('user'),
  lead: new ModelDelegate('lead'),
  contactHistory: new ModelDelegate('contactHistory'),
  prospectionCampaign: new ModelDelegate('prospectionCampaign'),
  notification: new ModelDelegate('notification'),
  auditLog: new ModelDelegate('auditLog'),
  appSettings: new ModelDelegate('appSettings'),
  preference: new ModelDelegate('preference'),
  admin: new ModelDelegate('admin'),
  $disconnect: async () => {},
}

export type MockDb = typeof mockDb
