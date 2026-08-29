self.addEventListener('install', (event) => {
  console.log('[SW] Install event')
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event')
  event.waitUntil(self.clients.claim())
})

const DB_NAME = 'voice-recordings-db'
const DB_VERSION = 2
const STORE_NAME = 'pending-feedback'

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }

    request.onsuccess = (event) => {
      resolve(event.target.result)
    }

    request.onerror = (event) => {
      console.error('[SW] openDB error:', event.target.error)
      reject(event.target.error)
    }
  })
}

async function getOldestPendingFeedback() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.openCursor()

    request.onsuccess = (event) => {
      const cursor = event.target.result
      if (cursor) {
        resolve(cursor.value)
      } else {
        resolve(null)
      }
    }

    request.onerror = (event) => {
      console.error('[SW] getOldestPendingFeedback error:', event.target.error)
      reject(event.target.error)
    }
  })
}

async function deletePendingFeedback(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.delete(id)

    request.onsuccess = () => {
      resolve()
    }

    request.onerror = (event) => {
      console.error('[SW] deletePendingFeedback error:', event.target.error)
      reject(event.target.error)
    }
  })
}

async function updatePendingFeedback(item) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.put(item)

    request.onsuccess = () => {
      resolve()
    }

    request.onerror = (event) => {
      console.error('[SW] updatePendingFeedback error:', event.target.error)
      reject(event.target.error)
    }
  })
}

self.addEventListener('sync', (event) => {
  console.log('[SW] sync event:', event.tag)
  if (event.tag === 'submit-feedback') {
    event.waitUntil(processPendingFeedback())
  }
})

/** Mirror of extensionForAudioType in src/lib/audio.ts (a SW cannot import from src/). */
function fallbackFileName(mimeType) {
  const type = (mimeType || '').toLowerCase()
  let ext = 'webm'
  if (type.includes('mp4') || type.includes('m4a') || type.includes('aac')) ext = 'mp4'
  else if (type.includes('ogg')) ext = 'ogg'
  else if (type.includes('wav')) ext = 'wav'
  else if (type.includes('mpeg') || type.includes('mp3')) ext = 'mp3'
  return 'voice-recording.' + ext
}

async function processSingleFeedback(item) {
  const { id, slug, formData, audioBlob } = item
  console.log('[SW] Processing feedback id:', id, 'slug:', slug)

  let feedbackId = item.feedbackId

  // 1. Submit feedback data if it hasn't been submitted yet
  if (!item.textSubmitted) {
    const feedbackResponse = await fetch(`/api/forms/${slug}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ answers: formData }),
    })

    if (!feedbackResponse.ok) {
      throw new Error('Failed to submit feedback data')
    }

    const feedbackResult = await feedbackResponse.json()
    feedbackId = feedbackResult.feedbackId
    console.log('[SW] Feedback data submitted. feedbackId:', feedbackId)

    // Save state back to IndexedDB before audio upload so we don't duplicate on retry
    item.feedbackId = feedbackId
    item.textSubmitted = true
    await updatePendingFeedback(item)
  } else {
    console.log('[SW] Text feedback already submitted. feedbackId:', feedbackId)
  }

  // 2. Upload audio if present
  if (audioBlob && feedbackId) {
    const uploadFormData = new FormData()
    // Prefer the filename the app derived (src/lib/audio.ts) and fall back to the
    // blob's own type for records queued by older clients.
    uploadFormData.append('file', audioBlob, item.fileName || fallbackFileName(audioBlob.type))
    uploadFormData.append('feedbackId', feedbackId)

    const uploadResponse = await fetch('/api/voice-upload', {
      method: 'POST',
      body: uploadFormData,
    })

    if (!uploadResponse.ok) {
      // A 4xx is permanent (bad file type, already uploaded, expired window).
      // Retrying it would fail forever and — because this queue is processed
      // oldest-first — block every later feedback on this device from ever being
      // submitted. The text feedback is already saved, so drop the audio and move on.
      if (uploadResponse.status >= 400 && uploadResponse.status < 500) {
        console.error(
          '[SW] Voice upload permanently rejected (' + uploadResponse.status + ') for feedbackId:',
          feedbackId,
          '- discarding audio so the queue is not blocked'
        )
      } else {
        throw new Error('Failed to upload voice recording: ' + uploadResponse.status)
      }
    } else {
      console.log('[SW] Voice recording uploaded for feedbackId:', feedbackId)
    }
  }

  // 3. Delete from IndexedDB
  await deletePendingFeedback(id)
  console.log('[SW] Deleted pending feedback id:', id)
}

async function processPendingFeedback() {
  try {
    let item = await getOldestPendingFeedback()
    if (!item) {
      console.log('[SW] No pending feedback to process')
      return
    }

    // optional: limit items per sync if you're paranoid about timeouts
    while (item) {
      await processSingleFeedback(item)
      item = await getOldestPendingFeedback()
    }

    console.log('[SW] Finished processing all pending feedback')
  } catch (error) {
    console.error('[SW] Background sync failed:', error)
    throw error // browser will retry later
  }
}
