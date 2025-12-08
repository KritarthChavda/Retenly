import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  timeout: 120_000,
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    channel: 'chrome', // <— system Chrome
  },
  projects: [
    // Desktop Chromium family
    {
      name: 'Desktop Chrome BGSync',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
    {
      name: 'Desktop Edge BGSync',
      use: { ...devices['Desktop Edge'], channel: 'chrome' },
    },
    {
      name: 'Desktop Chrome HiDPI BGSync',
      use: { ...devices['Desktop Chrome HiDPI'], channel: 'chrome' },
    },

    // Pixel devices (Android Chrome)
    {
      name: 'Pixel 5 - Chrome BGSync',
      use: { ...devices['Pixel 5'], channel: 'chrome' },
    },
    {
      name: 'Pixel 7 - Chrome BGSync',
      use: { ...devices['Pixel 7'], channel: 'chrome' },
    },
    {
      name: 'Pixel 7 Pro - Chrome BGSync',
      use: { ...devices['Pixel 7 Pro'], channel: 'chrome' },
    },

    // Samsung Galaxy devices
    {
      name: 'Galaxy S9+ - Chrome BGSync',
      use: { ...devices['Galaxy S9+'], channel: 'chrome' },
    },
    {
      name: 'Galaxy S20 Ultra - Chrome BGSync',
      use: { ...devices['Galaxy S20 Ultra'], channel: 'chrome' },
    },
    {
      name: 'Galaxy Note 10 - Chrome BGSync',
      use: { ...devices['Galaxy Note 10'], channel: 'chrome' },
    },

    // Other Android-like devices
    {
      name: 'Moto G4 - Chrome BGSync',
      use: { ...devices['Moto G4'], channel: 'chrome' },
    },
    {
      name: 'Nexus 5X - Chrome BGSync',
      use: { ...devices['Nexus 5X'], channel: 'chrome' },
    },
  ],
})
