import Anthropic from '@anthropic-ai/sdk'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useStore, stockOf, fefoBatches } from '../store/store'
import { todayISO, addDays, daysUntil } from '../lib/format'

/** ---------- Assistant configuration (kept in the browser) ---------- */
export interface AiConfig {
  apiKey: string // browser-side key for demos; leave blank in production and use proxyUrl
  proxyUrl: string // e.g. http://localhost:8787 (see server/ai-proxy.mjs) — key stays server-side
  model: string
  setConfig: (p: Partial<Pick<AiConfig, 'apiKey' | 'proxyUrl' | 'model'>>) => void
}
export const useAiConfig = create<AiConfig>()(
  persist(
    set => ({ apiKey: '', proxyUrl: import.meta.env.VITE_AI_PROXY_URL ?? '', model: 'claude-opus-5', setConfig: p => set(p) }),
    { name: 'nflms-ai' },
  ),
)
export const isClaudeConfigured = (c: AiConfig) => !!(c.apiKey.trim() || c.proxyUrl.trim())

/** ---------- Tools the assistant can call against live app data ---------- */
export type Portal = 'public' | 'officer'

export const TOOLS: Anthropic.Tool[] = [
  { name: 'search_farmers', description: 'Search registered farmers by name, Farmer ID (FMR-…), NID or mobile. Returns up to 8 matches with their farms.', input_schema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } },
  { name: 'get_farm', description: 'Get a farm by Unique Farm ID (FAR-…) with owner, recent visits and medicine received.', input_schema: { type: 'object', properties: { farmId: { type: 'string' } }, required: ['farmId'] } },
  { name: 'stock_lookup', description: 'Current medicine/vaccine stock. Filter by medicine name and/or store (central, district name, or upazila name). Includes FEFO batch and expiry warnings.', input_schema: { type: 'object', properties: { medicine: { type: 'string' }, store: { type: 'string' } } } },
  { name: 'order_status', description: 'Look up a marketplace order by order number (ORD-…) or buyer mobile.', input_schema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } },
  { name: 'market_search', description: 'Search active marketplace listings by product keyword, category (Fish, Fingerling, Cattle, Buffalo, Goat, Milk, Egg, Poultry, Duck, Feed) and/or district. Returns price, unit, seller and listing id.', input_schema: { type: 'object', properties: { query: { type: 'string' }, category: { type: 'string' }, district: { type: 'string' } } } },
  { name: 'price_board', description: 'Min / average / max market price per category from active listings, optionally for one district.', input_schema: { type: 'object', properties: { district: { type: 'string' } } } },
  { name: 'disease_summary', description: 'Disease reports in the last N days (default 30), grouped by upazila and disease, with hotspots.', input_schema: { type: 'object', properties: { days: { type: 'number' }, district: { type: 'string' } } } },
  { name: 'attendance_today', description: 'Field-force attendance summary for today or a given date (officers only).', input_schema: { type: 'object', properties: { date: { type: 'string' } } } },
  { name: 'training_info', description: 'Upcoming and recent trainings, seats left, and whether a farmer (by Farmer ID) is enrolled or certified.', input_schema: { type: 'object', properties: { farmerId: { type: 'string' } } } },
  { name: 'navigate', description: 'Open a page in the app for the user. Use after answering when a page would help. Paths: / (dashboard), /farmers, /farmers/{id}, /farms, /farms/{id}, /medicine, /medicine/distribute, /medicine/batches, /medicine/trace, /field/attendance, /field/monitoring, /visits, /visits/new, /disease, /training, /training/{id}, /mis, /marketplace, /market, /market?cat={Category}, /market/p/{listingId}, /market/sell, /market/track, /market/order/{orderId}.', input_schema: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] } },
]

const clip = <T,>(a: T[], n = 8) => a.slice(0, n)
const lc = (s?: string) => (s ?? '').toLowerCase()

