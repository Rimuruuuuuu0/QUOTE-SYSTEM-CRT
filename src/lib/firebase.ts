import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore, doc, getDoc, setDoc, serverTimestamp, onSnapshot, collection, getDocs, type Unsubscribe } from 'firebase/firestore'
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import type { Product, Quote, Settings, Supplier, SupplierProduct } from './types'

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
export const storage = getStorage(app)

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
export function subscribeShared(cb: (d: CloudData | null) => void, onError?: (err: any) => void): Unsubscribe {
  return onSnapshot(
    sharedRef(),
    (snap) => cb(snap.exists() ? valid(snap.data() as Partial<CloudData>) : null),
    (err) => onError?.(err)
  )
}

/**
 * First account to sign in after this update seeds the shared store from its
 * own data (personal cloud doc, else local). Later accounts load shared.
 * Export a backup from each account first — first-writer wins.
 *
 * Merge strategy: cloud data is loaded first, then local data is merged on top.
 * Local data wins for items that exist in both (unsaved local changes take
 * precedence). Cloud-only items are added to local. This prevents data loss
 * when refreshing before a debounced cloud save has fired.
 */
export async function ensureShared(uid: string, local: CloudData): Promise<CloudData> {
  const shared = await loadShared()
  if (!shared) {
    try {
      const snap = await getDoc(doc(db, 'users', uid))
      const personal = valid(snap.exists() ? (snap.data() as Partial<CloudData>) : undefined)
      const seed = personal || clean(local)
      await saveShared(seed as CloudData)
      return mergeCloudWithLocal(seed as CloudData, local)
    } catch {
      return clean(local) as CloudData
    }
  }
  return mergeCloudWithLocal(shared, local)
}

/** Merge cloud data with local data. Local items take precedence. Cloud-only items are added. */
function mergeCloudWithLocal(cloud: CloudData, local: CloudData): CloudData {
  const mergedProducts = [...(cloud.products || [])]
  for (const lp of (local.products || [])) {
    if (!mergedProducts.some((cp) => String(cp.id) === String(lp.id))) {
      mergedProducts.push(lp)
    }
  }
  const mergedQuotes = [...(cloud.quotes || [])]
  for (const lq of (local.quotes || [])) {
    if (!mergedQuotes.some((cq) => String(cq.id) === String(lq.id))) {
      mergedQuotes.push(lq)
    }
  }
  const mergedSettings = { ...cloud.settings, ...local.settings }
  return clean({ products: mergedProducts, quotes: mergedQuotes, settings: mergedSettings })
}

/** Per-user profile: preparedBy is stored here so each staff member has their own name. */
export async function loadUserProfile(uid: string): Promise<{ preparedBy?: string } | null> {
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return null
  return { preparedBy: snap.data().preparedBy || undefined } as { preparedBy?: string }
}

export async function saveUserProfile(uid: string, preparedBy: string): Promise<void> {
  await setDoc(doc(db, 'users', uid), { preparedBy, updatedAt: serverTimestamp() }, { merge: true })
}

export function subscribeUserProfile(uid: string, cb: (d: { preparedBy?: string } | null) => void): Unsubscribe {
  return onSnapshot(
    doc(db, 'users', uid),
    (snap) => cb(snap.exists() ? { preparedBy: snap.data().preparedBy || undefined } : null),
    () => {}
  )
}

/** ---------- Supplier Cloud Data ---------- */

const suppliersRef = collection(db, 'suppliers')

export async function loadSuppliers(): Promise<Supplier[]> {
  const snap = await getDocs(suppliersRef)
  return snap.docs.map((d) => ({ ...(d.data() as Supplier), id: d.id }))
}

export async function saveSupplier(s: Supplier): Promise<void> {
  await setDoc(doc(db, 'suppliers', s.id), { ...s, updatedAt: serverTimestamp() }, { merge: true })
}

export async function deleteSupplier(sid: string): Promise<void> {
  await setDoc(doc(db, 'suppliers', sid), { deletedAt: serverTimestamp() }, { merge: true })
}

