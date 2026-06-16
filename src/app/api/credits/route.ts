import { NextResponse } from 'next/server'
import { getBalance, getTransactions, getAllRules, ensureDefaultCreditRules } from '@/lib/credits-service'
import { db, withDbFallback } from '@/lib/db'

/**
 * GET /api/credits?userId=...
 * Returns the user's current balance + recent transactions + all active rules
 * (so the UI can show "Combien coûte chaque action ?").
 *
 * If no userId is provided, defaults to the demo user +237600000000.
 */
export async function GET(request: Request) {
  try {
    // Seed default credit rules if not present
    await ensureDefaultCreditRules()

    const url = new URL(request.url)
    let userId = url.searchParams.get('userId')

    if (!userId) {
      const demoUser = await withDbFallback(
        (client) =>
          (client as any).user.upsert({
            where: { phone: '+237600000000' },
            update: {},
            create: { phone: '+237600000000', name: 'Utilisateur Demo', plan: 'starter', credits: 12, onboarded: true },
          }),
        null as any,
      )
      userId = demoUser?.id
    }

    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const [balance, transactions, rules] = await Promise.all([
      getBalance(userId),
      getTransactions(userId, { limit: 50 }),
      getAllRules(),
    ])

    return NextResponse.json({
      balance,
      transactions,
      rules: rules.filter((r) => r.enabled),
    })
  } catch (error) {
    console.error('Credits GET error:', error)
    return NextResponse.json({ balance: 0, transactions: [], rules: [] })
  }
}
