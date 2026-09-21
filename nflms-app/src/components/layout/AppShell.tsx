import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, Building2, Syringe, Boxes, PackagePlus, PackageMinus, ArrowLeftRight, CalendarClock, BookOpen, Route, MapPinned, Clock, CalendarOff, Briefcase, UserCog, Activity, GraduationCap, Award, ClipboardList, PlusCircle, BarChart3, Store, ExternalLink, LogOut, Menu, X, ChevronDown, Bell, Search, RotateCcw, Database,
} from 'lucide-react'
import { useStore, useMe } from '../../store/store'
import { useLang, useT, type TKey } from '../../i18n'
import { cx, useToast } from '../ui'
import AiAssistant from '../AiAssistant'

type Item = { to: string; k: TKey; icon: React.ReactNode; end?: boolean; external?: boolean }
type Group = { k: TKey; items: Item[] }

const NAV: Group[] = [
  { k: 'dashboard', items: [{ to: '/', k: 'dashboard', icon: <LayoutDashboard size={17} />, end: true }] },
  { k: 'registry', items: [
    { to: '/farmers', k: 'farmers', icon: <Users size={17} /> },
    { to: '/farms', k: 'farms', icon: <Building2 size={17} /> },
  ] },
  { k: 'medicine', items: [
    { to: '/medicine', k: 'inventory', icon: <Boxes size={17} />, end: true },
    { to: '/medicine/receive', k: 'receive', icon: <PackagePlus size={17} /> },
    { to: '/medicine/transfer', k: 'transfer', icon: <ArrowLeftRight size={17} /> },
    { to: '/medicine/distribute', k: 'distribute', icon: <PackageMinus size={17} /> },
    { to: '/medicine/batches', k: 'batches', icon: <CalendarClock size={17} /> },
    { to: '/medicine/ledger', k: 'ledger', icon: <BookOpen size={17} /> },
    { to: '/medicine/trace', k: 'traceability', icon: <Route size={17} /> },
  ] },
  { k: 'fieldForce', items: [
    { to: '/field/attendance', k: 'attendance', icon: <Clock size={17} /> },
    { to: '/field/leave', k: 'leave', icon: <CalendarOff size={17} /> },
    { to: '/field/tour', k: 'tour', icon: <Briefcase size={17} /> },
    { to: '/field/employees', k: 'employees', icon: <UserCog size={17} /> },
    { to: '/field/monitoring', k: 'monitoring', icon: <MapPinned size={17} /> },
  ] },
  { k: 'visits', items: [
    { to: '/visits', k: 'visits', icon: <ClipboardList size={17} />, end: true },
    { to: '/visits/new', k: 'newVisit', icon: <PlusCircle size={17} /> },
    { to: '/disease', k: 'disease', icon: <Activity size={17} /> },
  ] },
  { k: 'training', items: [
    { to: '/training', k: 'trainings', icon: <GraduationCap size={17} />, end: true },
    { to: '/training/certificates', k: 'certificates', icon: <Award size={17} /> },
  ] },
  { k: 'mis', items: [{ to: '/mis', k: 'mis', icon: <BarChart3 size={17} /> }] },
  { k: 'marketplace', items: [
    { to: '/marketplace', k: 'marketAdmin', icon: <Store size={17} /> },
    { to: '/market', k: 'publicPortal', icon: <ExternalLink size={17} />, external: true },
  ] },
]

