const DB_NAME = 'voice-recordings-db';
const DB_VERSION = 1;
const STORE_NAME = 'recordings';

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

async function getOldestRecording() {
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

async function deleteRecording(id) {
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
  if (event.tag === 'voice-feedback-upload') {
    event.waitUntil(uploadVoiceRecording());
  }
});

async function uploadVoiceRecording() {
  const recording = await getOldestRecording();
  if (!recording) {
    return;
  }

  const { id, blob } = recording;
  const formData = new FormData();
  formData.append('file', blob, 'voice-recording.webm');
  formData.append('feedbackId', id);

  try {
    const response = await fetch('/api/voice-upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Server response not ok');
    }

    // If upload is successful, delete it from IndexedDB
    await deleteRecording(id);

    // Check for more recordings to upload
    const nextRecording = await getOldestRecording();
    if (nextRecording) {
      // If there are more recordings, request another sync
      self.registration.sync.register('voice-feedback-upload');
    }

  } catch (error) {
    console.error('Failed to upload voice recording:', error);
    // If it fails, the browser will automatically retry the sync later
    throw error;
  }
}
