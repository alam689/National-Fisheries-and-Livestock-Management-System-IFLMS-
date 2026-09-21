import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, Plus, LogOut, Package, ClipboardList, Phone, Eye, Pause, Play, Pencil, Check, Truck, X, IdCard } from 'lucide-react'
import { useStore } from '../../store/store'
import { useFarmerSession } from '../../store/cart'
import { useLang } from '../../i18n'
import { fmtDate, fmtNum } from '../../lib/format'
import { bnName } from '../../data/geo'
import type { Listing, Order, ProductCategory } from '../../types'
import { Badge, Modal, Field, Select, cx, useToast, Tabs } from '../../components/ui'
import { CATS, catOf, unitLabel, taka, CAT_IMAGE, CatIcon } from './meta'
import { ProductImage } from './Public'

function FarmerGate() {
  const { lang } = useLang()
  const farmers = useStore(s => s.farmers)
  const signIn = useFarmerSession(s => s.signIn)
  const [id, setId] = useState('')
  const [mobile, setMobile] = useState('')
  const [err, setErr] = useState('')
  const demo = farmers.filter(f => f.status === 'Active').slice(0, 3)
  const submit = (e: React.FormEvent) => {
    e.preventDefault(); setErr('')
    const f = farmers.find(x => (x.id.toLowerCase() === id.trim().toLowerCase() || x.nid === id.trim()) && x.mobile === mobile.trim())
    if (!f) { setErr(lang === 'bn' ? 'Farmer ID / NID ও মোবাইল নম্বর মিলছে না। নিকটস্থ উপজেলা অফিসে নিবন্ধন করুন।' : 'Farmer ID / NID and mobile do not match. Register at your upazila office.'); return }
    if (f.status !== 'Active') { setErr(lang === 'bn' ? 'এই খামারি আইডি সক্রিয় নয়' : 'This farmer ID is not active'); return }
    signIn(f.id)
  }
  return (
    <div className="max-w-lg mx-auto">
      <div className="card p-6">
        <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 grid place-items-center mb-3"><IdCard size={24} /></div>
        <h1 className="text-xl font-bold bn">{lang === 'bn' ? 'খামারি হিসেবে প্রবেশ করুন' : 'Sign in as a farmer'}</h1>
        <p className="text-sm text-slate-500 bn mt-1">{lang === 'bn' ? 'NFLMS-এ নিবন্ধিত Digital Farmer ID (বা NID) ও নিবন্ধিত মোবাইল নম্বর দিন। আলাদা কোনো অ্যাকাউন্ট লাগবে না।' : 'Use your NFLMS Digital Farmer ID (or NID) and registered mobile number. No separate account needed.'}</p>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <div><label className="label">Farmer ID / NID</label><input className="input font-mono" placeholder="FMR-2026-00123456" value={id} onChange={e => setId(e.target.value)} /></div>
          <div><label className="label bn">{lang === 'bn' ? 'নিবন্ধিত মোবাইল' : 'Registered mobile'}</label><input className="input" placeholder="01XXXXXXXXX" value={mobile} onChange={e => setMobile(e.target.value.replace(/\D/g, ''))} /></div>
          {err && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 bn">{err}</div>}
          <button className="btn-primary w-full h-11"><ShieldCheck size={16} /> {lang === 'bn' ? 'যাচাই করুন' : 'Verify'}</button>
        </form>
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Demo farmers</div>
          <div className="flex flex-wrap gap-1.5">{demo.map(f => <button key={f.id} type="button" onClick={() => { setId(f.id); setMobile(f.mobile) }} className="text-xs rounded-md border border-slate-200 bg-white hover:bg-brand-50 px-2 py-1 bn">{f.name} <span className="font-mono text-slate-400">{f.id}</span></button>)}</div>
        </div>
      </div>
    </div>
  )
}

function ListingForm({ farmerId, initial, onClose }: { farmerId: string; initial?: Listing; onClose: () => void }) {
  const { lang } = useLang()
  const s = useStore()
  const toast = useToast()
  const farmer = s.farmers.find(f => f.id === farmerId)!
  const farms = s.farms.filter(f => f.farmerId === farmerId)
  const [f, setF] = useState({ farmId: initial?.farmId ?? farms[0]?.id ?? '', title: initial?.title ?? '', category: initial?.category ?? 'Fish' as ProductCategory, description: initial?.description ?? '', unit: initial?.unit ?? 'kg', price: initial?.price ?? 0, qty: initial?.qty ?? 0, minOrder: initial?.minOrder ?? 1, image: initial?.image ?? '' })
  const save = () => {
    if (!f.title.trim() || !f.price || !f.qty || !f.minOrder) { toast.push(lang === 'bn' ? 'শিরোনাম, দাম, পরিমাণ ও ন্যূনতম অর্ডার আবশ্যক' : 'Title, price, quantity and minimum order are required', 'warn'); return }
    const farm = s.farms.find(x => x.id === f.farmId)
    const loc = farm?.location ?? farmer.location
    if (initial) { s.updateListing(initial.id, { ...f, image: f.image || undefined, status: initial.status === 'Rejected' ? 'Pending' : initial.status, district: loc.district, upazila: loc.upazila }); toast.push(lang === 'bn' ? 'হালনাগাদ হয়েছে' : 'Updated') }
    else { s.addListing({ ...f, image: f.image || undefined, farmerId, district: loc.district, upazila: loc.upazila }); toast.push(lang === 'bn' ? 'পণ্য জমা হয়েছে — উপজেলা কর্মকর্তার অনুমোদনের পর বাজারে দেখা যাবে' : 'Submitted — visible on the market after officer approval') }
    onClose()
  }
  return (
    <Modal open onClose={onClose} title={initial ? (lang === 'bn' ? 'পণ্য সম্পাদনা' : 'Edit listing') : (lang === 'bn' ? 'নতুন পণ্য যোগ করুন' : 'Add a product')} wide footer={<><button className="btn-secondary" onClick={onClose}>{lang === 'bn' ? 'বাতিল' : 'Cancel'}</button><button className="btn-primary" onClick={save}>{lang === 'bn' ? 'জমা দিন' : 'Submit'}</button></>}>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label={lang === 'bn' ? 'পণ্যের নাম' : 'Product title'} required className="sm:col-span-2"><input className="input bn" placeholder={lang === 'bn' ? 'যেমন — রুই মাছ (১–১.৫ কেজি)' : 'e.g. Rui fish (1–1.5 kg)'} value={f.title} onChange={e => setF({ ...f, title: e.target.value })} /></Field>
        <Field label={lang === 'bn' ? 'শ্রেণি' : 'Category'} required className="sm:col-span-2"><div className="grid grid-cols-5 gap-1.5">{CATS.map(c => <button type="button" key={c.key} onClick={() => setF({ ...f, category: c.key, unit: c.key === 'Milk' ? 'litre' : c.key === 'Cattle' || c.key === 'Buffalo' || c.key === 'Goat' ? 'head' : c.key === 'Egg' || c.key === 'Fingerling' || c.key === 'Duck' ? 'piece' : 'kg' })} className={cx('rounded-md border px-1 py-1.5 text-[11px] font-semibold bn flex flex-col items-center gap-0.5', f.category === c.key ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600')}><CatIcon cat={c.key} size={26} />{lang === 'bn' ? c.bn : c.en}</button>)}</div></Field>
        <Field label={lang === 'bn' ? 'খামার' : 'Farm'}><Select value={f.farmId} placeholder="—" onChange={v => setF({ ...f, farmId: v })} options={farms.map(x => ({ value: x.id, label: `${x.name} · ${x.id}` }))} /></Field>
        <Field label={lang === 'bn' ? 'একক' : 'Unit'}><Select value={f.unit} onChange={v => setF({ ...f, unit: v })} options={['kg', 'piece', 'litre', 'head'].map(u => ({ value: u, label: unitLabel(u, lang) }))} /></Field>
        <Field label={`${lang === 'bn' ? 'দাম (৳) প্রতি' : 'Price (৳) per'} ${unitLabel(f.unit, lang)}`} required><input className="input" type="number" min={1} value={f.price || ''} onChange={e => setF({ ...f, price: Number(e.target.value) })} /></Field>
        <Field label={lang === 'bn' ? 'উপলব্ধ পরিমাণ' : 'Available quantity'} required><input className="input" type="number" min={1} value={f.qty || ''} onChange={e => setF({ ...f, qty: Number(e.target.value) })} /></Field>
        <Field label={lang === 'bn' ? 'ন্যূনতম অর্ডার' : 'Minimum order'} required><input className="input" type="number" min={1} value={f.minOrder || ''} onChange={e => setF({ ...f, minOrder: Number(e.target.value) })} /></Field>
        <Field label={lang === 'bn' ? 'ছবির লিংক (ঐচ্ছিক)' : 'Photo URL (optional)'} hint={lang === 'bn' ? 'খালি রাখলে শ্রেণির ডিফল্ট ছবি ব্যবহার হবে' : 'Leave blank to use the category photo'} className="sm:col-span-2"><div className="flex gap-3 items-start"><input className="input" placeholder="https://…" value={f.image} onChange={e => setF({ ...f, image: e.target.value })} /><img src={f.image || CAT_IMAGE[f.category]} alt="" className="w-16 h-12 rounded-md object-cover bg-slate-100 shrink-0" /></div></Field>
        <Field label={lang === 'bn' ? 'বিবরণ' : 'Description'} className="sm:col-span-2"><textarea className="input bn" rows={3} value={f.description} onChange={e => setF({ ...f, description: e.target.value })} placeholder={lang === 'bn' ? 'ওজন, বয়স, টিকা, ডেলিভারি সুবিধা…' : 'Weight, age, vaccination, delivery…'} /></Field>
      </div>
    </Modal>
  )
}

export function SellPage() {
  const { lang } = useLang()
  const farmerId = useFarmerSession(s => s.farmerId)
  const signOut = useFarmerSession(s => s.signOut)
  const s = useStore()
  const toast = useToast()
  const [tab, setTab] = useState('listings')
  const [form, setForm] = useState<{ open: boolean; initial?: Listing }>({ open: false })
  const farmer = s.farmers.find(f => f.id === farmerId)
  if (!farmer) return <FarmerGate />
  const mine = s.listings.filter(l => l.farmerId === farmer.id)
  const orders = s.orders.filter(o => o.farmerId === farmer.id)
  const revenue = orders.filter(o => o.status === 'Delivered').reduce((a, o) => a + o.total, 0)
  const pending = orders.filter(o => o.status === 'Placed').length
  const next: Record<Order['status'], Order['status'] | null> = { Placed: 'Confirmed', Confirmed: 'Shipped', Shipped: 'Delivered', Delivered: null, Cancelled: null }
  return (
    <div>
      <div className="card p-5 mb-5 flex flex-wrap items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 text-white grid place-items-center text-2xl font-bold bn">{farmer.name[0]}</div>
        <div className="flex-1 min-w-[200px]"><div className="font-bold text-lg bn flex items-center gap-1.5">{farmer.name} <ShieldCheck size={16} className="text-emerald-600" /></div><div className="text-xs text-slate-500 font-mono">{farmer.id}</div><div className="text-xs text-slate-500 bn">{lang === 'bn' ? bnName(farmer.location.upazila) : farmer.location.upazila}, {lang === 'bn' ? bnName(farmer.location.district) : farmer.location.district} · {farmer.mobile}</div></div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div><div className="text-xl font-bold">{fmtNum(mine.filter(l => l.status === 'Active').length, lang)}</div><div className="text-[11px] text-slate-500 bn">{lang === 'bn' ? 'সক্রিয় পণ্য' : 'Active listings'}</div></div>
          <div><div className="text-xl font-bold text-amber-600">{fmtNum(pending, lang)}</div><div className="text-[11px] text-slate-500 bn">{lang === 'bn' ? 'নতুন অর্ডার' : 'New orders'}</div></div>
          <div><div className="text-xl font-bold text-emerald-600">{taka(revenue, lang)}</div><div className="text-[11px] text-slate-500 bn">{lang === 'bn' ? 'মোট বিক্রি' : 'Delivered sales'}</div></div>
        </div>
        <div className="flex gap-2"><button className="btn-primary" onClick={() => setForm({ open: true })}><Plus size={15} /> {lang === 'bn' ? 'নতুন পণ্য' : 'New product'}</button><button className="btn-ghost" onClick={signOut}><LogOut size={15} /></button></div>
      </div>
      <Tabs value={tab} onChange={setTab} tabs={[{ key: 'listings', label: lang === 'bn' ? 'আমার পণ্য' : 'My listings', count: mine.length }, { key: 'orders', label: lang === 'bn' ? 'অর্ডার' : 'Orders', count: orders.length }]} />
      {tab === 'listings' && (
        mine.length === 0 ? <div className="card p-10 text-center text-slate-400 bn"><Package className="mx-auto mb-2" />{lang === 'bn' ? 'এখনো কোনো পণ্য নেই — প্রথম পণ্যটি যোগ করুন' : 'No listings yet — add your first product'}</div> : (
          <div className="grid md:grid-cols-2 gap-3">
            {mine.map(l => { const c = catOf(l.category); return (
              <div key={l.id} className="card p-4 flex gap-3">
                <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0"><ProductImage l={l} className="h-16" iconScale={1.4} /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2"><div className="font-semibold bn line-clamp-1 flex-1">{l.title}</div><Badge tone={l.status === 'Active' ? 'Active' : l.status === 'Pending' ? 'Pending' : l.status === 'Rejected' ? 'Rejected' : l.status === 'SoldOut' ? 'Closed' : 'Draft'}>{l.status}</Badge></div>
                  <div className="text-sm text-brand-700 font-bold">{taka(l.price, lang)} <span className="text-xs text-slate-500 font-normal">/ {unitLabel(l.unit, lang)} · {fmtNum(l.qty, lang)} {lang === 'bn' ? 'উপলব্ধ' : 'left'}</span></div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2"><span className="font-mono">{l.id}</span><span className="flex items-center gap-0.5"><Eye size={11} />{l.views}</span><span>{fmtDate(l.createdAt, lang)}</span></div>
                  {l.reviewNote && <div className="text-xs text-red-600 bn mt-1">{l.reviewNote}</div>}
                  <div className="mt-2 flex gap-1.5 flex-wrap">
                    <button className="btn-secondary py-1 text-xs" onClick={() => setForm({ open: true, initial: l })}><Pencil size={12} /> {lang === 'bn' ? 'সম্পাদনা' : 'Edit'}</button>
                    {l.status === 'Active' && <button className="btn-secondary py-1 text-xs" onClick={() => s.updateListing(l.id, { status: 'Paused' })}><Pause size={12} /> {lang === 'bn' ? 'বিরতি' : 'Pause'}</button>}
                    {(l.status === 'Paused' || l.status === 'SoldOut') && <button className="btn-secondary py-1 text-xs" onClick={() => { if (l.qty <= 0) { toast.push(lang === 'bn' ? 'আগে পরিমাণ হালনাগাদ করুন' : 'Update quantity first', 'warn'); return } s.updateListing(l.id, { status: 'Active' }) }}><Play size={12} /> {lang === 'bn' ? 'সক্রিয় করুন' : 'Activate'}</button>}
                    {l.status === 'Active' && <Link to={`/market/p/${l.id}`} className="btn-ghost py-1 text-xs">{lang === 'bn' ? 'বাজারে দেখুন' : 'View'}</Link>}
                  </div>
                </div>
              </div>) })}
          </div>
        )
      )}
      {tab === 'orders' && (
        orders.length === 0 ? <div className="card p-10 text-center text-slate-400 bn"><ClipboardList className="mx-auto mb-2" />{lang === 'bn' ? 'এখনো কোনো অর্ডার আসেনি' : 'No orders yet'}</div> : (
          <div className="space-y-3">
            {orders.map(o => { const n = next[o.status]; return (
              <div key={o.id} className="card p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Link to={`/market/order/${o.id}`} className="font-mono text-sm font-semibold text-brand-700 hover:underline">{o.id}</Link>
                  <Badge tone={o.status === 'Delivered' ? 'Completed' : o.status === 'Cancelled' ? 'Cancelled' : o.status === 'Placed' ? 'Pending' : 'Open'}>{o.status}</Badge>
                  <span className="text-xs text-slate-500">{fmtDate(o.placedAt, lang)} · {o.payment}</span>
                  <span className="ml-auto font-bold">{taka(o.total, lang)}</span>
                </div>
                <div className="mt-2 grid sm:grid-cols-2 gap-2 text-sm">
                  <div className="bn">{o.items.map(it => <div key={it.listingId}>{it.title} <span className="text-slate-400">× {it.qty} {unitLabel(it.unit, lang)}</span></div>)}</div>
                  <div className="text-xs text-slate-600 bn"><div className="font-semibold text-slate-800">{o.buyer.name} <a href={`tel:${o.buyer.mobile}`} className="text-brand-700 inline-flex items-center gap-0.5 ml-1"><Phone size={11} />{o.buyer.mobile}</a></div><div>{o.buyer.address}, {lang === 'bn' ? bnName(o.buyer.district) : o.buyer.district}</div>{o.note && <div className="italic">“{o.note}”</div>}</div>
                </div>
                {n && <div className="mt-3 flex gap-2"><button className="btn-primary py-1.5 text-xs" onClick={() => { s.updateOrderStatus(o.id, n); toast.push(`${o.id} → ${n}`) }}>{n === 'Confirmed' ? <Check size={13} /> : n === 'Shipped' ? <Truck size={13} /> : <Check size={13} />} {lang === 'bn' ? (n === 'Confirmed' ? 'অর্ডার নিশ্চিত করুন' : n === 'Shipped' ? 'পাঠানো হয়েছে' : 'ডেলিভারি সম্পন্ন') : `Mark ${n}`}</button>{o.status === 'Placed' && <button className="btn-secondary py-1.5 text-xs text-red-600" onClick={() => s.updateOrderStatus(o.id, 'Cancelled')}><X size={13} /> {lang === 'bn' ? 'বাতিল' : 'Cancel'}</button>}</div>}
              </div>) })}
          </div>
        )
      )}
      {form.open && <ListingForm farmerId={farmer.id} initial={form.initial} onClose={() => setForm({ open: false })} />}
    </div>
  )
}
