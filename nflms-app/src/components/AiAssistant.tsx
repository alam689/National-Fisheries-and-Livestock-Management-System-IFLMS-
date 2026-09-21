import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type Anthropic from '@anthropic-ai/sdk'
import { Sparkles, X, Send, Settings2, Trash2, Loader2, Wrench, ExternalLink, ShieldCheck } from 'lucide-react'
import { useLang } from '../i18n'
import { useMe } from '../store/store'
import { cx } from './ui'
import { useAiConfig, isClaudeConfigured, runClaude, localAnswer, type Portal } from '../ai/assistant'

interface Msg { role: 'user' | 'assistant'; text: string; tools?: string[]; nav?: string; pending?: boolean }

const SUGGEST: Record<Portal, { bn: string; en: string }[]> = {
  officer: [
    { bn: 'Cumilla Sadar এ FMD vaccine stock', en: 'FMD vaccine stock at Cumilla Sadar' },
    { bn: 'আজকের উপস্থিতি', en: "Today's attendance" },
    { bn: 'গত ৩০ দিনের রোগের চিত্র', en: 'Disease summary, last 30 days' },
    { bn: 'FMR-2026-00123405 কে?', en: 'Who is FMR-2026-00123405?' },
  ],
  public: [
    { bn: 'কুমিল্লায় মাছের দাম', en: 'Fish price in Cumilla' },
    { bn: 'ORD-000003 এর অবস্থা', en: 'Status of ORD-000003' },
    { bn: 'কীভাবে পণ্য বিক্রি করব?', en: 'How do I sell my produce?' },
    { bn: 'আসন্ন প্রশিক্ষণ', en: 'Upcoming trainings' },
  ],
}

