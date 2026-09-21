import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Plus, MapPin, Pencil, FileText, Fish, Beef, Egg, Layers, Crosshair } from 'lucide-react'
import { useStore } from '../store/store'
import { useT } from '../i18n'
import { fmtDate, fmtNum } from '../lib/format'
import { bnName } from '../data/geo'
import type { Farm, FarmType, Location } from '../types'
import { PageHeader, Card, Badge, Table, Modal, Field, Select, SearchBox, KV, Stat, useToast } from '../components/ui'
import { LocationPicker, emptyLocation, useGeo } from '../components/LocationPicker'

const TYPES: { v: FarmType; bn: string }[] = [
  { v: 'Fish', bn: 'মৎস্য খামার' }, { v: 'Cattle', bn: 'গবাদিপশু' }, { v: 'Dairy', bn: 'ডেইরি' }, { v: 'Poultry', bn: 'পোল্ট্রি' }, { v: 'Duck', bn: 'হাঁস' }, { v: 'Goat/Sheep', bn: 'ছাগল / ভেড়া' }, { v: 'Mixed', bn: 'মিশ্র খামার' },
]
const DOCS = ['Trade License', 'Land Deed / Lease', 'NID Copy', 'Farm Photo', 'Bank Statement']
export const typeIcon = (t: FarmType) => (t === 'Fish' ? <Fish size={15} /> : t === 'Poultry' || t === 'Duck' ? <Egg size={15} /> : t === 'Mixed' ? <Layers size={15} /> : <Beef size={15} />)

