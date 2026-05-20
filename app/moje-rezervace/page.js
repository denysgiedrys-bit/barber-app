'use client'
import { useState, Suspense } from 'react'

function MojeRezervaceForm() {
  const [telefon, setTelefon] = useState('')
  const [rezervace, setRezervace] = useState(null)
  const [nacitani, setNacitani] = useState(false)
  const [ruseni, setRuseni] = useState(null)

  async function hledat() {
    if (!telefon.trim()) return
    setNacitani(true)
    const res = await fetch(`/api/rezervace-zakaznika?telefon=${encodeURIComponent(telefon.trim())}`)
    const data = await res.json()
    setRezervace(Array.isArray(data) ? data : [])
    setNacitani(false)
  }

  async function zrusit(token) {
    if (!confirm('Opravdu chcete zrušit tuto rezervaci?')) return
    setRuseni(token)
    await fetch('/api/zrusit', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    })
    setRezervace(prev => prev.filter(r => r.cancel_token !== token))
    setRuseni(null)
  }

  return (
    <div className="min-h-screen bg-zinc-950 py-8 px-4">
      <div className="max-w-md mx-auto">
        <a href="/" className="text-zinc-500 text-sm hover:text-zinc-300 transition-colors mb-6 block">← Zpět</a>
        <h1 className="text-2xl font-bold mb-1 text-white">✂️ MCuts</h1>
        <p className="text-zinc-400 text-sm mb-1">Moje rezervace</p>
        <p className="text-zinc-400 text-sm mb-6">Zadejte telefonní číslo pro zobrazení vašich rezervací</p>

        <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800 mb-4">
          <div className="flex gap-2">
            <input
              value={telefon}
              onChange={e => setTelefon(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && hledat()}
              placeholder="+420 777 123 456"
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-zinc-500"
            />
            <button onClick={hledat} disabled={nacitani || !telefon.trim()}
              className="bg-white text-black px-4 py-3 rounded-xl text-sm font-medium disabled:opacity-50 transition-all">
              {nacitani ? '...' : 'Hledat'}
            </button>
          </div>
        </div>

        {rezervace !== null && (
          <div className="flex flex-col gap-2">
            {rezervace.length === 0 ? (
              <div className="bg-zinc-900 rounded-2xl p-6 text-center border border-zinc-800">
                <p className="text-zinc-400 text-sm">Žádné nadcházející rezervace</p>
                <p className="text-zinc-600 text-xs mt-1">Zkontrolujte že jste zadali správné číslo</p>
              </div>
            ) : (
              rezervace.map(r => (
                <div key={r.id} className="bg-zinc-900 rounded-2xl p-4 flex items-center gap-4 border border-zinc-800">
                  <div className="text-center min-w-12">
                    <div className="text-xs text-zinc-500">{r.datum}</div>
                    <div className="font-bold text-white text-lg">{r.cas?.slice(0,5)}</div>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-white">{r.jmeno}</div>
                    <div className="text-sm text-zinc-400">{r.sluzba}</div>
                  </div>
                  <button
                    onClick={() => zrusit(r.cancel_token)}
                    disabled={ruseni === r.cancel_token}
                    className="text-xs text-red-400 border border-red-900 px-3 py-1.5 rounded-xl hover:bg-red-950 transition-all shrink-0 disabled:opacity-50">
                    {ruseni === r.cancel_token ? '...' : 'Zrušit'}
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        <p className="text-center mt-8">
          <a href="/" className="text-zinc-500 text-sm hover:text-zinc-300 transition-colors">
            Nová rezervace
          </a>
        </p>
      </div>
    </div>
  )
}

export default function MojeRezervacePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <p className="text-zinc-400">Načítám...</p>
      </div>
    }>
      <MojeRezervaceForm />
    </Suspense>
  )
}
