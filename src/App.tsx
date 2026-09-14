import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  Award,
  Check,
  ChevronDown,
  ChevronUp,
  Clock3,
  Compass,
  Download,
  ExternalLink,
  Flag,
  Settings,
  Globe2,
  HelpCircle,
  Landmark,
  Lightbulb,
  Map,
  MapPin,
  Moon,
  RotateCcw,
  Route,
  Sparkles,
  Sun,
  Trophy,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import {
  buildQuestions,
  categoryDetails,
  questionPoolCounts,
  type Category,
  type MatchingQuestion,
  type OrderQuestion,
  type Question,
} from './data'
import { US_MAP_VIEWBOX, usRegionShapes, usStateShapes } from './usStateShapes'
import './App.css'

type Screen = 'home' | 'quiz' | 'results'
type ThemeMode = 'system' | 'light' | 'dark'
type RoundSize = 10 | 25 | 50
type Modal = 'settings' | 'tips' | 'setup' | 'startup-tip' | 'reset-stats' | null
type FeedbackKind = 'correct' | 'incorrect'

type Stats = {
  games: number
  correct: number
  answered: number
  bestStreak: number
}

type Preferences = {
  theme: ThemeMode
  sound: boolean
  timer: boolean
  tipsStartup: boolean
  roundSize: RoundSize
}

const defaultStats: Stats = { games: 0, correct: 0, answered: 0, bestStreak: 0 }
const APP_VERSION = 'v6'
const defaultPreferences: Preferences = {
  theme: 'system',
  sound: true,
  timer: false,
  tipsStartup: true,
  roundSize: 10,
}

const tips = [
  {
    title: 'Two chances to find the answer',
    text: 'A wrong multiple-choice or map answer stays red, but the correct answer is not revealed until your second miss.',
  },
  {
    title: 'Build connections, not lists',
    text: 'Notice neighboring states, relative directions, and landmark locations. Those connections make facts easier to remember.',
  },
  {
    title: 'Matching Pairs rewards recall',
    text: 'Choose one tile from each column. Correct pairs turn green and dim; incorrect pairs shake and remain available.',
  },
  {
    title: 'Choose your workout length',
    text: 'Every workout offers 10, 25, or 50 questions. Short rounds are great for daily practice; longer rounds provide more variety.',
  },
  {
    title: 'Use the timer only when it helps',
    text: 'The timer is a simple stopwatch, not a countdown. Turn it on for a challenge or off for pressure-free learning.',
  },
  {
    title: 'Try a Mixed Workout',
    text: 'Mixed rounds combine U.S. geography, world geography, landmark matching, and geographic ordering.',
  },
  {
    title: 'Install for easy access',
    text: 'Install Geography Gym from your browser and keep practicing after the app has been cached for offline use.',
  },
]

function readJson<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key)
    return saved ? { ...fallback, ...JSON.parse(saved) } : fallback
  } catch {
    return fallback
  }
}

