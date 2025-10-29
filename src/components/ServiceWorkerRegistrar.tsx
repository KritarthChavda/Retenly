'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const registerServiceWorker = () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
          console.log('Service Worker registered with scope:', registration.scope);
        }).catch(error => {
          console.error('Service Worker registration failed:', error);
        });
      };

      if (document.readyState === 'complete') {
        registerServiceWorker();
      } else {
        window.addEventListener('load', registerServiceWorker);
      }
    }
  }, []);

  return null
}
