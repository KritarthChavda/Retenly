// src/lib/audio.ts
//
// Single source of truth for the audio container we record and the filename we
// upload it as. `public/sw.js` cannot import from src/, so it reads the
// `fileName` we persist alongside the blob in IndexedDB and only falls back to
// its own copy of `extensionForAudioType` for records written by older clients.

/** Containers we ask MediaRecorder for, best first. iOS Safari only supports audio/mp4. */
const PREFERRED_AUDIO_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
]

/**
 * Pick a container MediaRecorder actually supports.
 *
 * Passing this to the constructor matters: `MediaRecorder.mimeType` is an empty
 * string until the recorder has been started (and on some builds until the first
 * chunk lands), so reading it right after construction yields "". A Blob stamped
 * with an empty type is rejected by /api/voice-upload.
 */
export function pickRecorderMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    return undefined
  }
  return PREFERRED_AUDIO_MIME_TYPES.find(type => MediaRecorder.isTypeSupported(type))
}

/** Map a recorded MIME type to the file extension we upload it under. */
export function extensionForAudioType(mimeType: string | undefined | null): string {
  const type = (mimeType || '').toLowerCase()
  if (type.includes('mp4') || type.includes('m4a') || type.includes('aac')) return 'mp4'
  if (type.includes('ogg')) return 'ogg'
  if (type.includes('wav')) return 'wav'
  if (type.includes('mpeg') || type.includes('mp3')) return 'mp3'
  return 'webm'
}

/** Filename for the voice recording upload, e.g. "voice-recording.mp4". */
export function voiceRecordingFileName(mimeType: string | undefined | null): string {
  return `voice-recording.${extensionForAudioType(mimeType)}`
}
