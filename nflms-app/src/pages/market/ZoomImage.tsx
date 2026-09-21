import { useCallback, useEffect, useRef, useState } from 'react'
import { ZoomIn, ZoomOut, Maximize2, X, RotateCcw } from 'lucide-react'
import { cx } from '../../components/ui'
import { useLang } from '../../i18n'
import { COMMONS_THUMBS } from './commonsUrls'

/** Request a larger rendition from Wikimedia Commons; other URLs are returned unchanged. */
export const hiRes = (url: string, width = 1600) => {
  const hit = Object.values(COMMONS_THUMBS).find(v => v[640] === url)
  if (hit) return hit[1600]
  return url.includes('commons.wikimedia.org') ? url.replace(/([?&])width=\d+/, `$1width=${width}`) : url
}

const MIN = 1, MAX = 5, STEP = 0.5

/** Full-screen viewer: wheel / pinch to zoom, drag to pan, buttons, Esc to close. */
export function Lightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  const { lang } = useLang()
  const [scale, setScale] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null)
  const pinch = useRef<{ d: number; s: number } | null>(null)
  const [loaded, setLoaded] = useState(false)

  const clamp = (v: number) => Math.min(MAX, Math.max(MIN, +v.toFixed(2)))
  const zoomTo = useCallback((next: number) => { const s = clamp(next); setScale(s); if (s === 1) setPos({ x: 0, y: 0 }) }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); if (e.key === '+' || e.key === '=') zoomTo(scale + STEP); if (e.key === '-') zoomTo(scale - STEP); if (e.key === '0') zoomTo(1) }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [scale, onClose, zoomTo])

  const onWheel = (e: React.WheelEvent) => { e.preventDefault(); zoomTo(scale + (e.deltaY < 0 ? STEP : -STEP)) }
  const onDown = (e: React.PointerEvent) => { if (scale === 1) return; (e.target as HTMLElement).setPointerCapture?.(e.pointerId); drag.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y } }
  const onMove = (e: React.PointerEvent) => { if (!drag.current) return; setPos({ x: drag.current.px + (e.clientX - drag.current.x), y: drag.current.py + (e.clientY - drag.current.y) }) }
  const onUp = () => { drag.current = null }
  const dist = (t: React.TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY)
  const onTouchStart = (e: React.TouchEvent) => { if (e.touches.length === 2) pinch.current = { d: dist(e.touches), s: scale } }
  const onTouchMove = (e: React.TouchEvent) => { if (e.touches.length === 2 && pinch.current) { e.preventDefault(); zoomTo(pinch.current.s * (dist(e.touches) / pinch.current.d)) } }
  const onTouchEnd = () => { pinch.current = null }
  const onDouble = () => zoomTo(scale > 1 ? 1 : 2.5)

  return (
    <div className="fixed inset-0 z-[70] bg-black/90 flex flex-col select-none" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="flex items-center gap-2 px-4 h-14 text-white shrink-0">
        <div className="text-sm truncate bn">{alt}</div>
        <div className="ml-auto flex items-center gap-1">
          <button className="p-2 rounded-lg hover:bg-white/10" onClick={() => zoomTo(scale - STEP)} title="Zoom out (−)"><ZoomOut size={18} /></button>
          <span className="text-xs tabular-nums w-12 text-center">{Math.round(scale * 100)}%</span>
          <button className="p-2 rounded-lg hover:bg-white/10" onClick={() => zoomTo(scale + STEP)} title="Zoom in (+)"><ZoomIn size={18} /></button>
          <button className="p-2 rounded-lg hover:bg-white/10" onClick={() => zoomTo(1)} title="Reset (0)"><RotateCcw size={16} /></button>
          <button className="p-2 rounded-lg hover:bg-white/10 ml-2" onClick={onClose} title="Close (Esc)"><X size={20} /></button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden flex items-center justify-center touch-none" onWheel={onWheel} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} onDoubleClick={onDouble} onClick={e => e.target === e.currentTarget && onClose()}>
        {!loaded && <div className="absolute text-white/70 text-sm bn">{lang === 'bn' ? 'উচ্চ রেজোলিউশন ছবি লোড হচ্ছে…' : 'Loading high-resolution photo…'}</div>}
        <img src={hiRes(src)} alt={alt} draggable={false} onLoad={() => setLoaded(true)} style={{ transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`, transition: drag.current ? 'none' : 'transform .15s ease-out', cursor: scale > 1 ? (drag.current ? 'grabbing' : 'grab') : 'zoom-in' }} className={cx('max-w-[95vw] max-h-[85vh] object-contain', !loaded && 'opacity-0')} />
      </div>
      <div className="h-9 shrink-0 text-center text-[11px] text-white/60 bn">{lang === 'bn' ? 'স্ক্রল / পিঞ্চ করে জুম · টেনে সরান · ডাবল ক্লিকে জুম · Esc বন্ধ' : 'Scroll or pinch to zoom · drag to pan · double-click to zoom · Esc to close'}</div>
    </div>
  )
}

/** Hover-to-magnify image with a button (or click) that opens the Lightbox. */
export function ZoomImage({ src, alt, className, fallback, zoom = 2.2 }: { src: string; alt: string; className?: string; fallback?: React.ReactNode; zoom?: number }) {
  const { lang } = useLang()
  const [err, setErr] = useState(false)
  const [hover, setHover] = useState(false)
  const [origin, setOrigin] = useState('50% 50%')
  const [open, setOpen] = useState(false)
  if (err) return <>{fallback}</>
  return (
    <>
      <div className={cx('relative overflow-hidden group cursor-zoom-in', className)}
        onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
        onMouseMove={e => { const r = e.currentTarget.getBoundingClientRect(); setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`) }}
        onClick={() => setOpen(true)}>
        <img src={src} alt={alt} onError={() => setErr(true)} draggable={false} className="w-full h-full object-cover bg-slate-100 transition-transform duration-150 ease-out" style={{ transform: hover ? `scale(${zoom})` : 'scale(1)', transformOrigin: origin }} />
        <button type="button" onClick={e => { e.stopPropagation(); setOpen(true) }} className="absolute top-2 right-2 inline-flex items-center gap-1.5 rounded-lg bg-black/55 text-white text-xs px-2.5 py-1.5 backdrop-blur-sm hover:bg-black/70 bn"><Maximize2 size={14} />{lang === 'bn' ? 'বড় করে দেখুন' : 'Zoom'}</button>
        <span className="absolute bottom-2 left-2 text-[10px] text-white/90 bg-black/40 rounded px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition bn">{lang === 'bn' ? 'কার্সর সরিয়ে দেখুন · ক্লিকে বড় করুন' : 'Move to inspect · click to enlarge'}</span>
      </div>
      {open && <Lightbox src={src} alt={alt} onClose={() => setOpen(false)} />}
    </>
  )
}
