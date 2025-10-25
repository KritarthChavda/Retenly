// scripts/backfill-topfeedback-windows.ts
import 'dotenv/config'
import { prisma } from '../src/lib/prisma'

function minusDays(d: Date, days: number) {
  const x = new Date(d)
  x.setDate(x.getDate() - days)
  return x
}

async function main() {
  const rows = await prisma.topFeedback.findMany({
    where: { window: null },
    select: { id: true, generatedAt: true, createdAt: true }
  })

  for (const r of rows) {
    const anchor = r.generatedAt ?? r.createdAt ?? new Date()
    const end = new Date(anchor)
    const start = minusDays(end, 30)

    await prisma.topFeedback.update({
      where: { id: r.id },
      data: {
        window: '_30d',
        windowStart: start,
        windowEnd: end
      }
    })
  }

  console.log(`Backfilled ${rows.length} rows.`)
}

main().finally(() => prisma.$disconnect())
