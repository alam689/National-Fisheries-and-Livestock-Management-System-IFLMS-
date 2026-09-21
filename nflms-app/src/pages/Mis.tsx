import { useMemo, useState } from 'react'
import { Download, Printer } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { useStore } from '../store/store'
import { useT } from '../i18n'
import { fmtNum, addDays, todayISO, fmtDate } from '../lib/format'
import { DIVISIONS, bnName } from '../data/geo'
import { PageHeader, Card, Table, Select, Tabs } from '../components/ui'

function csv(rows: (string | number)[][], name: string) {
  const text = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8' })); a.download = name; a.click()
}

export default function MisPage() {
  const { t, lang } = useT()
  const s = useStore()
  const [tab, setTab] = useState('registry')
  const [period, setPeriod] = useState('90')
  const since = addDays(todayISO(), -Number(period))
  const nm = (n: string) => (lang === 'bn' ? bnName(n) : n)

  const districts = useMemo(() => DIVISIONS.flatMap(d => d.districts.map(x => ({ division: d.name, district: x.name }))).filter(d => s.farms.some(f => f.location.district === d.district)), [s.farms])

  const registry = districts.map(d => {
    const farms = s.farms.filter(f => f.location.district === d.district)
    return { division: d.division, district: d.district, farmers: s.farmers.filter(f => f.location.district === d.district).length, farms: farms.length, fish: farms.filter(f => f.type === 'Fish').length, cattle: farms.filter(f => f.type === 'Cattle' || f.type === 'Dairy').length, poultry: farms.filter(f => f.type === 'Poultry' || f.type === 'Duck').length, goat: farms.filter(f => f.type === 'Goat/Sheep').length, mixed: farms.filter(f => f.type === 'Mixed').length, month: s.farms.filter(f => f.location.district === d.district && f.registeredAt >= since).length }
  })
  const service = districts.map(d => {
    const farmIds = new Set(s.farms.filter(f => f.location.district === d.district).map(f => f.id))
    const visits = s.visits.filter(v => farmIds.has(v.farmId) && v.date >= since)
    const dist = s.txns.filter(x => x.type === 'Distribute' && x.farmId && farmIds.has(x.farmId) && x.date >= since)
    const vacc = dist.filter(x => s.medicines.find(m => m.id === x.medicineId)?.category === 'Vaccine').reduce((a, x) => a + x.qty, 0)
    const dr = s.diseaseReports.filter(r => r.district === d.district && r.date >= since)
    const tr = s.trainings.filter(x => x.district === d.district && x.status === 'Completed' && x.date >= since)
    const trained = s.enrollments.filter(e => e.attended && tr.some(x => x.id === e.trainingId)).length
    return { district: d.district, visits: visits.length, disease: visits.filter(v => v.disease).length, medQty: dist.reduce((a, x) => a + x.qty, 0), vacc, cases: dr.reduce((a, r) => a + r.cases, 0), deaths: dr.reduce((a, r) => a + r.deaths, 0), trainings: tr.length, trained }
  })
  const hr = useMemo(() => {
    const emps = s.employees.filter(e => e.active && e.role !== 'admin' && e.role !== 'ministry')
    return [...new Set(emps.map(e => e.station.district))].map(d => {
      const es = emps.filter(e => e.station.district === d)
      const att = s.attendance.filter(a => es.some(e => e.id === a.employeeId) && a.date >= since)
      const total = att.length || 1
      return { district: d, officers: es.length, present: att.filter(a => a.status === 'Present').length, late: att.filter(a => a.status === 'Late').length, absent: att.filter(a => a.status === 'Absent').length, leave: att.filter(a => a.status === 'Leave').length, tour: att.filter(a => a.status === 'Tour').length, field: att.filter(a => a.mode === 'Field').length, rate: Math.round(((att.filter(a => a.status === 'Present' || a.status === 'Late').length) / total) * 100), visits: s.visits.filter(v => es.some(e => e.id === v.employeeId) && v.date >= since).length }
    })
  }, [s.employees, s.attendance, s.visits, since])

  const chart = service.map(x => ({ name: nm(x.district), [lang === 'bn' ? 'পরিদর্শন' : 'Visits']: x.visits, [lang === 'bn' ? 'রোগের ঘটনা' : 'Disease cases']: x.cases, [lang === 'bn' ? 'প্রশিক্ষিত' : 'Trained']: x.trained }))
  const k1 = lang === 'bn' ? 'পরিদর্শন' : 'Visits', k2 = lang === 'bn' ? 'রোগের ঘটনা' : 'Disease cases', k3 = lang === 'bn' ? 'প্রশিক্ষিত' : 'Trained'

  const exportCsv = () => {
    if (tab === 'registry') csv([['Division', 'District', 'Farmers', 'Farms', 'Fish', 'Cattle/Dairy', 'Poultry/Duck', 'Goat/Sheep', 'Mixed', `New (${period}d)`], ...registry.map(r => [r.division, r.district, r.farmers, r.farms, r.fish, r.cattle, r.poultry, r.goat, r.mixed, r.month])], `nflms-registry-${todayISO()}.csv`)
    else if (tab === 'service') csv([['District', 'Visits', 'Disease visits', 'Medicine qty', 'Vaccine doses', 'Disease cases', 'Deaths', 'Trainings', 'Farmers trained'], ...service.map(r => [r.district, r.visits, r.disease, r.medQty, r.vacc, r.cases, r.deaths, r.trainings, r.trained])], `nflms-service-${todayISO()}.csv`)
    else csv([['District', 'Officers', 'Present', 'Late', 'Absent', 'Leave', 'Tour', 'Field days', 'Attendance %', 'Visits'], ...hr.map(r => [r.district, r.officers, r.present, r.late, r.absent, r.leave, r.tour, r.field, r.rate, r.visits])], `nflms-hr-${todayISO()}.csv`)
  }

  return (
    <div>
      <PageHeader kicker="MODULE 06 · MANAGEMENT DASHBOARD & MIS" title={lang === 'bn' ? 'জাতীয় MIS রিপোর্ট' : 'National MIS Reports'} subtitle={`${lang === 'bn' ? 'সময়কাল' : 'Period'}: ${fmtDate(since, lang)} — ${fmtDate(todayISO(), lang)}`}
        actions={<><Select value={period} onChange={setPeriod} options={[{ value: '30', label: lang === 'bn' ? 'গত ৩০ দিন' : 'Last 30 days' }, { value: '90', label: lang === 'bn' ? 'গত ৯০ দিন' : 'Last 90 days' }, { value: '365', label: lang === 'bn' ? 'গত ১ বছর' : 'Last year' }]} /><button className="btn-secondary" onClick={() => window.print()}><Printer size={15} /> Print</button><button className="btn-primary" onClick={exportCsv}><Download size={15} /> CSV</button></>} />
      <Card className="mb-5" title={lang === 'bn' ? 'জেলাভিত্তিক সেবা সারাংশ' : 'District Service Summary'}>
        <div className="h-64"><ResponsiveContainer><BarChart data={chart} margin={{ left: -10, right: 8, top: 8 }}><CartesianGrid vertical={false} stroke="#eef2f7" /><XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} /><YAxis tickLine={false} axisLine={false} fontSize={12} /><Tooltip cursor={{ fill: '#f1f5f9' }} /><Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} /><Bar dataKey={k1} fill="#2f62d9" radius={[4, 4, 0, 0]} /><Bar dataKey={k2} fill="#ef4444" radius={[4, 4, 0, 0]} /><Bar dataKey={k3} fill="#10b981" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
      </Card>
      <Tabs value={tab} onChange={setTab} tabs={[{ key: 'registry', label: lang === 'bn' ? 'নিবন্ধন রিপোর্ট' : 'Registry Report' }, { key: 'service', label: lang === 'bn' ? 'সেবা ও সরবরাহ রিপোর্ট' : 'Service & Supply Report' }, { key: 'hr', label: lang === 'bn' ? 'মাঠ কর্মী রিপোর্ট' : 'Field Force Report' }]} />
      {tab === 'registry' && <Card padded={false}><Table head={<><th className="th">{t('division')}</th><th className="th">{t('district')}</th><th className="th text-right">{t('farmers')}</th><th className="th text-right">{t('farms')}</th><th className="th text-right">Fish</th><th className="th text-right">Cattle/Dairy</th><th className="th text-right">Poultry/Duck</th><th className="th text-right">Goat/Sheep</th><th className="th text-right">Mixed</th><th className="th text-right">{lang === 'bn' ? 'নতুন' : 'New'}</th></>}>
        {registry.map(r => <tr key={r.district}><td className="td bn">{nm(r.division)}</td><td className="td bn font-semibold">{nm(r.district)}</td><td className="td text-right tabular-nums">{fmtNum(r.farmers, lang)}</td><td className="td text-right tabular-nums font-semibold">{fmtNum(r.farms, lang)}</td><td className="td text-right tabular-nums">{fmtNum(r.fish, lang)}</td><td className="td text-right tabular-nums">{fmtNum(r.cattle, lang)}</td><td className="td text-right tabular-nums">{fmtNum(r.poultry, lang)}</td><td className="td text-right tabular-nums">{fmtNum(r.goat, lang)}</td><td className="td text-right tabular-nums">{fmtNum(r.mixed, lang)}</td><td className="td text-right tabular-nums text-emerald-600">+{fmtNum(r.month, lang)}</td></tr>)}
        <tr className="bg-slate-50 font-bold"><td className="td" colSpan={2}>{t('total')}</td>{(['farmers', 'farms', 'fish', 'cattle', 'poultry', 'goat', 'mixed', 'month'] as const).map(k => <td key={k} className="td text-right tabular-nums">{fmtNum(registry.reduce((a, r) => a + r[k], 0), lang)}</td>)}</tr>
      </Table></Card>}
      {tab === 'service' && <Card padded={false}><Table head={<><th className="th">{t('district')}</th><th className="th text-right">{t('visits')}</th><th className="th text-right">{lang === 'bn' ? 'রোগ পরিদর্শন' : 'Disease visits'}</th><th className="th text-right">{lang === 'bn' ? 'ঔষধ (একক)' : 'Medicine (units)'}</th><th className="th text-right">{lang === 'bn' ? 'ভ্যাকসিন (ডোজ)' : 'Vaccine (doses)'}</th><th className="th text-right">{lang === 'bn' ? 'রোগের ঘটনা' : 'Disease cases'}</th><th className="th text-right">{lang === 'bn' ? 'মৃত্যু' : 'Deaths'}</th><th className="th text-right">{t('trainings')}</th><th className="th text-right">{lang === 'bn' ? 'প্রশিক্ষিত খামারি' : 'Farmers trained'}</th></>}>
        {service.map(r => <tr key={r.district}><td className="td bn font-semibold">{nm(r.district)}</td><td className="td text-right tabular-nums">{fmtNum(r.visits, lang)}</td><td className="td text-right tabular-nums">{fmtNum(r.disease, lang)}</td><td className="td text-right tabular-nums">{fmtNum(r.medQty, lang)}</td><td className="td text-right tabular-nums">{fmtNum(r.vacc, lang)}</td><td className="td text-right tabular-nums text-red-600">{fmtNum(r.cases, lang)}</td><td className="td text-right tabular-nums">{fmtNum(r.deaths, lang)}</td><td className="td text-right tabular-nums">{fmtNum(r.trainings, lang)}</td><td className="td text-right tabular-nums text-emerald-600">{fmtNum(r.trained, lang)}</td></tr>)}
        <tr className="bg-slate-50 font-bold"><td className="td">{t('total')}</td>{(['visits', 'disease', 'medQty', 'vacc', 'cases', 'deaths', 'trainings', 'trained'] as const).map(k => <td key={k} className="td text-right tabular-nums">{fmtNum(service.reduce((a, r) => a + r[k], 0), lang)}</td>)}</tr>
      </Table></Card>}
      {tab === 'hr' && <Card padded={false}><Table head={<><th className="th">{t('district')}</th><th className="th text-right">{lang === 'bn' ? 'কর্মকর্তা' : 'Officers'}</th><th className="th text-right">{t('present')}</th><th className="th text-right">{t('late')}</th><th className="th text-right">{t('absent')}</th><th className="th text-right">{t('leave')}</th><th className="th text-right">{t('tour')}</th><th className="th text-right">{lang === 'bn' ? 'মাঠ দিবস' : 'Field days'}</th><th className="th text-right">{lang === 'bn' ? 'উপস্থিতি %' : 'Attendance %'}</th><th className="th text-right">{t('visits')}</th></>}>
        {hr.map(r => <tr key={r.district}><td className="td bn font-semibold">{nm(r.district)}</td><td className="td text-right tabular-nums">{fmtNum(r.officers, lang)}</td><td className="td text-right tabular-nums text-emerald-600">{fmtNum(r.present, lang)}</td><td className="td text-right tabular-nums text-amber-600">{fmtNum(r.late, lang)}</td><td className="td text-right tabular-nums text-red-600">{fmtNum(r.absent, lang)}</td><td className="td text-right tabular-nums">{fmtNum(r.leave, lang)}</td><td className="td text-right tabular-nums">{fmtNum(r.tour, lang)}</td><td className="td text-right tabular-nums">{fmtNum(r.field, lang)}</td><td className="td text-right tabular-nums font-semibold">{fmtNum(r.rate, lang)}%</td><td className="td text-right tabular-nums">{fmtNum(r.visits, lang)}</td></tr>)}
      </Table></Card>}
    </div>
  )
}
