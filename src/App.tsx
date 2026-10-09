import { useMemo, useState } from 'react'
import { Plus, FileText, Package, Settings as SettingsIcon, LayoutDashboard, Printer, X, Pencil, Trash2, Save, FolderOpen, Search, Download, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input, Textarea, Select } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { importLoyverseCsv } from '@/lib/loyverse'
import { useStore, blankQuote, newQuoteNo } from '@/lib/store'
import { money, uid } from '@/lib/utils'
import { totals, type Product, type Quote, type QuoteStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

type Tab = 'dash' | 'new' | 'quotes' | 'products' | 'settings'

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'dash', label: 'Overview', icon: <LayoutDashboard size={15} /> },
  { id: 'new', label: 'New quote', icon: <Plus size={15} /> },
  { id: 'quotes', label: 'Quotes', icon: <FileText size={15} /> },
  { id: 'products', label: 'Products', icon: <Package size={15} /> },
  { id: 'settings', label: 'Settings', icon: <SettingsIcon size={15} /> },
]

const CATS = ['Processor','Motherboard','Memory','Storage','Graphics Card','Power Supply','Casing','Monitor','Peripherals','Software','Service','Other']

export default function App() {
  const { products, setProducts, quotes, setQuotes, settings, setSettings } = useStore()
  const [tab, setTab] = useState<Tab>('dash')
  const [q, setQ] = useState<Quote>(() => ({ ...blankQuote(), ...newQuoteNo(settings) }))
  const [search, setSearch] = useState('')
  const [qsearch, setQsearch] = useState('')
  const [psearch, setPsearch] = useState('')
  const [filter, setFilter] = useState<'all' | QuoteStatus>('all')
  const [view, setView] = useState<Quote | null>(null)
  const [pf, setPf] = useState<(Omit<Product, 'id'> & { id?: number | string }) | null>(null)

  const resetQuote = () => setQ({ ...blankQuote(), ...newQuoteNo(settings) })

  const matches = useMemo(() => {
    const s = search.toLowerCase()
    if (!s) return []
    return products.filter((p) => (p.name + p.category).toLowerCase().includes(s)).slice(0, 8)
  }, [search, products])

  const addItem = (p: Product) => {
    setQ((prev) => {
      const ex = prev.items.find((i) => i.pid === p.id)
      if (ex) return { ...prev, items: prev.items.map((i) => (i.pid === p.id ? { ...i, qty: i.qty + 1 } : i)) }
      return { ...prev, items: [...prev.items, { key: uid(), pid: p.id, name: p.name, qty: 1, price: p.price }] }
    })
    setSearch('')
  }

  const saveQuote = (show: boolean) => {
    if (!q.items.length) { alert('Add at least one item before saving.'); return }
    const copy = JSON.parse(JSON.stringify(q)) as Quote
    if (copy.id) {
      setQuotes((prev) => prev.map((x) => (x.id === copy.id ? copy : x)))
    } else {
      copy.id = uid()
      setQuotes((prev) => [copy, ...prev])
      setSettings((s) => ({ ...s, counter: (s.counter || 0) + 1 }))
    }
    setQ(copy)
    if (show) setView(copy)
  }

  const filteredQuotes = quotes.filter((r) => {
    const s = qsearch.toLowerCase()
    const hay = (r.no + ' ' + r.customer.name + ' ' + r.items.map((i) => i.name).join(' ')).toLowerCase()
    return (filter === 'all' || r.status === filter) && hay.includes(s)
  })

  const t = totals(q, settings.vat)
  const accepted = quotes.filter((x) => x.status === 'Accepted')
  const acceptedVal = accepted.reduce((s, x) => s + totals(x, settings.vat).total, 0)

  const saveProduct = () => {
    if (!pf || !pf.name.trim()) { alert('Enter a product name.'); return }
    if (pf.id) setProducts((prev) => prev.map((x) => (x.id === pf.id ? { ...pf, id: pf.id! } as Product : x)))
    else setProducts((prev) => [{ ...pf, id: Date.now() } as Product, ...prev])
    setPf(null)
  }

  const exportData = () => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([JSON.stringify({ products, quotes, settings }, null, 2)], { type: 'application/json' }))
    a.download = `quotation-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
  }

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    f.text().then((txt) => {
      try {
        const d = JSON.parse(txt)
        if (d.products) setProducts(d.products)
        if (d.quotes) setQuotes(d.quotes)
        if (d.settings) setSettings((s) => ({ ...s, ...d.settings }))
        alert('Backup imported.')
      } catch { alert('That file is not a valid backup.') }
    })
  }

  return (
    <div className="min-h-screen">
      <div className="flex h-1"><div className="flex-1 bg-brand-blue" /><div className="flex-1 bg-brand-red" /><div className="flex-1 bg-brand-blue" /></div>
      <header className="sticky top-0 z-20 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <img src="/logo-banner.png" alt="CHRISRANDOMTECH" className="h-10 w-auto object-contain" />
          </div>
          <nav className="flex gap-1 text-sm overflow-x-auto">
            {TABS.map((tb) => (
              <Button
                key={tb.id}
                variant={tab === tb.id ? 'default' : 'ghost'}
                size="sm"
                onClick={() => { setTab(tb.id); window.scrollTo(0, 0) }}
              >
                {tb.icon}{tb.label}
              </Button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {tab === 'dash' && (
          <section className="space-y-6">
            <div className="flex items-end justify-between flex-wrap gap-3">
              <h1 className="text-2xl font-semibold">Overview</h1>
              <Button onClick={() => { resetQuote(); setTab('new') }}><Plus size={15} /> New quote</Button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Total quotes', value: String(quotes.length) },
                { label: 'Pending (Draft + Sent)', value: String(quotes.filter((x) => ['Draft','Sent'].includes(x.status)).length) },
                { label: 'Accepted value', value: money(acceptedVal) },
                { label: 'Products', value: String(products.length) },
              ].map((s) => (
                <Card key={s.label}><CardContent><div className="text-sm text-slate-500">{s.label}</div><div className="num text-xl mt-1">{s.value}</div></CardContent></Card>
              ))}
            </div>
            <Card>
              <CardHeader>Recent quotes</CardHeader>
              {quotes.slice(0, 5).map((r) => (
                <button key={r.id} onClick={() => setView(r)} className="w-full flex justify-between px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 border-b last:border-0 border-slate-100 dark:border-slate-800">
                  <span><span className="num text-sm">{r.no}</span><span className="ml-2">{r.customer.name || 'No name'}</span></span>
                  <span className="num">{money(totals(r, settings.vat).total)}</span>
                </button>
              ))}
              {!quotes.length && <p className="px-4 py-8 text-center text-slate-500">No quotes yet. Create your first quote.</p>}
            </Card>
          </section>
        )}

        {tab === 'new' && (
          <section className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card><CardContent className="space-y-3">
                <div className="flex justify-between items-center"><CardTitle>Customer</CardTitle><span className="num text-sm text-slate-500">{q.no}</span></div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Input placeholder="Customer name" value={q.customer.name} onChange={(e) => setQ({ ...q, customer: { ...q.customer, name: e.target.value } })} />
                  <Input placeholder="Phone or email" value={q.customer.contact} onChange={(e) => setQ({ ...q, customer: { ...q.customer, contact: e.target.value } })} />
                  <Input className="sm:col-span-2" placeholder="Address" value={q.customer.address} onChange={(e) => setQ({ ...q, customer: { ...q.customer, address: e.target.value } })} />
                </div>
              </CardContent></Card>

              <Card><CardContent>
                <CardTitle>Items</CardTitle>
                <div className="relative mt-3">
                  <Input placeholder="Search products to add (e.g. RTX, SSD, Ryzen)" value={search} onChange={(e) => setSearch(e.target.value)} />
                  {!!search && (
                    <div className="absolute z-10 mt-1 w-full max-h-64 overflow-auto rounded-lg border bg-white dark:bg-slate-900 shadow-lg">
                      {matches.map((p) => (
                        <button key={p.id} onClick={() => addItem(p)} className="w-full flex justify-between px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800">
                          <span>{p.name} <span className="text-slate-500">· {p.category}</span></span>
                          <span className="num">{money(p.price)}</span>
                        </button>
                      ))}
                      <button onClick={() => { setQ({ ...q, items: [...q.items, { key: uid(), pid: null, name: search, qty: 1, price: 0 }] }); setSearch('') }} className="w-full px-3 py-2 text-left text-sm text-brand-blue border-t">
                        Add "{search}" as custom item
                      </button>
                    </div>
                  )}
                </div>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm min-w-[520px]">
                    <thead className="text-left text-slate-500"><tr><th className="py-2 font-medium">Item</th><th className="font-medium w-20">Qty</th><th className="font-medium w-32">Unit price</th><th className="font-medium w-32 text-right">Amount</th><th className="w-8" /></tr></thead>
                    <tbody>
                      {q.items.map((it, i) => (
                        <tr key={it.key} className="border-t border-slate-100 dark:border-slate-800">
                          <td className="py-2 pr-2"><Input value={it.name} onChange={(e) => setQ({ ...q, items: q.items.map((x, xi) => xi === i ? { ...x, name: e.target.value } : x) })} /></td>
                          <td className="pr-2"><Input type="number" min={1} className="num" value={it.qty} onChange={(e) => setQ({ ...q, items: q.items.map((x, xi) => xi === i ? { ...x, qty: Number(e.target.value) } : x) })} /></td>
                          <td className="pr-2"><Input type="number" min={0} className="num" value={it.price} onChange={(e) => setQ({ ...q, items: q.items.map((x, xi) => xi === i ? { ...x, price: Number(e.target.value) } : x) })} /></td>
                          <td className="num text-right">{money(it.qty * it.price)}</td>
                          <td><button className="text-slate-400 hover:text-red-600 px-2" onClick={() => setQ({ ...q, items: q.items.filter((_, xi) => xi !== i) })}><X size={14} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!q.items.length && <p className="py-8 text-center text-slate-500">No items yet. Search above to add products.</p>}
                </div>
              </CardContent></Card>

              <Card><CardContent className="space-y-3">
                <CardTitle>Notes and terms</CardTitle>
                <Textarea rows={3} value={q.notes} onChange={(e) => setQ({ ...q, notes: e.target.value })} />
              </CardContent></Card>
            </div>

            <aside className="space-y-4 lg:sticky lg:top-20 self-start">
              <Card><CardContent className="space-y-3">
                <CardTitle>Summary</CardTitle>
                <div className="flex justify-between text-sm"><span>Subtotal</span><span className="num">{money(t.sub)}</span></div>
                <div className="flex gap-2 items-center text-sm">
                  <span className="flex-1">Discount</span>
                  <Input type="number" min={0} className="num !w-24" value={q.discount} onChange={(e) => setQ({ ...q, discount: Number(e.target.value) })} />
                  <Select className="!w-16" value={q.discountType} onChange={(e) => setQ({ ...q, discountType: e.target.value as '%' | '₱' })}><option value="%">%</option><option value="₱">₱</option></Select>
                </div>
                <div className="flex justify-between text-sm"><span>VAT ({settings.vat}%)</span><span className="num">{money(t.vat)}</span></div>
                <div className="flex justify-between pt-3 border-t text-lg font-semibold"><span>Total</span><span className="num">{money(t.total)}</span></div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Button className="col-span-2" onClick={() => saveQuote(true)}><Save size={15} /> Save quotation</Button>
                  <Button variant="outline" onClick={() => saveQuote(false)}>Save draft</Button>
                  <Button variant="outline" onClick={() => setTab('quotes')}><FolderOpen size={15} /> Load</Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="flex-1" onClick={resetQuote}>Clear</Button>
                </div>
              </CardContent></Card>
            </aside>
          </section>
        )}

        {tab === 'quotes' && (
          <section className="space-y-4">
            <div className="flex flex-wrap gap-3 justify-between items-center">
              <h1 className="text-2xl font-semibold">Saved quotations</h1>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => document.getElementById('load-quote-file')?.click()}><Upload size={13} /> Load from file</Button>
                <input id="load-quote-file" type="file" accept=".json" className="hidden" onChange={(e) => {
                  const f = e.target.files?.[0]; if (!f) return
                  f.text().then((txt) => {
                    try {
                      const d = JSON.parse(txt)
                      const list = Array.isArray(d) ? d : d.quotes || [d]
                      const fixed = list.map((r: Quote) => ({ ...r, id: r.id || uid() }))
                      setQuotes((prev) => [...fixed, ...prev]); alert(`Loaded ${fixed.length} quotation(s).`)
                    } catch { alert('Not a valid quotation file.') }
                  }); e.target.value = ''
                }} />
              </div>
            </div>
            <Card><CardContent className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input className="pl-9" placeholder="Search quotation — customer, number, item…" value={qsearch} onChange={(e) => setQsearch(e.target.value)} />
              </div>
              <Select className="sm:!w-40" value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
                <option value="all">All statuses</option><option>Draft</option><option>Sent</option><option>Accepted</option><option>Declined</option>
              </Select>
              {(qsearch || filter !== 'all') && <Button variant="ghost" size="sm" onClick={() => { setQsearch(''); setFilter('all') }}>Clear</Button>}
            </CardContent></Card>
            <p className="text-sm text-slate-500">{filteredQuotes.length} of {quotes.length} quotations {qsearch && <>matching “{qsearch}”</>}</p>
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[720px]">
                  <thead className="text-left text-slate-500"><tr className="border-b"><th className="p-3 font-medium">No.</th><th>Customer</th><th>Date</th><th>Status</th><th className="text-right">Total</th><th className="p-3 text-right">Actions</th></tr></thead>
                  <tbody>
                    {filteredQuotes.map((r) => (
                      <tr key={r.id} className="border-b last:border-0 border-slate-100 dark:border-slate-800">
                        <td className="p-3 num">{r.no}</td>
                        <td>{r.customer.name || '—'}</td>
                        <td>{r.date}</td>
                        <td>
                          <Select className="!w-32 !py-1" value={r.status} onChange={(e) => { const s = e.target.value as QuoteStatus; setQuotes((prev) => prev.map((x) => x.id === r.id ? { ...x, status: s } : x)) }}>
                            <option>Draft</option><option>Sent</option><option>Accepted</option><option>Declined</option>
                          </Select>
                        </td>
                        <td className="num text-right">{money(totals(r, settings.vat).total)}</td>
                        <td className="p-3 text-right whitespace-nowrap space-x-1">
                          <Button variant="default" size="sm" onClick={() => { setQ(JSON.parse(JSON.stringify(r))); setTab('new') }}><FolderOpen size={12} /> Load</Button>
                          <Button variant="outline" size="sm" onClick={() => setView(r)}>View</Button>
                          <Button variant="outline" size="sm" title="Save this quotation to a file" onClick={() => {
                            const a = document.createElement('a')
                            a.href = URL.createObjectURL(new Blob([JSON.stringify(r, null, 2)], { type: 'application/json' }))
                            a.download = `${r.no}.json`; a.click()
                          }}><Download size={12} /> Save</Button>
                          <Button variant="ghost" size="sm" className="text-red-600" onClick={() => { if (confirm(`Delete ${r.no}?`)) setQuotes((prev) => prev.filter((x) => x.id !== r.id)) }}><Trash2 size={12} /></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!filteredQuotes.length && <p className="py-10 text-center text-slate-500">No quotations found. Try another search.</p>}
              </div>
            </Card>
          </section>
        )}

        {tab === 'products' && (
          <section className="space-y-4">
            <div className="flex flex-wrap gap-3 justify-between items-center">
              <h1 className="text-2xl font-semibold">Product catalog</h1>
              <div className="flex gap-2 flex-wrap">
                <Input className="!w-56" placeholder="Search products" value={psearch} onChange={(e) => setPsearch(e.target.value)} />
                <Button variant="outline" onClick={() => document.getElementById('loyverse-csv')?.click()}><Upload size={13} /> Import Loyverse</Button>
                <input id="loyverse-csv" type="file" accept=".csv" className="hidden" onChange={(e) => {
                  const f = e.target.files?.[0]; if (!f) return
                  f.text().then((txt) => {
                    try {
                      const r = importLoyverseCsv(txt, products)
                      setProducts([...r.products])
                      alert(`Loyverse import done. Added ${r.added}, updated ${r.updated}, skipped ${r.skipped}.`)
                    } catch (x: unknown) { alert(x instanceof Error ? x.message : 'Could not read that CSV.') }
                  }); e.target.value = ''
                }} />
                <Button onClick={() => setPf({ name: '', category: 'Other', price: 0, stock: 0 })}>Add product</Button>
              </div>
            </div>
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                  <thead className="text-left text-slate-500"><tr className="border-b"><th className="p-3 font-medium">Product</th><th>Category</th><th className="text-right">Price</th><th className="text-right">Stock</th><th className="p-3" /></tr></thead>
                  <tbody>
                    {products.filter((x) => (x.name + x.category).toLowerCase().includes(psearch.toLowerCase())).map((p) => (
                      <tr key={p.id} className="border-b last:border-0 border-slate-100 dark:border-slate-800">
                        <td className="p-3">{p.name}</td><td>{p.category}</td>
                        <td className="num text-right">{money(p.price)}</td>
                        <td className={cn('num text-right', p.stock <= 2 && 'text-amber-600')}>{p.stock}</td>
                        <td className="p-3 text-right whitespace-nowrap space-x-1">
                          <Button variant="outline" size="sm" onClick={() => setPf({ ...p })}>Edit</Button>
                          <Button variant="ghost" size="sm" className="text-red-600" onClick={() => setProducts((prev) => prev.filter((x) => x.id !== p.id))}>Delete</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </section>
        )}

        {tab === 'settings' && (
          <section className="max-w-xl space-y-4">
            <h1 className="text-2xl font-semibold">Settings</h1>
            <Card><CardContent className="space-y-3">
              <label className="block text-sm">Store name<Input className="mt-1" value={settings.store} onChange={(e) => setSettings({ ...settings, store: e.target.value })} /></label>
              <label className="block text-sm">Address<Input className="mt-1" value={settings.address} onChange={(e) => setSettings({ ...settings, address: e.target.value })} /></label>
              <label className="block text-sm">Phone or email<Input className="mt-1" value={settings.contact} onChange={(e) => setSettings({ ...settings, contact: e.target.value })} /></label>
              <div className="grid grid-cols-3 gap-3">
                <label className="block text-sm">VAT %<Input type="number" className="mt-1 num" value={settings.vat} onChange={(e) => setSettings({ ...settings, vat: Number(e.target.value) })} /></label>
                <label className="block text-sm">Valid days<Input type="number" className="mt-1 num" value={settings.validity} onChange={(e) => setSettings({ ...settings, validity: Number(e.target.value) })} /></label>
                <label className="block text-sm">Prefix<Input className="mt-1" value={settings.prefix} onChange={(e) => setSettings({ ...settings, prefix: e.target.value })} /></label>
              </div>
            </CardContent></Card>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportData}>Export backup</Button>
              <label className="inline-flex items-center rounded-md border px-4 py-2 text-sm cursor-pointer">Import backup<input type="file" accept=".json" className="hidden" onChange={importData} /></label>
            </div>
          </section>
        )}
      </main>

      <Dialog open={!!pf} onOpenChange={(o) => !o && setPf(null)}>
        <DialogContent>
          <DialogTitle>{pf?.id ? 'Edit product' : 'Add product'}</DialogTitle>
          {pf && (
            <div className="space-y-3">
              <Input placeholder="Product name" value={pf.name} onChange={(e) => setPf({ ...pf, name: e.target.value })} />
              <Select value={pf.category} onChange={(e) => setPf({ ...pf, category: e.target.value })}>
                {CATS.map((c) => <option key={c}>{c}</option>)}
              </Select>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm">Price<Input type="number" min={0} className="num mt-1" value={pf.price} onChange={(e) => setPf({ ...pf, price: Number(e.target.value) })} /></label>
                <label className="text-sm">Stock<Input type="number" min={0} className="num mt-1" value={pf.stock} onChange={(e) => setPf({ ...pf, stock: Number(e.target.value) })} /></label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setPf(null)}>Cancel</Button>
                <Button onClick={saveProduct}>Save product</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {view && (
        <div className="fixed inset-0 z-40 bg-black/60 overflow-auto p-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex justify-end gap-2 mb-3">
              <Button onClick={() => window.print()}><Printer size={15} /> Print / PDF</Button>
              <Button variant="secondary" onClick={() => setView(null)}>Close</Button>
            </div>
            <div id="print" className="bg-white text-slate-900 rounded-xl shadow-xl p-8">
              <div className="flex justify-between border-b-2 border-brand-blue pb-4">
                <div><img src="/logo-banner.png" alt="CHRISRANDOMTECH" className="h-12 w-auto object-contain mb-2" /><div className="text-sm text-slate-600">{settings.store}</div><div className="text-sm text-slate-600">{settings.address}</div><div className="text-sm text-slate-600">{settings.contact}</div></div>
                <div className="text-right"><div className="text-2xl font-bold"><span className="text-brand-blue">Quota</span><span className="text-brand-red">tion</span></div><div className="num text-sm">{view.no}</div><div className="text-sm text-slate-600">Date: {view.date}</div><div className="text-sm text-slate-600">Valid until: {view.valid}</div></div>
              </div>
              <div className="py-4 text-sm"><div className="text-slate-500">Prepared for</div><div className="font-semibold">{view.customer.name}</div><div>{view.customer.contact}</div><div>{view.customer.address}</div><Badge>{view.status}</Badge></div>
              <table className="w-full text-sm">
                <thead><tr className="bg-brand-bluesoft text-left"><th className="p-2">Item</th><th className="text-right">Qty</th><th className="text-right">Unit price</th><th className="text-right p-2">Amount</th></tr></thead>
                <tbody>{view.items.map((it) => (<tr key={it.key} className="border-b"><td className="p-2">{it.name}</td><td className="num text-right">{it.qty}</td><td className="num text-right">{money(it.price)}</td><td className="num text-right p-2">{money(it.qty * it.price)}</td></tr>))}</tbody>
              </table>
              <div className="ml-auto w-64 mt-4 text-sm space-y-1">
                <div className="flex justify-between"><span>Subtotal</span><span className="num">{money(totals(view, settings.vat).sub)}</span></div>
                {totals(view, settings.vat).disc > 0 && <div className="flex justify-between"><span>Discount</span><span className="num">-{money(totals(view, settings.vat).disc)}</span></div>}
                <div className="flex justify-between"><span>VAT ({settings.vat}%)</span><span className="num">{money(totals(view, settings.vat).vat)}</span></div>
                <div className="flex justify-between text-base font-bold border-t pt-2"><span>Total</span><span className="num">{money(totals(view, settings.vat).total)}</span></div>
              </div>
              {view.notes && <div className="mt-6 text-sm text-slate-600 whitespace-pre-line">{view.notes}</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
