import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/index.js"

const prisma = new PrismaClient()

async function main() {
  const restaurants = await prisma.restaurant.findMany({
    select: { id: true, name: true }
  })

  for (const restaurant of restaurants) {
    const counts = await prisma.feedback.groupBy({
      by: ["sentiment"],
      where: {
        form: { restaurantId: restaurant.id }
      },
      _count: { id: true }
    })

    console.log(restaurant.name, restaurant.id, counts)
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
