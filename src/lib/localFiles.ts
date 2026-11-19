const DB_NAME = 'supplierFiles'
const STORE = 'files'
const DB_VERSION = 1

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'key' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export interface LocalFileMeta {
  id: string
  name: string
  size: number
  type: string
  uploadedAt: number
}

export async function saveLocalFile(supplierId: string, file: File): Promise<LocalFileMeta> {
  const db = await openDB()
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const uploadedAt = Date.now()
  const buffer = await file.arrayBuffer()
  const record = { key: `${supplierId}/${id}`, supplierId, id, name: file.name, size: file.size, type: file.type, uploadedAt, data: buffer }
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(record)
    tx.oncomplete = () => resolve({ id, name: file.name, size: file.size, type: file.type, uploadedAt })
    tx.onerror = () => reject(tx.error)
  })
}

export async function listLocalFiles(supplierId: string): Promise<LocalFileMeta[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).getAll()
    req.onsuccess = () => {
      const all = (req.result || []) as Array<{ supplierId: string; id: string; name: string; size: number; type: string; uploadedAt: number }>
      resolve(all.filter((r) => r.supplierId === supplierId).map((r) => ({ id: r.id, name: r.name, size: r.size, type: r.type, uploadedAt: r.uploadedAt })))
    }
    req.onerror = () => reject(req.error)
  })
}

export async function getLocalFileData(supplierId: string, fileId: string): Promise<ArrayBuffer | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).get(`${supplierId}/${fileId}`)
    req.onsuccess = () => resolve(req.result ? (req.result as { data: ArrayBuffer }).data : null)
    req.onerror = () => reject(req.error)
  })
}

export async function deleteLocalFile(supplierId: string, fileId: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(`${supplierId}/${fileId}`)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function migrateLocalFiles(fromId: string, toId: string): Promise<void> {
  if (fromId === toId) return
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).getAll()
    req.onsuccess = () => {
      const all = (req.result || []) as Array<{ key: string; supplierId: string; id: string; name: string; size: number; type: string; uploadedAt: number; data: ArrayBuffer }>
      const mine = all.filter((r) => r.supplierId === fromId)
      if (!mine.length) { resolve(); return }
      const wtx = db.transaction(STORE, 'readwrite')
      const store = wtx.objectStore(STORE)
      for (const r of mine) {
        store.put({ ...r, key: `${toId}/${r.id}`, supplierId: toId })
        store.delete(`${fromId}/${r.id}`)
      }
      wtx.oncomplete = () => resolve()
      wtx.onerror = () => reject(wtx.error)
    }
    req.onerror = () => reject(req.error)
  })
}