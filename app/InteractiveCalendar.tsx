'use client'

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import SeasonalBackground from './SeasonalBackground'

// ─── Types ──────────────────────────────────────────────────────
interface DP { year: number; month: number; day: number }
interface RangedNote { id: string; text: string; startKey: string | null; endKey: string | null; monthKey: string; ts: string }
interface DayEvent { id: string; text: string }
interface EventMap { [k: string]: DayEvent[] }
type FlipState = 'idle' | 'out-next' | 'in-next' | 'out-prev' | 'in-prev'

// ─── Constants ───────────────────────────────────────────────────
const MONTHS = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER']
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAY_HEADERS = ['MON','TUE','WED','THU','FRI','SAT','SUN']

const THEMES = [
  { accent:'#4fc3f7', dark:'#0288d1', light:'rgba(79,195,247,0.16)',  label:'Arctic Blue',       emoji:'❄️',  filter:'hue-rotate(185deg) saturate(0.7)' },
  { accent:'#ec407a', dark:'#c2185b', light:'rgba(236,64,122,0.13)',  label:'Valentine Rose',    emoji:'🌹',  filter:'hue-rotate(310deg) saturate(1.1) brightness(0.9)' },
  { accent:'#26a69a', dark:'#00796b', light:'rgba(38,166,154,0.13)',  label:'Spring Teal',       emoji:'🌱',  filter:'hue-rotate(150deg) saturate(0.85)' },
  { accent:'#29b6f6', dark:'#0277bd', light:'rgba(41,182,246,0.14)',  label:'Clear Skies',       emoji:'⛰️', filter:'none' },
  { accent:'#7e57c2', dark:'#512da8', light:'rgba(126,87,194,0.13)',  label:'Bloom Violet',      emoji:'💐',  filter:'hue-rotate(240deg) saturate(0.7) brightness(0.85)' },
  { accent:'#ef5350', dark:'#c62828', light:'rgba(239,83,80,0.12)',   label:'Midsummer',         emoji:'☀️',  filter:'hue-rotate(340deg) saturate(1.1) brightness(0.95)' },
  { accent:'#ffa726', dark:'#e65100', light:'rgba(255,167,38,0.13)',  label:'Golden Hour',       emoji:'🌅',  filter:'hue-rotate(30deg) saturate(1.3) brightness(1.05)' },
  { accent:'#ff7043', dark:'#bf360c', light:'rgba(255,112,67,0.12)',  label:'Late Summer',       emoji:'🌻',  filter:'hue-rotate(15deg) saturate(1.1)' },
  { accent:'#ffb300', dark:'#e65100', light:'rgba(255,179,0,0.13)',   label:'Harvest Gold',      emoji:'🍂',  filter:'hue-rotate(25deg) saturate(1.2) brightness(1.0)' },
  { accent:'#f4511e', dark:'#bf360c', light:'rgba(244,81,30,0.12)',   label:'Fall Colors',       emoji:'🍁',  filter:'hue-rotate(10deg) saturate(1.1) brightness(0.95)' },
  { accent:'#8d6e63', dark:'#4e342e', light:'rgba(141,110,99,0.12)',  label:'Thanksgiving',      emoji:'🦃',  filter:'hue-rotate(5deg) saturate(0.5) brightness(0.8)' },
  { accent:'#ef5350', dark:'#b71c1c', light:'rgba(239,83,80,0.12)',   label:'Winter Crimson',    emoji:'⛄',  filter:'hue-rotate(340deg) saturate(0.6) brightness(0.75)' },
]