function shuffle<T>(items: readonly T[]) {
  return [...items].sort(() => Math.random() - 0.5)
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function playFeedbackSound(kind: FeedbackKind, enabled: boolean) {
  if (!enabled) return
  const AudioContextClass = window.AudioContext
  if (!AudioContextClass) return
  const context = new AudioContextClass()
  const gain = context.createGain()
  gain.gain.setValueAtTime(0.0001, context.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.14, context.currentTime + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.32)
  gain.connect(context.destination)

  const frequencies = kind === 'correct' ? [523.25, 659.25] : [220, 164.81]
  frequencies.forEach((frequency, index) => {
    const oscillator = context.createOscillator()
    oscillator.type = kind === 'correct' ? 'sine' : 'triangle'
    oscillator.frequency.value = frequency
    oscillator.connect(gain)
    oscillator.start(context.currentTime + index * 0.1)
    oscillator.stop(context.currentTime + 0.22 + index * 0.1)
  })
  window.setTimeout(() => context.close().catch(() => undefined), 500)
}

function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [modal, setModal] = useState<Modal>(null)
  const [pendingCategory, setPendingCategory] = useState<Category>('mixed')
  const [category, setCategory] = useState<Category>('mixed')
  const [questions, setQuestions] = useState<Question[]>([])
  const [questionIndex, setQuestionIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestRunStreak, setBestRunStreak] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [wasCorrect, setWasCorrect] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [roundStartedAt, setRoundStartedAt] = useState<number | null>(null)
  const [stats, setStats] = useState<Stats>(() =>
    readJson('geography-gym-stats', defaultStats),
  )
  const [preferences, setPreferences] = useState<Preferences>(() =>
    readJson('geography-gym-preferences', defaultPreferences),
  )
  const [showStartupOnLaunch] = useState(() =>
    readJson('geography-gym-preferences', defaultPreferences).tipsStartup,
  )
  const [startupTip, setStartupTip] = useState(tips[0])
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null)
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)
  const updateRequested = useRef(false)
  const reloadingForUpdate = useRef(false)

  useEffect(() => {
    const resolveTheme = () => {
      const theme =
        preferences.theme === 'system'
          ? window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light'
          : preferences.theme
      document.documentElement.setAttribute('data-theme', theme)
      document.documentElement.setAttribute('data-theme-mode', preferences.theme)
    }
    resolveTheme()
    localStorage.setItem('geography-gym-preferences', JSON.stringify(preferences))
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    media.addEventListener('change', resolveTheme)
    return () => media.removeEventListener('change', resolveTheme)
  }, [preferences])

  useEffect(() => {
    if (!showStartupOnLaunch) return
    const timer = window.setTimeout(() => {
      const index = Number.parseInt(localStorage.getItem('geography-gym-tip-index') ?? '0', 10)
      setStartupTip(tips[index % tips.length])
      localStorage.setItem('geography-gym-tip-index', String((index + 1) % tips.length))
      setModal('startup-tip')
    }, 0)
    return () => window.clearTimeout(timer)
  }, [showStartupOnLaunch])

  useEffect(() => {
    const handleInstall = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event)
    }
    window.addEventListener('beforeinstallprompt', handleInstall)
    if (!('serviceWorker' in navigator)) {
      return () => window.removeEventListener('beforeinstallprompt', handleInstall)
    }

    let registration: ServiceWorkerRegistration | null = null
    let updateInterval: number | null = null

    const handleControllerChange = () => {
      if (!updateRequested.current || reloadingForUpdate.current) return
      reloadingForUpdate.current = true
      window.location.reload()
    }

    const handleUpdateFound = () => {
      const installingWorker = registration?.installing
      if (!installingWorker) return
      installingWorker.addEventListener('statechange', () => {
        if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
          setWaitingWorker(installingWorker)
        }
      })
    }

    const checkForUpdate = () => {
      registration?.update().catch(() => undefined)
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') checkForUpdate()
    }

    const registerServiceWorker = async () => {
      try {
        registration = await navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' })
        if (registration.waiting && navigator.serviceWorker.controller) {
          setWaitingWorker(registration.waiting)
        }
        registration.addEventListener('updatefound', handleUpdateFound)
        checkForUpdate()
        updateInterval = window.setInterval(checkForUpdate, 30 * 60 * 1000)
      } catch (error) {
        console.error('Service worker registration failed:', error)
      }
    }

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    if (document.readyState === 'complete') {
      void registerServiceWorker()
    } else {
      window.addEventListener('load', registerServiceWorker, { once: true })
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstall)
      window.removeEventListener('load', registerServiceWorker)
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      registration?.removeEventListener('updatefound', handleUpdateFound)
      if (updateInterval !== null) window.clearInterval(updateInterval)
    }
  }, [])

  useEffect(() => {
    if (screen !== 'quiz' || !preferences.timer || !roundStartedAt) return
    const update = () => setElapsed(Math.floor((Date.now() - roundStartedAt) / 1000))
    update()
    const interval = window.setInterval(update, 1000)
    return () => window.clearInterval(interval)
  }, [screen, preferences.timer, roundStartedAt])

  const currentQuestion = questions[questionIndex]
  const accuracy = stats.answered ? Math.round((stats.correct / stats.answered) * 100) : 0

  function updatePreference<K extends keyof Preferences>(key: K, value: Preferences[K]) {
    setPreferences((current) => ({ ...current, [key]: value }))
  }

  function openWorkoutSetup(nextCategory: Category) {
    setPendingCategory(nextCategory)
    setModal('setup')
  }

  function startWorkout() {
    setCategory(pendingCategory)
    setQuestions(buildQuestions(pendingCategory, preferences.roundSize))
    setQuestionIndex(0)
    setScore(0)
    setStreak(0)
    setBestRunStreak(0)
    setElapsed(0)
    setRoundStartedAt(Date.now())
    resetQuestion()
    setModal(null)
    setScreen('quiz')
  }

  function resetQuestion() {
    setAnswered(false)
    setWasCorrect(false)
  }

  function recordAnswer(correct: boolean) {
    if (answered) return
    setAnswered(true)
    setWasCorrect(correct)
    if (correct) {
      const nextStreak = streak + 1
      setScore((value) => value + 1)
      setStreak(nextStreak)
      setBestRunStreak((value) => Math.max(value, nextStreak))
    } else {
      setStreak(0)
    }
  }

  function nextQuestion() {
    if (questionIndex === questions.length - 1) {
      const nextStats = {
        games: stats.games + 1,
        correct: stats.correct + score,
        answered: stats.answered + questions.length,
        bestStreak: Math.max(stats.bestStreak, bestRunStreak),
      }
      setStats(nextStats)
      localStorage.setItem('geography-gym-stats', JSON.stringify(nextStats))
      setScreen('results')
      return
    }
    setQuestionIndex((value) => value + 1)
    resetQuestion()
  }

  async function installApp() {
    if (!deferredPrompt) return
    const prompt = deferredPrompt as Event & { prompt: () => Promise<void> }
    await prompt.prompt()
    setDeferredPrompt(null)
  }

  function applyUpdate() {
    if (!waitingWorker) return
    updateRequested.current = true
    waitingWorker.postMessage({ type: 'SKIP_WAITING' })
  }

  function cycleTheme() {
    const next =
      preferences.theme === 'system'
        ? 'light'
        : preferences.theme === 'light'
          ? 'dark'
          : 'system'
    updatePreference('theme', next)
  }

  function resetStats() {
    setStats(defaultStats)
    localStorage.setItem('geography-gym-stats', JSON.stringify(defaultStats))
    setModal(null)
  }

  const themeLabel =
    preferences.theme === 'system'
      ? 'System'
      : preferences.theme === 'light'
        ? 'Light'
        : 'Dark'

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-brand-group">
          <button
            className="icon-button"
            type="button"
            onClick={() => setModal('settings')}
            aria-label="Open settings"
            title="Settings"
          >
            <Settings size={20} />
          </button>
          <button className="brand" type="button" onClick={() => setScreen('home')}>
            <span className="brand-mark" aria-hidden="true"><Compass size={25} /></span>
            <strong>Geography Gym</strong>
          </button>
        </div>
        <div className="header-actions">
          <nav className="header-nav" aria-label="Primary navigation">
            <button
              className={`header-link ${screen === 'home' ? 'active' : ''}`}
              type="button"
              onClick={() => setScreen('home')}
            >
              Home
            </button>
            <button className="header-link open-app-link" type="button" onClick={() => openWorkoutSetup('mixed')}>
              Open app
            </button>
            <a className="header-support-link" href="./faq/">FAQ</a>
            <a className="header-support-link" href="./help/">Help Center</a>
            <a className="header-support-link" href="./privacy/">Privacy</a>
            <a
              className="header-support-link"
              href="https://github.com/LurieJoe/geography-gym/issues/new/choose"
              target="_blank"
              rel="noreferrer"
            >
              Feedback
            </a>
          </nav>
          <button
            className="icon-button"
            type="button"
            onClick={() => setModal('tips')}
            aria-label="Open tips"
            title="Tips"
          >
            <Lightbulb size={20} />
          </button>
          {deferredPrompt && (
            <button className="quiet-button install-button" type="button" onClick={installApp}>
              <Download size={17} /> Install
            </button>
          )}
          <button
            className="quiet-button theme-button"
            type="button"
            onClick={cycleTheme}
            aria-label={`Theme: ${preferences.theme}. Change theme`}
            title={`Theme: ${preferences.theme}`}
          >
            {preferences.theme === 'light'
              ? <Sun size={19} />
              : preferences.theme === 'dark'
                ? <Moon size={19} />
                : <Sparkles size={19} />}
            <span>{themeLabel}</span>
          </button>
        </div>
      </header>

      {screen === 'home' && (
        <Home
          stats={stats}
          accuracy={accuracy}
          openWorkoutSetup={openWorkoutSetup}
          onResetStats={() => setModal('reset-stats')}
        />
      )}

      {screen === 'quiz' && currentQuestion && (
        <main className="quiz-shell">
          <div className="quiz-toolbar">
            <button className="back-button" type="button" onClick={() => setScreen('home')}>
              <ArrowLeft size={18} /> Exit
            </button>
            <div className="progress-copy">
              <span>{categoryDetails[category].label}</span>
              <strong>{questionIndex + 1} / {questions.length}</strong>
            </div>
            <div className="quiz-status">
              {preferences.timer && (
                <div className="timer-pill" aria-label={`Elapsed time ${formatTime(elapsed)}`}>
                  <Clock3 size={15} /> {formatTime(elapsed)}
                </div>
              )}
              <div className="streak-pill" aria-label={`${streak} answer streak`}>
                <Sparkles size={16} /> {streak}
              </div>
            </div>
          </div>
          <div className="progress-track" aria-label={`Question ${questionIndex + 1} of ${questions.length}`}>
            <span style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }} />
          </div>

          <QuestionCard
            key={currentQuestion.id}
            question={currentQuestion}
            answered={answered}
            onAnswer={recordAnswer}
            onFeedback={(kind) => playFeedbackSound(kind, preferences.sound)}
          />

          {answered && (
            <div className={`feedback ${wasCorrect ? 'correct' : 'incorrect'}`} role="status">
              <div className="feedback-icon">{wasCorrect ? <Check /> : <X />}</div>
              <div>
                <strong>{wasCorrect ? 'Nicely mapped.' : 'Not quite.'}</strong>
                <p>{currentQuestion.explanation}</p>
              </div>
              <button className="primary-button" type="button" onClick={nextQuestion}>
                {questionIndex === questions.length - 1 ? 'See results' : 'Next question'}
              </button>
            </div>
          )}
        </main>
      )}

      {screen === 'results' && (
        <Results
          score={score}
          total={questions.length}
          bestStreak={bestRunStreak}
          elapsed={elapsed}
          timerEnabled={preferences.timer}
          category={category}
          onReplay={() => openWorkoutSetup(category)}
          onHome={() => setScreen('home')}
        />
      )}

      {screen === 'home' && <AppFooter />}

      {modal === 'setup' && (
        <ModalShell title="Set up your workout" eyebrow={categoryDetails[pendingCategory].label} onClose={() => setModal(null)}>
          <p className="modal-lead">Choose how long you want to practice. Questions are selected from a pool of {questionPoolCounts[pendingCategory].toLocaleString()}.</p>
          <fieldset className="choice-fieldset">
            <legend>Questions this round</legend>
            <div className="segmented-options">
              {([10, 25, 50] as RoundSize[]).map((size) => (
                <label key={size} className={preferences.roundSize === size ? 'selected-option' : ''}>
                  <input
                    type="radio"
                    name="round-size"
                    value={size}
                    checked={preferences.roundSize === size}
                    onChange={() => updatePreference('roundSize', size)}
                  />
                  <strong>{size}</strong>
                  <span>questions</span>
                </label>
              ))}
            </div>
          </fieldset>
          <ToggleRow
            checked={preferences.timer}
            onChange={(checked) => updatePreference('timer', checked)}
            icon={<Clock3 />}
            title="Show workout timer"
            description="Track elapsed time without creating a deadline."
          />
          <button className="primary-button modal-primary" type="button" onClick={startWorkout}>
            Start {preferences.roundSize}-question workout
          </button>
        </ModalShell>
      )}

      {modal === 'settings' && (
        <ModalShell title="Settings" eyebrow="Your workout" onClose={() => setModal(null)}>
          <div className="settings-list">
            <ToggleRow
              checked={preferences.sound}
              onChange={(checked) => updatePreference('sound', checked)}
              icon={preferences.sound ? <Volume2 /> : <VolumeX />}
              title="Answer sounds"
              description="Play a short sound for correct and incorrect answers."
            />
            <ToggleRow
              checked={preferences.timer}
              onChange={(checked) => updatePreference('timer', checked)}
              icon={<Clock3 />}
              title="Workout timer"
              description="Show elapsed time during each round."
            />
            <ToggleRow
              checked={preferences.tipsStartup}
              onChange={(checked) => updatePreference('tipsStartup', checked)}
              icon={<Lightbulb />}
              title="Show tips at startup"
              description="Display one rotating learning tip when the app opens."
            />
          </div>
          <fieldset className="choice-fieldset compact-fieldset">
            <legend>Default workout length</legend>
            <div className="inline-radio-options">
              {([10, 25, 50] as RoundSize[]).map((size) => (
                <label key={size}>
                  <input
                    type="radio"
                    name="settings-round-size"
                    checked={preferences.roundSize === size}
                    onChange={() => updatePreference('roundSize', size)}
                  />
                  {size}
                </label>
              ))}
            </div>
          </fieldset>
          <nav className="support-links" aria-label="Help and support">
            <a href="./faq/"><HelpCircle /> FAQ</a>
            <a href="./help/"><HelpCircle /> Help Center</a>
            <a href="https://github.com/LurieJoe/geography-gym/issues/new/choose" target="_blank" rel="noreferrer">
              <ExternalLink /> Send Feedback
            </a>
            <a href="./privacy/"><ExternalLink /> Privacy Policy</a>
          </nav>
          <p className="version-label">Geography Gym {APP_VERSION}</p>
        </ModalShell>
      )}

      {modal === 'tips' && (
        <ModalShell title="Tips" eyebrow="Get more from every workout" onClose={() => setModal(null)}>
          <div className="tips-list">
            {tips.map((tip) => <TipCard key={tip.title} tip={tip} />)}
          </div>
          <label className="simple-check">
            <input
              type="checkbox"
              checked={preferences.tipsStartup}
              onChange={(event) => updatePreference('tipsStartup', event.target.checked)}
            />
            Show a tip at startup
          </label>
        </ModalShell>
      )}

      {modal === 'startup-tip' && (
        <ModalShell title="Quick tip" eyebrow="Geography Gym" onClose={() => setModal(null)}>
          <TipCard tip={startupTip} featured />
          <button className="quiet-button modal-primary" type="button" onClick={() => setModal('tips')}>
            See all tips
          </button>
          <label className="simple-check">
            <input
              type="checkbox"
              checked={preferences.tipsStartup}
              onChange={(event) => updatePreference('tipsStartup', event.target.checked)}
            />
            Show tips at startup
          </label>
        </ModalShell>
      )}

      {modal === 'reset-stats' && (
        <ModalShell title="Reset learning progress?" eyebrow="Lifetime counters" onClose={() => setModal(null)}>
          <p className="modal-lead">
            This resets Workouts completed, Lifetime accuracy, and Best streak to zero on this
            device. Your settings and preferences will not change.
          </p>
          <div className="confirmation-actions">
            <button className="danger-button" type="button" onClick={resetStats}>
              <RotateCcw size={17} /> Reset progress
            </button>
            <button className="quiet-button" type="button" onClick={() => setModal(null)}>Cancel</button>
          </div>
        </ModalShell>
      )}

      {waitingWorker && (
        <section className="update-notification" role="status" aria-live="polite">
          <div>
            <strong>A new version is available.</strong>
            <p>Restart Geography Gym to apply the update. Your progress and settings stay saved.</p>
          </div>
          <div className="update-actions">
            <button className="primary-button" type="button" onClick={applyUpdate}>Update and Restart</button>
            <button className="quiet-button" type="button" onClick={() => setWaitingWorker(null)}>Later</button>
          </div>
        </section>
      )}
    </div>
  )
}

