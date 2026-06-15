import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect, useRef, Suspense } from 'react'
import { Mic, ChevronRight, ChevronLeft, Utensils, X, Brain, Compass, Target, Wind, Thermometer, CloudRain, Plus, Minus, BarChart3, Zap, Settings, Waves, LogOut, MapPin, Map as MapIcon, ShieldAlert } from 'lucide-react'
import { useMutation, useAction } from 'convex/react'
import { useAuthActions } from "@convex-dev/auth/react"
import { useSuspenseQuery, useQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { api } from '../../convex/_generated/api'
import confetti from 'canvas-confetti'

export const Route = createFileRoute('/')({
  component: HomeWrapper,
})

function HomeWrapper() {
  const [mounted, setMounted] = useState(false)
  const [showBall, setShowBall] = useState(true)

  useEffect(() => {
    setMounted(true)
    const timer = setTimeout(() => setShowBall(false), 200)
    return () => clearTimeout(timer)
  }, [])

  if (!mounted) {
    return (
      <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center overflow-hidden">
        <div className="relative">
          {showBall && (
            <div className="absolute w-4 h-4 bg-lime-400 rounded-full animate-golf-ball shadow-[0_0_15px_rgba(163,230,53,0.8)] z-10" />
          )}
          <h1 className="text-5xl font-extrabold italic text-lime-400 animate-text-reveal opacity-0" style={{ animationDelay: '0.4s' }}>
            FAIRWAY FOIL
          </h1>
        </div>
      </main>
    )
  }

  return (
    <Suspense fallback={
      <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center overflow-hidden">
        <div className="relative">
          <div className="absolute w-4 h-4 bg-lime-400 rounded-full animate-golf-ball shadow-[0_0_15px_rgba(163,230,53,0.8)] z-10" />
          <h1 className="text-5xl font-extrabold italic text-lime-400 animate-text-reveal opacity-0" style={{ animationDelay: '0.4s' }}>
            FAIRWAY FOIL
          </h1>
        </div>
      </main>
    }>
      <Home />
    </Suspense>
  )
}

function Home() {
  const { data: activeRound } = useSuspenseQuery(convexQuery(api.rounds.getActive, {}))
  const { data: clubs } = useSuspenseQuery(convexQuery(api.clubs.list, {}))
  
  // UseQuery for dependent data to avoid suspense loops on nulls
  const scoresQuery = useQuery({ ...convexQuery(api.scores.getForRound, { roundId: activeRound?._id as any }), enabled: !!activeRound })
  const scores = scoresQuery.data ?? []

  const activeCourseQuery = useQuery({ ...convexQuery(api.courses.getById, { id: activeRound?.courseId as any }), enabled: !!activeRound?.courseId })
  const activeCourse = activeCourseQuery.data

  const previousRoundQuery = useQuery({ ...convexQuery(api.rounds.getPreviousRound, { courseName: activeRound?.courseName || '' }), enabled: !!activeRound })
  const previousRound = previousRoundQuery.data
  
  const { signOut } = useAuthActions()
  const startRound = useMutation(api.rounds.start)
  const endRound = useMutation(api.rounds.end)
  const updateHole = useMutation(api.rounds.updateHole)
  const askCaddie = useAction(api.caddie.ask)
  const syncLocation = useMutation(api.rounds.updateLocation)
  const updateWeather = useAction(api.weather.updateWeather)
  const saveScore = useMutation(api.scores.saveHoleScore)
  const calibrateHole = useMutation(api.courses.calibrateHole)
  const addHazard = useMutation(api.courses.addHazard)
  const autoEnrich = useAction(api.osm.enrichCourse)

  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [advice, setAdvice] = useState<string | null>(null)
  const [isThinking, setIsThinking] = useState(false)
  const [showNutrition, setShowNutrition] = useState(false)
  const [showSetup, setShowSetup] = useState(false)
  const [showScorePopup, setShowScorePopup] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const [showCalibration, setShowCalibration] = useState(false)
  const [celebration, setCelebration] = useState<{ title: string, subtitle: string } | null>(null)

  const [hazardForm, setHazardForm] = useState<{ name: string, type: 'bunker' | 'water' | 'tree' | 'waste' } | null>(null)

  // Location and Course Detection
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null)
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null)
  const [isSignalLow, setIsSignalLow] = useState(false)

  // Background Recon
  const lastEnrichedRef = useRef<string | null>(null)
  useEffect(() => {
    if (activeRound?._id && location && activeRound.courseId) {
      const reconKey = `${activeRound.courseId}-${activeRound.currentHole}`
      if (lastEnrichedRef.current !== reconKey) {
        lastEnrichedRef.current = reconKey
        autoEnrich({ 
          courseId: activeRound.courseId as any, 
          lat: location.lat, 
          lng: location.lng 
        })
      }
    }
  }, [activeRound?._id, location, activeRound?.courseId, activeRound?.currentHole])
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.error("Location error:", err)
    )
  }, [])

  const nearestCourseQuery = useQuery({ ...convexQuery(api.courses.getNearest, location || { lat: 0, lng: 0 }), enabled: !activeRound && !!location })
  const nearestCourse = nearestCourseQuery.data

  // Score Input State
  const [tempStrokes, setTempStrokes] = useState(4)
  const [tempFairway, setTempFairway] = useState<'hit' | 'left' | 'right' | 'miss'>('hit')
  const [tempBunker, setTempBunker] = useState(false)
  const [tempPenalty, setTempPenalty] = useState(0)
  const [tempGIR, setTempGIR] = useState(false)
  const [tempPutts, setTempPutts] = useState(2)

  // Round Setup State
  const [tees, setTees] = useState('White')
  const [handicap, setHandicap] = useState(18)
  const [startingHole, setStartingHole] = useState(1)
  const [ballType, setBallType] = useState('Srixon Soft Feel')
  const [customBall, setCustomBall] = useState('')
  const [ballCondition, setBallCondition] = useState<'new' | 'second-hand'>('new')
  const [distanceWalkedOnHole, setDistanceWalkedOnHole] = useState(0)

  const balls = ['Srixon Soft Feel', 'Srixon Z-Star', 'Titleist Pro V1', 'TaylorMade TP5', 'Bridgestone Tour B', 'Callaway Chrome Soft', 'Other']
  const conditions = [
    { id: 'new' as const, label: 'Brand New' },
    { id: 'second-hand' as const, label: 'Second Hand' }
  ]
  
  const recognitionRef = useRef<any>(null)
  const lastLocationRef = useRef<{ lat: number, lng: number } | null>(null)
  const teeLocationRef = useRef<{ lat: number, lng: number } | null>(null)
  const totalWalkedRef = useRef(0)

  useEffect(() => {
    setDistanceWalkedOnHole(0)
    teeLocationRef.current = lastLocationRef.current
  }, [activeRound?.currentHole])

  useEffect(() => {
    if (activeRound) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords
          setLocation({ lat: latitude, lng: longitude })
          setGpsAccuracy(accuracy)
          setIsSignalLow(accuracy > 35)

          if (lastLocationRef.current) {
            const dist = calculateDistance(
              lastLocationRef.current.lat, 
              lastLocationRef.current.lng,
              latitude,
              longitude
            )
            totalWalkedRef.current += dist
          }
          lastLocationRef.current = { lat: latitude, lng: longitude }
          
          if (!teeLocationRef.current) {
            teeLocationRef.current = { lat: latitude, lng: longitude }
          }

          const fromTee = calculateDistance(
            teeLocationRef.current.lat,
            teeLocationRef.current.lng,
            latitude,
            longitude
          )
          setDistanceWalkedOnHole(fromTee)

          syncLocation({ 
            id: activeRound._id, 
            lat: latitude, 
            lng: longitude,
            distanceWalked: totalWalkedRef.current
          })
        },
        null,
        { enableHighAccuracy: true }
      )
      return () => navigator.geolocation.clearWatch(watchId)
    }
  }, [activeRound, syncLocation])

  useEffect(() => {
    if (activeRound && activeRound.lastLat && activeRound.lastLng) {
      updateWeather({ 
        roundId: activeRound._id, 
        lat: activeRound.lastLat, 
        lng: activeRound.lastLng 
      })
    }
  }, [activeRound?.currentHole, updateWeather])

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3
    const φ1 = lat1 * Math.PI / 180
    const φ2 = lat2 * Math.PI / 180
    const Δφ = (lat2 - lat1) * Math.PI / 180
    const Δλ = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  const fireCelebration = (title: string, subtitle: string, type: 'hio' | 'fairway' | 'gir') => {
    setCelebration({ title, subtitle })
    if (type === 'hio') {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#a3e635', '#ffffff', '#fbbf24'] })
    } else {
      confetti({ particleCount: 80, spread: 50, origin: { y: 0.7 }, colors: ['#a3e635'] })
    }
    setTimeout(() => setCelebration(null), 4000)
  }

  const holeData = activeCourse?.holes.find(h => h.number === (activeRound?.currentHole ?? 1)) || {
    par: 4, length: 350, elevation: "Level", layout: "Straight", comment: "No course data available.", line: "Consult the local caddie.",
    greenCenter: null
  }

  const scoreToPar = scores?.reduce((acc, s) => {
    const hole = activeCourse?.holes.find(h => h.number === s.hole)
    return acc + (s.strokes - (hole?.par || 4))
  }, 0) || 0

  const totalCoursePar = activeCourse?.holes.reduce((acc, h) => acc + h.par, 0) || 72
  const projectedScore = scoreToPar + totalCoursePar

  const remainingDistance = holeData.length - distanceWalkedOnHole
  const recClub = clubs?.filter(c => c.distance <= remainingDistance).sort((a, b) => b.distance - a.distance)[0]

  const distToGreenCenter = activeRound?.lastLat && activeRound?.lastLng && holeData.greenCenter
    ? calculateDistance(activeRound.lastLat, activeRound.lastLng, holeData.greenCenter.lat, holeData.greenCenter.lng)
    : null

  const distToGreenFront = activeRound?.lastLat && activeRound?.lastLng && holeData.greenFront
    ? calculateDistance(activeRound.lastLat, activeRound.lastLng, holeData.greenFront.lat, holeData.greenFront.lng)
    : null

  const distToGreenBack = activeRound?.lastLat && activeRound?.lastLng && holeData.greenBack
    ? calculateDistance(activeRound.lastLat, activeRound.lastLng, holeData.greenBack.lat, holeData.greenBack.lng)
    : null

  const hazardsDistances = (holeData.hazards || []).map(h => ({
    ...h,
    distance: activeRound?.lastLat && activeRound?.lastLng 
      ? calculateDistance(activeRound.lastLat, activeRound.lastLng, h.location.lat, h.location.lng)
      : null
  }))

  if (!activeRound) {
    return (
      <main className="min-h-screen bg-black text-white p-6 flex flex-col relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-lime-400/10 blur-[100px] -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-lime-400/5 blur-[100px] -ml-32 -mb-32" />

        <header className="mb-12 flex justify-between items-center relative z-10">
          <div>
            <h1 className="text-4xl font-black italic text-lime-400 tracking-tighter">FAIRWAY FOIL</h1>
            <p className="text-zinc-500 uppercase tracking-[0.3em] text-[10px] font-bold">Tactical Strategic Partner</p>
          </div>
          <button onClick={() => void signOut()} className="p-3 rounded-2xl bg-white/5 border border-white/10 text-zinc-500 hover:text-red-400 transition-colors">
            <LogOut size={20} />
          </button>
        </header>

        <div className="flex-1 flex flex-col justify-center relative z-10">
          <div className="mb-8">
             {nearestCourse ? (
               <div className="bg-gradient-to-br from-lime-400/20 to-transparent p-6 rounded-[2.5rem] border border-lime-400/20 backdrop-blur-xl mb-6">
                 <div className="flex items-center gap-2 text-lime-400 text-[10px] font-black uppercase tracking-widest mb-2"><MapPin size={12} /> Tactical Location Identified</div>
                 <h2 className="text-3xl font-black italic uppercase text-white mb-1">{nearestCourse.name}</h2>
                 <p className="text-zinc-400 text-xs font-bold uppercase tracking-tight">Nearest Strategic Asset</p>
               </div>
             ) : (
               <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/10 backdrop-blur-xl mb-6 animate-pulse">
                 <p className="text-zinc-500 text-xs font-black uppercase tracking-widest">Scanning for nearest course...</p>
               </div>
             )}
          </div>

          <button 
            onClick={() => setShowSetup(true)}
            className="group relative bg-white text-black py-8 rounded-[3rem] text-3xl font-black uppercase italic tracking-tighter shadow-[0_20px_50px_rgba(163,230,53,0.3)] hover:scale-[1.02] active:scale-95 transition-all overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-lime-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <span className="relative z-10 flex items-center justify-center gap-3">
              Deploy Round <ChevronRight size={32} strokeWidth={3} />
            </span>
          </button>
        </div>

        {showSetup && (
          <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl p-6 flex flex-col animate-in fade-in duration-300 overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black italic uppercase text-lime-400">Tactical Setup</h2>
              <button onClick={() => setShowSetup(false)} className="p-2 text-zinc-500"><X /></button>
            </div>

            <div className="space-y-8 pb-12">
              <section>
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest block mb-4">Strategic Location</label>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                  <span className="font-bold text-white uppercase italic">{nearestCourse?.name || 'Soweto Country Club'}</span>
                  <MapPin size={16} className="text-lime-400" />
                </div>
              </section>

              <div className="grid grid-cols-2 gap-4">
                <section>
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest block mb-4">Tees</label>
                  <select value={tees} onChange={(e) => setTees(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 font-bold text-white uppercase appearance-none outline-none focus:border-lime-400">
                    <option>White</option><option>Blue</option><option>Red</option><option>Yellow</option>
                  </select>
                </section>
                <section>
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest block mb-4">HCP</label>
                  <input type="number" value={handicap} onChange={(e) => setHandicap(Number(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 font-bold text-white outline-none focus:border-lime-400" />
                </section>
              </div>

              <section>
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest block mb-4">Starting Intel</label>
                <div className="grid grid-cols-2 gap-3">
                  {[1, 10].map(h => (
                    <button key={h} onClick={() => setStartingHole(h)} className={`py-4 rounded-2xl font-black uppercase border transition-all ${startingHole === h ? 'bg-lime-400 border-lime-400 text-black' : 'bg-white/5 border-white/10 text-zinc-500'}`}>Hole {h}</button>
                  ))}
                </div>
              </section>

              <section>
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest block mb-4">Ball Asset</label>
                <div className="space-y-4">
                   <select 
                     value={ballType} 
                     onChange={(e) => setBallType(e.target.value)}
                     className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 font-bold text-white uppercase outline-none focus:border-lime-400"
                   >
                     {balls.map(b => <option key={b} value={b}>{b}</option>)}
                   </select>
                   {ballType === 'Other' && (
                     <input 
                       type="text" 
                       placeholder="SPECIFY CUSTOM BALL..."
                       value={customBall}
                       onChange={(e) => setCustomBall(e.target.value)}
                       className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 font-bold text-white outline-none focus:border-lime-400 uppercase italic animate-in slide-in-from-top-2"
                     />
                   )}
                   <div className="grid grid-cols-2 gap-3">
                     {conditions.map(c => (
                       <button 
                         key={c.id} 
                         onClick={() => setBallCondition(c.id)} 
                         className={`py-4 rounded-2xl font-black uppercase border text-[10px] transition-all ${ballCondition === c.id ? 'bg-lime-400 border-lime-400 text-black' : 'bg-white/5 border-white/10 text-zinc-500'}`}
                       >
                         {c.label}
                       </button>
                     ))}
                   </div>
                </div>
              </section>

              <button 
                onClick={() => {
                  startRound({ 
                    ball: ballType === 'Other' ? customBall : ballType, 
                    ballCondition, 
                    courseName: nearestCourse?.name || 'Soweto Country Club',
                    courseId: nearestCourse?._id,
                    tees, 
                    handicap, 
                    startingHole 
                  })
                  setShowSetup(false)
                }}
                className="w-full bg-lime-400 text-black py-6 rounded-3xl text-2xl font-black uppercase italic tracking-tighter shadow-xl active:scale-95 transition-all mt-4"
              >
                Engage Strategy
              </button>
            </div>
          </div>
        )}

        <footer className="mt-8 relative z-10">
          <Link to="/distances" className="flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-[2rem] hover:bg-white/10 transition-colors group">
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-lime-400 border border-zinc-800"><Settings size={20} /></div>
               <div><p className="text-xs font-black uppercase text-white">Equipment Bag</p><p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">Sync Tactical Distances</p></div>
             </div>
             <ChevronRight className="text-zinc-700 group-hover:text-lime-400 transition-colors" />
          </Link>
        </footer>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white p-4 flex flex-col">
      {celebration && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none animate-in fade-in zoom-in duration-300">
           <div className="bg-lime-400 text-black px-12 py-8 rounded-[3rem] shadow-[0_0_100px_rgba(163,230,53,0.5)] text-center transform -rotate-2">
              <h2 className="text-6xl font-black italic uppercase leading-none mb-2">{celebration.title}</h2>
              <p className="text-xl font-bold uppercase tracking-widest opacity-80">{celebration.subtitle}</p>
           </div>
        </div>
      )}

      {showScorePopup && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl p-6 flex flex-col animate-in fade-in duration-300 overflow-y-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black italic uppercase text-lime-400">Post Hole {activeRound.currentHole} Intel</h2>
            <button onClick={() => setShowScorePopup(false)} className="p-2 text-zinc-500"><X /></button>
          </div>

          <div className="space-y-8 flex-1">
            <div className="grid grid-cols-2 gap-6">
              <section>
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest block mb-4">Total Strokes</label>
                <div className="flex items-center bg-white/5 rounded-3xl border border-white/10 overflow-hidden shadow-inner">
                  <button onClick={() => setTempStrokes(Math.max(1, tempStrokes - 1))} className="flex-1 py-6 flex items-center justify-center text-zinc-500 active:text-lime-400 transition-colors"><Minus size={24} strokeWidth={3} /></button>
                  <span className="text-4xl font-black italic min-w-[60px] text-center">{tempStrokes}</span>
                  <button onClick={() => setTempStrokes(tempStrokes + 1)} className="flex-1 py-6 flex items-center justify-center text-zinc-500 active:text-lime-400 transition-colors"><Plus size={24} strokeWidth={3} /></button>
                </div>
              </section>
              <section>
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest block mb-4">Putts</label>
                <div className="flex items-center bg-white/5 rounded-3xl border border-white/10 overflow-hidden shadow-inner">
                  <button onClick={() => setTempPutts(Math.max(0, tempPutts - 1))} className="flex-1 py-6 flex items-center justify-center text-zinc-500 active:text-lime-400 transition-colors"><Minus size={24} strokeWidth={3} /></button>
                  <span className="text-4xl font-black italic min-w-[60px] text-center">{tempPutts}</span>
                  <button onClick={() => setTempPutts(tempPutts + 1)} className="flex-1 py-6 flex items-center justify-center text-zinc-500 active:text-lime-400 transition-colors"><Plus size={24} strokeWidth={3} /></button>
                </div>
              </section>
            </div>

            <section>
              <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest block mb-4">Strategic Outcome</label>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setTempGIR(!tempGIR)} 
                  className={`py-6 rounded-[2rem] font-black uppercase text-xs border-2 transition-all flex items-center justify-center gap-2 backdrop-blur-lg ${tempGIR ? 'bg-lime-400 text-black border-lime-300 shadow-[0_0_20px_rgba(163,230,53,0.3)]' : 'bg-white/5 border-white/10 text-zinc-500'}`}
                >
                  <Target size={20} /> {tempGIR ? 'GIR HIT' : 'GIR MISS'}
                </button>
                <div className="grid grid-cols-3 gap-1">
                  {['left', 'hit', 'right'].map((dir) => (
                    <button 
                      key={dir}
                      onClick={() => setTempFairway(dir as any)}
                      className={`py-6 rounded-2xl font-black uppercase text-[8px] border transition-all ${tempFairway === dir ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 text-zinc-600'}`}
                    >
                      {dir}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="bg-zinc-900/50 p-6 rounded-[2.5rem] border border-zinc-800">
              <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest block mb-4 text-center">Hazard Intel</label>
              <div className="w-full h-px bg-white/5" />
              <div className="flex gap-4 w-full justify-center">
                <button 
                  onClick={() => setTempBunker(!tempBunker)} 
                  className={`flex-1 max-w-[140px] py-4 rounded-2xl font-black uppercase text-xs border-2 transition-all flex items-center justify-center gap-2 backdrop-blur-lg ${tempBunker ? 'bg-orange-500 text-white border-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.3)]' : 'bg-white/5 border-white/10 text-zinc-500'}`}
                >
                  <Waves size={16} /> {tempBunker ? 'In Trap' : 'Clean'}
                </button>
                
                <div className="flex-1 max-w-[140px] flex items-center bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden px-2 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                  <button onClick={() => setTempPenalty(Math.max(0, tempPenalty - 1))} className="flex-1 py-4 flex items-center justify-center text-zinc-500 active:text-white transition-colors"><Minus size={16} /></button>
                  <div className="flex flex-col items-center min-w-[50px]">
                    <span className={`text-sm font-black ${tempPenalty > 0 ? 'text-red-500' : 'text-zinc-500'}`}>{tempPenalty}</span>
                    <span className="text-[7px] font-bold text-zinc-600 uppercase tracking-tighter">Penalty</span>
                  </div>
                  <button onClick={() => setTempPenalty(tempPenalty + 1)} className="flex-1 py-4 flex items-center justify-center text-zinc-500 active:text-white transition-colors"><Plus size={16} /></button>
                </div>
              </div>
            </section>
          </div>

          <button onClick={async () => {
            await saveScore({ roundId: activeRound._id, hole: activeRound.currentHole, strokes: tempStrokes, putts: tempPutts, fairway: tempFairway, bunker: tempBunker, penalty: tempPenalty, greenInRegulation: tempGIR });
            if (tempStrokes === 1) fireCelebration("HOLE IN ONE!", "Absolute Legend.", 'hio')
            else if (tempFairway === 'hit' && holeData.par > 3) fireCelebration("Fairway Hit!", "Strategic Accuracy.", 'fairway')
            else if (tempGIR) fireCelebration("GIR Achieved!", "Pure Ball Striking.", 'gir')
            setShowScorePopup(false)
          }} className="bg-lime-400 text-black py-6 rounded-3xl text-2xl font-black uppercase italic tracking-tighter shadow-xl active:scale-95 transition-all mt-4">
            Post To Scorecard
          </button>
        </div>
      )}

      {showCalibration && activeRound && (
        <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-2xl p-6 flex flex-col animate-in fade-in duration-300 overflow-y-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black italic uppercase text-lime-400">Live Calibration</h2>
            <button onClick={() => { setShowCalibration(false); setHazardForm(null); }} className="p-2 text-zinc-500"><X /></button>
          </div>

          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-8 border-l-2 border-lime-400 pl-4">
            Stand at the physical location and tap to lock coordinates for Hole {activeRound.currentHole}.
          </p>

          <div className="space-y-6">
            <section className="bg-white/5 p-6 rounded-[2rem] border border-white/10">
               <label className="text-[10px] font-black uppercase text-zinc-500 mb-4 block">Green Calibration</label>
               <div className="grid grid-cols-1 gap-3">
                  {['front', 'center', 'back'].map((type) => (
                    <button 
                      key={type}
                      onClick={async () => {
                        if (!location) return alert("No GPS signal");
                        await calibrateHole({ 
                          courseId: activeRound.courseId as any, 
                          holeNumber: activeRound.currentHole, 
                          type: type as any, 
                          lat: location.lat, 
                          lng: location.lng 
                        });
                        fireCelebration("Locked!", `Green ${type} coordinates updated.`, 'gir');
                      }}
                      className="w-full bg-zinc-900 border border-white/10 hover:border-lime-400 py-4 rounded-2xl flex items-center justify-between px-6 transition-all active:scale-95"
                    >
                      <span className="font-black uppercase italic text-white text-sm">Capture Green {type}</span>
                      <Target size={16} className="text-lime-400" />
                    </button>
                  ))}
               </div>
            </section>

            <section className="bg-white/5 p-6 rounded-[2rem] border border-white/10">
               <label className="text-[10px] font-black uppercase text-zinc-500 mb-4 block">Mark Hazard</label>
               {!hazardForm ? (
                 <button 
                   onClick={() => setHazardForm({ name: '', type: 'bunker' })}
                   className="w-full bg-lime-400 text-black py-4 rounded-2xl font-black uppercase italic text-sm flex items-center justify-center gap-2"
                 >
                   <Plus size={18} strokeWidth={3} /> Add Hazard at current spot
                 </button>
               ) : (
                 <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
                    <input 
                      type="text" 
                      placeholder="HAZARD NAME (e.g. Left Bunker)"
                      value={hazardForm.name}
                      onChange={(e) => setHazardForm({...hazardForm, name: e.target.value})}
                      className="w-full bg-black border border-white/10 rounded-xl p-4 font-bold text-white uppercase outline-none focus:border-lime-400"
                    />
                    <div className="grid grid-cols-2 gap-2">
                       {['bunker', 'water', 'tree', 'waste'].map((t) => (
                         <button 
                           key={t}
                           onClick={() => setHazardForm({...hazardForm, type: t as any})}
                           className={`py-3 rounded-xl font-black uppercase text-[10px] border transition-all ${hazardForm.type === t ? 'bg-white text-black border-white' : 'bg-zinc-900 border-white/5 text-zinc-500'}`}
                         >
                           {t}
                         </button>
                       ))}
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => setHazardForm(null)} className="flex-1 bg-zinc-900 text-zinc-500 py-4 rounded-2xl font-black uppercase text-xs">Cancel</button>
                       <button 
                         onClick={async () => {
                           if (!location || !hazardForm.name) return;
                           await addHazard({
                             courseId: activeRound.courseId as any,
                             holeNumber: activeRound.currentHole,
                             name: hazardForm.name,
                             type: hazardForm.type,
                             lat: location.lat,
                             lng: location.lng
                           });
                           setHazardForm(null);
                           fireCelebration("Hazard Set!", "Target added to tactical overlay.", 'fairway');
                         }}
                         className="flex-[2] bg-lime-400 text-black py-4 rounded-2xl font-black uppercase italic text-sm"
                       >
                         Lock Hazard
                       </button>
                    </div>
                 </div>
               )}
            </section>
          </div>

          <button 
            onClick={() => setShowCalibration(false)}
            className="mt-auto w-full bg-white text-black py-5 rounded-3xl font-black uppercase italic tracking-tighter"
          >
            Finish Calibration
          </button>
        </div>
      )}

      {showMap && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col animate-in slide-in-from-bottom-full duration-500">
           <header className="p-6 flex justify-between items-center border-b border-white/10">
              <h2 className="text-xl font-black italic uppercase text-lime-400">Tactical Map - Hole {activeRound.currentHole}</h2>
              <button onClick={() => setShowMap(false)} className="p-3 bg-white/5 rounded-full"><X /></button>
           </header>
           <div className="flex-1 relative bg-zinc-900">
              {/* Fallback to OSM iFrame for zero-install tactical mapping */}
              <iframe 
                width="100%" 
                height="100%" 
                frameBorder="0" 
                scrolling="no" 
                marginHeight={0} 
                marginWidth={0} 
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${(activeRound.lastLng ?? 27.89)-0.005}%2C${(activeRound.lastLat ?? -26.26)-0.005}%2C${(activeRound.lastLng ?? 27.89)+0.005}%2C${(activeRound.lastLat ?? -26.26)+0.005}&layer=mapnik&marker=${activeRound.lastLat ?? -26.26}%2C${activeRound.lastLng ?? 27.89}`}
              />
              <div className="absolute top-6 left-6 right-6 p-4 bg-black/80 backdrop-blur-xl border border-lime-400/20 rounded-2xl flex items-center justify-between">
                 <div>
                    <p className="text-[10px] font-black uppercase text-zinc-500">GPS Status</p>
                    <p className="text-sm font-bold text-lime-400 uppercase italic">Signal Locked</p>
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-zinc-500">Dist to Pin</p>
                    <p className="text-xl font-black text-white italic">{distToGreenCenter ? Math.round(distToGreenCenter) : '---'}m</p>
                 </div>
              </div>
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[90%] bg-zinc-950/90 border border-white/10 rounded-[2rem] p-6 backdrop-blur-2xl">
                 <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-lime-400 flex items-center justify-center text-black"><Compass size={24} /></div>
                    <div>
                       <p className="text-xs font-black uppercase text-white">Target identified</p>
                       <p className="text-[10px] text-zinc-500 font-bold uppercase">{activeRound.courseName}</p>
                    </div>
                 </div>
                 <button onClick={() => setShowMap(false)} className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase italic tracking-tighter">Return to Caddie</button>
              </div>
           </div>
        </div>
      )}

      <div className="bg-zinc-900/80 backdrop-blur-md -mx-4 px-4 py-2 border-b border-zinc-800 flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
        <div className="flex gap-4">
          <div>Score: <span className={scoreToPar > 0 ? 'text-red-500' : 'text-lime-400'}>{scoreToPar > 0 ? `+${scoreToPar}` : scoreToPar === 0 ? 'E' : scoreToPar}</span></div>
          <div className="text-zinc-500">Projected: <span className="text-white">{projectedScore}</span></div>
          {previousRound && previousRound.totalScore !== undefined && (
            <div className="text-zinc-500">Best: <span className="text-lime-400">{(previousRound.totalScore ?? 0) > 0 ? `+${previousRound.totalScore}` : (previousRound.totalScore ?? 0) === 0 ? 'E' : previousRound.totalScore}</span></div>
          )}
        </div>
        <div className="flex gap-3 items-center">
          {activeRound.weather && (
            <>
              <div className="flex items-center gap-1 text-zinc-400"><Wind size={10} className="text-lime-400" /> {activeRound.weather.windSpeed}km/h</div>
              <div className="flex items-center gap-1 text-zinc-400"><Thermometer size={10} className="text-orange-400" /> {Math.round(activeRound.weather.temp)}°</div>
              {activeRound.weather.isRaining && <CloudRain size={10} className="text-blue-400" />}
            </>
          )}
        </div>
      </div>

      <header className="flex justify-between items-start mb-4 pt-4">
        <div className="flex flex-col">
          <h1 className="text-lime-400 font-black italic text-2xl uppercase leading-none">Hole {activeRound.currentHole}</h1>
          <div className="flex gap-1 mt-1.5 overflow-x-auto pb-1">
            <span className="bg-zinc-800 text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase text-zinc-400 border border-zinc-700 shrink-0">Par {holeData.par}</span>
            <span className="bg-zinc-800 text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase text-zinc-400 border border-zinc-700 shrink-0">{holeData.layout || 'Straight'}</span>
            <span className="bg-zinc-800 text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase text-zinc-400 border border-zinc-700 shrink-0">{holeData.elevation || 'Level'}</span>
          </div>
        </div>
        <div className="text-right">
          {distToGreenCenter !== null ? (
            <div className="flex flex-col items-end">
              <div className="flex gap-2 items-baseline mb-1">
                <div className="flex flex-col items-center">
                   <span className="text-[6px] text-zinc-500 font-bold uppercase">Front</span>
                   <span className="text-xs font-black text-zinc-400">{distToGreenFront !== null ? Math.round(distToGreenFront) : '--'}</span>
                </div>
                <div className="flex flex-col items-center px-2 border-x border-white/10">
                   <span className="text-[7px] text-lime-400 font-black uppercase">Center</span>
                   <span className="text-4xl font-black italic text-white leading-none tracking-tighter">
                     {Math.round(distToGreenCenter)}<span className="text-sm ml-0.5 text-lime-400 uppercase">m</span>
                   </span>
                </div>
                <div className="flex flex-col items-center">
                   <span className="text-[6px] text-zinc-500 font-bold uppercase">Back</span>
                   <span className="text-xs font-black text-zinc-400">{distToGreenBack !== null ? Math.round(distToGreenBack) : '--'}</span>
                </div>
              </div>
              <div className={`flex items-center gap-1 text-[8px] font-black uppercase tracking-widest ${isSignalLow ? 'text-orange-400 animate-pulse' : 'text-lime-400/60'}`}>
                {isSignalLow ? <ShieldAlert size={8} /> : <Zap size={8} />}
                {isSignalLow ? 'Signal Low' : 'Pin Signal Locked'}
                <span className="opacity-40 ml-1">±{Math.round(gpsAccuracy || 0)}m</span>
              </div>
            </div>
          ) : (
            <>
              <div className="text-4xl font-black italic text-white leading-none tracking-tighter">
                {Math.round(remainingDistance)}<span className="text-sm ml-0.5 text-lime-400 uppercase">m</span>
              </div>
              <div className="text-[8px] font-black text-zinc-500 uppercase mt-1">
                Est. From Tee
              </div>
            </>
          )}
          {recClub && (
            <div className="mt-1 flex items-center justify-end gap-1.5">
              <span className="text-[8px] font-black text-zinc-500 uppercase">Caddie Suggests</span>
              <div className="bg-lime-400 text-black px-2 py-0.5 rounded-md text-[10px] font-black uppercase animate-pulse">{recClub.name}</div>
            </div>
          )}
        </div>
      </header>

      <div className="bg-zinc-900 border-l-4 border-lime-400 p-3.5 mb-4 relative overflow-hidden rounded-r-xl">
        <div className="absolute -top-1 -right-1 opacity-10"><Target size={64} className="text-lime-400" /></div>
        <div className="relative z-10">
          <div className="flex items-center gap-1.5 text-lime-400 text-[10px] font-black uppercase tracking-widest mb-1"><Compass size={12} /> Target Strategy</div>
          <p className="text-base font-bold leading-tight mb-1">{holeData.line}</p>
          <p className="text-zinc-400 text-[11px] italic">"{holeData.comment}"</p>
        </div>
      </div>

      {hazardsDistances.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
          {hazardsDistances.map((h, i) => (
            <div key={i} className="bg-zinc-900/50 border border-white/5 rounded-2xl p-3 min-w-[140px] shrink-0 backdrop-blur-md">
               <div className="flex items-center gap-1.5 mb-1">
                  {h.type === 'bunker' && <Waves size={10} className="text-orange-400 rotate-180" />}
                  {h.type === 'water' && <Waves size={10} className="text-blue-400" />}
                  {h.type === 'tree' && <ShieldAlert size={10} className="text-red-400" />}
                  <span className="text-[8px] font-black uppercase text-zinc-500 truncate">{h.name}</span>
               </div>
               <div className="flex items-baseline gap-1">
                  <span className="text-lg font-black italic text-white">{h.distance ? Math.round(h.distance) : '--'}</span>
                  <span className="text-[10px] font-bold text-lime-400 uppercase">m</span>
               </div>
               <div className="w-full bg-white/5 h-1 rounded-full mt-2 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${h.type === 'bunker' ? 'bg-orange-500' : h.type === 'water' ? 'bg-blue-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.max(0, Math.min(100, (h.distance || 0) / 3))}%` }}
                  />
               </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex-1 flex flex-col bg-zinc-950 rounded-2xl p-4 border border-zinc-900 overflow-hidden mb-4 relative">
        <div className="flex items-center justify-between mb-3 border-b border-zinc-900 pb-2">
          <div className="flex flex-col">
            <span className="text-[7px] text-zinc-500 font-black uppercase tracking-widest">Analytics</span>
            {previousRound && previousRound.totalScore !== undefined ? (
              <span className={`text-[10px] font-black ${scoreToPar <= (previousRound.totalScore ?? 0) ? 'text-lime-400' : 'text-red-500'}`}>
                {scoreToPar <= (previousRound.totalScore ?? 0) ? 'Strokes Gained' : 'Strokes Lost'}
              </span>
            ) : (
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-tighter italic">First Round</span>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowCalibration(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-br from-lime-400/30 to-lime-400/10 backdrop-blur-xl border border-lime-400/30 shadow-lg active:scale-95 transition-all group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-30 pointer-events-none" />
              <Target size={12} className="text-white animate-pulse relative z-10" />
              <span className="text-[10px] font-black uppercase tracking-tight text-white relative z-10">Fix Map</span>
            </button>
            <button onClick={() => setShowMap(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-xl border border-white/20 shadow-[0_2px_10px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.2)] active:scale-95 transition-all group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-30 pointer-events-none" />
              <MapIcon size={12} className="text-lime-400 relative z-10" />
              <span className="text-[10px] font-black uppercase tracking-tight text-white relative z-10">Map</span>
            </button>
            <Link to="/distances" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-xl border border-white/20 shadow-[0_2px_10px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.2)] active:scale-95 transition-all group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-30 pointer-events-none" />
              <Settings size={12} className="text-lime-400 group-hover:rotate-45 transition-transform relative z-10" />
              <span className="text-[10px] font-black uppercase tracking-tight text-white relative z-10">Bag</span>
            </Link>
            <button onClick={() => setShowScorePopup(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-xl border border-white/20 shadow-[0_2px_10px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.2)] active:scale-95 transition-all group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-30 pointer-events-none" />
              <BarChart3 size={12} className="text-lime-400 relative z-10" />
              <span className="text-[10px] font-black uppercase tracking-tight text-white relative z-10">Score</span>
            </button>
            <button onClick={() => void signOut()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-xl border border-white/20 shadow-[0_2px_10px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.2)] active:scale-95 transition-all group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-30 pointer-events-none" />
              <LogOut size={12} className="text-red-400 relative z-10" />
              <span className="text-[10px] font-black uppercase tracking-tight text-white relative z-10">Exit</span>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-hide">
          {!advice && !isThinking && !transcript && !interimTranscript && (
            <div className="h-full flex flex-col items-center justify-center text-zinc-800 text-center px-4">
              <Zap size={32} className="mb-3 text-lime-400 animate-pulse" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2">Strategy & Rules Partner</p>
              <p className="text-[9px] text-zinc-500 uppercase leading-relaxed italic">"I'm in the water on the left, what's the rule?" <br/> "I missed the fairway left, how do I adapt?"</p>
            </div>
          )}
          {(transcript || interimTranscript) && (
            <div className="flex justify-end"><div className="bg-lime-400 text-black px-4 py-2.5 rounded-2xl rounded-tr-none max-w-[85%] shadow-lg"><p className="text-sm font-bold leading-snug">{transcript || interimTranscript}</p></div></div>
          )}
          {isThinking && <div className="flex gap-2 items-center text-lime-400 bg-zinc-900/50 p-3 rounded-xl w-fit border border-zinc-800/50"><div className="w-1.5 h-1.5 bg-lime-400 rounded-full animate-bounce"></div><span className="text-[10px] font-black uppercase ml-1">Consulting Rules & Strategy...</span></div>}
          {advice && (
            <div className="flex gap-3 animate-in slide-in-from-left-4 duration-300">
              <div className="w-8 h-8 rounded-full bg-lime-400 flex items-center justify-center shrink-0"><Brain size={16} className="text-black" /></div>
              <div className="bg-zinc-900 px-4 py-3 rounded-2xl rounded-tl-none border border-zinc-800 shadow-xl"><p className="text-sm font-medium leading-relaxed">{advice}</p></div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2.5 mb-4">
        <button onClick={() => updateHole({ id: activeRound._id, hole: Math.max(1, activeRound.currentHole - 1) })} className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex items-center justify-center text-zinc-500 active:text-lime-400 active:scale-95 transition-all shadow-lg"><ChevronLeft size={24} /></button>
        <button 
          onClick={async () => {
            if (activeRound.currentHole === 18) {
              await endRound({ id: activeRound._id })
              fireCelebration("Round Complete!", "Tactical Mission Accomplished.", 'hio')
            } else {
              await updateHole({ id: activeRound._id, hole: activeRound.currentHole + 1 })
            }
          }}
          className="col-span-2 bg-gradient-to-br from-lime-400 to-lime-600 text-black font-black uppercase italic italic py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all"
        >
          {activeRound.currentHole === 18 ? 'Finish Mission' : 'Next Strategic Hole'} <ChevronRight size={20} strokeWidth={3} />
        </button>
        <button onClick={() => updateHole({ id: activeRound._id, hole: Math.min(18, activeRound.currentHole + 1) })} className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex items-center justify-center text-zinc-500 active:text-lime-400 active:scale-95 transition-all shadow-lg"><ChevronRight size={24} /></button>
      </div>

      <div className="relative">
        {showNutrition && (
          <div className="absolute bottom-full left-0 right-0 mb-4 bg-zinc-900 border border-zinc-800 p-5 rounded-3xl animate-in slide-in-from-bottom-4 duration-300 shadow-2xl z-50">
            <div className="flex justify-between items-center mb-4"><h3 className="text-xs font-black uppercase text-lime-400 tracking-widest">Tactical Nutrition</h3><button onClick={() => setShowNutrition(false)}><X size={16} className="text-zinc-500" /></button></div>
            <div className="space-y-3"><div className="bg-zinc-950 p-3 rounded-xl border border-zinc-900"><p className="text-[10px] font-black text-lime-400 uppercase mb-1">Energy Warning</p><p className="text-xs text-zinc-400 leading-snug">Hole 14: Blood glucose dropping. Suggest 20g complex carbs + electrolyte hydration.</p></div><div className="bg-zinc-950 p-3 rounded-xl border border-zinc-900"><p className="text-[10px] font-black text-lime-400 uppercase mb-1">Hydration Status</p><p className="text-xs text-zinc-400 leading-snug">Current temp 28°C. Increase intake to 250ml per hole.</p></div></div>
          </div>
        )}
        <div className="bg-zinc-900/50 backdrop-blur-2xl border border-white/10 p-2.5 rounded-[2.5rem] flex items-center gap-2 shadow-2xl overflow-hidden relative">
           <div className="absolute inset-0 bg-gradient-to-r from-lime-400/5 to-transparent pointer-events-none" />
           <button onClick={() => setShowNutrition(!showNutrition)} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 ${showNutrition ? 'bg-lime-400 text-black' : 'bg-zinc-800 text-zinc-500'}`}><Utensils size={24} /></button>
           <button onClick={() => { if(isRecording) stopRecording(); else startRecording(); }} className={`flex-1 h-14 rounded-full flex items-center justify-center gap-3 font-black uppercase italic tracking-tighter transition-all active:scale-[0.98] relative overflow-hidden ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-black'}`}>
             {isRecording ? <div className="flex items-center gap-2"><div className="w-2 h-2 bg-white rounded-full animate-ping" /><span>Listening...</span></div> : <div className="flex items-center gap-2"><Mic size={20} strokeWidth={3} /><span>Speak to Caddie</span></div>}
           </button>
        </div>
      </div>
    </main>
  )

  function startRecording() {
    setIsRecording(true)
    setAdvice(null)
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return alert("Speech recognition not supported")
    recognitionRef.current = new SpeechRecognition()
    recognitionRef.current.continuous = true
    recognitionRef.current.interimResults = true
    recognitionRef.current.onresult = (event: any) => {
      let interim = ''
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript
        else interim += event.results[i][0].transcript
      }
      setTranscript(final)
      setInterimTranscript(interim)
    }
    recognitionRef.current.start()
  }

  async function stopRecording() {
    setIsRecording(false)
    recognitionRef.current?.stop()
    if (transcript && activeRound) {
      setIsThinking(true)
      const res = await askCaddie({ 
        prompt: transcript, 
        roundId: activeRound._id,
      })
      setAdvice(res)
      setIsThinking(false)
      setTranscript('')
      setInterimTranscript('')
    }
  }
}
