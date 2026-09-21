import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { LogIn, LogOut, MapPin, Camera, Building, Tent, Check, X, Plus, Clock, CalendarOff, Briefcase, UserCog } from 'lucide-react'
import { useStore, useMe } from '../store/store'
import { useT } from '../i18n'
import { fmtDate, fmtTime, fmtNum, todayISO, addDays } from '../lib/format'
import { bnName } from '../data/geo'
import type { Employee, Leave, Tour, Location } from '../types'
import { PageHeader, Card, Badge, Table, Field, Select, Stat, Modal, useToast, Tabs, SearchBox } from '../components/ui'
import { LocationPicker, emptyLocation, useGeo } from '../components/LocationPicker'

// ---------------- Attendance ----------------
export function AttendancePage() {
  const { t, lang } = useT()
  const s = useStore()
  const me = useMe()!
  const geo = useGeo()
  const toast = useToast()
  const [mode, setMode] = useState<'Office' | 'Field'>('Office')
  const [selfie, setSelfie] = useState(false)
  const [busy, setBusy] = useState(false)
  const [month, setMonth] = useState(todayISO().slice(0, 7))
  const today = todayISO()
  const mine = s.attendance.find(a => a.employeeId === me.id && a.date === today)
  const history = s.attendance.filter(a => a.employeeId === me.id && a.date.startsWith(month)).sort((a, b) => b.date.localeCompare(a.date))
  const cnt = (st: string) => history.filter(a => a.status === st).length
  const doIn = async () => { setBusy(true); const g = await geo.get(); s.checkIn({ mode, lat: g.lat, lng: g.lng, selfie }); setBusy(false); toast.push(`${t('checkIn')} ✓ ${g.lat}, ${g.lng}`) }
  const doOut = async () => { setBusy(true); const g = await geo.get(); s.checkOut({ lat: g.lat, lng: g.lng }); setBusy(false); toast.push(`${t('checkOut')} ✓`) }
  return (
    <div>
      <PageHeader kicker="MODULE 03 · FIELD FORCE MANAGEMENT" title={lang === 'bn' ? 'শুধু উপস্থিতি নয় — কাজের প্রমাণ' : 'Not just attendance — proof of work'} subtitle={lang === 'bn' ? 'প্রতিটি entry-র সাথে যুক্ত থাকবে GPS অবস্থান, সময়, Selfie (প্রয়োজন হলে) এবং অফিস না মাঠ তা চিহ্নিত।' : 'Every entry carries GPS, time, optional selfie and whether it was office or field.'} />
      <div className="grid lg:grid-cols-3 gap-4 mb-5">
        <Card className="lg:col-span-1" title={`${t('checkIn')} / ${t('checkOut')}`} subtitle={fmtDate(today, lang)}>
          {!mine?.checkIn ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setMode('Office')} className={`rounded-lg border p-3 text-sm font-semibold flex flex-col items-center gap-1 ${mode === 'Office' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200'}`}><Building size={18} />{lang === 'bn' ? 'অফিস' : 'Office'}</button>
                <button onClick={() => setMode('Field')} className={`rounded-lg border p-3 text-sm font-semibold flex flex-col items-center gap-1 ${mode === 'Field' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200'}`}><Tent size={18} />{lang === 'bn' ? 'মাঠ' : 'Field'}</button>
              </div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={selfie} onChange={e => setSelfie(e.target.checked)} className="rounded" /><Camera size={15} className="text-slate-400" />{lang === 'bn' ? 'Selfie সংযুক্ত করুন' : 'Attach selfie'}</label>
              <button className="btn-primary w-full h-12 text-base" disabled={busy} onClick={doIn}><LogIn size={18} /> {t('checkIn')}</button>
              <p className="text-xs text-slate-400 bn flex items-center gap-1"><MapPin size={12} />{lang === 'bn' ? 'চেক ইন করলে GPS অবস্থান ও সময় স্বয়ংক্রিয়ভাবে রেকর্ড হবে' : 'GPS location and time are recorded automatically'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm">
                <div className="flex items-center gap-2 font-semibold text-emerald-700"><Check size={16} /> {t('checkIn')} · {fmtTime(mine.checkIn, lang)} <Badge>{mine.status}</Badge></div>
                <div className="text-xs text-emerald-700/80 mt-1 flex items-center gap-1"><MapPin size={12} />{mine.inLat}, {mine.inLng} · {mine.mode}{mine.selfie && ' · Selfie ✓'}</div>
              </div>
              {mine.checkOut ? (
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-sm"><div className="flex items-center gap-2 font-semibold"><LogOut size={16} /> {t('checkOut')} · {fmtTime(mine.checkOut, lang)}</div><div className="text-xs text-slate-500 mt-1"><MapPin size={12} className="inline" /> {mine.outLat}, {mine.outLng}</div></div>
              ) : <button className="btn-secondary w-full h-12 text-base" disabled={busy} onClick={doOut}><LogOut size={18} /> {t('checkOut')}</button>}
            </div>
          )}
        </Card>
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3 content-start">
          <Stat label={t('present')} value={fmtNum(cnt('Present'), lang)} tone="green" />
          <Stat label={t('late')} value={fmtNum(cnt('Late'), lang)} tone="amber" />
          <Stat label={t('absent')} value={fmtNum(cnt('Absent'), lang)} tone="red" />
          <Stat label={`${t('leave')} / ${t('tour')}`} value={fmtNum(cnt('Leave') + cnt('Tour'), lang)} tone="violet" />
          <Stat label={lang === 'bn' ? 'মাঠ দিবস' : 'Field days'} value={fmtNum(history.filter(a => a.mode === 'Field').length, lang)} />
          <Stat label={lang === 'bn' ? 'এ মাসে পরিদর্শন' : 'Visits this month'} value={fmtNum(s.visits.filter(v => v.employeeId === me.id && v.date.startsWith(month)).length, lang)} tone="brand" />
          <div className="col-span-2"><Field label={lang === 'bn' ? 'মাস' : 'Month'}><input className="input" type="month" value={month} onChange={e => setMonth(e.target.value)} /></Field></div>
        </div>
      </div>
      <Card padded={false} title={lang === 'bn' ? 'আমার উপস্থিতি' : 'My Attendance'}>
        <Table empty={history.length === 0} head={<><th className="th">{t('date')}</th><th className="th">{t('status')}</th><th className="th">{t('checkIn')}</th><th className="th">{t('checkOut')}</th><th className="th">{lang === 'bn' ? 'ধরন' : 'Mode'}</th><th className="th">GPS</th><th className="th">Selfie</th></>}>
          {history.map(a => <tr key={a.id}><td className="td bn">{fmtDate(a.date, lang)}</td><td className="td"><Badge>{a.status}</Badge></td><td className="td tabular-nums">{fmtTime(a.checkIn, lang)}</td><td className="td tabular-nums">{fmtTime(a.checkOut, lang)}</td><td className="td">{a.checkIn ? a.mode : '—'}</td><td className="td text-xs text-slate-500">{a.inLat ? `${a.inLat.toFixed(3)}, ${a.inLng?.toFixed(3)}` : '—'}</td><td className="td">{a.selfie ? <Camera size={14} className="text-brand-600" /> : '—'}</td></tr>)}
        </Table>
      </Card>
    </div>
  )
}

