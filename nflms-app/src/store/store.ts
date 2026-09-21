import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Attendance, Batch, DiseaseReport, Employee, Enrollment, Farm, Farmer, Leave, Listing, Medicine, Order, OrderItem, Session, StockTxn, Store, Tour, Training, Visit,
} from '../types'
import * as seed from '../data/seed'
import { farmId, farmerId, certNo, pad } from '../lib/id'
import { nowISO, todayISO } from '../lib/format'

interface Counters {
  farmer: number
  farm: Record<string, number>
  visit: number
  txn: number
  att: number
  enr: number
  cert: number
  leave: number
  tour: number
  training: number
  batch: number
  dr: number
  emp: number
  listing: number
  order: number
}

export interface DataState {
  session: Session | null
  farmers: Farmer[]
  farms: Farm[]
  stores: Store[]
  medicines: Medicine[]
  batches: Batch[]
  txns: StockTxn[]
  employees: Employee[]
  attendance: Attendance[]
  leaves: Leave[]
  tours: Tour[]
  visits: Visit[]
  trainings: Training[]
  enrollments: Enrollment[]
  diseaseReports: DiseaseReport[]
  listings: Listing[]
  orders: Order[]
  counters: Counters
  seedVersion: number

  // auth
  login: (email: string, workspace: Session['workspace']) => { ok: boolean; error?: string }
  logout: () => void

  // registry
  addFarmer: (f: Omit<Farmer, 'id' | 'registeredAt' | 'status'>) => Farmer
  updateFarmer: (id: string, patch: Partial<Farmer>) => void
  addFarm: (f: Omit<Farm, 'id' | 'registeredAt'>) => Farm
  updateFarm: (id: string, patch: Partial<Farm>) => void

  // medicine
  addMedicine: (m: Omit<Medicine, 'id'>) => Medicine
  receiveStock: (p: { storeId: string; medicineId: string; batchNo: string; expiry: string; supplier: string; qty: number; note?: string }) => void
  transferStock: (p: { fromStoreId: string; toStoreId: string; medicineId: string; qty: number; batchNo?: string; note?: string }) => { ok: boolean; error?: string }
  distributeStock: (p: { fromStoreId: string; medicineId: string; qty: number; farmerId: string; farmId?: string; disease?: string; batchNo?: string; note?: string; date?: string }) => { ok: boolean; error?: string; lines?: { batchNo: string; qty: number }[] }
  adjustStock: (p: { storeId: string; medicineId: string; batchNo: string; delta: number; note: string }) => void

  // field force
  checkIn: (p: { mode: 'Office' | 'Field'; lat?: number; lng?: number; selfie?: boolean }) => void
  checkOut: (p: { lat?: number; lng?: number }) => void
  applyLeave: (l: Omit<Leave, 'id' | 'status'>) => void
  decideLeave: (id: string, status: 'Approved' | 'Rejected') => void
  addTour: (t: Omit<Tour, 'id'>) => void
  updateTour: (id: string, patch: Partial<Tour>) => void
  addEmployee: (e: Omit<Employee, 'id'>) => Employee
  updateEmployee: (id: string, patch: Partial<Employee>) => void

  // visits
  submitVisit: (v: Omit<Visit, 'id' | 'status'>) => { ok: boolean; visit?: Visit; warnings: string[] }

  // training
  addTraining: (t: Omit<Training, 'id'>) => Training
  updateTraining: (id: string, patch: Partial<Training>) => void
  enroll: (trainingId: string, farmerId: string) => { ok: boolean; error?: string }
  unenroll: (enrollmentId: string) => void
  setAttended: (enrollmentId: string, attended: boolean) => void
  setFeedback: (enrollmentId: string, feedback: number) => void
  completeTraining: (trainingId: string) => number

  // marketplace
  addListing: (l: Omit<Listing, 'id' | 'createdAt' | 'views' | 'status'>, status?: Listing['status']) => Listing
  updateListing: (id: string, patch: Partial<Listing>) => void
  reviewListing: (id: string, status: 'Active' | 'Rejected', note?: string) => void
  viewListing: (id: string) => void
  placeOrder: (p: { items: { listingId: string; qty: number }[]; buyer: Order['buyer']; payment: Order['payment']; note?: string }) => { ok: boolean; error?: string; orders?: Order[] }
  updateOrderStatus: (id: string, status: Order['status']) => void