export function FarmForm({ open, onClose, initial, farmerId }: { open: boolean; onClose: (created?: Farm) => void; initial?: Farm; farmerId?: string }) {
  const { t, lang } = useT()
  const s = useStore()
  const toast = useToast()
  const geo = useGeo()
  const [fq, setFq] = useState('')
  const [f, setF] = useState<Omit<Farm, 'id' | 'registeredAt'>>({
    farmerId: initial?.farmerId ?? farmerId ?? '', name: initial?.name ?? '', type: initial?.type ?? 'Fish', size: initial?.size ?? 0, sizeUnit: initial?.sizeUnit ?? 'decimal', capacity: initial?.capacity ?? 0, capacityUnit: initial?.capacityUnit ?? 'ton/yr', animalCount: initial?.animalCount ?? 0, pondCount: initial?.pondCount ?? 0,
    location: initial?.location ?? emptyLocation(), status: initial?.status ?? 'Active', documents: initial?.documents ?? [],
  })
  const [err, setErr] = useState('')
  const farmer = s.farmers.find(x => x.id === f.farmerId)
  useEffect(() => { if (farmer && !initial && !f.location.upazila) setF(x => ({ ...x, location: { ...farmer.location } })) }, [farmer])
  const matches = useMemo(() => { const q = fq.trim().toLowerCase(); if (!q) return []; return s.farmers.filter(x => x.name.toLowerCase().includes(q) || x.id.toLowerCase().includes(q) || x.mobile.includes(q) || x.nid.includes(q)).slice(0, 6) }, [fq, s.farmers])
  const isFish = f.type === 'Fish'
  const save = () => {
    if (!f.farmerId || !f.name.trim() || !f.location.upazila || !f.size) { setErr(lang === 'bn' ? 'খামারি, খামারের নাম, আয়তন ও অবস্থান আবশ্যক' : 'Farmer, farm name, size and location are required'); return }
    if (initial) { s.updateFarm(initial.id, f); toast.push(lang === 'bn' ? 'খামারের তথ্য হালনাগাদ হয়েছে' : 'Farm updated'); onClose(); return }
    const c = s.addFarm(f)
    toast.push(lang === 'bn' ? `খামার নিবন্ধিত · ${c.id}` : `Farm registered · ${c.id}`)
    onClose(c)
  }
  return (
    <Modal open={open} onClose={() => onClose()} title={initial ? t('edit') : t('farmReg')} wide footer={<>
      <button className="btn-secondary" onClick={() => onClose()}>{t('cancel')}</button>
      <button className="btn-primary" onClick={save}>{t('save')}</button>
    </>}>
      <div className="space-y-5">
        <div>
          <div className="kicker mb-2">{lang === 'bn' ? 'মালিক · খামারি' : 'Owner · Farmer'}</div>
          {farmer ? (
            <div className="flex items-center gap-3 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2">
              <div className="font-semibold bn">{farmer.name}</div><div className="font-mono text-xs text-brand-700">{farmer.id}</div><div className="text-xs text-slate-500">{farmer.mobile}</div>
              {!initial && <button className="ml-auto text-xs text-slate-500 hover:text-red-600" onClick={() => setF({ ...f, farmerId: '' })}>{lang === 'bn' ? 'পরিবর্তন' : 'change'}</button>}
            </div>
          ) : (
            <div className="relative">
              <SearchBox value={fq} onChange={setFq} placeholder={lang === 'bn' ? 'খামারি খুঁজুন — নাম, আইডি, NID বা মোবাইল' : 'Search farmer — name, ID, NID or mobile'} />
              {matches.length > 0 && (
                <div className="absolute z-[45] mt-1 w-full card p-1 max-h-56 overflow-auto">
                  {matches.map(m => <button key={m.id} className="w-full text-left px-3 py-2 rounded-md hover:bg-brand-50 text-sm flex gap-2" onClick={() => { setF({ ...f, farmerId: m.id, location: { ...m.location } }); setFq('') }}><span className="bn font-medium">{m.name}</span><span className="font-mono text-xs text-slate-500">{m.id}</span><span className="ml-auto text-xs text-slate-400 bn">{bnName(m.location.upazila)}</span></button>)}
                </div>
              )}
            </div>
          )}
        </div>
        <div>
          <div className="kicker mb-2">{lang === 'bn' ? 'খামারের তথ্য' : 'Farm Details'}</div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label={lang === 'bn' ? 'খামারের নাম' : 'Farm Name'} required><input className="input bn" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></Field>
            <Field label={t('farmType')} required>
              <div className="grid grid-cols-4 gap-1.5">
                {TYPES.map(tp => <button key={tp.v} type="button" onClick={() => setF({ ...f, type: tp.v, capacityUnit: tp.v === 'Fish' ? 'ton/yr' : tp.v === 'Poultry' || tp.v === 'Duck' ? 'birds' : 'heads' })} className={`rounded-md border px-1.5 py-1.5 text-[11px] font-semibold bn flex flex-col items-center gap-0.5 ${f.type === tp.v ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{typeIcon(tp.v)}{lang === 'bn' ? tp.bn : tp.v}</button>)}
              </div>
            </Field>
            <Field label={lang === 'bn' ? 'আয়তন' : 'Farm Size'} required>
              <div className="flex gap-2"><input className="input" type="number" min={0} value={f.size || ''} onChange={e => setF({ ...f, size: Number(e.target.value) })} /><Select className="w-32" value={f.sizeUnit} onChange={v => setF({ ...f, sizeUnit: v as Farm['sizeUnit'] })} options={[{ value: 'decimal', label: lang === 'bn' ? 'শতাংশ' : 'decimal' }, { value: 'acre', label: lang === 'bn' ? 'একর' : 'acre' }, { value: 'sqft', label: 'sq ft' }]} /></div>
            </Field>
            <Field label={lang === 'bn' ? 'উৎপাদন ক্ষমতা' : 'Production Capacity'}>
              <div className="flex gap-2"><input className="input" type="number" min={0} value={f.capacity || ''} onChange={e => setF({ ...f, capacity: Number(e.target.value) })} /><input className="input w-32" value={f.capacityUnit} onChange={e => setF({ ...f, capacityUnit: e.target.value })} /></div>
            </Field>
            {isFish || f.type === 'Mixed' ? <Field label={lang === 'bn' ? 'পুকুর সংখ্যা' : 'Number of Ponds'}><input className="input" type="number" min={0} value={f.pondCount || ''} onChange={e => setF({ ...f, pondCount: Number(e.target.value) })} /></Field> : null}
            {!isFish && <Field label={lang === 'bn' ? 'প্রাণী সংখ্যা' : 'Number of Animals'}><input className="input" type="number" min={0} value={f.animalCount || ''} onChange={e => setF({ ...f, animalCount: Number(e.target.value) })} /></Field>}
            <Field label={t('status')}><Select value={f.status} onChange={v => setF({ ...f, status: v as Farm['status'] })} options={['Active', 'Pending', 'Suspended', 'Closed'].map(x => ({ value: x, label: x }))} /></Field>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2"><div className="kicker">{lang === 'bn' ? 'অবস্থান ও GPS' : 'Location & GPS'}</div>
            <button type="button" className="btn-secondary py-1 text-xs" onClick={async () => { const g = await geo.get(); setF(x => ({ ...x, location: { ...x.location, lat: g.lat, lng: g.lng } })); toast.push(`GPS: ${g.lat}, ${g.lng}`, 'info') }}><Crosshair size={13} /> {lang === 'bn' ? 'বর্তমান অবস্থান নিন' : 'Capture GPS'}</button></div>
          <LocationPicker value={f.location} onChange={(location: Location) => setF({ ...f, location })} withGps />
        </div>
        <div>
          <div className="kicker mb-2">{lang === 'bn' ? 'দলিলপত্র' : 'Documents'}</div>
          <div className="flex flex-wrap gap-2">
            {DOCS.map(d => { const on = f.documents.includes(d); return <button key={d} type="button" onClick={() => setF({ ...f, documents: on ? f.documents.filter(x => x !== d) : [...f.documents, d] })} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${on ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}><FileText size={12} />{d}</button> })}
          </div>
        </div>
        {err && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 bn">{err}</div>}
      </div>
    </Modal>
  )
}

export function FarmList() {
  const { t, lang } = useT()
  const s = useStore()
  const nav = useNavigate()
  const loc = useLocation() as { state?: { farmerId?: string } }
  const [sp] = useSearchParams()
  const [q, setQ] = useState('')
  const [type, setType] = useState(sp.get('type') ?? '')
  const [dist, setDist] = useState('')
  const [open, setOpen] = useState(!!loc.state?.farmerId)
  const nm = (n: string) => (lang === 'bn' ? bnName(n) : n)
  const districts = useMemo(() => [...new Set(s.farms.map(f => f.location.district))].sort(), [s.farms])
  const list = useMemo(() => {
    const qq = q.trim().toLowerCase()
    return s.farms.filter(f => (!type || f.type === type || (type === 'Cattle' && f.type === 'Dairy')) && (!dist || f.location.district === dist) && (!qq || f.name.toLowerCase().includes(qq) || f.id.toLowerCase().includes(qq) || (s.farmers.find(x => x.id === f.farmerId)?.name ?? '').toLowerCase().includes(qq)))
  }, [s.farms, q, type, dist])
  return (
    <div>
      <PageHeader kicker="MODULE 01 · FARM REGISTRATION" title={lang === 'bn' ? 'প্রতিটি খামারের একটি স্থায়ী পরিচয়' : 'A permanent identity for every farm'} subtitle={lang === 'bn' ? 'একবার নিবন্ধিত হলে খামারটি উপজেলা, জেলা ও কেন্দ্র — সব স্তরে একই পরিচয়ে চিহ্নিত থাকে।' : 'Once registered, a farm carries the same Unique Farm ID at upazila, district and central level.'}
        actions={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> {t('newFarm')}</button>} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Stat label={t('regFarms')} value={fmtNum(s.farms.length, lang)} />
        <Stat label={t('fishFarms')} value={fmtNum(s.farms.filter(f => f.type === 'Fish').length, lang)} tone="green" icon={<Fish size={16} />} />
        <Stat label={t('cattleDairy')} value={fmtNum(s.farms.filter(f => f.type === 'Cattle' || f.type === 'Dairy').length, lang)} tone="amber" icon={<Beef size={16} />} />
        <Stat label={t('poultryFarms')} value={fmtNum(s.farms.filter(f => f.type === 'Poultry').length, lang)} tone="violet" icon={<Egg size={16} />} />
      </div>
      <Card padded={false}>
        <div className="p-4 flex flex-wrap gap-3 border-b border-slate-100">
          <div className="w-full sm:w-72"><SearchBox value={q} onChange={setQ} placeholder={lang === 'bn' ? 'খামার, আইডি বা খামারির নাম' : 'Farm, ID or farmer name'} /></div>
          <Select className="w-full sm:w-44" value={type} onChange={setType} placeholder={`${t('all')} ${t('type')}`} options={TYPES.map(x => ({ value: x.v, label: lang === 'bn' ? x.bn : x.v }))} />
          <Select className="w-full sm:w-48" value={dist} onChange={setDist} placeholder={`${t('all')} ${t('district')}`} options={districts.map(d => ({ value: d, label: nm(d) }))} />
          <div className="ml-auto text-sm text-slate-500 self-center">{fmtNum(list.length, lang)}</div>
        </div>
        <Table empty={list.length === 0} head={<><th className="th">{t('farmId')}</th><th className="th">{t('name')}</th><th className="th">{t('type')}</th><th className="th">{lang === 'bn' ? 'খামারি' : 'Farmer'}</th><th className="th">{t('upazila')}</th><th className="th text-right">{lang === 'bn' ? 'আয়তন' : 'Size'}</th><th className="th text-right">{lang === 'bn' ? 'প্রাণী/পুকুর' : 'Animals/Ponds'}</th><th className="th">{t('status')}</th></>}>
          {list.slice(0, 200).map(f => (
            <tr key={f.id} className="hover:bg-brand-50/40 cursor-pointer" onClick={() => nav(`/farms/${f.id}`)}>
              <td className="td font-mono text-xs text-brand-700 font-semibold">{f.id}</td><td className="td bn font-medium">{f.name}</td><td className="td"><span className="inline-flex items-center gap-1.5">{typeIcon(f.type)}{f.type}</span></td>
              <td className="td bn">{s.farmers.find(x => x.id === f.farmerId)?.name}</td><td className="td bn">{nm(f.location.upazila)}, {nm(f.location.district)}</td>
              <td className="td text-right tabular-nums">{fmtNum(f.size, lang)} {f.sizeUnit}</td><td className="td text-right tabular-nums">{f.type === 'Fish' ? `${fmtNum(f.pondCount ?? 0, lang)} ${lang === 'bn' ? 'পুকুর' : 'ponds'}` : fmtNum(f.animalCount, lang)}</td><td className="td"><Badge>{f.status}</Badge></td>
            </tr>
          ))}
        </Table>
      </Card>
      {open && <FarmForm open farmerId={loc.state?.farmerId} onClose={c => { setOpen(false); if (c) nav(`/farms/${c.id}`) }} />}
    </div>
  )
}

export function FarmDetail() {
  const { id } = useParams()
  const { t, lang } = useT()
  const s = useStore()
  const nav = useNavigate()
  const [edit, setEdit] = useState(false)
  const f = s.farms.find(x => x.id === id)
  if (!f) return <div className="card p-8 text-center text-slate-500">Farm not found</div>
  const farmer = s.farmers.find(x => x.id === f.farmerId)
  const visits = s.visits.filter(v => v.farmId === f.id)
  const meds = s.txns.filter(x => x.type === 'Distribute' && x.farmId === f.id)
  const dr = s.diseaseReports.filter(r => r.farmId === f.id)
  const nm = (n: string) => (lang === 'bn' ? bnName(n) : n)
  return (
    <div>
      <PageHeader kicker="UNIQUE FARM ID" title={f.name} subtitle={f.id} actions={<>
        <button className="btn-secondary" onClick={() => setEdit(true)}><Pencil size={15} /> {t('edit')}</button>
        <Link to="/visits/new" state={{ farmId: f.id }} className="btn-primary"><Plus size={15} /> {t('newVisit')}</Link>
      </>} />
      <div className="grid lg:grid-cols-3 gap-4 mb-5">
        <Card className="lg:col-span-2" title={lang === 'bn' ? 'খামারের তথ্য' : 'Farm Information'}>
          <KV items={[
            { k: t('farmType'), v: <span className="inline-flex items-center gap-1.5">{typeIcon(f.type)}{f.type}</span> },
            { k: t('status'), v: <Badge>{f.status}</Badge> },
            { k: lang === 'bn' ? 'আয়তন' : 'Farm Size', v: `${fmtNum(f.size, lang)} ${f.sizeUnit}` },
            { k: lang === 'bn' ? 'উৎপাদন ক্ষমতা' : 'Production Capacity', v: `${fmtNum(f.capacity, lang)} ${f.capacityUnit}` },
            { k: lang === 'bn' ? 'প্রাণী সংখ্যা' : 'Animals', v: fmtNum(f.animalCount, lang) },
            { k: lang === 'bn' ? 'পুকুর সংখ্যা' : 'Ponds', v: f.pondCount != null ? fmtNum(f.pondCount, lang) : '—' },
            { k: lang === 'bn' ? 'ঠিকানা' : 'Address', v: [f.location.village, f.location.union, nm(f.location.upazila), nm(f.location.district), nm(f.location.division)].filter(Boolean).join(', ') },
            { k: t('gps'), v: f.location.lat ? <a className="text-brand-700 inline-flex items-center gap-1 hover:underline" target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/?mlat=${f.location.lat}&mlon=${f.location.lng}#map=15/${f.location.lat}/${f.location.lng}`}><MapPin size={13} />{f.location.lat.toFixed(4)}, {f.location.lng?.toFixed(4)}</a> : '—' },
            { k: lang === 'bn' ? 'নিবন্ধনের তারিখ' : 'Registration Date', v: fmtDate(f.registeredAt, lang) },
            { k: lang === 'bn' ? 'দলিলপত্র' : 'Documents', v: f.documents.length ? f.documents.join(', ') : '—' },
          ]} />
        </Card>
        <Card title={lang === 'bn' ? 'মালিক' : 'Owner'}>
          {farmer && (
            <Link to={`/farmers/${farmer.id}`} className="block group">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 text-white grid place-items-center text-xl font-bold bn">{farmer.name[0]}</div>
                <div><div className="font-semibold bn group-hover:text-brand-700">{farmer.name}</div><div className="font-mono text-xs text-brand-700">{farmer.id}</div><div className="text-xs text-slate-500">{farmer.mobile}</div></div>
              </div>
            </Link>
          )}
          <div className="grid grid-cols-3 gap-2 mt-4 text-center">
            <div className="rounded-lg bg-slate-50 p-2"><div className="text-lg font-bold">{fmtNum(visits.length, lang)}</div><div className="text-[11px] text-slate-500 bn">{t('visits')}</div></div>
            <div className="rounded-lg bg-slate-50 p-2"><div className="text-lg font-bold">{fmtNum(meds.reduce((a, x) => a + x.qty, 0), lang)}</div><div className="text-[11px] text-slate-500 bn">{lang === 'bn' ? 'ঔষধ' : 'Medicine'}</div></div>
            <div className="rounded-lg bg-slate-50 p-2"><div className="text-lg font-bold text-red-600">{fmtNum(dr.reduce((a, x) => a + x.cases, 0), lang)}</div><div className="text-[11px] text-slate-500 bn">{lang === 'bn' ? 'রোগ' : 'Disease'}</div></div>
          </div>
        </Card>
      </div>
      <Card title={lang === 'bn' ? 'পরিদর্শন ইতিহাস' : 'Visit History'} padded={false}>
        <Table empty={visits.length === 0} head={<><th className="th">ID</th><th className="th">{t('date')}</th><th className="th">{lang === 'bn' ? 'কর্মকর্তা' : 'Officer'}</th><th className="th">{lang === 'bn' ? 'উদ্দেশ্য' : 'Purpose'}</th><th className="th">{lang === 'bn' ? 'রোগ' : 'Disease'}</th><th className="th">{lang === 'bn' ? 'ঔষধ' : 'Medicine'}</th><th className="th">Follow-up</th></>}>
          {visits.map(v => (
            <tr key={v.id} className="hover:bg-brand-50/40 cursor-pointer" onClick={() => nav(`/visits/${v.id}`)}>
              <td className="td font-mono text-xs">{v.id}</td><td className="td bn">{fmtDate(v.date, lang)}</td><td className="td bn">{s.employees.find(e => e.id === v.employeeId)?.name}</td><td className="td">{v.purpose}</td><td className="td">{v.disease ? <Badge tone={v.severity}>{v.disease}</Badge> : '—'}</td><td className="td text-xs">{v.medicines.map(m => `${s.medicines.find(x => x.id === m.medicineId)?.name?.split(' (')[0]} ×${m.qty}`).join(', ') || '—'}</td><td className="td bn">{fmtDate(v.followUp, lang)}</td>
            </tr>
          ))}
        </Table>
      </Card>
      {edit && <FarmForm open initial={f} onClose={() => setEdit(false)} />}
    </div>
  )
}
