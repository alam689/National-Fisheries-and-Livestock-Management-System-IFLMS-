import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, X, ExternalLink, Store, ShoppingBag, Clock, TrendingUp, Eye } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useStore } from '../store/store'
import { useT } from '../i18n'
import { fmtDate, fmtNum, todayISO } from '../lib/format'
import { bnName } from '../data/geo'
import type { Listing, Order } from '../types'
import { PageHeader, Card, Badge, Table, Select, SearchBox, Stat, Tabs, Modal, Field, useToast } from '../components/ui'
import { CATS, catOf, unitLabel, taka, CatIcon } from './market/meta'
import { ProductImage } from './market/Public'

export default function MarketplacePage() {
  const { t, lang } = useT()
  const s = useStore()
  const toast = useToast()
  const [tab, setTab] = useState('pending')
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const [ostatus, setOstatus] = useState('')
  const [reject, setReject] = useState<{ id: string; note: string } | null>(null)
  const nm = (n: string) => (lang === 'bn' ? bnName(n) : n)
  const month = todayISO().slice(0, 7)
  const pending = s.listings.filter(l => l.status === 'Pending')
  const active = s.listings.filter(l => l.status === 'Active')
  const ordersMonth = s.orders.filter(o => o.placedAt.startsWith(month))
  const gmv = s.orders.filter(o => o.status !== 'Cancelled').reduce((a, o) => a + o.total, 0)
  const listings = s.listings.filter(l => (tab === 'pending' ? l.status === 'Pending' : true) && (!cat || l.category === cat) && (!q || l.title.toLowerCase().includes(q.toLowerCase()) || l.id.toLowerCase().includes(q.toLowerCase()) || (s.farmers.find(f => f.id === l.farmerId)?.name ?? '').toLowerCase().includes(q.toLowerCase())))
  const orders = s.orders.filter(o => (!ostatus || o.status === ostatus) && (!q || o.id.toLowerCase().includes(q.toLowerCase()) || o.buyer.name.toLowerCase().includes(q.toLowerCase()) || (s.farmers.find(f => f.id === o.farmerId)?.name ?? '').toLowerCase().includes(q.toLowerCase())))
  const prices = useMemo(() => CATS.filter(c => c.key !== 'Other').map(c => {
    const ls = active.filter(l => l.category === c.key)
    const byDist = new Map<string, number[]>()
    ls.forEach(l => { if (!byDist.has(l.district)) byDist.set(l.district, []); byDist.get(l.district)!.push(l.price) })
    const all = ls.map(l => l.price)
    return { c, n: ls.length, unit: ls[0]?.unit ?? '', min: all.length ? Math.min(...all) : 0, max: all.length ? Math.max(...all) : 0, avg: all.length ? Math.round(all.reduce((a, b) => a + b, 0) / all.length) : 0, byDist: [...byDist.entries()].map(([d, ps]) => ({ d, avg: Math.round(ps.reduce((a, b) => a + b, 0) / ps.length), n: ps.length })).sort((a, b) => b.n - a.n) }
  }).filter(x => x.n > 0), [active])
  const catChart = CATS.filter(c => c.key !== 'Other').map(c => ({ name: lang === 'bn' ? c.bn : c.en, [lang === 'bn' ? 'বিক্রি (৳)' : 'Sales (৳)']: s.orders.filter(o => o.status !== 'Cancelled' && o.items.some(i => s.listings.find(l => l.id === i.listingId)?.category === c.key)).reduce((a, o) => a + o.total, 0) }))
  const salesKey = lang === 'bn' ? 'বিক্রি (৳)' : 'Sales (৳)'
  return (
    <div>
      <PageHeader kicker="MODULE 07 · FARMER MARKETPLACE" title={lang === 'bn' ? 'খামারি বাজার — খামার থেকে সরাসরি ক্রেতার কাছে' : 'Farmer Marketplace — direct from farm to buyer'} subtitle={lang === 'bn' ? 'নিবন্ধিত খামারিরা পণ্য তালিকাভুক্ত করেন, উপজেলা কর্মকর্তা অনুমোদন দেন, নাগরিকরা পাবলিক পোর্টাল থেকে কেনেন।' : 'Registered farmers list produce, upazila officers approve, citizens buy on the public portal.'}
        actions={<Link to="/market" target="_blank" className="btn-primary"><ExternalLink size={15} /> {lang === 'bn' ? 'পাবলিক পোর্টাল খুলুন' : 'Open public portal'}</Link>} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Stat label={lang === 'bn' ? 'অনুমোদনের অপেক্ষায়' : 'Awaiting approval'} value={fmtNum(pending.length, lang)} tone="amber" icon={<Clock size={16} />} onClick={() => setTab('pending')} />
        <Stat label={lang === 'bn' ? 'সক্রিয় পণ্য' : 'Active listings'} value={fmtNum(active.length, lang)} tone="green" icon={<Store size={16} />} onClick={() => setTab('listings')} />
        <Stat label={lang === 'bn' ? 'এ মাসের অর্ডার' : 'Orders this month'} value={fmtNum(ordersMonth.length, lang)} tone="brand" icon={<ShoppingBag size={16} />} onClick={() => setTab('orders')} />
        <Stat label={lang === 'bn' ? 'মোট লেনদেন (GMV)' : 'Gross merchandise value'} value={taka(gmv, lang)} tone="violet" icon={<TrendingUp size={16} />} />
      </div>
      <Tabs value={tab} onChange={setTab} tabs={[{ key: 'pending', label: lang === 'bn' ? 'অনুমোদন' : 'Approval queue', count: pending.length }, { key: 'listings', label: lang === 'bn' ? 'সকল পণ্য' : 'All listings', count: s.listings.length }, { key: 'orders', label: lang === 'bn' ? 'অর্ডার' : 'Orders', count: s.orders.length }, { key: 'prices', label: lang === 'bn' ? 'বাজার দর' : 'Price board' }]} />

      {(tab === 'pending' || tab === 'listings') && (
        <Card padded={false}>
          <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3"><div className="w-full sm:w-72"><SearchBox value={q} onChange={setQ} /></div><Select className="w-full sm:w-48" value={cat} placeholder={lang === 'bn' ? 'সকল শ্রেণি' : 'All categories'} onChange={setCat} options={CATS.map(c => ({ value: c.key, label: lang === 'bn' ? c.bn : c.en }))} /></div>
          <Table empty={listings.length === 0} head={<><th className="th">ID</th><th className="th">{lang === 'bn' ? 'পণ্য' : 'Product'}</th><th className="th">{lang === 'bn' ? 'খামারি' : 'Farmer'}</th><th className="th">{t('upazila')}</th><th className="th text-right">{lang === 'bn' ? 'দাম' : 'Price'}</th><th className="th text-right">{t('qty')}</th><th className="th">{t('status')}</th><th className="th">{t('actions')}</th></>}>
            {listings.slice(0, 200).map(l => { const c = catOf(l.category); const f = s.farmers.find(x => x.id === l.farmerId); return (
              <tr key={l.id} className="hover:bg-brand-50/30">
                <td className="td font-mono text-xs">{l.id}<div className="text-[10px] text-slate-400">{fmtDate(l.createdAt, lang)}</div></td>
                <td className="td"><div className="flex items-center gap-2"><span className="w-10 h-10 rounded-md overflow-hidden shrink-0"><ProductImage l={l} className="h-10" iconScale={1} /></span><div><div className="font-medium bn line-clamp-1">{l.title}</div><div className="text-[11px] text-slate-400 flex items-center gap-1"><Eye size={10} />{l.views} · {lang === 'bn' ? c.bn : c.en}</div></div></div></td>
                <td className="td bn"><Link to={`/farmers/${l.farmerId}`} className="text-brand-700 hover:underline">{f?.name}</Link><div className="text-[10px] text-slate-400 font-mono">{l.farmId}</div></td>
                <td className="td bn text-xs">{nm(l.upazila)}, {nm(l.district)}</td>
                <td className="td text-right tabular-nums font-semibold">{taka(l.price, lang)}<span className="text-[10px] text-slate-400 font-normal">/{unitLabel(l.unit, lang)}</span></td>
                <td className="td text-right tabular-nums">{fmtNum(l.qty, lang)}</td>
                <td className="td"><Badge tone={l.status === 'Active' ? 'Active' : l.status === 'Pending' ? 'Pending' : l.status === 'Rejected' ? 'Rejected' : l.status === 'SoldOut' ? 'Closed' : 'Draft'}>{l.status}</Badge></td>
                <td className="td">{l.status === 'Pending' ? <div className="flex gap-1"><button className="btn-primary py-1 px-2 text-xs" onClick={() => { s.reviewListing(l.id, 'Active'); toast.push(`${l.id} ${lang === 'bn' ? 'অনুমোদিত' : 'approved'}`) }}><Check size={13} /></button><button className="btn-secondary py-1 px-2 text-xs text-red-600" onClick={() => setReject({ id: l.id, note: '' })}><X size={13} /></button></div> : l.status === 'Active' ? <button className="btn-ghost py-1 text-xs text-amber-700" onClick={() => s.updateListing(l.id, { status: 'Paused' })}>{lang === 'bn' ? 'স্থগিত' : 'Suspend'}</button> : l.status === 'Paused' ? <button className="btn-ghost py-1 text-xs" onClick={() => s.updateListing(l.id, { status: 'Active' })}>{lang === 'bn' ? 'সক্রিয়' : 'Activate'}</button> : null}</td>
              </tr>) })}
          </Table>
        </Card>
      )}

      {tab === 'orders' && (
        <Card padded={false}>
          <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3"><div className="w-full sm:w-72"><SearchBox value={q} onChange={setQ} /></div><Select className="w-full sm:w-44" value={ostatus} placeholder={`${t('all')} ${t('status')}`} onChange={setOstatus} options={['Placed', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'].map(x => ({ value: x, label: x }))} /></div>
          <Table empty={orders.length === 0} head={<><th className="th">ID</th><th className="th">{t('date')}</th><th className="th">{lang === 'bn' ? 'ক্রেতা' : 'Buyer'}</th><th className="th">{lang === 'bn' ? 'বিক্রেতা' : 'Seller'}</th><th className="th">{lang === 'bn' ? 'পণ্য' : 'Items'}</th><th className="th text-right">{t('total')}</th><th className="th">{lang === 'bn' ? 'পেমেন্ট' : 'Payment'}</th><th className="th">{t('status')}</th></>}>
            {orders.slice(0, 200).map(o => (
              <tr key={o.id} className="hover:bg-brand-50/30">
                <td className="td font-mono text-xs"><Link to={`/market/order/${o.id}`} target="_blank" className="text-brand-700 hover:underline">{o.id}</Link></td>
                <td className="td bn text-xs">{fmtDate(o.placedAt, lang)}</td>
                <td className="td bn">{o.buyer.name}<div className="text-[10px] text-slate-400">{o.buyer.mobile} · {nm(o.buyer.district)}</div></td>
                <td className="td bn"><Link to={`/farmers/${o.farmerId}`} className="text-brand-700 hover:underline">{s.farmers.find(f => f.id === o.farmerId)?.name}</Link></td>
                <td className="td bn text-xs">{o.items.map(i => `${i.title} × ${i.qty}`).join('; ')}</td>
                <td className="td text-right tabular-nums font-semibold">{taka(o.total, lang)}</td>
                <td className="td text-xs">{o.payment}</td>
                <td className="td"><Select className="py-1 text-xs w-32" value={o.status} onChange={v => s.updateOrderStatus(o.id, v as Order['status'])} options={['Placed', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'].map(x => ({ value: x, label: x }))} /></td>
              </tr>
            ))}
          </Table>
        </Card>
      )}

      {tab === 'prices' && (
        <div className="space-y-4">
          <Card title={lang === 'bn' ? 'শ্রেণিভিত্তিক বিক্রি' : 'Sales by category'}>
            <div className="h-56"><ResponsiveContainer><BarChart data={catChart} margin={{ left: 0, right: 8, top: 8 }}><CartesianGrid vertical={false} stroke="#eef2f7" /><XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} /><YAxis tickLine={false} axisLine={false} fontSize={11} /><Tooltip cursor={{ fill: '#f1f5f9' }} /><Bar dataKey={salesKey} fill="#2f62d9" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
          </Card>
          <Card title={lang === 'bn' ? 'বাজার দর · সক্রিয় পণ্যের ভিত্তিতে' : 'Market prices · from active listings'} subtitle={lang === 'bn' ? 'ন্যূনতম / গড় / সর্বোচ্চ দাম এবং জেলাভিত্তিক গড়' : 'Min / avg / max and district averages'} padded={false}>
            <Table head={<><th className="th">{lang === 'bn' ? 'শ্রেণি' : 'Category'}</th><th className="th text-right">{lang === 'bn' ? 'পণ্য' : 'Listings'}</th><th className="th text-right">{lang === 'bn' ? 'ন্যূনতম' : 'Min'}</th><th className="th text-right">{lang === 'bn' ? 'গড়' : 'Avg'}</th><th className="th text-right">{lang === 'bn' ? 'সর্বোচ্চ' : 'Max'}</th><th className="th">{lang === 'bn' ? 'জেলাভিত্তিক গড়' : 'District averages'}</th></>}>
              {prices.map(p => <tr key={p.c.key}><td className="td"><span className="inline-flex items-center gap-2 bn font-medium"><span className={`w-8 h-8 rounded-md grid place-items-center ${p.c.bg}`}><CatIcon cat={p.c.key} size={22} /></span>{lang === 'bn' ? p.c.bn : p.c.en} <span className="text-[10px] text-slate-400">/{unitLabel(p.unit, lang)}</span></span></td><td className="td text-right tabular-nums">{fmtNum(p.n, lang)}</td><td className="td text-right tabular-nums">{taka(p.min, lang)}</td><td className="td text-right tabular-nums font-bold">{taka(p.avg, lang)}</td><td className="td text-right tabular-nums">{taka(p.max, lang)}</td><td className="td text-xs bn">{p.byDist.slice(0, 5).map(d => <span key={d.d} className="inline-block mr-2 whitespace-nowrap">{nm(d.d)} <span className="font-semibold">{taka(d.avg, lang)}</span></span>)}</td></tr>)}
            </Table>
          </Card>
        </div>
      )}

      {reject && <Modal open onClose={() => setReject(null)} title={lang === 'bn' ? 'পণ্য প্রত্যাখ্যান' : 'Reject listing'} footer={<><button className="btn-secondary" onClick={() => setReject(null)}>{t('cancel')}</button><button className="btn-danger" onClick={() => { s.reviewListing(reject.id, 'Rejected', reject.note || undefined); toast.push(`${reject.id} rejected`, 'info'); setReject(null) }}>{lang === 'bn' ? 'প্রত্যাখ্যান' : 'Reject'}</button></>}>
        <Field label={lang === 'bn' ? 'কারণ (খামারি দেখতে পাবেন)' : 'Reason (shown to the farmer)'}><textarea className="input bn" rows={3} value={reject.note} onChange={e => setReject({ ...reject, note: e.target.value })} /></Field>
      </Modal>}
    </div>
  )
}

export type { Listing }