function Home({
  stats,
  accuracy,
  openWorkoutSetup,
  onResetStats,
}: {
  stats: Stats
  accuracy: number
  openWorkoutSetup: (category: Category) => void
  onResetStats: () => void
}) {
  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Learn the world by playing it</p>
          <h1>Strengthen your sense of place.<br />Explore with confidence.</h1>
          <p className="hero-description">
            Build geographic intuition through quick challenges covering states,
            countries, capitals, directions, locations, and landmarks.
          </p>
          <div className="hero-actions">
            <button className="primary-button large" type="button" onClick={() => openWorkoutSetup('mixed')}>
              <Sparkles size={19} /> Start a mixed workout
            </button>
            <span>Choose 10, 25, or 50 questions</span>
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <Globe2 className="hero-globe" strokeWidth={1.25} />
          <span className="map-pin pin-one"><MapPin /></span>
          <span className="map-pin pin-two"><Landmark /></span>
          <span className="map-pin pin-three"><Flag /></span>
        </div>
      </section>

      <section className="stats-strip" aria-label="Learning progress">
        <div><strong>{stats.games}</strong><span>Workouts completed</span></div>
        <div><strong>{accuracy}%</strong><span>Lifetime accuracy</span></div>
        <div><strong>{stats.bestStreak}</strong><span>Best streak</span></div>
        <button className="reset-stats-button" type="button" onClick={onResetStats} title="Reset lifetime counters">
          <RotateCcw size={17} /> Reset
        </button>
      </section>

      <section className="tracks-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Choose a learning path</p>
            <h2>Three ways to practice</h2>
          </div>
          <p>Each path mixes question styles that develop recall, map placement, and spatial reasoning.</p>
        </div>
        <div className="track-grid">
          <TrackCard
            icon={<Map />}
            category="us"
            title="U.S. Geography"
            description="States, abbreviations, capitals, locations, and spatial relationships."
            games={['Locate it', 'State shorthand', 'State capitals', 'Map practice']}
            count={questionPoolCounts.us}
            onStart={openWorkoutSetup}
          />
          <TrackCard
            icon={<Globe2 />}
            category="world"
            title="World Geography"
            description="Countries, capitals, continents, regions, and world map placement."
            games={['Find the country', 'Capital call', 'World regions', 'Map practice']}
            count={questionPoolCounts.world}
            onStart={openWorkoutSetup}
          />
          <TrackCard
            icon={<Landmark />}
            category="landmarks"
            title="Landmarks"
            description="Match famous places to locations and arrange them geographically."
            games={['Where is it?', 'Matching pairs', 'North to south', 'East to west']}
            count={questionPoolCounts.landmarks}
            onStart={openWorkoutSetup}
          />
        </div>
      </section>

      <section className="principle-card">
        <Route size={32} />
        <div>
          <p className="eyebrow">More than memorization</p>
          <h2>Build a mental map, one connection at a time.</h2>
          <p>Connect names to places, places to neighbors, and landmarks to the wider world.</p>
        </div>
      </section>
    </main>
  )
}

