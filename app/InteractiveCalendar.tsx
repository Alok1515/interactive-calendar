'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

// ─── Types ────────────────────────────────────────────────
interface CalendarEvent {
  id: string
  text: string
}

interface EventMap {
  [dateKey: string]: CalendarEvent[]
}

// ─── Constants ────────────────────────────────────────────
const MONTHS = [
  'JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE',
  'JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER',
]

const DAY_HEADERS = ['MON','TUE','WED','THU','FRI','SAT','SUN']

// Hero images per month (using the mountain image for all, can be extended)
const HERO_IMAGES = [
  '/hero-mountain.png',
  '/hero-mountain.png',
  '/hero-mountain.png',
  '/hero-mountain.png',
  '/hero-mountain.png',
  '/hero-mountain.png',
  '/hero-mountain.png',
  '/hero-mountain.png',
  '/hero-mountain.png',
  '/hero-mountain.png',
  '/hero-mountain.png',
  '/hero-mountain.png',
]

// ─── Helpers ──────────────────────────────────────────────
function dateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function buildCalendarDays(year: number, month: number) {
  // First day of month (0=Sun...6=Sat), convert to Mon-based (0=Mon...6=Sun)
  const firstDay = new Date(year, month, 1).getDay()
  const mondayBasedFirst = (firstDay + 6) % 7

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const cells: { day: number; month: 'prev' | 'current' | 'next'; col: number }[] = []

  // Prev month trailing days
  for (let i = mondayBasedFirst - 1; i >= 0; i--) {
    cells.push({ day: daysInPrevMonth - i, month: 'prev', col: cells.length % 7 })
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, month: 'current', col: cells.length % 7 })
  }

  // Next month leading days
  let nextDay = 1
  while (cells.length % 7 !== 0) {
    cells.push({ day: nextDay++, month: 'next', col: cells.length % 7 })
  }

  return cells
}

// ─── Spiral Coils Component ───────────────────────────────
function SpiralBinding() {
  const coils = Array.from({ length: 15 }, (_, i) => i)
  return (
    <div className="spiral-binding" aria-hidden="true">
      {coils.map((i) => (
        <div key={i} className="spiral-coil" />
      ))}
    </div>
  )
}

// ─── Event Modal ──────────────────────────────────────────
interface EventModalProps {
  date: { year: number; month: number; day: number } | null
  events: CalendarEvent[]
  onClose: () => void
  onAddEvent: (text: string) => void
  onDeleteEvent: (id: string) => void
}

