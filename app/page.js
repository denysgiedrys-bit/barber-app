'use client'
import { useState, useEffect } from 'react'
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
  const [odeslano, setOdeslano] = useState(false)
  const [nacitani, setNacitani] = useState(false)

  useEffect(() => {
    if (datum) nactiObsazene()
  }, [datum])

  useEffect(() => {
    nactiBlokovane()
  }, [])

  async function nactiBlokovane() {
    const { data } = await supabase.from('blokovane_dny').select('datum')
    if (data) setBlokovane(data.map(d => d.datum))
  }

  async function nactiObsazene() {
    const { data } = await supabase.from('rezervace').select('cas').eq('datum', datum)
    if (data) setObsazene(data.map(r => r.cas.slice(0,5)))
  }

  async function odeslat() {
    setNacitani(true)
    const { error } = await supabase.from('rezervace').insert({
      jmeno, telefon, sluzba: sluzba.nazev, datum, cas
    })
    if (!error && email) {
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jmeno, email, sluzba: sluzba.nazev, datum, cas })
      })
    }
    setNacitani(false)
    if (!error) setOdeslano(true)
  }

  function getDnyVTydnu() {
    const dnes = new Date()
    const dny = []
    for (let i = 1; i <= 14; i++) {
      const d = new Date(dnes)
      d.setDate(dnes.getDate() + i)
      if (d.getDay() !== 0) dny.push(d)
    }
    return dny
  }

  if (odeslano) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow text-center max-w-sm">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-semibold mb-2">Rezervace potvrzena!</h2>
        <p className="text-gray-500">Potvrzení jsme zaslali na váš email.</p>
        <p className="mt-4 font-medium">{sluzba?.nazev} · {datum} · {cas}</p>
        <button onClick={() => { setOdeslano(false); setSluzba(null); setDatum(''); setCas(''); setJmeno(''); setTelefon(''); setEmail('') }}
          className="mt-6 w-full bg-black text-white py-3 rounded-xl">
          Nová rezervace
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-semibold mb-1">Rezervace</h1>
        <p className="text-gray-500 mb-6">Vyberte službu, čas a potvrďte</p>

        <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          <p className="text-sm text-gray-500 mb-3">1. Vyberte službu</p>
          <div className="grid grid-cols-3 gap-2">
            {SLUZBY.map(s => (
              <button key={s.id} onClick={() => setSluzba(s)}
                className={`p-3 rounded-xl border text-sm ${sluzba?.id === s.id ? 'border-black bg-black text-white' : 'border-gray-200'}`}>
                <div className="font-medium">{s.nazev}</div>
                <div className="text-xs opacity-70">{s.trvani} min</div>
              </button>
            ))}
          </div>
        </div>

        {sluzba && (
          <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
            <p className="text-sm text-gray-500 mb-3">2. Vyberte den</p>
            <div className="grid grid-cols-4 gap-2">
              {getDnyVTydnu().map(d => {
                const str = d.toISOString().split('T')[0]
                const jeBlokovany = blokovane.includes(str)
                const dnyNazvy = ['Ne','Po','Út','St','Čt','Pá','So']
                return (
                  <button key={str} disabled={jeBlokovany} onClick={() => { setDatum(str); setCas('') }}
                    className={`p-2 rounded-xl border text-sm ${jeBlokovany ? 'opacity-30 cursor-not-allowed border-gray-100' : datum === str ? 'border-black bg-black text-white' : 'border-gray-200'}`}>
                    <div className="text-xs opacity-70">{dnyNazvy[d.getDay()]}</div>
                    <div className="font-medium">{d.getDate()}.{d.getMonth()+1}</div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {datum && (
          <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
            <p className="text-sm text-gray-500 mb-3">3. Vyberte čas</p>
            <div className="grid grid-cols-4 gap-2">
              {CASY.map(c => (
                <button key={c} disabled={obsazene.includes(c)} onClick={() => setCas(c)}
                  className={`p-2 rounded-xl border text-sm ${obsazene.includes(c) ? 'opacity-30 line-through cursor-not-allowed border-gray-100' : cas === c ? 'border-black bg-black text-white' : 'border-gray-200'}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {cas && (
          <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
            <p className="text-sm text-gray-500 mb-3">4. Vaše údaje</p>
            <input value={jmeno} onChange={e => setJmeno(e.target.value)}
              placeholder="Jméno a příjmení"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-3 text-sm outline-none focus:border-black" />
            <input value={telefon} onChange={e => setTelefon(e.target.value)}
              placeholder="Telefon (+420 777 123 456)"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-3 text-sm outline-none focus:border-black" />
            <input value={email} onChange={e => setEmail(e.target.value)}
              placeholder="Email (pro potvrzení)"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-black" />
          </div>
        )}

        {jmeno && telefon && (
          <button onClick={odeslat} disabled={nacitani}
            className="w-full bg-black text-white py-4 rounded-2xl font-medium text-sm">
            {nacitani ? 'Odesílám...' : `Potvrdit — ${sluzba?.nazev} ${datum} ${cas}`}
          </button>
        )}
      </div>
    </div>
  )
}