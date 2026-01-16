'use client'

import { useEffect, useRef, useState } from 'react'
import { Play, Pause, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface VoiceRecordingPlayerProps {
  src: string
  className?: string
}

type BrowserAudioContext = AudioContext & { suspend?: () => Promise<void>; resume?: () => Promise<void> }

export function VoiceRecordingPlayer({ src, className }: VoiceRecordingPlayerProps) {
  const audioCtxRef = useRef<BrowserAudioContext | null>(null)
  const bufferRef = useRef<AudioBuffer | null>(null)
  const sourceRef = useRef<AudioBufferSourceNode | null>(null)
  const rafRef = useRef<number | null>(null)
  const startTimeRef = useRef(0)
  const offsetRef = useRef(0)

  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [hasError, setHasError] = useState(false)

  const stopProgressLoop = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }

  const updateProgress = () => {
    const audioCtx = audioCtxRef.current
    if (!audioCtx || !isPlaying) return
    const elapsed = audioCtx.currentTime - startTimeRef.current
    const newTime = Math.min(offsetRef.current + elapsed, duration || Infinity)
    setCurrentTime(Number.isFinite(newTime) ? newTime : 0)
    rafRef.current = requestAnimationFrame(updateProgress)
  }

  const cleanupSource = () => {
    if (sourceRef.current) {
      sourceRef.current.onended = null
      try {
        sourceRef.current.stop()
      } catch (error) {
        // ignore
      }
      sourceRef.current.disconnect()
      sourceRef.current = null
    }
    stopProgressLoop()
  }

  const resetState = () => {
    cleanupSource()
    offsetRef.current = 0
    startTimeRef.current = 0
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    setIsLoading(false)
    setHasError(false)
  }

  const fetchAndDecode = async (audioCtx: BrowserAudioContext) => {
    const response = await fetch(src)
    if (!response.ok) {
      throw new Error('Failed to fetch audio')
    }
    const arrayBuffer = await response.arrayBuffer()
    return await audioCtx.decodeAudioData(arrayBuffer)
  }

  const ensureAudioContext = () => {
    if (audioCtxRef.current) return audioCtxRef.current
    const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextCtor) {
      throw new Error('AudioContext is not supported in this browser')
    }
    const ctx = new AudioContextCtor()
    audioCtxRef.current = ctx
    return ctx
  }

  const startPlayback = async () => {
    try {
      setIsLoading(true)
      setHasError(false)

      const audioCtx = ensureAudioContext()
      await audioCtx.resume()

      if (!bufferRef.current) {
        bufferRef.current = await fetchAndDecode(audioCtx)
        setDuration(bufferRef.current.duration)
      }

      cleanupSource()

      const source = audioCtx.createBufferSource()
      source.buffer = bufferRef.current
      source.connect(audioCtx.destination)
      source.onended = () => {
        if (offsetRef.current + (audioCtx.currentTime - startTimeRef.current) >= (bufferRef.current?.duration || 0) - 0.05) {
          offsetRef.current = 0
          setCurrentTime(0)
          setIsPlaying(false)
        }
        cleanupSource()
      }

      sourceRef.current = source
      startTimeRef.current = audioCtx.currentTime
      const offset = Math.min(offsetRef.current, Math.max((bufferRef.current?.duration || 0) - 0.01, 0))
      source.start(0, offset)
      setCurrentTime(offset)
      setIsPlaying(true)
      setIsLoading(false)
      rafRef.current = requestAnimationFrame(updateProgress)
    } catch (error) {
      console.error('Failed to start playback:', error)
      setHasError(true)
      resetState()
    }
  }

  const pausePlayback = () => {
    const audioCtx = audioCtxRef.current
    if (!audioCtx) return
    const elapsed = audioCtx.currentTime - startTimeRef.current
    offsetRef.current = Math.min((bufferRef.current?.duration || 0), offsetRef.current + Math.max(elapsed, 0))
    cleanupSource()
    setIsPlaying(false)
  }

  const togglePlayPause = () => {
    if (isLoading) return

    if (hasError) {
      window.open(src, '_blank', 'noopener')
      return
    }

    if (isPlaying) {
      pausePlayback()
    } else {
      startPlayback()
    }
  }

  useEffect(() => {
    resetState()
    bufferRef.current = null
    return () => {
      cleanupSource()
      if (audioCtxRef.current?.close) {
        audioCtxRef.current.close().catch(() => undefined)
      }
    }
  }, [src])

  const formatTime = (time: number) => {
    if (!Number.isFinite(time) || time < 0) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={togglePlayPause}
        className="h-8 w-8 p-0"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>
      <span className="text-xs text-muted-foreground">
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>
    </div>
  )
}