const HOLIDAYS: Record<string, string> = {
  '2025-01-01':"New Year's Day", '2025-01-20':"MLK Jr. Day", '2025-02-17':"Presidents' Day",
  '2025-04-20':"Easter",         '2025-05-26':"Memorial Day",'2025-06-19':"Juneteenth",
  '2025-07-04':"Independence Day",'2025-09-01':"Labor Day",  '2025-10-13':"Columbus Day",
  '2025-11-11':"Veterans Day",   '2025-11-27':"Thanksgiving",'2025-12-25':"Christmas",
  '2026-01-01':"New Year's Day", '2026-01-19':"MLK Jr. Day", '2026-02-16':"Presidents' Day",
  '2026-04-05':"Easter",         '2026-05-25':"Memorial Day",'2026-06-19':"Juneteenth",
  '2026-07-04':"Independence Day",'2026-09-07':"Labor Day",  '2026-10-12':"Columbus Day",
  '2026-11-11':"Veterans Day",   '2026-11-26':"Thanksgiving",'2026-12-25':"Christmas",
}

// ─── Monthly Phrases ─────────────────────────────────────────────
const MONTH_PHRASES: { phrase: string; sub: string }[][] = [
  [ // January
    { phrase: 'A new year is a blank canvas — paint it with intention and courage.', sub: 'Fresh start. Limitless potential.' },
    { phrase: 'January: the quiet strength of new beginnings lives in every dawn.', sub: 'Your story starts fresh today.' },
  ],
  [ // February
    { phrase: 'Love is not just felt — it is chosen, every single day.', sub: 'Cherish every moment.' },
    { phrase: 'In the heart of winter, the warmest things are the people around you.', sub: 'Spread kindness freely.' },
  ],
  [ // March
    { phrase: 'Spring is proof that after the coldest season, things can bloom again.', sub: 'Growth is always possible.' },
    { phrase: 'March reminds us: every long winter gives way to light.', sub: 'Keep going — warmth is near.' },
  ],
  [ // April
    { phrase: 'April showers bring May flowers — every struggle has a beautiful purpose.', sub: 'Trust the process.' },
    { phrase: 'There is something undeniably beautiful about new beginnings.', sub: 'Embrace this fresh season.' },
  ],
  [ // May
    { phrase: 'May your days bloom with joy, laughter, and endless possibility.', sub: 'This is your season to shine.' },
    { phrase: 'Like flowers in May, let your true self blossom fully.', sub: 'You are enough, exactly as you are.' },
  ],
  [ // June
    { phrase: 'Summer is the time for long golden days and even longer dreams.', sub: 'Chase what lights you up.' },
    { phrase: 'The sun does not discriminate — it shines for everyone equally.', sub: "Be someone's sunshine today." },
  ],
  [ // July
    { phrase: 'Live in the sunshine, swim in the sea, drink in the wild air.', sub: 'Adventure is always waiting.' },
    { phrase: 'July heat: a beautiful reminder that life is meant to be felt fully.', sub: 'Be present. Be alive.' },
  ],
  [ // August
    { phrase: 'August — the golden hour of summer, warm and infinite.', sub: 'Soak in every brilliant moment.' },
    { phrase: 'Make the most of the light before the seasons gently shift.', sub: 'Every single day is a gift.' },
  ],
  [ // September
    { phrase: 'Autumn shows us how breathtaking it can be to let things go.', sub: 'Release. Renew. Refresh.' },
    { phrase: 'September: a beautiful turning of the page toward something new.', sub: 'Change is the doorway to growth.' },
  ],
  [ // October
    { phrase: 'In autumn, even the trees remind us that letting go is beautiful.', sub: 'Embrace the shift with grace.' },
    { phrase: 'Every falling leaf is a tiny act of courage from the tree.', sub: 'You too can let go and soar.' },
  ],
  [ // November
    { phrase: 'Gratitude turns what we already have into more than enough.', sub: 'Count your blessings — they are many.' },
    { phrase: 'November: a gentle season to slow down, reflect, and give thanks.', sub: 'You have so much to be grateful for.' },
  ],
  [ // December
    { phrase: 'December is not an ending — it is a gathering of everything good.', sub: 'The best is always yet to come.' },
    { phrase: 'May this season fill your heart with wonder, warmth and magic.', sub: 'Celebrate this beautiful life.' },
  ],
]

