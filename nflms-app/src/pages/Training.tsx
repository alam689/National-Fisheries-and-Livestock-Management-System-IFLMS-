import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { Plus, Users, CalendarDays, MapPin, Award, Check, Star, Printer, ShieldCheck, Search, UserPlus, Trash2, GraduationCap, FileText } from 'lucide-react'
import { useStore } from '../store/store'
import { useT } from '../i18n'
import { fmtDate, fmtNum, todayISO, addDays } from '../lib/format'
import { DIVISIONS, bnName, divisionOfDistrict } from '../data/geo'
import type { Training } from '../types'
import { PageHeader, Card, Badge, Table, Field, Select, SearchBox, Stat, Modal, useToast, Tabs, KV, cx } from '../components/ui'

function TrainingForm({ onClose, initial }: { onClose: () => void; initial?: Training }) {
  const { t, lang } = useT()
  const s = useStore()
  const toast = useToast()
  const [f, setF] = useState<Omit<Training, 'id'>>({ title: initial?.title ?? '', topic: initial?.topic ?? '', venue: initial?.venue ?? '', district: initial?.district ?? 'Cumilla', upazila: initial?.upazila ?? '', date: initial?.date ?? addDays(todayISO(), 7), endDate: initial?.endDate ?? '', trainerId: initial?.trainerId ?? s.employees[4].id, seats: initial?.seats ?? 30, materials: initial?.materials ?? [], status: initial?.status ?? 'Planned' })
  const [mat, setMat] = useState('')
  const districts = DIVISIONS.flatMap(d => d.districts)
  const ups = districts.find(d => d.name === f.district)?.upazilas ?? []
  const nm = (x: { name: string; bn: string }) => (lang === 'bn' ? x.bn : x.name)
  const save = () => {
    if (!f.title.trim() || !f.venue.trim() || !f.upazila || !f.seats) { toast.push(t('required'), 'warn'); return }
    if (initial) { s.updateTraining(initial.id, f); toast.push('Updated') } else { s.addTraining(f); toast.push(lang === 'bn' ? 'প্রশিক্ষণ তৈরি হয়েছে' : 'Training created') }
    onClose()
  }
  return (
    <Modal open onClose={onClose} title={initial ? t('edit') : (lang === 'bn' ? 'প্রশিক্ষণ তৈরি' : 'Create Training')} wide footer={<><button className="btn-secondary" onClick={onClose}>{t('cancel')}</button><button className="btn-primary" onClick={save}>{t('save')}</button></>}>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label={lang === 'bn' ? 'শিরোনাম (English)' : 'Title'} required><input className="input" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} /></Field>
        <Field label={lang === 'bn' ? 'বিষয় (বাংলা)' : 'Topic (Bangla)'}><input className="input bn" value={f.topic} onChange={e => setF({ ...f, topic: e.target.value })} /></Field>
        <Field label={t('district')} required><Select value={f.district} onChange={v => setF({ ...f, district: v, upazila: '' })} options={districts.map(d => ({ value: d.name, label: nm(d) }))} /></Field>
        <Field label={t('upazila')} required><Select value={f.upazila} placeholder="—" onChange={v => setF({ ...f, upazila: v })} options={ups.map(u => ({ value: u.name, label: nm(u) }))} /></Field>
        <Field label={lang === 'bn' ? 'স্থান' : 'Venue'} required className="sm:col-span-2"><input className="input bn" value={f.venue} onChange={e => setF({ ...f, venue: e.target.value })} /></Field>
        <Field label={lang === 'bn' ? 'শুরুর তারিখ' : 'Start Date'} required><input className="input" type="date" value={f.date} onChange={e => setF({ ...f, date: e.target.value })} /></Field>
        <Field label={lang === 'bn' ? 'শেষ তারিখ' : 'End Date'}><input className="input" type="date" value={f.endDate ?? ''} min={f.date} onChange={e => setF({ ...f, endDate: e.target.value })} /></Field>
        <Field label={lang === 'bn' ? 'প্রশিক্ষক' : 'Trainer'}><Select value={f.trainerId} onChange={v => setF({ ...f, trainerId: v })} options={s.employees.map(e => ({ value: e.id, label: `${e.name} (${e.designation})` }))} /></Field>
        <Field label={lang === 'bn' ? 'আসনসংখ্যা' : 'Seats'} required><input className="input" type="number" min={1} value={f.seats} onChange={e => setF({ ...f, seats: Number(e.target.value) })} /></Field>
        <Field label={t('status')}><Select value={f.status} onChange={v => setF({ ...f, status: v as Training['status'] })} options={['Planned', 'Open', 'Ongoing', 'Completed', 'Cancelled'].map(x => ({ value: x, label: x }))} /></Field>
        <Field label={lang === 'bn' ? 'প্রশিক্ষণ উপকরণ' : 'Training Materials'} className="sm:col-span-2">
          <div className="flex gap-2"><input className="input" value={mat} onChange={e => setMat(e.target.value)} placeholder="e.g. Training Manual (PDF)" onKeyDown={e => { if (e.key === 'Enter' && mat.trim()) { setF({ ...f, materials: [...f.materials, mat.trim()] }); setMat('') } }} /><button type="button" className="btn-secondary" onClick={() => { if (mat.trim()) { setF({ ...f, materials: [...f.materials, mat.trim()] }); setMat('') } }}><Plus size={15} /></button></div>
          <div className="flex flex-wrap gap-1.5 mt-2">{f.materials.map((m, i) => <span key={i} className="badge bg-slate-100 text-slate-700 gap-1"><FileText size={11} />{m}<button onClick={() => setF({ ...f, materials: f.materials.filter((_, j) => j !== i) })} className="text-slate-400 hover:text-red-600">×</button></span>)}</div>
        </Field>
      </div>
    </Modal>
  )
}