export function runTool(name: string, input: Record<string, unknown>, portal: Portal): { text: string; navigate?: string } {
  const s = useStore.getState()
  const q = lc(String(input.query ?? ''))
  switch (name) {
    case 'search_farmers': {
      const hits = clip(s.farmers.filter(f => lc(f.name).includes(q) || lc(f.id).includes(q) || f.mobile.includes(q) || f.nid.includes(q)))
      if (!hits.length) return { text: 'No farmer found.' }
      return { text: JSON.stringify(hits.map(f => ({ id: f.id, name: f.name, mobile: portal === 'officer' ? f.mobile : f.mobile.slice(0, 3) + '****' + f.mobile.slice(-4), upazila: f.location.upazila, district: f.location.district, status: f.status, farms: s.farms.filter(x => x.farmerId === f.id).map(x => ({ id: x.id, name: x.name, type: x.type })) }))) }
    }
    case 'get_farm': {
      const f = s.farms.find(x => lc(x.id) === lc(String(input.farmId)))
      if (!f) return { text: 'Farm not found.' }
      const owner = s.farmers.find(x => x.id === f.farmerId)
      const visits = clip(s.visits.filter(v => v.farmId === f.id), 5).map(v => ({ id: v.id, date: v.date, purpose: v.purpose, disease: v.disease, officer: s.employees.find(e => e.id === v.employeeId)?.name, followUp: v.followUp }))
      const meds = clip(s.txns.filter(t => t.type === 'Distribute' && t.farmId === f.id), 5).map(t => ({ date: t.date, medicine: s.medicines.find(m => m.id === t.medicineId)?.name, batch: t.batchNo, qty: t.qty, disease: t.disease }))
      return { text: JSON.stringify({ ...f, owner: owner?.name, ownerId: owner?.id, visits, medicines: meds }) }
    }
    case 'stock_lookup': {
      if (portal === 'public') return { text: 'Stock data is only available to officers.' }
      const med = lc(String(input.medicine ?? '')), st = lc(String(input.store ?? ''))
      const stores = s.stores.filter(x => !st || lc(x.name).includes(st) || lc(x.district ?? '').includes(st) || lc(x.upazila ?? '').includes(st) || lc(x.level).includes(st))
      const meds = s.medicines.filter(m => !med || lc(m.name).includes(med) || lc(m.category).includes(med))
      const rows: unknown[] = []
      for (const store of stores) for (const m of meds) {
        const qty = stockOf(s.batches, store.id, m.id); if (!qty && (med || st)) continue; if (!qty) continue
        const fefo = fefoBatches(s.batches, store.id, m.id)[0]
        const min = store.level === 'Central' ? m.minStock * 2 : store.level === 'District' ? m.minStock : Math.round(m.minStock / 4)
        rows.push({ store: store.name, medicine: m.name, unit: m.unit, qty, minStock: min, low: qty < min, nextExpiryBatch: fefo?.batchNo, nextExpiry: fefo?.expiry, expiringWithin45d: fefo ? daysUntil(fefo.expiry) <= 45 : false })
      }
      return { text: rows.length ? JSON.stringify(clip(rows, 25)) : 'No matching stock.' }
    }
    case 'order_status': {
      const hits = s.orders.filter(o => lc(o.id) === q || o.buyer.mobile === q.trim())
      if (!hits.length) return { text: 'No order found for that number or mobile.' }
      return { text: JSON.stringify(hits.map(o => ({ id: o.id, status: o.status, total: o.total, payment: o.payment, placedAt: o.placedAt, items: o.items.map(i => `${i.title} × ${i.qty} ${i.unit}`), seller: s.farmers.find(f => f.id === o.farmerId)?.name, sellerMobile: s.farmers.find(f => f.id === o.farmerId)?.mobile }))) }
    }
    case 'market_search': {
      const cat = lc(String(input.category ?? '')), d = lc(String(input.district ?? ''))
      const hits = clip(s.listings.filter(l => l.status === 'Active' && (!q || lc(l.title).includes(q) || lc(l.description).includes(q) || lc(l.category).includes(q)) && (!cat || lc(l.category) === cat) && (!d || lc(l.district).includes(d))), 10)
      if (!hits.length) return { text: 'No active listing matches.' }
      return { text: JSON.stringify(hits.map(l => ({ id: l.id, title: l.title, category: l.category, price: l.price, unit: l.unit, available: l.qty, minOrder: l.minOrder, upazila: l.upazila, district: l.district, seller: s.farmers.find(f => f.id === l.farmerId)?.name, url: `/market/p/${l.id}` }))) }
    }
    case 'price_board': {
      const d = lc(String(input.district ?? ''))
      const act = s.listings.filter(l => l.status === 'Active' && (!d || lc(l.district).includes(d)))
      const cats = [...new Set(act.map(l => l.category))]
      return { text: JSON.stringify(cats.map(c => { const ps = act.filter(l => l.category === c).map(l => l.price); return { category: c, unit: act.find(l => l.category === c)?.unit, listings: ps.length, min: Math.min(...ps), avg: Math.round(ps.reduce((a, b) => a + b, 0) / ps.length), max: Math.max(...ps) } })) }
    }
    case 'disease_summary': {
      const days = Number(input.days ?? 30), d = lc(String(input.district ?? ''))
      const since = addDays(todayISO(), -days)
      const rs = s.diseaseReports.filter(r => r.date >= since && (!d || lc(r.district).includes(d)))
      const by = new Map<string, { cases: number; deaths: number; diseases: Record<string, number> }>()
      rs.forEach(r => { const k = `${r.upazila}, ${r.district}`; const e = by.get(k) ?? { cases: 0, deaths: 0, diseases: {} }; e.cases += r.cases; e.deaths += r.deaths; e.diseases[r.disease] = (e.diseases[r.disease] ?? 0) + r.cases; by.set(k, e) })
      const rows = [...by.entries()].map(([area, v]) => ({ area, ...v })).sort((a, b) => b.cases - a.cases)
      return { text: JSON.stringify({ days, totalReports: rs.length, totalCases: rs.reduce((a, r) => a + r.cases, 0), byArea: clip(rows, 12) }) }
    }
    case 'attendance_today': {
      if (portal === 'public') return { text: 'Attendance data is only available to officers.' }
      const date = String(input.date ?? todayISO())
      const staff = s.employees.filter(e => e.active && e.role !== 'admin' && e.role !== 'ministry')
      const att = s.attendance.filter(a => a.date === date)
      const cnt = (st: string) => att.filter(a => a.status === st).length
      const noRecord = staff.filter(e => !att.some(a => a.employeeId === e.id)).map(e => `${e.name} (${e.designation}, ${e.station.upazila})`)
      return { text: JSON.stringify({ date, staff: staff.length, present: cnt('Present'), late: cnt('Late'), absent: cnt('Absent'), leave: cnt('Leave'), tour: cnt('Tour'), fieldMode: att.filter(a => a.mode === 'Field').length, noRecordYet: noRecord, visitsThatDay: s.visits.filter(v => v.date === date).length }) }
    }
    case 'training_info': {
      const fid = String(input.farmerId ?? '')
      const upcoming = s.trainings.filter(t => t.date >= todayISO() && t.status !== 'Cancelled').map(t => ({ id: t.id, title: t.title, topic: t.topic, date: t.date, venue: t.venue, seatsLeft: t.seats - s.enrollments.filter(e => e.trainingId === t.id).length }))
      const mine = fid ? s.enrollments.filter(e => lc(e.farmerId) === lc(fid)).map(e => ({ training: s.trainings.find(t => t.id === e.trainingId)?.title, attended: e.attended, certificate: e.certificateNo })) : undefined
      return { text: JSON.stringify({ upcoming, farmerHistory: mine }) }
    }
    case 'navigate': {
      const path = String(input.path ?? '/')
      return { text: `Opened ${path}`, navigate: path }
    }
    default:
      return { text: `Unknown tool ${name}` }
  }
}