// ---------------- Leave ----------------
export function LeavePage() {
  const { t, lang } = useT()
  const s = useStore()
  const me = useMe()!
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [f, setF] = useState<Omit<Leave, 'id' | 'status' | 'employeeId'>>({ type: 'Casual', from: todayISO(), to: todayISO(), reason: '' })
  const canApprove = me.role === 'admin' || me.role === 'district' || me.role === 'upazila'
  const list = s.leaves.filter(l => canApprove ? true : l.employeeId === me.id).sort((a, b) => b.from.localeCompare(a.from))
  return (
    <div>
      <PageHeader kicker="MODULE 03 · LEAVE" title={t('leave')} actions={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={15} /> {lang === 'bn' ? 'ছুটির আবেদন' : 'Apply for Leave'}</button>} />
      <Card padded={false}>
        <Table empty={list.length === 0} head={<><th className="th">ID</th><th className="th">{lang === 'bn' ? 'কর্মকর্তা' : 'Employee'}</th><th className="th">{t('type')}</th><th className="th">{lang === 'bn' ? 'থেকে' : 'From'}</th><th className="th">{lang === 'bn' ? 'পর্যন্ত' : 'To'}</th><th className="th">{lang === 'bn' ? 'কারণ' : 'Reason'}</th><th className="th">{t('status')}</th>{canApprove && <th className="th">{t('actions')}</th>}</>}>
          {list.map(l => <tr key={l.id}><td className="td font-mono text-xs">{l.id}</td><td className="td bn">{s.employees.find(e => e.id === l.employeeId)?.name}</td><td className="td">{l.type}</td><td className="td bn">{fmtDate(l.from, lang)}</td><td className="td bn">{fmtDate(l.to, lang)}</td><td className="td bn">{l.reason}</td><td className="td"><Badge>{l.status}</Badge></td>
            {canApprove && <td className="td">{l.status === 'Pending' && l.employeeId !== me.id && <div className="flex gap-1"><button className="btn-primary py-1 px-2 text-xs" onClick={() => { s.decideLeave(l.id, 'Approved'); toast.push('Approved') }}><Check size={13} /></button><button className="btn-secondary py-1 px-2 text-xs text-red-600" onClick={() => { s.decideLeave(l.id, 'Rejected'); toast.push('Rejected', 'info') }}><X size={13} /></button></div>}</td>}
          </tr>)}
        </Table>
      </Card>
      <Modal open={open} onClose={() => setOpen(false)} title={lang === 'bn' ? 'ছুটির আবেদন' : 'Leave Application'} footer={<><button className="btn-secondary" onClick={() => setOpen(false)}>{t('cancel')}</button><button className="btn-primary" onClick={() => { if (!f.reason.trim() || f.to < f.from) { toast.push(lang === 'bn' ? 'কারণ ও সঠিক তারিখ দিন' : 'Reason and valid dates required', 'warn'); return } s.applyLeave({ ...f, employeeId: me.id }); toast.push(lang === 'bn' ? 'আবেদন জমা হয়েছে' : 'Application submitted'); setOpen(false) }}>{t('submit')}</button></>}>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label={t('type')}><Select value={f.type} onChange={v => setF({ ...f, type: v as Leave['type'] })} options={['Casual', 'Earned', 'Medical', 'Other'].map(x => ({ value: x, label: x }))} /></Field>
          <div />
          <Field label={lang === 'bn' ? 'থেকে' : 'From'} required><input className="input" type="date" value={f.from} onChange={e => setF({ ...f, from: e.target.value })} /></Field>
          <Field label={lang === 'bn' ? 'পর্যন্ত' : 'To'} required><input className="input" type="date" value={f.to} min={f.from} onChange={e => setF({ ...f, to: e.target.value })} /></Field>
          <Field label={lang === 'bn' ? 'কারণ' : 'Reason'} required className="sm:col-span-2"><textarea className="input bn" rows={3} value={f.reason} onChange={e => setF({ ...f, reason: e.target.value })} /></Field>
        </div>
      </Modal>
    </div>
  )
}

