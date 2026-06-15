import { createFileRoute, Link } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { ChevronLeft, Save } from 'lucide-react'
import { useState, useEffect, Suspense } from 'react'

export const Route = createFileRoute('/distances')({
  component: DistancesWrapper,
})

function DistancesWrapper() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white p-6 uppercase font-black">Loading Bag...</div>}>
      <DistancesPage />
    </Suspense>
  )
}

function DistancesPage() {
  const { data: clubs } = useSuspenseQuery(convexQuery(api.clubs.list, {}))
  const updateClub = useMutation(api.clubs.update)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [editBrand, setEditBrand] = useState('')
  const [editModel, setEditModel] = useState('')
  const [editNotes, setEditNotes] = useState('')

  const { data: activeRound } = useSuspenseQuery(convexQuery(api.rounds.getActive, {}))
  const updateBall = useMutation(api.rounds.updateBall)
  const updateBallCondition = useMutation(api.rounds.updateBallCondition)
  const seedClubs = useMutation(api.clubs.seed)
  const startRound = useMutation(api.rounds.start)

  const balls = ['Srixon Soft Feel', 'Srixon Z-Star', 'Titleist Pro V1', 'TaylorMade TP5']
  const conditions = [
    { id: 'new', label: 'New' },
    { id: 'second-hand', label: 'Second Hand' }
  ]

  const brands = ['Srixon', 'Cleveland', 'Titleist', 'TaylorMade', 'Ping', 'Callaway', 'Odyssey']
  const models = {
    'Srixon': ['ZX7', 'ZX5', 'Z-Star'],
    'Cleveland': ['RTX', 'CBX'],
    'Titleist': ['T100', 'T200', 'Vokey'],
    'TaylorMade': ['P790', 'Stealth'],
    'Odyssey': ['White Hot', 'Toulon']
  } as any

  return (
    <main className="min-h-screen bg-black text-white p-6 max-w-md mx-auto">
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-2.5 bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-full text-lime-400 border border-white/20 shadow-[0_2px_10px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.2)] active:scale-90 transition-all relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-40 pointer-events-none" />
            <ChevronLeft size={24} className="relative z-10" />
          </Link>
          <h1 className="text-2xl font-black uppercase tracking-tighter italic text-lime-400 drop-shadow-md">Bag & Gear</h1>
        </div>
        <button 
          onClick={async () => {
            if (confirm("Reset bag to the full iron set? Current distances will be overwritten.")) {
              await seedClubs({ force: true })
              window.location.reload()
            }
          }}
          className="text-[9px] font-black uppercase text-lime-400 bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl border border-white/20 shadow-[0_2px_10px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.2)] px-4 py-2.5 rounded-full active:scale-95 transition-all relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-40 pointer-events-none" />
          <span className="relative z-10">Reset Bag</span>
        </button>
      </header>

      {/* Ball Selector & Condition */}
      <section className="mb-10 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
        <h2 className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Ball in Play</h2>
        
        <div className="grid grid-cols-2 gap-3 mb-6">
          {balls.map(ball => (
            <button
              key={ball}
              onClick={async () => {
                if (activeRound) {
                  await updateBall({ id: activeRound._id, ball })
                } else {
                  await startRound({ ball })
                }
              }}
              className={`py-3.5 px-4 rounded-2xl text-[10px] font-black uppercase border-2 transition-all backdrop-blur-lg ${
                activeRound?.currentBall === ball 
                  ? 'bg-lime-400 text-black border-lime-400 shadow-[0_0_30px_rgba(163,230,53,0.3)]' 
                  : 'bg-white/5 text-zinc-500 border-white/5 active:bg-white/10'
              }`}
            >
              {ball}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          {conditions.map(cond => (
            <button
              key={cond.id}
              onClick={async () => {
                if (activeRound) {
                  await updateBallCondition({ id: activeRound._id, condition: cond.id as any })
                } else {
                  alert("Please start a round first to specify ball condition.")
                }
              }}
              className={`flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase border-2 transition-all backdrop-blur-lg ${
                activeRound?.ballCondition === cond.id
                  ? 'bg-lime-400 text-black border-lime-400 shadow-[0_0_30px_rgba(163,230,53,0.3)]' 
                  : 'bg-white/5 text-zinc-500 border-white/5 active:bg-white/10'
              }`}
            >
              {cond.label}
            </button>
          ))}
        </div>
      </section>

      <div className="space-y-5 pb-12">
        <h2 className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2 px-1">Club Gapping</h2>
        {clubs.map((club) => (
          <div 
            key={club._id}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] flex flex-col gap-2"
          >
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <span className="font-black text-white uppercase text-sm tracking-tight">{club.name}</span>
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">{club.brand} {club.model}</span>
              </div>
              {editingId === club._id ? (
                <button 
                  onClick={async () => {
                    await updateClub({ 
                      id: club._id, 
                      distance: parseInt(editValue) || club.distance,
                      brand: editBrand || club.brand,
                      model: editModel || club.model,
                      notes: editNotes || club.notes
                    })
                    setEditingId(null)
                  }}
                  className="bg-lime-400 text-black p-3 rounded-2xl shadow-lg active:scale-90 transition-all"
                >
                  <Save size={20} />
                </button>
              ) : (
                <button 
                  onClick={() => {
                    setEditingId(club._id)
                    setEditValue(club.distance.toString())
                    setEditBrand(club.brand || '')
                    setEditModel(club.model || '')
                    setEditNotes(club.notes || '')
                  }}
                  className="text-lime-400 font-black uppercase text-[10px] tracking-widest bg-lime-400/10 px-3 py-1.5 rounded-full border border-lime-400/20 active:bg-lime-400 active:text-black transition-all"
                >
                  Edit
                </button>
              )}
            </div>

            <div className="flex items-baseline gap-2 mt-1">
              {editingId === club._id ? (
                <div className="flex flex-col gap-3 w-full">
                  <div className="flex items-baseline gap-2">
                    <input 
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="bg-white/5 border border-white/10 text-4xl font-black w-28 rounded-2xl px-4 py-2 text-lime-400 outline-none"
                      autoFocus
                    />
                    <span className="text-xl font-black text-zinc-600 uppercase">m</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <select 
                      value={editBrand}
                      onChange={(e) => setEditBrand(e.target.value)}
                      className="bg-white/5 border border-white/10 text-[10px] font-black uppercase text-white rounded-xl p-3 outline-none appearance-none"
                    >
                      <option value="">Brand</option>
                      {brands.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                    <select 
                      value={editModel}
                      onChange={(e) => setEditModel(e.target.value)}
                      className="bg-white/5 border border-white/10 text-[10px] font-black uppercase text-white rounded-xl p-3 outline-none appearance-none"
                    >
                      <option value="">Model</option>
                      {editBrand && models[editBrand]?.map((m: string) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <input 
                    type="text"
                    placeholder="Strategy Notes..."
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="bg-white/5 border border-white/10 text-[10px] font-black uppercase text-zinc-300 rounded-xl p-3 w-full outline-none"
                  />
                </div>
              ) : (
                <>
                  <span className="text-5xl font-black text-white italic tracking-tighter">{club.distance}</span>
                  <span className="text-xl font-black text-lime-400 uppercase">m</span>
                </>
              )}
            </div>

            {editingId !== club._id && club.notes && (
              <p className="text-[10px] text-zinc-500 uppercase font-black tracking-wider mt-1 border-t border-white/5 pt-2">{club.notes}</p>
            )}
          </div>
        ))}
      </div>
    </main>
  )
}
