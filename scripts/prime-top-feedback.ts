import "dotenv/config"
import { prisma } from "../src/lib/prisma.ts"
import { regenerateTopFeedbackForRestaurant } from "../src/lib/ai/topFeedback.ts"

async function main() {
  const restaurants = await prisma.restaurant.findMany({
    select: { id: true, name: true }
  })

  console.log(`Found ${restaurants.length} restaurants. Checking highlights...`)

  for (const restaurant of restaurants) {
    const highlightsCount = await prisma.topFeedback.count({
      where: { restaurantId: restaurant.id }
    })

    if (highlightsCount === 0) {
      console.log(`Generating highlights for ${restaurant.name} (${restaurant.id})`)
      try {
        await regenerateTopFeedbackForRestaurant(restaurant.id)
        console.log("✔ Generated")
      } catch (error) {
        console.error(`✖ Failed for ${restaurant.name}`, error)
      }
    } else {
      console.log(`Skipping ${restaurant.name}, ${highlightsCount} highlight rows exist`)
    }
  }
}

main()
  .catch((error) => {
    console.error("Encountered an error while priming top feedback:", error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