  resetDemo: () => void
}

const SEED_VERSION = 10

const seedState = () => ({
  session: null as Session | null,
  farmers: seed.FARMERS,
  farms: seed.FARMS,
  stores: seed.STORES,
  medicines: seed.MEDICINES,
  batches: seed.BATCHES,
  txns: seed.TXNS,
  employees: seed.EMPLOYEES,
  attendance: seed.ATTENDANCE,
  leaves: seed.LEAVES,
  tours: seed.TOURS,
  visits: seed.VISITS,
  trainings: seed.TRAININGS,
  enrollments: seed.ENROLLMENTS,
  diseaseReports: seed.DISEASE_REPORTS,
  listings: seed.LISTINGS,
  orders: seed.ORDERS,
  counters: {
    farmer: seed.FARMER_SEQ_START, farm: { ...seed.FARM_COUNTERS }, visit: seed.VISIT_SEQ_START, txn: seed.TXN_SEQ_START,
    att: seed.ATT_SEQ_START, enr: seed.ENR_SEQ_START, cert: seed.CERT_SEQ_START, leave: seed.LEAVES.length, tour: seed.TOURS.length,
    training: seed.TRAININGS.length, batch: seed.BATCHES.length, dr: seed.DISEASE_REPORTS.length, emp: seed.EMPLOYEES.length, listing: seed.LST_SEQ_START, order: seed.ORD_SEQ_START,
  } as Counters,
  seedVersion: SEED_VERSION,
})

/** FEFO: batches for a store+medicine with stock, ordered by earliest expiry, excluding expired */
export const fefoBatches = (batches: Batch[], storeId: string, medicineId: string, includeExpired = false) => {
  const today = todayISO()
  return batches
    .filter(b => b.storeId === storeId && b.medicineId === medicineId && b.qty > 0 && (includeExpired || b.expiry >= today))
    .sort((a, b) => a.expiry.localeCompare(b.expiry))
}
export const stockOf = (batches: Batch[], storeId: string, medicineId: string) =>
  batches.filter(b => b.storeId === storeId && b.medicineId === medicineId).reduce((s, b) => s + b.qty, 0)

