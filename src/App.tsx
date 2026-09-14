import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  Award,
  Check,
  ChevronDown,
  ChevronUp,
  Compass,
  Flag,
  Globe2,
  Download,
  Landmark,
  Map,
  MapPin,
  Moon,
  RotateCcw,
  Route,
  Sparkles,
  Sun,
  Trophy,
  X,
} from 'lucide-react'
import {
  buildQuestions,
  categoryDetails,
  type Category,
  type MatchingQuestion,
  type OrderQuestion,
  type Question,
} from './data'
import './App.css'

type Screen = 'home' | 'quiz' | 'results'
type ThemeMode = 'system' | 'light' | 'dark'

type Stats = {
  games: number
  correct: number
  answered: number
  bestStreak: number
}

const defaultStats: Stats = { games: 0, correct: 0, answered: 0, bestStreak: 0 }

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5)
}

function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [category, setCategory] = useState<Category>('mixed')
  const [questions, setQuestions] = useState<Question[]>([])
  const [questionIndex, setQuestionIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestRunStreak, setBestRunStreak] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [wasCorrect, setWasCorrect] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [stats, setStats] = useState<Stats>(() => {
    const saved = localStorage.getItem('geography-gym-stats')
    return saved ? JSON.parse(saved) : defaultStats
  })
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    return (localStorage.getItem('geography-gym-theme') as ThemeMode | null) ?? 'system'
  })
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null)

  useEffect(() => {
    const applyTheme = () => {
      const resolved =
        themeMode === 'system'
          ? window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light'
          : themeMode
      document.documentElement.setAttribute('data-theme', resolved)
      document.documentElement.setAttribute('data-theme-mode', themeMode)
    }
    applyTheme()
    localStorage.setItem('geography-gym-theme', themeMode)
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    media.addEventListener('change', applyTheme)
    return () => media.removeEventListener('change', applyTheme)
  }, [themeMode])

  useEffect(() => {
    const handleInstall = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event)
    }
    window.addEventListener('beforeinstallprompt', handleInstall)
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(() => undefined)
      })
    }
    return () => window.removeEventListener('beforeinstallprompt', handleInstall)
  }, [])

  const currentQuestion = questions[questionIndex]
  const accuracy = stats.answered ? Math.round((stats.correct / stats.answered) * 100) : 0

  function startQuiz(nextCategory: Category) {
    setCategory(nextCategory)
    setQuestions(buildQuestions(nextCategory, 7))
    setQuestionIndex(0)
    setScore(0)
    setStreak(0)
    setBestRunStreak(0)
    resetQuestion()
    setScreen('quiz')
  }

  function resetQuestion() {
    setAnswered(false)
    setWasCorrect(false)
    setSelected(null)
  }

  function recordAnswer(correct: boolean, answer?: string) {
    if (answered) return
    setSelected(answer ?? null)
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

  function cycleTheme() {
    setThemeMode((mode) => (mode === 'system' ? 'light' : mode === 'light' ? 'dark' : 'system'))
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <button className="brand" type="button" onClick={() => setScreen('home')}>
          <span className="brand-mark" aria-hidden="true"><Compass size={25} /></span>
          <span>
            <strong>Geography Gym</strong>
            <small>Give your world knowledge a workout</small>
          </span>
        </button>
        <div className="header-actions">
          {deferredPrompt && (
            <button className="quiet-button" type="button" onClick={installApp}>
              <Download size={17} /> Install
            </button>
          )}
          <button
            className="icon-button"
            type="button"
            onClick={cycleTheme}
            aria-label={`Theme: ${themeMode}. Change theme`}
            title={`Theme: ${themeMode}`}
          >
            {themeMode === 'light' ? <Sun size={19} /> : themeMode === 'dark' ? <Moon size={19} /> : <Sparkles size={19} />}
          </button>
        </div>
      </header>

      {screen === 'home' && (
        <Home
          stats={stats}
          accuracy={accuracy}
          startQuiz={startQuiz}
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
            <div className="streak-pill"><Sparkles size={16} /> {streak}</div>
          </div>
          <div className="progress-track" aria-label={`Question ${questionIndex + 1} of ${questions.length}`}>
            <span style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }} />
          </div>

          <QuestionCard
            key={currentQuestion.id}
            question={currentQuestion}
            answered={answered}
            selected={selected}
            wasCorrect={wasCorrect}
            onAnswer={recordAnswer}
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
          category={category}
          onReplay={() => startQuiz(category)}
          onHome={() => setScreen('home')}
        />
      )}
    </div>
  )
}

