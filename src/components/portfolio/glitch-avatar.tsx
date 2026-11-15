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

type GlitchBlock = {
  x: number
  y: number
  width: number
  height: number
  shift: number
  color: string
}

const TRANSITION_MS = 900
const CROSSFADE_START = 0.46
const CROSSFADE_END = 0.54
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

function drawCoverCrop(context: CanvasRenderingContext2D, image: HTMLImageElement, width: number, height: number) {
  const sourceWidth = image.naturalWidth
  const sourceHeight = image.naturalHeight
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

function createSourceCanvas(image: HTMLImageElement, width: number, height: number) {
  const source = document.createElement('canvas')
  source.width = width
  source.height = height
  const context = source.getContext('2d')
  if (!context) throw new Error('Could not create avatar source canvas')
  context.imageSmoothingEnabled = true
  drawCoverCrop(context, image, width, height)
  return source
}

function randomBlocks(width: number, height: number): GlitchBlock[] {
  const count = 3 + Math.floor(Math.random() * 3)
  const blocks: GlitchBlock[] = []
  for (let index = 0; index < count; index += 1) {
    const blockWidth = 1 + Math.floor(Math.random() * Math.max(1, Math.min(4, Math.floor(width / 3))))
    const blockHeight = 1 + Math.floor(Math.random() * Math.max(1, Math.min(3, Math.floor(height / 4))))
    blocks.push({
      x: Math.floor(Math.random() * Math.max(1, width - blockWidth + 1)),
      y: Math.floor(Math.random() * Math.max(1, height - blockHeight + 1)),
      width: blockWidth,
      height: blockHeight,
      shift: (1 + Math.floor(Math.random() * 3)) * (Math.random() < 0.5 ? -1 : 1),
      color: COLORS[Math.floor(Math.random() * COLORS.length)] ?? '#d4f03c',
    })
  }
  return blocks
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
    let nextBlocksAt = 0
    let blocks: GlitchBlock[] = []
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
            primary: createSourceCanvas(primaryImage, canvasWidth, canvasHeight),
            secondary: createSourceCanvas(secondaryImage, canvasWidth, canvasHeight),
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
        const tinyCanvas = document.createElement('canvas')
        const tinyContext = tinyCanvas.getContext('2d')
        if (!tinyContext) throw new Error('Could not create pixel canvas')
        const direction = transitionTarget ? 1 : -1

        const drawFrame = (now: number) => {
          if (cancelled) return
          const delta = lastFrameAt ? now - lastFrameAt : 0
          lastFrameAt = now
          const progress = clamp(progressRef.current + (delta / TRANSITION_MS) * direction, 0, 1)
          progressRef.current = progress

          const pixelationProgress = progress <= 0.5
            ? easeInOutCubic(progress * 2)
            : easeInOutCubic((1 - progress) * 2)
          const maxBlock = Math.max(8, Math.round(Math.max(sources!.width, sources!.height) / 10))
          const blockSize = Math.max(1, Math.round(1 + (maxBlock - 1) * pixelationProgress))
          const tinyWidth = Math.max(1, Math.ceil(sources!.width / blockSize))
          const tinyHeight = Math.max(1, Math.ceil(sources!.height / blockSize))
          if (tinyCanvas.width !== tinyWidth || tinyCanvas.height !== tinyHeight) {
            tinyCanvas.width = tinyWidth
            tinyCanvas.height = tinyHeight
          }
          tinyContext.imageSmoothingEnabled = false
          tinyContext.clearRect(0, 0, tinyWidth, tinyHeight)

          const crossfade = clamp((progress - CROSSFADE_START) / (CROSSFADE_END - CROSSFADE_START), 0, 1)
          if (progress < CROSSFADE_START) {
            tinyContext.drawImage(sources!.primary, 0, 0, tinyWidth, tinyHeight)
          } else if (progress > CROSSFADE_END) {
            tinyContext.drawImage(sources!.secondary, 0, 0, tinyWidth, tinyHeight)
          } else {
            tinyContext.drawImage(sources!.primary, 0, 0, tinyWidth, tinyHeight)
            tinyContext.globalAlpha = crossfade
            tinyContext.drawImage(sources!.secondary, 0, 0, tinyWidth, tinyHeight)
            tinyContext.globalAlpha = 1
          }

          context.imageSmoothingEnabled = false
          context.globalAlpha = 1
          context.clearRect(0, 0, sources!.width, sources!.height)
          context.drawImage(tinyCanvas, 0, 0, sources!.width, sources!.height)

          if (pixelationProgress > 0.12) {
            if (now >= nextBlocksAt) {
              blocks = randomBlocks(tinyWidth, tinyHeight)
              nextBlocksAt = now + 80 + Math.random() * 40
            }
            const cellWidth = sources!.width / tinyWidth
            const cellHeight = sources!.height / tinyHeight
            const blockOpacity = 0.42 * pixelationProgress
            for (const block of blocks) {
              const sourceX = clamp(block.x - block.shift, 0, tinyWidth - block.width)
              const drawX = block.x * cellWidth
              const drawY = block.y * cellHeight
              const drawWidth = block.width * cellWidth
              const drawHeight = block.height * cellHeight
              context.globalAlpha = 1
              context.drawImage(tinyCanvas, sourceX, block.y, block.width, block.height, drawX, drawY, drawWidth, drawHeight)
              context.globalAlpha = blockOpacity
              context.fillStyle = block.color
              context.fillRect(drawX, drawY, drawWidth, drawHeight)
            }
            context.globalAlpha = 1
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