function PhraseBar({ month }: { month: number }) {
  const phrases = MONTH_PHRASES[month]
  const weekOfMonth = Math.floor((new Date().getDate() - 1) / 7)
  const { phrase, sub } = phrases[weekOfMonth % phrases.length]
  return (
    <div className="phrase-bar" key={month} aria-live="polite">
      <span className="phrase-quote-mark" aria-hidden="true">&ldquo;</span>
      <p className="phrase-text">{phrase}</p>
      <div className="phrase-separator" aria-hidden="true" />
      <span className="phrase-sub">{sub}</span>
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────
const toKey = (d: DP) => `${d.year}-${String(d.month+1).padStart(2,'0')}-${String(d.day).padStart(2,'0')}`
const cmp = (a: DP, b: DP) => a.year !== b.year ? a.year - b.year : a.month !== b.month ? a.month - b.month : a.day - b.day
const isBetween = (d: DP, s: DP, e: DP) => { const [lo,hi] = cmp(s,e)<=0?[s,e]:[e,s]; return cmp(d,lo)>0 && cmp(d,hi)<0 }
const daysBetween = (s: DP, e: DP) => Math.abs(Math.round((new Date(e.year,e.month,e.day).getTime() - new Date(s.year,s.month,s.day).getTime())/86400000))+1
const monthKey = (y: number, m: number) => `${y}-${String(m+1).padStart(2,'0')}`

function buildCells(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay()
  const lead = (firstDay + 6) % 7
  const daysInMonth = new Date(year, month+1, 0).getDate()
  const daysInPrev  = new Date(year, month, 0).getDate()
  const cells: { day: number; type: 'prev'|'current'|'next' }[] = []
  for (let i = lead-1; i >= 0; i--) cells.push({ day: daysInPrev-i, type: 'prev' })
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, type: 'current' })
  let n = 1
  while (cells.length % 7 !== 0) cells.push({ day: n++, type: 'next' })
  return cells
}

function cellToDP(cell: { day:number; type:string }, cy: number, cm: number): DP {
  let year=cy, month=cm
  if (cell.type==='prev')  { month--; if(month<0)  { month=11; year-- } }
  if (cell.type==='next')  { month++; if(month>11) { month=0;  year++ } }
  return { year, month, day: cell.day }
}

// ─── Spiral ──────────────────────────────────────────────────────
function SpiralBinding() {
  return (
    <div className="spiral" aria-hidden="true">
      {Array.from({length:16},(_,i)=><div key={i} className="coil"/>)}
    </div>
  )
}

