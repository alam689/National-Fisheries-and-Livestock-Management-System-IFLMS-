import { districtCode } from '../data/geo'

/** FAR-<districtCode>-<6 digits> */
export const farmId = (district: string, n: number) => `FAR-${districtCode(district)}-${String(n).padStart(6, '0')}`
/** FMR-<year>-<8 digits> */
export const farmerId = (year: number, n: number) => `FMR-${year}-${String(n).padStart(8, '0')}`
/** CERT-<year>-<6 digits> */
export const certNo = (year: number, n: number) => `CERT-${year}-${String(n).padStart(6, '0')}`
export const pad = (n: number, w: number) => String(n).padStart(w, '0')
