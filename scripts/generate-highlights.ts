// scripts/cron-generate-highlights.ts
// TO RUN ONCE: RUN_ONCE=1 npx tsx scripts/generate-highlights.ts
//  OTHERWISE FOR SERVER CRON JOB SETUP REQUIRED

import "dotenv/config"
import cron from "node-cron"
import { prisma } from "../src/lib/prisma"
import { generateWindowHighlights } from "../src/lib/ai/topFeedback" // export default as above

async function runOnce() {
  const restaurants = await prisma.restaurant.findMany({ select: { id: true, name: true } })
  for (const r of restaurants) {
    for (const w of ["7d","30d","90d"] as const) {
      console.log(`Generating ${w} highlights for ${r.name}`)
      await generateWindowHighlights(r.id, w)
    }
  }
}

if (process.env.RUN_ONCE === "1") {
  runOnce().finally(() => prisma.$disconnect())
} else {
  // every day at 2:10 AM
  cron.schedule("10 2 * * *", async () => {
    console.log("[cron] generating rolling-window highlights")
    await runOnce()
  })
}
