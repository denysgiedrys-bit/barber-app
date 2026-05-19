'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const SLUZBY = [
  { id: 'stih', nazev: 'Střih', trvani: 30 },
  { id: 'vousy', nazev: 'Vousy', trvani: 20 },
  { id: 'oboji', nazev: 'Obojí', trvani: 45 },
]

const CASY = ['9:00','9:30','10:00','10:30','11:00','11:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30']

export default function Home() {
  const [sluzba, setSluzba] = useState(null)
  const [datum, setDatum] = useState('')
  const [cas, setCas] = useState('')
  const [jmeno, setJmeno] = useState('')
  const [telefon, setTelefon] = useState('')
  const [email, setEmail] = useState('')
  const [obsazene, setObsazene] = useState([])
  const [blokovane, setBlokovane] = useState([])
  const [blokovaneHodiny, setBlokovaneHodiny] = useState([])
  const [odeslano, setOdeslano] = useState(false)
  const [nacitani, setNacitani] = useState(false)
  const [chyba, setChyba] = useState('')

  const nactiObsazene = useCallback(async (d) => {
    const { data } = await supabase.from('rezervace').select('cas').eq('datum', d)
    if (data) setObsazene(data.map(r => r.cas.slice(0,5)))
  }, [])

  useEffect(() => {
    if (datum) {
      nactiObsazene(datum)
      const interval = setInterval(() => nactiObsazene(datum), 5000)
      return () => clearInterval(interval)
    }
  }, [datum, nactiObsazene])

  useEffect(() => { nactiBlokovane() }, [])

  async function nactiBlokovane() {
    const { data: blok } = await supabase.from('blokovane_dny').select('datum')
    const { data: hod } = await supabase.from('blokovane_hodiny').select('datum, cas')
    if (blok) setBlokovane(blok.map(d => d.datum))
    if (hod) setBlokovaneHodiny(hod)
  }

  async function odeslat() {
    setNacitani(true)
    setChyba('')
    const { error } = await supabase.from('rezervace').insert({
      jmeno, telefon, sluzba: sluzba.nazev, datum, cas
    })
    if (error) {
      if (error.code === '23505') {
        setChyba('Tento čas je již obsazený. Vyberte prosím jiný.')
        await nactiObsazene(datum)
        setCas('')
      } else {
        setChyba('Něco se pokazilo. Zkuste to znovu.')
      }
      setNacitani(false)
      return
    }
    if (email) {
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jmeno, email, sluzba: sluzba.nazev, datum, cas })
      })
    }
    await nactiObsazene(datum)
    setNacitani(false)
    setOdeslano(true)
  }

  function getDny() {
    const dnes = new Date()
    const dny = []
    for (let i = 1; i <= 14; i++) {
      const d = new Date(dnes)
      d.setDate(dnes.getDate() + i)
      if (d.getDay() !== 0) dny.push(d)
    }
    return dny
  }

  function jeCasNedostupny(c) {
    if (obsazene.includes(c)) return true
    if (blokovaneHodiny.some(h => h.datum === datum && h.cas.slice(0,5) === c)) return true
    return false
  }

  if (odeslano) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl text-center max-w-sm w-full">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-bold mb-2 text-white">Rezervace potvrzena!</h2>
        <p className="text-zinc-400 text-sm">Potvrzení jsme zaslali na váš email.</p>
        <div className="mt-4 bg-zinc-800 rounded-2xl p-4">
          <p className="text-white font-medium">{sluzba?.nazev}</p>
          <p className="text-zinc-400 text-sm mt-1">{datum} · {cas}</p>
        </div>
        <button onClick={() => { setOdeslano(false); setSluzba(null); setDatum(''); setCas(''); setJmeno(''); setTelefon(''); setEmail('') }}
          className="mt-6 w-full bg-white text-black py-3 rounded-2xl font-medium text-sm">
          Nová rezervace
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-zinc-950 py-8 px-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-1 text-white">Rezervace</h1>
        <p className="text-zinc-400 text-sm mb-6">Vyberte službu, čas a potvrďte</p>

        <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800 mb-3">
          <p className="text-xs text-zinc-500 mb-3 uppercase tracking-wider">1. Služba</p>
          <div className="grid grid-cols-3 gap-2">
            {SLUZBY.map(s => (
              <button key={s.id} onClick={() => setSluzba(s)}
                className={`p-3 rounded-xl border text-sm transition-all ${sluzba?.id === s.id ? 'border-white bg-white text-black' : 'border-zinc-700 text-zinc-300 hover:border-zinc-500'}`}>
                <div className="font-medium">{s.nazev}</div>
                <div className="text-xs opacity-60 mt-0.5">{s.trvani} min</div>
              </button>
            ))}
          </div>
        </div>

        {sluzba && (
          <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800 mb-3">
            <p className="text-xs text-zinc-500 mb-3 uppercase tracking-wider">2. Den</p>
            <div className="grid grid-cols-4 gap-2">
              {getDny().map(d => {
                const str = d.toISOString().split('T')[0]
                const jeBlokovany = blokovane.includes(str)
                const dnyNazvy = ['Ne','Po','Út','St','Čt','Pá','So']
                return (
                  <button key={str} disabled={jeBlokovany} onClick={() => { setDatum(str); setCas('') }}
                    className={`p-2 rounded-xl border text-sm transition-all ${jeBlokovany ? 'opacity-20 cursor-not-allowed border-zinc-800' : datum === str ? 'border-white bg-white text-black' : 'border-zinc-700 text-zinc-300 hover:border-zinc-500'}`}>
                    <div className="text-xs opacity-60">{dnyNazvy[d.getDay()]}</div>
                    <div className="font-medium">{d.getDate()}.{d.getMonth()+1}</div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {datum && (
          <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800 mb-3">
            <p className="text-xs text-zinc-500 mb-3 uppercase tracking-wider">3. Čas</p>
            <div className="grid grid-cols-4 gap-2">
              {CASY.map(c => {
                const nedostupny = jeCasNedostupny(c)
                return (
                  <button key={c} disabled={nedostupny} onClick={() => setCas(c)}
                    className={`p-2.5 rounded-xl border text-sm transition-all ${nedostupny ? 'opacity-30 line-through cursor-not-allowed border-zinc-800 text-zinc-600' : cas === c ? 'border-white bg-white text-black' : 'border-zinc-700 text-zinc-300 hover:border-zinc-500'}`}>
                    {c}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {cas && (
          <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800 mb-3">
            <p className="text-xs text-zinc-500 mb-3 uppercase tracking-wider">4. Vaše údaje</p>
            <input value={jmeno} onChange={e => setJmeno(e.target.value)}
              placeholder="Jméno a příjmení"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 mb-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-zinc-500" />
            <input value={telefon} onChange={e => setTelefon(e.target.value)}
              placeholder="Telefon (+420 777 123 456)"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 mb-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-zinc-500" />
            <input value={email} onChange={e => setEmail(e.target.value)}
              placeholder="Email (pro potvrzení)"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-zinc-500" />
          </div>
        )}

        {chyba && <p className="text-red-400 text-sm mb-3 text-center">{chyba}</p>}

        {jmeno && telefon && (
          <button onClick={odeslat} disabled={nacitani}
            className="w-full bg-white text-black py-4 rounded-2xl font-medium text-sm hover:bg-zinc-100 transition-all">
            {nacitani ? 'Odesílám...' : `Potvrdit — ${sluzba?.nazev} ${datum} ${cas}`}
          </button>
        )}
      </div>
    </div>
  )
}