function TrackCard({
  icon,
  category,
  title,
  description,
  games,
  count,
  onStart,
}: {
  icon: React.ReactNode
  category: Category
  title: string
  description: string
  games: string[]
  count: number
  onStart: (category: Category) => void
}) {
  return (
    <article className="track-card">
      <div className="track-card-top">
        <div className="track-icon">{icon}</div>
        <span className="pool-count">{count} questions</span>
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      <ul>
        {games.map((game) => <li key={game}><Check size={14} /> {game}</li>)}
      </ul>
      <button className="card-button" type="button" onClick={() => onStart(category)}>
        Begin this workout <span aria-hidden="true">→</span>
      </button>
    </article>
  )
}

function QuestionCard({
  question,
  answered,
  onAnswer,
  onFeedback,
}: {
  question: Question
  answered: boolean
  onAnswer: (correct: boolean) => void
  onFeedback: (kind: FeedbackKind) => void
}) {
  const [wrongAnswers, setWrongAnswers] = useState<string[]>([])
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null)
  const [shakingAnswer, setShakingAnswer] = useState<string | null>(null)

  function attemptAnswer(value: string, answer: string) {
    if (answered || wrongAnswers.includes(value)) return
    if (value === answer) {
      setCorrectAnswer(value)
      onFeedback('correct')
      onAnswer(true)
      return
    }

    const nextWrong = [...wrongAnswers, value]
    setWrongAnswers(nextWrong)
    setShakingAnswer(value)
    onFeedback('incorrect')
    window.setTimeout(() => setShakingAnswer(null), 550)
    if (nextWrong.length >= 2) onAnswer(false)
  }

  return (
    <section className="question-card">
      <div className="question-label">
        {question.kind === 'locate-us' || question.kind === 'locate-world'
          ? <MapPin size={17} />
          : question.kind === 'matching'
            ? <Route size={17} />
            : question.kind === 'order'
              ? <Compass size={17} />
              : <Flag size={17} />}
        {question.label}
      </div>
      <h2>{question.prompt}</h2>
      {question.hint && <p className="question-hint">{question.hint}</p>}

      {question.kind === 'choice' && (
        <div className="answer-grid">
          {question.options.map((option) => {
            const isCorrect = option === question.answer
            const isWrong = wrongAnswers.includes(option)
            const classes = [
              'answer',
              answered && isCorrect ? 'correct-answer' : '',
              isWrong ? 'wrong-answer' : '',
              shakingAnswer === option ? 'shake' : '',
              answered && !isCorrect && !isWrong ? 'muted-answer' : '',
            ].join(' ')
            return (
              <button
                className={classes}
                type="button"
                key={option}
                disabled={answered || isWrong}
                onClick={() => attemptAnswer(option, question.answer)}
              >
                <span>{option}</span>
                {answered && isCorrect && <Check size={19} />}
                {isWrong && <X size={19} />}
              </button>
            )
          })}
        </div>
      )}

      {question.kind === 'locate-us' && (
        <UsMap
          answer={question.answer}
          wrongAnswers={wrongAnswers}
          correctAnswer={correctAnswer}
          shakingAnswer={shakingAnswer}
          answered={answered}
          onSelect={(value) => attemptAnswer(value, question.answer)}
        />
      )}

      {question.kind === 'locate-world' && (
        <WorldMap
          answer={question.answer}
          points={question.points}
          wrongAnswers={wrongAnswers}
          correctAnswer={correctAnswer}
          shakingAnswer={shakingAnswer}
          answered={answered}
          onSelect={(value) => attemptAnswer(value, question.answer)}
        />
      )}

      {question.kind === 'matching' && (
        <MatchingGame
          question={question}
          answered={answered}
          onComplete={onAnswer}
          onFeedback={onFeedback}
        />
      )}

      {question.kind === 'order' && (
        <OrderGame
          question={question}
          answered={answered}
          onComplete={onAnswer}
          onFeedback={onFeedback}
        />
      )}

      {!answered && wrongAnswers.length === 1 && (
        <p className="try-again-message" role="status">Try once more. The correct answer is still hidden.</p>
      )}
    </section>
  )
}

