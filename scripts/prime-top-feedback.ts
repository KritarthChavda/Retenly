import "dotenv/config"
import { prisma } from "../src/lib/prisma"
import { regenerateTopFeedbackForRestaurant } from "../src/lib/ai/topFeedback"

async function main() {
  const restaurants = await prisma.restaurant.findMany({
    select: { id: true, name: true }
  })

  console.log(`Found ${restaurants.length} restaurants. Checking highlights...`)

  for (const restaurant of restaurants) {
    const totalFeedback = await prisma.feedback.count({
      where: { form: { restaurantId: restaurant.id } }
    })

    const existingCount = await prisma.topFeedback.count({
      where: { restaurantId: restaurant.id }
    })

    console.log(
      `Regenerating highlights for ${restaurant.name} (${restaurant.id}) — feedback rows: ${totalFeedback}, existing highlights: ${existingCount}`
    )

    try {
      const result = await regenerateTopFeedbackForRestaurant(restaurant.id)
      if (result) {
        const positiveCount = result.positive.length
        const negativeCount = result.negative.length
        console.log(`✔ Regenerated (${positiveCount} positive, ${negativeCount} negative)`)

        if (positiveCount !== 3 || negativeCount !== 3) {
          console.warn(
            `⚠️ Expected 3 highlights per sentiment but received ${positiveCount} positive and ${negativeCount} negative`
          )
        }
      } else {
        console.log("ℹ No feedback available to regenerate highlights")
      }
    } catch (error) {
      console.error(`✖ Failed for ${restaurant.name}`, error)
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
