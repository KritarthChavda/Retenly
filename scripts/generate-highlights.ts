// scripts/cron-generate-highlights.ts
// TO RUN ONCE: RUN_ONCE=1 npx tsx scripts/generate-highlights.ts
//  OTHERWISE FOR SERVER CRON JOB SETUP REQUIRED

import "dotenv/config"
import cron from "node-cron"
import { prisma } from "../src/lib/prisma"
import { generateAllWindowsForAllRestaurants } from "../src/lib/ai/topFeedback"

async function runOnce() {
  await generateAllWindowsForAllRestaurants()
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
