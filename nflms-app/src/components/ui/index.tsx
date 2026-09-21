import React, { createContext, useContext, useEffect, useState } from 'react'
import { X, Search, Inbox, CheckCircle2, AlertTriangle, Info } from 'lucide-react'
import { useT } from '../../i18n'

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

// ---------- Page header ----------
export function PageHeader({ kicker, title, subtitle, actions }: { kicker?: string; title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        {kicker && <div className="kicker mb-1">{kicker}</div>}
        <h1 className="text-2xl font-bold text-slate-900 bn">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1 bn">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 no-print">{actions}</div>}
    </div>
  )
}

// ---------- Card ----------
export function Card({ title, subtitle, actions, children, className, padded = true }: { title?: string; subtitle?: string; actions?: React.ReactNode; children: React.ReactNode; className?: string; padded?: boolean }) {
  return (
    <div className={cx('card', className)}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-100">
          <div>
            {title && <h3 className="font-semibold text-slate-900 bn">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 bn">{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className={padded ? 'p-5' : ''}>{children}</div>
    </div>
  )
}

// ---------- Stat tile ----------
export function Stat({ label, value, hint, icon, tone = 'brand', onClick }: { label: string; value: React.ReactNode; hint?: string; icon?: React.ReactNode; tone?: 'brand' | 'green' | 'amber' | 'red' | 'slate' | 'violet'; onClick?: () => void }) {
  const tones: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-600', green: 'bg-emerald-50 text-emerald-600', amber: 'bg-amber-50 text-amber-600', red: 'bg-red-50 text-red-600', slate: 'bg-slate-100 text-slate-600', violet: 'bg-violet-50 text-violet-600',
  }
  return (
    <button type="button" onClick={onClick} className={cx('card p-4 text-left w-full transition', onClick ? 'hover:border-brand-300 hover:shadow-pop cursor-pointer' : 'cursor-default')}>
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs font-semibold text-slate-500 bn leading-snug">{label}</div>
        {icon && <div className={cx('w-8 h-8 rounded-lg grid place-items-center shrink-0', tones[tone])}>{icon}</div>}
      </div>
      <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">{value}</div>
      {hint && <div className="text-xs text-slate-500 mt-1 bn">{hint}</div>}
    </button>
  )
}

// ---------- Badge ----------
const badgeTones: Record<string, string> = {
  Active: 'bg-emerald-50 text-emerald-700', Present: 'bg-emerald-50 text-emerald-700', Approved: 'bg-emerald-50 text-emerald-700', Completed: 'bg-emerald-50 text-emerald-700', Submitted: 'bg-emerald-50 text-emerald-700', Open: 'bg-brand-50 text-brand-700', Receive: 'bg-emerald-50 text-emerald-700',
  Pending: 'bg-amber-50 text-amber-700', Late: 'bg-amber-50 text-amber-700', Planned: 'bg-slate-100 text-slate-600', Ongoing: 'bg-brand-50 text-brand-700', Draft: 'bg-slate-100 text-slate-600', Transfer: 'bg-brand-50 text-brand-700', Medium: 'bg-amber-50 text-amber-700',
  Absent: 'bg-red-50 text-red-700', Rejected: 'bg-red-50 text-red-700', Suspended: 'bg-red-50 text-red-700', Closed: 'bg-slate-200 text-slate-700', Inactive: 'bg-slate-200 text-slate-700', Cancelled: 'bg-slate-200 text-slate-700', Expired: 'bg-red-50 text-red-700', High: 'bg-red-50 text-red-700', Distribute: 'bg-violet-50 text-violet-700',
  Leave: 'bg-violet-50 text-violet-700', Tour: 'bg-sky-50 text-sky-700', Low: 'bg-emerald-50 text-emerald-700', Adjust: 'bg-amber-50 text-amber-700',
}
export function Badge({ children, tone, className }: { children: React.ReactNode; tone?: string; className?: string }) {
  const key = tone ?? (typeof children === 'string' ? children : '')
  return <span className={cx('badge', badgeTones[key] ?? 'bg-slate-100 text-slate-600', className)}>{children}</span>
}

// ---------- Form field ----------
export function Field({ label, required, hint, children, className }: { label: string; required?: boolean; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="label bn">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-1 bn">{hint}</p>}
    </div>
  )
}

export function Select({ value, onChange, options, placeholder, className, disabled }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; placeholder?: string; className?: string; disabled?: boolean }) {
  return (
    <select className={cx('input', className)} value={value} onChange={e => onChange(e.target.value)} disabled={disabled}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const { t } = useT()
  return (
    <div className="relative">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input className="input pl-9 bg-white" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder ?? t('search')} />
    </div>
  )
}