// ---------------- Tour ----------------
export function TourPage() {
  const { t, lang } = useT()
  const s = useStore()
  const me = useMe()!
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [f, setF] = useState<Omit<Tour, 'id' | 'employeeId'>>({ purpose: '', from: todayISO(), to: todayISO(), destination: '', status: 'Planned' })
  const list = s.tours.sort((a, b) => b.from.localeCompare(a.from))
  return (
    <div>
      <PageHeader kicker="MODULE 03 · OFFICIAL TOUR" title={t('tour')} actions={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={15} /> {lang === 'bn' ? 'নতুন সফর' : 'New Tour'}</button>} />
      <Card padded={false}>
        <Table empty={list.length === 0} head={<><th className="th">ID</th><th className="th">{lang === 'bn' ? 'কর্মকর্তা' : 'Employee'}</th><th className="th">{lang === 'bn' ? 'উদ্দেশ্য' : 'Purpose'}</th><th className="th">{lang === 'bn' ? 'গন্তব্য' : 'Destination'}</th><th className="th">{lang === 'bn' ? 'থেকে' : 'From'}</th><th className="th">{lang === 'bn' ? 'পর্যন্ত' : 'To'}</th><th className="th">{t('status')}</th><th className="th">{t('actions')}</th></>}>
          {list.map(x => <tr key={x.id}><td className="td font-mono text-xs">{x.id}</td><td className="td bn">{s.employees.find(e => e.id === x.employeeId)?.name}</td><td className="td bn">{x.purpose}</td><td className="td bn">{x.destination}</td><td className="td bn">{fmtDate(x.from, lang)}</td><td className="td bn">{fmtDate(x.to, lang)}</td><td className="td"><Badge>{x.status}</Badge></td>
            <td className="td"><Select className="py-1 text-xs w-32" value={x.status} onChange={v => { s.updateTour(x.id, { status: v as Tour['status'] }); toast.push('Updated', 'info') }} options={['Planned', 'Ongoing', 'Completed', 'Cancelled'].map(v => ({ value: v, label: v }))} /></td></tr>)}
        </Table>
      </Card>
      <Modal open={open} onClose={() => setOpen(false)} title={lang === 'bn' ? 'সরকারি সফর' : 'Official Tour'} footer={<><button className="btn-secondary" onClick={() => setOpen(false)}>{t('cancel')}</button><button className="btn-primary" onClick={() => { if (!f.purpose.trim() || !f.destination.trim()) { toast.push(t('required'), 'warn'); return } s.addTour({ ...f, employeeId: me.id }); toast.push(lang === 'bn' ? 'সফর যুক্ত হয়েছে' : 'Tour added'); setOpen(false) }}>{t('save')}</button></>}>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label={lang === 'bn' ? 'উদ্দেশ্য' : 'Purpose'} required className="sm:col-span-2"><input className="input bn" value={f.purpose} onChange={e => setF({ ...f, purpose: e.target.value })} /></Field>
          <Field label={lang === 'bn' ? 'গন্তব্য' : 'Destination'} required className="sm:col-span-2"><input className="input bn" value={f.destination} onChange={e => setF({ ...f, destination: e.target.value })} /></Field>
          <Field label={lang === 'bn' ? 'থেকে' : 'From'}><input className="input" type="date" value={f.from} onChange={e => setF({ ...f, from: e.target.value })} /></Field>
          <Field label={lang === 'bn' ? 'পর্যন্ত' : 'To'}><input className="input" type="date" value={f.to} min={f.from} onChange={e => setF({ ...f, to: e.target.value })} /></Field>
        </div>
      </Modal>
    </div>
  )
}

