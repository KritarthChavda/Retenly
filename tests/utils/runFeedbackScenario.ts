// tests/utils/runFeedbackScenario.ts
import type { Page, TestInfo } from "@playwright/test";

const RESTAURANT_SLUG = "wok-on-fire";
const MAX_UI_MS = 10_000;
const MAX_DB_MS = 60_000;

export async function runFeedbackScenario(page: Page, testInfo: TestInfo) {
  const url = `/forms/${RESTAURANT_SLUG}?forceSync=1`;

  const unique = Date.now() % 100000; // always 5 digits
  const testPhone = `88888${unique.toString().padStart(5, "0")}`;
  const testName = `BGSync User ${unique}`;
  const testFeedback = `BGSync feedback ${unique}`;

  // 1) Load page (SW install etc.)
  await page.goto(url, { waitUntil: "networkidle" });

  // 2) Fill form
  await page.getByTestId("input-name").fill(testName);
  await page.getByTestId("input-phone").fill(testPhone);

  // ⚠️ keep this string matching your actual data-testid
  await page.getByTestId("input-experience-Pretty good").click();
  await page.getByTestId("input-feedback").fill(testFeedback);

  // 3) Submit and measure UI duration until thank-you
  const submitButton = page.getByTestId("feedback-submit-button");
  const t0 = Date.now();

  await submitButton.click();
  await page.getByTestId("thank-you-screen").waitFor({ timeout: MAX_UI_MS });

  const t1 = Date.now();
  const uiDuration = t1 - t0;

  console.log(
    JSON.stringify({
      kind: "ui_duration_bg",
      project: testInfo.project.name,
      ms: uiDuration,
    })
  );

  if (uiDuration > MAX_UI_MS) {
    throw new Error(`Thank-you UI took too long: ${uiDuration}ms`);
  }

  // 4) Confirm Background Sync path used
  const mode = await page.evaluate(
    () => (window as any).__feedbackLastSubmitMode
  );
  console.log("Submit mode:", mode);
  if (mode !== "background-sync") {
    throw new Error(`Expected background-sync mode, got ${mode}`);
  }

  // 5) Confirm sync tag is registered (if supported)
  const tags = await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    // @ts-ignore
    if (!reg.sync || !reg.sync.getTags) return [];
    // @ts-ignore
    return reg.sync.getTags();
  });

  console.log(
    JSON.stringify({
      kind: "bg_tags",
      project: testInfo.project.name,
      tags,
    })
  );

  if (
    Array.isArray(tags) &&
    tags.length > 0 &&
    !tags.includes("submit-feedback")
  ) {
    throw new Error(`submit-feedback tag not found in ${JSON.stringify(tags)}`);
  }

  // 6) Trigger SW processing via debug message
  await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    reg.active?.postMessage({ type: "DEBUG_PROCESS_PENDING" });
  });

  // 7) Poll DB until record appears
  const dbDeadline = Date.now() + MAX_DB_MS;
  let found = false;
  let lastPayload: any = null;

  while (Date.now() < dbDeadline && !found) {
    const res = await page.request.post("/api/test/get-feedback-by-phone", {
      data: { phoneNumber: testPhone },
    });

    if (!res.ok()) {
      throw new Error(`DB check API failed with status ${res.status()}`);
    }

    const json = await res.json();
    lastPayload = json;

    if (json.feedback) {
      found = true;
      break;
    }

    await page.waitForTimeout(2_000);
  }

  console.log(
    JSON.stringify({
      kind: "db_check_bg",
      project: testInfo.project.name,
      found,
      payload: lastPayload,
    })
  );

  if (!found) {
    throw new Error("Feedback not found in DB within timeout");
  }

  if (lastPayload?.feedback) {
    if (lastPayload.feedback.name !== testName) {
      throw new Error(
        `Name mismatch: expected ${testName}, got ${lastPayload.feedback.name}`
      );
    }
    if (!lastPayload.feedback.phoneNumber.endsWith(testPhone)) {
      throw new Error(
        `Phone mismatch: stored ${lastPayload.feedback.phoneNumber}, raw ${testPhone}`
      );
    }
  }
}