function Home({
  stats,
  accuracy,
  startQuiz,
}: {
  stats: Stats
  accuracy: number
  startQuiz: (category: Category) => void
}) {
  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Learn the world by playing it</p>
          <h1>Know where you are.<br />Understand what’s around you.</h1>
          <p className="hero-description">
            Build real geographic intuition through quick challenges about states,
            countries, distances, directions, and landmarks.
          </p>
          <div className="hero-actions">
            <button className="primary-button large" type="button" onClick={() => startQuiz('mixed')}>
              <Sparkles size={19} /> Start a mixed round
            </button>
            <span>7 questions · about 3 minutes</span>
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
        <div><strong>{stats.games}</strong><span>Rounds played</span></div>
        <div><strong>{accuracy}%</strong><span>Lifetime accuracy</span></div>
        <div><strong>{stats.bestStreak}</strong><span>Best streak</span></div>
      </section>

      <section className="tracks-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Choose a route</p>
            <h2>Three ways to explore</h2>
          </div>
          <p>Each round mixes question styles so you practice recall, placement, and spatial reasoning.</p>
        </div>
        <div className="track-grid">
          <TrackCard
            icon={<Map />}
            category="us"
            title="U.S. Geography"
            description="States, abbreviations, neighbors, landmarks, locations, and distances."
            games={['Locate it', 'State shorthand', 'Which direction?', 'How far?']}
            onStart={startQuiz}
          />
          <TrackCard
            icon={<Globe2 />}
            category="world"
            title="World Geography"
            description="Countries, capitals, relative location, global distances, and map placement."
            games={['Find the country', 'Capital call', 'Near or far', 'Compass check']}
            onStart={startQuiz}
          />
          <TrackCard
            icon={<Landmark />}
            category="landmarks"
            title="Landmarks"
            description="Match famous places to locations and put cities in geographic order."
            games={['Where is it?', 'Matching pairs', 'North to south', 'East to west']}
            onStart={startQuiz}
          />
        </div>
      </section>

      <section className="principle-card">
        <Route size={32} />
        <div>
          <p className="eyebrow">More than memorization</p>
          <h2>Build a mental map, one connection at a time.</h2>
          <p>Geography Gym connects names to places, places to neighbors, and landmarks to the wider world.</p>
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
  onStart,
}: {
  icon: React.ReactNode
  category: Category
  title: string
  description: string
  games: string[]
  onStart: (category: Category) => void
}) {
  return (
    <article className="track-card">
      <div className="track-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
      <ul>
        {games.map((game) => <li key={game}><Check size={14} /> {game}</li>)}
      </ul>
      <button className="card-button" type="button" onClick={() => onStart(category)}>
        Play this track <span aria-hidden="true">→</span>
      </button>
    </article>
  )
}