// ---------------- Employees ----------------
export function EmployeesPage() {
  const { t, lang } = useT()
  const s = useStore()
  const toast = useToast()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const nm = (n: string) => (lang === 'bn' ? bnName(n) : n)
  const list = s.employees.filter(e => !q || e.name.toLowerCase().includes(q.toLowerCase()) || e.designation.toLowerCase().includes(q.toLowerCase()) || e.station.district.toLowerCase().includes(q.toLowerCase()) || e.email.includes(q.toLowerCase()))
  const [f, setF] = useState<Omit<Employee, 'id'>>({ name: '', designation: 'VS', department: 'DLS', mobile: '', email: '', station: emptyLocation(), role: 'field', storeId: '', active: true })
  const today = todayISO()
  return (
    <div>
      <PageHeader kicker="MODULE 03 · EMPLOYEES" title={t('employees')} actions={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={15} /> {lang === 'bn' ? 'নতুন কর্মকর্তা' : 'New Employee'}</button>} />
      <Card padded={false}>
        <div className="p-4 border-b border-slate-100 w-full sm:w-80"><SearchBox value={q} onChange={setQ} /></div>
        <Table head={<><th className="th">ID</th><th className="th">{t('name')}</th><th className="th">{lang === 'bn' ? 'পদবি' : 'Designation'}</th><th className="th">{lang === 'bn' ? 'দপ্তর' : 'Dept.'}</th><th className="th">{lang === 'bn' ? 'কর্মস্থল' : 'Station'}</th><th className="th">{t('mobile')}</th><th className="th">{lang === 'bn' ? 'আজ' : 'Today'}</th><th className="th">{t('status')}</th></>}>
          {list.map(e => { const a = s.attendance.find(x => x.employeeId === e.id && x.date === today); return <tr key={e.id}><td className="td font-mono text-xs">{e.id}</td><td className="td bn font-medium">{e.name}<div className="text-[11px] text-slate-400">{e.email}</div></td><td className="td">{e.designation}</td><td className="td">{e.department}</td><td className="td bn">{nm(e.station.upazila)}, {nm(e.station.district)}</td><td className="td tabular-nums">{e.mobile}</td><td className="td">{a ? <Badge>{a.status}</Badge> : <span className="text-slate-400 text-xs">—</span>}</td>
            <td className="td"><button className={`badge ${e.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-600'}`} onClick={() => s.updateEmployee(e.id, { active: !e.active })}>{e.active ? 'Active' : 'Inactive'}</button></td></tr> })}
        </Table>
      </Card>
      <Modal open={open} onClose={() => setOpen(false)} title={lang === 'bn' ? 'নতুন কর্মকর্তা / কর্মচারী' : 'New Employee'} wide footer={<><button className="btn-secondary" onClick={() => setOpen(false)}>{t('cancel')}</button><button className="btn-primary" onClick={() => { if (!f.name.trim() || !f.email.trim() || !f.station.upazila) { toast.push(t('required'), 'warn'); return } s.addEmployee({ ...f, storeId: f.storeId || undefined }); toast.push(lang === 'bn' ? 'কর্মকর্তা যুক্ত হয়েছে' : 'Employee added'); setOpen(false) }}>{t('save')}</button></>}>
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <Field label={t('name')} required><input className="input bn" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Email" required><input className="input" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} placeholder="name@dls.gov.bd" /></Field>
          <Field label={lang === 'bn' ? 'পদবি' : 'Designation'}><Select value={f.designation} onChange={v => setF({ ...f, designation: v as Employee['designation'] })} options={['ULO', 'UFO', 'VS', 'FA', 'AI Tech', 'DLO', 'DFO', 'VFA', 'LEO', 'Admin', 'Director'].map(x => ({ value: x, label: x }))} /></Field>
          <Field label={lang === 'bn' ? 'দপ্তর' : 'Department'}><Select value={f.department} onChange={v => setF({ ...f, department: v as Employee['department'] })} options={['DLS', 'DoF', 'MoFL'].map(x => ({ value: x, label: x }))} /></Field>
          <Field label={t('mobile')}><input className="input" value={f.mobile} onChange={e => setF({ ...f, mobile: e.target.value })} /></Field>
          <Field label={lang === 'bn' ? 'ভূমিকা' : 'Role'}><Select value={f.role} onChange={v => setF({ ...f, role: v as Employee['role'] })} options={['field', 'upazila', 'district', 'ministry', 'admin'].map(x => ({ value: x, label: x }))} /></Field>
          <Field label={t('store')} className="sm:col-span-2"><Select value={f.storeId ?? ''} placeholder="—" onChange={v => setF({ ...f, storeId: v })} options={s.stores.map(x => ({ value: x.id, label: x.name }))} /></Field>
        </div>
        <LocationPicker value={f.station} onChange={(station: Location) => setF({ ...f, station })} withVillage={false} />
      </Modal>
    </div>
  )
}

