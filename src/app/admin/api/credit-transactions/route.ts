import { NextResponse } from 'next/server'
import { getAllTransactions } from '@/lib/credits-service'

/**
 * GET /admin/api/credit-transactions?limit=100&userId=...
 * Returns recent credit transactions across all users (or filtered by userId).
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '100')
    const userId = url.searchParams.get('userId') || undefined

    const transactions = await getAllTransactions({ limit, userId })
    return NextResponse.json({ transactions, count: transactions.length })
  } catch (error) {
    console.error('Credit transactions GET error:', error)
    return NextResponse.json({ transactions: [], count: 0 })
  }
}