/** ---------- System prompt ---------- */
export function systemPrompt(portal: Portal, lang: 'bn' | 'en', userName?: string) {
  const who = portal === 'officer' ? `an officer of the Ministry of Fisheries and Livestock using the NFLMS back office${userName ? ` (signed in as ${userName})` : ''}` : 'a citizen, buyer or farmer using the public NFLMS Bazar marketplace portal'
  return `You are the NFLMS Assistant for the National Fisheries & Livestock Management System, Bangladesh. You are talking to ${who}.
Answer in ${lang === 'bn' ? 'Bangla (বাংলা), keeping IDs, product names and technical terms as they are' : 'English'}. Be concise and practical; use short bullet lists for multiple items.
Use the tools to look up live data before answering questions about farmers, farms, stock, orders, listings, prices, disease, attendance or training; never invent IDs, quantities or prices. When a page in the app would help, call navigate once with the best path after your answer.
Modules: Farm & Farmer Registry (Digital Farmer ID FMR-…, Unique Farm ID FAR-…), Medicine & Vaccine supply chain (Central → District → Upazila → Farmer, FEFO batches), Field Force (GPS check-in, leave, tour), Field Visits (10-step visit, auto stock deduction and disease report), Farmer Training (certificates with QR), National MIS, Disease Surveillance, Farmer Marketplace (farmers list produce; upazila officers approve; buyers order with cash on delivery, bKash or Nagad).
${portal === 'public' ? 'Do not reveal officer-only data (stock levels, attendance, full farmer mobile numbers). Farmers can sell by verifying with their Farmer ID or NID plus registered mobile at /market/sell. Orders can be tracked at /market/track.' : 'Officers may see all operational data.'}
If asked for veterinary or fish-health advice, give general good-practice guidance and recommend contacting the upazila livestock or fisheries officer for diagnosis.`
}

