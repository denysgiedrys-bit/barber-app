'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const CASY = ['9:00','9:30','10:00','10:30','11:00','11:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30']

export default function Admin() {
  const [rezervace, setRezervace] = useState([])
  const [blokovane, setBlokovane] = useState([])
  const [blokovaneHodiny, setBlokovaneHodiny] = useState([])
  const [novyDatum, setNovyDatum] = useState('')
  const [vybranyDen, setVybranyDen] = useState('')
  const [nacitani, setNacitani] = useState(true)
  const [aktivniTab, setAktivniTab] = useState('rezervace')

  useEffect(() => { nactiData() }, [])

  async function nactiData() {
    setNacitani(true)
    const { data: rez } = await supabase.from('rezervace').select('*').order('datum').order('cas')
    const { data: blok } = await supabase.from('blokovane_dny').select('*').order('datum')
    const { data: hod } = await supabase.from('blokovane_hodiny').select('*')
    if (rez) setRezervace(rez)
    if (blok) setBlokovane(blok)
    if (hod) setBlokovaneHodiny(hod)
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
    const existuje = blokovaneHodiny.find(h => h.datum === vybranyDen && h.cas.slice(0,5) === cas)
    if (existuje) {
      await supabase.from('blokovane_hodiny').delete().eq('id', existuje.id)
    } else {
      await supabase.from('blokovane_hodiny').insert({ datum: vybranyDen, cas })
    }
    nactiData()
  }

  const dnes = new Date().toISOString().split('T')[0]
  const dnesniRez = rezervace.filter(r => r.datum === dnes)
  const budouciRez = rezervace.filter(r => r.datum > dnes)

  if (nacitani) return <div className="min-h-screen flex items-center justify-center bg-zinc-950"><p className="text-zinc-400">Načítám...</p></div>

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1 text-white">Admin panel</h1>
        <p className="text-zinc-400 mb-6 text-sm">Správa rezervací a rozvrhu</p>

        {/* Statistiky */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[['Dnes', dnesniRez.length], ['Nadcházející', budouciRez.length], ['Celkem', rezervace.length]].map(([label, val]) => (
            <div key={label} className="bg-zinc-900 rounded-2xl p-4 text-center border border-zinc-800">
              <div className="text-3xl font-bold text-white">{val}</div>
              <div className="text-xs text-zinc-400 mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Taby */}
        <div className="flex gap-2 mb-5">
          {[['rezervace','Rezervace'],['hodiny','Blokovat hodiny'],['dny','Blokovat dny']].map(([id, label]) => (
            <button key={id} onClick={() => setAktivniTab(id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${aktivniTab === id ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Rezervace */}
        {aktivniTab === 'rezervace' && (
          <div className="flex flex-col gap-2">
            {rezervace.length === 0 && <div className="bg-zinc-900 rounded-2xl p-6 text-center text-zinc-500 border border-zinc-800">Žádné rezervace</div>}
            {rezervace.map(r => (
              <div key={r.id} className="bg-zinc-900 rounded-2xl p-4 flex items-center gap-4 border border-zinc-800">
                <div className="text-center min-w-14">
                  <div className="text-xs text-zinc-500">{r.datum}</div>
                  <div className="font-bold text-white text-lg">{r.cas?.slice(0,5)}</div>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-white">{r.jmeno}</div>
                  <div className="text-sm text-zinc-400">{r.sluzba} · {r.telefon}</div>
                </div>
                <button onClick={() => zrusitRezervaci(r.id)} className="text-xs text-red-400 border border-red-900 px-3 py-1.5 rounded-xl hover:bg-red-950 transition-all">
                  Zrušit
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Blokovat hodiny */}
        {aktivniTab === 'hodiny' && (
          <div>
            <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 mb-4">
              <p className="text-sm text-zinc-400 mb-3">Vyberte den</p>
              <input type="date" value={vybranyDen} onChange={e => setVybranyDen(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-zinc-500" />
            </div>
            {vybranyDen && (
              <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
                <p className="text-sm text-zinc-400 mb-3">Klikněte na hodiny které chcete zablokovat</p>
                <div className="grid grid-cols-4 gap-2">
                  {CASY.map(c => {
                    const zablokovan = blokovaneHodiny.some(h => h.datum === vybranyDen && h.cas.slice(0,5) === c)
                    return (
                      <button key={c} onClick={() => toggleHodina(c)}
                        className={`p-2.5 rounded-xl text-sm font-medium transition-all ${zablokovan ? 'bg-red-900 text-red-300 border border-red-700' : 'bg-zinc-800 text-zinc-300 border border-zinc-700 hover:border-zinc-500'}`}>
                        {c}
                      </button>
                    )
                  })}
                </div>
                <p className="text-xs text-zinc-600 mt-3">Červené = zablokované</p>
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
                Zablokovat
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {blokovane.length === 0 && <div className="bg-zinc-900 rounded-2xl p-6 text-center text-zinc-500 border border-zinc-800">Žádné blokované dny</div>}
              {blokovane.map(b => (
                <div key={b.id} className="bg-zinc-900 rounded-2xl p-4 flex items-center justify-between border border-zinc-800">
                  <span className="text-white font-medium">{b.datum}</span>
                  <button onClick={() => odblokovatDen(b.id)} className="text-xs text-red-400 border border-red-900 px-3 py-1.5 rounded-xl hover:bg-red-950 transition-all">
                    Odblokovat
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