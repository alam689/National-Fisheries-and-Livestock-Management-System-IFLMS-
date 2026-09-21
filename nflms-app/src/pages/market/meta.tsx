import { useState } from 'react'
import { Fish, Beef, Egg, Milk, Bird, Wheat, Package, Sprout, Drumstick } from 'lucide-react'
import type { ProductCategory } from '../../types'
import { COMMONS_THUMBS } from './commonsUrls'

export const CATS: { key: ProductCategory; bn: string; en: string; icon: React.ReactNode; bg: string; fg: string; emoji: string; tw: string }[] = [
  { key: 'Fish', bn: 'মাছ', en: 'Fish', icon: <Fish size={18} />, bg: 'bg-sky-100', fg: 'text-sky-700', emoji: '🐟', tw: '1f41f' },
  { key: 'Fingerling', bn: 'পোনা', en: 'Fingerlings', icon: <Sprout size={18} />, bg: 'bg-teal-100', fg: 'text-teal-700', emoji: '🐠', tw: '1f420' },
  { key: 'Cattle', bn: 'গরু', en: 'Cattle', icon: <Beef size={18} />, bg: 'bg-amber-100', fg: 'text-amber-700', emoji: '🐄', tw: '1f404' },
  { key: 'Buffalo', bn: 'মহিষ', en: 'Buffalo', icon: <Beef size={18} />, bg: 'bg-stone-200', fg: 'text-stone-700', emoji: '🐃', tw: '1f403' },
  { key: 'Goat', bn: 'ছাগল / ভেড়া', en: 'Goat / Sheep', icon: <Beef size={18} />, bg: 'bg-orange-100', fg: 'text-orange-700', emoji: '🐐', tw: '1f410' },
  { key: 'Milk', bn: 'দুধ', en: 'Milk', icon: <Milk size={18} />, bg: 'bg-slate-100', fg: 'text-slate-700', emoji: '🥛', tw: '1f95b' },
  { key: 'Egg', bn: 'ডিম', en: 'Eggs', icon: <Egg size={18} />, bg: 'bg-yellow-100', fg: 'text-yellow-700', emoji: '🥚', tw: '1f95a' },
  { key: 'Poultry', bn: 'মুরগি', en: 'Poultry', icon: <Drumstick size={18} />, bg: 'bg-rose-100', fg: 'text-rose-700', emoji: '🐔', tw: '1f414' },
  { key: 'Duck', bn: 'হাঁস', en: 'Duck', icon: <Bird size={18} />, bg: 'bg-emerald-100', fg: 'text-emerald-700', emoji: '🦆', tw: '1f986' },
  { key: 'Feed', bn: 'খাদ্য ও উপকরণ', en: 'Feed & Inputs', icon: <Wheat size={18} />, bg: 'bg-lime-100', fg: 'text-lime-700', emoji: '🌾', tw: '1f33e' },
  { key: 'Other', bn: 'অন্যান্য', en: 'Other', icon: <Package size={18} />, bg: 'bg-violet-100', fg: 'text-violet-700', emoji: '📦', tw: '1f4e6' },
]
export const catOf = (k: ProductCategory) => CATS.find(c => c.key === k) ?? CATS[CATS.length - 1]

/** Illustrated category icon (Twemoji, CC-BY 4.0) with native-emoji fallback. */
export function CatIcon({ cat, size = 40, className }: { cat: ProductCategory; size?: number; className?: string }) {
  const c = catOf(cat)
  const [err, setErr] = useState(false)
  if (err) return <span className={className} style={{ fontSize: size * 0.82, lineHeight: 1 }} role="img" aria-label={c.en}>{c.emoji}</span>
  return <img src={`https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${c.tw}.svg`} alt={c.en} width={size} height={size} draggable={false} onError={() => setErr(true)} className={className} style={{ width: size, height: size }} />
}
export const UNIT_BN: Record<string, string> = { kg: 'কেজি', piece: 'পিস', litre: 'লিটার', head: 'টি' }
export const unitLabel = (u: string, lang: 'bn' | 'en') => (lang === 'bn' ? UNIT_BN[u] ?? u : u)
export const taka = (n: number, lang: 'bn' | 'en') => `৳${new Intl.NumberFormat('en-IN').format(n).replace(/[0-9]/g, d => (lang === 'bn' ? '০১২৩৪৫৬৭৮৯'[Number(d)] : d))}`
/** Wikimedia Commons file → direct image URL (server-side resized). */
export const commons = (file: string, width: 640 | 1600 = 640) => {
  const name = file.replace(/^File:/, '')
  const direct = COMMONS_THUMBS[name]?.[width]
  return direct ?? `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(name)}?width=${width}`
}
export const isCommons = (url?: string) => !!url && (url.includes('commons.wikimedia.org') || url.includes('upload.wikimedia.org'))
export const CAT_IMAGE: Record<ProductCategory, string> = {
  Fish: commons('Labeo rohita.JPG'), Fingerling: commons('Back-yard summer tilapia pond, tilapia and goldfish fry.jpg'), Cattle: commons('Aftabnagar qurbanir bajar, Badda, Dhaka, Bangladesh 2022.jpg'), Buffalo: commons('Buffalo, Kaloipur, chapainababagonj, Bangladesh.jpg'),
  Goat: commons('(ব্লাক বেঙ্গল) বাংলাদেশী ছাগল জাতীয় পশু.jpg'), Milk: commons('Milk loading.jpg'), Egg: commons('Chicken eggs in tray.jpg'), Poultry: commons('2013-09-04-bushes-chicken-in-grass.jpg'),
  Duck: commons('A farmer with his domestic ducks..jpg'), Feed: commons('Rice bran.jpg'), Other: commons('Bangladeshi Fish04.jpg'),
}
export const listingImage = (l: { image?: string; category: ProductCategory }) => l.image || CAT_IMAGE[l.category]
export const ORDER_STEPS: { k: string; bn: string; en: string }[] = [
  { k: 'Placed', bn: 'অর্ডার হয়েছে', en: 'Placed' }, { k: 'Confirmed', bn: 'নিশ্চিত', en: 'Confirmed' }, { k: 'Shipped', bn: 'পাঠানো হয়েছে', en: 'Shipped' }, { k: 'Delivered', bn: 'ডেলিভারি সম্পন্ন', en: 'Delivered' },
]
