import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore, doc, getDoc, setDoc, serverTimestamp, onSnapshot, type Unsubscribe } from 'firebase/firestore'
import type { Product, Quote, Settings } from './types'

const firebaseConfig = {
  apiKey: 'AIzaSyAVooE9a4b1dGNrU89zIJwItN-I-p0Q7sQ',
  authDomain: 'quote-system-crt.firebaseapp.com',
  projectId: 'quote-system-crt',
  storageBucket: 'quote-system-crt.firebasestorage.app',
  messagingSenderId: '758860039598',
  appId: '1:758860039598:web:bacaf860c600bad6de343f',
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)

export interface CloudData {
  products: Product[]
  quotes: Quote[]
  settings: Settings
}

/** Remove undefined values (Firestore rejects them). */
const clean = <T,>(v: T): T => JSON.parse(JSON.stringify(v))

const valid = (d: Partial<CloudData> | undefined): CloudData | null => {
  if (!d || !Array.isArray(d.products)) return null
  const products = d.products.filter((p) => p && typeof p.name === 'string')
  const quotes = (Array.isArray(d.quotes) ? d.quotes : []).filter((r) => r && Array.isArray(r.items))
  const settings = (d.settings && typeof d.settings === 'object' ? d.settings : {}) as Settings
  return clean({ products, quotes, settings }) as CloudData
}

/** One shared store doc — every staff account reads/writes the SAME stocks. */
const sharedRef = () => doc(db, 'shared', 'main')

export async function loadShared(): Promise<CloudData | null> {
  const snap = await getDoc(sharedRef())
  if (!snap.exists()) return null
  return valid(snap.data() as Partial<CloudData>)
}

export async function saveShared(data: CloudData): Promise<void> {
  await setDoc(sharedRef(), { ...clean(data), updatedAt: serverTimestamp() }, { merge: true })
}

/** Live updates: all signed-in accounts refresh the moment anyone saves. */
export function subscribeShared(cb: (d: CloudData | null) => void): Unsubscribe {
  return onSnapshot(
    sharedRef(),
    (snap) => cb(snap.exists() ? valid(snap.data() as Partial<CloudData>) : null),
    () => {}
  )
}

/**
 * First account to sign in after this update seeds the shared store from its
 * own data (personal cloud doc, else local). Later accounts load shared.
 * Export a backup from each account first — first-writer wins.
 */
export async function ensureShared(uid: string, local: CloudData): Promise<CloudData> {
  const shared = await loadShared()
  if (shared) return shared
  try {
    const snap = await getDoc(doc(db, 'users', uid))
    const personal = valid(snap.exists() ? (snap.data() as Partial<CloudData>) : undefined)
    const seed = personal || clean(local)
    await saveShared(seed as CloudData)
    return seed as CloudData
  } catch {
    return clean(local) as CloudData
  }
}