// ---------- Table ----------
export function Table({ head, children, empty }: { head: React.ReactNode; children: React.ReactNode; empty?: boolean }) {
  const { t } = useT()
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px]">
        <thead><tr>{head}</tr></thead>
        <tbody>{children}</tbody>
      </table>
      {empty && (
        <div className="py-12 text-center text-slate-400">
          <Inbox className="mx-auto mb-2" size={28} />
          <p className="text-sm bn">{t('noData')}</p>
        </div>
      )}
    </div>
  )
}

// ---------- Modal ----------
export function Modal({ open, onClose, title, children, wide, footer }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean; footer?: React.ReactNode }) {
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/50 backdrop-blur-[2px]" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className={cx('bg-white rounded-2xl shadow-pop w-full animate-fadeUp max-h-[92vh] flex flex-col', wide ? 'max-w-4xl' : 'max-w-xl')}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 bn">{title}</h3>
          <button className="btn-ghost p-1.5" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-slate-100 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  )
}

// ---------- Tabs ----------
export function Tabs({ tabs, value, onChange }: { tabs: { key: string; label: string; count?: number }[]; value: string; onChange: (k: string) => void }) {
  return (
    <div className="flex gap-1 border-b border-slate-200 mb-4 overflow-x-auto no-print">
      {tabs.map(t => (
        <button key={t.key} onClick={() => onChange(t.key)} className={cx('px-3.5 py-2 text-sm font-semibold border-b-2 -mb-px whitespace-nowrap bn transition', value === t.key ? 'border-brand-500 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-800')}>
          {t.label}{t.count !== undefined && <span className="ml-1.5 text-xs bg-slate-100 text-slate-600 rounded-full px-1.5 py-0.5">{t.count}</span>}
        </button>
      ))}
    </div>
  )
}

// ---------- Empty ----------
export function Empty({ text }: { text?: string }) {
  const { t } = useT()
  return (
    <div className="py-10 text-center text-slate-400">
      <Inbox className="mx-auto mb-2" size={28} />
      <p className="text-sm bn">{text ?? t('noData')}</p>
    </div>
  )
}

// ---------- Key/value list ----------
export function KV({ items }: { items: { k: string; v: React.ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
      {items.map((it, i) => (
        <div key={i} className="flex flex-col">
          <dt className="text-[11px] uppercase tracking-wide font-semibold text-slate-400 bn">{it.k}</dt>
          <dd className="text-sm text-slate-800 font-medium bn">{it.v ?? '—'}</dd>
        </div>
      ))}
    </dl>
  )
}

// ---------- Toast ----------
type Toast = { id: number; text: string; tone: 'ok' | 'warn' | 'info' }
const ToastCtx = createContext<{ push: (text: string, tone?: Toast['tone']) => void }>({ push: () => {} })
export const useToast = () => useContext(ToastCtx)
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [list, setList] = useState<Toast[]>([])
  const push = (text: string, tone: Toast['tone'] = 'ok') => {
    const id = Date.now() + Math.random()
    setList(l => [...l, { id, text, tone }])
    setTimeout(() => setList(l => l.filter(t => t.id !== id)), 4200)
  }
  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[60] space-y-2 w-[min(92vw,380px)]">
        {list.map(t => (
          <div key={t.id} className={cx('card px-4 py-3 text-sm flex items-start gap-2 animate-fadeUp bn', t.tone === 'ok' && 'border-emerald-200', t.tone === 'warn' && 'border-amber-300', t.tone === 'info' && 'border-brand-200')}>
            {t.tone === 'ok' && <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />}
            {t.tone === 'warn' && <AlertTriangle size={18} className="text-amber-500 shrink-0" />}
            {t.tone === 'info' && <Info size={18} className="text-brand-500 shrink-0" />}
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

// ---------- Confirm ----------
export function useConfirm() {
  const [state, setState] = useState<{ title: string; text?: string; resolve: (v: boolean) => void } | null>(null)
  const confirm = (title: string, text?: string) => new Promise<boolean>(resolve => setState({ title, text, resolve }))
  const el = state ? (
    <Modal open onClose={() => { state.resolve(false); setState(null) }} title={state.title} footer={<>
      <button className="btn-secondary" onClick={() => { state.resolve(false); setState(null) }}>Cancel</button>
      <button className="btn-primary" onClick={() => { state.resolve(true); setState(null) }}>Confirm</button>
    </>}>
      <p className="text-sm text-slate-600 bn">{state.text}</p>
    </Modal>
  ) : null
  return { confirm, el }
}
