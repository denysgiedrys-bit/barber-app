'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const SLUZBY = [
  { id: 'stih', nazev: 'Střih', trvani: 30 },
  { id: 'vousy', nazev: 'Vousy', trvani: 20 },
  { id: 'oboji', nazev: 'Obojí', trvani: 45 },
]

const CASY = ['9:00','9:30','10:00','10:30','11:00','11:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30']

const nc = c => { const s = (c || '').slice(0, 5); return s.startsWith('0') ? s.slice(1) : s }
const jeValidniTelefon = t => /^[+\d][\d\s\-()]{7,}$/.test(t.trim()) && t.replace(/\D/g, '').length >= 9
const casNaMinuty = c => { const [h, m] = nc(c).split(':').map(Number); return h * 60 + m }

export default function Home() {
  const [sluzba, setSluzba] = useState(null)
  const [datum, setDatum] = useState('')
  const [cas, setCas] = useState('')
  const [jmeno, setJmeno] = useState('')
  const [telefon, setTelefon] = useState('')
  const [email, setEmail] = useState('')
  const [poznamka, setPoznamka] = useState('')
  const [rezervace, setRezervace] = useState([])
  const [blokovane, setBlokovane] = useState([])
  const [blokovaneHodiny, setBlokovaneHodiny] = useState([])
  const [dostupnost, setDostupnost] = useState([])
  const [opakovani, setOpakovani] = useState([])
  const [odeslano, setOdeslano] = useState(false)
  const [nacitani, setNacitani] = useState(false)
  const [chyba, setChyba] = useState('')

  useEffect(() => {
    nactiData()
    const interval = setInterval(nactiData, 10000)
    return () => clearInterval(interval)
  }, [])

  async function nactiData() {
    const { data: rez } = await supabase.from('rezervace').select('datum, cas, sluzba')
    const { data: blok } = await supabase.from('blokovane_dny').select('datum')
    const { data: hod } = await supabase.from('blokovane_hodiny').select('datum, cas')
    const { data: dost } = await supabase.from('dostupnost').select('datum, cas')
    const { data: opak } = await supabase.from('opakujici_dostupnost').select('den_tydne, cas')
    if (rez) setRezervace(rez)
    if (blok) setBlokovane(blok.map(d => d.datum))
    if (hod) setBlokovaneHodiny(hod)
    if (dost) setDostupnost(dost)
    if (opak) setOpakovani(opak)
  }

  async function odeslat() {
    setNacitani(true)
    setChyba('')
    const { data: rezData, error } = await supabase.from('rezervace').insert({
      jmeno, telefon, sluzba: sluzba.nazev, datum, cas, email: email || null, poznamka: poznamka || null
    }).select('cancel_token').single()
    if (error) {
      if (error.code === '23505') {
        setChyba('Tento čas je již obsazený. Vyberte prosím jiný.')
        await nactiData()
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
        body: JSON.stringify({ jmeno, email, sluzba: sluzba.nazev, datum, cas, cancelToken: rezData?.cancel_token })
      })
    }
    await nactiData()
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

  function getCasyProDen(d) {
    const dostNorm = dostupnost.filter(x => x.datum === d).map(x => nc(x.cas))
    if (dostNorm.length > 0) return CASY.filter(c => dostNorm.includes(nc(c)))
    const denTydne = new Date(d + 'T00:00:00').getDay()
    const opakNorm = opakovani.filter(x => x.den_tydne === denTydne).map(x => nc(x.cas))
    if (opakNorm.length > 0) return CASY.filter(c => opakNorm.includes(nc(c)))
    return CASY
  }

  function jeCasNedostupny(c) {
    const cMin = casNaMinuty(c)
    if (rezervace.some(r => {
      if (r.datum !== datum) return false
      const rMin = casNaMinuty(r.cas)
      const obj = SLUZBY.find(s => s.nazev === r.sluzba)
      const trvani = obj ? obj.trvani : 30
      return cMin >= rMin && cMin < rMin + trvani
    })) return true
    if (sluzba && rezervace.some(r => {
      if (r.datum !== datum) return false
      const rMin = casNaMinuty(r.cas)
      return rMin > cMin && rMin < cMin + sluzba.trvani
    })) return true
    if (blokovaneHodiny.some(h => h.datum === datum && nc(h.cas) === nc(c))) return true
    return false
  }

  if (odeslano) {
    const [year, month, day] = datum.split('-')
    const [hour, minute] = cas.split(':')
    const startStr = `${year}${month}${day}T${hour.padStart(2,'0')}${(minute||'00').padStart(2,'0')}00`
    const endDate = new Date(`${datum}T${hour.padStart(2,'0')}:${(minute||'00').padStart(2,'0')}:00`)
    endDate.setMinutes(endDate.getMinutes() + (sluzba?.trvani || 30))
    const endStr = `${endDate.getFullYear()}${String(endDate.getMonth()+1).padStart(2,'0')}${String(endDate.getDate()).padStart(2,'0')}T${String(endDate.getHours()).padStart(2,'0')}${String(endDate.getMinutes()).padStart(2,'0')}00`
    const nazev = encodeURIComponent(`Barber — ${sluzba?.nazev}`)
    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${nazev}&dates=${startStr}/${endStr}`
    const ics = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nDTSTART:${startStr}\r\nDTEND:${endStr}\r\nSUMMARY:Barber — ${sluzba?.nazev}\r\nEND:VEVENT\r\nEND:VCALENDAR`
    const icsUrl = `data:text/calendar;charset=utf8,${encodeURIComponent(ics)}`

    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl text-center max-w-sm w-full">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-bold mb-2 text-white">Rezervace potvrzena!</h2>
          {email && <p className="text-zinc-400 text-sm">Potvrzení jsme zaslali na váš email.</p>}
          <div className="mt-4 bg-zinc-800 rounded-2xl p-4">
            <p className="text-white font-medium">{sluzba?.nazev}</p>
            <p className="text-zinc-400 text-sm mt-1">{datum} · {cas}</p>
          </div>
          <div className="mt-4 flex gap-2">
            <a href={googleUrl} target="_blank" rel="noopener noreferrer"
              className="flex-1 bg-zinc-800 border border-zinc-700 text-white py-2.5 rounded-2xl text-xs font-medium hover:border-zinc-500 transition-all">
              Google Kalendář
            </a>
            <a href={icsUrl} download="rezervace.ics"
              className="flex-1 bg-zinc-800 border border-zinc-700 text-white py-2.5 rounded-2xl text-xs font-medium hover:border-zinc-500 transition-all">
              Apple / Outlook
            </a>
          </div>
          <button onClick={() => { setOdeslano(false); setSluzba(null); setDatum(''); setCas(''); setJmeno(''); setTelefon(''); setEmail(''); setPoznamka('') }}
            className="mt-3 w-full bg-white text-black py-3 rounded-2xl font-medium text-sm">
            Nová rezervace
          </button>
        </div>
      </div>
    )
  }

  const krok = cas ? 4 : datum ? 3 : sluzba ? 2 : 1
  const kroky = ['Služba', 'Den', 'Čas', 'Údaje']

  return (
    <div className="min-h-screen bg-zinc-950 py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1 text-white">Rezervace</h1>
            <p className="text-zinc-400 text-sm">Vyberte službu, čas a potvrďte</p>
          </div>
          <a href="/moje-rezervace" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors border border-zinc-800 px-3 py-2 rounded-xl">
            Moje rezervace
          </a>
        </div>

        <div className="flex items-center mb-6">
          {kroky.map((label, i) => {
            const cislo = i + 1
            const hotovy = krok > cislo
            const aktivni = krok === cislo
            return (
              <div key={i} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${hotovy ? 'bg-white text-black' : aktivni ? 'bg-white text-black ring-4 ring-white/20' : 'bg-zinc-800 text-zinc-500 border border-zinc-700'}`}>
                    {hotovy ? '✓' : cislo}
                  </div>
                  <span className={`text-xs mt-1 transition-all ${aktivni ? 'text-white font-medium' : hotovy ? 'text-zinc-400' : 'text-zinc-600'}`}>{label}</span>
                </div>
                {i < kroky.length - 1 && (
                  <div className={`flex-1 h-px mx-2 mb-4 transition-all ${krok > cislo ? 'bg-white' : 'bg-zinc-800'}`} />
                )}
              </div>
            )
          })}
        </div>

        <div className="animate-step bg-zinc-900 rounded-2xl p-5 border border-zinc-800 mb-3">
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
          <div key={sluzba.id} className="animate-step bg-zinc-900 rounded-2xl p-5 border border-zinc-800 mb-3">
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
          <div key={datum} className="animate-step bg-zinc-900 rounded-2xl p-5 border border-zinc-800 mb-3">
            <p className="text-xs text-zinc-500 mb-3 uppercase tracking-wider">3. Čas</p>
<div className="grid grid-cols-4 gap-2">
              {getCasyProDen(datum).map(c => {
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
          <div key={cas} className="animate-step bg-zinc-900 rounded-2xl p-5 border border-zinc-800 mb-3">
            <p className="text-xs text-zinc-500 mb-3 uppercase tracking-wider">4. Vaše údaje</p>
            <input value={jmeno} onChange={e => setJmeno(e.target.value)}
              placeholder="Jméno a příjmení"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 mb-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-zinc-500" />
            <input value={telefon} onChange={e => setTelefon(e.target.value)}
              placeholder="Telefon (+420 777 123 456)"
              className={`w-full bg-zinc-800 border rounded-xl px-4 py-3 mb-1 text-sm text-white placeholder-zinc-500 outline-none transition-colors ${telefon && !jeValidniTelefon(telefon) ? 'border-red-700 focus:border-red-500' : 'border-zinc-700 focus:border-zinc-500'}`} />
            {telefon && !jeValidniTelefon(telefon) && (
              <p className="text-red-400 text-xs mb-2 px-1">Zadejte platné telefonní číslo</p>
            )}
            <input value={email} onChange={e => setEmail(e.target.value)}
              placeholder="Email (pro potvrzení)"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 mb-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-zinc-500" />
            <textarea value={poznamka} onChange={e => setPoznamka(e.target.value)}
              placeholder="Poznámka (nepovinné)"
              rows={2}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-zinc-500 resize-none" />
          </div>
        )}

        {chyba && <p className="text-red-400 text-sm mb-3 text-center">{chyba}</p>}

        {jmeno && telefon && jeValidniTelefon(telefon) && (
          <button onClick={odeslat} disabled={nacitani}
            className="w-full bg-white text-black py-4 rounded-2xl font-medium text-sm hover:bg-zinc-100 transition-all">
            {nacitani ? 'Odesílám...' : 'Potvrdit rezervaci'}
          </button>
        )}

        <div className="pb-28" />
      </div>

      {sluzba && (
        <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3 bg-gradient-to-t from-zinc-950 via-zinc-950/95 to-transparent pointer-events-none">
          <div className="max-w-md mx-auto bg-zinc-900 border border-zinc-700 rounded-2xl px-4 py-3 flex items-center gap-3 pointer-events-auto">
            <div className="flex-1 flex items-center gap-2 flex-wrap">
              <span className="text-white text-sm font-medium">{sluzba.nazev}</span>
              {datum && (
                <>
                  <span className="text-zinc-600 text-xs">·</span>
                  <span className="text-zinc-300 text-sm">{new Date(datum + 'T00:00:00').toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short' })}</span>
                </>
              )}
              {cas && (
                <>
                  <span className="text-zinc-600 text-xs">·</span>
                  <span className="text-zinc-300 text-sm">{cas}</span>
                </>
              )}
            </div>
            <span className="text-zinc-500 text-xs shrink-0">{sluzba.trvani} min</span>
          </div>
        </div>
      )}
    </div>
  )
}
