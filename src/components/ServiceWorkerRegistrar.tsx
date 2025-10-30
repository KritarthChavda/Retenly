'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const registerServiceWorker = () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
          console.log('Service Worker registered with scope:', registration.scope);
          registration.update();
        }).catch(error => {
          console.error('Service Worker registration failed:', error);
        });
      };

      window.addEventListener('load', registerServiceWorker);

      const handleControllerChange = () => {
        if (document.body.dataset.reloading) return;
        document.body.dataset.reloading = 'true';
        window.location.reload();
      };

      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

      return () => {
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      };
    }
  }, []);

  return null;
}