export function TrainingList() {
  const { t, lang } = useT()
  const s = useStore()
  const nav = useNavigate()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState('all')
  const nm = (n: string) => (lang === 'bn' ? bnName(n) : n)
  const list = s.trainings.filter(x => tab === 'all' || (tab === 'upcoming' && x.date >= todayISO() && x.status !== 'Cancelled') || (tab === 'done' && x.status === 'Completed')).sort((a, b) => b.date.localeCompare(a.date))
  const certs = s.enrollments.filter(e => e.certificateNo).length
  return (
    <div>
      <PageHeader kicker="MODULE 04 · FARMER TRAINING" title={lang === 'bn' ? 'প্রশিক্ষণ — পরিকল্পনা থেকে সনদ পর্যন্ত' : 'Training — from plan to certificate'} subtitle={lang === 'bn' ? 'প্রশিক্ষণ তৈরি → খামারি নিবন্ধন → উপস্থিতি ও উপকরণ → সনদ ও মতামত' : 'Create → Enrol farmers → Attendance & materials → Certificate & feedback'} actions={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={15} /> {lang === 'bn' ? 'প্রশিক্ষণ তৈরি' : 'Create Training'}</button>} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Stat label={t('trainings')} value={fmtNum(s.trainings.length, lang)} icon={<GraduationCap size={16} />} />
        <Stat label={t('trainingsDone')} value={fmtNum(s.trainings.filter(x => x.status === 'Completed').length, lang)} tone="green" icon={<Check size={16} />} />
        <Stat label={lang === 'bn' ? 'প্রশিক্ষিত খামারি' : 'Farmers Trained'} value={fmtNum(s.enrollments.filter(e => e.attended).length, lang)} tone="violet" icon={<Users size={16} />} />
        <Stat label={lang === 'bn' ? 'প্রদত্ত সনদ' : 'Certificates Issued'} value={fmtNum(certs, lang)} tone="amber" icon={<Award size={16} />} onClick={() => nav('/training/certificates')} />
      </div>
      <Tabs value={tab} onChange={setTab} tabs={[{ key: 'all', label: t('all'), count: s.trainings.length }, { key: 'upcoming', label: lang === 'bn' ? 'আসন্ন' : 'Upcoming', count: s.trainings.filter(x => x.date >= todayISO() && x.status !== 'Cancelled').length }, { key: 'done', label: lang === 'bn' ? 'সম্পন্ন' : 'Completed', count: s.trainings.filter(x => x.status === 'Completed').length }]} />
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {list.map(x => { const en = s.enrollments.filter(e => e.trainingId === x.id); const pct = Math.min(100, Math.round((en.length / x.seats) * 100)); return (
          <Link key={x.id} to={`/training/${x.id}`} className="card p-5 hover:shadow-pop hover:border-brand-300 transition block">
            <div className="flex items-start justify-between gap-2"><div><div className="font-bold text-slate-900">{x.title}</div><div className="text-sm text-slate-500 bn">{x.topic}</div></div><Badge>{x.status}</Badge></div>
            <div className="mt-3 space-y-1 text-xs text-slate-500 bn"><div className="flex items-center gap-1.5"><CalendarDays size={13} />{fmtDate(x.date, lang)}{x.endDate && x.endDate !== x.date ? ` – ${fmtDate(x.endDate, lang)}` : ''}</div><div className="flex items-center gap-1.5"><MapPin size={13} />{x.venue}</div><div className="flex items-center gap-1.5"><Users size={13} />{s.employees.find(e => e.id === x.trainerId)?.name}</div></div>
            <div className="mt-3"><div className="flex justify-between text-xs mb-1"><span className="bn">{lang === 'bn' ? 'নিবন্ধিত' : 'Enrolled'} {fmtNum(en.length, lang)}/{fmtNum(x.seats, lang)}</span><span className="text-slate-400">{x.status === 'Completed' ? `${fmtNum(en.filter(e => e.attended).length, lang)} ${lang === 'bn' ? 'উপস্থিত' : 'attended'}` : `${pct}%`}</span></div><div className="h-1.5 rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} /></div></div>
          </Link>) })}
      </div>
      {open && <TrainingForm onClose={() => setOpen(false)} />}
    </div>
  )
}

