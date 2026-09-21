import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ShoppingCart, Search, Store, MapPin, Eye, ArrowLeft, Minus, Plus, Trash2, Check, PackageCheck, Phone, ShieldCheck, Database, LogIn, Tag, Truck } from 'lucide-react'
import { useStore } from '../../store/store'
import { useCart, useFarmerSession } from '../../store/cart'
import { useLang } from '../../i18n'
import { fmtDate, fmtNum } from '../../lib/format'
import { bnName, DIVISIONS } from '../../data/geo'
import type { Listing, Order } from '../../types'
import { Badge, cx, useToast } from '../../components/ui'
import { CATS, catOf, unitLabel, taka, ORDER_STEPS, listingImage, isCommons, CAT_IMAGE, CatIcon } from './meta'
import { ZoomImage } from './ZoomImage'
import AiAssistant from '../../components/AiAssistant'

/** Product photo with graceful fallback to the category tile if the image fails to load. */
export function ProductImage({ l, className, iconScale = 2.6 }: { l: Listing; className?: string; iconScale?: number }) {
  const c = catOf(l.category)
  const [err, setErr] = useState(false)
  const src = listingImage(l)
  if (err || !src) return <div className={cx('grid place-items-center', c.bg, className)}><span className={c.fg} style={{ transform: `scale(${iconScale})`, opacity: .8 }}>{c.icon}</span></div>
  return <img src={src} alt={l.title} loading="lazy" onError={() => setErr(true)} className={cx('object-cover w-full h-full bg-slate-100', className)} />
}

/** Round category photo (general image per category) with icon fallback. */
export function CatImage({ cat, className }: { cat: Listing['category']; className?: string }) {
  const c = catOf(cat)
  const [err, setErr] = useState(false)
  if (err) return <span className={cx('grid place-items-center', c.bg, c.fg, className)}>{c.icon}</span>
  return <img src={CAT_IMAGE[cat]} alt={c.en} loading="lazy" onError={() => setErr(true)} className={cx('object-cover bg-slate-100', className)} />
}