const stateLabelOverrides: Record<string, { x: number; y: number }> = {
  CT: { x: 972, y: 324 },
  DE: { x: 982, y: 378 },
  MA: { x: 987, y: 285 },
  MD: { x: 946, y: 382 },
  NH: { x: 958, y: 246 },
  NJ: { x: 970, y: 350 },
  RI: { x: 1008, y: 310 },
  VT: { x: 925, y: 246 },
}

function UsMap({
  answer,
  wrongAnswers,
  correctAnswer,
  shakingAnswer,
  answered,
  onSelect,
}: {
  answer: string
  wrongAnswers: string[]
  correctAnswer: string | null
  shakingAnswer: string | null
  answered: boolean
  onSelect: (value: string) => void
}) {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const [wrongRegions, setWrongRegions] = useState<string[]>([])
  const [shakingRegion, setShakingRegion] = useState<string | null>(null)
  const answerState = usStateShapes.find((state) => state.abbreviation === answer)
  const targetRegion = usRegionShapes.find((region) => region.id === answerState?.region)
  const unavailable = (state: string) => answered || wrongAnswers.includes(state)

  if (!answerState || !targetRegion) return null

  function chooseRegion(regionId: string) {
    if (wrongRegions.includes(regionId)) return
    if (regionId === targetRegion?.id) {
      setSelectedRegion(regionId)
      return
    }

    const nextWrong = [...wrongRegions, regionId]
    setWrongRegions(nextWrong)
    setShakingRegion(regionId)
    window.setTimeout(() => setShakingRegion(null), 550)
    if (nextWrong.length >= 2) {
      window.setTimeout(() => setSelectedRegion(targetRegion?.id ?? null), 650)
    }
  }

  if (!selectedRegion) {
    return (
      <figure className="us-map region-picker">
        <div className="map-step">
          <strong>Step 1 of 2</strong>
          <span>Choose the map section containing {answerState.name}.</span>
        </div>
        <svg viewBox={US_MAP_VIEWBOX} role="img" aria-label="United States divided into selectable map sections">
          {usRegionShapes.map((region, index) => {
            const isWrong = wrongRegions.includes(region.id)
            return (
              <g
                key={region.id}
                role="button"
                tabIndex={isWrong ? -1 : 0}
                aria-label={region.label}
                aria-disabled={isWrong}
                className={[
                  'us-region',
                  `region-tone-${index % 3}`,
                  isWrong ? 'map-wrong state-unavailable' : '',
                  shakingRegion === region.id ? 'shake' : '',
                ].join(' ')}
                onClick={() => chooseRegion(region.id)}
                onKeyDown={(event) => {
                  if (!isWrong && (event.key === 'Enter' || event.key === ' ')) {
                    event.preventDefault()
                    chooseRegion(region.id)
                  }
                }}
              >
                <title>{region.label}</title>
                <path d={region.path} fillRule="evenodd" />
                <rect
                  className="region-label-background"
                  x={region.labelX - 31}
                  y={region.labelY - 12}
                  width="62"
                  height="24"
                  rx="8"
                />
                <text className="region-label" x={region.labelX} y={region.labelY}>{region.label}</text>
              </g>
            )
          })}
        </svg>
        {wrongRegions.length === 1 && (
          <p className="region-hint" role="status">Try another map section. The state is still hidden.</p>
        )}
        {wrongRegions.length >= 2 && (
          <p className="region-hint" role="status">Opening the correct map section so you can place the state.</p>
        )}
        <figcaption>Regional outlines derived from U.S. Census Bureau state boundaries.</figcaption>
      </figure>
    )
  }

  const visibleStates = usStateShapes.filter((state) => state.region === selectedRegion)
  const revealBoundaries = answered || Boolean(correctAnswer)

  return (
    <figure className="us-map regional-state-map">
      <div className="map-step">
        <strong>Step 2 of 2</strong>
        <span>Tap the approximate location of {answerState.name}.</span>
      </div>
      <svg viewBox={targetRegion.viewBox} role="img" aria-label={`${targetRegion.label} region with selectable state locations`}>
        <path className="region-silhouette" d={targetRegion.path} fillRule="evenodd" />
        {visibleStates.map((state) => {
          const label = stateLabelOverrides[state.abbreviation] ?? {
            x: state.labelX,
            y: state.labelY,
          }
          const hasCallout = label.x !== state.labelX || label.y !== state.labelY
          const isUnavailable = unavailable(state.abbreviation)

          return (
            <g
              key={state.abbreviation}
              role="button"
              tabIndex={isUnavailable ? -1 : 0}
              aria-label={state.name}
              aria-disabled={isUnavailable}
              className={[
                'state-shape',
                'state-hit-area',
                revealBoundaries ? 'reveal-boundary' : '',
                (answered || correctAnswer) && state.abbreviation === answer ? 'map-correct' : '',
                wrongAnswers.includes(state.abbreviation) ? 'map-wrong' : '',
                shakingAnswer === state.abbreviation ? 'shake' : '',
                hasCallout ? 'state-has-callout' : '',
                isUnavailable ? 'state-unavailable' : '',
              ].join(' ')}
              onClick={() => {
                if (!isUnavailable) onSelect(state.abbreviation)
              }}
              onKeyDown={(event) => {
                if (!isUnavailable && (event.key === 'Enter' || event.key === ' ')) {
                  event.preventDefault()
                  onSelect(state.abbreviation)
                }
              }}
            >
              <title>{state.name}</title>
              <path d={state.path} fillRule="evenodd" />
              {revealBoundaries && hasCallout && (
                <line
                  className="state-callout"
                  x1={state.labelX}
                  y1={state.labelY}
                  x2={label.x}
                  y2={label.y}
                />
              )}
              {revealBoundaries && (
                <>
                  <circle className="state-label-target" cx={label.x} cy={label.y} r="14" />
                  <text className="state-label" x={label.x} y={label.y}>{state.abbreviation}</text>
                </>
              )}
            </g>
          )
        })}
      </svg>
      <figcaption>
        State boundaries stay hidden until the answer is complete. Source: U.S. Census Bureau,
        January 1, 2026 vintage.
      </figcaption>
    </figure>
  )
}

