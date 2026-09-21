import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartLine { listingId: string; qty: number }
interface CartState {
  lines: CartLine[]
  add: (listingId: string, qty: number) => void
  setQty: (listingId: string, qty: number) => void
  remove: (listingId: string) => void
  clear: () => void
}
export const useCart = create<CartState>()(
  persist(
    set => ({
      lines: [],
      add: (listingId, qty) => set(s => (s.lines.some(l => l.listingId === listingId) ? { lines: s.lines.map(l => (l.listingId === listingId ? { ...l, qty: l.qty + qty } : l)) } : { lines: [...s.lines, { listingId, qty }] })),
      setQty: (listingId, qty) => set(s => ({ lines: s.lines.map(l => (l.listingId === listingId ? { ...l, qty } : l)) })),
      remove: listingId => set(s => ({ lines: s.lines.filter(l => l.listingId !== listingId) })),
      clear: () => set({ lines: [] }),
    }),
    { name: 'nflms-cart' },
  ),
)

/** Farmer self-service session for the public portal (verified by Farmer ID + mobile) */
interface FarmerSession { farmerId: string | null; signIn: (id: string) => void; signOut: () => void }
export const useFarmerSession = create<FarmerSession>()(
  persist(set => ({ farmerId: null, signIn: farmerId => set({ farmerId }), signOut: () => set({ farmerId: null }) }), { name: 'nflms-farmer' }),
)
