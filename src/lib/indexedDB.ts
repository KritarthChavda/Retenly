const DB_NAME = 'voice-recordings-db';
const DB_VERSION = 2;
const STORE_NAME = 'pending-feedback';

function openDB() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };
    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

export async function addFeedback(
  id: string,
  slug: string,
  formData: any,
  audioBlob: Blob | null,
  fileName: string | null = null
) {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    // `fileName` is derived in the app (see lib/audio.ts) so the service worker
    // doesn't have to re-derive it from a blob whose type may be missing.
    const request = store.put({ id, slug, formData, audioBlob, fileName });
    request.onsuccess = () => {
      resolve();
    };
    request.onerror = (event) => {
      reject((event.target as IDBRequest).error);
    };
  });
}

export async function deleteFeedback(id: string) {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => {
      resolve();
    };
    request.onerror = (event) => {
      reject((event.target as IDBRequest).error);
    };
  });
}