export default function AiAssistant({ portal }: { portal: Portal }) {
  const { lang } = useLang()
  const me = useMe()
  const nav = useNavigate()
  const cfg = useAiConfig()
  const [open, setOpen] = useState(false)
  const [settings, setSettings] = useState(false)
  const [input, setInput] = useState('')
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [busy, setBusy] = useState(false)
  const history = useRef<Anthropic.MessageParam[]>([])
  const abort = useRef<AbortController | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const claude = isClaudeConfigured(cfg)

  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }) }, [msgs, open])
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape' && open) setOpen(false) }
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  }, [open])

  const patchLast = (p: Partial<Msg>) => setMsgs(m => m.map((x, i) => (i === m.length - 1 ? { ...x, ...p } : x)))

  const ask = async (q: string) => {
    const text = q.trim(); if (!text || busy) return
    setInput('')
    setMsgs(m => [...m, { role: 'user', text }, { role: 'assistant', text: '', pending: true, tools: [] }])
    setBusy(true)
    let navTo: string | undefined
    try {
      if (claude) {
        abort.current = new AbortController()
        history.current = await runClaude({
          portal, lang, userName: me?.name, history: [...history.current, { role: 'user', content: text }], signal: abort.current.signal,
          onText: d => setMsgs(m => m.map((x, i) => (i === m.length - 1 ? { ...x, text: x.text + d } : x))),
          onTool: n => setMsgs(m => m.map((x, i) => (i === m.length - 1 ? { ...x, tools: [...(x.tools ?? []), n] } : x))),
          onNavigate: p => { navTo = p },
        })
        patchLast({ pending: false, nav: navTo })
      } else {
        await new Promise(r => setTimeout(r, 350))
        const r = localAnswer(text, portal, lang)
        patchLast({ text: r.text, pending: false, nav: r.navigate })
        navTo = r.navigate
      }
      if (navTo) nav(navTo)
    } catch (e) {
      const err = e as { status?: number; message?: string; name?: string }
      const msg = err.name === 'AbortError' ? (lang === 'bn' ? 'বাতিল করা হয়েছে।' : 'Cancelled.')
        : err.status === 401 ? (lang === 'bn' ? 'API key সঠিক নয়। ⚙ সেটিংসে ঠিক করুন।' : 'Invalid API key. Fix it under ⚙ settings.')
        : err.status === 429 ? (lang === 'bn' ? 'অনুরোধ সীমা অতিক্রম করেছে, একটু পরে চেষ্টা করুন।' : 'Rate limited, please try again shortly.')
        : `${lang === 'bn' ? 'ত্রুটি' : 'Error'}: ${err.message ?? String(e)}`
      patchLast({ text: msg, pending: false })
    } finally { setBusy(false); abort.current = null }
  }

  const clear = () => { history.current = []; setMsgs([]); abort.current?.abort() }

  return (
    <>
      {/* Floating launcher */}
      <button aria-label="AI assistant" title={lang === 'bn' ? 'AI সহকারী' : 'AI Assistant'} onClick={() => setOpen(o => !o)} className={cx('group fixed z-30 bottom-4 right-4 no-print h-12 rounded-full shadow-pop flex items-center text-white font-semibold transition-all overflow-hidden', open ? 'w-12 justify-center bg-slate-800 hover:bg-slate-900' : 'w-12 hover:w-40 justify-start pl-3 bg-gradient-to-br from-brand-500 to-brand-700')}>
        <span className="relative shrink-0"><Sparkles size={22} />{!open && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />}</span>
        {!open && <span className="ml-2 whitespace-nowrap text-sm bn opacity-0 group-hover:opacity-100 transition-opacity">{lang === 'bn' ? 'AI সহকারী' : 'AI Assistant'}</span>}
        {open && <X size={20} className="absolute" />}
      </button>

      {open && (
        <div className="fixed z-40 bottom-20 right-4 w-[min(94vw,400px)] h-[min(78vh,600px)] card shadow-pop flex flex-col overflow-hidden animate-fadeUp no-print">
          <div className="px-4 py-3 bg-[#0a1530] text-white flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-700 grid place-items-center"><Sparkles size={16} /></div>
            <div className="leading-tight"><div className="font-bold text-sm">NFLMS {lang === 'bn' ? 'সহকারী' : 'Assistant'}</div><div className="text-[10.5px] text-slate-300">{claude ? `Claude · ${cfg.model}` : (lang === 'bn' ? 'অফলাইন মোড · অ্যাপের তথ্য থেকে উত্তর' : 'Offline mode · answers from app data')}</div></div>
            <div className="ml-auto flex items-center gap-0.5">
              <button className="p-1.5 rounded-md hover:bg-white/10" title="Settings" onClick={() => setSettings(s => !s)}><Settings2 size={16} /></button>
              <button className="p-1.5 rounded-md hover:bg-white/10" title="Clear" onClick={clear}><Trash2 size={16} /></button>
              <button className="p-1.5 rounded-md hover:bg-white/10" onClick={() => setOpen(false)}><X size={16} /></button>
            </div>
          </div>

          {settings ? (
            <div className="p-4 space-y-3 text-sm overflow-y-auto">
              <div className="font-semibold bn">{lang === 'bn' ? 'Claude সংযোগ' : 'Claude connection'}</div>
              <p className="text-xs text-slate-500 bn">{lang === 'bn' ? 'উৎপাদনে proxy URL ব্যবহার করুন (server/ai-proxy.mjs) — API key সার্ভারে থাকে। ডেমোর জন্য সরাসরি key দিতে পারেন; এটি শুধু এই ব্রাউজারে সংরক্ষিত থাকে।' : 'In production use a proxy URL (server/ai-proxy.mjs) so the API key stays on the server. For a demo you may paste a key; it is stored only in this browser.'}</p>
              <label className="label">Proxy URL</label>
              <input className="input" placeholder="http://localhost:8787" value={cfg.proxyUrl} onChange={e => cfg.setConfig({ proxyUrl: e.target.value })} />
              <label className="label">API key ({lang === 'bn' ? 'ঐচ্ছিক' : 'optional'})</label>
              <input className="input font-mono" type="password" placeholder="sk-ant-…" value={cfg.apiKey} onChange={e => cfg.setConfig({ apiKey: e.target.value })} autoComplete="off" />
              <label className="label">Model</label>
              <select className="input" value={cfg.model} onChange={e => cfg.setConfig({ model: e.target.value })}>
                <option value="claude-opus-5">claude-opus-5 ({lang === 'bn' ? 'ডিফল্ট' : 'default'})</option>
                <option value="claude-sonnet-5">claude-sonnet-5</option>
                <option value="claude-haiku-4-5">claude-haiku-4-5</option>
              </select>
              <div className="flex items-center gap-2 text-xs text-slate-500"><ShieldCheck size={14} className={claude ? 'text-emerald-600' : 'text-slate-300'} />{claude ? (lang === 'bn' ? 'Claude সংযুক্ত' : 'Claude connected') : (lang === 'bn' ? 'সংযোগ নেই — অফলাইন মোড চলবে' : 'Not connected — offline mode will be used')}</div>
              <button className="btn-primary w-full" onClick={() => setSettings(false)}>{lang === 'bn' ? 'সম্পন্ন' : 'Done'}</button>
            </div>
          ) : (
            <>
              <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50">
                {msgs.length === 0 && (
                  <div className="text-sm">
                    <div className="card p-3 bn text-slate-700">{lang === 'bn' ? (portal === 'officer' ? `স্বাগতম${me ? `, ${me.name}` : ''}। মজুদ, উপস্থিতি, খামারি, রোগ বা বাজার সম্পর্কে জিজ্ঞাসা করুন।` : 'স্বাগতম! পণ্যের দাম, অর্ডারের অবস্থা বা কীভাবে বিক্রি করবেন — জিজ্ঞাসা করুন।') : (portal === 'officer' ? `Welcome${me ? `, ${me.name}` : ''}. Ask about stock, attendance, farmers, disease or the market.` : 'Welcome! Ask about prices, order status or how to sell.')}</div>
                    <div className="mt-3 flex flex-wrap gap-1.5">{SUGGEST[portal].map(sg => <button key={sg.en} onClick={() => ask(lang === 'bn' ? sg.bn : sg.en)} className="text-xs rounded-full border border-brand-200 bg-white text-brand-700 px-2.5 py-1 hover:bg-brand-50 bn">{lang === 'bn' ? sg.bn : sg.en}</button>)}</div>
                  </div>
                )}
                {msgs.map((m, i) => (
                  <div key={i} className={cx('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                    <div className={cx('max-w-[88%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap bn leading-relaxed', m.role === 'user' ? 'bg-brand-500 text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm')}>
                      {m.tools && m.tools.length > 0 && <div className="mb-1 flex flex-wrap gap-1">{m.tools.map((t, j) => <span key={j} className="inline-flex items-center gap-1 text-[10px] rounded bg-slate-100 text-slate-500 px-1.5 py-0.5"><Wrench size={9} />{t}</span>)}</div>}
                      {m.text || (m.pending && <span className="inline-flex items-center gap-1.5 text-slate-400"><Loader2 size={14} className="animate-spin" />{lang === 'bn' ? 'ভাবছি…' : 'Thinking…'}</span>)}
                      {m.nav && !m.pending && <button onClick={() => nav(m.nav!)} className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-brand-700 hover:underline"><ExternalLink size={11} />{m.nav}</button>}
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={e => { e.preventDefault(); ask(input) }} className="p-2.5 border-t border-slate-200 bg-white flex items-center gap-2">
                <input className="input bn" placeholder={lang === 'bn' ? 'প্রশ্ন লিখুন…' : 'Ask something…'} value={input} onChange={e => setInput(e.target.value)} disabled={busy} autoFocus />
                {busy && claude ? <button type="button" className="btn-secondary px-3" onClick={() => abort.current?.abort()}><X size={16} /></button> : <button className="btn-primary px-3" disabled={!input.trim() || busy}><Send size={16} /></button>}
              </form>
            </>
          )}
        </div>
      )}
    </>
  )
}