function WorldMap({
  answer,
  points,
  wrongAnswers,
  correctAnswer,
  shakingAnswer,
  answered,
  onSelect,
}: {
  answer: string
  points: { name: string; x: number; y: number }[]
  wrongAnswers: string[]
  correctAnswer: string | null
  shakingAnswer: string | null
  answered: boolean
  onSelect: (value: string) => void
}) {
  return (
    <div className="world-map" aria-label="Simplified world map">
      <svg viewBox="0 0 900 440" role="img" aria-label="World map with selectable locations">
        <path className="continent" d="M70 70 L145 38 250 62 300 118 270 165 218 172 190 220 140 205 110 150 55 125Z" />
        <path className="continent" d="M245 220 L300 245 325 325 292 405 250 360 228 280Z" />
        <path className="continent" d="M390 85 L455 65 500 92 475 125 432 132 400 112Z" />
        <path className="continent" d="M430 145 L505 138 555 205 530 322 480 360 445 292 420 205Z" />
        <path className="continent" d="M505 78 L650 58 785 105 820 180 755 215 675 185 625 230 550 190 500 130Z" />
        <path className="continent" d="M700 285 L790 275 835 330 785 380 710 350Z" />
        {points.map((point, index) => {
          const correct = (answered || correctAnswer) && point.name === answer
          const wrong = wrongAnswers.includes(point.name)
          return (
            <g
              className={[
                'world-point',
                correct ? 'map-correct' : '',
                wrong ? 'map-wrong' : '',
                shakingAnswer === point.name ? 'shake' : '',
              ].join(' ')}
              key={point.name}
              onClick={() => !answered && !wrong && onSelect(point.name)}
              role="button"
              tabIndex={answered || wrong ? -1 : 0}
              onKeyDown={(event) => {
                if (!answered && !wrong && (event.key === 'Enter' || event.key === ' ')) onSelect(point.name)
              }}
              aria-label={`Location ${index + 1}`}
            >
              <circle cx={point.x} cy={point.y} r="17" />
              <text x={point.x} y={point.y + 5}>{index + 1}</text>
            </g>
          )
        })}
      </svg>
      <div className="map-key">
        {points.map((point, index) => <span key={point.name}><b>{index + 1}</b> Location {index + 1}</span>)}
      </div>
    </div>
  )
}

