'use client'

import { useEffect, useRef, useState } from 'react'
import { toPng } from 'html-to-image'

type ShareImageButtonProps = { targetId: string; range: number }

function hasAttribute(node: Node, attribute: string): node is Element {
  return node.nodeType === 1 && typeof (node as Element).hasAttribute === 'function' && (node as Element).hasAttribute(attribute)
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function blobFromDataURL(dataURL: string): Promise<Blob> {
  return fetch(dataURL).then((response) => response.blob())
}

export function ShareImageButton({ targetId, range }: ShareImageButtonProps) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [canShareFile, setCanShareFile] = useState(false)
  const [canCopyImage, setCanCopyImage] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const file = new File([''], 'analytics.png', { type: 'image/png' })
    setCanShareFile(typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] }) && typeof navigator.share === 'function')
    setCanCopyImage('clipboard' in navigator && typeof ClipboardItem !== 'undefined')
  }, [])

  useEffect(() => {
    if (!open) return
    const closeOnOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !wrapperRef.current?.contains(event.target)) setOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  async function renderImage(): Promise<{ blob: Blob; filename: string } | null> {
    const target = document.getElementById(targetId)
    if (!target) throw new Error('The analytics report is not available.')
    setBusy(true)
    setStatus('Rendering image…')
    const hiddenElements = Array.from(target.querySelectorAll<HTMLElement>('[data-share-only]'))
    const previousDisplay = hiddenElements.map((element) => element.style.display)
    const previousFont = target.style.fontFamily
    const previousBackground = target.style.backgroundColor
    const previousCapturing = target.getAttribute('data-share-capturing')
    const summaryStrip = target.querySelector<HTMLElement>('[data-share-summary-strip]')
    const summaryCards = summaryStrip ? Array.from(summaryStrip.querySelectorAll<HTMLElement>('[data-share-summary-card]')) : []
    const previousStripStyles = summaryStrip ? {
      display: summaryStrip.style.display,
      gridTemplateColumns: summaryStrip.style.gridTemplateColumns,
      gap: summaryStrip.style.gap,
      alignItems: summaryStrip.style.alignItems,
      overflowX: summaryStrip.style.overflowX,
      overflowY: summaryStrip.style.overflowY,
      flexWrap: summaryStrip.style.flexWrap,
      width: summaryStrip.style.width,
      height: summaryStrip.style.height,
      minHeight: summaryStrip.style.minHeight,
    } : null
    const previousCardStyles = summaryCards.map((card) => ({
      flex: card.style.flex,
      width: card.style.width,
      height: card.style.height,
      minHeight: card.style.minHeight,
    }))
    try {
      target.setAttribute('data-share-capturing', 'true')
      target.style.fontFamily = 'Arial, system-ui, sans-serif'
      const rootStyle = getComputedStyle(document.documentElement)
      const bodyStyle = getComputedStyle(document.body)
      const backgroundColor = rootStyle.getPropertyValue('--theme-bg').trim() || bodyStyle.backgroundColor || '#fff'
      target.style.backgroundColor = backgroundColor
      const captureWidth = target.getBoundingClientRect().width
      if (summaryStrip) {
        summaryStrip.style.display = 'grid'
        summaryStrip.style.gridTemplateColumns = captureWidth < 1200 ? 'repeat(3, minmax(0, 1fr))' : 'repeat(6, minmax(0, 1fr))'
        summaryStrip.style.gap = '16px'
        summaryStrip.style.alignItems = 'stretch'
        summaryStrip.style.overflowX = 'visible'
        summaryStrip.style.overflowY = 'visible'
        summaryStrip.style.flexWrap = 'nowrap'
        summaryStrip.style.width = 'auto'
        summaryStrip.style.height = 'auto'
        summaryStrip.style.minHeight = '0'
        summaryCards.forEach((card) => {
          card.style.flex = 'none'
          card.style.width = 'auto'
          card.style.height = 'auto'
          card.style.minHeight = '0'
        })
      }
      hiddenElements.forEach((element) => { element.style.display = element.dataset.shareDisplay || 'block' })
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
      const bounds = target.getBoundingClientRect()
      const dataURL = await toPng(target, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor,
        width: Math.ceil(bounds.width + 96),
        height: Math.ceil(bounds.height + 112),
        style: {
          width: `${Math.ceil(bounds.width + 96)}px`,
          height: `${Math.ceil(bounds.height + 112)}px`,
          padding: '48px 48px 64px',
          boxSizing: 'border-box',
          backgroundColor,
        },
        filter: (node) => !hasAttribute(node, 'data-share-ignore'),
      })
      const blob = await blobFromDataURL(dataURL)
      if (!blob.type.startsWith('image/png')) throw new Error('The report image could not be created.')
      return { blob, filename: `analytics-${range}-days-${today()}.png` }
    } finally {
      hiddenElements.forEach((element, index) => { element.style.display = previousDisplay[index] ?? 'none' })
      if (summaryStrip && previousStripStyles) {
        summaryStrip.style.display = previousStripStyles.display
        summaryStrip.style.gridTemplateColumns = previousStripStyles.gridTemplateColumns
        summaryStrip.style.gap = previousStripStyles.gap
        summaryStrip.style.alignItems = previousStripStyles.alignItems
        summaryStrip.style.overflowX = previousStripStyles.overflowX
        summaryStrip.style.overflowY = previousStripStyles.overflowY
        summaryStrip.style.flexWrap = previousStripStyles.flexWrap
        summaryStrip.style.width = previousStripStyles.width
        summaryStrip.style.height = previousStripStyles.height
        summaryStrip.style.minHeight = previousStripStyles.minHeight
        summaryCards.forEach((card, index) => {
          const previous = previousCardStyles[index]
          if (!previous) return
          card.style.flex = previous.flex
          card.style.width = previous.width
          card.style.height = previous.height
          card.style.minHeight = previous.minHeight
        })
      }
      target.style.fontFamily = previousFont
      target.style.backgroundColor = previousBackground
      if (previousCapturing === null) target.removeAttribute('data-share-capturing')
      else target.setAttribute('data-share-capturing', previousCapturing)
      setBusy(false)
    }
  }

  async function downloadImage() {
    try {
      const image = await renderImage()
      if (!image) return
      const objectURL = URL.createObjectURL(image.blob)
      const anchor = document.createElement('a')
      anchor.href = objectURL
      anchor.download = image.filename
      anchor.click()
      URL.revokeObjectURL(objectURL)
      setStatus('PNG downloaded.')
    } catch (error) {
      console.error('Analytics PNG download failed', error)
      setStatus(`Could not download PNG: ${error instanceof Error ? error.message : 'unexpected image error.'}`)
    }
  }

  async function shareImage() {
    try {
      const image = await renderImage()
      if (!image) return
      const file = new File([image.blob], image.filename, { type: 'image/png' })
      if (!navigator.canShare?.({ files: [file] }) || !navigator.share) throw new Error('Image sharing is not available in this browser.')
      await navigator.share({ files: [file], title: 'dev.akarun analytics' })
      setStatus('Image shared.')
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return
      console.error('Analytics image share failed', error)
      setStatus(`Could not share image: ${error instanceof Error ? error.message : 'unexpected image error.'}`)
    }
  }

  async function copyImage() {
    try {
      const image = await renderImage()
      if (!image) return
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': image.blob })])
      setStatus('Image copied.')
    } catch (error) {
      console.error('Analytics image copy failed', error)
      setStatus(`Could not copy image: ${error instanceof Error ? error.message : 'unexpected image error.'}`)
    }
  }

  return (
    <div data-share-ignore ref={wrapperRef} style={{ position: 'relative', zIndex: open ? 10 : 'auto', display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
      <style>{`
        .analytics-share-menu {
          position: absolute !important;
          z-index: 10 !important;
          top: calc(100% + 6px) !important;
          right: 0 !important;
          display: flex !important;
          flex-direction: column !important;
          align-content: flex-start !important;
          align-items: stretch !important;
          gap: 4px !important;
          height: auto !important;
          min-height: 0 !important;
          width: max-content !important;
          min-width: 180px !important;
          padding: 6px !important;
          grid-template-rows: none !important;
          border: 1px solid var(--theme-elevation-150) !important;
          border-radius: var(--style-radius-s) !important;
          background: var(--theme-elevation-0) !important;
          color: var(--theme-text) !important;
          box-shadow: 0 4px 16px #0003 !important;
        }
        .analytics-share-menu-item {
          box-sizing: border-box !important;
          display: flex !important;
          flex: 0 0 auto !important;
          align-items: center !important;
          justify-content: flex-start !important;
          width: 100% !important;
          height: 32px !important;
          min-height: 32px !important;
          margin: 0 !important;
          padding: 0 12px !important;
          border: 1px solid var(--theme-elevation-150) !important;
          border-radius: var(--style-radius-s) !important;
          background: transparent !important;
          color: var(--theme-text) !important;
          text-align: left !important;
          white-space: nowrap !important;
          cursor: pointer !important;
        }
        .analytics-share-menu-item:hover:not(:disabled) {
          background: var(--theme-elevation-100) !important;
        }
        .analytics-share-menu-item:disabled {
          cursor: wait !important;
          opacity: 0.6 !important;
        }
      `}</style>
      <div style={{ position: 'relative', display: 'inline-flex' }}>
        <button aria-expanded={open} aria-haspopup="menu" className="btn btn--style-pill btn--size-small" disabled={busy} onClick={() => setOpen((value) => !value)} type="button">
          {busy ? 'Rendering…' : 'Share as image'}
        </button>
        {open ? (
          <div aria-label="Share analytics report as image" className="analytics-share-menu" role="menu">
            {canShareFile ? <button className="analytics-share-menu-item" disabled={busy} onClick={() => { setOpen(false); void shareImage() }} role="menuitem" type="button">Share image</button> : null}
            <button className="analytics-share-menu-item" disabled={busy} onClick={() => { setOpen(false); void downloadImage() }} role="menuitem" type="button">Download PNG</button>
            {canCopyImage ? <button className="analytics-share-menu-item" disabled={busy} onClick={() => { setOpen(false); void copyImage() }} role="menuitem" type="button">Copy image</button> : null}
          </div>
        ) : null}
      </div>
      <span aria-live="polite" role="status" style={{ fontSize: 12, color: 'var(--theme-elevation-600)' }}>{status}</span>
    </div>
  )
}
