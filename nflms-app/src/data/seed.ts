import type {
  Attendance, Batch, DiseaseReport, Employee, Enrollment, Farm, Farmer, FarmType, Leave, Listing, Medicine, Order, ProductCategory, StockTxn, Store, Tour, Training, Visit,
} from '../types'
import { DIVISIONS, divisionOfDistrict } from './geo'
import { farmId, farmerId, certNo } from '../lib/id'
import { commons } from '../pages/market/meta'
import { addDays, todayISO } from '../lib/format'

// deterministic PRNG
function mulberry32(a: number) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rnd = mulberry32(20260921)
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)]
const int = (a: number, b: number) => a + Math.floor(rnd() * (b - a + 1))
const TODAY = todayISO()
const ago = (n: number) => addDays(TODAY, -n)

const FIRST_M = ['রহিম', 'করিম', 'আব্দুল', 'মোহাম্মদ', 'জসিম', 'কামাল', 'শফিক', 'নূর', 'হাসান', 'সেলিম', 'মিজান', 'ফারুক', 'রফিক', 'সোহেল', 'আলমগীর', 'বাবুল', 'মনির', 'সুমন', 'জাহাঙ্গীর', 'আনোয়ার']
const FIRST_F = ['ফাতেমা', 'রাবেয়া', 'সালমা', 'নাসরিন', 'রোকেয়া', 'আয়েশা', 'শাহানা', 'মরিয়ম', 'হালিমা', 'জোসনা']
const LAST = ['আহমেদ', 'হোসেন', 'ইসলাম', 'মিয়া', 'উদ্দিন', 'শেখ', 'খান', 'চৌধুরী', 'সরকার', 'বেগম', 'আলী', 'মোল্লা', 'হাওলাদার', 'তালুকদার']
const VILLAGES = ['চান্দপুর', 'রামপুর', 'কাশিমপুর', 'নোয়াপাড়া', 'বড়বাড়ি', 'শ্যামপুর', 'দক্ষিণপাড়া', 'উত্তরগাঁও', 'মধ্যপাড়া', 'হাটখোলা', 'চরপাড়া', 'বাজারপাড়া']
const UNIONS = ['১ নং ইউনিয়ন', '২ নং ইউনিয়ন', '৩ নং ইউনিয়ন', '৪ নং ইউনিয়ন', '৫ নং ইউনিয়ন', '৬ নং ইউনিয়ন']

// Pilot focus: Cumilla district (Chattogram) + a few others
const PILOT: { district: string; upazilas: string[]; weight: number }[] = [
  { district: 'Cumilla', upazilas: ['Cumilla Sadar', 'Daudkandi', 'Chandina', 'Laksam', 'Muradnagar'], weight: 5 },
  { district: 'Dhaka', upazilas: ['Savar', 'Dhamrai'], weight: 2 },
  { district: 'Gazipur', upazilas: ['Sreepur', 'Kapasia'], weight: 2 },
  { district: 'Bogura', upazilas: ['Bogura Sadar', 'Sherpur'], weight: 2 },
  { district: 'Khulna', upazilas: ['Dumuria', 'Paikgachha'], weight: 2 },
  { district: 'Mymensingh', upazilas: ['Trishal', 'Bhaluka'], weight: 2 },
  { district: 'Jashore', upazilas: ['Jashore Sadar', 'Monirampur'], weight: 1 },
  { district: 'Rangpur', upazilas: ['Pirganj'], weight: 1 },
  { district: 'Sylhet', upazilas: ['Sylhet Sadar'], weight: 1 },
  { district: 'Barishal', upazilas: ['Bakerganj'], weight: 1 },
]
const weighted = PILOT.flatMap(p => Array(p.weight).fill(p) as typeof PILOT)
const pickLoc = () => {
  const p = pick(weighted)
  const upazila = pick(p.upazilas)
  return { division: divisionOfDistrict(p.district), district: p.district, upazila, union: pick(UNIONS), village: pick(VILLAGES), lat: 23.4 + rnd() * 1.6, lng: 89.2 + rnd() * 2.2 }
}

