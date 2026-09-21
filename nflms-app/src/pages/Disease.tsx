import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, Flame, TrendingUp, MapPin } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, Legend } from 'recharts'
import { useStore } from '../store/store'
import { useT } from '../i18n'
import { fmtDate, fmtNum, addDays, todayISO } from '../lib/format'
import { bnName } from '../data/geo'
import { PageHeader, Card, Badge, Table, Stat, Select } from '../components/ui'

export default function DiseasePage() {
  const { t, lang } = useT()
  const s = useStore()
  const [days, setDays] = useState('30')
  const [sp, setSp] = useState('')
  const since = addDays(todayISO(), -Number(days))
  const nm = (n: string) => (lang === 'bn' ? bnName(n) : n)
  const reports = s.diseaseReports.filter(r => r.date >= since && (!sp || r.species === sp)).sort((a, b) => b.date.localeCompare(a.date))
  const last7 = s.diseaseReports.filter(r => r.date >= addDays(todayISO(), -7))
  const bySp = (x: string) => last7.filter(r => r.species === x).reduce((a, r) => a + r.cases, 0)

  // hotspot detection: upazilas whose case count in the last 14 days is >= 2x the prior 14 days (min 3 cases)
  const hotspots = useMemo(() => {
    const d14 = addDays(todayISO(), -14), d28 = addDays(todayISO(), -28)
    const cur = new Map<string, number>(), prev = new Map<string, number>()
    s.diseaseReports.forEach(r => { const k = `${r.upazila}|${r.district}`; if (r.date >= d14) cur.set(k, (cur.get(k) ?? 0) + r.cases); else if (r.date >= d28) prev.set(k, (prev.get(k) ?? 0) + r.cases) })
    return [...cur.entries()].map(([k, c]) => ({ k, cur: c, prev: prev.get(k) ?? 0, ratio: c / Math.max(1, prev.get(k) ?? 0) })).filter(x => x.cur >= 3 && x.ratio >= 1.5).sort((a, b) => b.ratio - a.ratio).slice(0, 6)
  }, [s.diseaseReports])

  const trend = useMemo(() => {
    const out: { w: string; Cattle: number; Poultry: number; Fish: number; Goat: number }[] = []
    for (let i = 7; i >= 0; i--) {
      const from = addDays(todayISO(), -(i + 1) * 7), to = addDays(todayISO(), -i * 7)
      const rs = s.diseaseReports.filter(r => r.date > from && r.date <= to)
      out.push({ w: `W-${i}`, Cattle: rs.filter(r => r.species === 'Cattle').reduce((a, r) => a + r.cases, 0), Poultry: rs.filter(r => r.species === 'Poultry').reduce((a, r) => a + r.cases, 0), Fish: rs.filter(r => r.species === 'Fish').reduce((a, r) => a + r.cases, 0), Goat: rs.filter(r => r.species === 'Goat').reduce((a, r) => a + r.cases, 0) })
    }
    return out
  }, [s.diseaseReports])
  const byDisease = useMemo(() => { const m = new Map<string, number>(); reports.forEach(r => m.set(r.disease, (m.get(r.disease) ?? 0) + r.cases)); return [...m.entries()].map(([name, cases]) => ({ name, cases })).sort((a, b) => b.cases - a.cases).slice(0, 8) }, [reports])
  const medUse = useMemo(() => { const m = new Map<string, number>(); s.txns.filter(x => x.type === 'Distribute' && x.disease && x.date >= since).forEach(x => m.set(x.disease!, (m.get(x.disease!) ?? 0) + x.qty)); return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6) }, [s.txns, since])

  return (
    <div>
      <PageHeader kicker="PHASE-2 · DISEASE SURVEILLANCE" title={lang === 'bn' ? 'রোগ ছড়ানোর আগেই জানা' : 'Know before it spreads'} subtitle={lang === 'bn' ? 'মাঠ থেকে আসা রোগের রিপোর্ট একত্র করে system নিজেই চিহ্নিত করবে কোথায় ঘটনা দ্রুত বাড়ছে।' : 'Field reports are pooled and the system flags where cases are rising fast.'} />
      <div className="grid grid-cols-3 gap-3 mb-5">
        <Stat label={lang === 'bn' ? 'গবাদিপশুর রোগ · ৭ দিন' : 'Cattle disease · 7 days'} value={fmtNum(bySp('Cattle') + bySp('Goat'), lang)} tone="amber" icon={<Activity size={16} />} />
        <Stat label={lang === 'bn' ? 'পোল্ট্রির রোগ · ৭ দিন' : 'Poultry disease · 7 days'} value={fmtNum(bySp('Poultry') + bySp('Duck'), lang)} tone="violet" icon={<Activity size={16} />} />
        <Stat label={lang === 'bn' ? 'মাছের রোগ · ৭ দিন' : 'Fish disease · 7 days'} value={fmtNum(bySp('Fish'), lang)} tone="brand" icon={<Activity size={16} />} />
      </div>
      <div className="grid lg:grid-cols-3 gap-4 mb-5">
        <Card title={lang === 'bn' ? 'Disease Hotspot' : 'Disease Hotspots'} subtitle={lang === 'bn' ? 'গত ১৪ দিনে আগের ১৪ দিনের তুলনায় দ্রুত বাড়ছে' : 'Rising fast vs. the previous 14 days'}>
          {hotspots.length === 0 ? <p className="text-sm text-slate-400 bn">{lang === 'bn' ? 'কোনো hotspot শনাক্ত হয়নি' : 'No hotspot detected'}</p> : (
            <ul className="space-y-2.5">{hotspots.map(h => { const [up, dist] = h.k.split('|'); return <li key={h.k} className="flex items-center gap-2 text-sm"><Flame size={16} className="text-red-500 shrink-0" /><div className="min-w-0"><div className="font-semibold bn">{nm(up)}</div><div className="text-xs text-slate-500 bn">{nm(dist)}</div></div><div className="ml-auto text-right"><div className="font-bold text-red-600 tabular-nums">{fmtNum(h.cur, lang)}</div><div className="text-[11px] text-slate-400"><TrendingUp size={10} className="inline" /> {h.prev ? `${h.ratio.toFixed(1)}×` : 'new'}</div></div></li> })}</ul>
          )}
        </Card>
        <Card className="lg:col-span-2" title={lang === 'bn' ? 'সাপ্তাহিক Disease Trend · প্রজাতিভিত্তিক' : 'Weekly Disease Trend · By Species'}>
          <div className="h-56">
            <ResponsiveContainer>
              <LineChart data={trend} margin={{ left: -10, right: 8, top: 8 }}>
                <CartesianGrid vertical={false} stroke="#eef2f7" /><XAxis dataKey="w" tickLine={false} axisLine={false} fontSize={12} /><YAxis tickLine={false} axisLine={false} fontSize={12} /><Tooltip /><Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="Cattle" stroke="#f59e0b" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="Poultry" stroke="#8b5cf6" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="Fish" stroke="#2f62d9" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="Goat" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      <div className="grid lg:grid-cols-3 gap-4 mb-5">
        <Card className="lg:col-span-2" title={lang === 'bn' ? 'রোগভিত্তিক ঘটনা' : 'Cases by Disease'}>
          <div className="h-56"><ResponsiveContainer><BarChart data={byDisease} layout="vertical" margin={{ left: 30, right: 16 }}><CartesianGrid horizontal={false} stroke="#eef2f7" /><XAxis type="number" tickLine={false} axisLine={false} fontSize={12} /><YAxis type="category" dataKey="name" tickLine={false} axisLine={false} fontSize={12} width={90} /><Tooltip cursor={{ fill: '#f1f5f9' }} /><Bar dataKey="cases" fill="#ef4444" radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer></div>
        </Card>
        <Card title={lang === 'bn' ? 'রোগভিত্তিক ঔষধ ব্যবহার' : 'Medicine Use by Disease'} subtitle={lang === 'bn' ? 'বিতরণ তথ্যের সাথে যুক্ত' : 'Linked with distribution data'}>
          <ul className="space-y-2">{medUse.map(([d, q]) => <li key={d} className="flex items-center text-sm"><span className="font-medium">{d}</span><span className="ml-auto tabular-nums font-semibold">{fmtNum(q, lang)}</span></li>)}{medUse.length === 0 && <li className="text-sm text-slate-400">—</li>}</ul>
        </Card>
      </div>
      <Card padded={false} title={lang === 'bn' ? 'রোগের রিপোর্ট' : 'Disease Reports'} actions={<div className="flex gap-2"><Select value={sp} placeholder={lang === 'bn' ? 'সকল প্রজাতি' : 'All species'} onChange={setSp} options={['Cattle', 'Goat', 'Poultry', 'Duck', 'Fish'].map(x => ({ value: x, label: x }))} /><Select value={days} onChange={setDays} options={[{ value: '7', label: '7d' }, { value: '30', label: '30d' }, { value: '90', label: '90d' }]} /></div>}>
        <Table empty={reports.length === 0} head={<><th className="th">{t('date')}</th><th className="th">{t('upazila')}</th><th className="th">{lang === 'bn' ? 'প্রজাতি' : 'Species'}</th><th className="th">{lang === 'bn' ? 'রোগ' : 'Disease'}</th><th className="th text-right">{lang === 'bn' ? 'আক্রান্ত' : 'Cases'}</th><th className="th text-right">{lang === 'bn' ? 'মৃত' : 'Deaths'}</th><th className="th">{lang === 'bn' ? 'খামার' : 'Farm'}</th><th className="th">{lang === 'bn' ? 'রিপোর্টকারী' : 'Reported by'}</th></>}>
          {reports.map(r => (
            <tr key={r.id}><td className="td bn">{fmtDate(r.date, lang)}</td><td className="td bn"><MapPin size={12} className="inline text-slate-400 mr-1" />{nm(r.upazila)}, {nm(r.district)}</td><td className="td">{r.species}</td><td className="td"><Badge tone="High">{r.disease}</Badge></td><td className="td text-right tabular-nums font-semibold">{fmtNum(r.cases, lang)}</td><td className="td text-right tabular-nums">{fmtNum(r.deaths, lang)}</td><td className="td"><Link to={`/farms/${r.farmId}`} className="font-mono text-xs text-brand-700 hover:underline">{r.farmId}</Link>{r.visitId && <Link to={`/visits/${r.visitId}`} className="ml-2 text-xs text-slate-400 hover:text-brand-700">{r.visitId}</Link>}</td><td className="td bn text-xs">{s.employees.find(e => e.id === r.reportedBy)?.name}</td></tr>
          ))}
        </Table>
      </Card>
    </div>
  )
}