function EventModal({ date, events, onClose, onAddEvent, onDeleteEvent }: EventModalProps) {
  const [inputText, setInputText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 150)
  }, [])

  if (!date) return null

  const handleAdd = () => {
    const trimmed = inputText.trim()
    if (!trimmed) return
    onAddEvent(trimmed)
    setInputText('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd()
    if (e.key === 'Escape') onClose()
  }

  const displayDate = new Date(date.year, date.month, date.day)
  const dayName = displayDate.toLocaleDateString('en-US', { weekday: 'long' })
  const monthYear = `${MONTHS[date.month].charAt(0) + MONTHS[date.month].slice(1).toLowerCase()} ${date.year}`

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`Events for ${dayName}, ${monthYear}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="modal-card">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-date-display">
            <span className="modal-day">{String(date.day).padStart(2, '0')}</span>
            <span className="modal-month-year">{dayName} · {monthYear}</span>
          </div>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close modal"
            id="modal-close-btn"
          >
            ✕
          </button>
        </div>

        <div className="modal-divider" />

        {/* Events List */}
        <div className="events-list" role="list" aria-label="Events for this day">
          {events.length === 0 ? (
            <p className="no-events">No events yet. Add one below! ✨</p>
          ) : (
            events.map((ev) => (
              <div key={ev.id} className="event-item" role="listitem">
                <span className="event-item-text">{ev.text}</span>
                <button
                  className="event-delete-btn"
                  onClick={() => onDeleteEvent(ev.id)}
                  aria-label={`Delete event: ${ev.text}`}
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>

        {/* Add Event Form */}
        <div className="add-event-form" role="form" aria-label="Add new event">
          <input
            ref={inputRef}
            className="event-input"
            type="text"
            placeholder="Add an event..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Event description"
            id="event-input-field"
            maxLength={80}
          />
          <button
            className="add-event-btn"
            onClick={handleAdd}
            id="add-event-submit-btn"
            aria-label="Add event"
          >
            + Add
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Calendar Component ──────────────────────────────
export default function InteractiveCalendar() {
  const today = new Date()

  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<{ year: number; month: number; day: number } | null>(null)
  const [events, setEvents] = useState<EventMap>({})
  const [notes, setNotes] = useState<string[]>(Array(6).fill(''))
  const [isAnimating, setIsAnimating] = useState(false)

  const cells = buildCalendarDays(currentYear, currentMonth)

  // Navigate months with animation
  const navigate = useCallback((dir: -1 | 1) => {
    if (isAnimating) return
    setIsAnimating(true)
    setTimeout(() => {
      setCurrentMonth((prev) => {
        const next = prev + dir
        if (next < 0) {
          setCurrentYear((y) => y - 1)
          return 11
        }
        if (next > 11) {
          setCurrentYear((y) => y + 1)
          return 0
        }
        return next
      })
      setIsAnimating(false)
    }, 200)
  }, [isAnimating])

  const goToToday = () => {
    setCurrentYear(today.getFullYear())
    setCurrentMonth(today.getMonth())
  }

  const handleDayClick = (day: number, monthType: 'prev' | 'current' | 'next') => {
    let year = currentYear
    let month = currentMonth

    if (monthType === 'prev') {
      month -= 1
      if (month < 0) { month = 11; year -= 1 }
    } else if (monthType === 'next') {
      month += 1
      if (month > 11) { month = 0; year += 1 }
    }

    setSelectedDate({ year, month, day })
  }

  const addEvent = (text: string) => {
    if (!selectedDate) return
    const key = dateKey(selectedDate.year, selectedDate.month, selectedDate.day)
    const newEvent: CalendarEvent = { id: `ev-${Date.now()}`, text }
    setEvents((prev) => ({
      ...prev,
      [key]: [...(prev[key] ?? []), newEvent],
    }))
  }

  const deleteEvent = (id: string) => {
    if (!selectedDate) return
    const key = dateKey(selectedDate.year, selectedDate.month, selectedDate.day)
    setEvents((prev) => ({
      ...prev,
      [key]: (prev[key] ?? []).filter((ev) => ev.id !== id),
    }))
  }

  const updateNote = (index: number, value: string) => {
    setNotes((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  const selectedEvents = selectedDate
    ? events[dateKey(selectedDate.year, selectedDate.month, selectedDate.day)] ?? []
    : []

  const isToday = (day: number, monthType: string) =>
    monthType === 'current' &&
    day === today.getDate() &&
    currentMonth === today.getMonth() &&
    currentYear === today.getFullYear()

  const hasEvents = (day: number, monthType: string) => {
    if (monthType !== 'current') return false
    const key = dateKey(currentYear, currentMonth, day)
    return (events[key]?.length ?? 0) > 0
  }

  return (
    <div className="page-container" role="main">
      {/* Page Title */}
      <div className="page-title">
        <h1>Interactive Wall Calendar</h1>
        <p>Click any date to manage events · Edit notes inline</p>
      </div>

      {/* Navigation Controls */}
      <nav className="calendar-nav" aria-label="Calendar navigation">
        <button
          className="nav-btn"
          onClick={() => navigate(-1)}
          aria-label="Previous month"
          id="prev-month-btn"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M7.5 2L3.5 6L7.5 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <button
          className="today-btn"
          onClick={goToToday}
          id="today-btn"
          aria-label="Go to today"
        >
          Today
        </button>

        <button
          className="nav-btn"
          onClick={() => navigate(1)}
          aria-label="Next month"
          id="next-month-btn"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M4.5 2L8.5 6L4.5 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </nav>

      {/* ─── Calendar Card ─── */}
      <article
        className="calendar-card"
        style={{ opacity: isAnimating ? 0.7 : 1, transition: 'opacity 0.2s ease' }}
        aria-label={`Calendar: ${MONTHS[currentMonth]} ${currentYear}`}
      >
        {/* Spiral Binding */}
        <SpiralBinding />

        {/* Hero Image */}
        <header className="calendar-hero" aria-label="Calendar hero image">
          <img
            src={HERO_IMAGES[currentMonth]}
            alt={`Hero image for ${MONTHS[currentMonth]} ${currentYear}`}
            className="hero-image"
          />
          <div className="hero-overlay" aria-hidden="true" />
          <div className="month-badge" aria-hidden="true">
            <div className="year-text">{currentYear}</div>
            <div className="month-text">{MONTHS[currentMonth]}</div>
          </div>
        </header>

        {/* Body: Notes + Grid */}
        <div className="calendar-body">
          {/* Notes Section */}
          <section className="notes-section" aria-label="Calendar notes">
            <div className="notes-label">Notes</div>
            <div className="notes-lines">
              {notes.map((note, i) => (
                <div key={i} className="note-line-wrapper">
                  <input
                    className="note-input"
                    type="text"
                    value={note}
                    onChange={(e) => updateNote(i, e.target.value)}
                    placeholder="..."
                    aria-label={`Note line ${i + 1}`}
                    id={`note-line-${i + 1}`}
                    maxLength={40}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Calendar Grid */}
          <section className="calendar-grid-section" aria-label="Calendar dates">
            {/* Day Headers */}
            <div className="day-headers" role="row">
              {DAY_HEADERS.map((d) => (
                <div
                  key={d}
                  className={`day-header${d === 'SAT' || d === 'SUN' ? ' weekend' : ''}`}
                  role="columnheader"
                  aria-label={d}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Date Cells */}
            <div className="days-grid" role="grid" aria-label={`${MONTHS[currentMonth]} ${currentYear}`}>
              {cells.map((cell, idx) => {
                const isWeekend = cell.col === 5 || cell.col === 6
                const isTodayCell = isToday(cell.day, cell.month)
                const isSelected =
                  selectedDate &&
                  selectedDate.year === (cell.month === 'prev' ? (currentMonth === 0 ? currentYear - 1 : currentYear) : cell.month === 'next' ? (currentMonth === 11 ? currentYear + 1 : currentYear) : currentYear) &&
                  selectedDate.month === (cell.month === 'prev' ? (currentMonth === 0 ? 11 : currentMonth - 1) : cell.month === 'next' ? (currentMonth === 11 ? 0 : currentMonth + 1) : currentMonth) &&
                  selectedDate.day === cell.day

                const cellClasses = [
                  'day-cell',
                  cell.month !== 'current' ? 'other-month' : '',
                  isWeekend && cell.month === 'current' ? 'weekend' : '',
                  isTodayCell ? 'today' : '',
                  isSelected && !isTodayCell ? 'selected' : '',
                  hasEvents(cell.day, cell.month) ? 'has-event' : '',
                ]
                  .filter(Boolean)
                  .join(' ')

                return (
                  <div
                    key={idx}
                    className={cellClasses}
                    role="gridcell"
                    tabIndex={0}
                    aria-label={`${cell.day}${cell.month !== 'current' ? ' (other month)' : ''}${isTodayCell ? ', today' : ''}`}
                    aria-pressed={!!isSelected}
                    onClick={() => handleDayClick(cell.day, cell.month)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleDayClick(cell.day, cell.month)
                      }
                    }}
                    id={`day-${currentYear}-${currentMonth + 1}-${cell.day}-${cell.month}`}
                  >
                    {cell.day}
                  </div>
                )
              })}
            </div>
          </section>
        </div>
      </article>

      {/* Event Modal */}
      {selectedDate && (
        <EventModal
          date={selectedDate}
          events={selectedEvents}
          onClose={() => setSelectedDate(null)}
          onAddEvent={addEvent}
          onDeleteEvent={deleteEvent}
        />
      )}
    </div>
  )
}