// ---------- Employees ----------
export const EMPLOYEES: Employee[] = [
  { id: 'EMP-0001', name: 'ড. মো. আবুল কালাম আজাদ', designation: 'Admin', department: 'MoFL', mobile: '01711000001', email: 'admin@mofl.gov.bd', station: { division: 'Dhaka', district: 'Dhaka', upazila: 'Dhaka' }, role: 'admin', active: true },
  { id: 'EMP-0002', name: 'মোহাম্মদ শাহজাহান', designation: 'Director', department: 'MoFL', mobile: '01711000002', email: 'director@mofl.gov.bd', station: { division: 'Dhaka', district: 'Dhaka', upazila: 'Dhaka' }, role: 'ministry', active: true },
  { id: 'EMP-0003', name: 'ডা. নাজমুল হক', designation: 'DLO', department: 'DLS', mobile: '01711000003', email: 'dlo.cumilla@dls.gov.bd', station: { division: 'Chattogram', district: 'Cumilla', upazila: 'Cumilla Sadar' }, role: 'district', storeId: 'ST-D-CUM', active: true },
  { id: 'EMP-0004', name: 'মো. আরিফুল ইসলাম', designation: 'DFO', department: 'DoF', mobile: '01711000004', email: 'dfo.cumilla@fisheries.gov.bd', station: { division: 'Chattogram', district: 'Cumilla', upazila: 'Cumilla Sadar' }, role: 'district', storeId: 'ST-D-CUM', active: true },
  { id: 'EMP-0005', name: 'ডা. সাবরিনা ইয়াসমিন', designation: 'ULO', department: 'DLS', mobile: '01711000005', email: 'ulo.sadar@dls.gov.bd', station: { division: 'Chattogram', district: 'Cumilla', upazila: 'Cumilla Sadar' }, role: 'upazila', storeId: 'ST-U-CUMSADAR', active: true },
  { id: 'EMP-0006', name: 'মো. তানভীর হাসান', designation: 'UFO', department: 'DoF', mobile: '01711000006', email: 'ufo.sadar@fisheries.gov.bd', station: { division: 'Chattogram', district: 'Cumilla', upazila: 'Cumilla Sadar' }, role: 'upazila', storeId: 'ST-U-CUMSADAR', active: true },
  { id: 'EMP-0007', name: 'ডা. রাশেদুল করিম', designation: 'VS', department: 'DLS', mobile: '01711000007', email: 'vs.sadar@dls.gov.bd', station: { division: 'Chattogram', district: 'Cumilla', upazila: 'Cumilla Sadar' }, role: 'field', storeId: 'ST-U-CUMSADAR', active: true },
  { id: 'EMP-0008', name: 'মো. জাকির হোসেন', designation: 'VFA', department: 'DLS', mobile: '01711000008', email: 'vfa.sadar@dls.gov.bd', station: { division: 'Chattogram', district: 'Cumilla', upazila: 'Cumilla Sadar' }, role: 'field', storeId: 'ST-U-CUMSADAR', active: true },
  { id: 'EMP-0009', name: 'মো. সাইফুল ইসলাম', designation: 'FA', department: 'DoF', mobile: '01711000009', email: 'fa.sadar@fisheries.gov.bd', station: { division: 'Chattogram', district: 'Cumilla', upazila: 'Cumilla Sadar' }, role: 'field', storeId: 'ST-U-CUMSADAR', active: true },
  { id: 'EMP-0010', name: 'ডা. ফারহানা আক্তার', designation: 'ULO', department: 'DLS', mobile: '01711000010', email: 'ulo.daudkandi@dls.gov.bd', station: { division: 'Chattogram', district: 'Cumilla', upazila: 'Daudkandi' }, role: 'upazila', storeId: 'ST-U-DAUD', active: true },
  { id: 'EMP-0011', name: 'মো. রুবেল মিয়া', designation: 'AI Tech', department: 'DLS', mobile: '01711000011', email: 'ai.daudkandi@dls.gov.bd', station: { division: 'Chattogram', district: 'Cumilla', upazila: 'Daudkandi' }, role: 'field', storeId: 'ST-U-DAUD', active: true },
  { id: 'EMP-0012', name: 'ডা. মাহবুব আলম', designation: 'ULO', department: 'DLS', mobile: '01711000012', email: 'ulo.chandina@dls.gov.bd', station: { division: 'Chattogram', district: 'Cumilla', upazila: 'Chandina' }, role: 'upazila', storeId: 'ST-U-CHAN', active: true },
  { id: 'EMP-0013', name: 'মো. হাফিজুর রহমান', designation: 'LEO', department: 'DLS', mobile: '01711000013', email: 'leo.chandina@dls.gov.bd', station: { division: 'Chattogram', district: 'Cumilla', upazila: 'Chandina' }, role: 'field', storeId: 'ST-U-CHAN', active: true },
  { id: 'EMP-0014', name: 'ডা. শামীমা নাসরিন', designation: 'ULO', department: 'DLS', mobile: '01711000014', email: 'ulo.savar@dls.gov.bd', station: { division: 'Dhaka', district: 'Dhaka', upazila: 'Savar' }, role: 'upazila', storeId: 'ST-U-SAVAR', active: true },
  { id: 'EMP-0015', name: 'মো. ইমরান হোসেন', designation: 'UFO', department: 'DoF', mobile: '01711000015', email: 'ufo.bogura@fisheries.gov.bd', station: { division: 'Rajshahi', district: 'Bogura', upazila: 'Bogura Sadar' }, role: 'upazila', storeId: 'ST-U-BOG', active: true },
  { id: 'EMP-0016', name: 'ডা. আসাদুজ্জামান', designation: 'DLO', department: 'DLS', mobile: '01711000016', email: 'dlo.dhaka@dls.gov.bd', station: { division: 'Dhaka', district: 'Dhaka', upazila: 'Dhaka' }, role: 'district', storeId: 'ST-D-DHA', active: true },
]

// ---------- Stores ----------
export const STORES: Store[] = [
  { id: 'ST-C', name: 'কেন্দ্রীয় স্টোর · Central Store (Dhaka)', level: 'Central' },
  { id: 'ST-D-CUM', name: 'জেলা স্টোর · Cumilla', level: 'District', district: 'Cumilla' },
  { id: 'ST-D-DHA', name: 'জেলা স্টোর · Dhaka', level: 'District', district: 'Dhaka' },
  { id: 'ST-D-BOG', name: 'জেলা স্টোর · Bogura', level: 'District', district: 'Bogura' },
  { id: 'ST-U-CUMSADAR', name: 'উপজেলা স্টোর · Cumilla Sadar', level: 'Upazila', district: 'Cumilla', upazila: 'Cumilla Sadar' },
  { id: 'ST-U-DAUD', name: 'উপজেলা স্টোর · Daudkandi', level: 'Upazila', district: 'Cumilla', upazila: 'Daudkandi' },
  { id: 'ST-U-CHAN', name: 'উপজেলা স্টোর · Chandina', level: 'Upazila', district: 'Cumilla', upazila: 'Chandina' },
  { id: 'ST-U-SAVAR', name: 'উপজেলা স্টোর · Savar', level: 'Upazila', district: 'Dhaka', upazila: 'Savar' },
  { id: 'ST-U-BOG', name: 'উপজেলা স্টোর · Bogura Sadar', level: 'Upazila', district: 'Bogura', upazila: 'Bogura Sadar' },
]

