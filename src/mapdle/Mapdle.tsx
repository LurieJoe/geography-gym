import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { InteractiveGlobe, type GlobeCoordinate } from '../InteractiveGlobe'
import {
  BAND_EMOJI, BAND_WORD, MAX_PINS, pinBand, bearingDeg, compass, currentStreak, dayLabel, dayNumber, formatDistance,
  interpolate, loadSaved, msUntilNextDay, newRecord, puzzleForDay, recordFinished, save, shareText, submitPin, winHeadline,
  type DayRecord, type Saved,
} from './logic'
import { GREEN_KM, YELLOW_KM } from './puzzles'
import { applyTheme, readThemeMode, saveThemeMode, type ThemeMode } from './theme'
import { LearnPanel, PRACTICE, practiceKeyFor } from './LearnPanel'
import { PUZZLE_FACTS } from './puzzleFacts'
import { track } from './analytics'
import { REGION_KIND, checkInside, preloadRegion } from './regions'

/** True on a phone turned sideways (the two-column layout). */
function isPhoneLandscape() {
  try { return window.matchMedia('(orientation: landscape) and (max-height: 500px) and (min-width: 560px)').matches } catch { return false }
}

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
    // An installed app can stay open for days, so look for a new version whenever it comes back to the front.
    let current: ServiceWorkerRegistration | null = null
    const checkForUpdate = () => {
      if (!document.hidden) current?.update().catch(() => { /* try again next time */ })
    }
    document.addEventListener('visibilitychange', checkForUpdate)
    navigator.serviceWorker.register('./sw.js').then((registration) => {
      current = registration
      if (registration.waiting && navigator.serviceWorker.controller) setWaiting(registration.waiting)
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) setWaiting(worker)
        })
      })
    }).catch(() => { /* offline support is optional */ })
    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onChange)
      document.removeEventListener('visibilitychange', checkForUpdate)
    }
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
  const calloutRef = useRef<HTMLDivElement>(null)
  const [panel, setPanel] = useState<'help' | 'stats' | 'learn' | 'result' | null>(() => (loadSaved().seenHelp ? null : 'help')) // seenHelp = "Don’t show on startup" is ticked
  const [notice, setNotice] = useState('')
  const [checking, setChecking] = useState(false)
  const [globeZoom, setGlobeZoom] = useState<number | undefined>(undefined) // keeps your zoom after each pin
  const [themeMode, setThemeMode] = useState<ThemeMode>(readThemeMode)
  const waitingWorker = useServiceWorker()

  const record: DayRecord = saved.records[day] ?? newRecord(day)
  const finished = record.status !== 'playing'
  const countdown = useCountdown(finished)
  const target = { lat: puzzle.lat, lon: puzzle.lon }

  // A new version is ready. If today's game has not started, switch to it now. Otherwise the bar lets the player choose.
  useEffect(() => {
    if (waitingWorker && record.pins.length === 0 && !pending && panel === null) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' })
    }
  }, [waitingWorker, record.pins.length, pending, panel])

  useEffect(() => { setPending(null) }, [day])
  // Sideways phone: after tapping the globe, bring the Confirm button into view.
  useEffect(() => {
    if (pending && isPhoneLandscape()) calloutRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [pending])
  useEffect(() => {
    if (!panel) return
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setPanel(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [panel])
  const regionKind = REGION_KIND[puzzle.id]
  useEffect(() => { preloadRegion(puzzle.id) }, [puzzle.id])

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

  async function confirmPin() {
    if (!pending || finished || checking) return
    setChecking(true)
    const inside = await checkInside(puzzle.id, target, pending)
    setChecking(false)
    const nextRecord = submitPin(record, pending, target, inside)
    const eventBase = { puzzle: day, phase: day >= 1 ? 'live' : 'preview' }
    const placed = nextRecord.pins[nextRecord.pins.length - 1]
    track('pin_placed', { ...eventBase, pin: nextRecord.pins.length, band: placed ? pinBand(placed) : 'none' })
    if (nextRecord.status === 'won') track('game_won', { ...eventBase, pins: nextRecord.pins.length })
    if (nextRecord.status === 'lost') track('game_lost', eventBase)
    const stats = nextRecord.status !== 'playing' ? recordFinished(saved.stats, nextRecord) : saved.stats
    update({ ...saved, records: { ...saved.records, [day]: nextRecord }, stats })
    setPending(null)
    if (isPhoneLandscape()) window.scrollTo({ top: 0, behavior: 'smooth' }) // back up to the clues and distances
    if (nextRecord.status !== 'playing') window.setTimeout(() => setPanel('result'), 900)
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
    ...record.pins.map((pin, index) => ({ lat: pin.lat, lon: pin.lon, index: index + 1, band: pinBand(pin) as string })),
    ...(pending && !finished ? [{ lat: pending.lat, lon: pending.lon, index: record.pins.length + 1, band: 'pending' as string }] : []),
  ]
  const pinsLeft = MAX_PINS - record.pins.length
  const clueCount = finished ? 3 : Math.min(3, record.pins.length + 1)
  const unit = saved.unit
  const streak = currentStreak(saved.stats, day)
  const winPct = saved.stats.played ? Math.round((saved.stats.wins / saved.stats.played) * 100) : 0
  const maxBar = Math.max(1, ...saved.stats.distribution)
  const practiceKey = practiceKeyFor(puzzle)
  const headline = winHeadline(record)
  const resultBody = finished ? (
    <>
        <h2 className={headline.special ? 'mapdle-celebrate' : undefined}>{headline.special && <span aria-hidden="true">🎉 </span>}{headline.text}</h2>
        <p className="mapdle-answer-big"><span>The answer was</span><strong>{puzzle.answer}</strong></p>
        {PUZZLE_FACTS[puzzle.id] && <p className="mapdle-fun-fact"><strong>Fun fact:</strong> {PUZZLE_FACTS[puzzle.id].fact}</p>}
        <pre className="mapdle-share">{shareText(record, puzzle.subject)}</pre>
        <div className="mapdle-actions">
          <button type="button" className="primary" onClick={share}>Share result</button>
          <button type="button" onClick={() => { track('learn_more_opened', { puzzle: day, phase: day >= 1 ? 'live' : 'preview' }); setPanel('learn') }}>Learn more</button>
          <button type="button" onClick={() => setPanel('stats')}>See stats</button>
        </div>
        <a className="mapdle-practice-cta" href={PRACTICE[practiceKey].href} target="_blank" rel="noopener" onClick={() => track('learn_practice_clicked', { puzzle: day, phase: day >= 1 ? 'live' : 'preview', practice: practiceKey, from: 'result' })}>{PRACTICE[practiceKey].label} <span aria-hidden="true">→</span></a>
        {notice && <p className="mapdle-notice" role="status">{notice}</p>}
        <p className="mapdle-next">Next puzzle in <strong>{countdown}</strong></p>
    </>
  ) : null

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

      {record.pins.length > 0 && (
        <section className="mapdle-chips" aria-label="Your pins" aria-live="polite">
          <ol>
            {record.pins.map((pin, index) => {
              const band = pinBand(pin)
              const heading = compass(bearingDeg(pin, target))
              const win = band === 'green'
              return (
                <li key={index} className={`pin-chip band-${band}`} aria-label={`Pin ${index + 1}: ${BAND_WORD[band]}${win ? ', you win' : `, ${formatDistance(pin.km, unit)}, go ${heading.label}`}`}>
                  <span aria-hidden="true">{BAND_EMOJI[band]}</span>
                  <strong aria-hidden="true">{index + 1}</strong>
                  {win
                    ? <span aria-hidden="true">{regionKind ? 'Inside!' : 'Close enough!'}</span>
                    : <span aria-hidden="true">{formatDistance(pin.km, unit)} <span className="chip-arrow">{heading.arrow} {heading.label}</span></span>}
                </li>
              )
            })}
          </ol>
        </section>
      )}

      <section className={`mapdle-map${finished ? ' is-finished' : ''}`}>
        {finished && (
          <button type="button" className="primary mapdle-show-result" onClick={() => setPanel('result')}>Show result, share, and fun fact</button>
        )}
        {!finished && (
          <div className="mapdle-status">
            <ol className="mapdle-tracker" aria-label={`Pin ${record.pins.length + 1} of ${MAX_PINS}. ${pinsLeft} pins left.`}>
              {Array.from({ length: MAX_PINS }, (_, index) => {
                const pin = record.pins[index]
                const state = pin ? `used band-${pinBand(pin)}` : index === record.pins.length ? 'current' : 'open'
                return <li key={index} className={`tracker-dot ${state}`}>{index + 1}</li>
              })}
            </ol>
            {record.pins.length >= 2 && (
              <p className="mapdle-clue-notice" role="status">
                {record.pins.length === 2
                  ? `Last clue unlocked! All 3 clues are open. You have ${pinsLeft} pins left.`
                  : `You’ve used all 3 clues, but you still have ${pinsLeft} ${pinsLeft === 1 ? 'pin' : 'pins'} left. The arrows and distances will keep guiding you.`}
              </p>
            )}
            <div ref={calloutRef} className={`mapdle-callout${record.pins.length >= 2 ? ' all-clues' : ''}`} role="status">
              {pending ? (
                <>
                  <p><strong>Pin {record.pins.length + 1} is placed.</strong> Confirm it, or tap the globe somewhere else to move it.</p>
                  <div className="mapdle-actions">
                    <button type="button" className="primary" onClick={confirmPin} disabled={checking}>{checking ? 'Checking…' : `Confirm pin ${record.pins.length + 1} of ${MAX_PINS}`}</button>
                    <button type="button" onClick={() => setPending(null)}>Clear</button>
                  </div>
                </>
              ) : record.pins.length === 0 ? (
                <p><strong>Tap the globe to place pin 1 of {MAX_PINS}.</strong> Drag to turn it first if you need to.</p>
              ) : record.pins.length === 1 ? (
                <p><strong>Clue 2 is unlocked.</strong> Follow the arrow, then tap the globe to place pin 2. You have {pinsLeft} pins left.</p>
              ) : (
                <p><strong>Tap the globe to place pin {record.pins.length + 1}.</strong></p>
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
          explore
          targetLabel={regionKind ? 'Center' : 'Answer'}
          onZoomChange={setGlobeZoom}
        />
      </section>

      <section className="mapdle-pins" aria-label="Color legend">
        <p className="mapdle-legend">
          {regionKind
            ? <>🟩 inside the {regionKind}, you win · 🟨 outside, up to {formatDistance(YELLOW_KM, unit)} away · 🟥 farther.</>
            : <>🟩 close enough to win (within {formatDistance(GREEN_KM, unit)}) · 🟨 up to {formatDistance(YELLOW_KM, unit)} · 🟥 farther.</>}{' '}
          The arrow points from your pin toward the answer.
        </p>
      </section>

      {finished && (
        <section className={`mapdle-result ${record.status}`} aria-label="Result">
          {resultBody}
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
        <div className="mapdle-modal" onClick={(event) => { if (event.target === event.currentTarget) setPanel(null) }} role="dialog" aria-modal="true" aria-label={panel === 'result' ? 'Your result' : panel === 'help' ? 'How to play' : panel === 'learn' ? 'About today’s answer' : 'Statistics'}>
          <div className="mapdle-modal-card">
            {panel === 'result' ? (
              <div className={`mapdle-result-body ${record.status}`}>{resultBody}</div>
            ) : panel === 'learn' ? (
              <LearnPanel puzzle={puzzle} day={day} />
            ) : panel === 'help' ? (
              <>
                <h2>How to play</h2>
                <ul>
                  <li>Each day has one hidden place. Today’s subject is shown at the top.</li>
                  <li>Place up to {MAX_PINS} pins on the globe. You start with one clue and unlock more after each pin.</li>
                  <li>🟩 means within {formatDistance(GREEN_KM, unit)}: close enough, you win! 🟨 is up to {formatDistance(YELLOW_KM, unit)} away. 🟥 is farther.</li>
                  <li>When the answer is a whole U.S. state or country, 🟩 means your pin is inside it (with a little leeway at the border). The legend under the globe tells you which kind of puzzle you have.</li>
                  <li>After each miss you see how far away you were and which way to go, and the globe turns closer to the answer.</li>
                  <li>Zoom in with the + and − buttons or by pinching. Country borders fade in as you zoom, and U.S. state lines appear a little closer. Reset puts the globe back.</li>
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
              className={`mapdle-modal-close${panel === 'learn' || panel === 'result' ? '' : ' primary'}`}
              onClick={() => setPanel(null)}
            >
              {panel === 'help' ? 'Start playing' : panel === 'result' ? 'Back to the globe' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
