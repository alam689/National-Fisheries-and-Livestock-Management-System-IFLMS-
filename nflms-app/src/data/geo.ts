export interface Upazila { name: string; bn: string }
export interface District { name: string; bn: string; upazilas: Upazila[] }
export interface Division { name: string; bn: string; districts: District[] }

const u = (name: string, bn: string): Upazila => ({ name, bn })

export const DIVISIONS: Division[] = [
  {
    name: 'Dhaka', bn: 'ঢাকা', districts: [
      { name: 'Dhaka', bn: 'ঢাকা', upazilas: [u('Savar', 'সাভার'), u('Dhamrai', 'ধামরাই'), u('Keraniganj', 'কেরানীগঞ্জ'), u('Nawabganj', 'নবাবগঞ্জ'), u('Dohar', 'দোহার')] },
      { name: 'Gazipur', bn: 'গাজীপুর', upazilas: [u('Gazipur Sadar', 'গাজীপুর সদর'), u('Kaliakair', 'কালিয়াকৈর'), u('Kapasia', 'কাপাসিয়া'), u('Sreepur', 'শ্রীপুর'), u('Kaliganj', 'কালীগঞ্জ')] },
      { name: 'Manikganj', bn: 'মানিকগঞ্জ', upazilas: [u('Manikganj Sadar', 'মানিকগঞ্জ সদর'), u('Singair', 'সিঙ্গাইর'), u('Saturia', 'সাটুরিয়া'), u('Ghior', 'ঘিওর')] },
      { name: 'Tangail', bn: 'টাঙ্গাইল', upazilas: [u('Tangail Sadar', 'টাঙ্গাইল সদর'), u('Mirzapur', 'মির্জাপুর'), u('Kalihati', 'কালিহাতী'), u('Madhupur', 'মধুপুর')] },
    ],
  },
  {
    name: 'Chattogram', bn: 'চট্টগ্রাম', districts: [
      { name: 'Cumilla', bn: 'কুমিল্লা', upazilas: [u('Cumilla Sadar', 'কুমিল্লা সদর'), u('Daudkandi', 'দাউদকান্দি'), u('Chandina', 'চান্দিনা'), u('Laksam', 'লাকসাম'), u('Muradnagar', 'মুরাদনগর'), u('Burichang', 'বুড়িচং')] },
      { name: 'Chattogram', bn: 'চট্টগ্রাম', upazilas: [u('Patiya', 'পটিয়া'), u('Anwara', 'আনোয়ারা'), u('Mirsharai', 'মীরসরাই'), u('Sitakunda', 'সীতাকুণ্ড'), u('Hathazari', 'হাটহাজারী')] },
      { name: 'Noakhali', bn: 'নোয়াখালী', upazilas: [u('Noakhali Sadar', 'নোয়াখালী সদর'), u('Begumganj', 'বেগমগঞ্জ'), u('Subarnachar', 'সুবর্ণচর'), u('Hatiya', 'হাতিয়া')] },
      { name: 'Coxs Bazar', bn: 'কক্সবাজার', upazilas: [u('Coxs Bazar Sadar', 'কক্সবাজার সদর'), u('Chakaria', 'চকরিয়া'), u('Teknaf', 'টেকনাফ'), u('Maheshkhali', 'মহেশখালী')] },
    ],
  },
  {
    name: 'Rajshahi', bn: 'রাজশাহী', districts: [
      { name: 'Rajshahi', bn: 'রাজশাহী', upazilas: [u('Paba', 'পবা'), u('Puthia', 'পুঠিয়া'), u('Godagari', 'গোদাগাড়ী'), u('Bagha', 'বাঘা')] },
      { name: 'Bogura', bn: 'বগুড়া', upazilas: [u('Bogura Sadar', 'বগুড়া সদর'), u('Sherpur', 'শেরপুর'), u('Shibganj', 'শিবগঞ্জ'), u('Dhunat', 'ধুনট')] },
      { name: 'Pabna', bn: 'পাবনা', upazilas: [u('Pabna Sadar', 'পাবনা সদর'), u('Ishwardi', 'ঈশ্বরদী'), u('Bera', 'বেড়া'), u('Sujanagar', 'সুজানগর')] },
    ],
  },
  {
    name: 'Khulna', bn: 'খুলনা', districts: [
      { name: 'Khulna', bn: 'খুলনা', upazilas: [u('Dumuria', 'ডুমুরিয়া'), u('Paikgachha', 'পাইকগাছা'), u('Koyra', 'কয়রা'), u('Batiaghata', 'বটিয়াঘাটা')] },
      { name: 'Jashore', bn: 'যশোর', upazilas: [u('Jashore Sadar', 'যশোর সদর'), u('Monirampur', 'মণিরামপুর'), u('Abhaynagar', 'অভয়নগর'), u('Keshabpur', 'কেশবপুর')] },
      { name: 'Satkhira', bn: 'সাতক্ষীরা', upazilas: [u('Satkhira Sadar', 'সাতক্ষীরা সদর'), u('Shyamnagar', 'শ্যামনগর'), u('Kaliganj', 'কালিগঞ্জ'), u('Tala', 'তালা')] },
    ],
  },
  {
    name: 'Barishal', bn: 'বরিশাল', districts: [
      { name: 'Barishal', bn: 'বরিশাল', upazilas: [u('Barishal Sadar', 'বরিশাল সদর'), u('Bakerganj', 'বাকেরগঞ্জ'), u('Babuganj', 'বাবুগঞ্জ'), u('Banaripara', 'বানারীপাড়া')] },
      { name: 'Bhola', bn: 'ভোলা', upazilas: [u('Bhola Sadar', 'ভোলা সদর'), u('Charfasson', 'চরফ্যাশন'), u('Lalmohan', 'লালমোহন')] },
    ],
  },
  {
    name: 'Sylhet', bn: 'সিলেট', districts: [
      { name: 'Sylhet', bn: 'সিলেট', upazilas: [u('Sylhet Sadar', 'সিলেট সদর'), u('Beanibazar', 'বিয়ানীবাজার'), u('Golapganj', 'গোলাপগঞ্জ')] },
      { name: 'Sunamganj', bn: 'সুনামগঞ্জ', upazilas: [u('Sunamganj Sadar', 'সুনামগঞ্জ সদর'), u('Tahirpur', 'তাহিরপুর'), u('Derai', 'দিরাই')] },
    ],
  },
  {
    name: 'Rangpur', bn: 'রংপুর', districts: [
      { name: 'Rangpur', bn: 'রংপুর', upazilas: [u('Rangpur Sadar', 'রংপুর সদর'), u('Pirganj', 'পীরগঞ্জ'), u('Mithapukur', 'মিঠাপুকুর')] },
      { name: 'Dinajpur', bn: 'দিনাজপুর', upazilas: [u('Dinajpur Sadar', 'দিনাজপুর সদর'), u('Birganj', 'বীরগঞ্জ'), u('Parbatipur', 'পার্বতীপুর')] },
    ],
  },
  {
    name: 'Mymensingh', bn: 'ময়মনসিংহ', districts: [
      { name: 'Mymensingh', bn: 'ময়মনসিংহ', upazilas: [u('Mymensingh Sadar', 'ময়মনসিংহ সদর'), u('Trishal', 'ত্রিশাল'), u('Muktagachha', 'মুক্তাগাছা'), u('Bhaluka', 'ভালুকা')] },
      { name: 'Netrokona', bn: 'নেত্রকোণা', upazilas: [u('Netrokona Sadar', 'নেত্রকোণা সদর'), u('Mohanganj', 'মোহনগঞ্জ'), u('Durgapur', 'দুর্গাপুর')] },
    ],
  },
]

export const districtsOf = (division: string) => DIVISIONS.find(d => d.name === division)?.districts ?? []
export const upazilasOf = (division: string, district: string) =>
  districtsOf(division).find(d => d.name === district)?.upazilas ?? []
export const allDistricts = () => DIVISIONS.flatMap(d => d.districts.map(x => ({ ...x, division: d.name })))
export const districtCode = (district: string) => {
  const list = allDistricts()
  const idx = list.findIndex(d => d.name === district)
  return String(10 + (idx < 0 ? 0 : idx)).padStart(2, '0')
}
export const divisionOfDistrict = (district: string) => allDistricts().find(d => d.name === district)?.division ?? ''
export const bnName = (name: string): string => {
  for (const dv of DIVISIONS) {
    if (dv.name === name) return dv.bn
    for (const ds of dv.districts) {
      if (ds.name === name) return ds.bn
      for (const up of ds.upazilas) if (up.name === name) return up.bn
    }
  }
  return name
}