// ---------- Medicines ----------
export const MEDICINES: Medicine[] = [
  { id: 'MED-001', name: 'Antibiotic X (Oxytetracycline 20%)', category: 'Antibiotic', unit: 'bottle', species: ['Cattle', 'Goat'], minStock: 2000 },
  { id: 'MED-002', name: 'FMD Vaccine (Trivalent)', category: 'Vaccine', unit: 'dose', species: ['Cattle'], minStock: 5000 },
  { id: 'MED-003', name: 'Anthrax Vaccine', category: 'Vaccine', unit: 'dose', species: ['Cattle', 'Goat'], minStock: 3000 },
  { id: 'MED-004', name: 'PPR Vaccine', category: 'Vaccine', unit: 'dose', species: ['Goat'], minStock: 3000 },
  { id: 'MED-005', name: 'RDV (Newcastle) Vaccine', category: 'Vaccine', unit: 'dose', species: ['Poultry'], minStock: 10000 },
  { id: 'MED-006', name: 'Gumboro (IBD) Vaccine', category: 'Vaccine', unit: 'dose', species: ['Poultry'], minStock: 8000 },
  { id: 'MED-007', name: 'Duck Plague Vaccine', category: 'Vaccine', unit: 'dose', species: ['Duck'], minStock: 3000 },
  { id: 'MED-008', name: 'Ivermectin Inj.', category: 'Anthelmintic', unit: 'vial', species: ['Cattle', 'Goat'], minStock: 800 },
  { id: 'MED-009', name: 'Albendazole Bolus', category: 'Anthelmintic', unit: 'bolus', species: ['Cattle', 'Goat'], minStock: 4000 },
  { id: 'MED-010', name: 'Vitamin AD3E', category: 'Vitamin', unit: 'bottle', species: ['Cattle', 'Poultry'], minStock: 600 },
  { id: 'MED-011', name: 'Potassium Permanganate', category: 'Aqua Chemical', unit: 'kg', species: ['Fish'], minStock: 300 },
  { id: 'MED-012', name: 'Aqua Lime (CaO)', category: 'Aqua Chemical', unit: 'kg', species: ['Fish'], minStock: 2000 },
  { id: 'MED-013', name: 'Zeolite', category: 'Aqua Chemical', unit: 'kg', species: ['Fish'], minStock: 1000 },
  { id: 'MED-014', name: 'Povidone Iodine 10%', category: 'Antiseptic', unit: 'bottle', species: ['Cattle', 'Goat', 'Poultry'], minStock: 400 },
]

const SUPPLIERS = ['LRI Mohakhali', 'Square Pharma', 'ACI Animal Health', 'Renata Ltd', 'Incepta Vet', 'Opsonin Agrovet']
const DISEASES_CATTLE = ['FMD', 'Anthrax', 'LSD', 'Mastitis', 'Black Quarter', 'HS']
const DISEASES_GOAT = ['PPR', 'Goat Pox', 'Pneumonia']
const DISEASES_POULTRY = ['Newcastle', 'Gumboro', 'Fowl Cholera', 'Avian Influenza', 'Coccidiosis']
const DISEASES_FISH = ['EUS', 'Argulosis', 'Tail & Fin Rot', 'Dropsy', 'Gill Rot']
const DISEASES_DUCK = ['Duck Plague', 'Duck Cholera']

// ---------- Farmers & Farms ----------
const FARM_TYPES: FarmType[] = ['Fish', 'Fish', 'Cattle', 'Dairy', 'Poultry', 'Poultry', 'Duck', 'Goat/Sheep', 'Mixed']
export const FARMERS: Farmer[] = []
export const FARMS: Farm[] = []
const farmCounters: Record<string, number> = {}
let farmerSeq = 123400
for (let i = 0; i < 72; i++) {
  const gender = rnd() < 0.78 ? 'M' : 'F'
  const name = `${gender === 'M' ? pick(FIRST_M) : pick(FIRST_F)} ${pick(LAST)}`
  const loc = pickLoc()
  const year = rnd() < 0.7 ? 2026 : 2025
  const f: Farmer = {
    id: farmerId(year, ++farmerSeq), name, nid: String(int(1000000000, 9999999999)), mobile: `017${int(10000000, 99999999)}`,
    fatherName: `${pick(FIRST_M)} ${pick(LAST)}`, gender, dob: `${int(1960, 1998)}-${String(int(1, 12)).padStart(2, '0')}-${String(int(1, 28)).padStart(2, '0')}`,
    location: loc, registeredAt: ago(int(1, 240)), status: rnd() < 0.95 ? 'Active' : 'Inactive',
  }
  FARMERS.push(f)
  const nFarms = rnd() < 0.75 ? 1 : 2
  for (let k = 0; k < nFarms; k++) {
    const type = pick(FARM_TYPES)
    farmCounters[loc.district] = (farmCounters[loc.district] ?? 456700) + 1
    const isFish = type === 'Fish'
    FARMS.push({
      id: farmId(loc.district, farmCounters[loc.district]), farmerId: f.id,
      name: `${name.split(' ')[0]} ${isFish ? 'মৎস্য খামার' : type === 'Poultry' ? 'পোল্ট্রি ফার্ম' : type === 'Dairy' ? 'ডেইরি ফার্ম' : 'খামার'}`,
      type, size: isFish ? int(30, 400) : int(5, 60), sizeUnit: 'decimal',
      capacity: isFish ? int(2, 40) : type === 'Poultry' ? int(500, 5000) : int(5, 60), capacityUnit: isFish ? 'ton/yr' : type === 'Poultry' ? 'birds' : 'heads',
      animalCount: isFish ? 0 : type === 'Poultry' ? int(300, 4000) : type === 'Duck' ? int(100, 1500) : int(3, 45),
      pondCount: isFish || type === 'Mixed' ? int(1, 6) : undefined,
      location: { ...loc }, registeredAt: addDays(f.registeredAt, int(0, 5)), status: rnd() < 0.9 ? 'Active' : 'Pending', documents: ['Trade License', 'Land Deed'].slice(0, int(0, 2)),
    })
  }
}