function QuestionCard({
  question,
  answered,
  selected,
  wasCorrect,
  onAnswer,
}: {
  question: Question
  answered: boolean
  selected: string | null
  wasCorrect: boolean
  onAnswer: (correct: boolean, answer?: string) => void
}) {
  return (
    <section className="question-card">
      <div className="question-label">
        {question.kind === 'locate-us' || question.kind === 'locate-world' ? <MapPin size={17} /> :
          question.kind === 'matching' ? <Route size={17} /> :
            question.kind === 'order' ? <Compass size={17} /> : <Flag size={17} />}
        {question.label}
      </div>
      <h2>{question.prompt}</h2>
      {question.hint && <p className="question-hint">{question.hint}</p>}

      {question.kind === 'choice' && (
        <div className="answer-grid">
          {question.options.map((option) => {
            const isCorrect = option === question.answer
            const isSelected = option === selected
            const className = answered
              ? isCorrect ? 'answer correct-answer' : isSelected ? 'answer wrong-answer' : 'answer muted-answer'
              : 'answer'
            return (
              <button
                className={className}
                type="button"
                key={option}
                disabled={answered}
                onClick={() => onAnswer(isCorrect, option)}
              >
                <span>{option}</span>
                {answered && isCorrect && <Check size={19} />}
                {answered && isSelected && !isCorrect && <X size={19} />}
              </button>
            )
          })}
        </div>
      )}
      {question.kind === 'locate-us' && (
        <UsMap
          answer={question.answer}
          selected={selected}
          answered={answered}
          onSelect={(value) => onAnswer(value === question.answer, value)}
        />
      )}
      {question.kind === 'locate-world' && (
        <WorldMap
          answer={question.answer}
          points={question.points}
          selected={selected}
          answered={answered}
          onSelect={(value) => onAnswer(value === question.answer, value)}
        />
      )}
      {question.kind === 'matching' && (
        <MatchingGame question={question} answered={answered} onComplete={onAnswer} />
      )}
      {question.kind === 'order' && (
        <OrderGame question={question} answered={answered} onComplete={onAnswer} />
      )}
      {answered && !wasCorrect && (question.kind === 'locate-us' || question.kind === 'locate-world') && (
        <p className="map-answer">The correct location is highlighted.</p>
      )}
    </section>
  )
}

const stateMap = [
  ['WA', 1, 1], ['MT', 3, 1], ['ND', 5, 1], ['MN', 6, 1], ['WI', 7, 2], ['MI', 8, 2], ['ME', 12, 1],
  ['OR', 1, 2], ['ID', 2, 2], ['WY', 3, 2], ['SD', 5, 2], ['IA', 6, 3], ['IL', 7, 3], ['IN', 8, 3], ['OH', 9, 3], ['PA', 10, 2], ['NY', 11, 2], ['VT', 12, 2], ['NH', 13, 2],
  ['CA', 1, 4], ['NV', 2, 3], ['UT', 3, 3], ['CO', 4, 3], ['NE', 5, 3], ['MO', 6, 4], ['KY', 8, 4], ['WV', 9, 4], ['VA', 10, 4], ['MD', 11, 3], ['NJ', 12, 3], ['MA', 13, 3],
  ['AZ', 2, 5], ['NM', 3, 5], ['KS', 5, 4], ['AR', 6, 5], ['TN', 8, 5], ['NC', 10, 5], ['DE', 12, 4], ['CT', 13, 4], ['RI', 14, 4],
  ['OK', 5, 5], ['LA', 6, 6], ['MS', 7, 6], ['AL', 8, 6], ['GA', 9, 6], ['SC', 10, 6],
  ['TX', 4, 7], ['FL', 10, 7], ['AK', 1, 8], ['HI', 2, 8],
] as const

function UsMap({
  answer,
  selected,
  answered,
  onSelect,
}: {
  answer: string
  selected: string | null
  answered: boolean
  onSelect: (value: string) => void
}) {
  return (
    <div className="us-map" aria-label="Simplified map of the United States">
      {stateMap.map(([state, column, row]) => (
        <button
          type="button"
          key={state}
          className={[
            'state-cell',
            answered && state === answer ? 'map-correct' : '',
            answered && state === selected && state !== answer ? 'map-wrong' : '',
          ].join(' ')}
          style={{ gridColumn: column, gridRow: row }}
          onClick={() => onSelect(state)}
          disabled={answered}
          aria-label={state}
        >
          {state}
        </button>
      ))}
    </div>
  )
}

