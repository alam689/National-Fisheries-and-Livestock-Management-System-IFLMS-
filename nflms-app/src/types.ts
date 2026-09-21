export type Lang = 'bn' | 'en'

export type FarmType = 'Fish' | 'Cattle' | 'Dairy' | 'Poultry' | 'Duck' | 'Goat/Sheep' | 'Mixed'
export type FarmStatus = 'Active' | 'Pending' | 'Suspended' | 'Closed'

export interface Location {
  division: string
  district: string
  upazila: string
  union?: string
  village?: string
  lat?: number
  lng?: number
}

export interface Farmer {
  id: string // FMR-2026-00123456
  name: string
  nid: string
  mobile: string
  fatherName?: string
  gender: 'M' | 'F' | 'O'
  dob?: string
  location: Location
  registeredAt: string
  status: 'Active' | 'Inactive'
}

export interface Farm {
  id: string // FAR-13-456789
  farmerId: string
  name: string
  type: FarmType
  size: number
  sizeUnit: 'decimal' | 'acre' | 'sqft'
  capacity: number
  capacityUnit: string
  animalCount: number
  pondCount?: number
  location: Location
  registeredAt: string
  status: FarmStatus
  documents: string[]
}

export type StoreLevel = 'Central' | 'District' | 'Upazila' | 'Field'
export interface Store {
  id: string
  name: string
  level: StoreLevel
  district?: string
  upazila?: string
}

export type MedicineCategory = 'Antibiotic' | 'Vaccine' | 'Anthelmintic' | 'Vitamin' | 'Antiseptic' | 'Aqua Chemical' | 'Other'
export interface Medicine {
  id: string
  name: string
  category: MedicineCategory
  unit: string
  species: string[]
  minStock: number
}

export interface Batch {
  id: string
  medicineId: string
  batchNo: string
  expiry: string
  supplier: string
  storeId: string
  qty: number
  receivedAt: string
}

export type TxnType = 'Receive' | 'Transfer' | 'Distribute' | 'Adjust'
export interface StockTxn {
  id: string
  type: TxnType
  medicineId: string
  batchNo: string
  qty: number
  fromStoreId?: string
  toStoreId?: string
  farmerId?: string
  farmId?: string
  disease?: string
  byEmployeeId: string
  date: string
  note?: string
}

export type Designation = 'ULO' | 'UFO' | 'VS' | 'FA' | 'AI Tech' | 'DLO' | 'DFO' | 'Admin' | 'VFA' | 'LEO' | 'Director'
export interface Employee {
  id: string
  name: string
  designation: Designation
  department: 'DLS' | 'DoF' | 'MoFL'
  mobile: string
  email: string
  station: Location
  role: 'admin' | 'ministry' | 'district' | 'upazila' | 'field'
  storeId?: string
  active: boolean
}

export interface Attendance {
  id: string
  employeeId: string
  date: string
  checkIn?: string
  checkOut?: string
  inLat?: number
  inLng?: number
  outLat?: number
  outLng?: number
  mode: 'Office' | 'Field'
  selfie?: boolean
  status: 'Present' | 'Late' | 'Absent' | 'Leave' | 'Tour'
}

export interface Leave {
  id: string
  employeeId: string
  type: 'Casual' | 'Earned' | 'Medical' | 'Other'
  from: string
  to: string
  reason: string
  status: 'Pending' | 'Approved' | 'Rejected'
}

export interface Tour {
  id: string
  employeeId: string
  purpose: string
  from: string
  to: string
  destination: string
  status: 'Planned' | 'Ongoing' | 'Completed' | 'Cancelled'
}

export interface VisitAnimal { species: string; count: number; healthy: number; sick: number; dead: number }
export interface VisitMedicine { medicineId: string; batchNo: string; qty: number }

export interface Visit {
  id: string
  employeeId: string
  farmerId: string
  farmId: string
  date: string
  lat?: number
  lng?: number
  photos: number
  animals: VisitAnimal[]
  disease?: string
  symptoms?: string
  severity?: 'Low' | 'Medium' | 'High'
  treatment?: string
  advice?: string
  medicines: VisitMedicine[]
  followUp?: string
  remarks?: string
  purpose: 'Routine' | 'Disease' | 'Vaccination' | 'Advisory' | 'Inspection'
  status: 'Submitted' | 'Draft'
}

export interface Training {
  id: string
  title: string
  topic: string
  venue: string
  district: string
  upazila: string
  date: string
  endDate?: string
  trainerId: string
  seats: number
  materials: string[]
  status: 'Planned' | 'Open' | 'Ongoing' | 'Completed' | 'Cancelled'
}

export interface Enrollment {
  id: string
  trainingId: string
  farmerId: string
  enrolledAt: string
  attended: boolean
  feedback?: number
  certificateNo?: string
  issuedAt?: string
}

export interface DiseaseReport {
  id: string
  visitId?: string
  farmId: string
  farmerId: string
  species: string
  disease: string
  cases: number
  deaths: number
  date: string
  district: string
  upazila: string
  reportedBy: string
}

export interface Session {
  employeeId: string
  workspace: 'DLS' | 'DoF' | 'MoFL'
  loginAt: string
}

// ---------- Marketplace ----------
export type ProductCategory = 'Fish' | 'Fingerling' | 'Cattle' | 'Buffalo' | 'Goat' | 'Milk' | 'Egg' | 'Poultry' | 'Duck' | 'Feed' | 'Other'
export type ListingStatus = 'Pending' | 'Active' | 'Paused' | 'SoldOut' | 'Rejected'
export interface Listing {
  id: string // LST-000001
  farmerId: string
  farmId?: string
  title: string
  category: ProductCategory
  description: string
  unit: string // kg, piece, litre, head
  price: number // BDT per unit
  qty: number // available
  minOrder: number
  district: string
  upazila: string
  status: ListingStatus
  createdAt: string
  views: number
  reviewedBy?: string
  reviewNote?: string
  image?: string // photo URL (Wikimedia Commons file or any https image)
}
export type OrderStatus = 'Placed' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled'
export interface OrderItem { listingId: string; title: string; unit: string; qty: number; price: number }
export interface Order {
  id: string // ORD-000001
  farmerId: string // seller
  items: OrderItem[]
  buyer: { name: string; mobile: string; address: string; district: string }
  total: number
  status: OrderStatus
  payment: 'COD' | 'bKash' | 'Nagad'
  placedAt: string
  updatedAt: string
  note?: string
}