// ---------- Batches & Transactions ----------
export const BATCHES: Batch[] = []
export const TXNS: StockTxn[] = []
let txnSeq = 0
const addTxn = (t: Omit<StockTxn, 'id'>) => { TXNS.push({ id: `TXN-${String(++txnSeq).padStart(6, '0')}`, ...t }) }
const batchKey = (storeId: string, medicineId: string, batchNo: string) => `${storeId}|${medicineId}|${batchNo}`
const batchMap = new Map<string, Batch>()
const upsertBatch = (storeId: string, medicineId: string, batchNo: string, expiry: string, supplier: string, qty: number, receivedAt: string) => {
  const key = batchKey(storeId, medicineId, batchNo)
  let b = batchMap.get(key)
  if (!b) { b = { id: `BT-${batchMap.size + 1}`, storeId, medicineId, batchNo, expiry, supplier, qty: 0, receivedAt }; batchMap.set(key, b); BATCHES.push(b) }
  b.qty += qty
}

for (const m of MEDICINES) {
  // central receives 2-3 batches
  const nb = int(2, 3)
  for (let b = 0; b < nb; b++) {
    const batchNo = `${m.id.slice(4)}-${2026}${String(int(1, 9)).padStart(2, '0')}-${String.fromCharCode(65 + b)}`
    const expiry = addDays(TODAY, b === 0 ? int(-20, 60) : int(120, 700)) // first batch sometimes near/expired
    const supplier = pick(SUPPLIERS)
    const qty = m.minStock * int(4, 8)
    const receivedAt = ago(int(60, 200))
    upsertBatch('ST-C', m.id, batchNo, expiry, supplier, qty, receivedAt)
    addTxn({ type: 'Receive', medicineId: m.id, batchNo, qty, toStoreId: 'ST-C', byEmployeeId: 'EMP-0001', date: receivedAt, note: supplier })
    // transfer to districts
    for (const d of ['ST-D-CUM', 'ST-D-DHA', 'ST-D-BOG']) {
      const q = Math.floor(qty * (d === 'ST-D-CUM' ? 0.3 : 0.15))
      const dt = addDays(receivedAt, int(3, 10))
      batchMap.get(batchKey('ST-C', m.id, batchNo))!.qty -= q
      upsertBatch(d, m.id, batchNo, expiry, supplier, q, dt)
      addTxn({ type: 'Transfer', medicineId: m.id, batchNo, qty: q, fromStoreId: 'ST-C', toStoreId: d, byEmployeeId: 'EMP-0001', date: dt })
      // district to upazilas
      const ups = d === 'ST-D-CUM' ? ['ST-U-CUMSADAR', 'ST-U-DAUD', 'ST-U-CHAN'] : d === 'ST-D-DHA' ? ['ST-U-SAVAR'] : ['ST-U-BOG']
      for (const u of ups) {
        const q2 = Math.floor(q * 0.25)
        const dt2 = addDays(dt, int(2, 8))
        batchMap.get(batchKey(d, m.id, batchNo))!.qty -= q2
        upsertBatch(u, m.id, batchNo, expiry, supplier, q2, dt2)
        addTxn({ type: 'Transfer', medicineId: m.id, batchNo, qty: q2, fromStoreId: d, toStoreId: u, byEmployeeId: d === 'ST-D-CUM' ? 'EMP-0003' : d === 'ST-D-DHA' ? 'EMP-0016' : 'EMP-0001', date: dt2 })
      }
    }
  }
}