function WorldMap({
  answer,
  points,
  selected,
  answered,
  onSelect,
}: {
  answer: string
  points: { name: string; x: number; y: number }[]
  selected: string | null
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
          const correct = answered && point.name === answer
          const wrong = answered && point.name === selected && point.name !== answer
          return (
            <g
              className={`world-point ${correct ? 'map-correct' : ''} ${wrong ? 'map-wrong' : ''}`}
              key={point.name}
              onClick={() => !answered && onSelect(point.name)}
              role="button"
              tabIndex={answered ? -1 : 0}
              onKeyDown={(event) => {
                if (!answered && (event.key === 'Enter' || event.key === ' ')) onSelect(point.name)
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
}: {
  question: MatchingQuestion
  answered: boolean
  onComplete: (correct: boolean) => void
}) {
  const [left, setLeft] = useState<string | null>(null)
  const [right, setRight] = useState<string | null>(null)
  const [matched, setMatched] = useState<string[]>([])
  const shuffledRight = useMemo(() => shuffle(question.pairs.map((pair) => pair.right)), [question])

  function resolveMatch(nextLeft: string, nextRight: string) {
    const pair = question.pairs.find((item) => item.left === nextLeft)
    if (pair?.right === nextRight) {
      const next = [...matched, nextLeft]
      setMatched(next)
      setLeft(null)
      setRight(null)
      if (next.length === question.pairs.length) onComplete(true)
      return
    }
    setLeft(nextLeft)
    setRight(nextRight)
    window.setTimeout(() => {
      setLeft(null)
      setRight(null)
    }, 500)
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
        {question.pairs.map((pair) => (
          <button
            type="button"
            key={pair.left}
            className={`match-tile ${left === pair.left ? 'selected-tile' : ''} ${matched.includes(pair.left) ? 'matched-tile' : ''}`}
            disabled={answered || matched.includes(pair.left)}
            onClick={() => selectLeft(pair.left)}
          >
            {pair.left}
          </button>
        ))}
      </div>
      <div>
        {shuffledRight.map((place) => {
          const pair = question.pairs.find((item) => item.right === place)
          const isMatched = pair ? matched.includes(pair.left) : false
          return (
            <button
              type="button"
              key={place}
              className={`match-tile ${right === place ? 'selected-tile' : ''} ${isMatched ? 'matched-tile' : ''}`}
              disabled={answered || isMatched}
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
}: {
  question: OrderQuestion
  answered: boolean
  onComplete: (correct: boolean) => void
}) {
  const [items, setItems] = useState(() => shuffle(question.items))

  function move(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= items.length) return
    const next = [...items]
    ;[next[index], next[target]] = [next[target], next[index]]
    setItems(next)
  }

  return (
    <div className="order-board">
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
      <button
        className="primary-button check-order"
        type="button"
        disabled={answered}
        onClick={() => onComplete(items.every((item, index) => item === question.answer[index]))}
      >
        Check my order
      </button>
    </div>
  )
}

function Results({
  score,
  total,
  bestStreak,
  category,
  onReplay,
  onHome,
}: {
  score: number
  total: number
  bestStreak: number
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
        <h1>{percent >= 80 ? 'Excellent exploring.' : percent >= 55 ? 'You’re finding your way.' : 'A good first pass.'}</h1>
        <p className="result-copy">
          {percent >= 80
            ? 'Your mental map is taking shape. Try another route to keep the streak going.'
            : 'Every round strengthens the connections between names, places, and directions.'}
        </p>
        <div className="result-score">
          <strong>{score}<span>/{total}</span></strong>
          <small>correct answers</small>
        </div>
        <div className="result-details">
          <div><strong>{percent}%</strong><span>Accuracy</span></div>
          <div><strong>{bestStreak}</strong><span>Best streak</span></div>
        </div>
        <div className="result-actions">
          <button className="primary-button" type="button" onClick={onReplay}><RotateCcw size={18} /> Play again</button>
          <button className="quiet-button" type="button" onClick={onHome}>Choose another track</button>
        </div>
      </section>
    </main>
  )
}

export default App