export default function AppShell() {
  const me = useMe()
  const session = useStore(s => s.session)
  const logout = useStore(s => s.logout)
  const resetDemo = useStore(s => s.resetDemo)
  const { t, lang } = useT()
  const setLang = useLang(s => s.setLang)
  const nav = useNavigate()
  const loc = useLocation()
  const [open, setOpen] = useState(false)
  const [menu, setMenu] = useState(false)
  const toast = useToast()

  useEffect(() => { setOpen(false) }, [loc.pathname])

  if (!me || !session) return null

  const sidebar = (
    <aside className="flex flex-col h-full w-[264px] bg-[#0a1530] text-slate-200">
      <div className="px-5 h-16 flex items-center gap-3 border-b border-white/10">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-400 to-brand-700 grid place-items-center shadow-inner"><Database size={18} className="text-white" /></div>
        <div className="leading-tight">
          <div className="font-bold text-[15px]"><span className="text-brand-300">NFLMS</span> Platform</div>
          <div className="text-[11px] text-slate-400 bn">{t('ministry')}</div>
        </div>
        <button className="ml-auto lg:hidden text-slate-400" onClick={() => setOpen(false)}><X size={18} /></button>
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
        {NAV.map(g => (
          <div key={g.k}>
            <div className="px-2 mb-1 text-[10.5px] font-bold uppercase tracking-[.14em] text-slate-500 bn">{t(g.k)}</div>
            <div className="space-y-0.5">
              {g.items.map(it => it.external ? (
                <a key={it.to} href={it.to} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] font-medium transition bn text-slate-300 hover:bg-white/5 hover:text-white"><span className="opacity-80">{it.icon}</span>{t(it.k)}</a>
              ) : (
                <NavLink key={it.to} to={it.to} end={it.end} className={({ isActive }) => cx('flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] font-medium transition bn', isActive ? 'bg-brand-500/20 text-white shadow-[inset_2px_0_0_0_#4f83e6]' : 'text-slate-300 hover:bg-white/5 hover:text-white')}>
                  <span className="opacity-80">{it.icon}</span>{t(it.k)}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="p-3 border-t border-white/10">
        <button onClick={() => { resetDemo(); toast.push(lang === 'bn' ? 'ডেমো তথ্য পুনরায় লোড হয়েছে' : 'Demo data reset', 'info') }} className="w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-[12.5px] text-slate-400 hover:bg-white/5 hover:text-white bn">
          <RotateCcw size={14} /> {lang === 'bn' ? 'ডেমো তথ্য রিসেট' : 'Reset demo data'}
        </button>
      </div>
    </aside>
  )

  return (
    <div className="h-full flex bg-cream">
      <div className="hidden lg:block shrink-0 no-print">{sidebar}</div>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-navy-950/60" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 shadow-pop">{sidebar}</div>
        </div>
      )}
      <div className="flex-1 min-w-0 flex flex-col h-full">
        <header className="h-16 shrink-0 bg-white border-b border-slate-200 flex items-center gap-3 px-4 sm:px-6 no-print">
          <button className="lg:hidden btn-ghost p-2" onClick={() => setOpen(true)}><Menu size={20} /></button>
          <div className="hidden md:flex items-center gap-2 text-slate-400 text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 w-72 cursor-text" onClick={() => nav('/farmers')}>
            <Search size={15} /><span className="bn">{lang === 'bn' ? 'খামারি, খামার বা আইডি খুঁজুন…' : 'Search farmer, farm or ID…'}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden sm:inline-flex badge bg-brand-50 text-brand-700">{session.workspace}</span>
            <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs font-semibold">
              <button onClick={() => setLang('bn')} className={cx('px-2.5 py-1.5', lang === 'bn' ? 'bg-brand-500 text-white' : 'text-slate-600 hover:bg-slate-50')}>বাংলা</button>
              <button onClick={() => setLang('en')} className={cx('px-2.5 py-1.5', lang === 'en' ? 'bg-brand-500 text-white' : 'text-slate-600 hover:bg-slate-50')}>EN</button>
            </div>
            <button className="btn-ghost p-2 relative"><Bell size={18} /><span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" /></button>
            <div className="relative">
              <button onClick={() => setMenu(m => !m)} className="flex items-center gap-2 rounded-lg hover:bg-slate-50 px-2 py-1.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-white grid place-items-center text-xs font-bold">{me.designation.slice(0, 2)}</div>
                <div className="hidden sm:block text-left leading-tight">
                  <div className="text-sm font-semibold text-slate-800 bn max-w-[160px] truncate">{me.name}</div>
                  <div className="text-[11px] text-slate-500">{me.designation} · {me.station.upazila}</div>
                </div>
                <ChevronDown size={14} className="text-slate-400" />
              </button>
              {menu && (
                <div className="absolute right-0 mt-1 w-56 card p-1.5 z-30 animate-fadeUp" onMouseLeave={() => setMenu(false)}>
                  <div className="px-3 py-2 text-xs text-slate-500 border-b border-slate-100 mb-1">{me.email}<br />{me.department} · {me.role}</div>
                  <button onClick={() => { logout(); nav('/login') }} className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50 bn"><LogOut size={15} /> {t('logout')}</button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8 pb-24">
            <Outlet />
          </div>
        </main>
      </div>
      <AiAssistant portal="officer" />
    </div>
  )
}