// ---------- Visits, distributions & disease reports ----------
export const VISITS: Visit[] = []
export const DISEASE_REPORTS: DiseaseReport[] = []
const fieldOfficers = EMPLOYEES.filter(e => e.role === 'field' || e.role === 'upazila')
const officerFor = (farm: Farm) => fieldOfficers.find(e => e.station.upazila === farm.location.upazila) ?? fieldOfficers.find(e => e.station.district === farm.location.district) ?? pick(fieldOfficers)
const speciesOf = (t: FarmType) => t === 'Fish' ? 'Fish' : t === 'Poultry' ? 'Poultry' : t === 'Duck' ? 'Duck' : t === 'Goat/Sheep' ? 'Goat' : 'Cattle'
const diseaseFor = (sp: string) => sp === 'Fish' ? pick(DISEASES_FISH) : sp === 'Poultry' ? pick(DISEASES_POULTRY) : sp === 'Duck' ? pick(DISEASES_DUCK) : sp === 'Goat' ? pick(DISEASES_GOAT) : pick(DISEASES_CATTLE)
const medFor = (sp: string): Medicine => {
  const opts = MEDICINES.filter(m => m.species.includes(sp))
  return opts.length ? pick(opts) : MEDICINES[0]
}
let visitSeq = 0
for (let i = 0; i < 64; i++) {
  const farm = pick(FARMS)
  const farmer = FARMERS.find(f => f.id === farm.farmerId)!
  const officer = officerFor(farm)
  const date = ago(int(0, 90))
  const sp = speciesOf(farm.type)
  const hasDisease = rnd() < 0.55
  const disease = hasDisease ? diseaseFor(sp) : undefined
  const count = farm.type === 'Fish' ? int(500, 5000) : farm.animalCount || int(5, 40)
  const sick = hasDisease ? int(1, Math.max(1, Math.floor(count * (sp === 'Fish' ? 0.04 : sp === 'Poultry' ? 0.08 : 0.25)))) : 0
  const dead = hasDisease ? int(0, Math.max(0, Math.floor(sick * 0.2))) : 0
  const med = medFor(sp)
  const storeId = officer.storeId ?? 'ST-U-CUMSADAR'
  const batch = BATCHES.filter(b => b.storeId === storeId && b.medicineId === med.id).sort((a, b) => a.expiry.localeCompare(b.expiry))[0]
  const meds = batch ? [{ medicineId: med.id, batchNo: batch.batchNo, qty: int(2, 12) }] : []
  const v: Visit = {
    id: `VIS-${String(++visitSeq).padStart(6, '0')}`, employeeId: officer.id, farmerId: farmer.id, farmId: farm.id, date,
    lat: farm.location.lat, lng: farm.location.lng, photos: int(1, 4),
    animals: [{ species: sp, count, healthy: count - sick - dead, sick, dead }],
    disease, symptoms: hasDisease ? 'জ্বর, খাবারে অনীহা, দুর্বলতা' : undefined, severity: hasDisease ? pick(['Low', 'Medium', 'High'] as const) : undefined,
    treatment: hasDisease ? `${med.name} প্রয়োগ` : undefined,
    advice: hasDisease ? 'আক্রান্ত প্রাণী আলাদা রাখুন, পরিষ্কার পানি ও ছায়ার ব্যবস্থা করুন' : 'নিয়মিত টিকা ও কৃমিনাশক প্রয়োগ করুন',
    medicines: meds, followUp: hasDisease ? addDays(date, int(5, 14)) : undefined, remarks: undefined,
    purpose: hasDisease ? 'Disease' : pick(['Routine', 'Vaccination', 'Advisory', 'Inspection'] as const), status: 'Submitted',
  }
  VISITS.push(v)
  for (const md of meds) {
    const b = batchMap.get(batchKey(storeId, md.medicineId, md.batchNo))
    if (b && b.qty >= md.qty) {
      b.qty -= md.qty
      addTxn({ type: 'Distribute', medicineId: md.medicineId, batchNo: md.batchNo, qty: md.qty, fromStoreId: storeId, farmerId: farmer.id, farmId: farm.id, disease, byEmployeeId: officer.id, date })
    }
  }
  if (hasDisease && disease) {
    DISEASE_REPORTS.push({ id: `DR-${String(DISEASE_REPORTS.length + 1).padStart(5, '0')}`, visitId: v.id, farmId: farm.id, farmerId: farmer.id, species: sp, disease, cases: sick, deaths: dead, date, district: farm.location.district, upazila: farm.location.upazila, reportedBy: officer.id })
  }
}
VISITS.sort((a, b) => b.date.localeCompare(a.date))
TXNS.sort((a, b) => b.date.localeCompare(a.date))

// ---------- Attendance / Leave / Tour ----------
export const ATTENDANCE: Attendance[] = []
export const LEAVES: Leave[] = [
  { id: 'LV-0001', employeeId: 'EMP-0008', type: 'Casual', from: ago(12), to: ago(11), reason: 'পারিবারিক প্রয়োজন', status: 'Approved' },
  { id: 'LV-0002', employeeId: 'EMP-0011', type: 'Medical', from: ago(5), to: ago(3), reason: 'অসুস্থতা', status: 'Approved' },
  { id: 'LV-0003', employeeId: 'EMP-0009', type: 'Casual', from: addDays(TODAY, 3), to: addDays(TODAY, 4), reason: 'ব্যক্তিগত', status: 'Pending' },
  { id: 'LV-0004', employeeId: 'EMP-0013', type: 'Earned', from: addDays(TODAY, 10), to: addDays(TODAY, 16), reason: 'ছুটিতে দেশের বাড়ি', status: 'Pending' },
]
export const TOURS: Tour[] = [
  { id: 'TR-0001', employeeId: 'EMP-0003', purpose: 'বিভাগীয় সমন্বয় সভা', from: ago(8), to: ago(7), destination: 'চট্টগ্রাম', status: 'Completed' },
  { id: 'TR-0002', employeeId: 'EMP-0005', purpose: 'FMD টিকাদান ক্যাম্প তদারকি', from: ago(2), to: ago(2), destination: 'দাউদকান্দি', status: 'Completed' },
  { id: 'TR-0003', employeeId: 'EMP-0004', purpose: 'মৎস্য সপ্তাহ প্রস্তুতি সভা', from: addDays(TODAY, 2), to: addDays(TODAY, 3), destination: 'ঢাকা', status: 'Planned' },
]
const onLeave = (empId: string, date: string) => LEAVES.some(l => l.employeeId === empId && l.status === 'Approved' && date >= l.from && date <= l.to)
const onTour = (empId: string, date: string) => TOURS.some(t => t.employeeId === empId && t.status !== 'Cancelled' && date >= t.from && date <= t.to)
let attSeq = 0
const DEMO_OPEN_TODAY = ['EMP-0003', 'EMP-0004', 'EMP-0005', 'EMP-0006', 'EMP-0007'] // left un-checked-in today so demo users can check in
for (let d = 30; d >= 0; d--) {
  const date = ago(d)
  const dow = new Date(date).getDay()
  if (dow === 5 || dow === 6) continue // Fri/Sat weekend
  for (const e of EMPLOYEES) {
    if (e.role === 'admin' || e.role === 'ministry') continue
    if (d === 0 && DEMO_OPEN_TODAY.includes(e.id)) continue
    let status: Attendance['status'] = 'Present'
    if (onLeave(e.id, date)) status = 'Leave'
    else if (onTour(e.id, date)) status = 'Tour'
    else if (rnd() < 0.05) status = 'Absent'
    else if (rnd() < 0.12) status = 'Late'
    const inH = status === 'Late' ? int(9, 10) : int(8, 9), inM = int(0, 59)
    const checkIn = status === 'Present' || status === 'Late' ? `${date}T${String(inH).padStart(2, '0')}:${String(inM).padStart(2, '0')}:00` : undefined
    const checkOut = checkIn ? `${date}T${String(int(16, 18)).padStart(2, '0')}:${String(int(0, 59)).padStart(2, '0')}:00` : undefined
    const mode = e.role === 'field' && rnd() < 0.6 ? 'Field' : 'Office'
    ATTENDANCE.push({ id: `AT-${String(++attSeq).padStart(6, '0')}`, employeeId: e.id, date, checkIn, checkOut, inLat: e.station.division === 'Dhaka' ? 23.8 : 23.46, inLng: e.station.division === 'Dhaka' ? 90.35 : 91.18, mode, selfie: mode === 'Field', status })
  }
}

