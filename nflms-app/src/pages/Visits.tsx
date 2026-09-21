import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Search, Building2, Crosshair, Camera, PawPrint, Activity, Stethoscope, Syringe, CalendarCheck, MessageSquare, ChevronLeft, ChevronRight, Check, MapPin, AlertTriangle, Plus, Trash2 } from 'lucide-react'
import { useStore, useMe, fefoBatches } from '../store/store'
import { useT } from '../i18n'
import { fmtDate, fmtNum, todayISO, addDays } from '../lib/format'
import { bnName } from '../data/geo'
import { DISEASE_LIST } from '../data/seed'
import type { Visit, VisitAnimal, VisitMedicine } from '../types'
import { PageHeader, Card, Badge, Table, Field, Select, SearchBox, KV, useToast, cx } from '../components/ui'
import { useGeo } from '../components/LocationPicker'

const STEPS = [
  { k: 'farmer', bn: 'Farmer search', en: 'Farmer search', icon: <Search size={15} /> },
  { k: 'farm', bn: 'Farm select', en: 'Farm select', icon: <Building2 size={15} /> },
  { k: 'gps', bn: 'GPS capture', en: 'GPS capture', icon: <Crosshair size={15} /> },
  { k: 'photo', bn: 'Photo capture', en: 'Photo capture', icon: <Camera size={15} /> },
  { k: 'animals', bn: 'প্রাণী ও মাছের তথ্য', en: 'Animal & fish data', icon: <PawPrint size={15} /> },
  { k: 'disease', bn: 'রোগের তথ্য', en: 'Disease info', icon: <Activity size={15} /> },
  { k: 'treatment', bn: 'চিকিৎসা ও পরামর্শ', en: 'Treatment & advice', icon: <Stethoscope size={15} /> },
  { k: 'meds', bn: 'প্রদত্ত ঔষধ', en: 'Medicine given', icon: <Syringe size={15} /> },
  { k: 'followup', bn: 'Follow-up তারিখ', en: 'Follow-up date', icon: <CalendarCheck size={15} /> },
  { k: 'remarks', bn: 'মন্তব্য', en: 'Remarks', icon: <MessageSquare size={15} /> },
]