export const useStore = create<DataState>()(
  persist(
    (set, get) => ({
      ...seedState(),

      login: (email, workspace) => {
        const e = get().employees.find(x => x.email.toLowerCase() === email.toLowerCase() && x.active)
        if (!e) return { ok: false, error: 'এই ইমেইলে কোনো সক্রিয় কর্মকর্তা পাওয়া যায়নি · No active officer with this email' }
        set({ session: { employeeId: e.id, workspace, loginAt: nowISO() } })
        return { ok: true }
      },
      logout: () => set({ session: null }),

      addFarmer: f => {
        const c = get().counters
        const n = c.farmer + 1
        const farmer: Farmer = { ...f, id: farmerId(new Date().getFullYear(), n), registeredAt: todayISO(), status: 'Active' }
        set(s => ({ farmers: [farmer, ...s.farmers], counters: { ...c, farmer: n } }))
        return farmer
      },
      updateFarmer: (id, patch) => set(s => ({ farmers: s.farmers.map(f => (f.id === id ? { ...f, ...patch } : f)) })),
      addFarm: f => {
        const c = get().counters
        const n = (c.farm[f.location.district] ?? 456700) + 1
        const farm: Farm = { ...f, id: farmId(f.location.district, n), registeredAt: todayISO() }
        set(s => ({ farms: [farm, ...s.farms], counters: { ...c, farm: { ...c.farm, [f.location.district]: n } } }))
        return farm
      },
      updateFarm: (id, patch) => set(s => ({ farms: s.farms.map(f => (f.id === id ? { ...f, ...patch } : f)) })),

      addMedicine: m => {
        const med: Medicine = { ...m, id: `MED-${pad(get().medicines.length + 1, 3)}` }
        set(s => ({ medicines: [...s.medicines, med] }))
        return med
      },
      receiveStock: p => {
        const s = get()
        const me = s.session?.employeeId ?? 'EMP-0001'
        const existing = s.batches.find(b => b.storeId === p.storeId && b.medicineId === p.medicineId && b.batchNo === p.batchNo)
        const batches = existing
          ? s.batches.map(b => (b.id === existing.id ? { ...b, qty: b.qty + p.qty, expiry: p.expiry, supplier: p.supplier } : b))
          : [...s.batches, { id: `BT-${s.counters.batch + 1}`, storeId: p.storeId, medicineId: p.medicineId, batchNo: p.batchNo, expiry: p.expiry, supplier: p.supplier, qty: p.qty, receivedAt: todayISO() }]
        const txn: StockTxn = { id: `TXN-${pad(s.counters.txn + 1, 6)}`, type: 'Receive', medicineId: p.medicineId, batchNo: p.batchNo, qty: p.qty, toStoreId: p.storeId, byEmployeeId: me, date: todayISO(), note: p.note ?? p.supplier }
        set({ batches, txns: [txn, ...s.txns], counters: { ...s.counters, batch: s.counters.batch + 1, txn: s.counters.txn + 1 } })
      },
      transferStock: p => {
        const s = get()
        const me = s.session?.employeeId ?? 'EMP-0001'
        const src = p.batchNo ? s.batches.filter(b => b.storeId === p.fromStoreId && b.medicineId === p.medicineId && b.batchNo === p.batchNo && b.qty > 0) : fefoBatches(s.batches, p.fromStoreId, p.medicineId)
        const avail = src.reduce((a, b) => a + b.qty, 0)
        if (avail < p.qty) return { ok: false, error: `পর্যাপ্ত মজুদ নেই · Available ${avail}` }
        let remaining = p.qty
        let batches = [...s.batches]
        const txns: StockTxn[] = []
        let txnN = s.counters.txn, batchN = s.counters.batch
        for (const b of src) {
          if (remaining <= 0) break
          const take = Math.min(b.qty, remaining)
          remaining -= take
          batches = batches.map(x => (x.id === b.id ? { ...x, qty: x.qty - take } : x))
          const dest = batches.find(x => x.storeId === p.toStoreId && x.medicineId === p.medicineId && x.batchNo === b.batchNo)
          if (dest) batches = batches.map(x => (x.id === dest.id ? { ...x, qty: x.qty + take } : x))
          else batches.push({ id: `BT-${++batchN}`, storeId: p.toStoreId, medicineId: p.medicineId, batchNo: b.batchNo, expiry: b.expiry, supplier: b.supplier, qty: take, receivedAt: todayISO() })
          txns.push({ id: `TXN-${pad(++txnN, 6)}`, type: 'Transfer', medicineId: p.medicineId, batchNo: b.batchNo, qty: take, fromStoreId: p.fromStoreId, toStoreId: p.toStoreId, byEmployeeId: me, date: todayISO(), note: p.note })
        }
        set({ batches, txns: [...txns.reverse(), ...s.txns], counters: { ...s.counters, txn: txnN, batch: batchN } })
        return { ok: true }
      },
      distributeStock: p => {
        const s = get()
        const me = s.session?.employeeId ?? 'EMP-0001'
        const src = p.batchNo ? s.batches.filter(b => b.storeId === p.fromStoreId && b.medicineId === p.medicineId && b.batchNo === p.batchNo && b.qty > 0) : fefoBatches(s.batches, p.fromStoreId, p.medicineId)
        const avail = src.reduce((a, b) => a + b.qty, 0)
        if (avail < p.qty) return { ok: false, error: `পর্যাপ্ত মজুদ নেই · Available ${avail}` }
        let remaining = p.qty
        let batches = [...s.batches]
        const txns: StockTxn[] = []
        const lines: { batchNo: string; qty: number }[] = []
        let txnN = s.counters.txn
        for (const b of src) {
          if (remaining <= 0) break
          const take = Math.min(b.qty, remaining)
          remaining -= take
          batches = batches.map(x => (x.id === b.id ? { ...x, qty: x.qty - take } : x))
          lines.push({ batchNo: b.batchNo, qty: take })
          txns.push({ id: `TXN-${pad(++txnN, 6)}`, type: 'Distribute', medicineId: p.medicineId, batchNo: b.batchNo, qty: take, fromStoreId: p.fromStoreId, farmerId: p.farmerId, farmId: p.farmId, disease: p.disease, byEmployeeId: me, date: p.date ?? todayISO(), note: p.note })
        }
        set({ batches, txns: [...txns.reverse(), ...s.txns], counters: { ...s.counters, txn: txnN } })
        return { ok: true, lines }
      },
      adjustStock: p => {
        const s = get()
        const me = s.session?.employeeId ?? 'EMP-0001'
        const batches = s.batches.map(b => (b.storeId === p.storeId && b.medicineId === p.medicineId && b.batchNo === p.batchNo ? { ...b, qty: Math.max(0, b.qty + p.delta) } : b))
        const txn: StockTxn = { id: `TXN-${pad(s.counters.txn + 1, 6)}`, type: 'Adjust', medicineId: p.medicineId, batchNo: p.batchNo, qty: p.delta, toStoreId: p.storeId, byEmployeeId: me, date: todayISO(), note: p.note }
        set({ batches, txns: [txn, ...s.txns], counters: { ...s.counters, txn: s.counters.txn + 1 } })
      },

      checkIn: p => {
        const s = get()
        const me = s.session?.employeeId
        if (!me) return
        const date = todayISO()
        if (s.attendance.some(a => a.employeeId === me && a.date === date && a.checkIn)) return
        const now = new Date()
        const late = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 15)
        const rec: Attendance = { id: `AT-${pad(s.counters.att + 1, 6)}`, employeeId: me, date, checkIn: nowISO(), inLat: p.lat, inLng: p.lng, mode: p.mode, selfie: p.selfie, status: late ? 'Late' : 'Present' }
        set({ attendance: [rec, ...s.attendance.filter(a => !(a.employeeId === me && a.date === date))], counters: { ...s.counters, att: s.counters.att + 1 } })
      },
      checkOut: p => {
        const s = get()
        const me = s.session?.employeeId
        if (!me) return
        const date = todayISO()
        set({ attendance: s.attendance.map(a => (a.employeeId === me && a.date === date && a.checkIn && !a.checkOut ? { ...a, checkOut: nowISO(), outLat: p.lat, outLng: p.lng } : a)) })
      },
      applyLeave: l => set(s => ({ leaves: [{ ...l, id: `LV-${pad(s.counters.leave + 1, 4)}`, status: 'Pending' }, ...s.leaves], counters: { ...s.counters, leave: s.counters.leave + 1 } })),
      decideLeave: (id, status) => set(s => ({ leaves: s.leaves.map(l => (l.id === id ? { ...l, status } : l)) })),
      addTour: t => set(s => ({ tours: [{ ...t, id: `TR-${pad(s.counters.tour + 1, 4)}` }, ...s.tours], counters: { ...s.counters, tour: s.counters.tour + 1 } })),
      updateTour: (id, patch) => set(s => ({ tours: s.tours.map(t => (t.id === id ? { ...t, ...patch } : t)) })),
      addEmployee: e => {
        const s = get()
        const emp: Employee = { ...e, id: `EMP-${pad(s.counters.emp + 1, 4)}` }
        set({ employees: [...s.employees, emp], counters: { ...s.counters, emp: s.counters.emp + 1 } })
        return emp
      },
      updateEmployee: (id, patch) => set(s => ({ employees: s.employees.map(e => (e.id === id ? { ...e, ...patch } : e)) })),

      submitVisit: v => {
        const s = get()
        const warnings: string[] = []
        const officer = s.employees.find(e => e.id === v.employeeId)
        const storeId = officer?.storeId
        const visit: Visit = { ...v, id: `VIS-${pad(s.counters.visit + 1, 6)}`, status: 'Submitted' }
        let counters = { ...s.counters, visit: s.counters.visit + 1 }
        set({ visits: [visit, ...s.visits], counters })
        // auto-distribute medicines from officer's store (FEFO)
        for (const m of v.medicines) {
          if (!storeId) { warnings.push('কর্মকর্তার কোনো স্টোর নির্ধারিত নেই — ঔষধ মজুদ থেকে কাটা হয়নি'); break }
          const r = get().distributeStock({ fromStoreId: storeId, medicineId: m.medicineId, qty: m.qty, farmerId: v.farmerId, farmId: v.farmId, disease: v.disease, batchNo: m.batchNo || undefined, note: `Visit ${visit.id}`, date: v.date })
          if (!r.ok) warnings.push(`${s.medicines.find(x => x.id === m.medicineId)?.name}: ${r.error}`)
        }
        // auto disease report
        if (v.disease) {
          const st = get()
          const farm = st.farms.find(f => f.id === v.farmId)
          const a = v.animals[0]
          const dr: DiseaseReport = { id: `DR-${pad(st.counters.dr + 1, 5)}`, visitId: visit.id, farmId: v.farmId, farmerId: v.farmerId, species: a?.species ?? 'Other', disease: v.disease, cases: v.animals.reduce((x, y) => x + y.sick, 0), deaths: v.animals.reduce((x, y) => x + y.dead, 0), date: v.date, district: farm?.location.district ?? '', upazila: farm?.location.upazila ?? '', reportedBy: v.employeeId }
          set({ diseaseReports: [dr, ...st.diseaseReports], counters: { ...st.counters, dr: st.counters.dr + 1 } })
        }
        return { ok: true, visit, warnings }
      },

      addTraining: t => {
        const s = get()
        const tr: Training = { ...t, id: `TRN-${pad(s.counters.training + 1, 4)}` }
        set({ trainings: [tr, ...s.trainings], counters: { ...s.counters, training: s.counters.training + 1 } })
        return tr
      },
      updateTraining: (id, patch) => set(s => ({ trainings: s.trainings.map(t => (t.id === id ? { ...t, ...patch } : t)) })),
      enroll: (trainingId, farmerId) => {
        const s = get()
        const tr = s.trainings.find(t => t.id === trainingId)
        if (!tr) return { ok: false, error: 'Training not found' }
        const cur = s.enrollments.filter(e => e.trainingId === trainingId)
        if (cur.some(e => e.farmerId === farmerId)) return { ok: false, error: 'এই খামারি ইতিমধ্যে নিবন্ধিত · Already enrolled' }
        if (cur.length >= tr.seats) return { ok: false, error: 'আসন পূর্ণ · No seats left' }
        set({ enrollments: [...s.enrollments, { id: `ENR-${pad(s.counters.enr + 1, 6)}`, trainingId, farmerId, enrolledAt: todayISO(), attended: false }], counters: { ...s.counters, enr: s.counters.enr + 1 } })
        return { ok: true }
      },
      unenroll: id => set(s => ({ enrollments: s.enrollments.filter(e => e.id !== id) })),
      setAttended: (id, attended) => set(s => ({ enrollments: s.enrollments.map(e => (e.id === id ? { ...e, attended } : e)) })),
      setFeedback: (id, feedback) => set(s => ({ enrollments: s.enrollments.map(e => (e.id === id ? { ...e, feedback } : e)) })),
      completeTraining: trainingId => {
        const s = get()
        let cert = s.counters.cert
        let issued = 0
        const tr = s.trainings.find(t => t.id === trainingId)
        const enrollments = s.enrollments.map(e => {
          if (e.trainingId === trainingId && e.attended && !e.certificateNo) { issued++; return { ...e, certificateNo: certNo(new Date().getFullYear(), ++cert), issuedAt: tr?.endDate ?? tr?.date ?? todayISO() } }
          return e
        })
        set({ enrollments, trainings: s.trainings.map(t => (t.id === trainingId ? { ...t, status: 'Completed' } : t)), counters: { ...s.counters, cert } })
        return issued
      },

      addListing: (l, status = 'Pending') => {
        const s = get()
        const listing: Listing = { ...l, id: `LST-${pad(s.counters.listing + 1, 6)}`, createdAt: todayISO(), views: 0, status }
        set({ listings: [listing, ...s.listings], counters: { ...s.counters, listing: s.counters.listing + 1 } })
        return listing
      },
      updateListing: (id, patch) => set(s => ({ listings: s.listings.map(l => (l.id === id ? { ...l, ...patch } : l)) })),
      reviewListing: (id, status, note) => set(s => ({ listings: s.listings.map(l => (l.id === id ? { ...l, status, reviewNote: note, reviewedBy: s.session?.employeeId } : l)) })),
      viewListing: id => set(s => ({ listings: s.listings.map(l => (l.id === id ? { ...l, views: l.views + 1 } : l)) })),
      placeOrder: p => {
        const s = get()
        if (!p.items.length) return { ok: false, error: 'Cart is empty' }
        if (!p.buyer.name.trim() || !/^01[3-9]\d{8}$/.test(p.buyer.mobile) || !p.buyer.address.trim()) return { ok: false, error: 'নাম, সঠিক মোবাইল নম্বর ও ঠিকানা দিন · Name, valid mobile and address required' }
        const bySeller = new Map<string, OrderItem[]>()
        for (const it of p.items) {
          const l = s.listings.find(x => x.id === it.listingId)
          if (!l || l.status !== 'Active') return { ok: false, error: `Listing unavailable: ${it.listingId}` }
          if (it.qty < l.minOrder) return { ok: false, error: `${l.title}: minimum order ${l.minOrder} ${l.unit}` }
          if (it.qty > l.qty) return { ok: false, error: `${l.title}: only ${l.qty} ${l.unit} available` }
          if (!bySeller.has(l.farmerId)) bySeller.set(l.farmerId, [])
          bySeller.get(l.farmerId)!.push({ listingId: l.id, title: l.title, unit: l.unit, qty: it.qty, price: l.price })
        }
        let n = s.counters.order
        const orders: Order[] = [...bySeller.entries()].map(([farmerId, items]) => ({
          id: `ORD-${pad(++n, 6)}`, farmerId, items, buyer: p.buyer, total: items.reduce((a, i) => a + i.qty * i.price, 0), status: 'Placed', payment: p.payment, placedAt: todayISO(), updatedAt: todayISO(), note: p.note,
        }))
        const listings = s.listings.map(l => {
          const sold = p.items.filter(i => i.listingId === l.id).reduce((a, i) => a + i.qty, 0)
          if (!sold) return l
          const qty = l.qty - sold
          return { ...l, qty, status: qty <= 0 ? 'SoldOut' as const : l.status }
        })
        set({ orders: [...orders, ...s.orders], listings, counters: { ...s.counters, order: n } })
        return { ok: true, orders }
      },
      updateOrderStatus: (id, status) => set(s => ({ orders: s.orders.map(o => (o.id === id ? { ...o, status, updatedAt: todayISO() } : o)) })),

      resetDemo: () => set({ ...seedState(), session: get().session }),
    }),
    {
      name: 'nflms-data-v1',
      version: SEED_VERSION,
      migrate: (persisted: unknown) => {
        const p = persisted as Partial<DataState> | undefined
        if (!p || p.seedVersion !== SEED_VERSION) return { ...seedState(), session: p?.session ?? null } as DataState
        return p as DataState
      },
    },
  ),
)

// ---------- Selectors (pure helpers) ----------
export const useMe = () => useStore(s => (s.session ? s.employees.find(e => e.id === s.session!.employeeId) ?? null : null))
export const empName = (employees: Employee[], id?: string) => employees.find(e => e.id === id)?.name ?? '—'
export const farmerName = (farmers: Farmer[], id?: string) => farmers.find(f => f.id === id)?.name ?? '—'
export const medName = (meds: Medicine[], id?: string) => meds.find(m => m.id === id)?.name ?? '—'
export const storeName = (stores: Store[], id?: string) => stores.find(s => s.id === id)?.name ?? '—'