/** ---------- Claude call: streaming manual tool loop ---------- */
export interface RunOpts {
  portal: Portal
  lang: 'bn' | 'en'
  userName?: string
  history: Anthropic.MessageParam[]
  onText: (delta: string) => void
  onTool: (name: string) => void
  onNavigate: (path: string) => void
  signal?: AbortSignal
}

export async function runClaude(opts: RunOpts): Promise<Anthropic.MessageParam[]> {
  const cfg = useAiConfig.getState()
  const client = new Anthropic({
    apiKey: cfg.apiKey.trim() || 'proxy',
    baseURL: cfg.proxyUrl.trim() || undefined,
    dangerouslyAllowBrowser: true, // demo: key lives in this browser only. Use proxyUrl in production.
    maxRetries: 1,
  })
  const messages: Anthropic.MessageParam[] = [...opts.history]
  const sys = systemPrompt(opts.portal, opts.lang, opts.userName)
  for (let turn = 0; turn < 6; turn++) {
    const stream = client.messages.stream({
      model: cfg.model || 'claude-opus-5',
      max_tokens: 8000,
      system: [{ type: 'text', text: sys, cache_control: { type: 'ephemeral' } }],
      tools: TOOLS,
      messages,
    }, { signal: opts.signal })
    stream.on('text', d => opts.onText(d))
    const message = await stream.finalMessage()
    if (message.stop_reason === 'refusal') { opts.onText(opts.lang === 'bn' ? '\n\n(এই অনুরোধে সহায়তা করা সম্ভব নয়।)' : '\n\n(I cannot help with that request.)'); messages.push({ role: 'assistant', content: message.content }); break }
    if (message.stop_reason === 'pause_turn') { messages.push({ role: 'assistant', content: message.content }); continue }
    const toolUses = message.content.filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
    messages.push({ role: 'assistant', content: message.content })
    if (message.stop_reason !== 'tool_use' || toolUses.length === 0) break
    const results: Anthropic.ToolResultBlockParam[] = toolUses.map(t => {
      opts.onTool(t.name)
      const r = runTool(t.name, (t.input ?? {}) as Record<string, unknown>, opts.portal)
      if (r.navigate) opts.onNavigate(r.navigate)
      return { type: 'tool_result', tool_use_id: t.id, content: r.text }
    })
    messages.push({ role: 'user', content: results })
  }
  return messages
}

/** ---------- Built-in offline answers (no API key needed) ---------- */
const BN = (b: string, e: string, lang: 'bn' | 'en') => (lang === 'bn' ? b : e)