export function VisitWizard() {
  const { t, lang } = useT()
  const s = useStore()
  const me = useMe()!
  const nav = useNavigate()
  const toast = useToast()
  const geo = useGeo()
  const loc = useLocation() as { state?: { farmId?: string } }
  const preFarm = loc.state?.farmId ? s.farms.find(f => f.id === loc.state!.farmId) : undefined
  const [step, setStep] = useState(preFarm ? 2 : 0)
  const [fq, setFq] = useState('')
  const [v, setV] = useState<Omit<Visit, 'id' | 'status'>>({
    employeeId: me.id, farmerId: preFarm?.farmerId ?? '', farmId: preFarm?.id ?? '', date: todayISO(), photos: 0, animals: [], medicines: [], purpose: 'Routine',
  })
  const [gpsAcc, setGpsAcc] = useState<number | undefined>()
  const [busy, setBusy] = useState(false)
  const farmer = s.farmers.find(x => x.id === v.farmerId)
  const farm = s.farms.find(x => x.id === v.farmId)
  const farms = s.farms.filter(x => x.farmerId === v.farmerId)
  const matches = useMemo(() => { const q = fq.trim().toLowerCase(); if (!q) return s.farmers.slice(0, 8); return s.farmers.filter(x => x.name.toLowerCase().includes(q) || x.id.toLowerCase().includes(q) || x.mobile.includes(q) || x.nid.includes(q)).slice(0, 8) }, [fq, s.farmers])
  const storeId = me.storeId
  const speciesOptions = farm ? (farm.type === 'Fish' ? ['Fish'] : farm.type === 'Poultry' ? ['Poultry'] : farm.type === 'Duck' ? ['Duck'] : farm.type === 'Goat/Sheep' ? ['Goat'] : farm.type === 'Mixed' ? ['Cattle', 'Goat', 'Poultry', 'Duck', 'Fish'] : ['Cattle']) : ['Cattle']
  const diseaseOpts = [...new Set(v.animals.flatMap(a => (DISEASE_LIST as Record<string, string[]>)[a.species] ?? []))]
  const nm = (n: string) => (lang === 'bn' ? bnName(n) : n)

  const canNext = () => {
    if (step === 0) return !!v.farmerId
    if (step === 1) return !!v.farmId
    if (step === 2) return !!v.lat
    if (step === 4) return v.animals.length > 0 && v.animals.every(a => a.count > 0)
    if (step === 5) return v.purpose !== 'Disease' || !!v.disease
    return true
  }
  const next = () => { if (step === 1 && v.animals.length === 0 && farm) setV(x => ({ ...x, animals: [{ species: speciesOptions[0], count: farm.type === 'Fish' ? 0 : farm.animalCount, healthy: farm.type === 'Fish' ? 0 : farm.animalCount, sick: 0, dead: 0 }] })); setStep(s => Math.min(STEPS.length - 1, s + 1)) }
  const submit = () => {
    setBusy(true)
    const r = s.submitVisit(v)
    setBusy(false)
    if (r.ok) { toast.push(lang === 'bn' ? `পরিদর্শন জমা হয়েছে · ${r.visit!.id}` : `Visit submitted · ${r.visit!.id}`); r.warnings.forEach(w => toast.push(w, 'warn')); nav(`/visits/${r.visit!.id}`) }
  }
  const setAnimal = (i: number, patch: Partial<VisitAnimal>) => setV(x => ({ ...x, animals: x.animals.map((a, j) => (j === i ? { ...a, ...patch, healthy: Math.max(0, (patch.count ?? a.count) - (patch.sick ?? a.sick) - (patch.dead ?? a.dead)) } : a)) }))
  const setMed = (i: number, patch: Partial<VisitMedicine>) => setV(x => ({ ...x, medicines: x.medicines.map((m, j) => (j === i ? { ...m, ...patch } : m)) }))

  return (
    <div>
      <PageHeader kicker="MODULE 05 · FIELD OFFICER MOBILE APP" title={lang === 'bn' ? 'একটি খামার পরিদর্শন, দশটি ধাপ' : 'One farm visit, ten steps'} subtitle={lang === 'bn' ? 'কর্মকর্তা খামারে দাঁড়িয়েই তথ্য submit করবেন — অফিসে ফিরে আলাদা করে entry দেওয়ার প্রয়োজন থাকবে না।' : 'Submit from the farm itself. No re-entry back at the office.'} />
      <div className="grid lg:grid-cols-[260px_1fr] gap-4">
        <div className="card p-3 self-start">
          <ol className="space-y-0.5">
            {STEPS.map((st, i) => (
              <li key={st.k}><button onClick={() => i < step && setStep(i)} className={cx('w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-left bn', i === step ? 'bg-brand-500 text-white' : i < step ? 'text-slate-700 hover:bg-slate-50' : 'text-slate-400')}>
                <span className={cx('w-6 h-6 rounded-full grid place-items-center text-[11px] font-bold shrink-0', i === step ? 'bg-white/20' : i < step ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100')}>{i < step ? <Check size={12} /> : String(i + 1).padStart(2, '0')}</span>
                <span className="flex items-center gap-1.5">{st.icon}{lang === 'bn' ? st.bn : st.en}</span>
              </button></li>
            ))}
          </ol>
        </div>
        <Card>
          <div className="flex items-center gap-2 mb-4"><span className="kicker">STEP {String(step + 1).padStart(2, '0')} / 10</span><h2 className="font-bold text-lg bn">{lang === 'bn' ? STEPS[step].bn : STEPS[step].en}</h2></div>

          {step === 0 && (
            <div>
              <SearchBox value={fq} onChange={setFq} placeholder={lang === 'bn' ? 'নাম, আইডি, NID বা মোবাইল' : 'Name, ID, NID or mobile'} />
              <ul className="mt-3 divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                {matches.map(m => <li key={m.id}><button onClick={() => setV({ ...v, farmerId: m.id, farmId: '' })} className={cx('w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left hover:bg-brand-50', v.farmerId === m.id && 'bg-brand-50')}><div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 grid place-items-center font-bold bn">{m.name[0]}</div><div><div className="font-semibold bn">{m.name}</div><div className="text-xs text-slate-500">{m.id} · {m.mobile}</div></div><div className="ml-auto text-xs text-slate-500 bn">{nm(m.location.upazila)}</div>{v.farmerId === m.id && <Check size={16} className="text-brand-600" />}</button></li>)}
              </ul>
            </div>
          )}
          {step === 1 && (
            <div className="grid sm:grid-cols-2 gap-3">
              {farms.length === 0 && <p className="text-sm text-slate-500 bn">{lang === 'bn' ? 'এই খামারির কোনো খামার নিবন্ধিত নেই।' : 'No farm registered for this farmer.'} <Link className="text-brand-700 underline" to="/farms" state={{ farmerId: v.farmerId }}>{t('newFarm')}</Link></p>}
              {farms.map(f => <button key={f.id} onClick={() => setV({ ...v, farmId: f.id, animals: [] })} className={cx('text-left rounded-xl border p-4 hover:border-brand-300', v.farmId === f.id ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-100' : 'border-slate-200')}><div className="font-mono text-xs text-brand-700 font-semibold">{f.id}</div><div className="font-semibold bn">{f.name}</div><div className="text-xs text-slate-500">{f.type} · {fmtNum(f.size, lang)} {f.sizeUnit} · {f.type === 'Fish' ? `${f.pondCount} ponds` : `${f.animalCount} animals`}</div><div className="text-xs text-slate-500 bn">{f.location.village}, {nm(f.location.upazila)}</div></button>)}
            </div>
          )}
          {step === 2 && (
            <div className="text-center py-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-brand-50 grid place-items-center relative"><span className="absolute inset-0 rounded-full border-2 border-brand-300 animate-pulseRing" /><MapPin size={32} className="text-brand-600" /></div>
              {v.lat ? <div className="mt-4"><div className="text-lg font-bold tabular-nums">{v.lat}, {v.lng}</div><div className="text-xs text-slate-500">{gpsAcc ? `±${gpsAcc} m` : ''} · {farm?.location.lat ? `${lang === 'bn' ? 'খামার থেকে দূরত্ব' : 'Distance from farm'}: ${(Math.hypot((v.lat - farm.location.lat) * 111, ((v.lng ?? 0) - (farm.location.lng ?? 0)) * 102)).toFixed(2)} km` : ''}</div></div> : <p className="mt-4 text-sm text-slate-500 bn">{lang === 'bn' ? 'খামারে দাঁড়িয়ে GPS অবস্থান নিন' : 'Capture GPS while standing at the farm'}</p>}
              <button className="btn-primary mt-4" disabled={busy} onClick={async () => { setBusy(true); const g = await geo.get(); setV({ ...v, lat: g.lat, lng: g.lng }); setGpsAcc(g.accuracy); setBusy(false) }}><Crosshair size={16} /> {v.lat ? (lang === 'bn' ? 'আবার নিন' : 'Re-capture') : (lang === 'bn' ? 'GPS নিন' : 'Capture GPS')}</button>
            </div>
          )}
          {step === 3 && (
            <div>
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 4 }).map((_, i) => <button key={i} onClick={() => setV({ ...v, photos: i < v.photos ? i : i + 1 })} className={cx('aspect-square rounded-lg border-2 border-dashed grid place-items-center', i < v.photos ? 'border-brand-400 bg-brand-50 text-brand-600' : 'border-slate-200 text-slate-300 hover:border-slate-300')}>{i < v.photos ? <Check size={22} /> : <Camera size={22} />}</button>)}
              </div>
              <p className="text-xs text-slate-500 mt-2 bn">{fmtNum(v.photos, lang)} {lang === 'bn' ? 'টি ছবি সংযুক্ত — খামার, প্রাণী ও রোগের লক্ষণের ছবি তুলুন' : 'photos attached. Capture the farm, animals and any symptoms'}</p>
            </div>
          )}
          {step === 4 && (
            <div className="space-y-3">
              {v.animals.map((a, i) => (
                <div key={i} className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-end rounded-lg border border-slate-200 p-3">
                  <Field label={lang === 'bn' ? 'প্রজাতি' : 'Species'}><Select value={a.species} onChange={sp => setAnimal(i, { species: sp })} options={speciesOptions.map(x => ({ value: x, label: x }))} /></Field>
                  <Field label={lang === 'bn' ? 'মোট' : 'Total'}><input className="input" type="number" min={0} value={a.count || ''} onChange={e => setAnimal(i, { count: Number(e.target.value) })} /></Field>
                  <Field label={lang === 'bn' ? 'অসুস্থ' : 'Sick'}><input className="input" type="number" min={0} value={a.sick || ''} onChange={e => setAnimal(i, { sick: Number(e.target.value) })} /></Field>
                  <Field label={lang === 'bn' ? 'মৃত' : 'Dead'}><input className="input" type="number" min={0} value={a.dead || ''} onChange={e => setAnimal(i, { dead: Number(e.target.value) })} /></Field>
                  <div className="flex items-center gap-2"><div className="text-sm"><div className="text-[11px] text-slate-400 uppercase">{lang === 'bn' ? 'সুস্থ' : 'Healthy'}</div><div className="font-bold text-emerald-600">{fmtNum(a.healthy, lang)}</div></div><button className="btn-ghost p-1.5 text-red-500 ml-auto" onClick={() => setV({ ...v, animals: v.animals.filter((_, j) => j !== i) })}><Trash2 size={15} /></button></div>
                </div>
              ))}
              <button className="btn-secondary" onClick={() => setV({ ...v, animals: [...v.animals, { species: speciesOptions[0], count: 0, healthy: 0, sick: 0, dead: 0 }] })}><Plus size={15} /> {lang === 'bn' ? 'প্রজাতি যোগ করুন' : 'Add species'}</button>
            </div>
          )}
          {step === 5 && (
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label={lang === 'bn' ? 'পরিদর্শনের উদ্দেশ্য' : 'Purpose of visit'}><Select value={v.purpose} onChange={p => setV({ ...v, purpose: p as Visit['purpose'] })} options={['Routine', 'Disease', 'Vaccination', 'Advisory', 'Inspection'].map(x => ({ value: x, label: x }))} /></Field>
              <Field label={lang === 'bn' ? 'রোগ' : 'Disease'} required={v.purpose === 'Disease'} hint={lang === 'bn' ? 'রোগ দিলে স্বয়ংক্রিয়ভাবে Disease Surveillance-এ রিপোর্ট হবে' : 'A disease entry is auto-reported to Disease Surveillance'}><input className="input" list="dzl" value={v.disease ?? ''} onChange={e => setV({ ...v, disease: e.target.value || undefined })} placeholder={lang === 'bn' ? 'কোনো রোগ না থাকলে খালি রাখুন' : 'Leave blank if none'} /><datalist id="dzl">{diseaseOpts.map(d => <option key={d} value={d} />)}</datalist></Field>
              <Field label={lang === 'bn' ? 'লক্ষণ' : 'Symptoms'} className="sm:col-span-2"><textarea className="input bn" rows={2} value={v.symptoms ?? ''} onChange={e => setV({ ...v, symptoms: e.target.value })} /></Field>
              <Field label={lang === 'bn' ? 'তীব্রতা' : 'Severity'}><div className="flex gap-2">{(['Low', 'Medium', 'High'] as const).map(x => <button key={x} onClick={() => setV({ ...v, severity: x })} className={cx('flex-1 rounded-lg border py-2 text-sm font-semibold', v.severity === x ? (x === 'High' ? 'border-red-500 bg-red-50 text-red-700' : x === 'Medium' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-emerald-500 bg-emerald-50 text-emerald-700') : 'border-slate-200 text-slate-600')}>{x}</button>)}</div></Field>
            </div>
          )}
          {step === 6 && (
            <div className="grid gap-4">
              <Field label={lang === 'bn' ? 'চিকিৎসা' : 'Treatment'}><textarea className="input bn" rows={2} value={v.treatment ?? ''} onChange={e => setV({ ...v, treatment: e.target.value })} /></Field>
              <Field label={lang === 'bn' ? 'পরামর্শ' : 'Advice'}><textarea className="input bn" rows={3} value={v.advice ?? ''} onChange={e => setV({ ...v, advice: e.target.value })} placeholder={lang === 'bn' ? 'যেমন — আক্রান্ত প্রাণী আলাদা রাখুন, পরিষ্কার পানি ও ছায়ার ব্যবস্থা করুন' : 'e.g. isolate sick animals, provide clean water and shade'} /></Field>
            </div>
          )}
          {step === 7 && (
            <div className="space-y-3">
              {!storeId && <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2"><AlertTriangle size={15} />{lang === 'bn' ? 'আপনার কোনো স্টোর নির্ধারিত নেই — ঔষধ মজুদ থেকে কাটা হবে না' : 'No store assigned to you. Medicine will not be deducted from stock.'}</div>}
              {v.medicines.map((m, i) => { const fefo = storeId ? fefoBatches(s.batches, storeId, m.medicineId) : []; const avail = fefo.reduce((a, b) => a + b.qty, 0); return (
                <div key={i} className="grid sm:grid-cols-[1fr_1fr_120px_36px] gap-2 items-end rounded-lg border border-slate-200 p-3">
                  <Field label={lang === 'bn' ? 'ঔষধ / ভ্যাকসিন' : 'Medicine'}><Select value={m.medicineId} onChange={id => setMed(i, { medicineId: id, batchNo: '' })} options={s.medicines.map(x => ({ value: x.id, label: `${x.name}${storeId ? ` — ${fefoBatches(s.batches, storeId, x.id).reduce((a, b) => a + b.qty, 0)}` : ''}` }))} /></Field>
                  <Field label={t('batchNo')} hint="FEFO"><Select value={m.batchNo} placeholder={lang === 'bn' ? 'স্বয়ংক্রিয় (FEFO)' : 'Auto (FEFO)'} onChange={b => setMed(i, { batchNo: b })} options={fefo.map(b => ({ value: b.batchNo, label: `${b.batchNo} · exp ${b.expiry} · ${b.qty}` }))} /></Field>
                  <Field label={`${t('qty')} (${avail})`}><input className="input" type="number" min={1} max={avail || undefined} value={m.qty || ''} onChange={e => setMed(i, { qty: Number(e.target.value) })} /></Field>
                  <button className="btn-ghost p-2 text-red-500" onClick={() => setV({ ...v, medicines: v.medicines.filter((_, j) => j !== i) })}><Trash2 size={15} /></button>
                </div>) })}
              <button className="btn-secondary" onClick={() => setV({ ...v, medicines: [...v.medicines, { medicineId: s.medicines[0].id, batchNo: '', qty: 1 }] })}><Plus size={15} /> {lang === 'bn' ? 'ঔষধ যোগ করুন' : 'Add medicine'}</button>
              <p className="text-xs text-slate-500 bn">{lang === 'bn' ? 'জমা দিলে ঔষধ স্বয়ংক্রিয়ভাবে আপনার স্টোর থেকে খামারির নামে বিতরণ হিসেবে রেকর্ড হবে (Medicine → Farmer traceability)।' : 'On submit, medicines are auto-recorded as a distribution from your store to this farmer (medicine → farmer traceability).'}</p>
            </div>
          )}
          {step === 8 && (
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label={lang === 'bn' ? 'Follow-up তারিখ' : 'Follow-up date'}><input className="input" type="date" min={todayISO()} value={v.followUp ?? ''} onChange={e => setV({ ...v, followUp: e.target.value || undefined })} /></Field>
              <div className="flex items-end gap-2 flex-wrap">{[3, 7, 14, 30].map(d => <button key={d} className="btn-secondary py-1.5 text-xs" onClick={() => setV({ ...v, followUp: addDays(todayISO(), d) })}>+{d} {lang === 'bn' ? 'দিন' : 'days'}</button>)}<button className="btn-ghost py-1.5 text-xs" onClick={() => setV({ ...v, followUp: undefined })}>{lang === 'bn' ? 'প্রয়োজন নেই' : 'Not needed'}</button></div>
            </div>
          )}
          {step === 9 && (
            <div className="space-y-4">
              <Field label={lang === 'bn' ? 'মন্তব্য' : 'Remarks'}><textarea className="input bn" rows={3} value={v.remarks ?? ''} onChange={e => setV({ ...v, remarks: e.target.value })} /></Field>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="kicker mb-2">{lang === 'bn' ? 'সারাংশ' : 'Summary'}</div>
                <KV items={[{ k: lang === 'bn' ? 'খামারি' : 'Farmer', v: farmer?.name }, { k: 'Farm', v: `${farm?.id} · ${farm?.name}` }, { k: 'GPS', v: v.lat ? `${v.lat}, ${v.lng}` : '—' }, { k: lang === 'bn' ? 'ছবি' : 'Photos', v: v.photos }, { k: lang === 'bn' ? 'প্রাণী' : 'Animals', v: v.animals.map(a => `${a.species}: ${a.count} (${a.sick} sick, ${a.dead} dead)`).join('; ') }, { k: lang === 'bn' ? 'রোগ' : 'Disease', v: v.disease ? `${v.disease} · ${v.severity ?? ''}` : '—' }, { k: lang === 'bn' ? 'ঔষধ' : 'Medicine', v: v.medicines.map(m => `${s.medicines.find(x => x.id === m.medicineId)?.name} ×${m.qty}`).join('; ') || '—' }, { k: 'Follow-up', v: fmtDate(v.followUp, lang) }]} />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
            <button className="btn-secondary" disabled={step === 0} onClick={() => setStep(s => s - 1)}><ChevronLeft size={16} /> {t('prev')}</button>
            {step < STEPS.length - 1 ? <button className="btn-primary" disabled={!canNext()} onClick={next}>{t('next')} <ChevronRight size={16} /></button> : <button className="btn-primary" disabled={busy} onClick={submit}><Check size={16} /> {t('submit')}</button>}
          </div>
        </Card>
      </div>
    </div>
  )
}

export function VisitList() {
  const { t, lang } = useT()
  const s = useStore()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [purpose, setPurpose] = useState('')
  const [emp, setEmp] = useState('')
  const list = s.visits.filter(v => (!purpose || v.purpose === purpose) && (!emp || v.employeeId === emp) && (!q || v.id.toLowerCase().includes(q.toLowerCase()) || v.farmId.toLowerCase().includes(q.toLowerCase()) || (s.farmers.find(f => f.id === v.farmerId)?.name ?? '').toLowerCase().includes(q.toLowerCase()) || (v.disease ?? '').toLowerCase().includes(q.toLowerCase())))
  const due = s.visits.filter(v => v.followUp && v.followUp <= addDays(todayISO(), 3) && v.followUp >= todayISO())
  return (
    <div>
      <PageHeader kicker="MODULE 05 · FIELD SERVICE & VISIT MANAGEMENT" title={t('visits')} subtitle={lang === 'bn' ? 'খামার পরিদর্শন, রোগ রিপোর্ট, চিকিৎসা ও পরামর্শ — প্রতিটি visit measurable।' : 'Farm visits, disease reports, treatment and advice. Every visit is measurable.'} actions={<Link to="/visits/new" className="btn-primary"><Plus size={15} /> {t('newVisit')}</Link>} />
      {due.length > 0 && <div className="card p-3 mb-4 flex items-center gap-2 text-sm border-amber-200 bg-amber-50/50"><CalendarCheck size={16} className="text-amber-600" /><span className="bn">{lang === 'bn' ? `${fmtNum(due.length, lang)} টি follow-up আগামী ৩ দিনের মধ্যে` : `${due.length} follow-ups due within 3 days`}:</span>{due.slice(0, 5).map(v => <Link key={v.id} to={`/visits/${v.id}`} className="font-mono text-xs text-brand-700 hover:underline">{v.farmId}</Link>)}</div>}
      <Card padded={false}>
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3">
          <div className="w-full sm:w-72"><SearchBox value={q} onChange={setQ} /></div>
          <Select className="w-full sm:w-40" value={purpose} placeholder={lang === 'bn' ? 'সকল উদ্দেশ্য' : 'All purposes'} onChange={setPurpose} options={['Routine', 'Disease', 'Vaccination', 'Advisory', 'Inspection'].map(x => ({ value: x, label: x }))} />
          <Select className="w-full sm:w-56" value={emp} placeholder={lang === 'bn' ? 'সকল কর্মকর্তা' : 'All officers'} onChange={setEmp} options={s.employees.filter(e => e.role === 'field' || e.role === 'upazila').map(e => ({ value: e.id, label: e.name }))} />
          <div className="ml-auto text-sm text-slate-500 self-center">{fmtNum(list.length, lang)}</div>
        </div>
        <Table empty={list.length === 0} head={<><th className="th">ID</th><th className="th">{t('date')}</th><th className="th">{lang === 'bn' ? 'খামারি' : 'Farmer'}</th><th className="th">Farm</th><th className="th">{lang === 'bn' ? 'কর্মকর্তা' : 'Officer'}</th><th className="th">{lang === 'bn' ? 'উদ্দেশ্য' : 'Purpose'}</th><th className="th">{lang === 'bn' ? 'রোগ' : 'Disease'}</th><th className="th text-right">{lang === 'bn' ? 'ঔষধ' : 'Meds'}</th><th className="th">Follow-up</th></>}>
          {list.slice(0, 200).map(v => <tr key={v.id} className="hover:bg-brand-50/40 cursor-pointer" onClick={() => nav(`/visits/${v.id}`)}><td className="td font-mono text-xs">{v.id}</td><td className="td bn">{fmtDate(v.date, lang)}</td><td className="td bn">{s.farmers.find(f => f.id === v.farmerId)?.name}</td><td className="td font-mono text-xs">{v.farmId}</td><td className="td bn">{s.employees.find(e => e.id === v.employeeId)?.name}</td><td className="td">{v.purpose}</td><td className="td">{v.disease ? <Badge tone={v.severity}>{v.disease}</Badge> : '—'}</td><td className="td text-right tabular-nums">{v.medicines.reduce((a, m) => a + m.qty, 0) || '—'}</td><td className="td bn">{fmtDate(v.followUp, lang)}</td></tr>)}
        </Table>
      </Card>
    </div>
  )
}

export function VisitDetail() {
  const { id } = useParams()
  const { t, lang } = useT()
  const s = useStore()
  const v = s.visits.find(x => x.id === id)
  if (!v) return <div className="card p-8 text-center text-slate-500">Visit not found</div>
  const farmer = s.farmers.find(f => f.id === v.farmerId)
  const farm = s.farms.find(f => f.id === v.farmId)
  const officer = s.employees.find(e => e.id === v.employeeId)
  const txns = s.txns.filter(x => x.note === `Visit ${v.id}` || (x.type === 'Distribute' && x.farmId === v.farmId && x.date === v.date))
  const nm = (n: string) => (lang === 'bn' ? bnName(n) : n)
  return (
    <div>
      <PageHeader kicker={`VISIT · ${v.id}`} title={`${farm?.name ?? v.farmId}`} subtitle={`${fmtDate(v.date, lang)} · ${officer?.name}`} actions={<><Link to="/visits/new" state={{ farmId: v.farmId }} className="btn-secondary"><Plus size={15} /> Follow-up visit</Link><button className="btn-secondary" onClick={() => window.print()}>Print</button></>} />
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2" title={lang === 'bn' ? 'পরিদর্শনের বিবরণ' : 'Visit Details'}>
          <KV items={[
            { k: lang === 'bn' ? 'খামারি' : 'Farmer', v: <Link className="text-brand-700 hover:underline" to={`/farmers/${v.farmerId}`}>{farmer?.name} · {v.farmerId}</Link> },
            { k: 'Farm', v: <Link className="text-brand-700 hover:underline" to={`/farms/${v.farmId}`}>{v.farmId} · {farm?.type}</Link> },
            { k: lang === 'bn' ? 'অবস্থান' : 'Location', v: farm ? `${farm.location.village ?? ''} ${nm(farm.location.upazila)}, ${nm(farm.location.district)}` : '—' },
            { k: 'GPS', v: v.lat ? <a className="text-brand-700 hover:underline inline-flex items-center gap-1" target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/?mlat=${v.lat}&mlon=${v.lng}#map=15/${v.lat}/${v.lng}`}><MapPin size={13} />{v.lat.toFixed(4)}, {v.lng?.toFixed(4)}</a> : '—' },
            { k: lang === 'bn' ? 'উদ্দেশ্য' : 'Purpose', v: v.purpose },
            { k: lang === 'bn' ? 'ছবি' : 'Photos', v: `${v.photos}` },
            { k: lang === 'bn' ? 'রোগ' : 'Disease', v: v.disease ? <span><Badge tone={v.severity}>{v.disease}</Badge> {v.severity && <span className="text-xs text-slate-500">· {v.severity}</span>}</span> : '—' },
            { k: lang === 'bn' ? 'লক্ষণ' : 'Symptoms', v: v.symptoms },
            { k: lang === 'bn' ? 'চিকিৎসা' : 'Treatment', v: v.treatment },
            { k: lang === 'bn' ? 'পরামর্শ' : 'Advice', v: v.advice },
            { k: 'Follow-up', v: fmtDate(v.followUp, lang) },
            { k: lang === 'bn' ? 'মন্তব্য' : 'Remarks', v: v.remarks },
          ]} />
          <div className="mt-5">
            <div className="kicker mb-2">{lang === 'bn' ? 'প্রাণী ও মাছের তথ্য' : 'Animal & Fish Data'}</div>
            <table className="w-full text-sm"><thead><tr><th className="th">Species</th><th className="th text-right">Total</th><th className="th text-right">Healthy</th><th className="th text-right">Sick</th><th className="th text-right">Dead</th></tr></thead><tbody>{v.animals.map((a, i) => <tr key={i}><td className="td">{a.species}</td><td className="td text-right tabular-nums">{fmtNum(a.count, lang)}</td><td className="td text-right tabular-nums text-emerald-600">{fmtNum(a.healthy, lang)}</td><td className="td text-right tabular-nums text-amber-600">{fmtNum(a.sick, lang)}</td><td className="td text-right tabular-nums text-red-600">{fmtNum(a.dead, lang)}</td></tr>)}</tbody></table>
          </div>
        </Card>
        <div className="space-y-4">
          <Card title={lang === 'bn' ? 'প্রদত্ত ঔষধ' : 'Medicine Given'}>
            {v.medicines.length === 0 ? <p className="text-sm text-slate-400">—</p> : <ul className="space-y-2">{v.medicines.map((m, i) => <li key={i} className="text-sm"><div className="font-medium">{s.medicines.find(x => x.id === m.medicineId)?.name}</div><div className="text-xs text-slate-500 flex justify-between"><span className="font-mono">{txns.find(t => t.medicineId === m.medicineId)?.batchNo ?? m.batchNo ?? 'FEFO'}</span><span className="font-semibold">×{m.qty}</span></div></li>)}</ul>}
            {txns.length > 0 && <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 bn"><Syringe size={12} className="inline mr-1" />{lang === 'bn' ? 'স্টক লেজারে রেকর্ড:' : 'Ledger entries:'} {txns.map(t => <Link key={t.id} to="/medicine/ledger" className="font-mono text-brand-700 mr-1">{t.id}</Link>)}</div>}
          </Card>
          <Card title={lang === 'bn' ? 'কর্মকর্তা' : 'Officer'}>
            <div className="text-sm"><div className="font-semibold bn">{officer?.name}</div><div className="text-xs text-slate-500">{officer?.designation} · {officer?.department} · {nm(officer?.station.upazila ?? '')}</div><div className="text-xs text-slate-500">{officer?.mobile}</div></div>
          </Card>
        </div>
      </div>
    </div>
  )
}
