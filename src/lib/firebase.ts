import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
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

export async function loadCloud(uid: string): Promise<CloudData | null> {
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return null
  const d = snap.data() as Partial<CloudData>
  if (!d || !Array.isArray(d.products)) return null
  const products = d.products.filter((p) => p && typeof p.name === 'string')
  const quotes = (Array.isArray(d.quotes) ? d.quotes : []).filter((r) => r && Array.isArray(r.items))
  const settings = (d.settings && typeof d.settings === 'object' ? d.settings : {}) as Settings
  return clean({ products, quotes, settings }) as CloudData
}

export async function saveCloud(uid: string, data: CloudData): Promise<void> {
  await setDoc(doc(db, 'users', uid), { ...clean(data), updatedAt: serverTimestamp() }, { merge: true })
}
