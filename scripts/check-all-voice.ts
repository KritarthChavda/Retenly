import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/index.js";

const prisma = new PrismaClient();

async function main() {
  const feedbacks = await prisma.feedback.findMany({
    where: { voiceRecordingUrl: { not: null } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      feedback: true,
      voiceRecordingUrl: true,
      voiceTranscript: true,
      createdAt: true
    }
  });
  console.log(`Found ${feedbacks.length} feedbacks with voice recordings:`);
  console.log(JSON.stringify(feedbacks, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
