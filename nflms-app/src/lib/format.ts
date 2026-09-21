const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']
export const toBn = (v: string | number) => String(v).replace(/[0-9]/g, d => BN_DIGITS[Number(d)])

export const fmtNum = (n: number, lang: 'bn' | 'en' = 'en') => {
  const s = new Intl.NumberFormat('en-IN').format(n)
  return lang === 'bn' ? toBn(s) : s
}

const BN_MONTHS = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর']
const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const fmtDate = (iso: string | undefined, lang: 'bn' | 'en' = 'en') => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  const day = d.getDate(), m = d.getMonth(), y = d.getFullYear()
  return lang === 'bn' ? `${toBn(day)} ${BN_MONTHS[m]} ${toBn(y)}` : `${day} ${EN_MONTHS[m]} ${y}`
}

export const fmtTime = (iso: string | undefined, lang: 'bn' | 'en' = 'en') => {
  if (!iso) return '—'
  const d = new Date(iso)
  const s = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  return lang === 'bn' ? toBn(s) : s
}

export const todayISO = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
export const nowISO = () => new Date().toISOString()
export const addDays = (iso: string, n: number) => {
  const d = new Date(iso); d.setDate(d.getDate() + n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
export const daysUntil = (iso: string) => Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000)
export const monthKey = (iso: string) => iso.slice(0, 7)