export function localAnswer(q: string, portal: Portal, lang: 'bn' | 'en'): { text: string; navigate?: string } {
  const s = useStore.getState()
  const t = q.toLowerCase()
  const id = (re: RegExp) => q.match(re)?.[0]
  const fmr = id(/FMR-\d{4}-\d{8}/i), far = id(/FAR-\d{2}-\d{6}/i), ord = id(/ORD-\d{6}/i), lst = id(/LST-\d{6}/i), mob = id(/01[3-9]\d{8}/)
  const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(n)

  if (ord || (mob && /order|অর্ডার|track|ট্র্যাক/.test(t))) {
    const r = JSON.parse(runTool('order_status', { query: ord ?? mob }, portal).text)
    if (!Array.isArray(r)) return { text: BN('এই নম্বরে কোনো অর্ডার পাওয়া যায়নি। /market/track পেজে চেষ্টা করুন।', 'No order found for that number. Try the tracking page.', lang), navigate: '/market/track' }
    return { text: r.map((o: { id: string; status: string; total: number; items: string[]; seller: string }) => BN(`অর্ডার ${o.id}: অবস্থা ${o.status}, মোট ৳${fmt(o.total)}, বিক্রেতা ${o.seller}\n• ${o.items.join('\n• ')}`, `Order ${o.id}: ${o.status}, total ৳${fmt(o.total)}, seller ${o.seller}\n• ${o.items.join('\n• ')}`, lang)).join('\n\n'), navigate: `/market/order/${r[0].id}` }
  }
  if (far) {
    const r = runTool('get_farm', { farmId: far }, portal); if (r.text === 'Farm not found.') return { text: BN('এই Farm ID পাওয়া যায়নি।', 'That Farm ID was not found.', lang) }
    const f = JSON.parse(r.text)
    return { text: BN(`${f.id} · ${f.name} (${f.type}), মালিক ${f.owner} (${f.ownerId}), ${f.location.upazila}, ${f.location.district}। অবস্থা ${f.status}। পরিদর্শন ${f.visits.length} টি (সাম্প্রতিক)।`, `${f.id} · ${f.name} (${f.type}), owner ${f.owner} (${f.ownerId}), ${f.location.upazila}, ${f.location.district}. Status ${f.status}. ${f.visits.length} recent visits.`, lang), navigate: `/farms/${f.id}` }
  }
  if (fmr) {
    const r = JSON.parse(runTool('search_farmers', { query: fmr }, portal).text); if (!Array.isArray(r)) return { text: BN('এই Farmer ID পাওয়া যায়নি।', 'That Farmer ID was not found.', lang) }
    const f = r[0]
    return { text: BN(`${f.name} (${f.id}), ${f.upazila}, ${f.district}। খামার: ${f.farms.map((x: { id: string; type: string }) => `${x.id} (${x.type})`).join(', ') || 'নেই'}।`, `${f.name} (${f.id}), ${f.upazila}, ${f.district}. Farms: ${f.farms.map((x: { id: string; type: string }) => `${x.id} (${x.type})`).join(', ') || 'none'}.`, lang), navigate: portal === 'officer' ? `/farmers/${f.id}` : undefined }
  }
  if (lst) return { text: BN('পণ্যটি খুলছি…', 'Opening the listing…', lang), navigate: `/market/p/${lst}` }
  if (portal === 'officer' && /stock|মজুদ|vaccine|ভ্যাকসিন|medicine|ঔষধ|expir|মেয়াদ/.test(t)) {
    const medHit = s.medicines.find(m => t.includes(m.name.split(' ')[0].toLowerCase()) || (m.category === 'Vaccine' && /fmd|ppr|anthrax|newcastle|rdv|gumboro/.test(t) && t.includes(m.name.split(' ')[0].toLowerCase())))
    const storeHit = s.stores.find(x => (x.upazila && t.includes(x.upazila.toLowerCase())) || (x.district && t.includes(x.district.toLowerCase()) && !x.upazila))
    const r = runTool('stock_lookup', { medicine: medHit?.name.split(' ')[0], store: storeHit?.name }, portal)
    if (r.text === 'No matching stock.') return { text: BN('মিল পাওয়া যায়নি — ঔষধের নাম বা স্টোর উল্লেখ করুন, যেমন “Cumilla Sadar এ FMD vaccine stock”।', 'No match — name the medicine or store, e.g. "FMD vaccine stock at Cumilla Sadar".', lang), navigate: '/medicine' }
    const rows = JSON.parse(r.text) as { store: string; medicine: string; qty: number; unit: string; low: boolean; nextExpiry?: string; expiringWithin45d: boolean }[]
    const lines = rows.slice(0, 8).map(x => `• ${x.medicine} @ ${x.store}: ${fmt(x.qty)} ${x.unit}${x.low ? BN(' ⚠ ঘাটতি', ' ⚠ low', lang) : ''}${x.expiringWithin45d ? BN(` ⚠ মেয়াদ ${x.nextExpiry}`, ` ⚠ expires ${x.nextExpiry}`, lang) : ''}`)
    return { text: lines.join('\n') + (rows.length > 8 ? `\n… +${rows.length - 8}` : ''), navigate: '/medicine' }
  }
  if (portal === 'officer' && /attendance|উপস্থিত|present|absent/.test(t)) {
    const a = JSON.parse(runTool('attendance_today', {}, portal).text)
    return { text: BN(`আজ (${a.date}): উপস্থিত ${a.present}, বিলম্ব ${a.late}, অনুপস্থিত ${a.absent}, ছুটি ${a.leave}, সফর ${a.tour}, মাঠে ${a.fieldMode}। রেকর্ড নেই: ${a.noRecordYet.length} জন।`, `Today (${a.date}): present ${a.present}, late ${a.late}, absent ${a.absent}, leave ${a.leave}, tour ${a.tour}, field ${a.fieldMode}. No record yet: ${a.noRecordYet.length}.`, lang), navigate: '/field/monitoring' }
  }
  if (/disease|রোগ|hotspot|outbreak/.test(t)) {
    const d = JSON.parse(runTool('disease_summary', { days: 30 }, portal).text)
    const top = d.byArea.slice(0, 5).map((x: { area: string; cases: number; diseases: Record<string, number> }) => `• ${x.area}: ${fmt(x.cases)} (${Object.entries(x.diseases).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 2).map(([k, v]) => `${k} ${v}`).join(', ')})`)
    return { text: BN(`গত ৩০ দিনে ${fmt(d.totalCases)} টি রোগের ঘটনা, ${d.totalReports} টি রিপোর্ট।\n`, `${fmt(d.totalCases)} disease cases in ${d.totalReports} reports over the last 30 days.\n`, lang) + top.join('\n'), navigate: portal === 'officer' ? '/disease' : undefined }
  }
  if (/price|দাম|দর|rate|cost|কত/.test(t) || /buy|কিন|sell|বিক্রি|fish|মাছ|cattle|গরু|goat|ছাগল|egg|ডিম|milk|দুধ|duck|হাঁস|poultry|মুরগি|buffalo|মহিষ|feed|খাদ্য/.test(t)) {
    const cats: [RegExp, string][] = [[/fish|মাছ|rui|রুই|katla|tilapia|pangas/, 'Fish'], [/fingerling|পোনা/, 'Fingerling'], [/buffalo|মহিষ/, 'Buffalo'], [/cattle|গরু|bull|cow|ষাঁড়|গাভী/, 'Cattle'], [/goat|ছাগল|sheep|ভেড়া/, 'Goat'], [/milk|দুধ/, 'Milk'], [/egg|ডিম/, 'Egg'], [/duck|হাঁস/, 'Duck'], [/poultry|মুরগি|chicken|broiler/, 'Poultry'], [/feed|খাদ্য|bran|ভুসি/, 'Feed']]
    const cat = cats.find(([re]) => re.test(t))?.[1]
    const dist = s.stores.map(x => x.district).filter(Boolean).concat([...new Set(s.listings.map(l => l.district))]).find(d => d && t.includes(d.toLowerCase()))
    const r = runTool('market_search', { category: cat, district: dist }, portal)
    if (r.text === 'No active listing matches.') return { text: BN('এই মুহূর্তে মিলে এমন কোনো পণ্য নেই।', 'No active listing matches right now.', lang), navigate: '/market' }
    const rows = JSON.parse(r.text) as { id: string; title: string; price: number; unit: string; available: number; upazila: string; district: string; seller: string }[]
    return { text: rows.slice(0, 6).map(x => `• ${x.title} — ৳${fmt(x.price)}/${x.unit}, ${fmt(x.available)} ${BN('উপলব্ধ', 'available', lang)}, ${x.upazila}, ${x.district} (${x.seller})`).join('\n'), navigate: `/market${cat ? `?cat=${cat}` : ''}${dist ? `${cat ? '&' : '?'}district=${encodeURIComponent(dist)}` : ''}` }
  }
  if (/training|প্রশিক্ষণ|certificate|সনদ/.test(t)) {
    const r = JSON.parse(runTool('training_info', {}, portal).text)
    return { text: BN('আসন্ন প্রশিক্ষণ:\n', 'Upcoming trainings:\n', lang) + r.upcoming.map((x: { title: string; date: string; venue: string; seatsLeft: number }) => `• ${x.title} — ${x.date}, ${x.venue} (${x.seatsLeft} ${BN('আসন বাকি', 'seats left', lang)})`).join('\n'), navigate: portal === 'officer' ? '/training' : undefined }
  }
  if (/sell|বিক্রি|list my|আমার পণ্য/.test(t)) return { text: BN('খামারি হিসেবে বিক্রি করতে Farmer ID (বা NID) ও নিবন্ধিত মোবাইল দিয়ে যাচাই করুন, তারপর “নতুন পণ্য” যোগ করুন। উপজেলা কর্মকর্তা অনুমোদন দিলে পণ্যটি বাজারে দেখা যাবে।', 'To sell, verify with your Farmer ID (or NID) and registered mobile, then add a product. It appears on the market once the upazila officer approves it.', lang), navigate: '/market/sell' }
  if (/visit|পরিদর্শন/.test(t) && portal === 'officer') return { text: BN('নতুন খামার পরিদর্শন ১০ ধাপে জমা দিন — খামারি খোঁজা থেকে follow-up পর্যন্ত। জমা দিলে ঔষধ আপনার স্টোর থেকে স্বয়ংক্রিয়ভাবে কাটা হবে এবং রোগ থাকলে রিপোর্ট হবে।', 'Submit a new farm visit in 10 steps, from farmer search to follow-up. Medicine is deducted from your store automatically and any disease is reported.', lang), navigate: '/visits/new' }
  return { text: BN(
    `আমি NFLMS সহকারী। আমি খামারি/খামার আইডি, ${portal === 'officer' ? 'ঔষধের মজুদ, উপস্থিতি, ' : ''}বাজার দর, অর্ডারের অবস্থা, রোগের চিত্র ও প্রশিক্ষণ সম্পর্কে উত্তর দিতে পারি।\nউদাহরণ: “${portal === 'officer' ? 'Cumilla Sadar এ FMD vaccine stock' : 'কুমিল্লায় মাছের দাম'}”, “ORD-000003 এর অবস্থা”, “FMR-2026-00123405”।\n\nসম্পূর্ণ AI উত্তরের জন্য ⚙ সেটিংসে Claude API key বা proxy URL দিন।`,
    `I am the NFLMS Assistant. I can answer about farmer/farm IDs, ${portal === 'officer' ? 'medicine stock, attendance, ' : ''}market prices, order status, disease trends and trainings.\nTry: "${portal === 'officer' ? 'FMD vaccine stock at Cumilla Sadar' : 'fish price in Cumilla'}", "status of ORD-000003", "FMR-2026-00123405".\n\nFor full AI answers, add a Claude API key or proxy URL under ⚙ settings.`, lang) }
}
