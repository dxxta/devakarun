'use client'

import { useEffect, useRef, useState, type RefObject } from 'react'
import { CdnImage } from '@/components/portfolio/cdn-image'
import type { Media } from '@/payload-types'

type AvatarImage = Pick<Media, 'url' | 'width' | 'height' | 'alt'>

type GlitchAvatarProps = {
  primary: AvatarImage
  secondary: AvatarImage
  name: string
  cloudflare: boolean
  priority?: boolean
  sizes: string
  size?: string
  className?: string
}

type SourceCache = {
  key: string
  primary: HTMLCanvasElement
  secondary: HTMLCanvasElement
  width: number
  height: number
}

const TRANSITION_MS = 900
const GRID_COLUMNS = 14
const FLASH_BAND = 0.09
const COLORS = ['#d4f03c', '#d4f03c', '#d4f03c', '#d4f03c', '#d4f03c', '#d4f03c', '#d4f03c', '#000000', '#000000', '#ffffff']

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function easeInOutCubic(value: number) {
  return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2
}

function waitForImage(image: HTMLImageElement): Promise<boolean> {
  if (image.complete) return Promise.resolve(image.naturalWidth > 0)
  return new Promise((resolve) => {
    const finish = (loaded: boolean) => {
      image.removeEventListener('load', onLoad)
      image.removeEventListener('error', onError)
      resolve(loaded)
    }
    const onLoad = () => finish(image.naturalWidth > 0)
    const onError = () => finish(false)
    image.addEventListener('load', onLoad, { once: true })
    image.addEventListener('error', onError, { once: true })
  })
}

async function decodeImage(image: HTMLImageElement): Promise<boolean> {
  try {
    if (typeof image.decode === 'function') await image.decode()
    else if (!(await waitForImage(image))) return false
    return image.naturalWidth > 0
  } catch {
    return false
  }
}

function drawCoverCrop(context: CanvasRenderingContext2D, image: ImageBitmap, width: number, height: number) {
  // Bitmap size is the real pixel size; img.naturalWidth is divided by the srcset density on retina screens.
  const sourceWidth = image.width
  const sourceHeight = image.height
  const sourceAspect = sourceWidth / sourceHeight
  const targetAspect = width / height
  let sourceX = 0
  let sourceY = 0
  let cropWidth = sourceWidth
  let cropHeight = sourceHeight

  if (sourceAspect > targetAspect) {
    cropWidth = sourceHeight * targetAspect
    sourceX = (sourceWidth - cropWidth) / 2
  } else {
    cropHeight = sourceWidth / targetAspect
    sourceY = (sourceHeight - cropHeight) / 2
  }

  context.drawImage(image, sourceX, sourceY, cropWidth, cropHeight, 0, 0, width, height)
}

async function createSourceCanvas(element: HTMLImageElement, width: number, height: number) {
  const image = await createImageBitmap(element)
  const source = document.createElement('canvas')
  source.width = width
  source.height = height
  const context = source.getContext('2d')
  if (!context) throw new Error('Could not create avatar source canvas')
  context.imageSmoothingEnabled = true
  drawCoverCrop(context, image, width, height)
  image.close()
  return source
}

