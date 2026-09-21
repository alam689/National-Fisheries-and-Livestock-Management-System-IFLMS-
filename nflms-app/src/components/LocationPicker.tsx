import { DIVISIONS, districtsOf, upazilasOf } from '../data/geo'
import type { Location } from '../types'
import { Field, Select } from './ui'
import { useT } from '../i18n'

export function LocationPicker({ value, onChange, withVillage = true, withGps = false }: { value: Location; onChange: (l: Location) => void; withVillage?: boolean; withGps?: boolean }) {
  const { t, lang } = useT()
  const nm = (x: { name: string; bn: string }) => (lang === 'bn' ? x.bn : x.name)
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Field label={t('division')} required>
        <Select value={value.division} placeholder="—" onChange={v => onChange({ ...value, division: v, district: '', upazila: '' })} options={DIVISIONS.map(d => ({ value: d.name, label: nm(d) }))} />
      </Field>
      <Field label={t('district')} required>
        <Select value={value.district} placeholder="—" disabled={!value.division} onChange={v => onChange({ ...value, district: v, upazila: '' })} options={districtsOf(value.division).map(d => ({ value: d.name, label: nm(d) }))} />
      </Field>
      <Field label={t('upazila')} required>
        <Select value={value.upazila} placeholder="—" disabled={!value.district} onChange={v => onChange({ ...value, upazila: v })} options={upazilasOf(value.division, value.district).map(d => ({ value: d.name, label: nm(d) }))} />
      </Field>
      {withVillage && (
        <>
          <Field label={t('union')}><input className="input" value={value.union ?? ''} onChange={e => onChange({ ...value, union: e.target.value })} /></Field>
          <Field label={t('village')}><input className="input" value={value.village ?? ''} onChange={e => onChange({ ...value, village: e.target.value })} /></Field>
        </>
      )}
      {withGps && (
        <Field label={t('gps')} hint={lang === 'bn' ? 'অক্ষাংশ, দ্রাঘিমাংশ' : 'lat, lng'}>
          <div className="flex gap-2">
            <input className="input" type="number" step="0.0001" placeholder="23.46" value={value.lat ?? ''} onChange={e => onChange({ ...value, lat: e.target.value === '' ? undefined : Number(e.target.value) })} />
            <input className="input" type="number" step="0.0001" placeholder="91.18" value={value.lng ?? ''} onChange={e => onChange({ ...value, lng: e.target.value === '' ? undefined : Number(e.target.value) })} />
          </div>
        </Field>
      )}
    </div>
  )
}

export const emptyLocation = (): Location => ({ division: '', district: '', upazila: '', union: '', village: '' })

export function useGeo() {
  const get = () =>
    new Promise<{ lat: number; lng: number; accuracy?: number }>(resolve => {
      if (!('geolocation' in navigator)) return resolve({ lat: 23.4607, lng: 91.1809 })
      navigator.geolocation.getCurrentPosition(
        p => resolve({ lat: +p.coords.latitude.toFixed(5), lng: +p.coords.longitude.toFixed(5), accuracy: Math.round(p.coords.accuracy) }),
        () => resolve({ lat: +(23.42 + Math.random() * 0.1).toFixed(5), lng: +(91.13 + Math.random() * 0.1).toFixed(5) }),
        { timeout: 4000 },
      )
    })
  return { get }
}
