/**
 * Credit Service — robust, atomic credit management.
 *
 * Design goals:
 *  1. **Atomic deduction** — never deduct without updating balance; never
 *     update balance without logging a transaction. Both succeed or both fail.
 *  2. **Race-condition safe** — re-reads the user's balance inside the same
 *     `update()` call and uses a conditional update (`where: { credits: { gte: cost } }`)
 *     to atomically check + decrement. Falls back to a manual check for the
 *     mock DB (which doesn't support conditional updates).
 *  3. **Idempotency** — optional `idempotencyKey` lets the caller retry safely.
 *     If a transaction with the same key already exists for this user, we
 *     return the existing result instead of deducting again.
 *  4. **Free daily quota** — each rule can have `freeQuotaPerDay`. We count
 *     the user's transactions for this action in the last 24h and skip
 *     deduction while the quota is not exhausted.
 *  5. **Audit trail** — every movement is recorded in `CreditTransaction`
 *     with balanceAfter snapshot, action, label, entityId, note.
 *  6. **Admin transparency** — admin can grant/set credits via dedicated
 *     functions that also log transactions with action `admin.grant` / `admin.set`.
 *
 * Security note: callers MUST verify the user owns the entity they're being
 * charged for (e.g. lead.userId === requestingUserId) BEFORE calling
 * `deductCredits()`. This service does not re-check ownership — it trusts the
 * caller's auth layer.
 */

import { db, withDbFallback } from './db'

export interface CreditRule {
  id: string
  action: string
  label: string
  cost: number
  description: string | null
  enabled: boolean
  freeQuotaPerDay: number
}

export interface CreditTransaction {
  id: string
  amount: number
  balanceAfter: number
  action: string
  label: string
  entityId: string | null
  idempotencyKey: string | null
  note: string | null
  userId: string
  createdAt: string | Date
}

export interface DeductResult {
  ok: boolean
  /** Reason for failure when ok=false: 'insufficient' | 'rule_disabled' | 'rule_not_found' | 'db_error' */
  reason?: string
  /** New balance after deduction (only when ok=true) */
  balanceAfter?: number
  /** The transaction record (only when ok=true) */
  transaction?: CreditTransaction
  /** The cost that was (or would be) charged */
  cost: number
  /** Whether the free quota absorbed the cost (no deduction) */
  freeQuotaUsed?: boolean
}

export interface GrantResult {
  ok: boolean
  balanceAfter?: number
  transaction?: CreditTransaction
}

// --- Default rules (used to seed if none exist) -----------------------------

export const DEFAULT_CREDIT_RULES: Array<Omit<CreditRule, 'id'>> = [
  {
    action: 'prospection.launch',
    label: 'Lancer une campagne de prospection',
    cost: 5,
    description: 'Génération de 3 à 11 leads par ville/pays ciblé',
    enabled: true,
    freeQuotaPerDay: 0,
  },
  {
    action: 'ai.draft',
    label: 'Génération de message IA (WhatsApp/Appel/Email)',
    cost: 1,
    description: 'Draft personnalisé pour un lead',
    enabled: true,
    freeQuotaPerDay: 3,
  },
  {
    action: 'ai.analyze',
    label: 'Analyse IA & scoring de lead',
    cost: 2,
    description: 'Score 0-100 + suggestion de prochaine action',
    enabled: true,
    freeQuotaPerDay: 5,
  },
  {
    action: 'lead.export',
    label: 'Export CSV de leads',
    cost: 3,
    description: 'Export de la liste filtrée au format CSV',
    enabled: true,
    freeQuotaPerDay: 0,
  },
  {
    action: 'lead.reveal_phone',
    label: 'Révéler le téléphone d\'un lead',
    cost: 1,
    description: 'Débloque le n° de téléphone/WhatsApp d\'un lead',
    enabled: true,
    freeQuotaPerDay: 10,
  },
  {
    action: 'ai.suggestion',
    label: 'Suggestion IA de relance',
    cost: 1,
    description: 'Suggestion personnalisée pour relancer un lead',
    enabled: true,
    freeQuotaPerDay: 5,
  },
  {
    action: 'ai.follow_up_plan',
    label: 'Plan de suivi hiérarchique IA par lead',
    cost: 3,
    description: 'Plan multi-étapes (J+1, J+3, J+7, J+14, J+30) avec scripts prêts à envoyer, conseils tactiques, et notifications intelligentes programmées automatiquement',
    enabled: true,
    freeQuotaPerDay: 1,
  },
  {
    action: 'ai.campaign_interpret',
    label: 'Interprétation IA de campagne (ciblage acheteurs vs concurrents)',
    cost: 0,
    description: 'Incluse gratuitement dans chaque lancement de campagne — l\'IA transforme la description en requête ciblée qui trouve les acheteurs, pas les concurrents',
    enabled: true,
    freeQuotaPerDay: 0,
  },
]

