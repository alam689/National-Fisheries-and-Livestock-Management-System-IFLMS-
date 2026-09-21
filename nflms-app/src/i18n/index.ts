import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Lang } from '../types'

const dict = {
  // brand
  appName: ['NFLMS', 'NFLMS'],
  appFull: ['ন্যাশনাল ফিশারিজ ও লাইভস্টক ম্যানেজমেন্ট সিস্টেম', 'National Fisheries & Livestock Management System'],
  ministry: ['মৎস্য ও প্রাণিসম্পদ মন্ত্রণালয়', 'Ministry of Fisheries and Livestock'],
  govt: ['গণপ্রজাতন্ত্রী বাংলাদেশ সরকার', "Government of the People's Republic of Bangladesh"],
  // nav
  dashboard: ['ড্যাশবোর্ড', 'Dashboard'],
  registry: ['নিবন্ধন', 'Registry'],
  farmers: ['খামারি', 'Farmers'],
  farms: ['খামার', 'Farms'],
  medicine: ['ঔষধ ও ভ্যাকসিন', 'Medicine & Vaccine'],
  inventory: ['মজুদ', 'Inventory'],
  receive: ['গ্রহণ', 'Receive'],
  distribute: ['বিতরণ', 'Distribute'],
  transfer: ['হস্তান্তর', 'Transfer'],
  batches: ['ব্যাচ ও মেয়াদ', 'Batch & Expiry'],
  ledger: ['লেনদেন খাতা', 'Stock Ledger'],
  traceability: ['ট্রেসেবিলিটি', 'Traceability'],
  fieldForce: ['মাঠ কর্মী', 'Field Force'],
  attendance: ['উপস্থিতি', 'Attendance'],
  leave: ['ছুটি', 'Leave'],
  tour: ['সরকারি সফর', 'Official Tour'],
  employees: ['কর্মকর্তা ও কর্মচারী', 'Employees'],
  monitoring: ['মনিটরিং', 'Monitoring'],
  training: ['প্রশিক্ষণ', 'Training'],
  trainings: ['প্রশিক্ষণসমূহ', 'Trainings'],
  certificates: ['সনদ', 'Certificates'],
  visits: ['খামার পরিদর্শন', 'Field Visits'],
  newVisit: ['নতুন পরিদর্শন', 'New Visit'],
  disease: ['রোগ নজরদারি', 'Disease Surveillance'],
  mis: ['জাতীয় MIS', 'National MIS'],
  marketplace: ['খামারি বাজার', 'Marketplace'],
  marketAdmin: ['বাজার ব্যবস্থাপনা', 'Market Management'],
  publicPortal: ['পাবলিক পোর্টাল', 'Public Portal'],
  settings: ['সেটিংস', 'Settings'],
  logout: ['লগআউট', 'Sign out'],
  // common
  search: ['খুঁজুন', 'Search'],
  add: ['যোগ করুন', 'Add'],
  save: ['সংরক্ষণ', 'Save'],
  cancel: ['বাতিল', 'Cancel'],
  edit: ['সম্পাদনা', 'Edit'],
  delete: ['মুছুন', 'Delete'],
  view: ['দেখুন', 'View'],
  back: ['ফিরে যান', 'Back'],
  next: ['পরবর্তী', 'Next'],
  prev: ['পূর্ববর্তী', 'Previous'],
  submit: ['জমা দিন', 'Submit'],
  status: ['অবস্থা', 'Status'],
  date: ['তারিখ', 'Date'],
  name: ['নাম', 'Name'],
  mobile: ['মোবাইল', 'Mobile'],
  nid: ['জাতীয় পরিচয়পত্র (NID)', 'NID'],
  division: ['বিভাগ', 'Division'],
  district: ['জেলা', 'District'],
  upazila: ['উপজেলা', 'Upazila'],
  union: ['ইউনিয়ন', 'Union'],
  village: ['গ্রাম', 'Village'],
  gps: ['GPS অবস্থান', 'GPS Location'],
  all: ['সকল', 'All'],
  total: ['মোট', 'Total'],
  actions: ['কার্যক্রম', 'Actions'],
  noData: ['কোনো তথ্য পাওয়া যায়নি', 'No records found'],
  required: ['আবশ্যক', 'Required'],
  qty: ['পরিমাণ', 'Quantity'],
  type: ['ধরন', 'Type'],
  farmType: ['খামারের ধরন', 'Farm Type'],
  // registry
  farmerReg: ['খামারি নিবন্ধন', 'Farmer Registration'],
  farmReg: ['খামার নিবন্ধন', 'Farm Registration'],
  newFarmer: ['নতুন খামারি', 'New Farmer'],
  newFarm: ['নতুন খামার', 'New Farm'],
  farmerId: ['ডিজিটাল খামারি আইডি', 'Digital Farmer ID'],
  farmId: ['ইউনিক ফার্ম আইডি', 'Unique Farm ID'],
  farmerProfile: ['খামারির প্রোফাইল', 'Farmer Profile'],
  // medicine
  currentStock: ['বর্তমান মজুদ', 'Current Stock'],
  minStock: ['ন্যূনতম মজুদ', 'Minimum Stock'],
  lowStock: ['ঘাটতি', 'Low Stock'],
  expiringSoon: ['মেয়াদ শেষ হচ্ছে', 'Expiring Soon'],
  expired: ['মেয়াদোত্তীর্ণ', 'Expired'],
  batchNo: ['ব্যাচ নং', 'Batch No.'],
  expiry: ['মেয়াদ', 'Expiry'],
  supplier: ['সরবরাহকারী', 'Supplier'],
  store: ['স্টোর', 'Store'],
  fefo: ['FEFO — আগে মেয়াদ শেষ, আগে বিতরণ', 'FEFO — First Expiry, First Out'],
  // field
  checkIn: ['চেক ইন', 'Check In'],
  checkOut: ['চেক আউট', 'Check Out'],
  present: ['উপস্থিত', 'Present'],
  absent: ['অনুপস্থিত', 'Absent'],
  late: ['বিলম্ব', 'Late'],
  onLeave: ['ছুটি', 'On Leave'],
  onTour: ['সরকারি সফর', 'On Tour'],
  fieldVisit: ['মাঠ পরিদর্শন', 'Field Visit'],
  // dashboard
  regFarmers: ['নিবন্ধিত খামারি', 'Registered Farmers'],
  regFarms: ['নিবন্ধিত খামার', 'Registered Farms'],
  fishFarms: ['মৎস্য খামার', 'Fish Farms'],
  cattleDairy: ['গবাদিপশু ও ডেইরি খামার', 'Cattle & Dairy Farms'],
  poultryFarms: ['পোল্ট্রি খামার', 'Poultry Farms'],
  activeOfficers: ['কর্মরত কর্মকর্তা', 'Active Officers'],
  medDistributed: ['ঔষধ ও ভ্যাকসিন বিতরণ', 'Medicine & Vaccine Distributed'],
  diseaseCases30: ['রোগের ঘটনা · গত ৩০ দিন', 'Disease Cases · Last 30 Days'],
  trainingsDone: ['সম্পন্ন প্রশিক্ষণ', 'Trainings Completed'],
  drillHint: ['প্রতিটি সংখ্যা থেকে drill-down — বিভাগ → জেলা → উপজেলা', 'Drill down from every number — Division → District → Upazila'],
} as const

export type TKey = keyof typeof dict

interface LangState {
  lang: Lang
  setLang: (l: Lang) => void
}

export const useLang = create<LangState>()(
  persist(set => ({ lang: 'bn', setLang: lang => set({ lang }) }), { name: 'nflms-lang' }),
)

export const useT = () => {
  const lang = useLang(s => s.lang)
  const t = (k: TKey) => dict[k][lang === 'bn' ? 0 : 1]
  return { t, lang }
}
