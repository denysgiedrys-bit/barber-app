'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function ZrusitForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [rezervace, setRezervace] = useState(null)
  const [stav, setStav] = useState('nacitani') // nacitani | nalezeno | zruseno | chyba

  useEffect(() => {
    if (!token) { setStav('chyba'); return }
    fetch(`/api/zrusit?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setStav('chyba'); return }
        setRezervace(data)
        setStav('nalezeno')
      })
      .catch(() => setStav('chyba'))
  }, [token])

  async function potvrditZruseni() {
    setStav('nacitani')
    const res = await fetch('/api/zrusit', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    })
    const data = await res.json()
    setStav(data.ok ? 'zruseno' : 'chyba')
  }

  if (stav === 'nacitani') return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <p className="text-zinc-400">Načítám...</p>
    </div>
  )

  if (stav === 'zruseno') return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl text-center max-w-sm w-full">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-bold mb-2 text-white">Rezervace zrušena</h2>
        <p className="text-zinc-400 text-sm">Vaše rezervace byla úspěšně zrušena.</p>
        <a href="/" className="mt-6 block w-full bg-white text-black py-3 rounded-2xl font-medium text-sm text-center">
          Nová rezervace
        </a>
      </div>
    </div>
  )

  if (stav === 'chyba') return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl text-center max-w-sm w-full">
        <div className="text-5xl mb-4">❌</div>
        <h2 className="text-xl font-bold mb-2 text-white">Rezervace nenalezena</h2>
        <p className="text-zinc-400 text-sm">Odkaz je neplatný nebo rezervace již byla zrušena.</p>
        <a href="/" className="mt-6 block w-full bg-white text-black py-3 rounded-2xl font-medium text-sm text-center">
          Zpět na hlavní stránku
        </a>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl text-center max-w-sm w-full">
        <h2 className="text-xl font-bold mb-2 text-white">Zrušit rezervaci</h2>
        <p className="text-zinc-400 text-sm mb-6">Opravdu chcete zrušit tuto rezervaci?</p>
        <div className="bg-zinc-800 rounded-2xl p-4 mb-6 text-left">
          <p className="text-white font-medium">{rezervace?.sluzba}</p>
          <p className="text-zinc-400 text-sm mt-1">{rezervace?.datum} · {(rezervace?.cas || '').slice(0, 5)}</p>
          <p className="text-zinc-500 text-sm mt-1">{rezervace?.jmeno}</p>
        </div>
        <button onClick={potvrditZruseni}
          className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-2xl font-medium text-sm transition-all">
          Zrušit rezervaci
        </button>
        <a href="/" className="mt-3 block text-zinc-500 text-sm hover:text-zinc-300 transition-colors">
          Ponechat rezervaci
        </a>
      </div>
    </div>
  )
}

export default function ZrusitPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <p className="text-zinc-400">Načítám...</p>
      </div>
    }>
      <ZrusitForm />
    </Suspense>
  )
}