export function GlitchAvatar({ primary, secondary, name, cloudflare, priority = false, sizes, size, className }: GlitchAvatarProps) {
  const [showAlt, setShowAlt] = useState(false)
  const [animating, setAnimating] = useState(false)
  const [fallback, setFallback] = useState(false)
  const [animationRequest, setAnimationRequest] = useState<{ target: boolean; id: number } | null>(null)
  const primaryRef = useRef<HTMLImageElement>(null)
  const secondaryRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef<HTMLSpanElement>(null)
  const frameIDRef = useRef(0)
  const fallbackTimerRef = useRef<number | null>(null)
  const shownRef = useRef(false)
  const targetRef = useRef(false)
  const progressRef = useRef(0)
  const requestIDRef = useRef(0)
  const sourceCacheRef = useRef<SourceCache | null>(null)
  const lastPointerType = useRef<string | null>(null)

  useEffect(() => () => {
    cancelAnimationFrame(frameIDRef.current)
    if (fallbackTimerRef.current !== null) window.clearTimeout(fallbackTimerRef.current)
  }, [])

  useEffect(() => {
    const request = animationRequest
    if (!request || !animating) return
    const transitionTarget = request.target

    let cancelled = false
    let lastFrameAt = 0
    const canvas = canvasRef.current
    const frame = frameRef.current
    const primaryImage = primaryRef.current
    const secondaryImage = secondaryRef.current
    const finish = () => {
      const endProgress = transitionTarget ? 1 : 0
      progressRef.current = endProgress
      shownRef.current = transitionTarget
      targetRef.current = transitionTarget
      setShowAlt(transitionTarget)
      setAnimating(false)
      setFallback(false)
    }

    const useCSSFallback = () => {
      if (cancelled) return
      progressRef.current = transitionTarget ? 1 : 0
      shownRef.current = transitionTarget
      targetRef.current = transitionTarget
      setShowAlt(transitionTarget)
      setAnimating(false)
      setFallback(true)
      if (fallbackTimerRef.current !== null) window.clearTimeout(fallbackTimerRef.current)
      fallbackTimerRef.current = window.setTimeout(() => {
        fallbackTimerRef.current = null
        setFallback(false)
      }, TRANSITION_MS)
    }

    async function animate() {
      if (!canvas || !frame || !primaryImage || !secondaryImage) {
        useCSSFallback()
        return
      }

      const loaded = await Promise.all([decodeImage(primaryImage), decodeImage(secondaryImage)])
      if (cancelled) return
      if (!loaded.every(Boolean)) {
        useCSSFallback()
        return
      }

      try {
        const bounds = frame.getBoundingClientRect()
        const dpr = Math.max(1, window.devicePixelRatio || 1)
        const canvasWidth = Math.max(1, Math.round(bounds.width * dpr))
        const canvasHeight = Math.max(1, Math.round(bounds.height * dpr))
        const cacheKey = `${primaryImage.currentSrc || primaryImage.src}|${secondaryImage.currentSrc || secondaryImage.src}|${canvasWidth}x${canvasHeight}`
        let sources = sourceCacheRef.current
        if (!sources || sources.key !== cacheKey) {
          sources = {
            key: cacheKey,
            primary: await createSourceCanvas(primaryImage, canvasWidth, canvasHeight),
            secondary: await createSourceCanvas(secondaryImage, canvasWidth, canvasHeight),
            width: canvasWidth,
            height: canvasHeight,
          }
          sourceCacheRef.current = sources
        }

        if (canvas.width !== sources.width || canvas.height !== sources.height) {
          canvas.width = sources.width
          canvas.height = sources.height
        }
        const context = canvas.getContext('2d')
        if (!context) throw new Error('Could not create visible avatar canvas')
        const cell = Math.max(2, Math.ceil(sources.width / GRID_COLUMNS))
        const columns = Math.ceil(sources.width / cell)
        const rows = Math.ceil(sources.height / cell)
        const thresholds = Array.from({ length: columns * rows }, () => Math.random())
        const cellColors = Array.from({ length: columns * rows }, () => COLORS[Math.floor(Math.random() * COLORS.length)] ?? '#d4f03c')
        const direction = transitionTarget ? 1 : -1

        const drawFrame = (now: number) => {
          if (cancelled) return
          const delta = lastFrameAt ? now - lastFrameAt : 0
          lastFrameAt = now
          const progress = clamp(progressRef.current + (delta / TRANSITION_MS) * direction, 0, 1)
          progressRef.current = progress

          const eased = easeInOutCubic(progress)
          const reveal = eased * (1 + FLASH_BAND * 2) - FLASH_BAND
          context.imageSmoothingEnabled = false
          context.globalAlpha = 1
          for (let row = 0; row < rows; row += 1) {
            for (let column = 0; column < columns; column += 1) {
              const index = row * columns + column
              const threshold = thresholds[index] ?? 0
              const x = column * cell
              const y = row * cell
              const width = Math.min(cell, sources!.width - x)
              const height = Math.min(cell, sources!.height - y)
              const source = threshold < reveal ? sources!.secondary : sources!.primary
              context.drawImage(source, x, y, width, height, x, y, width, height)
              const distance = Math.abs(threshold - reveal)
              if (distance < FLASH_BAND && progress > 0 && progress < 1) {
                context.globalAlpha = 1 - distance / FLASH_BAND
                context.fillStyle = cellColors[index] ?? '#d4f03c'
                context.fillRect(x, y, width, height)
                context.globalAlpha = 1
              }
            }
          }

          if ((direction > 0 && progress >= 1) || (direction < 0 && progress <= 0)) {
            finish()
            return
          }
          frameIDRef.current = requestAnimationFrame(drawFrame)
        }

        frameIDRef.current = requestAnimationFrame(drawFrame)
      } catch {
        useCSSFallback()
      }
    }

    void animate()
    return () => {
      cancelled = true
      cancelAnimationFrame(frameIDRef.current)
    }
  }, [animationRequest, animating])

  function activate(next: boolean | ((current: boolean) => boolean)) {
    const nextValue = typeof next === 'function' ? next(targetRef.current) : next
    if (nextValue === targetRef.current && (animating || nextValue === shownRef.current)) return
    targetRef.current = nextValue
    requestIDRef.current += 1
    if (fallbackTimerRef.current !== null) {
      window.clearTimeout(fallbackTimerRef.current)
      fallbackTimerRef.current = null
    }

    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      progressRef.current = nextValue ? 1 : 0
      shownRef.current = nextValue
      setShowAlt(nextValue)
      setAnimating(false)
      setFallback(false)
      setAnimationRequest(null)
      return
    }

    if (nextValue === shownRef.current && !animating) return

    setFallback(false)
    setAnimating(true)
    setAnimationRequest({ target: nextValue, id: requestIDRef.current })
  }

  const imageProps = (media: AvatarImage, alt: string, className: string, imageRef: RefObject<HTMLImageElement | null>, isPriority = false) => ({
    alt,
    className,
    cloudflare,
    height: media.height ?? 900,
    loading: isPriority ? 'eager' as const : 'lazy' as const,
    priority: isPriority,
    sizes,
    src: media.url ?? '',
    width: media.width ?? 900,
    ref: imageRef,
    style: {
      height: '100%',
      objectFit: 'cover' as const,
      objectPosition: '50% 50%',
      transform: 'none',
      width: '100%',
    },
  })

  return (
    <div
      aria-label={`Show another photo of ${name}`}
      aria-pressed={showAlt}
      className={`glitch-card border-2 border-border ${size ?? ''} ${className ?? ''}`}
      data-pressable="card"
      data-fallback={fallback ? 'true' : 'false'}
      data-glitching={animating ? 'true' : 'false'}
      data-show-alt={showAlt ? 'true' : 'false'}
      onBlur={() => activate(false)}
      onClick={() => { if (lastPointerType.current === 'touch') activate((current) => !current) }}
      onFocus={() => { if (lastPointerType.current !== 'touch') activate(true) }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          activate((current) => !current)
        }
      }}
      onPointerDown={(event) => { lastPointerType.current = event.pointerType }}
      onPointerEnter={(event) => {
        lastPointerType.current = event.pointerType
        if (event.pointerType === 'mouse') activate(true)
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === 'mouse') activate(false)
      }}
      role="button"
      tabIndex={0}
    >
      <span className="glitch-frame" ref={frameRef}>
        <CdnImage {...imageProps(primary, name, 'glitch-layer glitch-layer--primary', primaryRef, priority)} />
        <CdnImage {...imageProps(secondary, secondary.alt || `${name} in another photo`, 'glitch-layer glitch-layer--secondary', secondaryRef, priority)} />
        {animating ? <canvas aria-hidden="true" className="glitch-canvas" ref={canvasRef} /> : null}
        {fallback ? (
          <span aria-hidden="true" className="glitch-fallback">
            <span className="glitch-fallback-block glitch-fallback-block--lime-1" />
            <span className="glitch-fallback-block glitch-fallback-block--lime-2" />
            <span className="glitch-fallback-block glitch-fallback-block--lime-3" />
            <span className="glitch-fallback-block glitch-fallback-block--lime-4" />
            <span className="glitch-fallback-block glitch-fallback-block--lime-5" />
            <span className="glitch-fallback-block glitch-fallback-block--lime-6" />
            <span className="glitch-fallback-block glitch-fallback-block--lime-7" />
            <span className="glitch-fallback-block glitch-fallback-block--black-1" />
            <span className="glitch-fallback-block glitch-fallback-block--black-2" />
            <span className="glitch-fallback-block glitch-fallback-block--white" />
          </span>
        ) : null}
      </span>
    </div>
  )
}
