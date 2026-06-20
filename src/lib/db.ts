import { PrismaClient } from '@prisma/client'

// ─────────────────────────────────────────────────────────────────────────────
// Singleton Prisma client.
// - On Vercel (serverless), each function invocation may run in a fresh process;
//   re-using a cached client on `globalThis` prevents connection-pool exhaustion
//   during hot reloads and across invocations within the same lambda container.
// - We deliberately DO NOT hard-code a fallback DATABASE_URL — a missing URL
//   should fail loudly so deployers see the error immediately.
// ─────────────────────────────────────────────────────────────────────────────

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'production'
        ? ['error', 'warn']
        : ['query', 'error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
