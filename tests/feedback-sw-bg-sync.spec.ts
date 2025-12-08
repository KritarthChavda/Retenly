// tests/feedback-sw-bg-sync.spec.ts
// npx playwright test tests/feedback-sw-bg-sync.spec.ts --reporter=html
import { test } from '@playwright/test'
import { runFeedbackScenario } from './utils/runFeedbackScenario'

test('single user BG Sync + DB', async ({ page }, testInfo) => {
  await runFeedbackScenario(page, testInfo)
})
