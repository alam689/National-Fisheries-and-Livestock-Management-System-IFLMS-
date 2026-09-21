import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Building2, Check, Database, Fish, Users, Syringe, Truck, MapPinned, GraduationCap, ClipboardList, Activity, BarChart3, Landmark, Beef, Store } from 'lucide-react'
import { useStore } from '../store/store'
import { useLang } from '../i18n'
import type { Session } from '../types'

const WORKSPACES: { key: Session['workspace']; name: string; bn: string; domain: string; icon: React.ReactNode }[] = [
  { key: 'DLS', name: 'DLS', bn: 'প্রাণিসম্পদ অধিদপ্তর', domain: 'dls.gov.bd', icon: <Beef size={18} /> },
  { key: 'DoF', name: 'DoF', bn: 'মৎস্য অধিদপ্তর', domain: 'fisheries.gov.bd', icon: <Fish size={18} /> },
  { key: 'MoFL', name: 'MoFL', bn: 'মন্ত্রণালয়', domain: 'mofl.gov.bd', icon: <Landmark size={18} /> },
]

// constellation layout (720 x 500 box), database hub at (360, 462)
const HUB = { x: 360, y: 440 }
const CHIPS = [
  { x: 108, y: 42, label: 'Farm Registry', icon: <Building2 size={15} /> },
  { x: 276, y: 48, label: 'Farmer ID', icon: <Users size={15} /> },
  { x: 444, y: 44, label: 'Medicine', icon: <Syringe size={15} /> },
  { x: 612, y: 40, label: 'Supply Chain', icon: <Truck size={15} /> },
  { x: 182, y: 158, label: 'Field Force', icon: <MapPinned size={15} /> },
  { x: 362, y: 162, label: 'Training', icon: <GraduationCap size={15} /> },
  { x: 542, y: 156, label: 'Field Visit', icon: <ClipboardList size={15} /> },
  { x: 272, y: 272, label: 'Disease', icon: <Activity size={15} /> },
  { x: 452, y: 274, label: 'MIS', icon: <BarChart3 size={15} /> },
]

function Constellation() {
  const lines = useMemo(() => CHIPS.map(c => ({ x1: c.x, y1: c.y + 22, x2: HUB.x, y2: HUB.y })), [])
  return (
    <div className="relative w-[720px] h-[520px] select-none">
      <svg className="absolute inset-0" width={720} height={520} viewBox="0 0 720 520" fill="none">
        <defs>
          <linearGradient id="ln" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#5b8def" stopOpacity=".08" />
            <stop offset="1" stopColor="#5b8def" stopOpacity=".55" />
          </linearGradient>
          <radialGradient id="glow" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#3b7bff" stopOpacity=".55" />
            <stop offset="1" stopColor="#3b7bff" stopOpacity="0" />
          </radialGradient>
        </defs>
        {lines.map((l, i) => (
          <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="url(#ln)" strokeWidth="1" />
        ))}
        {lines.map((l, i) => (
          <circle key={`d${i}`} r="2.4" fill="#9cc0ff">
            <animateMotion dur={`${2.6 + (i % 4) * 0.55}s`} begin={`${(i * 0.37) % 2.4}s`} repeatCount="indefinite" path={`M${l.x1},${l.y1} L${l.x2},${l.y2}`} />
            <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur={`${2.6 + (i % 4) * 0.55}s`} begin={`${(i * 0.37) % 2.4}s`} repeatCount="indefinite" />
          </circle>
        ))}
        <ellipse cx={HUB.x} cy={HUB.y + 28} rx="120" ry="34" fill="url(#glow)" />
        <ellipse cx={HUB.x} cy={HUB.y + 28} rx="92" ry="24" stroke="#5b8def" strokeOpacity=".25" />
        <ellipse cx={HUB.x} cy={HUB.y + 28} rx="118" ry="32" stroke="#5b8def" strokeOpacity=".12" />
      </svg>
      {CHIPS.map((c, i) => (
        <div key={c.label} className="absolute animate-float" style={{ left: c.x, top: c.y, transform: 'translate(-50%,-50%)', animationDelay: `${(i * 0.6) % 5}s`, animationDuration: `${4.5 + (i % 3)}s` }}>
          <div className="flex items-center gap-2 px-4 h-11 whitespace-nowrap rounded-xl border border-white/10 bg-white/[.06] backdrop-blur-sm text-slate-100 text-[13px] font-semibold shadow-[0_8px_30px_rgba(0,0,0,.25)]">
            <span className="text-brand-300">{c.icon}</span>{c.label}
          </div>
        </div>
      ))}
      <div className="absolute" style={{ left: HUB.x, top: HUB.y + 26, transform: 'translate(-50%,-50%)' }}>
        <DbIcon size={96} />
      </div>
    </div>
  )
}