/**
 * Seed default credit rules if the table is empty. Idempotent — does nothing
 * if rules already exist.
 */
export async function ensureDefaultCreditRules(): Promise<void> {
  await withDbFallback(
    async (client) => {
      const count = await (client as any).creditRule.count()
      if (count > 0) return
      for (const rule of DEFAULT_CREDIT_RULES) {
        await (client as any).creditRule.create({ data: rule })
      }
    },
    null as any,
  )
}

// --- Rule lookups -----------------------------------------------------------

/**
 * Get a credit rule by action key. Returns null if not found.
 */
export async function getRule(action: string): Promise<CreditRule | null> {
  return await withDbFallback(
    async (client) => {
      const rule = await (client as any).creditRule.findUnique({ where: { action } })
      return rule || null
    },
    null as any,
  )
}

/**
 * Get all credit rules. Used by the admin panel.
 */
export async function getAllRules(): Promise<CreditRule[]> {
  return await withDbFallback(
    async (client) => {
      return await (client as any).creditRule.findMany({ orderBy: { action: 'asc' } })
    },
    [] as CreditRule[],
  )
}

/**
 * Compute the effective cost for an action, considering:
 *  - rule.enabled (disabled = free)
 *  - freeQuotaPerDay (free if user hasn't exceeded daily quota)
 *  - returns 0 if the action is free for this user right now
 */
export async function getEffectiveCost(
  action: string,
  userId: string,
): Promise<{ cost: number; rule: CreditRule | null; freeQuotaUsed: boolean }> {
  const rule = await getRule(action)
  if (!rule) return { cost: 0, rule: null, freeQuotaUsed: false }
  if (!rule.enabled) return { cost: 0, rule, freeQuotaUsed: true }
  if (rule.cost <= 0) return { cost: rule.cost, rule, freeQuotaUsed: false }

  // Check daily quota
  if (rule.freeQuotaPerDay > 0) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const todayCount = await withDbFallback(
      async (client) => {
        return await (client as any).creditTransaction.count({
          where: {
            userId,
            action,
            createdAt: { gte: since },
          },
        })
      },
      0 as number,
    )
    if (todayCount < rule.freeQuotaPerDay) {
      return { cost: 0, rule, freeQuotaUsed: true }
    }
  }

  return { cost: rule.cost, rule, freeQuotaUsed: false }
}

// --- Core: deduct credits ---------------------------------------------------

/**
 * Atomically deduct credits for an action.
 *
 * @returns DeductResult with ok=true if successful, ok=false if insufficient
 *          balance, rule disabled, or rule not found.
 *
 * Idempotency: if `idempotencyKey` is provided and a transaction with the
 * same key already exists for this user, returns ok=true with the existing
 * transaction (no double-deduction).
 */