export function subscribeSuppliers(cb: (s: Supplier[]) => void): Unsubscribe {
  return onSnapshot(
    suppliersRef,
    (snap) => cb(snap.docs.map((d) => ({ ...(d.data() as Supplier), id: d.id })))
  )
}

const supplierProductsRef = (sid: string) => collection(db, 'suppliers', sid, 'products')

export async function loadSupplierProducts(sid: string): Promise<SupplierProduct[]> {
  const snap = await getDocs(supplierRef(sid))
  return snap.docs.map((d) => ({ ...(d.data() as SupplierProduct), id: d.id }))
}

export async function saveSupplierProduct(sid: string, p: SupplierProduct): Promise<void> {
  await setDoc(doc(supplierRef(sid), p.id), { ...p, updatedAt: serverTimestamp() }, { merge: true })
}

export function subscribeSupplierProducts(sid: string, cb: (p: SupplierProduct[]) => void): Unsubscribe {
  return onSnapshot(
    supplierRef(sid),
    (snap) => cb(snap.docs.map((d) => ({ ...(d.data() as SupplierProduct), id: d.id })))
  )
}

export async function deleteSupplierProduct(sid: string, pid: string): Promise<void> {
  await setDoc(doc(supplierRef(sid), pid), { deletedAt: serverTimestamp() }, { merge: true })
}

/** Import a CSV row into supplier products. Skips header row by default. */
export function parseLoyverseCsv(text: string, sid: string): SupplierProduct[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (lines.length < 2) return []
  const head = lines[0].split(',').map((h) => h.trim().toLowerCase())
  const col = (names: string[]) => {
    for (let i = 0; i < head.length; i++) {
      if (names.some((n) => head[i] === n || head[i].startsWith(n))) return i
    }
    return -1
  }
  const iName = col(['name']) < 0 ? col(['item name', 'product']) : col(['name'])
  const iCat = col(['category'])
  const iCost = col(['cost', 'supplier cost', 'purchase price'])
  const iPrice = col(['price', 'srp', 'selling price', 'default price'])
  const iSku = col(['sku', 'item code', 'barcode'])
  const iStock = col(['stock', 'qty', 'quantity'])

  const out: SupplierProduct[] = []
  for (let r = 1; r < lines.length; r++) {
    const cells = lines[r].split(',').map((c) => c.trim().replace(/^"|"$/g, ''))
    const name = cells[iName] || ''
    if (!name) continue
    out.push({
      id: `${sid}-${name.replace(/\s+/g, '-')}-${Date.now()}`,
      supplierId: sid,
      name,
      category: iCat >= 0 ? cells[iCat] : '',
      cost: iCost >= 0 ? Number(cells[iCost]) || 0 : undefined,
      srp: iPrice >= 0 ? Number(cells[iPrice]) || 0 : undefined,
      sku: iSku >= 0 ? cells[iSku] : '',
      stock: iStock >= 0 ? Number(cells[iStock]) || 0 : undefined,
    })
  }
  return out
}

export async function importLoyverseCsvToSupplier(sid: string, text: string): Promise<SupplierProduct[]> {
  const parsed = parseLoyverseCsv(text, sid)
  for (const p of parsed) {
    await saveSupplierProduct(sid, p)
  }
  return parsed
}

function supplierRef(sid: string) {
  return collection(db, 'suppliers', sid, 'products')
}

/** ---------- Cloud Storage for Product Images ---------- */

/** Upload a product photo to Firebase Storage and return its public download URL. */
export async function uploadProductImage(file: File, productId: string | number): Promise<string> {
  if (file.size > 5 * 1024 * 1024) throw new Error('Image too large (max 5MB).')
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const r = storageRef(storage, `products/${productId}/${Date.now()}-${safeName}`)
  await uploadBytes(r, file)
  return getDownloadURL(r)
}

/** Delete a product photo from Firebase Storage by its download URL. */
export async function deleteProductImage(url: string): Promise<void> {
  try {
    const r = storageRef(storage, url)
    await deleteObject(r)
  } catch {
    // ignore; file may already be gone
  }
}