// ---------- Trainings ----------
export const TRAININGS: Training[] = [
  { id: 'TRN-0001', title: 'Modern Fish Farming', topic: 'আধুনিক মাছ চাষ পদ্ধতি', venue: 'উপজেলা মৎস্য অফিস, কুমিল্লা সদর', district: 'Cumilla', upazila: 'Cumilla Sadar', date: ago(75), endDate: ago(73), trainerId: 'EMP-0006', seats: 30, materials: ['Training Manual (PDF)', 'Pond Management Chart'], status: 'Completed' },
  { id: 'TRN-0002', title: 'Fish Disease Control', topic: 'মাছের রোগ নিয়ন্ত্রণ ও প্রতিকার', venue: 'উপজেলা পরিষদ হলরুম, দাউদকান্দি', district: 'Cumilla', upazila: 'Daudkandi', date: ago(48), endDate: ago(47), trainerId: 'EMP-0004', seats: 40, materials: ['Disease Identification Guide'], status: 'Completed' },
  { id: 'TRN-0003', title: 'Digital Agriculture', topic: 'ডিজিটাল কৃষি ও স্মার্ট খামার', venue: 'কৃষিবিদ ইনস্টিটিউশন, ঢাকা', district: 'Dhaka', upazila: 'Dhaka', date: ago(30), endDate: ago(29), trainerId: 'EMP-0002', seats: 60, materials: ['Slides', 'Mobile App Guide'], status: 'Completed' },
  { id: 'TRN-0004', title: 'Dairy Cattle Management', topic: 'দুগ্ধ খামার ব্যবস্থাপনা ও পুষ্টি', venue: 'উপজেলা প্রাণিসম্পদ অফিস, চান্দিনা', district: 'Cumilla', upazila: 'Chandina', date: ago(14), endDate: ago(13), trainerId: 'EMP-0012', seats: 35, materials: ['Feed Formulation Sheet'], status: 'Completed' },
  { id: 'TRN-0005', title: 'Poultry Biosecurity', topic: 'পোল্ট্রি খামারে জৈব নিরাপত্তা', venue: 'উপজেলা প্রাণিসম্পদ অফিস, সাভার', district: 'Dhaka', upazila: 'Savar', date: ago(3), endDate: ago(3), trainerId: 'EMP-0014', seats: 40, materials: [], status: 'Completed' },
  { id: 'TRN-0006', title: 'FMD & Vaccination Schedule', topic: 'ক্ষুরারোগ ও টিকাদান সূচি', venue: 'উপজেলা প্রাণিসম্পদ অফিস, কুমিল্লা সদর', district: 'Cumilla', upazila: 'Cumilla Sadar', date: addDays(TODAY, 6), endDate: addDays(TODAY, 6), trainerId: 'EMP-0005', seats: 40, materials: ['Vaccination Calendar'], status: 'Open' },
  { id: 'TRN-0007', title: 'Pond Water Quality Management', topic: 'পুকুরের পানির গুণাগুণ ব্যবস্থাপনা', venue: 'উপজেলা মৎস্য অফিস, বগুড়া সদর', district: 'Bogura', upazila: 'Bogura Sadar', date: addDays(TODAY, 12), endDate: addDays(TODAY, 13), trainerId: 'EMP-0015', seats: 30, materials: [], status: 'Open' },
  { id: 'TRN-0008', title: 'Goat Rearing for Women Farmers', topic: 'নারী খামারিদের জন্য ছাগল পালন', venue: 'ইউনিয়ন পরিষদ, মুরাদনগর', district: 'Cumilla', upazila: 'Muradnagar', date: addDays(TODAY, 20), endDate: addDays(TODAY, 20), trainerId: 'EMP-0007', seats: 25, materials: [], status: 'Planned' },
]
export const ENROLLMENTS: Enrollment[] = []
let certSeq = 0
let enrSeq = 0
for (const tr of TRAININGS) {
  const pool = FARMERS.filter(f => f.location.district === tr.district)
  const others = FARMERS.filter(f => f.location.district !== tr.district)
  const n = tr.status === 'Completed' ? int(Math.floor(tr.seats * 0.5), tr.seats) : tr.status === 'Open' ? int(5, Math.floor(tr.seats * 0.6)) : int(0, 4)
  const chosen = new Set<string>()
  for (let i = 0; i < n; i++) {
    const f = rnd() < 0.8 && pool.length ? pick(pool) : pick(others)
    if (chosen.has(f.id)) continue
    chosen.add(f.id)
    const attended = tr.status === 'Completed' ? rnd() < 0.88 : false
    ENROLLMENTS.push({
      id: `ENR-${String(++enrSeq).padStart(6, '0')}`, trainingId: tr.id, farmerId: f.id, enrolledAt: addDays(tr.date, -int(3, 20)), attended,
      feedback: attended ? int(3, 5) : undefined,
      certificateNo: attended ? certNo(2026, ++certSeq) : undefined, issuedAt: attended ? tr.endDate ?? tr.date : undefined,
    })
  }
}

