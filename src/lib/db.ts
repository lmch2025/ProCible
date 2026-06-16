import { PrismaClient } from '@prisma/client'
import { mockDb } from './mock-db'

/**
 * Database client with automatic fallback.
 *
 * - In local dev (DATABASE_URL points to a `file:` path and the file exists),
 *   we use the real Prisma + SQLite client.
 * - On Vercel / any read-only serverless environment where the SQLite file
 *   cannot be opened, we fall back to the in-memory mock implementation so
 *   the admin panel and APIs keep returning valid data instead of 500/503.
 *
 * The fallback also kicks in if the Prisma client itself throws on first call
 * (covers edge cases where the binary lib isn't shipped to the serverless
 * function). Once we've fallen back, we stay on the mock for the lifetime of
 * the process to avoid paying the retry cost on every request.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  prismaFailed: boolean | undefined
}

function isServerless(): boolean {
  if (process.env.VERCEL === '1') return true
  if (process.env.AWS_LAMBDA_FUNCTION_NAME) return true
  if (process.env.CF_PAGES) return true
  // Vercel sets this on all serverless functions
  if (typeof process.env.NOW_REGION !== 'undefined') return true
  return false
}

function isFileDatabase(): boolean {
  const url = process.env.DATABASE_URL || ''
  return url.startsWith('file:')
}

/** Use the mock when running on a serverless platform with a file: DB URL,
 *  because the SQLite file is neither present nor writable there. */
function shouldUseMock(): boolean {
  if (globalForPrisma.prismaFailed) return true
  if (isServerless() && isFileDatabase()) return true
  return false
}

let cachedMock: typeof mockDb | null = null
function getMock() {
  if (!cachedMock) cachedMock = mockDb
  return cachedMock
}

function getRealPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      log: process.env.NODE_ENV !== 'production' ? ['error', 'warn'] : ['error'],
    })
  }
  return globalForPrisma.prisma
}

/**
 * Public client. This is either a real PrismaClient or the in-memory mock.
 * Both expose the same model delegates used by the API routes.
 */
export const db: PrismaClient | typeof mockDb = shouldUseMock()
  ? getMock()
  : getRealPrisma()

/**
 * Wraps a DB operation so that any thrown error triggers a one-time
 * fallback to the mock client. Use this for read paths that must never
 * 500 — it returns the mock result instead of throwing.
 */
export async function withDbFallback<T>(
  fn: (client: PrismaClient | typeof mockDb) => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    if (globalForPrisma.prismaFailed) {
      return await fn(getMock())
    }
    return await fn(db)
  } catch (err) {
    console.error('[db] DB call failed, falling back to mock:', err)
    globalForPrisma.prismaFailed = true
    try {
      return await fn(getMock())
    } catch (e) {
      console.error('[db] Mock fallback also failed:', e)
      return fallback
    }
  }
}
