'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const [heslo, setHeslo] = useState('')
  const [chyba, setChyba] = useState('')
  const [nacitani, setNacitani] = useState(false)
  const router = useRouter()

  async function prihlasit(e) {
    e.preventDefault()
    setNacitani(true)
    setChyba('')

    const res = await fetch('/api/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ heslo })
    })

    if (res.ok) {
      router.push('/admin')
      router.refresh()
    } else {
      setChyba('Špatné heslo')
      setNacitani(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl w-full max-w-sm">
        <h1 className="text-xl font-bold text-white mb-1">Admin</h1>
        <p className="text-zinc-400 text-sm mb-6">Zadejte heslo pro přístup</p>
        <form onSubmit={prihlasit}>
          <input
            type="password"
            value={heslo}
            onChange={e => setHeslo(e.target.value)}
            placeholder="Heslo"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 mb-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-zinc-500"
            autoFocus
          />
          {chyba && <p className="text-red-400 text-sm mb-3">{chyba}</p>}
          <button
            type="submit"
            disabled={nacitani || !heslo}
            className="w-full bg-white text-black py-3 rounded-2xl font-medium text-sm hover:bg-zinc-100 transition-all disabled:opacity-50">
            {nacitani ? 'Přihlašuji...' : 'Přihlásit'}
          </button>
        </form>
      </div>
    </div>
  )
}
