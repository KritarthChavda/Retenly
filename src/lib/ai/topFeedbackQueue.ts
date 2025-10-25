import 'server-only'

import { prisma } from '@/lib/prisma'
import { regenerateTopFeedbackForRestaurant } from './topFeedback'

type Job = {
  restaurantId: string
}

class TopFeedbackQueue {
  private processing = false
  private queue: Job[] = []
  private pendingRestaurantIds = new Set<string>()

  enqueue(job: Job) {
    if (this.pendingRestaurantIds.has(job.restaurantId)) {
      return
    }

    this.queue.push(job)
    this.pendingRestaurantIds.add(job.restaurantId)
    void this.process()
  }

  private async process() {
    if (this.processing) {
      return
    }

    this.processing = true

    while (this.queue.length) {
      const job = this.queue.shift()!
      this.pendingRestaurantIds.delete(job.restaurantId)

      try {
        await regenerateTopFeedbackForRestaurant(job.restaurantId)
      } catch (error) {
        console.error('[TopFeedbackQueue] Failed to regenerate top feedback', {
          restaurantId: job.restaurantId,
          error
        })
      }
    }

    this.processing = false
  }
}

const globalQueue = globalThis as unknown as {
  __topFeedbackQueue?: TopFeedbackQueue
  __topFeedbackQueuePrimed?: boolean
}

if (!globalQueue.__topFeedbackQueue) {
  globalQueue.__topFeedbackQueue = new TopFeedbackQueue()
  if (!globalQueue.__topFeedbackQueuePrimed) {
    globalQueue.__topFeedbackQueuePrimed = true
    void primeTopFeedbackHighlights(globalQueue.__topFeedbackQueue)
  }
}

export const queueTopFeedbackRegeneration = async (restaurantId: string): Promise<void> => {
  globalQueue.__topFeedbackQueue!.enqueue({ restaurantId })
}

async function primeTopFeedbackHighlights(queue: TopFeedbackQueue) {
  try {
    const [restaurants, existing] = await Promise.all([
      prisma.restaurant.findMany({ select: { id: true } }),
      prisma.topFeedback.groupBy({
        by: ['restaurantId'],
        _count: { id: true }
      })
    ])

    const existingMap = new Map(existing.map((item) => [item.restaurantId, item._count.id]))

    restaurants.forEach(({ id }) => {
      if (!existingMap.get(id)) {
        queue.enqueue({ restaurantId: id })
      }
    })
  } catch (error) {
    console.error('[TopFeedbackQueue] Failed to prime highlights', error)
  }
}