export function TrainingDetail() {
  const { id } = useParams()
  const { t, lang } = useT()
  const s = useStore()
  const toast = useToast()
  const [edit, setEdit] = useState(false)
  const [q, setQ] = useState('')
  const tr = s.trainings.find(x => x.id === id)
  if (!tr) return <div className="card p-8 text-center text-slate-500">Training not found</div>
  const en = s.enrollments.filter(e => e.trainingId === tr.id)
  const matches = useMemo(() => { const qq = q.trim().toLowerCase(); if (!qq) return []; return s.farmers.filter(f => !en.some(e => e.farmerId === f.id) && (f.name.toLowerCase().includes(qq) || f.id.toLowerCase().includes(qq) || f.mobile.includes(qq))).slice(0, 6) }, [q, s.farmers, en])
  const nm = (n: string) => (lang === 'bn' ? bnName(n) : n)
  const avgFb = en.filter(e => e.feedback).reduce((a, e) => a + (e.feedback ?? 0), 0) / Math.max(1, en.filter(e => e.feedback).length)
  const complete = () => { const n = s.completeTraining(tr.id); toast.push(lang === 'bn' ? `প্রশিক্ষণ সম্পন্ন · ${n} টি সনদ তৈরি হয়েছে` : `Training completed · ${n} certificates issued`) }
  return (
    <div>
      <PageHeader kicker={`${tr.id} · ${tr.status.toUpperCase()}`} title={tr.title} subtitle={tr.topic} actions={<>
        <button className="btn-secondary" onClick={() => setEdit(true)}>{t('edit')}</button>
        {tr.status !== 'Completed' && tr.status !== 'Cancelled' && <button className="btn-primary" onClick={complete}><Award size={15} /> {lang === 'bn' ? 'সম্পন্ন ও সনদ প্রদান' : 'Complete & Issue Certificates'}</button>}
        {tr.status === 'Completed' && en.some(e => e.attended && !e.certificateNo) && <button className="btn-primary" onClick={complete}><Award size={15} /> {lang === 'bn' ? 'বাকি সনদ প্রদান' : 'Issue Pending Certificates'}</button>}
      </>} />
      <div className="grid lg:grid-cols-3 gap-4 mb-5">
        <Card className="lg:col-span-2" title={lang === 'bn' ? 'প্রশিক্ষণের তথ্য' : 'Training Information'}>
          <KV items={[{ k: t('date'), v: `${fmtDate(tr.date, lang)}${tr.endDate && tr.endDate !== tr.date ? ` – ${fmtDate(tr.endDate, lang)}` : ''}` }, { k: lang === 'bn' ? 'স্থান' : 'Venue', v: tr.venue }, { k: t('upazila'), v: `${nm(tr.upazila)}, ${nm(tr.district)}` }, { k: lang === 'bn' ? 'প্রশিক্ষক' : 'Trainer', v: s.employees.find(e => e.id === tr.trainerId)?.name }, { k: lang === 'bn' ? 'আসন' : 'Seats', v: `${fmtNum(en.length, lang)} / ${fmtNum(tr.seats, lang)}` }, { k: lang === 'bn' ? 'উপকরণ' : 'Materials', v: tr.materials.length ? tr.materials.join(', ') : '—' }]} />
        </Card>
        <div className="grid grid-cols-2 gap-3 content-start">
          <Stat label={lang === 'bn' ? 'নিবন্ধিত' : 'Enrolled'} value={fmtNum(en.length, lang)} />
          <Stat label={lang === 'bn' ? 'উপস্থিত' : 'Attended'} value={fmtNum(en.filter(e => e.attended).length, lang)} tone="green" />
          <Stat label={t('certificates')} value={fmtNum(en.filter(e => e.certificateNo).length, lang)} tone="amber" />
          <Stat label={lang === 'bn' ? 'গড় মতামত' : 'Avg Feedback'} value={avgFb ? `${avgFb.toFixed(1)} ★` : '—'} tone="violet" />
        </div>
      </div>
      <Card padded={false} title={lang === 'bn' ? 'অংশগ্রহণকারী তালিকা' : 'Participants'} actions={tr.status !== 'Completed' && tr.status !== 'Cancelled' ? (
        <div className="relative w-72"><SearchBox value={q} onChange={setQ} placeholder={lang === 'bn' ? 'খামারি নিবন্ধন করুন…' : 'Enrol a farmer…'} />
          {matches.length > 0 && <div className="absolute z-[45] mt-1 w-full card p-1">{matches.map(m => <button key={m.id} className="w-full text-left px-3 py-2 rounded-md hover:bg-brand-50 text-sm flex items-center gap-2" onClick={() => { const r = s.enroll(tr.id, m.id); if (r.ok) { toast.push(lang === 'bn' ? 'নিবন্ধিত' : 'Enrolled'); setQ('') } else toast.push(r.error!, 'warn') }}><UserPlus size={14} className="text-brand-600" /><span className="bn font-medium">{m.name}</span><span className="font-mono text-xs text-slate-500">{m.id}</span></button>)}</div>}
        </div>) : undefined}>
        <Table empty={en.length === 0} head={<><th className="th">#</th><th className="th">{lang === 'bn' ? 'খামারি' : 'Farmer'}</th><th className="th">{t('upazila')}</th><th className="th">{lang === 'bn' ? 'নিবন্ধন' : 'Enrolled'}</th><th className="th">{lang === 'bn' ? 'উপস্থিতি' : 'Attendance'}</th><th className="th">{lang === 'bn' ? 'মতামত' : 'Feedback'}</th><th className="th">{t('certificates')}</th><th className="th no-print"></th></>}>
          {en.map((e, i) => { const f = s.farmers.find(x => x.id === e.farmerId)!; return (
            <tr key={e.id}>
              <td className="td text-slate-400">{i + 1}</td>
              <td className="td"><Link to={`/farmers/${f.id}`} className="font-medium bn text-brand-700 hover:underline">{f.name}</Link><div className="text-[11px] text-slate-400 font-mono">{f.id}</div></td>
              <td className="td bn">{nm(f.location.upazila)}</td><td className="td bn text-xs">{fmtDate(e.enrolledAt, lang)}</td>
              <td className="td"><button disabled={!!e.certificateNo} onClick={() => s.setAttended(e.id, !e.attended)} className={cx('badge', e.attended ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500')}>{e.attended ? <><Check size={12} className="mr-1" />{lang === 'bn' ? 'উপস্থিত' : 'Present'}</> : (lang === 'bn' ? 'অনুপস্থিত' : 'Absent')}</button></td>
              <td className="td"><div className="flex gap-0.5">{[1, 2, 3, 4, 5].map(n => <button key={n} disabled={!e.attended} onClick={() => s.setFeedback(e.id, n)}><Star size={14} className={(e.feedback ?? 0) >= n ? 'text-amber-400 fill-amber-400' : 'text-slate-200'} /></button>)}</div></td>
              <td className="td">{e.certificateNo ? <Link to={`/training/certificates/${e.certificateNo}`} className="inline-flex items-center gap-1 text-brand-700 font-mono text-xs hover:underline"><Award size={13} />{e.certificateNo}</Link> : '—'}</td>
              <td className="td no-print">{!e.certificateNo && tr.status !== 'Completed' && <button className="btn-ghost p-1 text-red-500" onClick={() => s.unenroll(e.id)}><Trash2 size={14} /></button>}</td>
            </tr>) })}
        </Table>
      </Card>
      {edit && <TrainingForm initial={tr} onClose={() => setEdit(false)} />}
    </div>
  )
}

export function CertificatesPage() {
  const { t, lang } = useT()
  const s = useStore()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const list = s.enrollments.filter(e => e.certificateNo).map(e => ({ e, f: s.farmers.find(x => x.id === e.farmerId)!, tr: s.trainings.find(x => x.id === e.trainingId)! })).filter(x => !q || x.e.certificateNo!.toLowerCase().includes(q.toLowerCase()) || x.f.name.toLowerCase().includes(q.toLowerCase()) || x.tr.title.toLowerCase().includes(q.toLowerCase())).sort((a, b) => (b.e.issuedAt ?? '').localeCompare(a.e.issuedAt ?? ''))
  return (
    <div>
      <PageHeader kicker="MODULE 04 · DIGITAL CERTIFICATE" title={lang === 'bn' ? 'ডিজিটাল সনদ' : 'Digital Certificates'} subtitle={lang === 'bn' ? 'প্রশিক্ষণ শেষে system থেকেই সনদ তৈরি হয়, প্রতিটিতে থাকে একটি QR Code — scan করলেই যাচাই।' : 'Generated by the system on completion, each with a QR code for instant verification.'} />
      <Card padded={false}>
        <div className="p-4 border-b border-slate-100 w-full sm:w-96"><div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className="input pl-9" placeholder={lang === 'bn' ? 'সনদ নং, খামারি বা প্রশিক্ষণ' : 'Certificate no., farmer or training'} value={q} onChange={e => setQ(e.target.value)} /></div></div>
        <Table empty={list.length === 0} head={<><th className="th">{lang === 'bn' ? 'সনদ নং' : 'Certificate No.'}</th><th className="th">{lang === 'bn' ? 'খামারি' : 'Farmer'}</th><th className="th">{t('training')}</th><th className="th">{lang === 'bn' ? 'প্রদানের তারিখ' : 'Issued'}</th><th className="th">{lang === 'bn' ? 'যাচাই' : 'Verify'}</th></>}>
          {list.slice(0, 200).map(({ e, f, tr }) => <tr key={e.id} className="hover:bg-brand-50/40 cursor-pointer" onClick={() => nav(`/training/certificates/${e.certificateNo}`)}><td className="td font-mono text-xs text-brand-700 font-semibold">{e.certificateNo}</td><td className="td bn">{f.name}<div className="text-[11px] text-slate-400 font-mono">{f.id}</div></td><td className="td">{tr.title}</td><td className="td bn">{fmtDate(e.issuedAt, lang)}</td><td className="td"><span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-semibold"><ShieldCheck size={13} /> Valid</span></td></tr>)}
        </Table>
      </Card>
    </div>
  )
}

export function CertificateView() {
  const { no } = useParams()
  const { lang } = useT()
  const s = useStore()
  const e = s.enrollments.find(x => x.certificateNo === no)
  if (!e) return <div className="card p-8 text-center text-slate-500">Certificate not found</div>
  const f = s.farmers.find(x => x.id === e.farmerId)!
  const tr = s.trainings.find(x => x.id === e.trainingId)!
  const trainer = s.employees.find(x => x.id === tr.trainerId)
  const verifyUrl = `${window.location.origin}/training/certificates/${e.certificateNo}`
  return (
    <div>
      <div className="flex items-center justify-between mb-4 no-print"><Link to="/training/certificates" className="text-sm text-brand-700 hover:underline">← {lang === 'bn' ? 'সকল সনদ' : 'All certificates'}</Link><button className="btn-primary" onClick={() => window.print()}><Printer size={15} /> {lang === 'bn' ? 'প্রিন্ট / PDF' : 'Print / PDF'}</button></div>
      <div className="mx-auto max-w-3xl bg-white border-[10px] border-double border-brand-700 p-10 relative shadow-pop">
        <div className="absolute inset-3 border border-brand-200 pointer-events-none" />
        <div className="text-center">
          <div className="text-xs font-bold tracking-[.2em] text-brand-700 uppercase bn">গণপ্রজাতন্ত্রী বাংলাদেশ সরকার</div>
          <div className="text-sm font-semibold text-slate-700 bn mt-1">মৎস্য ও প্রাণিসম্পদ মন্ত্রণালয় · {tr.trainerId.startsWith('EMP') && trainer?.department === 'DoF' ? 'মৎস্য অধিদপ্তর' : 'প্রাণিসম্পদ অধিদপ্তর'}</div>
          <div className="mx-auto my-5 w-16 h-16 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-white grid place-items-center"><Award size={30} /></div>
          <h1 className="text-3xl font-bold text-slate-900 bn tracking-wide">প্রশিক্ষণ সনদ</h1>
          <div className="text-sm text-slate-500 tracking-[.3em] uppercase">Certificate of Training</div>
          <p className="mt-6 text-slate-600 bn">এই মর্মে প্রত্যয়ন করা যাচ্ছে যে</p>
          <div className="mt-2 text-3xl font-bold text-brand-800 bn">{f.name}</div>
          <div className="text-sm text-slate-500 font-mono mt-1">{f.id} · NID {f.nid}</div>
          <p className="mt-5 text-slate-600 bn leading-relaxed">{fmtDate(tr.date, 'bn')}{tr.endDate && tr.endDate !== tr.date ? ` হতে ${fmtDate(tr.endDate, 'bn')}` : ''} তারিখে {tr.venue}-এ অনুষ্ঠিত</p>
          <div className="mt-1 text-xl font-bold text-slate-900">{tr.title}</div>
          <div className="text-slate-600 bn">“{tr.topic}” শীর্ষক প্রশিক্ষণে সফলভাবে অংশগ্রহণ করেছেন।</div>
        </div>
        <div className="mt-10 flex items-end justify-between">
          <div className="text-center"><div className="h-px w-44 bg-slate-400 mb-1" /><div className="text-sm font-semibold bn">{trainer?.name}</div><div className="text-xs text-slate-500">{trainer?.designation} · {lang === 'bn' ? 'প্রশিক্ষক' : 'Trainer'}</div></div>
          <div className="text-center">
            <QRCodeSVG value={verifyUrl} size={96} level="M" fgColor="#18337e" />
            <div className="text-[10px] text-slate-500 mt-1 font-mono">{e.certificateNo}</div>
            <div className="text-[10px] text-slate-400 bn">QR scan করে যাচাই করুন</div>
          </div>
          <div className="text-center"><div className="h-px w-44 bg-slate-400 mb-1" /><div className="text-sm font-semibold bn">উপজেলা কর্মকর্তা</div><div className="text-xs text-slate-500">{bnName(tr.upazila)}, {bnName(tr.district)}</div></div>
        </div>
        <div className="mt-6 pt-3 border-t border-slate-200 flex justify-between text-[11px] text-slate-500"><span>Issued: {fmtDate(e.issuedAt, 'en')}</span><span className="inline-flex items-center gap-1 text-emerald-700 font-semibold"><ShieldCheck size={12} /> Verified · NFLMS</span><span>{tr.id}</span></div>
      </div>
    </div>
  )
}
