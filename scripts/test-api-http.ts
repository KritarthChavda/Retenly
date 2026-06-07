import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/index.js";

const prisma = new PrismaClient();

async function main() {
  // 1. Get a recent feedback that has a voice URL
  const feedback = await prisma.feedback.findFirst({
    where: { voiceRecordingUrl: { not: null } },
    orderBy: { createdAt: "desc" }
  });

  if (!feedback) {
    console.error("No feedback with voice URL found!");
    return;
  }

  // Clear voiceRecordingUrl in DB temporarily so it passes the "already uploaded" check
  await prisma.feedback.update({
    where: { id: feedback.id },
    data: { voiceRecordingUrl: null }
  });

  console.log(`Sending HTTP POST request to local dev server for feedback ID: ${feedback.id}`);

  // 2. Fetch the audio file
  const fileResponse = await fetch(feedback.voiceRecordingUrl!);
  const audioBlob = await fileResponse.blob();

  // 3. Construct FormData
  const formData = new FormData();
  formData.append("file", audioBlob, "voice-recording.webm");
  formData.append("feedbackId", feedback.id);

  // 4. Send HTTP request to local server
  try {
    const res = await fetch("http://localhost:3000/api/voice-upload", {
      method: "POST",
      body: formData
    });
    const resBody = await res.json();
    console.log("HTTP Response Status:", res.status);
    console.log("HTTP Response Body:", resBody);
  } catch (err) {
    console.error("HTTP Request failed:", err);
  } finally {
    // Restore the voiceRecordingUrl
    await prisma.feedback.update({
      where: { id: feedback.id },
      data: { voiceRecordingUrl: feedback.voiceRecordingUrl }
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
