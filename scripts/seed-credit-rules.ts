/**
 * One-off seed script: ensure all default credit rules exist in the local
 * SQLite dev DB. Run with: `npx tsx scripts/seed-credit-rules.ts`
 *
 * This is the manual equivalent of what `ensureDefaultCreditRules()` does at
 * runtime — useful for bringing a dev DB up to date immediately after a
 * schema/rules change, without waiting for the first /api/credits request.
 */
import { PrismaClient } from '@prisma/client'
import { DEFAULT_CREDIT_RULES } from '../src/lib/credits-service'

async function main() {
  const prisma = new PrismaClient()
  try {
    console.log('→ Checking existing rules...')
    const existing = await prisma.creditRule.findMany({ select: { action: true } })
    const existingActions = new Set(existing.map((r) => r.action))
    console.log(`  Found ${existingActions.size} existing rule(s):`, [...existingActions])

    let inserted = 0
    let updated = 0
    for (const rule of DEFAULT_CREDIT_RULES) {
      if (existingActions.has(rule.action)) {
        // Update label/description to match the latest defaults (cost + freeQuota
        // are left alone to preserve admin overrides).
        const r = await prisma.creditRule.update({
          where: { action: rule.action },
          data: {
            label: rule.label,
            description: rule.description,
          },
        })
        console.log(`  ↻ updated  ${r.action}  (cost=${r.cost}, free/day=${r.freeQuotaPerDay})`)
        updated++
      } else {
        const r = await prisma.creditRule.create({ data: rule })
        console.log(`  + inserted ${r.action}  (cost=${r.cost}, free/day=${r.freeQuotaPerDay})`)
        inserted++
      }
    }

    console.log(`\n✓ Done. Inserted ${inserted} new rule(s), updated ${updated} existing rule(s).`)
    const allRules = await prisma.creditRule.findMany({ orderBy: { action: 'asc' } })
    console.log(`\nFinal state — ${allRules.length} rules:`)
    for (const r of allRules) {
      console.log(`  • ${r.action.padEnd(28)}  cost=${r.cost}  free/day=${r.freeQuotaPerDay}  enabled=${r.enabled}`)
    }
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