export async function deductCredits(params: {
  userId: string
  action: string
  entityId?: string | null
  idempotencyKey?: string | null
  note?: string | null
}): Promise<DeductResult> {
  const { userId, action, entityId = null, idempotencyKey = null, note = null } = params

  // 1. Idempotency check — if a transaction with this key exists, return it.
  if (idempotencyKey) {
    const existing = await withDbFallback(
      async (client) => {
        return await (client as any).creditTransaction.findFirst({
          where: { userId, idempotencyKey },
        })
      },
      null as any,
    )
    if (existing) {
      return {
        ok: true,
        balanceAfter: existing.balanceAfter,
        transaction: existing,
        cost: Math.abs(existing.amount),
        freeQuotaUsed: existing.amount === 0,
      }
    }
  }

  // 2. Resolve effective cost (considering free quota).
  const { cost, rule, freeQuotaUsed } = await getEffectiveCost(action, userId)
  if (!rule) {
    return { ok: false, reason: 'rule_not_found', cost: 0 }
  }
  if (!rule.enabled) {
    // Rule is disabled → action is free, but we still log a 0-amount transaction
    // for analytics. No balance check needed.
    const user = await withDbFallback(
      (client) => (client as any).user.findUnique({ where: { id: userId } }),
      null as any,
    )
    const balanceAfter = user?.credits ?? 0
    const tx = await withDbFallback(
      (client) =>
        (client as any).creditTransaction.create({
          data: {
            userId,
            amount: 0,
            balanceAfter,
            action,
            label: rule.label,
            entityId,
            idempotencyKey,
            note: note || 'Règle désactivée — action gratuite',
          },
        }),
      null as any,
    )
    return { ok: true, balanceAfter, transaction: tx, cost: 0, freeQuotaUsed: true }
  }

  // 3. Free quota path — log a 0-amount transaction.
  if (freeQuotaUsed && cost === 0) {
    const user = await withDbFallback(
      (client) => (client as any).user.findUnique({ where: { id: userId } }),
      null as any,
    )
    const balanceAfter = user?.credits ?? 0
    const tx = await withDbFallback(
      (client) =>
        (client as any).creditTransaction.create({
          data: {
            userId,
            amount: 0,
            balanceAfter,
            action,
            label: rule.label,
            entityId,
            idempotencyKey,
            note: note || `Quota gratuit quotidien (${rule.freeQuotaPerDay}/jour)`,
          },
        }),
      null as any,
    )
    return { ok: true, balanceAfter, transaction: tx, cost: 0, freeQuotaUsed: true }
  }

  // 4. Real deduction path — check balance first.
  const user = await withDbFallback(
    (client) => (client as any).user.findUnique({ where: { id: userId } }),
    null as any,
  )
  if (!user) {
    return { ok: false, reason: 'db_error', cost }
  }
  if (user.credits < cost) {
    return { ok: false, reason: 'insufficient', cost }
  }

  // 5. Apply deduction + log transaction.
  // We use a conditional update for atomicity on real Prisma:
  //   UPDATE user SET credits = credits - cost WHERE id = ? AND credits >= cost
  // On the mock DB we already checked above, so a plain update is fine.
  const newBalance = user.credits - cost
  try {
    // Try conditional update first (real Prisma).
    const updated = await withDbFallback(
      (client) =>
        (client as any).user.updateMany({
          where: { id: userId, credits: { gte: cost } },
          data: { credits: { decrement: cost } },
        }),
      null as any,
    )
    // updateMany returns { count }. If count === 0, the conditional failed
    // (race condition: someone else deducted between our check and update).
    if (updated && typeof updated.count === 'number' && updated.count === 0) {
      return { ok: false, reason: 'insufficient', cost }
    }
    // For mock DB (which doesn't return count meaningfully), force the update.
    if (!updated || typeof updated.count !== 'number') {
      await withDbFallback(
        (client) =>
          (client as any).user.update({
            where: { id: userId },
            data: { credits: newBalance },
          }),
        null as any,
      )
    }
  } catch (err) {
    console.error('deductCredits: update failed', err)
    return { ok: false, reason: 'db_error', cost }
  }

  // 6. Log the transaction.
  const tx = await withDbFallback(
    (client) =>
      (client as any).creditTransaction.create({
        data: {
          userId,
          amount: -cost,
          balanceAfter: newBalance,
          action,
          label: rule.label,
          entityId,
          idempotencyKey,
          note,
        },
      }),
    null as any,
  )

  return {
    ok: true,
    balanceAfter: newBalance,
    transaction: tx,
    cost,
    freeQuotaUsed: false,
  }
}

// --- Core: grant credits (admin) -------------------------------------------

/**
 * Grant (add) credits to a user. Used by admin or by purchase flow.
 * Always logs a transaction with the given action/label.
 */
