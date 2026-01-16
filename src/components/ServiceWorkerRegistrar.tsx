'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      console.log('[SW] Service workers not supported in this browser')
      return
    }

    const registerServiceWorker = () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then(registration => {
          console.log('[SW] Registered with scope:', registration.scope)
          registration.update().catch(err => {
            console.warn('[SW] registration.update() failed:', err)
          })
        })
        .catch(error => {
          console.error('[SW] Registration failed:', error)
        })
    }

    // Register once immediately after hydration
    registerServiceWorker()

    const handleControllerChange = () => {
      if (document.body.dataset.reloading) return
      document.body.dataset.reloading = 'true'
      console.log('[SW] controllerchange → reloading page')
      window.location.reload()
    }

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
    }
  }, [])

  return null
}