// ─── Modal (portal) ───────────────────────────────────────────────
interface ModalProps {
  date: DP; events: DayEvent[]
  onClose:() => void; onAdd:(t:string)=>void; onDel:(id:string)=>void
  theme: typeof THEMES[0]
}
function EventModal({ date, events, onClose, onAdd, onDel, theme }: ModalProps) {
  const [text, setText] = useState('')
  const ref = useRef<HTMLInputElement>(null)
  useEffect(()=>{ setTimeout(()=>ref.current?.focus(), 120) }, [])

  const d = new Date(date.year, date.month, date.day)
  const dayName = d.toLocaleDateString('en-US',{weekday:'long'})
  const [mounted, setMounted] = useState(false)
  useEffect(()=>setMounted(true),[])
  if (!mounted) return null

  const handle = () => { const t=text.trim(); if(!t) return; onAdd(t); setText('') }

  return createPortal(
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div className="modal-box" style={{'--theme-accent':theme.accent,'--theme-dark':theme.dark,'--theme-light':theme.light} as React.CSSProperties}>
        <div className="modal-hdr">
          <div>
            <div className="modal-day-num">{String(date.day).padStart(2,'0')}</div>
            <div className="modal-day-sub">{dayName} · {MONTH_SHORT[date.month]} {date.year}</div>
          </div>
          <button id="modal-close-btn" className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="modal-divider"/>
        <div className="modal-events">
          {events.length===0
            ? <p className="modal-no-events">No events yet — add one! ✨</p>
            : events.map(ev=>(
                <div key={ev.id} className="modal-event-item">
                  <span className="modal-event-text">{ev.text}</span>
                  <button className="modal-event-del" onClick={()=>onDel(ev.id)} aria-label={`Delete ${ev.text}`}>×</button>
                </div>
              ))
          }
        </div>
        <div className="modal-add-form">
          <input ref={ref} id="event-input" className="modal-add-input" placeholder="Add an event…"
            value={text} onChange={e=>setText(e.target.value)}
            onKeyDown={e=>{ if(e.key==='Enter')handle(); if(e.key==='Escape')onClose() }} maxLength={80}/>
          <button id="add-event-btn" className="modal-add-btn" onClick={handle}>+ Add</button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ─── Holiday Tooltip ──────────────────────────────────────────────
function HolidayTooltip({ name }: { name: string }) {
  return <div style={{
    position:'absolute', bottom:'110%', left:'50%', transform:'translateX(-50%)',
    background:'#1f2937', color:'#fff', fontSize:'.6rem', fontWeight:600,
    padding:'4px 8px', borderRadius:'6px', whiteSpace:'nowrap',
    pointerEvents:'none', zIndex:50, opacity:0,
    transition:'opacity .2s ease',
    fontFamily:'var(--font)',
  }} className="hday-tip">{name}</div>
}

// ─── Main Component ───────────────────────────────────────────────
export default function InteractiveCalendar() {
  const today = { year:new Date().getFullYear(), month:new Date().getMonth(), day:new Date().getDate() }

  const [curYear,  setCurYear]  = useState(today.year)
  const [curMonth, setCurMonth] = useState(today.month)
  const [flipState, setFlipState] = useState<FlipState>('idle')

  // Range selection
  const [rangeStart, setRangeStart] = useState<DP|null>(null)
  const [rangeEnd,   setRangeEnd]   = useState<DP|null>(null)
  const [hoverDate,  setHoverDate]  = useState<DP|null>(null)
  const [selecting, setSelecting]   = useState(false) // true = waiting for second click

  // Events per day
  const [events, setEvents] = useState<EventMap>({})
  const [modalDate, setModalDate] = useState<DP|null>(null)

  // Ranged notes
  const [rangedNotes, setRangedNotes] = useState<RangedNote[]>([])
  const [noteInput, setNoteInput]     = useState('')

  // Monthly memos
  const [memos, setMemos] = useState<string[]>(Array(6).fill(''))

  const theme = THEMES[curMonth]
  const cells = useMemo(() => buildCells(curYear, curMonth), [curYear, curMonth])
  const rows  = useMemo(() => { const r=[]; for(let i=0;i<cells.length;i+=7) r.push(cells.slice(i,i+7)); return r }, [cells])

  // ── Navigation with flip animation ──────────────
  const navigate = useCallback((dir: 1|-1) => {
    if (flipState !== 'idle') return
    const outState: FlipState = dir===1 ? 'out-next' : 'out-prev'
    const inState:  FlipState = dir===1 ? 'in-next'  : 'in-prev'
    setFlipState(outState)
    setTimeout(() => {
      setCurMonth(prev => {
        const n = prev + dir
        if (n < 0)  { setCurYear(y => y-1); return 11 }
        if (n > 11) { setCurYear(y => y+1); return 0  }
        return n
      })
      setFlipState(inState)
      setTimeout(() => setFlipState('idle'), 220)
    }, 220)
  }, [flipState])

  const goToday = () => { setCurYear(today.year); setCurMonth(today.month) }

  // ── Range click logic ────────────────────────────
  const handleDayClick = (cell: { day:number; type:string }, col: number) => {
    const dp = cellToDP(cell, curYear, curMonth)

    if (!selecting) {
      // Start fresh range
      setRangeStart(dp); setRangeEnd(null); setSelecting(true)
    } else {
      // If re-clicking start, open modal
      if (rangeStart && cmp(dp,rangeStart)===0) {
        setSelecting(false)
        setModalDate(dp)
        return
      }
      // Set end (auto-sort)
      const [s,e] = rangeStart && cmp(rangeStart,dp)<=0 ? [rangeStart,dp] : [dp,rangeStart||dp]
      setRangeStart(s); setRangeEnd(e); setSelecting(false)
    }
  }

  // Double click opens modal
  const handleDayDblClick = (cell: { day:number; type:string }) => {
    setModalDate(cellToDP(cell, curYear, curMonth))
  }

  const clearRange = () => { setRangeStart(null); setRangeEnd(null); setSelecting(false) }

  // ── Range display text ───────────────────────────
  const rangeText = useMemo(() => {
    if (!rangeStart) return null
    if (!rangeEnd)   return { label:`${MONTH_SHORT[rangeStart.month]} ${rangeStart.day}`, count: null }
    const days = daysBetween(rangeStart, rangeEnd)
    return {
      label: `${MONTH_SHORT[rangeStart.month]} ${rangeStart.day} → ${MONTH_SHORT[rangeEnd.month]} ${rangeEnd.day}`,
      count: `${days} day${days===1?'':'s'}`
    }
  }, [rangeStart, rangeEnd])

  // ── Get classes for day cell ─────────────────────
  const getDayClasses = (cell: { day:number; type:string }, col: number) => {
    const dp = cellToDP(cell, curYear, curMonth)
    const cls = ['day-cell']
    if (cell.type !== 'current') cls.push('other-month')
    if (col === 5 || col === 6) cls.push('weekend')
    if (cmp(dp,today)===0) cls.push('today')
    const hKey = toKey(dp)
    if (HOLIDAYS[hKey]) cls.push('is-holiday')

    // Effective end (for preview)
    const effEnd = selecting ? (hoverDate ?? null) : rangeEnd

    if (rangeStart && effEnd) {
      const [lo,hi] = cmp(rangeStart,effEnd)<=0 ? [rangeStart,effEnd] : [effEnd,rangeStart]
      const isStart = cmp(dp,lo)===0
      const isEnd   = cmp(dp,hi)===0
      const isIn    = isBetween(dp,lo,hi)
      const isPrev  = selecting  // preview state

      if (isStart) cls.push('range-start')
      if (isEnd)   cls.push(isPrev ? 'range-preview-end' : 'range-end')
      if (isIn)    cls.push(isPrev ? 'range-preview'     : 'in-range')
    } else if (rangeStart && !effEnd && selecting) {
      if (cmp(dp,rangeStart)===0) cls.push('range-start')
    } else if (rangeStart && rangeEnd) {
      const [lo,hi] = cmp(rangeStart,rangeEnd)<=0 ? [rangeStart,rangeEnd] : [rangeEnd,rangeStart]
      if (cmp(dp,lo)===0) cls.push('range-start')
      if (cmp(dp,hi)===0) cls.push('range-end')
      if (isBetween(dp,lo,hi)) cls.push('in-range')
    }

    return cls.join(' ')
  }

  // ── Events ───────────────────────────────────────
  const addEvent = (text: string) => {
    if (!modalDate) return
    const k = toKey(modalDate)
    setEvents(prev => ({ ...prev, [k]: [...(prev[k]??[]), { id:`ev-${Date.now()}`, text }] }))
  }
  const delEvent = (id: string) => {
    if (!modalDate) return
    const k = toKey(modalDate)
    setEvents(prev => ({ ...prev, [k]: (prev[k]??[]).filter(e=>e.id!==id) }))
  }
  const hasEvents = (cell: {day:number;type:string}) => {
    if (cell.type!=='current') return false
    return (events[toKey(cellToDP(cell,curYear,curMonth))]?.length??0) > 0
  }

  // ── Ranged notes ─────────────────────────────────
  const curMK = monthKey(curYear, curMonth)
  const visibleNotes = rangedNotes.filter(n => n.monthKey === curMK)

  const addNote = () => {
    const t = noteInput.trim()
    if (!t) return
    const note: RangedNote = {
      id: `n-${Date.now()}`,
      text: t,
      startKey: rangeStart ? toKey(rangeStart) : null,
      endKey:   rangeEnd   ? toKey(rangeEnd)   : rangeStart ? toKey(rangeStart) : null,
      monthKey: curMK,
      ts: new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}),
    }
    setRangedNotes(prev => [...prev, note])
    setNoteInput('')
  }
  const delNote = (id: string) => setRangedNotes(prev => prev.filter(n=>n.id!==id))

  // ── Persist state ─────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ical-state')
      if (saved) {
        const s = JSON.parse(saved)
        if (s.memos)       setMemos(s.memos)
        if (s.events)      setEvents(s.events)
        if (s.rangedNotes) setRangedNotes(s.rangedNotes)
      }
    } catch {}
  }, [])

  useEffect(() => {
    try { localStorage.setItem('ical-state', JSON.stringify({ memos, events, rangedNotes })) } catch {}
  }, [memos, events, rangedNotes])

  // ── Flip class ───────────────────────────────────
  const flipClass = flipState === 'idle' ? '' :
    flipState === 'out-next' ? 'flip-out-next' :
    flipState === 'in-next'  ? 'flip-in-next'  :
    flipState === 'out-prev' ? 'flip-out-prev'  : 'flip-in-prev'

  const cssVars = { '--theme-accent':theme.accent, '--theme-dark':theme.dark, '--theme-light':theme.light } as React.CSSProperties

  return (
    <div className="page-wrap" style={cssVars}>
      <SeasonalBackground month={curMonth} />

      {/* Title */}
      <div className="page-title">
        <h1>Interactive Wall Calendar</h1>
        <p>Click a date to start a range · Double-click for events · Edit notes inline</p>
      </div>

      {/* Seasonal Phrase */}
      <PhraseBar month={curMonth} />

      {/* Navigation */}
      <nav className="cal-nav" aria-label="Calendar navigation">
        <button id="prev-month-btn" className="nav-btn" onClick={()=>navigate(-1)} aria-label="Previous month">
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M7.5 2L3.5 6L7.5 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <button id="today-btn" className="today-btn" onClick={goToday}>Today</button>
        <button id="next-month-btn" className="nav-btn" onClick={()=>navigate(1)} aria-label="Next month">
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M4.5 2L8.5 6L4.5 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div className="theme-pill">{theme.emoji} {theme.label}</div>
      </nav>

      {/* Calendar Card */}
      <div className="card-perspective" style={{maxWidth:'900px',width:'100%'}}>
        <article className="calendar-card" aria-label={`${MONTHS[curMonth]} ${curYear}`}>
          <SpiralBinding />

          <div className={`calendar-content ${flipClass}`}>
            {/* Hero */}
            <header className="cal-hero">
              <img
                src="/hero-mountain.png"
                alt={`${MONTHS[curMonth]} ${curYear} hero`}
                className="hero-img"
                style={{ filter: theme.filter === 'none' ? undefined : theme.filter }}
              />
              <div className="month-badge" style={{ background: theme.accent }}>
                <div className="badge-year">{curYear}</div>
                <div className="badge-month">{MONTHS[curMonth]}</div>
              </div>
            </header>

            {/* Range status bar */}
            <div className="range-bar">
              {rangeText ? (
                <>
                  <span className="range-bar-label">📅</span>
                  <span className="range-bar-info">{rangeText.label}</span>
                  {rangeText.count && <span className="range-bar-count">{rangeText.count}</span>}
                  <button className="range-clear-btn" onClick={clearRange} aria-label="Clear range">✕</button>
                </>
              ) : (
                <span className="range-bar-info" style={{color:'var(--gray-400)', fontStyle:'italic'}}>
                  {selecting ? '🖱 Click a second date to complete the range…' : 'Click a date to begin selecting a range'}
                </span>
              )}
            </div>

            {/* Body: Notes + Grid */}
            <div className="cal-body">
              {/* Notes Panel */}
              <section className="notes-panel" aria-label="Notes">
                <div className="notes-heading">Notes</div>

                {/* Monthly memo lines */}
                <div className="memo-lines">
                  {memos.map((m,i) => (
                    <input key={i} id={`memo-${i+1}`} className="memo-input" type="text"
                      value={m} placeholder="…"
                      onChange={e=>setMemos(p=>{const n=[...p]; n[i]=e.target.value; return n})}
                      aria-label={`Memo line ${i+1}`} maxLength={45}/>
                  ))}
                </div>

                <div className="notes-divider"/>

                {/* Range notes */}
                <div className="ranged-notes-label">Range Notes</div>

                {visibleNotes.map(note => (
                  <div key={note.id} className="ranged-note-card">
                    {note.startKey && (
                      <div className="ranged-note-range">
                        {note.startKey}{note.endKey && note.endKey !== note.startKey ? ` → ${note.endKey}` : ''} · {note.ts}
                      </div>
                    )}
                    <div className="ranged-note-text">{note.text}</div>
                    <button className="ranged-note-del" onClick={()=>delNote(note.id)} aria-label="Delete note">× Delete</button>
                  </div>
                ))}

                {visibleNotes.length === 0 && (
                  <div style={{fontSize:'.63rem',color:'var(--gray-400)',fontStyle:'italic',textAlign:'center',padding:'6px 0'}}>
                    No range notes yet
                  </div>
                )}

                <div className="add-range-note-area">
                  <textarea id="range-note-input" className="add-range-note-input" rows={2}
                    placeholder={rangeStart ? `Note for ${rangeText?.label ?? 'range'}…` : 'Select a range first…'}
                    value={noteInput} onChange={e=>setNoteInput(e.target.value)}
                    onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();addNote()} }}
                    maxLength={200}/>
                  <button id="add-note-btn" className="add-note-btn" onClick={addNote}
                    disabled={!noteInput.trim()}>
                    + Add Note {rangeText ? `for ${rangeText.label}` : ''}
                  </button>
                </div>
              </section>

              {/* Calendar Grid */}
              <section className="cal-grid-section" aria-label={`${MONTHS[curMonth]} ${curYear} calendar`}>
                {/* Day headers */}
                <div className="day-headers" role="row">
                  {DAY_HEADERS.map((d,i) => (
                    <div key={d} className={`day-hdr${i>=5?' weekend':''}`} role="columnheader">{d}</div>
                  ))}
                </div>

                {/* Rows */}
                {rows.map((row,ri) => (
                  <div key={ri} className="cal-row" role="row">
                    {row.map((cell,ci) => {
                      const dp = cellToDP(cell, curYear, curMonth)
                      const hKey = toKey(dp)
                      const holiday = HOLIDAYS[hKey]
                      const hasEv = hasEvents(cell)
                      const cls = getDayClasses(cell,ci)

                      return (
                        <div
                          key={ci}
                          id={`day-${hKey}-${cell.type}`}
                          className={cls}
                          role="gridcell"
                          tabIndex={0}
                          aria-label={`${cell.day}${cell.type!=='current'?' (other month)':''}${cmp(dp,today)===0?', today':''}${holiday?', '+holiday:''}`}
                          onClick={()=>handleDayClick(cell,ci)}
                          onDoubleClick={()=>handleDayDblClick(cell)}
                          onMouseEnter={()=>selecting && setHoverDate(dp)}
                          onMouseLeave={()=>selecting && setHoverDate(null)}
                          onKeyDown={e=>{ if(e.key==='Enter'||e.key===' '){e.preventDefault();handleDayClick(cell,ci)} }}
                          title={holiday}
                        >
                          <div className="range-bg"/>
                          <div className="day-inner">
                            <span className="day-number">{cell.day}</span>
                            {(holiday || hasEv) && (
                              <span style={{display:'flex',gap:'2px'}}>
                                {holiday && <span className="holiday-dot" title={holiday}/>}
                                {hasEv   && <span style={{width:'3.5px',height:'3.5px',borderRadius:'50%',background:'var(--theme-accent)',flexShrink:0}}/>}
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </section>
            </div>
          </div>{/* calendar-content */}
        </article>
      </div>

      {/* Event Modal via Portal */}
      {modalDate && (
        <EventModal
          date={modalDate}
          events={events[toKey(modalDate)]??[]}
          onClose={()=>setModalDate(null)}
          onAdd={addEvent}
          onDel={delEvent}
          theme={theme}
        />
      )}
    </div>
  )
}
