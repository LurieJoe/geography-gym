import { useCallback, useEffect, useMemo, useState } from 'react'
import { InteractiveGlobe, type GlobeCoordinate } from '../InteractiveGlobe'
import {
  BAND_EMOJI, BAND_WORD, MAX_PINS, bandFor, bearingDeg, compass, currentStreak, dayLabel, dayNumber, formatDistance,
  interpolate, loadSaved, msUntilNextDay, newRecord, puzzleForDay, recordFinished, save, shareText, submitPin,
  type DayRecord, type Saved,
} from './logic'
import { GREEN_KM, YELLOW_KM } from './puzzles'
import { applyTheme, readThemeMode, saveThemeMode, type ThemeMode } from './theme'
import { LearnPanel } from './LearnPanel'
import { track } from './analytics'

function useDay() {
  const [day, setDay] = useState(() => dayNumber())
  useEffect(() => {
    const check = () => setDay((current) => {
      const next = dayNumber()
      return next === current ? current : next
    })
    const timer = window.setInterval(check, 20000)
    document.addEventListener('visibilitychange', check)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', check)
    }
  }, [])
  return day
}

function useCountdown(active: boolean) {
  const [ms, setMs] = useState(() => msUntilNextDay())
  useEffect(() => {
    if (!active) return
    const tick = () => setMs(msUntilNextDay())
    tick()
    const timer = window.setInterval(tick, 1000)
    return () => window.clearInterval(timer)
  }, [active])
  const total = Math.max(0, Math.floor(ms / 1000))
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`
}

function useServiceWorker() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null)
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    let reloading = false
    // Only reload for a real update. On a first visit the helper simply takes over, with nothing to reload.
    const hadController = !!navigator.serviceWorker.controller
    const onChange = () => {
      if (reloading || !hadController) return
      reloading = true
      window.location.reload()
    }
    navigator.serviceWorker.addEventListener('controllerchange', onChange)
    navigator.serviceWorker.register('./sw.js').then((registration) => {
      if (registration.waiting && navigator.serviceWorker.controller) setWaiting(registration.waiting)
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) setWaiting(worker)
        })
      })
    }).catch(() => { /* offline support is optional */ })
    return () => navigator.serviceWorker.removeEventListener('controllerchange', onChange)
  }, [])
  return waiting
}

function ThemeIcon({ mode }: { mode: ThemeMode }) {
  const common = { 'aria-hidden': true, width: 19, height: 19, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const
  if (mode === 'light') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </svg>
    )
  }
  if (mode === 'dark') {
    return (
      <svg {...common}>
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      </svg>
    )
  }
  return (
    <svg {...common} strokeLinecap={undefined} strokeLinejoin={undefined}>
      <path d="M12 3a9 9 0 0 0 0 18Z" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  )
}

export default function Mapdle() {
  const day = useDay()
  const puzzle = useMemo(() => puzzleForDay(day), [day])
  const [saved, setSaved] = useState<Saved>(() => loadSaved())
  const [pending, setPending] = useState<GlobeCoordinate | null>(null)
  const [panel, setPanel] = useState<'help' | 'stats' | 'learn' | null>(() => (loadSaved().seenHelp ? null : 'help')) // seenHelp = "Don’t show on startup" is ticked
  const [notice, setNotice] = useState('')
  const [globeZoom, setGlobeZoom] = useState<number | undefined>(undefined) // keeps your zoom after each pin
  const [themeMode, setThemeMode] = useState<ThemeMode>(readThemeMode)
  const waitingWorker = useServiceWorker()

  const record: DayRecord = saved.records[day] ?? newRecord(day)
  const finished = record.status !== 'playing'
  const countdown = useCountdown(finished)
  const target = { lat: puzzle.lat, lon: puzzle.lon }

  useEffect(() => { setPending(null) }, [day])

  useEffect(() => {
    applyTheme(themeMode)
    if (themeMode !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme('system')
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [themeMode])

  function cycleTheme() {
    const next: ThemeMode = themeMode === 'system' ? 'light' : themeMode === 'light' ? 'dark' : 'system'
    saveThemeMode(next)
    setThemeMode(next)
  }

  const update = useCallback((next: Saved) => { setSaved(next); save(next) }, [])

  function confirmPin() {
    if (!pending || finished) return
    const nextRecord = submitPin(record, pending, target)
    const eventBase = { puzzle: day, phase: day >= 1 ? 'live' : 'preview' }
    const placed = nextRecord.pins[nextRecord.pins.length - 1]
    track('pin_placed', { ...eventBase, pin: nextRecord.pins.length, band: placed ? bandFor(placed.km) : 'none' })
    if (nextRecord.status === 'won') track('game_won', { ...eventBase, pins: nextRecord.pins.length })
    if (nextRecord.status === 'lost') track('game_lost', eventBase)
    const stats = nextRecord.status !== 'playing' ? recordFinished(saved.stats, nextRecord) : saved.stats
    update({ ...saved, records: { ...saved.records, [day]: nextRecord }, stats })
    setPending(null)
  }

  async function share() {
    track('share_clicked', { puzzle: day, phase: day >= 1 ? 'live' : 'preview', result: record.status })
    const text = shareText(record, puzzle.subject)
    try {
      if (navigator.share) {
        await navigator.share({ text })
        return
      }
    } catch (error) {
      if ((error as DOMException)?.name === 'AbortError') return
    }
    try {
      await navigator.clipboard.writeText(text)
      setNotice('Result copied. Paste it anywhere to share.')
    } catch {
      setNotice('Copy this result:\n' + text)
    }
  }

  const lastPin = record.pins[record.pins.length - 1]
  const focus = finished ? target : lastPin ? interpolate(lastPin, target, 0.55) : undefined
  const attempts = [
    ...record.pins.map((pin, index) => ({ lat: pin.lat, lon: pin.lon, index: index + 1, band: bandFor(pin.km) as string })),
    ...(pending && !finished ? [{ lat: pending.lat, lon: pending.lon, index: record.pins.length + 1, band: 'pending' as string }] : []),
  ]
  const pinsLeft = MAX_PINS - record.pins.length
  const clueCount = finished ? 3 : Math.min(3, record.pins.length + 1)
  const unit = saved.unit
  const streak = currentStreak(saved.stats, day)
  const winPct = saved.stats.played ? Math.round((saved.stats.wins / saved.stats.played) * 100) : 0
  const maxBar = Math.max(1, ...saved.stats.distribution)

  return (
    <main className="mapdle">
      {waitingWorker && (
        <div className="mapdle-update" role="status">
          A new version of Mapdle is ready.
          <button type="button" onClick={() => waitingWorker.postMessage({ type: 'SKIP_WAITING' })}>Update now</button>
        </div>
      )}

      <header className="mapdle-header">
        <div>
          <h1>Mapdle</h1>
          <p className="mapdle-day">{dayLabel(day)}</p>
        </div>
        <div className="mapdle-header-buttons">
          <div className="unit-toggle" role="group" aria-label="Distance units">
            {(['km', 'mi'] as const).map((choice) => (
              <button
                key={choice}
                type="button"
                aria-pressed={unit === choice}
                className={unit === choice ? 'is-on' : ''}
                onClick={() => unit !== choice && update({ ...saved, unit: choice })}
              >
                {choice}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="mapdle-theme-button"
            onClick={cycleTheme}
            aria-label={`Theme: ${themeMode === 'system' ? 'auto' : themeMode}. Change theme`}
            title={`Theme: ${themeMode === 'system' ? 'auto' : themeMode}`}
          >
            <ThemeIcon mode={themeMode} />
          </button>
          <button type="button" onClick={() => setPanel('stats')}>Stats</button>
          <button type="button" onClick={() => setPanel('help')}>How to play</button>
        </div>
      </header>

      <section className="mapdle-subject" aria-label="Today's subject">
        <span>Today’s subject</span>
        <strong>{puzzle.subject}</strong>
      </section>

      <section className="mapdle-clues" aria-label="Clues">
        <ol>
          {puzzle.clues.map((clue, index) => (
            <li key={index} className={index < clueCount ? 'is-open' : 'is-locked'}>
              <span className="clue-number">{index + 1}</span>
              <span className="clue-text">
                {index < clueCount
                  ? clue
                  : index === 1 ? 'Unlocks after your first pin.' : 'Unlocks after your second pin.'}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className={`mapdle-map${finished ? ' is-finished' : ''}`}>
        {!finished && (
          <div className="mapdle-status">
            <ol className="mapdle-tracker" aria-label={`Pin ${record.pins.length + 1} of ${MAX_PINS}. ${pinsLeft} pins left.`}>
              {Array.from({ length: MAX_PINS }, (_, index) => {
                const pin = record.pins[index]
                const state = pin ? `used band-${bandFor(pin.km)}` : index === record.pins.length ? 'current' : 'open'
                return <li key={index} className={`tracker-dot ${state}`}>{index + 1}</li>
              })}
            </ol>
            <div className={`mapdle-callout${record.pins.length >= 2 ? ' all-clues' : ''}`} role="status">
              {pending ? (
                <>
                  <p><strong>Pin {record.pins.length + 1} is placed.</strong> Confirm it, or tap the globe somewhere else to move it.</p>
                  <div className="mapdle-actions">
                    <button type="button" className="primary" onClick={confirmPin}>Confirm pin {record.pins.length + 1} of {MAX_PINS}</button>
                    <button type="button" onClick={() => setPending(null)}>Clear</button>
                  </div>
                </>
              ) : record.pins.length === 0 ? (
                <p><strong>Tap the globe to place pin 1 of {MAX_PINS}.</strong> Drag to turn it first if you need to.</p>
              ) : record.pins.length === 1 ? (
                <p><strong>Clue 2 is unlocked.</strong> Follow the arrow, then tap the globe to place pin 2. You have {pinsLeft} pins left.</p>
              ) : (
                <p><strong>All 3 clues are unlocked.</strong> You still have {pinsLeft} more {pinsLeft === 1 ? 'pin' : 'pins'}. Tap the globe to place pin {record.pins.length + 1}.</p>
              )}
            </div>
          </div>
        )}
        <InteractiveGlobe
          key={`${day}-${record.pins.length}-${finished ? 'done' : 'live'}`}
          ariaLabel={`Globe. Place pin ${Math.min(record.pins.length + 1, MAX_PINS)} of ${MAX_PINS}.`}
          attempts={attempts}
          answered={finished}
          target={target}
          focusTarget={focus}
          onPlace={(coordinate) => setPending(coordinate)}
          zoom={globeZoom}
          borders
          onZoomChange={setGlobeZoom}
        />
      </section>

      <section className="mapdle-pins" aria-label="Your pins" aria-live="polite">
        <ol>
          {record.pins.map((pin, index) => {
            const band = bandFor(pin.km)
            const heading = compass(bearingDeg(pin, target))
            return (
              <li key={index} className={`pin-row band-${band}`}>
                <span className="pin-block" aria-hidden="true">{BAND_EMOJI[band]}</span>
                <span className="pin-name">Pin {index + 1}</span>
                <span className="pin-band">{BAND_WORD[band]}</span>
                <span className="pin-distance">{band === 'green' ? 'Found it' : formatDistance(pin.km, unit)}</span>
                {band !== 'green' && (
                  <span className="pin-direction" title={`Go ${heading.label}`}>
                    <span aria-hidden="true">{heading.arrow}</span> {heading.label}
                  </span>
                )}
              </li>
            )
          })}
        </ol>
        <p className="mapdle-legend">
          🟩 within {formatDistance(GREEN_KM, unit)} · 🟨 up to {formatDistance(YELLOW_KM, unit)} · 🟥 farther.
          The arrow points from your pin toward the answer.
        </p>
      </section>

      {finished && (
        <section className={`mapdle-result ${record.status}`} aria-label="Result">
          <h2>{record.status === 'won' ? (record.pins.length === 1 ? 'First pin!' : `Found it in ${record.pins.length} pins`) : 'Out of pins'}</h2>
          <p className="mapdle-answer">The answer was <strong>{puzzle.answer}</strong>.</p>
          <pre className="mapdle-share">{shareText(record, puzzle.subject)}</pre>
          <div className="mapdle-actions">
            <button type="button" className="primary" onClick={share}>Share result</button>
            <button type="button" onClick={() => { track('learn_more_opened', { puzzle: day, phase: day >= 1 ? 'live' : 'preview' }); setPanel('learn') }}>Learn more</button>
            <button type="button" onClick={() => setPanel('stats')}>See stats</button>
          </div>
          {notice && <p className="mapdle-notice" role="status">{notice}</p>}
          <p className="mapdle-next">Next puzzle in <strong>{countdown}</strong></p>
        </section>
      )}

      <section className="mapdle-about" aria-labelledby="about-mapdle">
        <h2 id="about-mapdle">About Mapdle</h2>
        <p>
          Mapdle is a free daily geography game. Every day there is one hidden place, such as a state, a country,
          a landmark, or a waterway. You get up to five pins on the globe. After each pin you see how close you were
          (green, yellow, or red), which direction to go, and a new clue.
        </p>
        <p>
          Everyone gets the same puzzle each day, so you can compare results by sharing your colored squares. Mapdle is part
          of <a href="../">Geography Gym</a>, where you can also <a href="../quizzes/">study states, countries, landmarks, and waterways</a>.
        </p>
      </section>

      <footer className="mapdle-footer">
        <a href="./how-to-play/">How to play</a>
        <span aria-hidden="true">·</span>
        <a href="https://forms.gle/mRhYSimCSsg96rCs8" target="_blank" rel="noreferrer">Send feedback</a>
        <span aria-hidden="true">·</span>
        <a href="../privacy/">Privacy</a>
        <span aria-hidden="true">·</span>
        <a href="../">Geography Gym</a>
      </footer>

      {panel && (
        <div className="mapdle-modal" role="dialog" aria-modal="true" aria-label={panel === 'help' ? 'How to play' : panel === 'learn' ? 'About today’s answer' : 'Statistics'}>
          <div className="mapdle-modal-card">
            {panel === 'learn' ? (
              <LearnPanel puzzle={puzzle} day={day} />
            ) : panel === 'help' ? (
              <>
                <h2>How to play</h2>
                <ul>
                  <li>Each day has one hidden place. Today’s subject is shown at the top.</li>
                  <li>Place up to {MAX_PINS} pins on the globe. You start with one clue and unlock more after each pin.</li>
                  <li>🟩 means within {GREEN_KM} km: you found it. 🟨 is up to {YELLOW_KM} km away. 🟥 is farther.</li>
                  <li>After each miss you see how far away you were and which way to go, and the globe turns closer to the answer.</li>
                  <li>A new puzzle appears every day at midnight.</li>
                </ul>
                <p className="mapdle-note"><a href="./how-to-play/">Read the full guide</a> with an example round.</p>
                <label className="mapdle-check">
                  <input
                    type="checkbox"
                    checked={saved.seenHelp}
                    onChange={(event) => update({ ...saved, seenHelp: event.target.checked })}
                  />
                  <span>Don’t show this on startup</span>
                </label>
              </>
            ) : (
              <>
                <h2>Statistics</h2>
                <dl className="mapdle-stats">
                  <div><dt>Played</dt><dd>{saved.stats.played}</dd></div>
                  <div><dt>Win %</dt><dd>{winPct}</dd></div>
                  <div><dt>Streak</dt><dd>{streak}</dd></div>
                  <div><dt>Best</dt><dd>{saved.stats.maxStreak}</dd></div>
                </dl>
                <h3>Pins used to win</h3>
                <ol className="mapdle-dist">
                  {saved.stats.distribution.map((count, index) => (
                    <li key={index}>
                      <span>{index + 1}</span>
                      <span className="bar" style={{ width: `${Math.max(8, (count / maxBar) * 100)}%` }}>{count}</span>
                    </li>
                  ))}
                </ol>
                <p className="mapdle-note">Stats are saved on this device only.</p>
              </>
            )}
            <button
              type="button"
              className={panel === 'learn' ? '' : 'primary'}
              onClick={() => setPanel(null)}
            >
              {panel === 'help' ? 'Start playing' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
