'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const CASY = ['9:00','9:30','10:00','10:30','11:00','11:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30']

const nc = c => { const s = (c || '').slice(0, 5); return s.startsWith('0') ? s.slice(1) : s }

export default function Admin() {
  const [rezervace, setRezervace] = useState([])
  const [blokovane, setBlokovane] = useState([])
  const [blokovaneHodiny, setBlokovaneHodiny] = useState([])
  const [dostupnost, setDostupnost] = useState([])
  const [opakovani, setOpakovani] = useState([])
  const [novyDatum, setNovyDatum] = useState('')
  const [vybranyDen, setVybranyDen] = useState('')
  const [vybranyDenDost, setVybranyDenDost] = useState('')
  const [vybranyDenTydne, setVybranyDenTydne] = useState(null)
  const [nacitani, setNacitani] = useState(true)
  const [aktivniTab, setAktivniTab] = useState('rezervace')

  useEffect(() => { nactiData() }, [])

  async function nactiData() {
    setNacitani(true)
    const { data: rez } = await supabase.from('rezervace').select('*').order('datum').order('cas')
    const { data: blok } = await supabase.from('blokovane_dny').select('*').order('datum')
    const { data: hod } = await supabase.from('blokovane_hodiny').select('*')
    const { data: dost } = await supabase.from('dostupnost').select('*')
    const { data: opak } = await supabase.from('opakujici_dostupnost').select('*')
    if (rez) setRezervace(rez)
    if (blok) setBlokovane(blok)
    if (hod) setBlokovaneHodiny(hod)
    if (dost) setDostupnost(dost)
    if (opak) setOpakovani(opak)
    setNacitani(false)
  }

  async function zrusitRezervaci(id) {
    if (!confirm('Zrušit rezervaci?')) return
    await supabase.from('rezervace').delete().eq('id', id)
    nactiData()
  }

  async function blokovatDen() {
    if (!novyDatum) return
    await supabase.from('blokovane_dny').insert({ datum: novyDatum })
    setNovyDatum('')
    nactiData()
  }

  async function odblokovatDen(id) {
    await supabase.from('blokovane_dny').delete().eq('id', id)
    nactiData()
  }

  async function toggleHodina(cas) {
    if (!vybranyDen) return
    const existuje = blokovaneHodiny.find(h => h.datum === vybranyDen && nc(h.cas) === nc(cas))
    if (existuje) {
      await supabase.from('blokovane_hodiny').delete().eq('id', existuje.id)
    } else {
      await supabase.from('blokovane_hodiny').insert({ datum: vybranyDen, cas })
    }
    nactiData()
  }

  async function toggleOpakovani(denTydne, cas) {
    const existuje = opakovani.find(o => o.den_tydne === denTydne && nc(o.cas) === nc(cas))
    if (existuje) {
      await supabase.from('opakujici_dostupnost').delete().eq('id', existuje.id)
    } else {
      await supabase.from('opakujici_dostupnost').insert({ den_tydne: denTydne, cas })
    }
    nactiData()
  }

  async function toggleDostupnost(cas) {
    if (!vybranyDenDost) return
    const existuje = dostupnost.find(d => d.datum === vybranyDenDost && nc(d.cas) === nc(cas))
    if (existuje) {
      await supabase.from('dostupnost').delete().eq('id', existuje.id)
    } else {
      await supabase.from('dostupnost').insert({ datum: vybranyDenDost, cas })
    }
    nactiData()
  }

  const dnes = new Date().toISOString().split('T')[0]
  const dnesniRez = rezervace.filter(r => r.datum === dnes)
  const budouciRez = rezervace.filter(r => r.datum > dnes)
  const minuleRez = rezervace.filter(r => r.datum < dnes)

  const groupByDate = (rez) => {
    const groups = {}
    rez.forEach(r => { if (!groups[r.datum]) groups[r.datum] = []; groups[r.datum].push(r) })
    return groups
  }

  const formatDatum = (d) => {
    const date = new Date(d + 'T00:00:00')
    const dny = ['Ne','Po','Út','St','Čt','Pá','So']
    return `${dny[date.getDay()]} ${date.getDate()}.${date.getMonth()+1}.${date.getFullYear()}`
  }

  if (nacitani) return <div className="min-h-screen flex items-center justify-center bg-zinc-950"><p className="text-zinc-400">Načítám...</p></div>

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1 text-white">Admin panel</h1>
        <p className="text-zinc-400 mb-6 text-sm">Správa rezervací a rozvrhu</p>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {[['Dnes', dnesniRez.length], ['Nadcházející', budouciRez.length], ['Celkem', rezervace.length]].map(([label, val]) => (
            <div key={label} className="bg-zinc-900 rounded-2xl p-4 text-center border border-zinc-800">
              <div className="text-3xl font-bold text-white">{val}</div>
              <div className="text-xs text-zinc-400 mt-1">{label}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-5 flex-wrap">
          {[['rezervace','Rezervace'],['statistiky','Statistiky'],['rozvrh','Rozvrh'],['dny','Blokovat dny']].map(([id, label]) => (
            <button key={id} onClick={() => setAktivniTab(id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${aktivniTab === id ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Statistiky */}
        {aktivniTab === 'statistiky' && (() => {
          const mesic = new Date().getMonth()
          const rok = new Date().getFullYear()
          const tentoMesic = rezervace.filter(r => {
            const d = new Date(r.datum)
            return d.getMonth() === mesic && d.getFullYear() === rok
          })
          const minulyMesic = rezervace.filter(r => {
            const d = new Date(r.datum)
            const m = mesic === 0 ? 11 : mesic - 1
            const y = mesic === 0 ? rok - 1 : rok
            return d.getMonth() === m && d.getFullYear() === y
          })
          const sluzbyCount = {}
          rezervace.forEach(r => { sluzbyCount[r.sluzba] = (sluzbyCount[r.sluzba] || 0) + 1 })
          const nejSluzba = Object.entries(sluzbyCount).sort((a,b) => b[1]-a[1])[0]
          const dnyCount = {1:0,2:0,3:0,4:0,5:0,6:0,0:0}
          rezervace.forEach(r => { const d = new Date(r.datum).getDay(); dnyCount[d] = (dnyCount[d]||0)+1 })
          const dnyNazvy = ['Ne','Po','Út','St','Čt','Pá','So']
          const nejDen = Object.entries(dnyCount).sort((a,b) => b[1]-a[1])[0]
          const maxDen = Math.max(...Object.values(dnyCount))
          return (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
                  <div className="text-xs text-zinc-500 mb-1">Tento měsíc</div>
                  <div className="text-3xl font-bold text-white">{tentoMesic.length}</div>
                  <div className={`text-xs mt-1 ${tentoMesic.length >= minulyMesic.length ? 'text-green-400' : 'text-red-400'}`}>
                    {minulyMesic.length > 0 ? `${tentoMesic.length >= minulyMesic.length ? '+' : ''}${tentoMesic.length - minulyMesic.length} oproti min. měsíci` : 'první měsíc'}
                  </div>
                </div>
                <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
                  <div className="text-xs text-zinc-500 mb-1">Celkem rezervací</div>
                  <div className="text-3xl font-bold text-white">{rezervace.length}</div>
                  <div className="text-xs text-zinc-500 mt-1">od začátku</div>
                </div>
              </div>

              {nejSluzba && (
                <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
                  <div className="text-xs text-zinc-500 mb-3 uppercase tracking-wider">Oblíbenost služeb</div>
                  {Object.entries(sluzbyCount).sort((a,b) => b[1]-a[1]).map(([sluzba, count]) => (
                    <div key={sluzba} className="mb-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-white">{sluzba}</span>
                        <span className="text-zinc-400">{count}×</span>
                      </div>
                      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-white rounded-full transition-all" style={{width: `${(count / rezervace.length) * 100}%`}} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
                <div className="text-xs text-zinc-500 mb-3 uppercase tracking-wider">Nejrušnější dny</div>
                <div className="flex gap-1 items-end h-16">
                  {[1,2,3,4,5,6,0].map(d => (
                    <div key={d} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full bg-zinc-700 rounded-sm transition-all" style={{height: maxDen > 0 ? `${((dnyCount[d]||0) / maxDen) * 48}px` : '2px', minHeight: '2px', background: dnyCount[d] === maxDen && maxDen > 0 ? 'white' : ''}} />
                      <span className="text-xs text-zinc-500">{dnyNazvy[d]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })()}

        {/* Rezervace */}
        {aktivniTab === 'rezervace' && (
          <div className="flex flex-col gap-4">
            {rezervace.filter(r => r.datum >= dnes).length === 0 && (
              <div className="bg-zinc-900 rounded-2xl p-6 text-center text-zinc-500 border border-zinc-800">Žádné nadcházející rezervace</div>
            )}

            {/* Dnes */}
            {dnesniRez.length > 0 && (
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2 px-1">Dnes</p>
                <div className="flex flex-col gap-2">
                  {dnesniRez.map(r => (
                    <div key={r.id} className="bg-zinc-900 rounded-2xl p-4 flex items-center gap-4 border border-zinc-700">
                      <div className="text-center min-w-12">
                        <div className="font-bold text-white text-xl">{r.cas?.slice(0,5)}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white">{r.jmeno}</div>
                        <div className="text-sm text-zinc-400">{r.sluzba} · {r.telefon}</div>
                        {r.email && <div className="text-xs text-zinc-500 truncate">{r.email}</div>}
                        {r.poznamka && <div className="text-xs text-yellow-600 mt-0.5">📝 {r.poznamka}</div>}
                      </div>
                      <button onClick={() => zrusitRezervaci(r.id)} className="text-xs text-red-400 border border-red-900 px-3 py-1.5 rounded-xl hover:bg-red-950 transition-all shrink-0">
                        Zrušit
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nadcházející po dnech */}
            {budouciRez.length > 0 && (
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2 px-1">Nadcházející</p>
                {Object.entries(groupByDate(budouciRez)).map(([datum, rez]) => (
                  <div key={datum} className="mb-3">
                    <p className="text-sm text-zinc-400 font-medium mb-2 px-1">{formatDatum(datum)}</p>
                    <div className="flex flex-col gap-2">
                      {rez.map(r => (
                        <div key={r.id} className="bg-zinc-900 rounded-2xl p-4 flex items-center gap-4 border border-zinc-800">
                          <div className="text-center min-w-12">
                            <div className="font-bold text-white text-lg">{r.cas?.slice(0,5)}</div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-white">{r.jmeno}</div>
                            <div className="text-sm text-zinc-400">{r.sluzba} · {r.telefon}</div>
                            {r.email && <div className="text-xs text-zinc-500 truncate">{r.email}</div>}
                            {r.poznamka && <div className="text-xs text-yellow-600 mt-0.5">📝 {r.poznamka}</div>}
                          </div>
                          <button onClick={() => zrusitRezervaci(r.id)} className="text-xs text-red-400 border border-red-900 px-3 py-1.5 rounded-xl hover:bg-red-950 transition-all shrink-0">
                            Zrušit
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Minulé (sbalené) */}
            {minuleRez.length > 0 && (
              <details className="group">
                <summary className="text-xs text-zinc-600 uppercase tracking-wider px-1 cursor-pointer hover:text-zinc-400 transition-colors list-none">
                  Minulé rezervace ({minuleRez.length})
                </summary>
                <div className="flex flex-col gap-2 mt-2">
                  {minuleRez.slice().reverse().map(r => (
                    <div key={r.id} className="bg-zinc-900 rounded-2xl p-4 flex items-center gap-4 border border-zinc-800 opacity-50">
                      <div className="text-center min-w-12">
                        <div className="text-xs text-zinc-500">{r.datum}</div>
                        <div className="font-bold text-zinc-400 text-lg">{r.cas?.slice(0,5)}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-zinc-300">{r.jmeno}</div>
                        <div className="text-sm text-zinc-500">{r.sluzba} · {r.telefon}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}

        {/* Rozvrh */}
        {aktivniTab === 'rozvrh' && (
          <div className="flex flex-col gap-4">

            {/* Týdenní rozvrh */}
            <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
              <p className="text-sm text-white font-medium mb-1">Týdenní rozvrh</p>
              <p className="text-xs text-zinc-500 mb-3">Nastavte výchozí hodiny pro každý den v týdnu. Platí opakovaně každý týden.</p>
              <div className="flex gap-2 mb-3 flex-wrap">
                {[['Po',1],['Út',2],['St',3],['Čt',4],['Pá',5],['So',6]].map(([label, den]) => {
                  const pocet = opakovani.filter(o => o.den_tydne === den).length
                  return (
                    <button key={den} onClick={() => setVybranyDenTydne(vybranyDenTydne === den ? null : den)}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-all flex flex-col items-center min-w-10 ${
                        vybranyDenTydne === den ? 'bg-white text-black' : pocet > 0 ? 'bg-green-950 text-green-300 border border-green-800' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                      }`}>
                      <span>{label}</span>
                      {pocet > 0 && <span className="text-xs opacity-60">{pocet}h</span>}
                    </button>
                  )
                })}
              </div>
              {vybranyDenTydne && (
                <div className="grid grid-cols-4 gap-2">
                  {CASY.map(c => {
                    const aktivni = opakovani.some(o => o.den_tydne === vybranyDenTydne && nc(o.cas) === nc(c))
                    return (
                      <button key={c} onClick={() => toggleOpakovani(vybranyDenTydne, c)}
                        className={`p-2.5 rounded-xl text-sm font-medium transition-all ${
                          aktivni ? 'bg-green-900 text-green-300 border border-green-700' :
                          'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-500'
                        }`}>
                        {c}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Výjimka pro konkrétní den */}
            <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
              <p className="text-sm text-white font-medium mb-1">Výjimka pro konkrétní den</p>
              <p className="text-xs text-zinc-500 mb-3">Přepíše týdenní rozvrh jen pro vybraný datum.</p>
              <input type="date" value={vybranyDenDost} onChange={e => setVybranyDenDost(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-zinc-500" />
            </div>
            {vybranyDenDost && (
              <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
                <p className="text-sm text-zinc-400 mb-3">Hodiny pro {formatDatum(vybranyDenDost)}</p>
                <div className="grid grid-cols-4 gap-2">
                  {CASY.map(c => {
                    const dostupny = dostupnost.some(d => d.datum === vybranyDenDost && nc(d.cas) === nc(c))
                    const obsazen = rezervace.some(r => r.datum === vybranyDenDost && nc(r.cas) === nc(c))
                    return (
                      <button key={c} onClick={() => toggleDostupnost(c)}
                        className={`p-2.5 rounded-xl text-sm font-medium transition-all relative ${
                          obsazen && dostupny ? 'bg-blue-900 text-blue-200 border border-blue-700' :
                          dostupny ? 'bg-green-900 text-green-300 border border-green-700' :
                          'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-500'
                        }`}>
                        {c}
                        {obsazen && <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full"></span>}
                      </button>
                    )
                  })}
                </div>
                <div className="flex gap-4 mt-3 text-xs text-zinc-500">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-green-900 border border-green-700 inline-block"></span>Dostupné</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-blue-900 border border-blue-700 inline-block"></span>Obsazené</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-zinc-800 border border-zinc-700 inline-block"></span>Nedostupné</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Blokovat dny */}
        {aktivniTab === 'dny' && (
          <div>
            <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 flex gap-2 mb-3">
              <input type="date" value={novyDatum} onChange={e => setNovyDatum(e.target.value)}
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-zinc-500" />
              <button onClick={blokovatDen} className="bg-white text-black px-4 py-2 rounded-xl text-sm font-medium">
                Zavřít
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {blokovane.length === 0 && <div className="bg-zinc-900 rounded-2xl p-6 text-center text-zinc-500 border border-zinc-800">Žádné zavřené dny</div>}
              {blokovane.map(b => (
                <div key={b.id} className="bg-zinc-900 rounded-2xl p-4 flex items-center justify-between border border-zinc-800">
                  <span className="text-white font-medium">{formatDatum(b.datum)}</span>
                  <button onClick={() => odblokovatDen(b.id)} className="text-xs text-zinc-400 border border-zinc-700 px-3 py-1.5 rounded-xl hover:border-zinc-500 transition-all">
                    Otevřít
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