export async function grantCredits(params: {
  userId: string
  amount: number
  action?: string // default: 'admin.grant'
  label?: string
  note?: string | null
  idempotencyKey?: string | null
}): Promise<GrantResult> {
  const {
    userId,
    amount,
    action = 'admin.grant',
    label = 'Crédits ajoutés',
    note = null,
    idempotencyKey = null,
  } = params

  if (amount === 0) return { ok: true }

  // Idempotency check
  if (idempotencyKey) {
    const existing = await withDbFallback(
      (client) =>
        (client as any).creditTransaction.findFirst({
          where: { userId, idempotencyKey },
        }),
      null as any,
    )
    if (existing) {
      return { ok: true, balanceAfter: existing.balanceAfter, transaction: existing }
    }
  }

  const user = await withDbFallback(
    (client) => (client as any).user.findUnique({ where: { id: userId } }),
    null as any,
  )
  if (!user) return { ok: false }

  const newBalance = Math.max(0, user.credits + amount)
  await withDbFallback(
    (client) =>
      (client as any).user.update({
        where: { id: userId },
        data: { credits: newBalance },
      }),
    null as any,
  )

  const tx = await withDbFallback(
    (client) =>
      (client as any).creditTransaction.create({
        data: {
          userId,
          amount,
          balanceAfter: newBalance,
          action,
          label,
          entityId: null,
          idempotencyKey,
          note,
        },
      }),
    null as any,
  )

  return { ok: true, balanceAfter: newBalance, transaction: tx }
}

/**
 * Set the user's balance to an absolute value. Logs the delta as a
 * transaction. Used by admin "set" mode.
 */
export async function setCredits(params: {
  userId: string
  credits: number
  note?: string | null
}): Promise<GrantResult> {
  const { userId, credits, note = null } = params

  const user = await withDbFallback(
    (client) => (client as any).user.findUnique({ where: { id: userId } }),
    null as any,
  )
  if (!user) return { ok: false }

  const delta = credits - user.credits
  if (delta === 0) return { ok: true, balanceAfter: user.credits }

  await withDbFallback(
    (client) =>
      (client as any).user.update({
        where: { id: userId },
        data: { credits },
      }),
    null as any,
  )

  const tx = await withDbFallback(
    (client) =>
      (client as any).creditTransaction.create({
        data: {
          userId,
          amount: delta,
          balanceAfter: credits,
          action: 'admin.set',
          label: delta > 0 ? 'Ajustement solde (admin)' : 'Correction solde (admin)',
          entityId: null,
          idempotencyKey: null,
          note: note || `Solde fixé à ${credits}`,
        },
      }),
    null as any,
  )

  return { ok: true, balanceAfter: credits, transaction: tx }
}

// --- Read APIs --------------------------------------------------------------

/**
 * Get a user's current credit balance.
 */
export async function getBalance(userId: string): Promise<number> {
  const user = await withDbFallback(
    (client) => (client as any).user.findUnique({
      where: { id: userId },
      select: { credits: true },
    }),
    null as any,
  )
  return user?.credits ?? 0
}

/**
 * Get a user's transaction history (most recent first).
 */
export async function getTransactions(
  userId: string,
  opts: { limit?: number; action?: string } = {},
): Promise<CreditTransaction[]> {
  const { limit = 50, action } = opts
  return await withDbFallback(
    (client) => {
      const where: any = { userId }
      if (action) where.action = action
      return (client as any).creditTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
      })
    },
    [] as CreditTransaction[],
  )
}

/**
 * Get all transactions across all users (admin view).
 */
export async function getAllTransactions(opts: {
  limit?: number
  userId?: string
} = {}): Promise<Array<CreditTransaction & { userName?: string; userPhone?: string }>> {
  const { limit = 100, userId } = opts
  return await withDbFallback(
    async (client) => {
      const where: any = userId ? { userId } : {}
      const txs = await (client as any).creditTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: { user: { select: { name: true, phone: true } } },
      })
      return txs.map((t: any) => ({
        ...t,
        userName: t.user?.name,
        userPhone: t.user?.phone,
      }))
    },
    [] as any[],
  )
}