export const CERT_SEQ_START = certSeq
export const FARMER_SEQ_START = farmerSeq
export const FARM_COUNTERS = farmCounters
export const VISIT_SEQ_START = visitSeq
export const TXN_SEQ_START = txnSeq
export const ATT_SEQ_START = attSeq
export const ENR_SEQ_START = enrSeq
export const DISEASE_LIST = { Cattle: DISEASES_CATTLE, Goat: DISEASES_GOAT, Poultry: DISEASES_POULTRY, Fish: DISEASES_FISH, Duck: DISEASES_DUCK }
export const SUPPLIER_LIST = SUPPLIERS
export const DIVISION_NAMES = DIVISIONS.map(d => d.name)

// ---------- Marketplace ----------
type ProductTpl = { cat: ProductCategory; title: string; unit: string; price: [number, number]; qty: [number, number]; min: number; desc: string; types: FarmType[]; img: string }
const PRODUCTS: ProductTpl[] = [
  { cat: 'Fish', title: 'রুই মাছ (Rui) · ১–১.৫ কেজি', unit: 'kg', price: [260, 340], qty: [80, 600], min: 5, desc: 'তাজা পুকুরের রুই, প্রতিদিন সকালে ধরা হয়। পাইকারি ও খুচরা উভয় অর্ডার নেওয়া হয়।', types: ['Fish', 'Mixed'], img: 'Labeo rohita.JPG' },
  { cat: 'Fish', title: 'কাতলা মাছ (Katla) · ২ কেজি+', unit: 'kg', price: [300, 380], qty: [50, 400], min: 5, desc: 'বড় সাইজের কাতলা, বাজারের চেয়ে কম দামে সরাসরি খামার থেকে।', types: ['Fish', 'Mixed'], img: 'Catla fish displayed for sale at Boiddar Bazar, Sonargaon.jpg' },
  { cat: 'Fish', title: 'তেলাপিয়া (Tilapia)', unit: 'kg', price: [150, 200], qty: [100, 900], min: 10, desc: 'মনোসেক্স তেলাপিয়া, গড় ওজন ৩০০–৪০০ গ্রাম।', types: ['Fish', 'Mixed'], img: 'Vatch pla nin.jpg' },
  { cat: 'Fish', title: 'পাঙ্গাস (Pangas)', unit: 'kg', price: [120, 160], qty: [200, 1500], min: 20, desc: 'পাইকারি সরবরাহের জন্য উপযুক্ত। পরিবহন ব্যবস্থা আছে।', types: ['Fish', 'Mixed'], img: 'Basa fish - Vinh Long Market.jpg' },
  { cat: 'Fingerling', title: 'রুই-কাতলা পোনা (২–৩ ইঞ্চি)', unit: 'piece', price: [2, 4], qty: [5000, 40000], min: 500, desc: 'সরকারি হ্যাচারি থেকে সংগৃহীত মানসম্মত পোনা। উপজেলা মৎস্য অফিস কর্তৃক পরীক্ষিত।', types: ['Fish'], img: 'Back-yard summer tilapia pond, tilapia and goldfish fry.jpg' },
  { cat: 'Cattle', title: 'দেশি ষাঁড় · ~৩০০ কেজি', unit: 'head', price: [85000, 140000], qty: [1, 6], min: 1, desc: 'সুস্থ, টিকা দেওয়া দেশি ষাঁড়। FMD ও তড়কা টিকার রেকর্ড NFLMS-এ আছে।', types: ['Cattle', 'Dairy', 'Mixed'], img: 'Aftabnagar qurbanir bajar, Badda, Dhaka, Bangladesh 2022.jpg' },
  { cat: 'Cattle', title: 'শাহীওয়াল ক্রস গাভী · দুগ্ধবতী', unit: 'head', price: [95000, 160000], qty: [1, 4], min: 1, desc: 'দৈনিক ৮–১২ লিটার দুধ। কৃত্রিম প্রজনন রেকর্ডসহ।', types: ['Dairy', 'Mixed'], img: 'Sahiwal -breed cow at a dairy unit attached to Bhai Ram Singh Memorial Place, Bhaini Sahib,in district Ludhyana ,Punjab India.JPG' },
  { cat: 'Buffalo', title: 'দেশি মহিষ · ~৪০০ কেজি', unit: 'head', price: [110000, 180000], qty: [1, 4], min: 1, desc: 'চরাঞ্চলে পালিত সুস্থ মহিষ। টিকা ও কৃমিনাশকের রেকর্ড NFLMS-এ আছে। কোরবানি ও দুধের জন্য উপযুক্ত।', types: ['Cattle', 'Dairy', 'Mixed'], img: 'Buffalo, Kaloipur, chapainababagonj, Bangladesh.jpg' },
  { cat: 'Milk', title: 'খাঁটি গরুর দুধ', unit: 'litre', price: [70, 90], qty: [20, 120], min: 2, desc: 'প্রতিদিন সকাল ও বিকালে সরাসরি খামার থেকে সরবরাহ। উপজেলা সদরে হোম ডেলিভারি।', types: ['Dairy', 'Cattle', 'Mixed'], img: 'Milk loading.jpg' },
  { cat: 'Egg', title: 'লেয়ার মুরগির ডিম', unit: 'piece', price: [10, 13], qty: [500, 6000], min: 30, desc: 'তাজা বাদামি ডিম, প্রতিদিন সংগ্রহ। ট্রে (৩০টি) হিসেবে বিক্রি।', types: ['Poultry', 'Mixed'], img: 'Chicken eggs in tray.jpg' },
  { cat: 'Egg', title: 'হাঁসের ডিম', unit: 'piece', price: [14, 18], qty: [200, 2000], min: 20, desc: 'খোলা হাওরে পালিত হাঁসের ডিম।', types: ['Duck', 'Mixed'], img: 'Duck Eggs.jpg' },
  { cat: 'Poultry', title: 'ব্রয়লার মুরগি · জীবন্ত', unit: 'kg', price: [160, 200], qty: [200, 3000], min: 20, desc: 'গড় ওজন ১.৮–২.২ কেজি। জৈব নিরাপত্তা মেনে পালিত।', types: ['Poultry'], img: '20160521-RD-LSC-0992 (27716480945).jpg' },
  { cat: 'Poultry', title: 'সোনালি মুরগি', unit: 'kg', price: [260, 320], qty: [100, 1200], min: 10, desc: 'দেশি স্বাদের সোনালি মুরগি, ৬০–৭০ দিন বয়স।', types: ['Poultry', 'Mixed'], img: '2013-09-04-bushes-chicken-in-grass.jpg' },
  { cat: 'Duck', title: 'খাকি ক্যাম্পবেল হাঁস', unit: 'piece', price: [350, 480], qty: [50, 600], min: 5, desc: 'ডিম পাড়া হাঁস, ৫–৬ মাস বয়স।', types: ['Duck', 'Mixed'], img: 'A farmer with his domestic ducks..jpg' },
  { cat: 'Goat', title: 'ব্ল্যাক বেঙ্গল ছাগল', unit: 'head', price: [9000, 16000], qty: [2, 15], min: 1, desc: 'PPR টিকা দেওয়া, কৃমিমুক্ত। ওজন ১২–১৮ কেজি।', types: ['Goat/Sheep', 'Mixed'], img: '(ব্লাক বেঙ্গল) বাংলাদেশী ছাগল জাতীয় পশু.jpg' },
  { cat: 'Feed', title: 'খৈল ও ভুসি মিশ্র গো-খাদ্য', unit: 'kg', price: [38, 48], qty: [200, 2000], min: 25, desc: 'খামারে তৈরি সুষম গো-খাদ্য, ২৫ কেজির বস্তা।', types: ['Dairy', 'Cattle', 'Mixed'], img: 'Rice bran.jpg' },
]
export const LISTINGS: Listing[] = []
export const ORDERS: Order[] = []
let lstSeq = 0, ordSeq = 0
const BUYERS = ['আরিফ ট্রেডার্স', 'মা মৎস্য আড়ত', 'সুমাইয়া আক্তার', 'রহমান এন্টারপ্রাইজ', 'হোটেল আল-মদিনা', 'ফারহান হোসেন', 'নিউ ঢাকা সুইটস', 'তানিয়া বেগম', 'কুমিল্লা ডেইরি হাব', 'গ্রিন এগ্রো লিমিটেড']
const BUYER_DIST = ['Dhaka', 'Cumilla', 'Chattogram', 'Gazipur', 'Narayanganj', 'Bogura', 'Khulna']
for (const farm of FARMS) {
  if (farm.status !== 'Active' || rnd() > 0.45) continue
  const opts = PRODUCTS.filter(p => p.types.includes(farm.type))
  if (!opts.length) continue
  const n = rnd() < 0.7 ? 1 : 2
  for (let k = 0; k < n; k++) {
    const p = pick(opts)
    if (LISTINGS.some(l => l.farmId === farm.id && l.title === p.title)) continue
    const st = rnd()
    const status: Listing['status'] = st < 0.72 ? 'Active' : st < 0.86 ? 'Pending' : st < 0.93 ? 'SoldOut' : st < 0.97 ? 'Paused' : 'Rejected'
    LISTINGS.push({
      id: `LST-${String(++lstSeq).padStart(6, '0')}`, farmerId: farm.farmerId, farmId: farm.id, title: p.title, category: p.cat, description: p.desc, unit: p.unit,
      price: Math.round(int(p.price[0], p.price[1]) / (p.price[1] > 1000 ? 500 : 1)) * (p.price[1] > 1000 ? 500 : 1), qty: int(p.qty[0], p.qty[1]), minOrder: p.min,
      district: farm.location.district, upazila: farm.location.upazila, status, createdAt: ago(int(1, 60)), views: int(5, 400), image: commons(p.img),
      reviewedBy: status === 'Active' || status === 'Rejected' ? 'EMP-0005' : undefined, reviewNote: status === 'Rejected' ? 'খামারের নিবন্ধন Pending — অনুমোদনের পর পুনরায় জমা দিন' : undefined,
    })
  }
}
for (let i = 0; i < 26; i++) {
  const l = pick(LISTINGS.filter(x => x.status === 'Active' || x.status === 'SoldOut'))
  if (!l) break
  const qty = Math.max(l.minOrder, Math.min(l.qty, l.minOrder * int(1, 6)))
  const placedAt = ago(int(0, 40))
  const s = rnd()
  const status: Order['status'] = s < 0.15 ? 'Placed' : s < 0.3 ? 'Confirmed' : s < 0.45 ? 'Shipped' : s < 0.92 ? 'Delivered' : 'Cancelled'
  ORDERS.push({
    id: `ORD-${String(++ordSeq).padStart(6, '0')}`, farmerId: l.farmerId, items: [{ listingId: l.id, title: l.title, unit: l.unit, qty, price: l.price }],
    buyer: { name: pick(BUYERS), mobile: `018${int(10000000, 99999999)}`, address: `${pick(VILLAGES)}, ${pick(UNIONS)}`, district: pick(BUYER_DIST) },
    total: qty * l.price, status, payment: pick(['COD', 'bKash', 'Nagad'] as const), placedAt, updatedAt: status === 'Placed' ? placedAt : addDays(placedAt, int(0, 4)),
  })
}
ORDERS.sort((a, b) => b.placedAt.localeCompare(a.placedAt))
LISTINGS.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
export const LST_SEQ_START = lstSeq
export const ORD_SEQ_START = ordSeq
