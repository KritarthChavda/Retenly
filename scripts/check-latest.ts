import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/index.js";

const prisma = new PrismaClient();

async function main() {
  const feedbacks = await prisma.feedback.findMany({
    orderBy: { createdAt: "desc" },
    take: 3,
    select: {
      id: true,
      name: true,
      feedback: true,
      voiceRecordingUrl: true,
      voiceTranscript: true,
      createdAt: true
    }
  });
  console.log("Latest feedbacks in DB:");
  console.log(JSON.stringify(feedbacks, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
