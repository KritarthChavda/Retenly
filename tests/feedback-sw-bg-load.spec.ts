// npx playwright test tests/feedback-sw-bg-load.spec.ts \
//   --project="Desktop Chrome BGSync" \
//   --workers=10 \
//   --reporter=html

// tests/feedback-sw-bg-load.spec.ts
import { test } from '@playwright/test'
import { runFeedbackScenario } from './utils/runFeedbackScenario'

// How many "users" you want to simulate in parallel with Playwright
const USERS = 50

// Run tests in parallel mode (each test can run in its own worker)
test.describe.configure({ mode: 'parallel' })

for (let i = 0; i < USERS; i++) {
  test(`BG Sync e2e user #${i}`, async ({ page }, testInfo) => {
    await runFeedbackScenario(page, testInfo)
  })
}
