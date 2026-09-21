import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PackagePlus, ArrowLeftRight, PackageMinus, AlertTriangle, CalendarClock, Route, ArrowRight, Warehouse, Building, MapPin, User, Search, CheckCircle2, Plus } from 'lucide-react'
import { useStore, useMe, stockOf, fefoBatches } from '../store/store'
import { useT } from '../i18n'
import { fmtDate, fmtNum, daysUntil, todayISO, addDays } from '../lib/format'
import { SUPPLIER_LIST } from '../data/seed'
import type { Medicine, MedicineCategory } from '../types'
import { PageHeader, Card, Badge, Table, Field, Select, SearchBox, Stat, Tabs, useToast, Modal, KV } from '../components/ui'

const levelIcon = (l: string) => (l === 'Central' ? <Warehouse size={15} /> : l === 'District' ? <Building size={15} /> : l === 'Upazila' ? <MapPin size={15} /> : <User size={15} />)
const minFor = (level: string, m: Medicine) => (level === 'Central' ? m.minStock * 2 : level === 'District' ? m.minStock : Math.round(m.minStock / 4))

function useMyStore() {
  const me = useMe()
  const stores = useStore(s => s.stores)
  const def = me?.storeId ?? (me?.role === 'admin' || me?.role === 'ministry' ? 'ST-C' : stores[0].id)
  return def
}

