import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Plus, Phone, IdCard, MapPin, Building2, GraduationCap, Syringe, ClipboardList, Activity, Award, Pencil, Printer } from 'lucide-react'
import { useStore } from '../store/store'
import { useT } from '../i18n'
import { fmtDate, fmtNum, toBn } from '../lib/format'
import { bnName } from '../data/geo'
import type { Farmer, Location } from '../types'
import { PageHeader, Card, Badge, Table, Modal, Field, Select, SearchBox, KV, Tabs, useToast, Stat } from '../components/ui'
import { LocationPicker, emptyLocation } from '../components/LocationPicker'

// ---------------- Farmer form ----------------
export function FarmerForm({ open, onClose, initial }: { open: boolean; onClose: (created?: Farmer) => void; initial?: Farmer }) {
  const { t, lang } = useT()
  const addFarmer = useStore(s => s.addFarmer)
  const updateFarmer = useStore(s => s.updateFarmer)
  const farmers = useStore(s => s.farmers)
  const toast = useToast()
  const [f, setF] = useState<{ name: string; nid: string; mobile: string; fatherName: string; gender: 'M' | 'F' | 'O'; dob: string; location: Location }>({
    name: initial?.name ?? '', nid: initial?.nid ?? '', mobile: initial?.mobile ?? '', fatherName: initial?.fatherName ?? '', gender: initial?.gender ?? 'M', dob: initial?.dob ?? '', location: initial?.location ?? emptyLocation(),
  })
  const [err, setErr] = useState('')
  const save = () => {
    if (!f.name.trim() || !f.nid.trim() || !f.mobile.trim() || !f.location.upazila) { setErr(lang === 'bn' ? 'নাম, NID, মোবাইল ও অবস্থান আবশ্যক' : 'Name, NID, mobile and location are required'); return }
    if (!/^01[3-9]\d{8}$/.test(f.mobile)) { setErr(lang === 'bn' ? 'সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন' : 'Enter a valid 11-digit mobile number'); return }
    if (!/^\d{10}$|^\d{13}$|^\d{17}$/.test(f.nid)) { setErr(lang === 'bn' ? 'NID ১০, ১৩ বা ১৭ সংখ্যার হতে হবে' : 'NID must be 10, 13 or 17 digits'); return }
    const dup = farmers.find(x => x.nid === f.nid && x.id !== initial?.id)
    if (dup) { setErr(lang === 'bn' ? `এই NID দিয়ে ইতিমধ্যে নিবন্ধিত: ${dup.id}` : `NID already registered: ${dup.id}`); return }
    if (initial) { updateFarmer(initial.id, f); toast.push(lang === 'bn' ? 'খামারির তথ্য হালনাগাদ হয়েছে' : 'Farmer updated'); onClose(); return }
    const created = addFarmer(f)
    toast.push(lang === 'bn' ? `খামারি নিবন্ধিত · ${created.id}` : `Farmer registered · ${created.id}`)
    onClose(created)
  }
  return (
    <Modal open={open} onClose={() => onClose()} title={initial ? t('edit') : t('farmerReg')} wide footer={<>
      <button className="btn-secondary" onClick={() => onClose()}>{t('cancel')}</button>
      <button className="btn-primary" onClick={save}>{t('save')}</button>
    </>}>
      <div className="space-y-5">
        <div>
          <div className="kicker mb-2">{lang === 'bn' ? 'পরিচয় ও মালিকানা' : 'Identity & Ownership'}</div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label={lang === 'bn' ? 'খামারির নাম' : 'Farmer Name'} required><input className="input bn" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></Field>
            <Field label={lang === 'bn' ? 'পিতা/স্বামীর নাম' : "Father's / Husband's Name"}><input className="input bn" value={f.fatherName} onChange={e => setF({ ...f, fatherName: e.target.value })} /></Field>
            <Field label={t('nid')} required hint={lang === 'bn' ? 'NID-এর সাথে যুক্ত একটি পরিচয় — একবার নিবন্ধিত হলে সব সেবা এর অধীনে যুক্ত হবে' : 'Linked to NID — all services attach to this identity'}><input className="input" value={f.nid} onChange={e => setF({ ...f, nid: e.target.value.replace(/\D/g, '') })} /></Field>
            <Field label={t('mobile')} required><input className="input" value={f.mobile} placeholder="01XXXXXXXXX" onChange={e => setF({ ...f, mobile: e.target.value.replace(/\D/g, '') })} /></Field>
            <Field label={lang === 'bn' ? 'লিঙ্গ' : 'Gender'}><Select value={f.gender} onChange={v => setF({ ...f, gender: v as 'M' | 'F' | 'O' })} options={[{ value: 'M', label: lang === 'bn' ? 'পুরুষ' : 'Male' }, { value: 'F', label: lang === 'bn' ? 'নারী' : 'Female' }, { value: 'O', label: lang === 'bn' ? 'অন্যান্য' : 'Other' }]} /></Field>
            <Field label={lang === 'bn' ? 'জন্ম তারিখ' : 'Date of Birth'}><input className="input" type="date" value={f.dob} onChange={e => setF({ ...f, dob: e.target.value })} /></Field>
          </div>
        </div>
        <div>
          <div className="kicker mb-2">{lang === 'bn' ? 'অবস্থান' : 'Location'}</div>
          <LocationPicker value={f.location} onChange={location => setF({ ...f, location })} />
        </div>
        {err && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 bn">{err}</div>}
      </div>
    </Modal>
  )
}

// ---------------- Farmer list ----------------
export function FarmerList() {
  const { t, lang } = useT()
  const farmers = useStore(s => s.farmers)
  const farms = useStore(s => s.farms)
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [dist, setDist] = useState('')
  const [open, setOpen] = useState(false)
  const districts = useMemo(() => [...new Set(farmers.map(f => f.location.district))].sort(), [farmers])
  const list = useMemo(() => {
    const qq = q.trim().toLowerCase()
    return farmers.filter(f => (!dist || f.location.district === dist) && (!qq || f.name.toLowerCase().includes(qq) || f.id.toLowerCase().includes(qq) || f.mobile.includes(qq) || f.nid.includes(qq)))
  }, [farmers, q, dist])
  const nm = (n: string) => (lang === 'bn' ? bnName(n) : n)
  return (
    <div>
      <PageHeader kicker="MODULE 01 · FARMER PROFILE" title={lang === 'bn' ? 'খামারির জন্য একটি ডিজিটাল পরিচয়' : 'A digital identity for every farmer'} subtitle={lang === 'bn' ? 'NID-এর সাথে যুক্ত একটি পরিচয়, যার নিচে খামারির সব খামার, সেবা ও প্রশিক্ষণের ইতিহাস জমা হয়।' : 'One NID-linked identity that accumulates every farm, service and training record.'}
        actions={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> {t('newFarmer')}</button>} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Stat label={t('regFarmers')} value={fmtNum(farmers.length, lang)} />
        <Stat label={lang === 'bn' ? 'সক্রিয়' : 'Active'} value={fmtNum(farmers.filter(f => f.status === 'Active').length, lang)} tone="green" />
        <Stat label={lang === 'bn' ? 'নারী খামারি' : 'Women Farmers'} value={fmtNum(farmers.filter(f => f.gender === 'F').length, lang)} tone="violet" />
        <Stat label={lang === 'bn' ? 'এ মাসে নিবন্ধিত' : 'Registered This Month'} value={fmtNum(farmers.filter(f => f.registeredAt.slice(0, 7) === new Date().toISOString().slice(0, 7)).length, lang)} tone="amber" />
      </div>
      <Card padded={false}>
        <div className="p-4 flex flex-wrap gap-3 border-b border-slate-100">
          <div className="w-full sm:w-80"><SearchBox value={q} onChange={setQ} placeholder={lang === 'bn' ? 'নাম, আইডি, NID বা মোবাইল' : 'Name, ID, NID or mobile'} /></div>
          <Select className="w-full sm:w-52" value={dist} onChange={setDist} placeholder={`${t('all')} ${t('district')}`} options={districts.map(d => ({ value: d, label: nm(d) }))} />
          <div className="ml-auto text-sm text-slate-500 self-center bn">{fmtNum(list.length, lang)} {lang === 'bn' ? 'জন' : 'records'}</div>
        </div>
        <Table empty={list.length === 0} head={<><th className="th">{t('farmerId')}</th><th className="th">{t('name')}</th><th className="th">{t('mobile')}</th><th className="th">{t('upazila')} / {t('district')}</th><th className="th text-right">{t('farms')}</th><th className="th">{lang === 'bn' ? 'নিবন্ধন' : 'Registered'}</th><th className="th">{t('status')}</th></>}>
          {list.slice(0, 200).map(f => (
            <tr key={f.id} className="hover:bg-brand-50/40 cursor-pointer" onClick={() => nav(`/farmers/${f.id}`)}>
              <td className="td font-mono text-xs text-brand-700 font-semibold">{f.id}</td>
              <td className="td bn font-medium">{f.name}</td>
              <td className="td tabular-nums">{lang === 'bn' ? toBn(f.mobile) : f.mobile}</td>
              <td className="td bn">{nm(f.location.upazila)}, {nm(f.location.district)}</td>
              <td className="td text-right tabular-nums">{fmtNum(farms.filter(x => x.farmerId === f.id).length, lang)}</td>
              <td className="td bn">{fmtDate(f.registeredAt, lang)}</td>
              <td className="td"><Badge>{f.status}</Badge></td>
            </tr>
          ))}
        </Table>
      </Card>
      {open && <FarmerForm open onClose={c => { setOpen(false); if (c) nav(`/farmers/${c.id}`) }} />}
    </div>
  )
}

// ---------------- Farmer profile ----------------
export function FarmerProfile() {
  const { id } = useParams()
  const { t, lang } = useT()
  const s = useStore()
  const nav = useNavigate()
  const [tab, setTab] = useState('farms')
  const [edit, setEdit] = useState(false)
  const f = s.farmers.find(x => x.id === id)
  if (!f) return <div className="card p-8 text-center text-slate-500">Farmer not found</div>
  const farms = s.farms.filter(x => x.farmerId === f.id)
  const visits = s.visits.filter(v => v.farmerId === f.id)
  const meds = s.txns.filter(x => x.type === 'Distribute' && x.farmerId === f.id)
  const enr = s.enrollments.filter(e => e.farmerId === f.id)
  const dr = s.diseaseReports.filter(r => r.farmerId === f.id)
  const nm = (n: string) => (lang === 'bn' ? bnName(n) : n)
  return (
    <div>
      <PageHeader kicker="DIGITAL FARMER ID" title={f.name} subtitle={f.id} actions={<>
        <button className="btn-secondary" onClick={() => window.print()}><Printer size={15} /> {lang === 'bn' ? 'প্রিন্ট' : 'Print'}</button>
        <button className="btn-secondary" onClick={() => setEdit(true)}><Pencil size={15} /> {t('edit')}</button>
        <Link to="/farms" state={{ farmerId: f.id }} className="btn-primary"><Plus size={15} /> {t('newFarm')}</Link>
      </>} />
      <div className="grid lg:grid-cols-3 gap-4 mb-5">
        <Card className="lg:col-span-2">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 text-white grid place-items-center text-2xl font-bold bn shrink-0">{f.name[0]}</div>
            <div className="flex-1">
              <KV items={[
                { k: t('nid'), v: <span className="flex items-center gap-1.5"><IdCard size={14} className="text-slate-400" />{lang === 'bn' ? toBn(f.nid) : f.nid}</span> },
                { k: t('mobile'), v: <span className="flex items-center gap-1.5"><Phone size={14} className="text-slate-400" />{lang === 'bn' ? toBn(f.mobile) : f.mobile}</span> },
                { k: lang === 'bn' ? 'পিতা/স্বামী' : 'Father / Husband', v: f.fatherName },
                { k: lang === 'bn' ? 'জন্ম তারিখ' : 'Date of Birth', v: fmtDate(f.dob, lang) },
                { k: lang === 'bn' ? 'ঠিকানা' : 'Address', v: <span className="flex items-center gap-1.5"><MapPin size={14} className="text-slate-400" />{[f.location.village, f.location.union, nm(f.location.upazila), nm(f.location.district), nm(f.location.division)].filter(Boolean).join(', ')}</span> },
                { k: lang === 'bn' ? 'নিবন্ধনের তারিখ' : 'Registered', v: <span>{fmtDate(f.registeredAt, lang)} · <Badge>{f.status}</Badge></span> },
              ]} />
            </div>
          </div>
        </Card>
        <div className="grid grid-cols-2 gap-3">
          <Stat label={t('farms')} value={fmtNum(farms.length, lang)} icon={<Building2 size={16} />} onClick={() => setTab('farms')} />
          <Stat label={t('visits')} value={fmtNum(visits.length, lang)} icon={<ClipboardList size={16} />} tone="green" onClick={() => setTab('visits')} />
          <Stat label={lang === 'bn' ? 'প্রাপ্ত ঔষধ' : 'Medicine Received'} value={fmtNum(meds.reduce((a, x) => a + x.qty, 0), lang)} icon={<Syringe size={16} />} tone="violet" onClick={() => setTab('meds')} />
          <Stat label={t('training')} value={fmtNum(enr.length, lang)} icon={<GraduationCap size={16} />} tone="amber" onClick={() => setTab('training')} />
        </div>
      </div>

      <Tabs value={tab} onChange={setTab} tabs={[
        { key: 'farms', label: lang === 'bn' ? 'অধীনে থাকা খামার' : 'Farms', count: farms.length },
        { key: 'visits', label: t('visits'), count: visits.length },
        { key: 'meds', label: lang === 'bn' ? 'প্রাপ্ত ঔষধ ও ভ্যাকসিন' : 'Medicine & Vaccine', count: meds.length },
        { key: 'training', label: lang === 'bn' ? 'প্রশিক্ষণ ইতিহাস' : 'Training History', count: enr.length },
        { key: 'disease', label: lang === 'bn' ? 'রোগের রিপোর্ট' : 'Disease Reports', count: dr.length },
      ]} />

      {tab === 'farms' && (
        <Card padded={false}>
          <Table empty={farms.length === 0} head={<><th className="th">{t('farmId')}</th><th className="th">{t('name')}</th><th className="th">{t('type')}</th><th className="th text-right">{lang === 'bn' ? 'আয়তন' : 'Size'}</th><th className="th text-right">{lang === 'bn' ? 'প্রাণী/পুকুর' : 'Animals/Ponds'}</th><th className="th">{t('status')}</th></>}>
            {farms.map(x => (
              <tr key={x.id} className="hover:bg-brand-50/40 cursor-pointer" onClick={() => nav(`/farms/${x.id}`)}>
                <td className="td font-mono text-xs text-brand-700 font-semibold">{x.id}</td><td className="td bn">{x.name}</td><td className="td"><Badge tone="Open">{x.type}</Badge></td>
                <td className="td text-right tabular-nums">{fmtNum(x.size, lang)} {x.sizeUnit}</td><td className="td text-right tabular-nums">{x.type === 'Fish' ? `${fmtNum(x.pondCount ?? 0, lang)} ${lang === 'bn' ? 'পুকুর' : 'ponds'}` : fmtNum(x.animalCount, lang)}</td><td className="td"><Badge>{x.status}</Badge></td>
              </tr>
            ))}
          </Table>
        </Card>
      )}
      {tab === 'visits' && (
        <Card padded={false}>
          <Table empty={visits.length === 0} head={<><th className="th">ID</th><th className="th">{t('date')}</th><th className="th">{t('farms')}</th><th className="th">{lang === 'bn' ? 'কর্মকর্তা' : 'Officer'}</th><th className="th">{lang === 'bn' ? 'উদ্দেশ্য' : 'Purpose'}</th><th className="th">{lang === 'bn' ? 'রোগ' : 'Disease'}</th><th className="th">Follow-up</th></>}>
            {visits.map(v => (
              <tr key={v.id} className="hover:bg-brand-50/40 cursor-pointer" onClick={() => nav(`/visits/${v.id}`)}>
                <td className="td font-mono text-xs">{v.id}</td><td className="td bn">{fmtDate(v.date, lang)}</td><td className="td font-mono text-xs">{v.farmId}</td><td className="td bn">{s.employees.find(e => e.id === v.employeeId)?.name}</td><td className="td">{v.purpose}</td><td className="td">{v.disease ? <Badge tone={v.severity}>{v.disease}</Badge> : '—'}</td><td className="td bn">{fmtDate(v.followUp, lang)}</td>
              </tr>
            ))}
          </Table>
        </Card>
      )}
      {tab === 'meds' && (
        <Card padded={false}>
          <Table empty={meds.length === 0} head={<><th className="th">{t('date')}</th><th className="th">{lang === 'bn' ? 'ঔষধ' : 'Medicine'}</th><th className="th">{t('batchNo')}</th><th className="th text-right">{t('qty')}</th><th className="th">{lang === 'bn' ? 'রোগ' : 'Disease'}</th><th className="th">{lang === 'bn' ? 'বিতরণকারী' : 'Distributed by'}</th></>}>
            {meds.map(x => (
              <tr key={x.id}><td className="td bn">{fmtDate(x.date, lang)}</td><td className="td">{s.medicines.find(m => m.id === x.medicineId)?.name}</td><td className="td font-mono text-xs">{x.batchNo}</td><td className="td text-right tabular-nums">{fmtNum(x.qty, lang)}</td><td className="td">{x.disease ?? '—'}</td><td className="td bn">{s.employees.find(e => e.id === x.byEmployeeId)?.name}</td></tr>
            ))}
          </Table>
        </Card>
      )}
      {tab === 'training' && (
        <Card padded={false}>
          <Table empty={enr.length === 0} head={<><th className="th">{t('training')}</th><th className="th">{lang === 'bn' ? 'স্থান' : 'Venue'}</th><th className="th">{t('date')}</th><th className="th">{t('status')}</th><th className="th">{t('certificates')}</th></>}>
            {enr.map(e => {
              const tr = s.trainings.find(x => x.id === e.trainingId)!
              return (
                <tr key={e.id}>
                  <td className="td font-medium"><Link to={`/training/${tr.id}`} className="text-brand-700 hover:underline">{tr.title}</Link><div className="text-xs text-slate-500 bn">{tr.topic}</div></td>
                  <td className="td bn">{nm(tr.district)}</td><td className="td bn">{fmtDate(tr.date, lang)}</td>
                  <td className="td">{tr.status === 'Completed' ? <Badge tone={e.attended ? 'Completed' : 'Absent'}>{e.attended ? (lang === 'bn' ? 'সম্পন্ন' : 'Completed') : (lang === 'bn' ? 'অনুপস্থিত' : 'Absent')}</Badge> : <Badge>{tr.status}</Badge>}</td>
                  <td className="td">{e.certificateNo ? <Link to={`/training/certificates/${e.certificateNo}`} className="inline-flex items-center gap-1 text-brand-700 font-mono text-xs hover:underline"><Award size={13} />{e.certificateNo}</Link> : '—'}</td>
                </tr>
              )
            })}
          </Table>
        </Card>
      )}
      {tab === 'disease' && (
        <Card padded={false}>
          <Table empty={dr.length === 0} head={<><th className="th">{t('date')}</th><th className="th">{lang === 'bn' ? 'প্রজাতি' : 'Species'}</th><th className="th">{lang === 'bn' ? 'রোগ' : 'Disease'}</th><th className="th text-right">{lang === 'bn' ? 'আক্রান্ত' : 'Cases'}</th><th className="th text-right">{lang === 'bn' ? 'মৃত' : 'Deaths'}</th><th className="th">{lang === 'bn' ? 'রিপোর্টকারী' : 'Reported by'}</th></>}>
            {dr.map(r => (
              <tr key={r.id}><td className="td bn">{fmtDate(r.date, lang)}</td><td className="td">{r.species}</td><td className="td"><span className="inline-flex items-center gap-1"><Activity size={13} className="text-red-500" />{r.disease}</span></td><td className="td text-right tabular-nums">{fmtNum(r.cases, lang)}</td><td className="td text-right tabular-nums">{fmtNum(r.deaths, lang)}</td><td className="td bn">{s.employees.find(e => e.id === r.reportedBy)?.name}</td></tr>
            ))}
          </Table>
        </Card>
      )}
      {edit && <FarmerForm open initial={f} onClose={() => setEdit(false)} />}
    </div>
  )
}
