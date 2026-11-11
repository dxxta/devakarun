'use client'

type ConfettiOrigin = { x: number; y: number }
type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  rotation: number
  rotationSpeed: number
  color: string
}

let activeCanvas: HTMLCanvasElement | null = null
let animationFrame: number | null = null

export function fireConfetti(origin?: ConfettiOrigin) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  if (animationFrame !== null) window.cancelAnimationFrame(animationFrame)
  activeCanvas?.remove()

  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (!context) return

  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
  const width = window.innerWidth
  const height = window.innerHeight
  canvas.width = Math.round(width * pixelRatio)
  canvas.height = Math.round(height * pixelRatio)
  canvas.style.position = 'fixed'
  canvas.style.inset = '0'
  canvas.style.width = '100vw'
  canvas.style.height = '100vh'
  canvas.style.pointerEvents = 'none'
  canvas.style.zIndex = '110'
  canvas.setAttribute('aria-hidden', 'true')
  document.body.append(canvas)
  activeCanvas = canvas
  context.scale(pixelRatio, pixelRatio)

  const colors = ['#d4f03c', '#000000', '#ffffff', '#f7efe7']
  const center = origin ?? { x: width / 2, y: height * 0.4 }
  const particles: Particle[] = Array.from({ length: 120 }, () => {
    const angle = Math.random() * Math.PI * 2
    const speed = 2 + Math.random() * 6
    return {
      x: center.x,
      y: center.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3,
      size: 4 + Math.random() * 5,
      rotation: Math.random() * Math.PI,
      rotationSpeed: (Math.random() - 0.5) * 0.24,
      color: colors[Math.floor(Math.random() * colors.length)] ?? colors[0]!,
    }
  })

  const startedAt = performance.now()
  let previousFrame = startedAt
  const draw = (now: number) => {
    const elapsed = now - startedAt
    const step = Math.min(2, (now - previousFrame) / 16.67)
    previousFrame = now
    context.clearRect(0, 0, width, height)

    if (elapsed >= 2500) {
      context.clearRect(0, 0, width, height)
      canvas.remove()
      activeCanvas = null
      animationFrame = null
      return
    }

    const fade = 1 - elapsed / 2500
    for (const particle of particles) {
      particle.x += particle.vx * step
      particle.y += particle.vy * step
      particle.vy += 0.13 * step
      particle.rotation += particle.rotationSpeed * step
      context.save()
      context.globalAlpha = fade
      context.translate(particle.x, particle.y)
      context.rotate(particle.rotation)
      context.fillStyle = particle.color
      context.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size * 0.65)
      context.restore()
    }

    animationFrame = window.requestAnimationFrame(draw)
  }

  animationFrame = window.requestAnimationFrame(draw)
}