// ---------------- Public shell ----------------
export function PublicShell() {
  const { lang, setLang } = useLang()
  const lines = useCart(s => s.lines)
  const farmerId = useFarmerSession(s => s.farmerId)
  const count = lines.reduce((a, l) => a + l.qty, 0)
  return (
    <div className="min-h-full flex flex-col bg-[#f4f6f9]">
      <header className="sticky top-0 z-30 bg-[#0a1530] text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link to="/market" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-400 to-brand-700 grid place-items-center"><Store size={18} /></div>
            <div className="leading-tight"><div className="font-bold text-[15px]"><span className="text-brand-300">NFLMS</span> {lang === 'bn' ? 'বাজার' : 'Bazar'}</div><div className="text-[10.5px] text-slate-400 bn">{lang === 'bn' ? 'খামার থেকে সরাসরি আপনার কাছে' : 'Direct from the farm to you'}</div></div>
          </Link>
          <SearchBar />
          <nav className="ml-auto flex items-center gap-1 sm:gap-2 text-sm font-semibold">
            <NavLink to="/market/sell" className={({ isActive }) => cx('hidden sm:inline-flex items-center gap-1.5 rounded-lg px-3 py-2 hover:bg-white/10 bn', isActive && 'bg-white/10')}><Tag size={15} />{farmerId ? (lang === 'bn' ? 'আমার দোকান' : 'My shop') : (lang === 'bn' ? 'পণ্য বিক্রি করুন' : 'Sell')}</NavLink>
            <NavLink to="/market/cart" className={({ isActive }) => cx('relative inline-flex items-center gap-1.5 rounded-lg px-3 py-2 hover:bg-white/10', isActive && 'bg-white/10')}><ShoppingCart size={17} /><span className="hidden sm:inline bn">{lang === 'bn' ? 'কার্ট' : 'Cart'}</span>{count > 0 && <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-brand-500 text-[11px] grid place-items-center">{count}</span>}</NavLink>
            <div className="flex rounded-lg overflow-hidden border border-white/15 text-xs"><button onClick={() => setLang('bn')} className={cx('px-2 py-1.5', lang === 'bn' ? 'bg-brand-500' : 'hover:bg-white/10')}>বাংলা</button><button onClick={() => setLang('en')} className={cx('px-2 py-1.5', lang === 'en' ? 'bg-brand-500' : 'hover:bg-white/10')}>EN</button></div>
          </nav>
        </div>
        <div className="border-t border-white/10 bg-[#0d1b3d]">
          <div className="max-w-7xl mx-auto px-4 h-10 flex items-center gap-1 overflow-x-auto text-[13px]">
            <NavLink to="/market" end className={({ isActive }) => cx('px-2.5 py-1 rounded-md whitespace-nowrap bn', isActive ? 'bg-white/15 font-semibold' : 'text-slate-300 hover:text-white')}>{lang === 'bn' ? 'সব পণ্য' : 'All'}</NavLink>
            {CATS.filter(c => c.key !== 'Other').map(c => <NavLink key={c.key} to={`/market?cat=${c.key}`} className={({ isActive }) => cx('px-2.5 py-1 rounded-md whitespace-nowrap bn text-slate-300 hover:text-white inline-flex items-center gap-1.5', isActive && new URLSearchParams(window.location.search).get('cat') === c.key && 'bg-white/15 text-white font-semibold')}><CatIcon cat={c.key} size={16} />{lang === 'bn' ? c.bn : c.en}</NavLink>)}
          </div>
        </div>
      </header>
      <main className="flex-1"><div className="max-w-7xl mx-auto px-4 py-6 pb-10"><Outlet /></div></main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-6 pr-20 flex flex-wrap items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2"><Database size={14} className="text-brand-600" /><span className="bn">NFLMS বাজার · {lang === 'bn' ? 'মৎস্য ও প্রাণিসম্পদ মন্ত্রণালয়' : 'Ministry of Fisheries and Livestock'}</span></div>
          <div className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-emerald-600" /><span className="bn">{lang === 'bn' ? 'প্রতিটি বিক্রেতা NFLMS-এ নিবন্ধিত খামারি; প্রতিটি পণ্য উপজেলা কর্মকর্তা কর্তৃক অনুমোদিত' : 'Every seller is an NFLMS-registered farmer; every listing is approved by an upazila officer'}</span></div>
          <Link to="/login" className="ml-auto inline-flex items-center gap-1 text-brand-700 hover:underline"><LogIn size={13} />{lang === 'bn' ? 'কর্মকর্তা লগইন' : 'Officer login'}</Link>
        </div>
      </footer>
      <AiAssistant portal="public" />
    </div>
  )
}

function SearchBar() {
  const { lang } = useLang()
  const nav = useNavigate()
  const [sp] = useSearchParams()
  const [q, setQ] = useState(sp.get('q') ?? '')
  return (
    <form className="hidden md:flex flex-1 max-w-xl" onSubmit={e => { e.preventDefault(); nav(`/market?q=${encodeURIComponent(q)}`) }}>
      <div className="relative w-full"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className="w-full rounded-lg bg-white/10 border border-white/15 pl-9 pr-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:bg-white focus:text-slate-800 transition bn" placeholder={lang === 'bn' ? 'মাছ, গরু, ডিম, দুধ… খুঁজুন' : 'Search fish, cattle, eggs, milk…'} value={q} onChange={e => setQ(e.target.value)} /></div>
    </form>
  )
}

// ---------------- Product card ----------------
function ProductCard({ l }: { l: Listing }) {
  const { lang } = useLang()
  const c = catOf(l.category)
  const farmer = useStore(s => s.farmers.find(f => f.id === l.farmerId))
  return (
    <Link to={`/market/p/${l.id}`} className="card overflow-hidden hover:shadow-pop hover:border-brand-300 transition group">
      <div className="h-40 relative overflow-hidden bg-slate-100">
        <ProductImage l={l} className="h-40 group-hover:scale-105 transition duration-500" />
        <span className={cx('absolute top-2 left-2 badge bg-white/90', c.fg)}>{lang === 'bn' ? c.bn : c.en}</span>
        {l.status === 'SoldOut' && <span className="absolute top-2 right-2 badge bg-slate-800 text-white">{lang === 'bn' ? 'বিক্রি শেষ' : 'Sold out'}</span>}
      </div>
      <div className="p-3">
        <div className="font-semibold text-slate-900 bn leading-snug line-clamp-2 min-h-[40px]">{l.title}</div>
        <div className="mt-1.5 flex items-baseline gap-1"><span className="text-lg font-bold text-brand-700">{taka(l.price, lang)}</span><span className="text-xs text-slate-500 bn">/ {unitLabel(l.unit, lang)}</span></div>
        <div className="mt-1 text-[11px] text-slate-500 bn flex items-center gap-1 truncate"><MapPin size={11} />{lang === 'bn' ? bnName(l.upazila) : l.upazila}, {lang === 'bn' ? bnName(l.district) : l.district} · {farmer?.name}</div>
      </div>
    </Link>
  )
}

// ---------------- Storefront ----------------
export function Storefront() {
  const { lang } = useLang()
  const listings = useStore(s => s.listings)
  const [sp, setSp] = useSearchParams()
  const cat = sp.get('cat') ?? ''
  const q = (sp.get('q') ?? '').toLowerCase()
  const dist = sp.get('district') ?? ''
  const upz = sp.get('upazila') ?? ''
  const sort = sp.get('sort') ?? 'new'
  const list = useMemo(() => {
    let out = listings.filter(l => (l.status === 'Active' || l.status === 'SoldOut') && (!cat || l.category === cat) && (!dist || l.district === dist) && (!upz || l.upazila === upz) && (!q || l.title.toLowerCase().includes(q) || l.description.toLowerCase().includes(q) || l.category.toLowerCase().includes(q)))
    if (sort === 'priceAsc') out = [...out].sort((a, b) => a.price - b.price)
    else if (sort === 'priceDesc') out = [...out].sort((a, b) => b.price - a.price)
    else if (sort === 'popular') out = [...out].sort((a, b) => b.views - a.views)
    return out.sort((a, b) => (a.status === 'SoldOut' ? 1 : 0) - (b.status === 'SoldOut' ? 1 : 0))
  }, [listings, cat, q, dist, upz, sort])
  const districts = useMemo(() => [...new Set(listings.filter(l => l.status === 'Active').map(l => l.district))].sort(), [listings])
  const upazilas = useMemo(() => (dist ? [...new Set(listings.filter(l => l.status === 'Active' && l.district === dist).map(l => l.upazila))].sort() : []), [listings, dist])
  const set = (k: string, v: string) => { const n = new URLSearchParams(sp); if (v) n.set(k, v); else n.delete(k); if (k === 'district') n.delete('upazila'); setSp(n) }
  const counts = (k: string) => listings.filter(l => l.status === 'Active' && l.category === k).length
  return (
    <div>
      {!cat && !q && (
        <div className="rounded-2xl bg-[radial-gradient(700px_300px_at_10%_0%,rgba(38,84,196,.55),transparent_60%),linear-gradient(120deg,#0b1633,#14306b)] text-white p-6 sm:p-8 mb-6 relative overflow-hidden">
          <div className="max-w-xl relative z-10">
            <div className="text-[11px] font-bold tracking-[.2em] uppercase text-brand-300">NFLMS Bazar · {lang === 'bn' ? 'সরকারি খামারি বাজার' : 'Government farmer marketplace'}</div>
            <h1 className="text-2xl sm:text-3xl font-bold mt-2 bn leading-tight">{lang === 'bn' ? 'নিবন্ধিত খামারির কাছ থেকে সরাসরি কিনুন — মাছ, গরু, ডিম, দুধ' : 'Buy directly from registered farmers — fish, cattle, eggs, milk'}</h1>
            <p className="text-sm text-slate-300 mt-2 bn">{lang === 'bn' ? 'মধ্যস্বত্বভোগী নেই। প্রতিটি বিক্রেতার Farmer ID, খামার ও টিকার রেকর্ড NFLMS-এ যাচাইকৃত।' : 'No middlemen. Every seller is verified against the NFLMS farmer and farm registry, including vaccination records.'}</p>
            <div className="mt-4 flex flex-wrap gap-2"><Link to="/market/sell" className="btn-primary"><Tag size={15} /> {lang === 'bn' ? 'খামারি? পণ্য বিক্রি করুন' : 'Farmer? Sell your produce'}</Link><Link to="/market/track" className="btn bg-white/10 text-white hover:bg-white/20"><Truck size={15} /> {lang === 'bn' ? 'অর্ডার ট্র্যাক করুন' : 'Track an order'}</Link></div>
          </div>
        </div>
      )}
      {!cat && !q && (
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-10 gap-2 mb-6">
          {CATS.filter(c => c.key !== 'Other').map(c => <button key={c.key} onClick={() => set('cat', c.key)} className="card p-3 flex flex-col items-center gap-2 hover:border-brand-300 hover:shadow-pop transition group"><span className={cx('w-16 h-16 rounded-full grid place-items-center group-hover:scale-105 transition', c.bg)}><CatIcon cat={c.key} size={38} /></span><span className="text-xs font-semibold bn text-center">{lang === 'bn' ? c.bn : c.en}</span><span className="text-[10px] text-slate-400">{fmtNum(counts(c.key), lang)}</span></button>)}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <h2 className="font-bold text-lg bn mr-2">{cat ? (lang === 'bn' ? catOf(cat as Listing['category']).bn : catOf(cat as Listing['category']).en) : q ? `"${sp.get('q')}"` : (lang === 'bn' ? 'সব পণ্য' : 'All products')} <span className="text-sm text-slate-400 font-normal">({fmtNum(list.length, lang)})</span></h2>
        {(cat || q || dist || upz) && <button className="text-xs text-brand-700 hover:underline" onClick={() => setSp(new URLSearchParams())}>{lang === 'bn' ? 'সব দেখুন' : 'Clear'}</button>}
        {dist && <span className="badge bg-brand-50 text-brand-700 bn"><MapPin size={11} className="mr-1" />{upz ? `${lang === 'bn' ? bnName(upz) : upz}, ` : ''}{lang === 'bn' ? bnName(dist) : dist}</span>}
        <div className="ml-auto flex gap-2">
          <select className="input w-44 py-1.5 text-xs bg-white" value={dist} onChange={e => set('district', e.target.value)}><option value="">{lang === 'bn' ? 'সকল জেলা' : 'All districts'}</option>{districts.map(d => <option key={d} value={d}>{lang === 'bn' ? bnName(d) : d}</option>)}</select>
          <select className="input w-44 py-1.5 text-xs bg-white disabled:opacity-50" value={upz} disabled={!dist} onChange={e => set('upazila', e.target.value)} title={!dist ? (lang === 'bn' ? 'আগে জেলা নির্বাচন করুন' : 'Select a district first') : undefined}><option value="">{lang === 'bn' ? 'সকল উপজেলা / থানা' : 'All upazilas / thanas'}</option>{upazilas.map(u => <option key={u} value={u}>{lang === 'bn' ? bnName(u) : u}</option>)}</select>
          <select className="input w-40 py-1.5 text-xs bg-white" value={sort} onChange={e => set('sort', e.target.value)}><option value="new">{lang === 'bn' ? 'নতুন আগে' : 'Newest'}</option><option value="popular">{lang === 'bn' ? 'জনপ্রিয়' : 'Popular'}</option><option value="priceAsc">{lang === 'bn' ? 'দাম কম → বেশি' : 'Price low → high'}</option><option value="priceDesc">{lang === 'bn' ? 'দাম বেশি → কম' : 'Price high → low'}</option></select>
        </div>
      </div>
      {list.length === 0 ? <div className="card p-12 text-center text-slate-400 bn">{lang === 'bn' ? 'কোনো পণ্য পাওয়া যায়নি' : 'No products found'}</div> : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">{list.map(l => <ProductCard key={l.id} l={l} />)}</div>
      )}
    </div>
  )
}

// ---------------- Product detail ----------------
export function ProductPage() {
  const { id } = useParams()
  const { lang } = useLang()
  const s = useStore()
  const cart = useCart()
  const toast = useToast()
  const nav = useNavigate()
  const l = s.listings.find(x => x.id === id)
  const [qty, setQty] = useState(l?.minOrder ?? 1)
  useEffect(() => { if (l) s.viewListing(l.id) }, [id])
  if (!l || (l.status !== 'Active' && l.status !== 'SoldOut')) return <div className="card p-10 text-center text-slate-500 bn">{lang === 'bn' ? 'পণ্যটি পাওয়া যায়নি' : 'Product not found'}</div>
  const c = catOf(l.category)
  const farmer = s.farmers.find(f => f.id === l.farmerId)
  const farm = s.farms.find(f => f.id === l.farmId)
  const trainings = s.enrollments.filter(e => e.farmerId === l.farmerId && e.certificateNo).length
  const vacc = s.txns.filter(t => t.type === 'Distribute' && t.farmerId === l.farmerId && s.medicines.find(m => m.id === t.medicineId)?.category === 'Vaccine').length
  const others = s.listings.filter(x => x.farmerId === l.farmerId && x.id !== l.id && x.status === 'Active')
  const sold = l.status === 'SoldOut'
  const add = () => { if (qty < l.minOrder || qty > l.qty) return; cart.add(l.id, qty); toast.push(lang === 'bn' ? 'কার্টে যোগ হয়েছে' : 'Added to cart') }
  return (
    <div>
      <Link to="/market" className="inline-flex items-center gap-1 text-sm text-brand-700 hover:underline mb-4"><ArrowLeft size={14} />{lang === 'bn' ? 'বাজারে ফিরুন' : 'Back to market'}</Link>
      <div className="grid lg:grid-cols-5 gap-5">
        <div className="lg:col-span-2 card overflow-hidden h-72 lg:h-[420px] relative">
          <ZoomImage src={listingImage(l)} alt={l.title} className="h-full" fallback={<ProductImage l={l} className="h-full" iconScale={5} />} />
          {isCommons(listingImage(l)) && <span className="absolute bottom-1.5 right-2 text-[10px] text-white/80 bg-black/40 rounded px-1.5 py-0.5 pointer-events-none">Photo: Wikimedia Commons · CC</span>}
        </div>
        <div className="lg:col-span-3 space-y-4">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-2"><span className={cx('badge', c.bg, c.fg)}>{lang === 'bn' ? c.bn : c.en}</span><span className="text-xs text-slate-400 flex items-center gap-1"><Eye size={12} />{fmtNum(l.views, lang)}</span><span className="text-xs text-slate-400 font-mono">{l.id}</span></div>
            <h1 className="text-2xl font-bold bn text-slate-900">{l.title}</h1>
            <div className="mt-2 flex items-baseline gap-2"><span className="text-3xl font-bold text-brand-700">{taka(l.price, lang)}</span><span className="text-slate-500 bn">/ {unitLabel(l.unit, lang)}</span></div>
            <p className="mt-3 text-slate-600 bn leading-relaxed">{l.description}</p>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
              <div className="rounded-lg bg-slate-50 p-2"><div className="text-[11px] text-slate-400 bn">{lang === 'bn' ? 'উপলব্ধ' : 'Available'}</div><div className="font-semibold">{fmtNum(l.qty, lang)} {unitLabel(l.unit, lang)}</div></div>
              <div className="rounded-lg bg-slate-50 p-2"><div className="text-[11px] text-slate-400 bn">{lang === 'bn' ? 'ন্যূনতম অর্ডার' : 'Minimum order'}</div><div className="font-semibold">{fmtNum(l.minOrder, lang)} {unitLabel(l.unit, lang)}</div></div>
              <div className="rounded-lg bg-slate-50 p-2"><div className="text-[11px] text-slate-400 bn">{lang === 'bn' ? 'অবস্থান' : 'Location'}</div><div className="font-semibold bn">{lang === 'bn' ? bnName(l.upazila) : l.upazila}, {lang === 'bn' ? bnName(l.district) : l.district}</div></div>
            </div>
            {!sold ? (
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <div className="flex items-center rounded-lg border border-slate-200 overflow-hidden"><button className="px-3 py-2 hover:bg-slate-50" onClick={() => setQty(q => Math.max(l.minOrder, q - l.minOrder))}><Minus size={14} /></button><input className="w-20 text-center py-2 text-sm font-semibold focus:outline-none" type="number" value={qty} min={l.minOrder} max={l.qty} onChange={e => setQty(Number(e.target.value))} /><button className="px-3 py-2 hover:bg-slate-50" onClick={() => setQty(q => Math.min(l.qty, q + l.minOrder))}><Plus size={14} /></button><span className="px-2 text-xs text-slate-500 bn border-l border-slate-200 py-2">{unitLabel(l.unit, lang)}</span></div>
                <div className="text-sm text-slate-600">= <span className="font-bold text-slate-900">{taka(qty * l.price, lang)}</span></div>
                <button className="btn-primary" disabled={qty < l.minOrder || qty > l.qty} onClick={add}><ShoppingCart size={16} /> {lang === 'bn' ? 'কার্টে যোগ করুন' : 'Add to cart'}</button>
                <button className="btn-secondary" disabled={qty < l.minOrder || qty > l.qty} onClick={() => { add(); nav('/market/checkout') }}>{lang === 'bn' ? 'এখনই কিনুন' : 'Buy now'}</button>
              </div>
            ) : <div className="mt-5 badge bg-slate-800 text-white">{lang === 'bn' ? 'বিক্রি শেষ' : 'Sold out'}</div>}
          </div>
          <div className="card p-5">
            <div className="kicker mb-2">{lang === 'bn' ? 'বিক্রেতা · যাচাইকৃত খামারি' : 'Seller · Verified farmer'}</div>
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 text-white grid place-items-center text-xl font-bold bn">{farmer?.name[0]}</div>
              <div className="flex-1">
                <div className="font-semibold bn flex items-center gap-1.5">{farmer?.name} <ShieldCheck size={15} className="text-emerald-600" /></div>
                <div className="text-xs text-slate-500 font-mono">{farmer?.id}{farm && ` · ${farm.id}`}</div>
                <div className="text-xs text-slate-500 bn mt-0.5">{farm?.name} · {farm?.type} · {lang === 'bn' ? 'নিবন্ধিত' : 'Registered'} {fmtDate(farmer?.registeredAt, lang)}</div>
                <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                  <span className="badge bg-emerald-50 text-emerald-700"><Check size={11} className="mr-1" />NFLMS {lang === 'bn' ? 'নিবন্ধিত খামার' : 'registered farm'}</span>
                  {vacc > 0 && <span className="badge bg-brand-50 text-brand-700">{fmtNum(vacc, lang)} {lang === 'bn' ? 'টি টিকা রেকর্ড' : 'vaccination records'}</span>}
                  {trainings > 0 && <span className="badge bg-amber-50 text-amber-700">{fmtNum(trainings, lang)} {lang === 'bn' ? 'টি প্রশিক্ষণ সনদ' : 'training certificates'}</span>}
                </div>
              </div>
              <a href={`tel:${farmer?.mobile}`} className="btn-secondary py-1.5 text-xs"><Phone size={13} /> {lang === 'bn' ? 'কল' : 'Call'}</a>
            </div>
          </div>
        </div>
      </div>
      {others.length > 0 && <div className="mt-8"><h3 className="font-bold bn mb-3">{lang === 'bn' ? 'এই খামারির আরও পণ্য' : 'More from this farmer'}</h3><div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3">{others.map(x => <ProductCard key={x.id} l={x} />)}</div></div>}
    </div>
  )
}

// ---------------- Cart ----------------
export function CartPage() {
  const { lang } = useLang()
  const cart = useCart()
  const listings = useStore(s => s.listings)
  const rows = cart.lines.map(c => ({ c, l: listings.find(x => x.id === c.listingId) })).filter(r => r.l) as { c: { listingId: string; qty: number }; l: Listing }[]
  const total = rows.reduce((a, r) => a + r.c.qty * r.l.price, 0)
  if (rows.length === 0) return <div className="card p-12 text-center"><ShoppingCart className="mx-auto text-slate-300 mb-2" size={36} /><p className="text-slate-500 bn">{lang === 'bn' ? 'আপনার কার্ট খালি' : 'Your cart is empty'}</p><Link to="/market" className="btn-primary mt-4">{lang === 'bn' ? 'কেনাকাটা শুরু করুন' : 'Start shopping'}</Link></div>
  return (
    <div className="grid lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 card divide-y divide-slate-100">
        {rows.map(({ c, l }) => { const cat = catOf(l.category); const bad = c.qty < l.minOrder || c.qty > l.qty || l.status !== 'Active'; return (
          <div key={l.id} className="p-4 flex items-center gap-3">
            <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0"><ProductImage l={l} className="h-16" iconScale={1.4} /></div>
            <div className="flex-1 min-w-0"><Link to={`/market/p/${l.id}`} className="font-semibold bn hover:text-brand-700 line-clamp-1">{l.title}</Link><div className="text-xs text-slate-500">{taka(l.price, lang)} / {unitLabel(l.unit, lang)} · {lang === 'bn' ? 'ন্যূনতম' : 'min'} {l.minOrder} · {lang === 'bn' ? 'উপলব্ধ' : 'avail.'} {l.qty}</div>{bad && <div className="text-xs text-red-600 bn">{l.status !== 'Active' ? (lang === 'bn' ? 'পণ্যটি আর উপলব্ধ নেই' : 'No longer available') : (lang === 'bn' ? 'পরিমাণ সীমার বাইরে' : 'Quantity out of range')}</div>}</div>
            <div className="flex items-center rounded-lg border border-slate-200"><button className="px-2 py-1.5" onClick={() => cart.setQty(l.id, Math.max(l.minOrder, c.qty - l.minOrder))}><Minus size={13} /></button><input className="w-16 text-center text-sm py-1.5 focus:outline-none" type="number" value={c.qty} onChange={e => cart.setQty(l.id, Number(e.target.value))} /><button className="px-2 py-1.5" onClick={() => cart.setQty(l.id, Math.min(l.qty, c.qty + l.minOrder))}><Plus size={13} /></button></div>
            <div className="w-24 text-right font-bold">{taka(c.qty * l.price, lang)}</div>
            <button className="btn-ghost p-1.5 text-red-500" onClick={() => cart.remove(l.id)}><Trash2 size={15} /></button>
          </div>) })}
      </div>
      <div className="card p-5 h-fit">
        <div className="font-bold bn mb-3">{lang === 'bn' ? 'অর্ডার সারাংশ' : 'Order summary'}</div>
        <div className="flex justify-between text-sm py-1"><span className="bn">{lang === 'bn' ? 'পণ্যের মূল্য' : 'Subtotal'}</span><span>{taka(total, lang)}</span></div>
        <div className="flex justify-between text-sm py-1 text-slate-500"><span className="bn">{lang === 'bn' ? 'ডেলিভারি' : 'Delivery'}</span><span className="bn">{lang === 'bn' ? 'বিক্রেতার সাথে আলোচনা' : 'Arranged with seller'}</span></div>
        <div className="flex justify-between font-bold text-lg border-t border-slate-100 mt-2 pt-2"><span className="bn">{lang === 'bn' ? 'মোট' : 'Total'}</span><span>{taka(total, lang)}</span></div>
        <Link to="/market/checkout" className="btn-primary w-full mt-4">{lang === 'bn' ? 'চেকআউট' : 'Checkout'}</Link>
        <p className="text-[11px] text-slate-400 mt-3 bn">{lang === 'bn' ? 'একাধিক খামারির পণ্য থাকলে প্রতিটি খামারির জন্য আলাদা অর্ডার তৈরি হবে।' : 'Items from different farmers become separate orders.'}</p>
      </div>
    </div>
  )
}

// ---------------- Checkout ----------------
export function CheckoutPage() {
  const { lang } = useLang()
  const cart = useCart()
  const s = useStore()
  const nav = useNavigate()
  const [b, setB] = useState({ name: '', mobile: '', address: '', district: 'Dhaka', payment: 'COD' as Order['payment'], note: '' })
  const [err, setErr] = useState('')
  const rows = cart.lines.map(c => ({ c, l: s.listings.find(x => x.id === c.listingId) })).filter(r => r.l) as { c: { listingId: string; qty: number }; l: Listing }[]
  const total = rows.reduce((a, r) => a + r.c.qty * r.l.price, 0)
  const sellers = [...new Set(rows.map(r => r.l.farmerId))]
  const districts = DIVISIONS.flatMap(d => d.districts.map(x => x.name)).sort()
  const submit = (e: React.FormEvent) => {
    e.preventDefault(); setErr('')
    const r = s.placeOrder({ items: cart.lines, buyer: { name: b.name, mobile: b.mobile, address: b.address, district: b.district }, payment: b.payment, note: b.note })
    if (!r.ok) { setErr(r.error!); return }
    cart.clear()
    nav(`/market/order/${r.orders![0].id}`, { state: { all: r.orders!.map(o => o.id), mobile: b.mobile } })
  }
  if (rows.length === 0) return <div className="card p-10 text-center text-slate-500 bn">{lang === 'bn' ? 'কার্ট খালি' : 'Cart is empty'}</div>
  return (
    <form onSubmit={submit} className="grid lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 space-y-4">
        <div className="card p-5">
          <div className="font-bold bn mb-3">{lang === 'bn' ? 'ক্রেতার তথ্য' : 'Buyer details'}</div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="label bn">{lang === 'bn' ? 'নাম' : 'Name'} *</label><input className="input bn" value={b.name} onChange={e => setB({ ...b, name: e.target.value })} /></div>
            <div><label className="label bn">{lang === 'bn' ? 'মোবাইল' : 'Mobile'} *</label><input className="input" placeholder="01XXXXXXXXX" value={b.mobile} onChange={e => setB({ ...b, mobile: e.target.value.replace(/\D/g, '') })} /></div>
            <div className="sm:col-span-2"><label className="label bn">{lang === 'bn' ? 'ডেলিভারি ঠিকানা' : 'Delivery address'} *</label><textarea className="input bn" rows={2} value={b.address} onChange={e => setB({ ...b, address: e.target.value })} /></div>
            <div><label className="label bn">{lang === 'bn' ? 'জেলা' : 'District'}</label><select className="input" value={b.district} onChange={e => setB({ ...b, district: e.target.value })}>{districts.map(d => <option key={d} value={d}>{lang === 'bn' ? bnName(d) : d}</option>)}</select></div>
            <div><label className="label bn">{lang === 'bn' ? 'বিশেষ নির্দেশনা' : 'Note to seller'}</label><input className="input bn" value={b.note} onChange={e => setB({ ...b, note: e.target.value })} /></div>
          </div>
        </div>
        <div className="card p-5">
          <div className="font-bold bn mb-3">{lang === 'bn' ? 'পেমেন্ট' : 'Payment'}</div>
          <div className="grid grid-cols-3 gap-2">
            {([['COD', lang === 'bn' ? 'ক্যাশ অন ডেলিভারি' : 'Cash on delivery'], ['bKash', 'bKash'], ['Nagad', 'Nagad']] as const).map(([k, label]) => <button type="button" key={k} onClick={() => setB({ ...b, payment: k })} className={cx('rounded-lg border p-3 text-sm font-semibold bn', b.payment === k ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200')}>{label}</button>)}
          </div>
          {b.payment !== 'COD' && <p className="text-xs text-slate-500 mt-2 bn">{lang === 'bn' ? 'অর্ডার নিশ্চিত হলে বিক্রেতার মোবাইল নম্বরে পেমেন্ট করুন। (ডেমো — কোনো প্রকৃত লেনদেন হবে না)' : 'Pay to the seller\'s mobile number once the order is confirmed. (Demo — no real transaction.)'}</p>}
        </div>
        {err && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 bn">{err}</div>}
      </div>
      <div className="card p-5 h-fit">
        <div className="font-bold bn mb-3">{lang === 'bn' ? 'আপনার অর্ডার' : 'Your order'}</div>
        <ul className="divide-y divide-slate-100 text-sm">{rows.map(({ c, l }) => <li key={l.id} className="py-2 flex justify-between gap-2"><span className="bn line-clamp-1">{l.title} <span className="text-slate-400">× {c.qty}</span></span><span className="shrink-0 font-semibold">{taka(c.qty * l.price, lang)}</span></li>)}</ul>
        <div className="flex justify-between font-bold text-lg border-t border-slate-100 mt-2 pt-2"><span className="bn">{lang === 'bn' ? 'মোট' : 'Total'}</span><span>{taka(total, lang)}</span></div>
        {sellers.length > 1 && <p className="text-[11px] text-slate-500 mt-2 bn">{sellers.length} {lang === 'bn' ? 'জন খামারি — ' + sellers.length + ' টি আলাদা অর্ডার হবে' : 'farmers — will create ' + sellers.length + ' orders'}</p>}
        <button className="btn-primary w-full mt-4"><PackageCheck size={16} /> {lang === 'bn' ? 'অর্ডার নিশ্চিত করুন' : 'Place order'}</button>
      </div>
    </form>
  )
}

// ---------------- Order tracking ----------------
export function OrderPage() {
  const { id } = useParams()
  const { lang } = useLang()
  const s = useStore()
  const o = s.orders.find(x => x.id === id)
  if (!o) return <div className="card p-10 text-center text-slate-500 bn">{lang === 'bn' ? 'অর্ডার পাওয়া যায়নি' : 'Order not found'}</div>
  const farmer = s.farmers.find(f => f.id === o.farmerId)
  const idx = ORDER_STEPS.findIndex(x => x.k === o.status)
  const related = s.orders.filter(x => x.buyer.mobile === o.buyer.mobile && x.id !== o.id && x.placedAt === o.placedAt)
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="card p-6 text-center">
        <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 text-emerald-600 grid place-items-center"><Check size={28} /></div>
        <h1 className="text-xl font-bold bn mt-3">{lang === 'bn' ? 'অর্ডার গৃহীত হয়েছে' : 'Order received'}</h1>
        <div className="font-mono text-brand-700 font-semibold mt-1">{o.id}</div>
        <p className="text-sm text-slate-500 bn mt-1">{lang === 'bn' ? 'বিক্রেতা শীঘ্রই আপনার সাথে যোগাযোগ করবেন। এই নম্বর দিয়ে অর্ডার ট্র্যাক করুন।' : 'The seller will contact you shortly. Use this number to track your order.'}</p>
        {related.length > 0 && <div className="mt-2 text-xs bn">{lang === 'bn' ? 'একই সময়ের অন্যান্য অর্ডার:' : 'Other orders placed together:'} {related.map(r => <Link key={r.id} to={`/market/order/${r.id}`} className="font-mono text-brand-700 hover:underline ml-1">{r.id}</Link>)}</div>}
      </div>
      <div className="card p-5">
        {o.status === 'Cancelled' ? <Badge tone="Cancelled">{lang === 'bn' ? 'বাতিল' : 'Cancelled'}</Badge> : (
          <ol className="flex items-center">
            {ORDER_STEPS.map((st, i) => <li key={st.k} className="flex-1 flex flex-col items-center relative"><div className={cx('w-8 h-8 rounded-full grid place-items-center text-xs font-bold z-10', i <= idx ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-400')}>{i < idx ? <Check size={14} /> : i + 1}</div><div className={cx('text-[11px] mt-1 bn text-center', i <= idx ? 'text-slate-800 font-semibold' : 'text-slate-400')}>{lang === 'bn' ? st.bn : st.en}</div>{i < ORDER_STEPS.length - 1 && <div className={cx('absolute top-4 left-1/2 w-full h-0.5', i < idx ? 'bg-brand-500' : 'bg-slate-100')} />}</li>)}
          </ol>
        )}
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="card p-5 text-sm"><div className="kicker mb-2">{lang === 'bn' ? 'পণ্য' : 'Items'}</div><ul className="divide-y divide-slate-100">{o.items.map(it => <li key={it.listingId} className="py-2 flex justify-between gap-2"><span className="bn">{it.title} <span className="text-slate-400">× {it.qty} {unitLabel(it.unit, lang)}</span></span><span className="font-semibold shrink-0">{taka(it.qty * it.price, lang)}</span></li>)}</ul><div className="flex justify-between font-bold pt-2 border-t border-slate-100 mt-1"><span className="bn">{lang === 'bn' ? 'মোট' : 'Total'}</span><span>{taka(o.total, lang)}</span></div><div className="text-xs text-slate-500 mt-1">{o.payment} · {fmtDate(o.placedAt, lang)}</div></div>
        <div className="card p-5 text-sm space-y-3">
          <div><div className="kicker mb-1">{lang === 'bn' ? 'বিক্রেতা' : 'Seller'}</div><div className="font-semibold bn">{farmer?.name}</div><div className="text-xs text-slate-500 font-mono">{farmer?.id}</div><a href={`tel:${farmer?.mobile}`} className="text-brand-700 text-xs inline-flex items-center gap-1 mt-1"><Phone size={12} />{farmer?.mobile}</a></div>
          <div><div className="kicker mb-1">{lang === 'bn' ? 'ডেলিভারি' : 'Delivery to'}</div><div className="font-semibold bn">{o.buyer.name}</div><div className="text-xs text-slate-500 bn">{o.buyer.address}, {lang === 'bn' ? bnName(o.buyer.district) : o.buyer.district}</div><div className="text-xs text-slate-500">{o.buyer.mobile}</div></div>
        </div>
      </div>
      <div className="text-center"><Link to="/market" className="btn-secondary">{lang === 'bn' ? 'বাজারে ফিরুন' : 'Continue shopping'}</Link></div>
    </div>
  )
}

export function TrackPage() {
  const { lang } = useLang()
  const s = useStore()
  const [q, setQ] = useState('')
  const [res, setRes] = useState<Order[] | null>(null)
  const search = (e: React.FormEvent) => { e.preventDefault(); const v = q.trim().toUpperCase(); setRes(s.orders.filter(o => o.id === v || o.buyer.mobile === q.trim())) }
  return (
    <div className="max-w-xl mx-auto">
      <div className="card p-6">
        <h1 className="font-bold text-lg bn">{lang === 'bn' ? 'অর্ডার ট্র্যাক করুন' : 'Track your order'}</h1>
        <form onSubmit={search} className="flex gap-2 mt-3"><input className="input" placeholder={lang === 'bn' ? 'অর্ডার নং বা মোবাইল নম্বর' : 'Order no. or mobile number'} value={q} onChange={e => setQ(e.target.value)} /><button className="btn-primary shrink-0"><Search size={15} /></button></form>
        {res && (res.length === 0 ? <p className="text-sm text-slate-500 mt-4 bn">{lang === 'bn' ? 'কোনো অর্ডার পাওয়া যায়নি' : 'No order found'}</p> : <ul className="mt-4 divide-y divide-slate-100">{res.map(o => <li key={o.id} className="py-2 flex items-center gap-3 text-sm"><Link to={`/market/order/${o.id}`} className="font-mono text-brand-700 hover:underline">{o.id}</Link><span className="bn text-slate-600 line-clamp-1 flex-1">{o.items[0].title}</span><Badge tone={o.status === 'Delivered' ? 'Completed' : o.status === 'Cancelled' ? 'Cancelled' : 'Open'}>{o.status}</Badge><span className="font-semibold">{taka(o.total, lang)}</span></li>)}</ul>)}
      </div>
    </div>
  )
}