// ---------------- Inventory ----------------
export function Inventory() {
  const { t, lang } = useT()
  const s = useStore()
  const my = useMyStore()
  const [storeId, setStoreId] = useState(my)
  const [q, setQ] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const store = s.stores.find(x => x.id === storeId)!
  const today = todayISO()
  const rows = useMemo(() => s.medicines.map(m => {
    const bs = s.batches.filter(b => b.storeId === storeId && b.medicineId === m.id && b.qty > 0)
    const qty = bs.reduce((a, b) => a + b.qty, 0)
    const expired = bs.filter(b => b.expiry < today).reduce((a, b) => a + b.qty, 0)
    const soon = bs.filter(b => b.expiry >= today && daysUntil(b.expiry) <= 45).reduce((a, b) => a + b.qty, 0)
    const min = minFor(store.level, m)
    const nearest = bs.filter(b => b.expiry >= today).sort((a, b) => a.expiry.localeCompare(b.expiry))[0]
    return { m, qty, expired, soon, min, batches: bs.length, nearest }
  }).filter(r => !q || r.m.name.toLowerCase().includes(q.toLowerCase()) || r.m.category.toLowerCase().includes(q.toLowerCase())), [s.medicines, s.batches, storeId, q, store.level])
  const low = rows.filter(r => r.qty < r.min).length
  const totalUnits = rows.reduce((a, r) => a + r.qty, 0)
  return (
    <div>
      <PageHeader kicker="MODULE 02 · SUPPLY CHAIN" title={lang === 'bn' ? 'ঔষধ ও ভ্যাকসিন — কেন্দ্র থেকে খামার পর্যন্ত' : 'Medicine & Vaccine — from central store to farm'} subtitle={lang === 'bn' ? 'যেকোনো স্তরে Current Stock ও Minimum Stock তাৎক্ষণিক দেখা যায়, তাই ঘাটতি আগেই ধরা পড়ে।' : 'Current and minimum stock at every level, so shortages are caught early.'}
        actions={<>
          <button className="btn-secondary" onClick={() => setAddOpen(true)}><Plus size={15} /> {lang === 'bn' ? 'নতুন ঔষধ' : 'New Item'}</button>
          <Link to="/medicine/receive" className="btn-secondary"><PackagePlus size={15} /> {t('receive')}</Link>
          <Link to="/medicine/transfer" className="btn-secondary"><ArrowLeftRight size={15} /> {t('transfer')}</Link>
          <Link to="/medicine/distribute" className="btn-primary"><PackageMinus size={15} /> {t('distribute')}</Link>
        </>} />
      {/* chain */}
      <div className="card p-4 mb-5 overflow-x-auto">
        <div className="flex items-center gap-2 min-w-[720px]">
          {[{ l: 'Central', bn: 'কেন্দ্রীয় স্টোর', en: 'Central Store' }, { l: 'District', bn: 'জেলা স্টোর', en: 'District Store' }, { l: 'Upazila', bn: 'উপজেলা স্টোর', en: 'Upazila Store' }, { l: 'Field', bn: 'মাঠ কর্মকর্তা', en: 'Field / Vet Officer' }, { l: 'Farm', bn: 'খামারি', en: 'Farmer / Farm' }].map((x, i, arr) => (
            <div key={x.l} className="flex items-center gap-2 flex-1">
              <div className={`flex-1 rounded-lg border px-3 py-2 ${store.level === x.l ? 'border-brand-500 bg-brand-50' : 'border-slate-200'}`}>
                <div className="flex items-center gap-1.5 text-sm font-semibold bn">{levelIcon(x.l)}{lang === 'bn' ? x.bn : x.en}</div>
                <div className="text-[11px] text-slate-500">{x.l === 'Farm' ? fmtNum(s.txns.filter(t => t.type === 'Distribute').reduce((a, t) => a + t.qty, 0), lang) + (lang === 'bn' ? ' একক বিতরণ' : ' units distributed') : fmtNum(s.batches.filter(b => s.stores.find(st => st.id === b.storeId)?.level === x.l).reduce((a, b) => a + b.qty, 0), lang) + (lang === 'bn' ? ' একক মজুদ' : ' units in stock')}</div>
              </div>
              {i < arr.length - 1 && <ArrowRight size={16} className="text-slate-300 shrink-0" />}
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Stat label={lang === 'bn' ? 'মোট মজুদ · একক' : 'Total Units in Store'} value={fmtNum(totalUnits, lang)} />
        <Stat label={lang === 'bn' ? 'ঘাটতি আইটেম' : 'Items Below Minimum'} value={fmtNum(low, lang)} tone={low ? 'amber' : 'green'} icon={<AlertTriangle size={16} />} />
        <Stat label={t('expiringSoon')} value={fmtNum(rows.reduce((a, r) => a + r.soon, 0), lang)} tone="amber" icon={<CalendarClock size={16} />} />
        <Stat label={t('expired')} value={fmtNum(rows.reduce((a, r) => a + r.expired, 0), lang)} tone="red" icon={<CalendarClock size={16} />} />
      </div>
      <Card padded={false}>
        <div className="p-4 flex flex-wrap gap-3 border-b border-slate-100">
          <Select className="w-full sm:w-72" value={storeId} onChange={setStoreId} options={s.stores.map(x => ({ value: x.id, label: x.name }))} />
          <div className="w-full sm:w-64"><SearchBox value={q} onChange={setQ} /></div>
        </div>
        <Table head={<><th className="th">{lang === 'bn' ? 'ঔষধ / ভ্যাকসিন' : 'Medicine / Vaccine'}</th><th className="th">{lang === 'bn' ? 'শ্রেণি' : 'Category'}</th><th className="th text-right">{t('currentStock')}</th><th className="th text-right">{t('minStock')}</th><th className="th">{lang === 'bn' ? 'অবস্থা' : 'Level'}</th><th className="th text-right">{lang === 'bn' ? 'ব্যাচ' : 'Batches'}</th><th className="th">{lang === 'bn' ? 'নিকটতম মেয়াদ' : 'Nearest Expiry'}</th><th className="th text-right">{t('expired')}</th></>}>
          {rows.map(r => {
            const pct = Math.min(100, Math.round((r.qty / Math.max(1, r.min)) * 100))
            return (
              <tr key={r.m.id} className="hover:bg-brand-50/30">
                <td className="td font-medium">{r.m.name}<div className="text-[11px] text-slate-400">{r.m.unit} · {r.m.species.join(', ')}</div></td>
                <td className="td"><Badge tone="Planned">{r.m.category}</Badge></td>
                <td className="td text-right tabular-nums font-semibold">{fmtNum(r.qty, lang)}</td>
                <td className="td text-right tabular-nums text-slate-500">{fmtNum(r.min, lang)}</td>
                <td className="td w-40"><div className="flex items-center gap-2"><div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className={`h-full rounded-full ${r.qty < r.min ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} /></div>{r.qty < r.min ? <Badge tone="Pending">{t('lowStock')}</Badge> : <Badge tone="Active">OK</Badge>}</div></td>
                <td className="td text-right tabular-nums">{r.batches}</td>
                <td className="td text-xs">{r.nearest ? <span className={daysUntil(r.nearest.expiry) <= 45 ? 'text-amber-600 font-semibold' : ''}>{r.nearest.batchNo} · {fmtDate(r.nearest.expiry, lang)}</span> : '—'}</td>
                <td className="td text-right tabular-nums">{r.expired ? <span className="text-red-600 font-semibold">{fmtNum(r.expired, lang)}</span> : '—'}</td>
              </tr>
            )
          })}
        </Table>
      </Card>
      {addOpen && <NewMedicineModal onClose={() => setAddOpen(false)} />}
    </div>
  )
}

function NewMedicineModal({ onClose }: { onClose: () => void }) {
  const { t, lang } = useT()
  const add = useStore(s => s.addMedicine)
  const toast = useToast()
  const [m, setM] = useState<Omit<Medicine, 'id'>>({ name: '', category: 'Vaccine', unit: 'dose', species: ['Cattle'], minStock: 1000 })
  return (
    <Modal open onClose={onClose} title={lang === 'bn' ? 'নতুন ঔষধ / ভ্যাকসিন' : 'New Medicine / Vaccine'} footer={<><button className="btn-secondary" onClick={onClose}>{t('cancel')}</button><button className="btn-primary" onClick={() => { if (!m.name.trim()) return; add(m); toast.push(lang === 'bn' ? 'আইটেম যোগ হয়েছে' : 'Item added'); onClose() }}>{t('save')}</button></>}>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label={t('name')} required className="sm:col-span-2"><input className="input" value={m.name} onChange={e => setM({ ...m, name: e.target.value })} /></Field>
        <Field label={lang === 'bn' ? 'শ্রেণি' : 'Category'}><Select value={m.category} onChange={v => setM({ ...m, category: v as MedicineCategory })} options={['Antibiotic', 'Vaccine', 'Anthelmintic', 'Vitamin', 'Antiseptic', 'Aqua Chemical', 'Other'].map(x => ({ value: x, label: x }))} /></Field>
        <Field label={lang === 'bn' ? 'একক' : 'Unit'}><input className="input" value={m.unit} onChange={e => setM({ ...m, unit: e.target.value })} /></Field>
        <Field label={t('minStock')}><input className="input" type="number" value={m.minStock} onChange={e => setM({ ...m, minStock: Number(e.target.value) })} /></Field>
        <Field label={lang === 'bn' ? 'প্রজাতি' : 'Species'}><div className="flex flex-wrap gap-1.5">{['Cattle', 'Goat', 'Poultry', 'Duck', 'Fish'].map(sp => { const on = m.species.includes(sp); return <button key={sp} type="button" onClick={() => setM({ ...m, species: on ? m.species.filter(x => x !== sp) : [...m.species, sp] })} className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${on ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600'}`}>{sp}</button> })}</div></Field>
      </div>
    </Modal>
  )
}

// ---------------- Receive ----------------
export function ReceiveStock() {
  const { t, lang } = useT()
  const s = useStore()
  const my = useMyStore()
  const toast = useToast()
  const [f, setF] = useState({ storeId: my, medicineId: s.medicines[0].id, batchNo: '', expiry: addDays(todayISO(), 365), supplier: SUPPLIER_LIST[0], qty: 0, note: '' })
  const [done, setDone] = useState<string | null>(null)
  const med = s.medicines.find(m => m.id === f.medicineId)!
  const recent = s.txns.filter(x => x.type === 'Receive').slice(0, 10)
  const submit = () => {
    if (!f.batchNo.trim() || !f.qty || f.qty <= 0 || !f.expiry) { toast.push(lang === 'bn' ? 'ব্যাচ নং, পরিমাণ ও মেয়াদ আবশ্যক' : 'Batch no., quantity and expiry are required', 'warn'); return }
    if (f.expiry <= todayISO()) { toast.push(lang === 'bn' ? 'মেয়াদোত্তীর্ণ ব্যাচ গ্রহণ করা যাবে না' : 'Cannot receive an expired batch', 'warn'); return }
    s.receiveStock(f)
    setDone(`${med.name} · ${f.batchNo} · ${f.qty} ${med.unit}`)
    toast.push(lang === 'bn' ? 'স্টক গ্রহণ সম্পন্ন' : 'Stock received')
    setF({ ...f, batchNo: '', qty: 0, note: '' })
  }
  return (
    <div>
      <PageHeader kicker="MODULE 02 · RECEIVING" title={lang === 'bn' ? 'স্টক গ্রহণ' : 'Receive Stock'} subtitle={lang === 'bn' ? 'Batch No., Expiry Date ও Supplier প্রতিটি চালানের সাথে যুক্ত থাকে এবং শেষ প্রাপক পর্যন্ত বহাল থাকে।' : 'Batch, expiry and supplier stay attached to every consignment down to the final recipient.'} />
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2" title={lang === 'bn' ? 'চালান এন্ট্রি' : 'Consignment Entry'}>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label={t('store')} required className="sm:col-span-2"><Select value={f.storeId} onChange={v => setF({ ...f, storeId: v })} options={s.stores.map(x => ({ value: x.id, label: x.name }))} /></Field>
            <Field label={lang === 'bn' ? 'ঔষধ / ভ্যাকসিন' : 'Medicine / Vaccine'} required className="sm:col-span-2"><Select value={f.medicineId} onChange={v => setF({ ...f, medicineId: v })} options={s.medicines.map(m => ({ value: m.id, label: `${m.name} (${m.unit})` }))} /></Field>
            <Field label={t('batchNo')} required><input className="input font-mono" placeholder="e.g. 002-202609-C" value={f.batchNo} onChange={e => setF({ ...f, batchNo: e.target.value.toUpperCase() })} /></Field>
            <Field label={t('expiry')} required><input className="input" type="date" value={f.expiry} min={todayISO()} onChange={e => setF({ ...f, expiry: e.target.value })} /></Field>
            <Field label={t('supplier')}><Select value={f.supplier} onChange={v => setF({ ...f, supplier: v })} options={SUPPLIER_LIST.map(x => ({ value: x, label: x }))} /></Field>
            <Field label={`${t('qty')} (${med.unit})`} required><input className="input" type="number" min={1} value={f.qty || ''} onChange={e => setF({ ...f, qty: Number(e.target.value) })} /></Field>
            <Field label={lang === 'bn' ? 'মন্তব্য / চালান নং' : 'Note / Invoice No.'} className="sm:col-span-2"><input className="input" value={f.note} onChange={e => setF({ ...f, note: e.target.value })} /></Field>
          </div>
          <div className="mt-5 flex justify-end"><button className="btn-primary" onClick={submit}><PackagePlus size={16} /> {lang === 'bn' ? 'গ্রহণ নিশ্চিত করুন' : 'Confirm Receipt'}</button></div>
          {done && <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-700"><CheckCircle2 size={16} />{done}</div>}
        </Card>
        <Card title={lang === 'bn' ? 'সাম্প্রতিক গ্রহণ' : 'Recent Receipts'} padded={false}>
          <ul className="divide-y divide-slate-100">
            {recent.map(x => <li key={x.id} className="px-4 py-2.5 text-sm"><div className="font-medium truncate">{s.medicines.find(m => m.id === x.medicineId)?.name}</div><div className="text-xs text-slate-500 flex justify-between"><span className="font-mono">{x.batchNo}</span><span className="tabular-nums font-semibold text-emerald-600">+{fmtNum(x.qty, lang)}</span></div><div className="text-[11px] text-slate-400 bn">{s.stores.find(st => st.id === x.toStoreId)?.name} · {fmtDate(x.date, lang)}</div></li>)}
          </ul>
        </Card>
      </div>
    </div>
  )
}

// ---------------- Transfer ----------------
export function TransferStock() {
  const { t, lang } = useT()
  const s = useStore()
  const my = useMyStore()
  const toast = useToast()
  const [f, setF] = useState({ fromStoreId: my, toStoreId: '', medicineId: s.medicines[0].id, qty: 0, batchNo: '', note: '' })
  const fefo = fefoBatches(s.batches, f.fromStoreId, f.medicineId)
  const avail = fefo.reduce((a, b) => a + b.qty, 0)
  const from = s.stores.find(x => x.id === f.fromStoreId)!
  const targets = s.stores.filter(x => x.id !== f.fromStoreId && (from.level === 'Central' ? x.level === 'District' : from.level === 'District' ? x.level === 'Upazila' && x.district === from.district : x.level !== 'Central'))
  const plan = useMemo(() => { let r = f.qty; const out: { batchNo: string; expiry: string; take: number }[] = []; for (const b of f.batchNo ? fefo.filter(x => x.batchNo === f.batchNo) : fefo) { if (r <= 0) break; const take = Math.min(b.qty, r); r -= take; out.push({ batchNo: b.batchNo, expiry: b.expiry, take }) } return out }, [f.qty, f.batchNo, fefo])
  const submit = () => {
    if (!f.toStoreId || !f.qty) { toast.push(lang === 'bn' ? 'গন্তব্য স্টোর ও পরিমাণ দিন' : 'Select destination store and quantity', 'warn'); return }
    const r = s.transferStock({ ...f, batchNo: f.batchNo || undefined })
    if (!r.ok) { toast.push(r.error!, 'warn'); return }
    toast.push(lang === 'bn' ? `হস্তান্তর সম্পন্ন → ${s.stores.find(x => x.id === f.toStoreId)?.name}` : `Transferred → ${s.stores.find(x => x.id === f.toStoreId)?.name}`)
    setF({ ...f, qty: 0, batchNo: '', note: '' })
  }
  return (
    <div>
      <PageHeader kicker="MODULE 02 · STOCK TRANSFER" title={lang === 'bn' ? 'স্টোর থেকে স্টোরে হস্তান্তর' : 'Store-to-Store Transfer'} subtitle={lang === 'bn' ? 'প্রতিটি হস্তান্তরে প্রেরক, প্রাপক, তারিখ ও পরিমাণ রেকর্ড হয় — কোনো ধাপ খাতার বাইরে থাকে না।' : 'Every hand-over records sender, receiver, date and quantity. No step is off the books.'} />
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label={lang === 'bn' ? 'প্রেরক স্টোর' : 'From Store'} required><Select value={f.fromStoreId} onChange={v => setF({ ...f, fromStoreId: v, toStoreId: '', batchNo: '' })} options={s.stores.filter(x => x.level !== 'Field').map(x => ({ value: x.id, label: x.name }))} /></Field>
            <Field label={lang === 'bn' ? 'প্রাপক স্টোর' : 'To Store'} required><Select value={f.toStoreId} placeholder="—" onChange={v => setF({ ...f, toStoreId: v })} options={targets.map(x => ({ value: x.id, label: x.name }))} /></Field>
            <Field label={lang === 'bn' ? 'ঔষধ / ভ্যাকসিন' : 'Medicine'} required className="sm:col-span-2"><Select value={f.medicineId} onChange={v => setF({ ...f, medicineId: v, batchNo: '' })} options={s.medicines.map(m => ({ value: m.id, label: `${m.name} — ${lang === 'bn' ? 'মজুদ' : 'stock'} ${fmtNum(stockOf(s.batches, f.fromStoreId, m.id), lang)}` }))} /></Field>
            <Field label={t('batchNo')} hint={t('fefo')}><Select value={f.batchNo} placeholder={lang === 'bn' ? 'স্বয়ংক্রিয় (FEFO)' : 'Auto (FEFO)'} onChange={v => setF({ ...f, batchNo: v })} options={fefo.map(b => ({ value: b.batchNo, label: `${b.batchNo} · exp ${b.expiry} · ${b.qty}` }))} /></Field>
            <Field label={`${t('qty')} · ${lang === 'bn' ? 'উপলব্ধ' : 'available'} ${fmtNum(avail, lang)}`} required><input className="input" type="number" min={1} max={avail} value={f.qty || ''} onChange={e => setF({ ...f, qty: Number(e.target.value) })} /></Field>
            <Field label={lang === 'bn' ? 'মন্তব্য' : 'Note'} className="sm:col-span-2"><input className="input" value={f.note} onChange={e => setF({ ...f, note: e.target.value })} /></Field>
          </div>
          <div className="mt-5 flex justify-end"><button className="btn-primary" disabled={!f.qty || f.qty > avail} onClick={submit}><ArrowLeftRight size={16} /> {lang === 'bn' ? 'হস্তান্তর নিশ্চিত করুন' : 'Confirm Transfer'}</button></div>
        </Card>
        <Card title={lang === 'bn' ? 'FEFO পরিকল্পনা' : 'FEFO Pick Plan'} subtitle={lang === 'bn' ? 'যে batch-এর মেয়াদ আগে শেষ হবে, সেটি আগে' : 'Earliest-expiring batch goes first'}>
          {plan.length === 0 ? <p className="text-sm text-slate-400 bn">{lang === 'bn' ? 'পরিমাণ দিলে পরিকল্পনা দেখাবে' : 'Enter a quantity to see the pick plan'}</p> : (
            <ul className="space-y-2">{plan.map((p, i) => <li key={p.batchNo} className="flex items-center gap-2 text-sm"><span className="w-5 h-5 rounded-full bg-brand-500 text-white text-[11px] grid place-items-center font-bold">{i + 1}</span><span className="font-mono text-xs">{p.batchNo}</span><span className="text-xs text-slate-500">exp {fmtDate(p.expiry, lang)}</span><span className="ml-auto font-semibold tabular-nums">{fmtNum(p.take, lang)}</span></li>)}</ul>
          )}
        </Card>
      </div>
    </div>
  )
}

// ---------------- Distribute ----------------
export function DistributeStock() {
  const { t, lang } = useT()
  const s = useStore()
  const my = useMyStore()
  const toast = useToast()
  const [fq, setFq] = useState('')
  const [f, setF] = useState({ fromStoreId: my, medicineId: s.medicines[0].id, qty: 0, farmerId: '', farmId: '', disease: '', batchNo: '', note: '' })
  const [receipt, setReceipt] = useState<{ farmer: string; farmId: string; disease: string; med: string; qty: number; lines: { batchNo: string; qty: number }[]; by: string; date: string } | null>(null)
  const farmer = s.farmers.find(x => x.id === f.farmerId)
  const farms = s.farms.filter(x => x.farmerId === f.farmerId)
  const matches = useMemo(() => { const q = fq.trim().toLowerCase(); if (!q) return []; return s.farmers.filter(x => x.name.toLowerCase().includes(q) || x.id.toLowerCase().includes(q) || x.mobile.includes(q)).slice(0, 6) }, [fq, s.farmers])
  const fefo = fefoBatches(s.batches, f.fromStoreId, f.medicineId)
  const avail = fefo.reduce((a, b) => a + b.qty, 0)
  const med = s.medicines.find(m => m.id === f.medicineId)!
  const me = useMe()!
  const submit = () => {
    if (!f.farmerId || !f.qty) { toast.push(lang === 'bn' ? 'খামারি ও পরিমাণ আবশ্যক' : 'Farmer and quantity are required', 'warn'); return }
    const r = s.distributeStock({ fromStoreId: f.fromStoreId, medicineId: f.medicineId, qty: f.qty, farmerId: f.farmerId, farmId: f.farmId || undefined, disease: f.disease || undefined, batchNo: f.batchNo || undefined, note: f.note || undefined })
    if (!r.ok) { toast.push(r.error!, 'warn'); return }
    setReceipt({ farmer: farmer!.name, farmId: f.farmId || '—', disease: f.disease || '—', med: med.name, qty: f.qty, lines: r.lines!, by: me.name, date: todayISO() })
    toast.push(lang === 'bn' ? 'বিতরণ রেকর্ড হয়েছে' : 'Distribution recorded')
    setF({ ...f, qty: 0, disease: '', batchNo: '', note: '' })
  }
  return (
    <div>
      <PageHeader kicker="MODULE 02 · DISTRIBUTION" title={lang === 'bn' ? 'খামারিকে ঔষধ বিতরণ' : 'Distribute to Farmer'} subtitle={lang === 'bn' ? 'Medicine → Farmer Traceability — কে দিল, কে নিল, কোন batch, কোন রোগে।' : 'Medicine → farmer traceability: who gave, who received, which batch, for which disease.'} />
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <div className="space-y-4">
            <div>
              <label className="label bn">{lang === 'bn' ? 'খামারি' : 'Farmer'} <span className="text-red-500">*</span></label>
              {farmer ? (
                <div className="flex items-center gap-3 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2"><div className="font-semibold bn">{farmer.name}</div><div className="font-mono text-xs text-brand-700">{farmer.id}</div><button className="ml-auto text-xs text-slate-500 hover:text-red-600" onClick={() => setF({ ...f, farmerId: '', farmId: '' })}>{lang === 'bn' ? 'পরিবর্তন' : 'change'}</button></div>
              ) : (
                <div className="relative"><SearchBox value={fq} onChange={setFq} placeholder={lang === 'bn' ? 'নাম, আইডি বা মোবাইল' : 'Name, ID or mobile'} />
                  {matches.length > 0 && <div className="absolute z-[45] mt-1 w-full card p-1">{matches.map(m => <button key={m.id} className="w-full text-left px-3 py-2 rounded-md hover:bg-brand-50 text-sm flex gap-2" onClick={() => { const fm = s.farms.find(x => x.farmerId === m.id); setF({ ...f, farmerId: m.id, farmId: fm?.id ?? '' }); setFq('') }}><span className="bn font-medium">{m.name}</span><span className="font-mono text-xs text-slate-500">{m.id}</span></button>)}</div>}
                </div>
              )}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label={t('farms')}><Select value={f.farmId} placeholder="—" onChange={v => setF({ ...f, farmId: v })} options={farms.map(x => ({ value: x.id, label: `${x.id} · ${x.name}` }))} /></Field>
              <Field label={lang === 'bn' ? 'রোগ / কারণ' : 'Disease / Reason'}><input className="input" list="dz" value={f.disease} onChange={e => setF({ ...f, disease: e.target.value })} /><datalist id="dz">{['FMD', 'Anthrax', 'LSD', 'PPR', 'Newcastle', 'Gumboro', 'EUS', 'Deworming', 'Routine Vaccination'].map(d => <option key={d} value={d} />)}</datalist></Field>
              <Field label={t('store')} required><Select value={f.fromStoreId} onChange={v => setF({ ...f, fromStoreId: v, batchNo: '' })} options={s.stores.map(x => ({ value: x.id, label: x.name }))} /></Field>
              <Field label={lang === 'bn' ? 'ঔষধ / ভ্যাকসিন' : 'Medicine'} required><Select value={f.medicineId} onChange={v => setF({ ...f, medicineId: v, batchNo: '' })} options={s.medicines.map(m => ({ value: m.id, label: `${m.name} — ${fmtNum(stockOf(s.batches, f.fromStoreId, m.id), lang)}` }))} /></Field>
              <Field label={t('batchNo')} hint={t('fefo')}><Select value={f.batchNo} placeholder={lang === 'bn' ? 'স্বয়ংক্রিয় (FEFO)' : 'Auto (FEFO)'} onChange={v => setF({ ...f, batchNo: v })} options={fefo.map(b => ({ value: b.batchNo, label: `${b.batchNo} · exp ${b.expiry} · ${b.qty}` }))} /></Field>
              <Field label={`${t('qty')} (${med.unit}) · ${lang === 'bn' ? 'উপলব্ধ' : 'available'} ${fmtNum(avail, lang)}`} required><input className="input" type="number" min={1} max={avail} value={f.qty || ''} onChange={e => setF({ ...f, qty: Number(e.target.value) })} /></Field>
            </div>
          </div>
          <div className="mt-5 flex justify-end"><button className="btn-primary" disabled={!f.qty || f.qty > avail} onClick={submit}><PackageMinus size={16} /> {lang === 'bn' ? 'বিতরণ নিশ্চিত করুন' : 'Confirm Distribution'}</button></div>
        </Card>
        <Card title={lang === 'bn' ? 'বিতরণ রেকর্ড' : 'Distribution Record'} subtitle={lang === 'bn' ? 'উদাহরণ · একটি বিতরণ রেকর্ড' : 'Last confirmed record'}>
          {receipt ? (
            <div className="space-y-2 text-sm bn">
              <div className="flex items-center gap-2 text-emerald-700 font-semibold"><CheckCircle2 size={16} /> {lang === 'bn' ? 'রেকর্ড সম্পন্ন' : 'Recorded'}</div>
              <KV items={[{ k: lang === 'bn' ? 'খামারি' : 'Farmer', v: receipt.farmer }, { k: 'Farm ID', v: receipt.farmId }, { k: lang === 'bn' ? 'রোগ' : 'Disease', v: receipt.disease }, { k: lang === 'bn' ? 'ঔষধ' : 'Medicine', v: `${receipt.med}, ${receipt.qty}` }, { k: lang === 'bn' ? 'বিতরণকারী' : 'Distributed by', v: receipt.by }, { k: t('date'), v: fmtDate(receipt.date, lang) }]} />
              <div className="pt-2 border-t border-slate-100"><div className="text-[11px] uppercase tracking-wide font-semibold text-slate-400 mb-1">Batch lines</div>{receipt.lines.map(l => <div key={l.batchNo} className="flex justify-between font-mono text-xs"><span>{l.batchNo}</span><span>{l.qty}</span></div>)}</div>
            </div>
          ) : <p className="text-sm text-slate-400 bn">{lang === 'bn' ? 'বিতরণ নিশ্চিত করলে রেকর্ড এখানে দেখাবে' : 'The record will appear here after confirmation'}</p>}
        </Card>
      </div>
    </div>
  )
}

// ---------------- Batches & Expiry ----------------
export function Batches() {
  const { t, lang } = useT()
  const s = useStore()
  const toast = useToast()
  const [storeId, setStoreId] = useState('')
  const [tab, setTab] = useState('all')
  const today = todayISO()
  const list = s.batches.filter(b => b.qty > 0 && (!storeId || b.storeId === storeId)).filter(b => tab === 'all' || (tab === 'soon' && b.expiry >= today && daysUntil(b.expiry) <= 90) || (tab === 'expired' && b.expiry < today)).sort((a, b) => a.expiry.localeCompare(b.expiry))
  const soonN = s.batches.filter(b => b.qty > 0 && (!storeId || b.storeId === storeId) && b.expiry >= today && daysUntil(b.expiry) <= 90).length
  const expN = s.batches.filter(b => b.qty > 0 && (!storeId || b.storeId === storeId) && b.expiry < today).length
  return (
    <div>
      <PageHeader kicker="MODULE 02 · BATCH + EXPIRY MANAGEMENT" title={lang === 'bn' ? 'প্রতিটি বোতলের হিসাব, শেষ প্রাপক পর্যন্ত' : 'Every bottle accounted for, down to the last recipient'} subtitle={t('fefo')} />
      <Card padded={false}>
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3 items-center">
          <Select className="w-full sm:w-72" value={storeId} placeholder={`${t('all')} ${t('store')}`} onChange={setStoreId} options={s.stores.map(x => ({ value: x.id, label: x.name }))} />
        </div>
        <div className="px-4 pt-3"><Tabs value={tab} onChange={setTab} tabs={[{ key: 'all', label: t('all'), count: s.batches.filter(b => b.qty > 0 && (!storeId || b.storeId === storeId)).length }, { key: 'soon', label: lang === 'bn' ? '৯০ দিনের মধ্যে মেয়াদ শেষ' : 'Expiring within 90 days', count: soonN }, { key: 'expired', label: t('expired'), count: expN }]} /></div>
        <Table empty={list.length === 0} head={<><th className="th">{t('batchNo')}</th><th className="th">{lang === 'bn' ? 'ঔষধ' : 'Medicine'}</th><th className="th">{t('store')}</th><th className="th">{t('supplier')}</th><th className="th">{t('expiry')}</th><th className="th">{lang === 'bn' ? 'বাকি দিন' : 'Days Left'}</th><th className="th text-right">{t('qty')}</th><th className="th no-print">{t('actions')}</th></>}>
          {list.map(b => { const d = daysUntil(b.expiry); return (
            <tr key={b.id} className={d < 0 ? 'bg-red-50/40' : d <= 45 ? 'bg-amber-50/40' : ''}>
              <td className="td font-mono text-xs">{b.batchNo}</td><td className="td font-medium">{s.medicines.find(m => m.id === b.medicineId)?.name}</td><td className="td bn text-xs">{s.stores.find(x => x.id === b.storeId)?.name}</td><td className="td text-xs">{b.supplier}</td><td className="td bn">{fmtDate(b.expiry, lang)}</td>
              <td className="td">{d < 0 ? <Badge tone="Expired">{t('expired')}</Badge> : d <= 45 ? <Badge tone="Pending">{fmtNum(d, lang)}</Badge> : <Badge tone="Active">{fmtNum(d, lang)}</Badge>}</td>
              <td className="td text-right tabular-nums font-semibold">{fmtNum(b.qty, lang)}</td>
              <td className="td no-print">{d < 0 && <button className="btn-danger py-1 text-xs" onClick={() => { s.adjustStock({ storeId: b.storeId, medicineId: b.medicineId, batchNo: b.batchNo, delta: -b.qty, note: 'Expired — written off' }); toast.push(lang === 'bn' ? 'মেয়াদোত্তীর্ণ ব্যাচ বাতিল করা হয়েছে' : 'Expired batch written off', 'info') }}>{lang === 'bn' ? 'বাতিল করুন' : 'Write off'}</button>}</td>
            </tr>) })}
        </Table>
      </Card>
    </div>
  )
}

// ---------------- Ledger ----------------
export function Ledger() {
  const { t, lang } = useT()
  const s = useStore()
  const [storeId, setStoreId] = useState('')
  const [medId, setMedId] = useState('')
  const [type, setType] = useState('')
  const list = s.txns.filter(x => (!storeId || x.fromStoreId === storeId || x.toStoreId === storeId) && (!medId || x.medicineId === medId) && (!type || x.type === type))
  // example ledger like slide 9 for a store+medicine
  const summary = useMemo(() => {
    if (!storeId || !medId) return null
    const rec = s.txns.filter(x => x.medicineId === medId && x.toStoreId === storeId && (x.type === 'Receive' || x.type === 'Transfer')).reduce((a, x) => a + x.qty, 0)
    const out = s.txns.filter(x => x.medicineId === medId && x.fromStoreId === storeId && x.type === 'Transfer')
    const dist = s.txns.filter(x => x.medicineId === medId && x.fromStoreId === storeId && x.type === 'Distribute').reduce((a, x) => a + x.qty, 0)
    const adj = s.txns.filter(x => x.medicineId === medId && x.toStoreId === storeId && x.type === 'Adjust').reduce((a, x) => a + x.qty, 0)
    const cur = stockOf(s.batches, storeId, medId)
    const byDest = new Map<string, number>(); out.forEach(x => byDest.set(x.toStoreId!, (byDest.get(x.toStoreId!) ?? 0) + x.qty))
    return { rec, byDest: [...byDest.entries()], dist, adj, cur }
  }, [storeId, medId, s.txns, s.batches])
  return (
    <div>
      <PageHeader kicker="MODULE 02 · STOCK LEDGER" title={t('ledger')} subtitle={lang === 'bn' ? 'Opening, Received, Distributed, Current — প্রতিটি লেনদেন একটি খাতায়।' : 'Opening, received, distributed, current: every transaction in one ledger.'} />
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2" padded={false}>
          <div className="p-4 border-b border-slate-100 grid sm:grid-cols-3 gap-3">
            <Select value={storeId} placeholder={`${t('all')} ${t('store')}`} onChange={setStoreId} options={s.stores.map(x => ({ value: x.id, label: x.name }))} />
            <Select value={medId} placeholder={lang === 'bn' ? 'সকল ঔষধ' : 'All medicines'} onChange={setMedId} options={s.medicines.map(m => ({ value: m.id, label: m.name }))} />
            <Select value={type} placeholder={`${t('all')} ${t('type')}`} onChange={setType} options={['Receive', 'Transfer', 'Distribute', 'Adjust'].map(x => ({ value: x, label: x }))} />
          </div>
          <Table empty={list.length === 0} head={<><th className="th">ID</th><th className="th">{t('date')}</th><th className="th">{t('type')}</th><th className="th">{lang === 'bn' ? 'ঔষধ' : 'Medicine'}</th><th className="th">{t('batchNo')}</th><th className="th">{lang === 'bn' ? 'থেকে → প্রতি' : 'From → To'}</th><th className="th text-right">{t('qty')}</th><th className="th">{lang === 'bn' ? 'দ্বারা' : 'By'}</th></>}>
            {list.slice(0, 300).map(x => (
              <tr key={x.id}><td className="td font-mono text-xs">{x.id}</td><td className="td bn text-xs">{fmtDate(x.date, lang)}</td><td className="td"><Badge>{x.type}</Badge></td><td className="td text-xs font-medium">{s.medicines.find(m => m.id === x.medicineId)?.name}</td><td className="td font-mono text-xs">{x.batchNo}</td>
                <td className="td text-xs bn">{x.fromStoreId ? s.stores.find(st => st.id === x.fromStoreId)?.name : x.note ?? '—'} → {x.toStoreId ? s.stores.find(st => st.id === x.toStoreId)?.name : x.farmerId ? <Link className="text-brand-700 hover:underline" to={`/farmers/${x.farmerId}`}>{s.farmers.find(f => f.id === x.farmerId)?.name}</Link> : '—'}</td>
                <td className={`td text-right tabular-nums font-semibold ${x.type === 'Receive' ? 'text-emerald-600' : x.type === 'Distribute' ? 'text-violet-600' : x.type === 'Adjust' && x.qty < 0 ? 'text-red-600' : ''}`}>{x.type === 'Receive' ? '+' : x.type === 'Distribute' ? '−' : ''}{fmtNum(Math.abs(x.qty), lang)}</td><td className="td text-xs bn">{s.employees.find(e => e.id === x.byEmployeeId)?.name}</td></tr>
            ))}
          </Table>
        </Card>
        <Card title={lang === 'bn' ? 'স্টক সারাংশ' : 'Stock Summary'} subtitle={summary ? `${s.medicines.find(m => m.id === medId)?.name} · ${s.stores.find(x => x.id === storeId)?.name}` : (lang === 'bn' ? 'স্টোর ও ঔষধ নির্বাচন করুন' : 'Select a store and a medicine')}>
          {summary ? (
            <table className="w-full text-sm"><tbody>
              <tr className="border-b border-slate-100"><td className="py-2 bn">{lang === 'bn' ? 'Received (মোট গ্রহণ)' : 'Received'}</td><td className="py-2 text-right tabular-nums font-semibold text-emerald-600">{fmtNum(summary.rec, lang)}</td></tr>
              {summary.byDest.map(([d, q]) => <tr key={d} className="border-b border-slate-100"><td className="py-2 bn text-slate-600">Transferred — {s.stores.find(x => x.id === d)?.name.split('·')[1] ?? d}</td><td className="py-2 text-right tabular-nums">{fmtNum(q, lang)}</td></tr>)}
              <tr className="border-b border-slate-100"><td className="py-2 bn">{lang === 'bn' ? 'Distributed (খামারিকে)' : 'Distributed to farmers'}</td><td className="py-2 text-right tabular-nums text-violet-600">{fmtNum(summary.dist, lang)}</td></tr>
              {summary.adj !== 0 && <tr className="border-b border-slate-100"><td className="py-2 bn">Adjustments</td><td className="py-2 text-right tabular-nums text-red-600">{fmtNum(summary.adj, lang)}</td></tr>}
              <tr><td className="py-2 font-bold bn">{t('currentStock')}</td><td className="py-2 text-right tabular-nums font-bold text-lg">{fmtNum(summary.cur, lang)}</td></tr>
            </tbody></table>
          ) : <div className="text-sm text-slate-400 bn">—</div>}
        </Card>
      </div>
    </div>
  )
}

// ---------------- Traceability ----------------
export function Traceability() {
  const { t, lang } = useT()
  const s = useStore()
  const [q, setQ] = useState('')
  const batches = useMemo(() => [...new Set(s.batches.map(b => b.batchNo))].filter(b => b.toLowerCase().includes(q.toLowerCase())).slice(0, 12), [s.batches, q])
  const [sel, setSel] = useState('')
  const chain = useMemo(() => s.txns.filter(x => x.batchNo === sel).sort((a, b) => a.date.localeCompare(b.date)), [sel, s.txns])
  const b0 = s.batches.find(b => b.batchNo === sel)
  const recipients = chain.filter(x => x.type === 'Distribute')
  return (
    <div>
      <PageHeader kicker="MODULE 02 · TRACEABILITY" title={lang === 'bn' ? 'Medicine → Farmer Traceability' : 'Medicine → Farmer Traceability'} subtitle={lang === 'bn' ? 'একটি ব্যাচ নম্বর দিয়ে খুঁজুন — কেন্দ্র থেকে খামার পর্যন্ত পুরো পথ দেখুন।' : 'Search a batch number and follow it from the central store to every farm.'} />
      <div className="grid lg:grid-cols-3 gap-4">
        <Card title={t('batchNo')}>
          <div className="relative mb-3"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className="input pl-9 font-mono" placeholder="002-202605-A" value={q} onChange={e => setQ(e.target.value)} /></div>
          <ul className="space-y-1 max-h-96 overflow-auto">{batches.map(b => { const m = s.batches.find(x => x.batchNo === b)!; return <li key={b}><button onClick={() => setSel(b)} className={`w-full text-left rounded-md px-3 py-2 text-sm ${sel === b ? 'bg-brand-50 text-brand-700 border border-brand-200' : 'hover:bg-slate-50'}`}><div className="font-mono text-xs font-semibold">{b}</div><div className="text-xs text-slate-500 truncate">{s.medicines.find(x => x.id === m.medicineId)?.name}</div></button></li> })}</ul>
        </Card>
        <div className="lg:col-span-2 space-y-4">
          {b0 ? (
            <>
              <Card title={sel} subtitle={s.medicines.find(x => x.id === b0.medicineId)?.name}>
                <KV items={[{ k: t('supplier'), v: b0.supplier }, { k: t('expiry'), v: fmtDate(b0.expiry, lang) }, { k: lang === 'bn' ? 'মোট গ্রহণ' : 'Total received', v: fmtNum(chain.filter(x => x.type === 'Receive').reduce((a, x) => a + x.qty, 0), lang) }, { k: lang === 'bn' ? 'খামারিকে বিতরণ' : 'Distributed to farmers', v: `${fmtNum(recipients.reduce((a, x) => a + x.qty, 0), lang)} · ${recipients.length} ${lang === 'bn' ? 'জন' : 'recipients'}` }, { k: lang === 'bn' ? 'বর্তমানে যেসব স্টোরে' : 'Currently held at', v: s.batches.filter(b => b.batchNo === sel && b.qty > 0).map(b => `${s.stores.find(x => x.id === b.storeId)?.name.split('·')[1]?.trim() ?? b.storeId} (${b.qty})`).join(', ') || '—' }]} />
              </Card>
              <Card title={lang === 'bn' ? 'চেইন অব কাস্টডি' : 'Chain of Custody'} padded={false}>
                <ol className="divide-y divide-slate-100">
                  {chain.map(x => (
                    <li key={x.id} className="flex items-start gap-3 px-5 py-3 text-sm">
                      <div className={`mt-0.5 w-7 h-7 rounded-full grid place-items-center shrink-0 ${x.type === 'Receive' ? 'bg-emerald-50 text-emerald-600' : x.type === 'Transfer' ? 'bg-brand-50 text-brand-600' : x.type === 'Distribute' ? 'bg-violet-50 text-violet-600' : 'bg-amber-50 text-amber-600'}`}><Route size={14} /></div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium bn">{x.type === 'Receive' ? `${lang === 'bn' ? 'গ্রহণ' : 'Received'} → ${s.stores.find(st => st.id === x.toStoreId)?.name}` : x.type === 'Transfer' ? `${s.stores.find(st => st.id === x.fromStoreId)?.name} → ${s.stores.find(st => st.id === x.toStoreId)?.name}` : x.type === 'Distribute' ? <>{s.stores.find(st => st.id === x.fromStoreId)?.name} → <Link to={`/farmers/${x.farmerId}`} className="text-brand-700 hover:underline">{s.farmers.find(f => f.id === x.farmerId)?.name}</Link> {x.farmId && <span className="font-mono text-xs text-slate-500">({x.farmId})</span>} {x.disease && <Badge tone="High" className="ml-1">{x.disease}</Badge>}</> : `Adjust · ${x.note}`}</div>
                        <div className="text-xs text-slate-500 bn">{fmtDate(x.date, lang)} · {s.employees.find(e => e.id === x.byEmployeeId)?.name}</div>
                      </div>
                      <div className="tabular-nums font-semibold shrink-0">{fmtNum(x.qty, lang)}</div>
                    </li>
                  ))}
                </ol>
              </Card>
            </>
          ) : <div className="card p-10 text-center text-slate-400 bn"><Route className="mx-auto mb-2" size={28} />{lang === 'bn' ? 'বাম পাশ থেকে একটি ব্যাচ নির্বাচন করুন' : 'Select a batch on the left'}</div>}
        </div>
      </div>
    </div>
  )
}
