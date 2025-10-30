self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

const DB_NAME = 'voice-recordings-db';
const DB_VERSION = 2;
const STORE_NAME = 'pending-feedback';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

async function getOldestPendingFeedback() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.openCursor();
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        resolve(cursor.value);
      } else {
        resolve(null);
      }
    };
    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

async function deletePendingFeedback(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => {
      resolve();
    };
    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

self.addEventListener('sync', (event) => {
  if (event.tag === 'submit-feedback') {
    event.waitUntil(processPendingFeedback());
  }
});

async function processPendingFeedback() {
  const pendingFeedback = await getOldestPendingFeedback();
  if (!pendingFeedback) {
    return;
  }

  const { id, slug, formData, audioBlob } = pendingFeedback;

  try {
    // Step 1: Submit the initial feedback data
    const feedbackResponse = await fetch(`/api/forms/${slug}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ answers: formData }),
    });

    if (!feedbackResponse.ok) {
      throw new Error('Failed to submit feedback data');
    }

    const feedbackResult = await feedbackResponse.json();
    const feedbackId = feedbackResult.feedbackId;

    // Step 2: If there's an audio blob, upload it
    if (audioBlob && feedbackId) {
      const uploadFormData = new FormData();
      uploadFormData.append('file', audioBlob, 'voice-recording.webm');
      uploadFormData.append('feedbackId', feedbackId);

      const uploadResponse = await fetch('/api/voice-upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload voice recording');
      }
    }

    // If all successful, delete the pending record from IndexedDB
    await deletePendingFeedback(id);

    // Check if there are more items to sync
    const nextItem = await getOldestPendingFeedback();
    if (nextItem) {
      self.registration.sync.register('submit-feedback');
    }

  } catch (error) {
    console.error('Background sync failed:', error);
    // The browser will automatically retry later
    throw error;
  }
}
