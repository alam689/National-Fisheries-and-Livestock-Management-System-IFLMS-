import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Users, Building2, Fish, Beef, Egg, UserCheck, Syringe, Activity, GraduationCap, AlertTriangle, CalendarClock, ChevronRight, ArrowRight } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, PieChart, Pie, Cell } from 'recharts'
import { useStore, useMe, stockOf } from '../store/store'
import { useT } from '../i18n'
import { fmtNum, fmtDate, addDays, todayISO, daysUntil, monthKey } from '../lib/format'
import { DIVISIONS, bnName } from '../data/geo'
import { PageHeader, Card, Stat, Badge, Table } from '../components/ui'

const C = { brand: '#2f62d9', green: '#10b981', amber: '#f59e0b', red: '#ef4444', violet: '#8b5cf6', slate: '#94a3b8', sky: '#0ea5e9' }

export default function Dashboard() {
  const s = useStore()
  const me = useMe()!
  const { t, lang } = useT()
  const nav = useNavigate()
  const today = todayISO()
  const d30 = addDays(today, -30)
  const nm = (n: string) => (lang === 'bn' ? bnName(n) : n)

  // drill-down state
  const [div, setDiv] = useState<string>('')
  const [dist, setDist] = useState<string>('')

  const inScope = <T extends { location: { division: string; district: string; upazila: string } }>(x: T) =>
    (!div || x.location.division === div) && (!dist || x.location.district === dist)
  const farmers = s.farmers.filter(inScope)
  const farms = s.farms.filter(inScope)
  const farmIds = new Set(farms.map(f => f.id))
  const officers = s.employees.filter(e => e.active && (!div || e.station.division === div) && (!dist || e.station.district === dist))
  const distributed = s.txns.filter(x => x.type === 'Distribute' && (!x.farmId || farmIds.has(x.farmId)))
  const disease30 = s.diseaseReports.filter(r => r.date >= d30 && farmIds.has(r.farmId))
  const trainingsDone = s.trainings.filter(x => x.status === 'Completed' && (!div || DIVISIONS.find(d => d.name === div)?.districts.some(dd => dd.name === x.district)) && (!dist || x.district === dist))

  const kpis = [
    { label: t('regFarmers'), value: farmers.length, icon: <Users size={16} />, tone: 'brand' as const, to: '/farmers' },
    { label: t('regFarms'), value: farms.length, icon: <Building2 size={16} />, tone: 'brand' as const, to: '/farms' },
    { label: t('fishFarms'), value: farms.filter(f => f.type === 'Fish').length, icon: <Fish size={16} />, tone: 'green' as const, to: '/farms?type=Fish' },
    { label: t('cattleDairy'), value: farms.filter(f => f.type === 'Cattle' || f.type === 'Dairy').length, icon: <Beef size={16} />, tone: 'amber' as const, to: '/farms?type=Cattle' },
    { label: t('poultryFarms'), value: farms.filter(f => f.type === 'Poultry').length, icon: <Egg size={16} />, tone: 'violet' as const, to: '/farms?type=Poultry' },
    { label: t('activeOfficers'), value: officers.length, icon: <UserCheck size={16} />, tone: 'slate' as const, to: '/field/employees' },
    { label: t('medDistributed'), value: distributed.reduce((a, x) => a + x.qty, 0), icon: <Syringe size={16} />, tone: 'green' as const, to: '/medicine/ledger' },
    { label: t('diseaseCases30'), value: disease30.reduce((a, x) => a + x.cases, 0), icon: <Activity size={16} />, tone: 'red' as const, to: '/disease' },
    { label: t('trainingsDone'), value: trainingsDone.length, icon: <GraduationCap size={16} />, tone: 'brand' as const, to: '/training' },
  ]

  // drill-down rows
  const rows = useMemo(() => {
    const keyOf = (l: { division: string; district: string; upazila: string }) => (!div ? l.division : !dist ? l.district : l.upazila)
    const map = new Map<string, { farmers: number; farms: number; fish: number; livestock: number; poultry: number; disease: number; officers: number }>()
    const g = (k: string) => { if (!map.has(k)) map.set(k, { farmers: 0, farms: 0, fish: 0, livestock: 0, poultry: 0, disease: 0, officers: 0 }); return map.get(k)! }
    farmers.forEach(f => g(keyOf(f.location)).farmers++)
    farms.forEach(f => { const r = g(keyOf(f.location)); r.farms++; if (f.type === 'Fish') r.fish++; else if (f.type === 'Poultry' || f.type === 'Duck') r.poultry++; else r.livestock++ })
    disease30.forEach(r => { const f = s.farms.find(x => x.id === r.farmId); if (f) g(keyOf(f.location)).disease += r.cases })
    officers.forEach(e => { if (e.role !== 'admin' && e.role !== 'ministry') g(keyOf(e.station)).officers++ })
    return [...map.entries()].sort((a, b) => b[1].farms - a[1].farms)
  }, [div, dist, s.farmers, s.farms, s.diseaseReports, s.employees])

  // charts
  const byType = useMemo(() => ['Fish', 'Cattle', 'Dairy', 'Poultry', 'Duck', 'Goat/Sheep', 'Mixed'].map(tp => ({ name: tp, value: farms.filter(f => f.type === tp).length })), [farms])
  const distTrend = useMemo(() => {
    const out: { m: string; qty: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i)
      const k = d.toISOString().slice(0, 7)
      out.push({ m: d.toLocaleString('en', { month: 'short' }), qty: s.txns.filter(x => x.type === 'Distribute' && monthKey(x.date) === k).reduce((a, x) => a + x.qty, 0) })
    }
    return out
  }, [s.txns])
  const diseaseBySp = useMemo(() => ['Cattle', 'Poultry', 'Fish', 'Goat', 'Duck'].map(sp => ({ name: sp, cases: disease30.filter(r => r.species === sp).reduce((a, r) => a + r.cases, 0) })), [disease30])

  // alerts
  const lowStock = useMemo(() => {
    const out: { store: string; med: string; qty: number; min: number }[] = []
    for (const st of s.stores) for (const m of s.medicines) {
      const q = stockOf(s.batches, st.id, m.id)
      const min = st.level === 'Central' ? m.minStock * 2 : st.level === 'District' ? m.minStock : Math.round(m.minStock / 4)
      if (q > 0 && q < min) out.push({ store: st.name, med: m.name, qty: q, min })
    }
    return out.sort((a, b) => a.qty / a.min - b.qty / b.min).slice(0, 6)
  }, [s.batches, s.stores, s.medicines])
  const expiring = s.batches.filter(b => b.qty > 0 && daysUntil(b.expiry) <= 45).sort((a, b) => a.expiry.localeCompare(b.expiry)).slice(0, 6)
  const attToday = s.attendance.filter(a => a.date === today)
  const upcoming = s.trainings.filter(x => x.date >= today && x.status !== 'Cancelled').sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4)
  const recentVisits = s.visits.slice(0, 6)

  return (
    <div>
      <PageHeader kicker={`MODULE 06 · NATIONAL DASHBOARD`} title={lang === 'bn' ? `স্বাগতম, ${me.name.split(' ').slice(-2).join(' ')}` : `Welcome, ${me.name}`} subtitle={lang === 'bn' ? 'মন্ত্রণালয়ের জন্য এক পর্দায় সারা দেশ — Real-time জাতীয় → জেলা → উপজেলা monitoring' : 'The whole country on one screen — real-time national → district → upazila monitoring'}
        actions={<>
          <Link to="/visits/new" className="btn-primary">{t('newVisit')} <ArrowRight size={15} /></Link>
        </>} />

      {/* drill-down breadcrumb */}
      <div className="flex flex-wrap items-center gap-1.5 text-sm mb-4 bn">
        <button onClick={() => { setDiv(''); setDist('') }} className={`px-2 py-1 rounded-md font-semibold ${!div ? 'bg-brand-500 text-white' : 'text-brand-700 hover:bg-brand-50'}`}>{lang === 'bn' ? 'বাংলাদেশ' : 'Bangladesh'}</button>
        {div && <><ChevronRight size={14} className="text-slate-400" /><button onClick={() => setDist('')} className={`px-2 py-1 rounded-md font-semibold ${!dist ? 'bg-brand-500 text-white' : 'text-brand-700 hover:bg-brand-50'}`}>{nm(div)}</button></>}
        {dist && <><ChevronRight size={14} className="text-slate-400" /><span className="px-2 py-1 rounded-md font-semibold bg-brand-500 text-white">{nm(dist)}</span></>}
        <span className="ml-2 text-xs text-slate-400">{t('drillHint')}</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 mb-6">
        {kpis.map(k => <Stat key={k.label} label={k.label} value={fmtNum(k.value, lang)} icon={k.icon} tone={k.tone} onClick={() => nav(k.to)} />)}
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <Card title={!div ? (lang === 'bn' ? 'বিভাগভিত্তিক চিত্র' : 'By Division') : !dist ? (lang === 'bn' ? 'জেলাভিত্তিক চিত্র' : 'By District') : (lang === 'bn' ? 'উপজেলাভিত্তিক চিত্র' : 'By Upazila')} subtitle={lang === 'bn' ? 'সারিতে ক্লিক করে drill-down করুন' : 'Click a row to drill down'} className="lg:col-span-2" padded={false}>
          <Table empty={rows.length === 0} head={<>
            <th className="th">{!div ? t('division') : !dist ? t('district') : t('upazila')}</th><th className="th text-right">{t('farmers')}</th><th className="th text-right">{t('farms')}</th><th className="th text-right">{lang === 'bn' ? 'মৎস্য' : 'Fish'}</th><th className="th text-right">{lang === 'bn' ? 'গবাদি' : 'Livestock'}</th><th className="th text-right">{lang === 'bn' ? 'পোল্ট্রি' : 'Poultry'}</th><th className="th text-right">{lang === 'bn' ? 'রোগ ৩০দিন' : 'Disease 30d'}</th><th className="th text-right">{lang === 'bn' ? 'কর্মকর্তা' : 'Officers'}</th>
          </>}>
            {rows.map(([k, r]) => (
              <tr key={k} className={`hover:bg-brand-50/40 ${!dist ? 'cursor-pointer' : ''}`} onClick={() => { if (!div) setDiv(k); else if (!dist) setDist(k) }}>
                <td className="td font-semibold bn">{nm(k)}{!dist && <ChevronRight size={14} className="inline ml-1 text-slate-300" />}</td>
                <td className="td text-right tabular-nums">{fmtNum(r.farmers, lang)}</td>
                <td className="td text-right tabular-nums">{fmtNum(r.farms, lang)}</td>
                <td className="td text-right tabular-nums">{fmtNum(r.fish, lang)}</td>
                <td className="td text-right tabular-nums">{fmtNum(r.livestock, lang)}</td>
                <td className="td text-right tabular-nums">{fmtNum(r.poultry, lang)}</td>
                <td className="td text-right tabular-nums">{r.disease > 0 ? <span className="text-red-600 font-semibold">{fmtNum(r.disease, lang)}</span> : '—'}</td>
                <td className="td text-right tabular-nums">{fmtNum(r.officers, lang)}</td>
              </tr>
            ))}
          </Table>
        </Card>
        <Card title={lang === 'bn' ? 'খামারের ধরন' : 'Farms by Type'}>
          <div className="h-56">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={byType.filter(x => x.value > 0)} dataKey="value" nameKey="name" innerRadius={52} outerRadius={80} paddingAngle={2} stroke="none">
                  {byType.filter(x => x.value > 0).map((x, i) => <Cell key={x.name} fill={[C.brand, C.amber, C.green, C.violet, C.sky, C.red, C.slate][i % 7]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs mt-1">
            {byType.filter(x => x.value > 0).map((x, i) => (
              <div key={x.name} className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: [C.brand, C.amber, C.green, C.violet, C.sky, C.red, C.slate][i % 7] }} />{x.name}<span className="ml-auto tabular-nums font-semibold">{x.value}</span></div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <Card title={lang === 'bn' ? 'ঔষধ ও ভ্যাকসিন বিতরণ · গত ৬ মাস' : 'Medicine & Vaccine Distribution · Last 6 Months'}>
          <div className="h-52">
            <ResponsiveContainer>
              <AreaChart data={distTrend} margin={{ left: -10, right: 8, top: 8 }}>
                <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.brand} stopOpacity=".35" /><stop offset="1" stopColor={C.brand} stopOpacity="0" /></linearGradient></defs>
                <CartesianGrid vertical={false} stroke="#eef2f7" />
                <XAxis dataKey="m" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip />
                <Area type="monotone" dataKey="qty" stroke={C.brand} strokeWidth={2} fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title={lang === 'bn' ? 'রোগের ঘটনা · গত ৩০ দিন · প্রজাতিভিত্তিক' : 'Disease Cases · Last 30 Days · By Species'}>
          <div className="h-52">
            <ResponsiveContainer>
              <BarChart data={diseaseBySp} margin={{ left: -10, right: 8, top: 8 }}>
                <CartesianGrid vertical={false} stroke="#eef2f7" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} />
                <Bar dataKey="cases" fill={C.red} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card title={lang === 'bn' ? 'মজুদ ঘাটতি সতর্কতা' : 'Low Stock Alerts'} actions={<Link to="/medicine" className="text-xs text-brand-600 font-semibold">{t('view')} →</Link>}>
          <ul className="space-y-2.5">
            {lowStock.length === 0 && <li className="text-sm text-slate-400 bn">{t('noData')}</li>}
            {lowStock.map((x, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <AlertTriangle size={15} className="text-amber-500 mt-0.5 shrink-0" />
                <div className="min-w-0"><div className="font-medium truncate">{x.med}</div><div className="text-xs text-slate-500 bn truncate">{x.store}</div></div>
                <div className="ml-auto text-right shrink-0"><div className="font-semibold tabular-nums text-amber-600">{fmtNum(x.qty, lang)}</div><div className="text-[11px] text-slate-400">min {fmtNum(x.min, lang)}</div></div>
              </li>
            ))}
          </ul>
        </Card>
        <Card title={lang === 'bn' ? 'মেয়াদ শেষ হচ্ছে · ৪৫ দিনের মধ্যে' : 'Expiring · Within 45 Days'} actions={<Link to="/medicine/batches" className="text-xs text-brand-600 font-semibold">{t('view')} →</Link>}>
          <ul className="space-y-2.5">
            {expiring.length === 0 && <li className="text-sm text-slate-400 bn">{t('noData')}</li>}
            {expiring.map(b => {
              const d = daysUntil(b.expiry)
              return (
                <li key={b.id} className="flex items-start gap-2 text-sm">
                  <CalendarClock size={15} className={`${d < 0 ? 'text-red-500' : 'text-amber-500'} mt-0.5 shrink-0`} />
                  <div className="min-w-0"><div className="font-medium truncate">{s.medicines.find(m => m.id === b.medicineId)?.name}</div><div className="text-xs text-slate-500 bn truncate">{b.batchNo} · {s.stores.find(x => x.id === b.storeId)?.name}</div></div>
                  <div className="ml-auto shrink-0">{d < 0 ? <Badge tone="Expired">{t('expired')}</Badge> : <Badge tone="Pending">{fmtNum(d, lang)} {lang === 'bn' ? 'দিন' : 'days'}</Badge>}</div>
                </li>
              )
            })}
          </ul>
        </Card>
        <div className="space-y-4">
          <Card title={lang === 'bn' ? 'আজকের উপস্থিতি' : "Today's Attendance"} actions={<Link to="/field/monitoring" className="text-xs text-brand-600 font-semibold">{t('view')} →</Link>}>
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { k: t('present'), v: attToday.filter(a => a.status === 'Present').length, c: 'text-emerald-600' },
                { k: t('late'), v: attToday.filter(a => a.status === 'Late').length, c: 'text-amber-600' },
                { k: t('onLeave'), v: attToday.filter(a => a.status === 'Leave').length, c: 'text-violet-600' },
                { k: t('fieldVisit'), v: attToday.filter(a => a.mode === 'Field').length, c: 'text-brand-600' },
              ].map(x => <div key={x.k}><div className={`text-xl font-bold tabular-nums ${x.c}`}>{fmtNum(x.v, lang)}</div><div className="text-[11px] text-slate-500 bn">{x.k}</div></div>)}
            </div>
          </Card>
          <Card title={lang === 'bn' ? 'আসন্ন প্রশিক্ষণ' : 'Upcoming Trainings'} actions={<Link to="/training" className="text-xs text-brand-600 font-semibold">{t('view')} →</Link>}>
            <ul className="space-y-2">
              {upcoming.map(x => (
                <li key={x.id}><Link to={`/training/${x.id}`} className="flex items-center gap-2 text-sm hover:text-brand-700"><GraduationCap size={14} className="text-brand-500 shrink-0" /><span className="truncate font-medium">{x.title}</span><span className="ml-auto text-xs text-slate-500 shrink-0 bn">{fmtDate(x.date, lang)}</span></Link></li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <Card title={lang === 'bn' ? 'সাম্প্রতিক খামার পরিদর্শন' : 'Recent Field Visits'} className="mt-4" padded={false} actions={<Link to="/visits" className="text-xs text-brand-600 font-semibold">{t('view')} →</Link>}>
        <Table head={<><th className="th">ID</th><th className="th">{t('date')}</th><th className="th">{t('farmers')}</th><th className="th">{t('farms')}</th><th className="th">{lang === 'bn' ? 'কর্মকর্তা' : 'Officer'}</th><th className="th">{lang === 'bn' ? 'রোগ' : 'Disease'}</th><th className="th">{t('status')}</th></>}>
          {recentVisits.map(v => (
            <tr key={v.id} className="hover:bg-brand-50/40 cursor-pointer" onClick={() => nav(`/visits/${v.id}`)}>
              <td className="td font-mono text-xs">{v.id}</td>
              <td className="td bn">{fmtDate(v.date, lang)}</td>
              <td className="td bn">{s.farmers.find(f => f.id === v.farmerId)?.name}</td>
              <td className="td font-mono text-xs">{v.farmId}</td>
              <td className="td bn">{s.employees.find(e => e.id === v.employeeId)?.name}</td>
              <td className="td">{v.disease ? <Badge tone={v.severity ?? 'Medium'}>{v.disease}</Badge> : <span className="text-slate-400">—</span>}</td>
              <td className="td"><Badge>{v.status}</Badge></td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  )
}