function MatchingGame({
  question,
  answered,
  onComplete,
  onFeedback,
}: {
  question: MatchingQuestion
  answered: boolean
  onComplete: (correct: boolean) => void
  onFeedback: (kind: FeedbackKind) => void
}) {
  const [left, setLeft] = useState<string | null>(null)
  const [right, setRight] = useState<string | null>(null)
  const [matched, setMatched] = useState<string[]>([])
  const [wrongPair, setWrongPair] = useState<{ left: string; right: string } | null>(null)
  const shuffledRight = useMemo(() => shuffle(question.pairs.map((pair) => pair.right)), [question])

  function resolveMatch(nextLeft: string, nextRight: string) {
    const pair = question.pairs.find((item) => item.left === nextLeft)
    if (pair?.right === nextRight) {
      const next = [...matched, nextLeft]
      setMatched(next)
      setLeft(null)
      setRight(null)
      onFeedback('correct')
      if (next.length === question.pairs.length) onComplete(true)
      return
    }
    setWrongPair({ left: nextLeft, right: nextRight })
    setLeft(nextLeft)
    setRight(nextRight)
    onFeedback('incorrect')
    window.setTimeout(() => {
      setWrongPair(null)
      setLeft(null)
      setRight(null)
    }, 650)
  }

  function selectLeft(value: string) {
    if (right) resolveMatch(value, right)
    else setLeft(value)
  }

  function selectRight(value: string) {
    if (left) resolveMatch(left, value)
    else setRight(value)
  }

  return (
    <div className="matching-board">
      <div>
        {question.pairs.map((pair) => {
          const isWrong = wrongPair?.left === pair.left
          return (
            <button
              type="button"
              key={pair.left}
              className={[
                'match-tile',
                left === pair.left ? 'selected-tile' : '',
                matched.includes(pair.left) ? 'matched-tile' : '',
                isWrong ? 'wrong-match shake' : '',
              ].join(' ')}
              disabled={answered || matched.includes(pair.left) || Boolean(wrongPair)}
              onClick={() => selectLeft(pair.left)}
            >
              {pair.left}
            </button>
          )
        })}
      </div>
      <div>
        {shuffledRight.map((place) => {
          const pair = question.pairs.find((item) => item.right === place)
          const isMatched = pair ? matched.includes(pair.left) : false
          const isWrong = wrongPair?.right === place
          return (
            <button
              type="button"
              key={place}
              className={[
                'match-tile',
                right === place ? 'selected-tile' : '',
                isMatched ? 'matched-tile' : '',
                isWrong ? 'wrong-match shake' : '',
              ].join(' ')}
              disabled={answered || isMatched || Boolean(wrongPair)}
              onClick={() => selectRight(place)}
            >
              {place}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function OrderGame({
  question,
  answered,
  onComplete,
  onFeedback,
}: {
  question: OrderQuestion
  answered: boolean
  onComplete: (correct: boolean) => void
  onFeedback: (kind: FeedbackKind) => void
}) {
  const [items, setItems] = useState(() => shuffle(question.items))
  const [attempts, setAttempts] = useState(0)
  const [shaking, setShaking] = useState(false)

  function move(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= items.length) return
    const next = [...items]
    ;[next[index], next[target]] = [next[target], next[index]]
    setItems(next)
  }

  function checkOrder() {
    const correct = items.every((item, index) => item === question.answer[index])
    if (correct) {
      onFeedback('correct')
      onComplete(true)
      return
    }
    const nextAttempts = attempts + 1
    setAttempts(nextAttempts)
    setShaking(true)
    onFeedback('incorrect')
    window.setTimeout(() => setShaking(false), 550)
    if (nextAttempts >= 2) {
      setItems(question.answer)
      onComplete(false)
    }
  }

  return (
    <div className={`order-board ${shaking ? 'shake' : ''}`}>
      <div className="order-labels"><span>{question.startLabel}</span><span>{question.endLabel}</span></div>
      {items.map((item, index) => (
        <div className="order-item" key={item}>
          <span className="order-number">{index + 1}</span>
          <strong>{item}</strong>
          <div>
            <button type="button" onClick={() => move(index, -1)} disabled={answered || index === 0} aria-label={`Move ${item} up`}><ChevronUp /></button>
            <button type="button" onClick={() => move(index, 1)} disabled={answered || index === items.length - 1} aria-label={`Move ${item} down`}><ChevronDown /></button>
          </div>
        </div>
      ))}
      {!answered && attempts === 1 && <p className="try-again-message">That order is not quite right. Try once more.</p>}
      <button className="primary-button check-order" type="button" disabled={answered} onClick={checkOrder}>
        Check my order
      </button>
    </div>
  )
}

function Results({
  score,
  total,
  bestStreak,
  elapsed,
  timerEnabled,
  category,
  onReplay,
  onHome,
}: {
  score: number
  total: number
  bestStreak: number
  elapsed: number
  timerEnabled: boolean
  category: Category
  onReplay: () => void
  onHome: () => void
}) {
  const percent = Math.round((score / total) * 100)
  return (
    <main className="results-shell">
      <section className="results-card">
        <div className="result-medal">{percent >= 80 ? <Trophy /> : <Award />}</div>
        <p className="eyebrow">{categoryDetails[category].label} complete</p>
        <h1>{percent >= 80 ? 'Excellent workout.' : percent >= 55 ? 'You’re making progress.' : 'A good first round.'}</h1>
        <p className="result-copy">
          {percent >= 80
            ? 'Your mental map is taking shape. Try another learning path to keep the streak going.'
            : 'Every workout strengthens the connections between names, places, and directions.'}
        </p>
        <div className="result-score">
          <strong>{score}<span>/{total}</span></strong>
          <small>correct answers</small>
        </div>
        <div className={`result-details ${timerEnabled ? 'three-results' : ''}`}>
          <div><strong>{percent}%</strong><span>Accuracy</span></div>
          <div><strong>{bestStreak}</strong><span>Best streak</span></div>
          {timerEnabled && <div><strong>{formatTime(elapsed)}</strong><span>Time</span></div>}
        </div>
        <div className="result-actions">
          <button className="primary-button" type="button" onClick={onReplay}><RotateCcw size={18} /> Play again</button>
          <button className="quiet-button" type="button" onClick={onHome}>Choose another path</button>
        </div>
      </section>
    </main>
  )
}

function ModalShell({
  title,
  eyebrow,
  onClose,
  children,
}: {
  title: string
  eyebrow: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-label={title}>
        <header className="modal-header">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h2>{title}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label={`Close ${title}`}>
            <X />
          </button>
        </header>
        <div className="modal-content">{children}</div>
      </section>
    </div>
  )
}

function ToggleRow({
  checked,
  onChange,
  icon,
  title,
  description,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <label className="toggle-row">
      <span className="setting-icon">{icon}</span>
      <span className="setting-copy"><strong>{title}</strong><small>{description}</small></span>
      <span className="switch">
        <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
        <span />
      </span>
    </label>
  )
}

function TipCard({ tip, featured = false }: { tip: { title: string; text: string }; featured?: boolean }) {
  return (
    <article className={`tip-card ${featured ? 'featured-tip' : ''}`}>
      <Lightbulb aria-hidden="true" />
      <div><strong>{tip.title}</strong><p>{tip.text}</p></div>
    </article>
  )
}

function AppFooter() {
  return (
    <footer className="app-footer">
      <div>
        <span>© 2026 Geography Gym</span>
        <nav aria-label="Footer navigation">
          <a href="./faq/">FAQ</a>
          <a href="./help/">Help Center</a>
          <a href="https://github.com/LurieJoe/geography-gym/issues/new/choose" target="_blank" rel="noreferrer">Send Feedback</a>
          <a href="./privacy/">Privacy</a>
        </nav>
      </div>
    </footer>
  )
}

export default App