function DbIcon({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" fill="none">
      <defs>
        <linearGradient id="db1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5b93ff" /><stop offset="1" stopColor="#1e4fc2" /></linearGradient>
        <linearGradient id="db2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#8fb4ff" /><stop offset="1" stopColor="#3b73e6" /></linearGradient>
      </defs>
      <ellipse cx="48" cy="74" rx="30" ry="10" fill="#173c8f" />
      <path d="M18 44v30c0 5.5 13.4 10 30 10s30-4.5 30-10V44" fill="url(#db1)" />
      <ellipse cx="48" cy="58" rx="30" ry="10" fill="#2a5fd1" />
      <path d="M18 30v28c0 5.5 13.4 10 30 10s30-4.5 30-10V30" fill="url(#db1)" />
      <ellipse cx="48" cy="44" rx="30" ry="10" fill="#3b73e6" />
      <path d="M18 18v26c0 5.5 13.4 10 30 10s30-4.5 30-10V18" fill="url(#db1)" />
      <ellipse cx="48" cy="20" rx="30" ry="10" fill="url(#db2)" />
      <ellipse cx="48" cy="20" rx="12" ry="4" fill="#1a3f9c" opacity=".7" />
    </svg>
  )
}

export default function Login() {
  const nav = useNavigate()
  const login = useStore(s => s.login)
  const employees = useStore(s => s.employees)
  const { lang, setLang } = useLang()
  const [ws, setWs] = useState<Session['workspace']>('DLS')
  const [user, setUser] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const domain = WORKSPACES.find(w => w.key === ws)!.domain
  const demo = employees.filter(e => e.email.endsWith('@' + domain)).slice(0, 4)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setErr('')
    if (!user.trim() || !pw) { setErr(lang === 'bn' ? 'ইমেইল ও পাসওয়ার্ড দিন' : 'Enter email and password'); return }
    setBusy(true)
    setTimeout(() => {
      const r = login(user.includes('@') ? user : `${user}@${domain}`, ws)
      setBusy(false)
      if (!r.ok) { setErr(r.error ?? 'Login failed'); return }
      nav('/')
    }, 450)
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#eef2f7]">
      {/* LEFT */}
      <div className="hidden lg:flex relative flex-col overflow-hidden bg-[#08122b] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(900px_600px_at_20%_10%,rgba(38,84,196,.45),transparent_60%),radial-gradient(700px_500px_at_80%_90%,rgba(28,60,150,.5),transparent_60%),linear-gradient(180deg,#0b1633_0%,#050b1a_100%)]" />
        <div className="absolute inset-0 opacity-[.07] bg-[linear-gradient(rgba(255,255,255,.4)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.4)_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="relative z-10 px-10 pt-9 flex items-center gap-3">
          <DbIcon size={44} />
          <div>
            <div className="text-lg font-bold leading-tight"><span className="text-brand-300">NFLMS</span> Platform</div>
            <div className="text-[12px] text-slate-300/80">National Fisheries & Livestock Management System</div>
          </div>
        </div>
        <div className="relative z-10 px-10 mt-14">
          <h1 className="text-[34px] leading-[1.15] font-bold tracking-tight">One platform.<br />Every part of fisheries &amp; livestock.</h1>
          <p className="mt-3 text-slate-300/80 text-sm bn">খামার · খামারি · ঔষধ ও ভ্যাকসিন · মাঠ কর্মী · প্রশিক্ষণ · জাতীয় MIS — একটি সমন্বিত ডিজিটাল প্ল্যাটফর্মে।</p>
        </div>
        <div className="relative z-10 flex-1 flex items-start justify-center mt-4 scale-[.92] xl:scale-100 origin-top">
          <Constellation />
        </div>
        <div className="relative z-10 px-10 pb-7 text-[12px] text-slate-400/80 bn">© {lang === 'bn' ? 'মৎস্য ও প্রাণিসম্পদ মন্ত্রণালয় · গণপ্রজাতন্ত্রী বাংলাদেশ সরকার' : 'Ministry of Fisheries and Livestock · Government of Bangladesh'}</div>
      </div>

      {/* RIGHT */}
      <div className="flex flex-col items-center justify-center p-6 sm:p-10 relative">
        <div className="absolute top-4 right-4 flex gap-1 text-xs font-semibold">
          <button onClick={() => setLang('bn')} className={`px-2.5 py-1 rounded-md ${lang === 'bn' ? 'bg-brand-500 text-white' : 'text-slate-500 hover:bg-white'}`}>বাংলা</button>
          <button onClick={() => setLang('en')} className={`px-2.5 py-1 rounded-md ${lang === 'en' ? 'bg-brand-500 text-white' : 'text-slate-500 hover:bg-white'}`}>EN</button>
        </div>
        <div className="w-full max-w-[560px] space-y-5 animate-fadeUp">
          <div className="lg:hidden flex items-center gap-3 mb-2">
            <DbIcon size={40} />
            <div><div className="font-bold text-slate-900"><span className="text-brand-600">NFLMS</span> Platform</div><div className="text-xs text-slate-500">National Fisheries & Livestock Management System</div></div>
          </div>

          <div className="card p-6">
            <h2 className="text-[17px] font-bold text-slate-900">Workspace</h2>
            <p className="text-sm text-slate-500 mt-0.5 bn">{lang === 'bn' ? 'আপনি কোন প্রতিষ্ঠানে সাইন ইন করছেন?' : 'Which organization are you signing in to?'}</p>
            <div className="grid grid-cols-3 gap-3 mt-5">
              {WORKSPACES.map(w => {
                const on = ws === w.key
                return (
                  <button key={w.key} type="button" onClick={() => { setWs(w.key); setUser(''); setErr('') }}
                    className={`relative text-left rounded-xl border p-3.5 transition ${on ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-100' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                    {on && <Check size={16} className="absolute top-3 right-3 text-brand-600" />}
                    <div className="flex items-start gap-2.5">
                      <span className={`mt-0.5 ${on ? 'text-brand-600' : 'text-slate-500'}`}>{w.icon}</span>
                      <div>
                        <div className={`font-bold text-[15px] ${on ? 'text-brand-700' : 'text-slate-800'}`}>{w.name}</div>
                        <div className="text-[12px] text-slate-500 bn leading-snug">{w.bn}</div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <form onSubmit={submit} className="card p-6">
            <h2 className="text-[22px] font-bold text-slate-900">Sign in</h2>
            <p className="text-sm text-slate-500 mt-0.5 bn">{lang === 'bn' ? 'ওয়ার্কস্পেসে প্রবেশ করতে আপনার তথ্য দিন।' : 'Enter your credentials to access the workspace.'}</p>
            <div className="mt-5 space-y-4">
              <div>
                <label className="label">Email</label>
                <div className="flex">
                  <input className="input rounded-r-none" placeholder="you" value={user} onChange={e => setUser(e.target.value)} autoFocus autoComplete="username" />
                  <span className="inline-flex items-center px-3 rounded-r-lg border border-l-0 border-slate-200 bg-slate-100 text-sm text-slate-600 whitespace-nowrap">@{domain}</span>
                </div>
              </div>
              <div>
                <label className="label">Password</label>
                <input className="input" type="password" placeholder="••••••••" value={pw} onChange={e => setPw(e.target.value)} autoComplete="current-password" />
              </div>
              {err && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 bn">{err}</div>}
              <button className="btn-primary w-full h-11 text-[15px]" disabled={busy}>
                {busy ? '...' : 'Sign in'} <ArrowRight size={17} />
              </button>
            </div>
            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Demo accounts · {lang === 'bn' ? 'যেকোনো পাসওয়ার্ড' : 'any password'}</div>
              <div className="flex flex-wrap gap-1.5">
                {demo.map(e => (
                  <button key={e.id} type="button" onClick={() => { setUser(e.email.split('@')[0]); setPw('demo1234') }} className="text-xs rounded-md border border-slate-200 bg-white hover:bg-brand-50 hover:border-brand-200 px-2 py-1 text-slate-600">
                    <span className="font-semibold text-slate-800">{e.designation}</span> · {e.email.split('@')[0]}
                  </button>
                ))}
              </div>
            </div>
          </form>
          <p className="text-center text-xs text-slate-400 flex items-center justify-center gap-1.5"><Database size={12} /> Phase-1 pilot · Cumilla district · v1.0</p>
          <p className="text-center text-sm"><Link to="/market" className="inline-flex items-center gap-1.5 text-brand-700 font-semibold hover:underline bn"><Store size={15} /> {lang === 'bn' ? 'খামারি বাজারে যান — নাগরিক ও খামারিদের জন্য, লগইন ছাড়াই' : 'Go to the Farmer Marketplace — for citizens and farmers, no login needed'}</Link></p>
        </div>
      </div>
    </div>
  )
}