// ---------------- Monitoring ----------------
export function MonitoringPage() {
  const { t, lang } = useT()
  const s = useStore()
  const [date, setDate] = useState(todayISO())
  const [tab, setTab] = useState('today')
  const nm = (n: string) => (lang === 'bn' ? bnName(n) : n)
  const staff = s.employees.filter(e => e.active && e.role !== 'admin' && e.role !== 'ministry')
  const rows = staff.map(e => ({ e, a: s.attendance.find(x => x.employeeId === e.id && x.date === date), visits: s.visits.filter(v => v.employeeId === e.id && v.date === date) }))
  const cnt = (st: string) => rows.filter(r => r.a?.status === st).length
  const absent = rows.filter(r => !r.a || r.a.status === 'Absent').length
  const since = addDays(todayISO(), -30)
  const byLevel = useMemo(() => {
    const g = (k: (e: Employee) => string) => { const m = new Map<string, { n: number; present: number; late: number; absent: number; leave: number; tour: number; visits: number }>(); staff.forEach(e => { const key = k(e); if (!m.has(key)) m.set(key, { n: 0, present: 0, late: 0, absent: 0, leave: 0, tour: 0, visits: 0 }); const r = m.get(key)!; r.n++; s.attendance.filter(a => a.employeeId === e.id && a.date >= since).forEach(a => { if (a.status === 'Present') r.present++; else if (a.status === 'Late') r.late++; else if (a.status === 'Absent') r.absent++; else if (a.status === 'Leave') r.leave++; else if (a.status === 'Tour') r.tour++ }); r.visits += s.visits.filter(v => v.employeeId === e.id && v.date >= since).length }); return [...m.entries()] }
    return { division: g(e => e.station.division), district: g(e => e.station.district), upazila: g(e => `${e.station.upazila} · ${e.station.district}`) }
  }, [staff, s.attendance, s.visits, since])
  const levelRows = (tab === 'division' ? byLevel.division : tab === 'district' ? byLevel.district : byLevel.upazila)
  return (
    <div>
      <PageHeader kicker="MODULE 03 · MANAGEMENT VIEW" title={lang === 'bn' ? 'ব্যবস্থাপনা যা দেখবে · বিভাগ → জেলা → উপজেলা' : 'What management sees · Division → District → Upazila'} subtitle={lang === 'bn' ? 'উপস্থিত, অনুপস্থিত, বিলম্ব, ছুটি, মাঠ পরিদর্শন, সরকারি সফর — এক পর্দায়।' : 'Present, absent, late, leave, field visits and tours on one screen.'} actions={<input className="input w-44" type="date" value={date} onChange={e => setDate(e.target.value)} />} />
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-5">
        <Stat label={t('present')} value={fmtNum(cnt('Present'), lang)} tone="green" icon={<Check size={15} />} />
        <Stat label={t('absent')} value={fmtNum(absent, lang)} tone="red" icon={<X size={15} />} />
        <Stat label={t('late')} value={fmtNum(cnt('Late'), lang)} tone="amber" icon={<Clock size={15} />} />
        <Stat label={t('leave')} value={fmtNum(cnt('Leave'), lang)} tone="violet" icon={<CalendarOff size={15} />} />
        <Stat label={t('fieldVisit')} value={fmtNum(rows.reduce((a, r) => a + r.visits.length, 0), lang)} tone="brand" icon={<MapPin size={15} />} />
        <Stat label={t('tour')} value={fmtNum(cnt('Tour'), lang)} tone="slate" icon={<Briefcase size={15} />} />
      </div>
      <Tabs value={tab} onChange={setTab} tabs={[{ key: 'today', label: lang === 'bn' ? 'দৈনিক · কর্মকর্তাভিত্তিক' : 'Daily · By Officer' }, { key: 'division', label: `${t('division')} · 30d` }, { key: 'district', label: `${t('district')} · 30d` }, { key: 'upazila', label: `${t('upazila')} · 30d` }]} />
      {tab === 'today' ? (
        <Card padded={false}>
          <Table head={<><th className="th">{lang === 'bn' ? 'কর্মকর্তা' : 'Officer'}</th><th className="th">{lang === 'bn' ? 'কর্মস্থল' : 'Station'}</th><th className="th">{t('status')}</th><th className="th">{t('checkIn')}</th><th className="th">{t('checkOut')}</th><th className="th">{lang === 'bn' ? 'ধরন' : 'Mode'}</th><th className="th">{lang === 'bn' ? 'পরিদর্শন' : 'Visits'}</th></>}>
            {rows.map(({ e, a, visits }) => <tr key={e.id}><td className="td bn font-medium"><UserCog size={13} className="inline text-slate-400 mr-1" />{e.name}<div className="text-[11px] text-slate-400">{e.designation}</div></td><td className="td bn">{nm(e.station.upazila)}, {nm(e.station.district)}</td><td className="td">{a ? <Badge>{a.status}</Badge> : <Badge tone="Absent">{lang === 'bn' ? 'রেকর্ড নেই' : 'No record'}</Badge>}</td><td className="td tabular-nums">{fmtTime(a?.checkIn, lang)}</td><td className="td tabular-nums">{fmtTime(a?.checkOut, lang)}</td><td className="td">{a?.checkIn ? a.mode : '—'}</td>
              <td className="td">{visits.length ? visits.map(v => <Link key={v.id} to={`/visits/${v.id}`} className="inline-block mr-1 text-xs font-mono text-brand-700 hover:underline">{v.farmId}</Link>) : '—'}</td></tr>)}
          </Table>
        </Card>
      ) : (
        <Card padded={false}>
          <Table head={<><th className="th">{tab === 'division' ? t('division') : tab === 'district' ? t('district') : t('upazila')}</th><th className="th text-right">{lang === 'bn' ? 'কর্মকর্তা' : 'Officers'}</th><th className="th text-right">{t('present')}</th><th className="th text-right">{t('late')}</th><th className="th text-right">{t('absent')}</th><th className="th text-right">{t('leave')}</th><th className="th text-right">{t('tour')}</th><th className="th text-right">{t('fieldVisit')}</th><th className="th">{lang === 'bn' ? 'উপস্থিতি হার' : 'Attendance rate'}</th></>}>
            {levelRows.map(([k, r]) => { const tot = r.present + r.late + r.absent + r.leave + r.tour || 1; const rate = Math.round(((r.present + r.late) / tot) * 100); return <tr key={k}><td className="td bn font-semibold">{k.split(' · ').map(nm).join(' · ')}</td><td className="td text-right tabular-nums">{fmtNum(r.n, lang)}</td><td className="td text-right tabular-nums text-emerald-600">{fmtNum(r.present, lang)}</td><td className="td text-right tabular-nums text-amber-600">{fmtNum(r.late, lang)}</td><td className="td text-right tabular-nums text-red-600">{fmtNum(r.absent, lang)}</td><td className="td text-right tabular-nums">{fmtNum(r.leave, lang)}</td><td className="td text-right tabular-nums">{fmtNum(r.tour, lang)}</td><td className="td text-right tabular-nums font-semibold">{fmtNum(r.visits, lang)}</td><td className="td w-40"><div className="flex items-center gap-2"><div className="flex-1 h-1.5 rounded-full bg-slate-100"><div className={`h-full rounded-full ${rate >= 90 ? 'bg-emerald-500' : rate >= 75 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${rate}%` }} /></div><span className="text-xs tabular-nums font-semibold">{fmtNum(rate, lang)}%</span></div></td></tr> })}
          </Table>
        </Card>
      )}
    </div>
  )
}
