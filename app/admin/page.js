'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function Admin() {
  const [rezervace, setRezervace] = useState([])
  const [blokovane, setBlokovane] = useState([])
  const [novyDatum, setNovyDatum] = useState('')
  const [nacitani, setNacitani] = useState(true)
  const [aktivniTab, setAktivniTab] = useState('rezervace')

  useEffect(() => {
    nactiData()
  }, [])

  async function nactiData() {
    setNacitani(true)
    const { data: rez } = await supabase
      .from('rezervace')
      .select('*')
      .order('datum', { ascending: true })
      .order('cas', { ascending: true })
    
    const { data: blok } = await supabase
      .from('blokovane_dny')
      .select('*')
      .order('datum', { ascending: true })

    if (rez) setRezervace(rez)
    if (blok) setBlokovane(blok)
    setNacitani(false)
  }

  async function zrusitRezervaci(id) {
    if (!confirm('Opravdu zrušit tuto rezervaci?')) return
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

  const dnes = new Date().toISOString().split('T')[0]
  const dnesniRezervace = rezervace.filter(r => r.datum === dnes)
  const budouciRezervace = rezervace.filter(r => r.datum > dnes)

  if (nacitani) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400">Načítám...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold mb-1">Admin panel</h1>
        <p className="text-gray-500 mb-6">Správa rezervací</p>

        {/* Statistiky */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <div className="text-2xl font-semibold">{dnesniRezervace.length}</div>
            <div className="text-xs text-gray-500 mt-1">Dnes</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <div className="text-2xl font-semibold">{budouciRezervace.length}</div>
            <div className="text-xs text-gray-500 mt-1">Nadcházející</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <div className="text-2xl font-semibold">{rezervace.length}</div>
            <div className="text-xs text-gray-500 mt-1">Celkem</div>
          </div>
        </div>

        {/* Taby */}
        <div className="flex gap-2 mb-4">
          <button onClick={() => setAktivniTab('rezervace')}
            className={`px-4 py-2 rounded-xl text-sm font-medium ${aktivniTab === 'rezervace' ? 'bg-black text-white' : 'bg-white text-gray-500 shadow-sm'}`}>
            Rezervace
          </button>
          <button onClick={() => setAktivniTab('rozvrh')}
            className={`px-4 py-2 rounded-xl text-sm font-medium ${aktivniTab === 'rozvrh' ? 'bg-black text-white' : 'bg-white text-gray-500 shadow-sm'}`}>
            Blokované dny
          </button>
        </div>

        {/* Rezervace */}
        {aktivniTab === 'rezervace' && (
          <div className="flex flex-col gap-3">
            {rezervace.length === 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm text-center text-gray-400">
                Žádné rezervace
              </div>
            )}
            {rezervace.map(r => (
              <div key={r.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4">
                <div className="text-center min-w-12">
                  <div className="text-xs text-gray-400">{r.datum}</div>
                  <div className="font-semibold">{r.cas?.slice(0,5)}</div>
                </div>
                <div className="flex-1">
                  <div className="font-medium">{r.jmeno}</div>
                  <div className="text-sm text-gray-500">{r.sluzba} · {r.telefon}</div>
                </div>
                <button onClick={() => zrusitRezervaci(r.id)}
                  className="text-xs text-red-400 border border-red-200 px-3 py-1.5 rounded-xl">
                  Zrušit
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Blokované dny */}
        {aktivniTab === 'rozvrh' && (
          <div>
            <div className="bg-white rounded-2xl p-4 shadow-sm mb-3 flex gap-2">
              <input type="date" value={novyDatum} onChange={e => setNovyDatum(e.target.value)}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-black" />
              <button onClick={blokovatDen}
                className="bg-black text-white px-4 py-2 rounded-xl text-sm">
                Zablokovat
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {blokovane.length === 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm text-center text-gray-400">
                  Žádné blokované dny
                </div>
              )}
              {blokovane.map(b => (
                <div key={b.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between">
                  <span className="text-sm font-medium">{b.datum}</span>
                  <button onClick={() => odblokovatDen(b.id)}
                    className="text-xs text-red-400 border border-red-200 px-3 py-1.5 rounded-xl">
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
