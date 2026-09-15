import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import {
  ArrowLeft,
  Award,
  Check,
  ChevronLeft,
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
  Pencil,
  Plus,
  RotateCcw,
  Route,
  Sparkles,
  Sun,
  Trash2,
  Trophy,
  UserRound,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import {
  buildQuestions,
  categoryDetails,
  getQuestionPoolCount,
  getQuestionsByIds,
  practiceDetails,
  questionPoolCounts,
  type Category,
  type ClueQuestion,
  type MatchingQuestion,
  type OrderQuestion,
  type PinpointQuestion,
  type PracticeMode,
  type Question,
} from './data'
import { US_MAP_VIEWBOX, usRegionShapes, usStateShapes } from './usStateShapes'
import './App.css'

type Screen = 'home' | 'quiz' | 'results'
type AppPage = 'home' | 'builder'
type ThemeMode = 'system' | 'light' | 'dark'
type RoundSize = 10 | 25 | 50
type AccentColor = 'indigo' | 'blue' | 'teal' | 'green' | 'violet' | 'rose' | 'orange' | 'crimson'
type Modal = 'settings' | 'tips' | 'setup' | 'startup-tip' | 'reset-stats' | 'profiles' | null
type FeedbackKind = 'correct' | 'incorrect'

type Stats = {
  games: number
  correct: number
  answered: number
  bestStreak: number
}

type Preferences = {
  theme: ThemeMode
  accent: AccentColor
  sound: boolean
  timer: boolean
  tipsStartup: boolean
  roundSize: RoundSize
}

type Profile = {
  id: string
  name: string
  stats: Stats
  preferences: Preferences
  tipIndex: number
  flaggedQuestionIds: string[]
}

type ProfileStore = {
  activeProfileId: string
  profiles: Profile[]
}

type SavedWorkout = {
  category: Category
  practice: PracticeMode
  questionIds: string[]
  questionIndex: number
  answers: Record<string, boolean>
  score: number
  streak: number
  bestRunStreak: number
  elapsed: number
  timerEnabled: boolean
  onlyFlagged: boolean
  allFlaggedModes: boolean
}

type SavedWorkoutStore = Record<string, SavedWorkout>

const defaultStats: Stats = { games: 0, correct: 0, answered: 0, bestStreak: 0 }
const APP_VERSION = 'v16'
const PROFILES_KEY = 'geography-gym-profiles-v1'
const SAVED_WORKOUTS_KEY = 'geography-gym-saved-workouts-v1'
const defaultPreferences: Preferences = {
  theme: 'system',
  accent: 'indigo',
  sound: true,
  timer: false,
  tipsStartup: true,
  roundSize: 10,
}
const accentColors: { id: AccentColor; label: string }[] = [
  { id: 'indigo', label: 'Indigo' },
  { id: 'blue', label: 'Blue' },
  { id: 'teal', label: 'Teal' },
  { id: 'green', label: 'Green' },
  { id: 'violet', label: 'Violet' },
  { id: 'rose', label: 'Rose' },
  { id: 'orange', label: 'Orange' },
  { id: 'crimson', label: 'Crimson' },
]
const practiceModes: PracticeMode[] = ['variety', 'clue-ladder', 'neighbors', 'closer', 'pinpoint']

function practiceAvailable(category: Category, practice: PracticeMode) {
  if (practice === 'variety' || practice === 'clue-ladder') return true
  if (practice === 'neighbors') return category === 'us' || category === 'world' || category === 'mixed'
  return category === 'landmarks'
}

function practiceScope(category: Category, practice: PracticeMode) {
  if (practice === 'neighbors' && category === 'mixed') return 'Uses U.S. and World questions'
  if (!practiceAvailable(category, practice)) {
    return practice === 'neighbors' ? 'Available for U.S., World, or Mixed' : 'Available for Landmarks'
  }
  return `${getQuestionPoolCount(category, practice).toLocaleString()} questions available`
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
  {
    title: 'Zoom in before locating a state',
    text: 'U.S. location questions first ask for a broad map section, then zoom in for a more accurate state placement challenge. State borders appear after you finish.',
  },
  {
    title: 'Give each learner a profile',
    text: 'Use the profile button at the right of the toolbar to add or switch learners. Each profile keeps its own progress and preferences on this device.',
  },
  {
    title: 'Personalize every profile',
    text: 'Theme, accent color, answer sounds, timer, startup tips, and default workout length are saved separately for each profile.',
  },
  {
    title: 'Reset only the active profile',
    text: 'The Reset button clears the current learner’s workout totals, accuracy, and best streak without changing settings or other profiles.',
  },
  {
    title: 'Listen for answer feedback',
    text: 'Optional sounds reinforce correct and incorrect answers. Each profile can turn them on or off in Settings.',
  },
  {
    title: 'Choose when to update',
    text: 'When a new version is ready, choose Update and Restart to use it now or Later to finish what you are doing first.',
  },
  {
    title: 'Help improve Geography Gym',
    text: 'The FAQ and Help Center explain app features, and Send Feedback lets you report a problem, suggest an idea, or flag a geography fact.',
  },
  {
    title: 'Climb the Clue Ladder',
    text: 'Start with a broad clue, reveal more when needed, and identify the state, country, or landmark before the answer is shown.',
  },
  {
    title: 'Learn what touches what',
    text: 'Neighbor Challenge strengthens your mental map by asking which U.S. states or countries share a land border.',
  },
  {
    title: 'Compare straight-line distances',
    text: 'Which Is Closer? uses landmark coordinates to compare direct distances across the globe, not driving or travel routes.',
  },
  {
    title: 'Pinpoint a landmark in two tries',
    text: 'Your first Map Pinpoint miss reports the distance but hides the target. A second try reveals the landmark’s location.',
  },
  {
    title: 'Build your own review list',
    text: 'Flag any Geography Gym question during a workout, then use Flagged Review or Only use flagged questions to practice it again.',
  },
  {
    title: 'Build a workout in two steps',
    text: 'First choose what to study—U.S., World, Landmarks, or Mixed. Then choose the practice style that builds the skill you want.',
  },
  {
    title: 'Start from the app home',
    text: 'Open app—or launch an installed copy—to start, resume, or review. Start an exercise opens the two-step builder, and Settings links back to the full website and help pages.',
  },
  {
    title: 'Resume where you stopped',
    text: 'If you leave during a workout, the active profile remembers the question order, position, score, streak, and timer. Choose Resume workout on the home page to continue.',
  },
  {
    title: 'Review a previous question',
    text: 'Use Previous during a workout to revisit an answered question and its correct answer. Review mode never changes your score or streak.',
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

function createProfileId() {
  return typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `profile-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function readProfileStore(): ProfileStore {
  try {
    const saved = localStorage.getItem(PROFILES_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<ProfileStore>
      const profiles = Array.isArray(parsed.profiles)
        ? parsed.profiles
            .filter((profile) => profile && typeof profile.id === 'string' && typeof profile.name === 'string')
            .map((profile) => {
              const preferences = { ...defaultPreferences, ...profile.preferences }
              if (!accentColors.some((color) => color.id === preferences.accent)) {
                preferences.accent = 'indigo'
              }

              return {
                id: profile.id,
                name: profile.name.trim().slice(0, 24) || 'Profile',
                stats: { ...defaultStats, ...profile.stats },
                preferences,
                tipIndex: Number.isInteger(profile.tipIndex) ? profile.tipIndex : 0,
                flaggedQuestionIds: Array.isArray(profile.flaggedQuestionIds)
                  ? profile.flaggedQuestionIds.filter((id): id is string => typeof id === 'string')
                  : [],
              }
            })
        : []

      if (profiles.length > 0) {
        const activeProfileId = profiles.some((profile) => profile.id === parsed.activeProfileId)
          ? parsed.activeProfileId as string
          : profiles[0].id
        return { activeProfileId, profiles }
      }
    }
  } catch {
    // Fall through to the legacy-data migration.
  }

  const profile: Profile = {
    id: createProfileId(),
    name: 'Me',
    stats: readJson('geography-gym-stats', defaultStats),
    preferences: readJson('geography-gym-preferences', defaultPreferences),
    tipIndex: Number.parseInt(localStorage.getItem('geography-gym-tip-index') ?? '0', 10) || 0,
    flaggedQuestionIds: [],
  }
  return { activeProfileId: profile.id, profiles: [profile] }
}

function readSavedWorkouts(): SavedWorkoutStore {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVED_WORKOUTS_KEY) ?? '{}')
    return saved && typeof saved === 'object' && !Array.isArray(saved)
      ? saved as SavedWorkoutStore
      : {}
  } catch {
    return {}
  }
}

function profileInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || '?'
}

function shuffle<T>(items: readonly T[]) {
  return [...items].sort(() => Math.random() - 0.5)
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function SystemThemeIcon() {
  return (
    <svg
      aria-hidden="true"
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 3a9 9 0 0 0 0 18Z" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  )
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
  const [appPage, setAppPage] = useState<AppPage>('home')
  const [appMode, setAppMode] = useState(() =>
    new URLSearchParams(window.location.search).get('app') === '1'
    || window.matchMedia('(display-mode: standalone)').matches,
  )
  const [appSelectedCategory, setAppSelectedCategory] = useState<Category | null>(null)
  const [modal, setModal] = useState<Modal>(null)
  const [pendingCategory, setPendingCategory] = useState<Category>('mixed')
  const [pendingPractice, setPendingPractice] = useState<PracticeMode>('variety')
  const [onlyFlagged, setOnlyFlagged] = useState(false)
  const [allFlaggedModes, setAllFlaggedModes] = useState(false)
  const [category, setCategory] = useState<Category>('mixed')
  const [practice, setPractice] = useState<PracticeMode>('variety')
  const [workoutOnlyFlagged, setWorkoutOnlyFlagged] = useState(false)
  const [workoutAllFlaggedModes, setWorkoutAllFlaggedModes] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answerHistory, setAnswerHistory] = useState<Record<string, boolean>>({})
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestRunStreak, setBestRunStreak] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [wasCorrect, setWasCorrect] = useState(false)
  const [reviewingAnswer, setReviewingAnswer] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [workoutTimerEnabled, setWorkoutTimerEnabled] = useState(false)
  const [roundStartedAt, setRoundStartedAt] = useState<number | null>(null)
  const [profileStore, setProfileStore] = useState<ProfileStore>(readProfileStore)
  const [savedWorkouts, setSavedWorkouts] = useState<SavedWorkoutStore>(readSavedWorkouts)
  const activeProfile =
    profileStore.profiles.find((profile) => profile.id === profileStore.activeProfileId)
    ?? profileStore.profiles[0]
  const stats = activeProfile.stats
  const preferences = activeProfile.preferences
  const savedWorkout = savedWorkouts[activeProfile.id]
  const [startupTip, setStartupTip] = useState(tips[0])
  const [newProfileName, setNewProfileName] = useState('')
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null)
  const [editingProfileName, setEditingProfileName] = useState('')
  const [deleteProfileId, setDeleteProfileId] = useState<string | null>(null)
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null)
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)
  const updateRequested = useRef(false)
  const reloadingForUpdate = useRef(false)
  const startupTipShown = useRef(false)

  useEffect(() => {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profileStore))
    localStorage.removeItem('geography-gym-stats')
    localStorage.removeItem('geography-gym-preferences')
    localStorage.removeItem('geography-gym-tip-index')
  }, [profileStore])

  useEffect(() => {
    localStorage.setItem(SAVED_WORKOUTS_KEY, JSON.stringify(savedWorkouts))
  }, [savedWorkouts])

  useEffect(() => {
    const handlePopState = () => {
      setAppMode(
        new URLSearchParams(window.location.search).get('app') === '1'
        || window.matchMedia('(display-mode: standalone)').matches,
      )
      setScreen('home')
      setAppPage('home')
      setModal(null)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

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
      document.documentElement.setAttribute('data-accent', preferences.accent)
    }
    resolveTheme()
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    media.addEventListener('change', resolveTheme)
    return () => media.removeEventListener('change', resolveTheme)
  }, [preferences])

  useEffect(() => {
    if (!appMode || startupTipShown.current) return
    startupTipShown.current = true
    if (!activeProfile.preferences.tipsStartup) return

    const profileId = activeProfile.id
    const tipIndex = activeProfile.tipIndex
    const timer = window.setTimeout(() => {
      setStartupTip(tips[tipIndex % tips.length])
      setProfileStore((current) => ({
        ...current,
        profiles: current.profiles.map((profile) =>
          profile.id === profileId
            ? { ...profile, tipIndex: (tipIndex + 1) % tips.length }
            : profile,
        ),
      }))
      setModal('startup-tip')
    }, 0)
    return () => window.clearTimeout(timer)
  }, [appMode, activeProfile.id, activeProfile.preferences.tipsStartup, activeProfile.tipIndex])

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
    if (screen !== 'quiz' || !workoutTimerEnabled || !roundStartedAt) return
    const update = () => {
      const nextElapsed = Math.floor((Date.now() - roundStartedAt) / 1000)
      setElapsed(nextElapsed)
      setSavedWorkouts((current) => {
        const saved = current[activeProfile.id]
        if (!saved || saved.elapsed === nextElapsed) return current
        return { ...current, [activeProfile.id]: { ...saved, elapsed: nextElapsed } }
      })
    }
    const interval = window.setInterval(update, 1000)
    return () => window.clearInterval(interval)
  }, [activeProfile.id, screen, workoutTimerEnabled, roundStartedAt])

  const currentQuestion = questions[questionIndex]
  const accuracy = stats.answered ? Math.round((stats.correct / stats.answered) * 100) : 0
  const flaggedCount = getQuestionPoolCount(
    'mixed',
    'variety',
    activeProfile.flaggedQuestionIds,
    true,
    true,
  )
  const setupPoolCount = getQuestionPoolCount(
    pendingCategory,
    pendingPractice,
    activeProfile.flaggedQuestionIds,
    onlyFlagged,
    allFlaggedModes,
  )
  const setupQuestionCount = Math.min(preferences.roundSize, setupPoolCount)

  function updateActiveProfile(updater: (profile: Profile) => Profile) {
    setProfileStore((current) => ({
      ...current,
      profiles: current.profiles.map((profile) =>
        profile.id === current.activeProfileId ? updater(profile) : profile,
      ),
    }))
  }

  function updatePreference<K extends keyof Preferences>(key: K, value: Preferences[K]) {
    updateActiveProfile((profile) => ({
      ...profile,
      preferences: { ...profile.preferences, [key]: value },
    }))
  }

  function openWorkoutSetup(nextCategory: Category) {
    setPendingCategory(nextCategory)
    setPendingPractice('variety')
    setOnlyFlagged(false)
    setAllFlaggedModes(false)
    setModal('setup')
  }

  function enterApp() {
    const url = new URL(window.location.href)
    url.searchParams.set('app', '1')
    window.history.pushState({}, '', url)
    setAppMode(true)
    setScreen('home')
    setAppPage('home')
    setModal(null)
  }

  function selectAppCategory(nextCategory: Category) {
    setAppSelectedCategory(nextCategory)
    setPendingCategory(nextCategory)
    setPendingPractice('variety')
    setOnlyFlagged(false)
    setAllFlaggedModes(false)
  }

  function openFlaggedReview() {
    setPendingCategory('mixed')
    setPendingPractice('variety')
    setOnlyFlagged(true)
    setAllFlaggedModes(true)
    setModal('setup')
  }

  function startWorkout() {
    const available = getQuestionPoolCount(
      pendingCategory,
      pendingPractice,
      activeProfile.flaggedQuestionIds,
      onlyFlagged,
      allFlaggedModes,
    )
    if (available === 0) return
    const nextQuestions = buildQuestions(
      pendingCategory,
      Math.min(preferences.roundSize, available),
      pendingPractice,
      activeProfile.flaggedQuestionIds,
      onlyFlagged,
      allFlaggedModes,
    )
    setCategory(pendingCategory)
    setPractice(pendingPractice)
    setWorkoutOnlyFlagged(onlyFlagged)
    setWorkoutAllFlaggedModes(allFlaggedModes)
    setQuestions(nextQuestions)
    setQuestionIndex(0)
    setAnswerHistory({})
    setScore(0)
    setStreak(0)
    setBestRunStreak(0)
    setElapsed(0)
    setWorkoutTimerEnabled(preferences.timer)
    setRoundStartedAt(Date.now())
    setSavedWorkouts((current) => ({
      ...current,
      [activeProfile.id]: {
        category: pendingCategory,
        practice: pendingPractice,
        questionIds: nextQuestions.map((question) => question.id),
        questionIndex: 0,
        answers: {},
        score: 0,
        streak: 0,
        bestRunStreak: 0,
        elapsed: 0,
        timerEnabled: preferences.timer,
        onlyFlagged,
        allFlaggedModes,
      },
    }))
    resetQuestion()
    setModal(null)
    setScreen('quiz')
  }

  function resetQuestion() {
    setAnswered(false)
    setWasCorrect(false)
    setReviewingAnswer(false)
  }

  function replayWorkout() {
    setPendingCategory(category)
    setPendingPractice(practice)
    setOnlyFlagged(workoutOnlyFlagged)
    setAllFlaggedModes(workoutAllFlaggedModes)
    setModal('setup')
  }

  function exitWorkout() {
    setSavedWorkouts((current) => {
      const saved = current[activeProfile.id]
      return saved
        ? { ...current, [activeProfile.id]: { ...saved, elapsed } }
        : current
    })
    setScreen('home')
    if (appMode) setAppPage('home')
  }

  function resumeWorkout() {
    if (!savedWorkout) return
    const restoredQuestions = getQuestionsByIds(savedWorkout.questionIds)
    if (restoredQuestions.length !== savedWorkout.questionIds.length) {
      dismissSavedWorkout()
      return
    }
    setCategory(savedWorkout.category)
    setPractice(savedWorkout.practice)
    setWorkoutOnlyFlagged(savedWorkout.onlyFlagged)
    setWorkoutAllFlaggedModes(savedWorkout.allFlaggedModes)
    setQuestions(restoredQuestions)
    const restoredIndex = Math.min(savedWorkout.questionIndex, restoredQuestions.length - 1)
    const restoredAnswers = savedWorkout.answers ?? {}
    const restoredAnswer = restoredAnswers[restoredQuestions[restoredIndex].id]
    setQuestionIndex(restoredIndex)
    setAnswerHistory(restoredAnswers)
    setScore(savedWorkout.score)
    setStreak(savedWorkout.streak)
    setBestRunStreak(savedWorkout.bestRunStreak)
    setElapsed(savedWorkout.elapsed)
    setWorkoutTimerEnabled(savedWorkout.timerEnabled ?? savedWorkout.elapsed > 0)
    setRoundStartedAt(Date.now() - savedWorkout.elapsed * 1000)
    setAnswered(restoredAnswer !== undefined)
    setWasCorrect(restoredAnswer ?? false)
    setReviewingAnswer(restoredAnswer !== undefined)
    setModal(null)
    setScreen('quiz')
  }

  function dismissSavedWorkout() {
    setSavedWorkouts((current) => {
      const next = { ...current }
      delete next[activeProfile.id]
      return next
    })
  }

  function recordAnswer(correct: boolean) {
    if (answered) return
    setAnswerHistory((current) => ({ ...current, [questions[questionIndex].id]: correct }))
    setAnswered(true)
    setWasCorrect(correct)
    setReviewingAnswer(false)
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
      updateActiveProfile((profile) => ({ ...profile, stats: nextStats }))
      dismissSavedWorkout()
      setScreen('results')
      return
    }
    setSavedWorkouts((current) => ({
      ...current,
      [activeProfile.id]: {
        category,
        practice,
        questionIds: questions.map((question) => question.id),
        questionIndex: questionIndex + 1,
        answers: answerHistory,
        score,
        streak,
        bestRunStreak,
        elapsed,
        timerEnabled: workoutTimerEnabled,
        onlyFlagged: workoutOnlyFlagged,
        allFlaggedModes: workoutAllFlaggedModes,
      },
    }))
    const nextIndex = questionIndex + 1
    const nextAnswer = answerHistory[questions[nextIndex].id]
    setQuestionIndex(nextIndex)
    setAnswered(nextAnswer !== undefined)
    setWasCorrect(nextAnswer ?? false)
    setReviewingAnswer(nextAnswer !== undefined)
  }

  function previousQuestion() {
    if (questionIndex === 0) return
    const previousIndex = questionIndex - 1
    const previousAnswer = answerHistory[questions[previousIndex].id]
    setSavedWorkouts((current) => ({
      ...current,
      [activeProfile.id]: {
        category,
        practice,
        questionIds: questions.map((question) => question.id),
        questionIndex: previousIndex,
        answers: answerHistory,
        score,
        streak,
        bestRunStreak,
        elapsed,
        timerEnabled: workoutTimerEnabled,
        onlyFlagged: workoutOnlyFlagged,
        allFlaggedModes: workoutAllFlaggedModes,
      },
    }))
    setQuestionIndex(previousIndex)
    setAnswered(previousAnswer !== undefined)
    setWasCorrect(previousAnswer ?? false)
    setReviewingAnswer(previousAnswer !== undefined)
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
    updateActiveProfile((profile) => ({ ...profile, stats: { ...defaultStats } }))
    setModal(null)
  }

  function setQuestionFlag(questionId: string, flagged: boolean) {
    updateActiveProfile((profile) => ({
      ...profile,
      flaggedQuestionIds: flagged
        ? [...new Set([...profile.flaggedQuestionIds, questionId])]
        : profile.flaggedQuestionIds.filter((id) => id !== questionId),
    }))
  }

  function openProfiles() {
    setNewProfileName('')
    setEditingProfileId(null)
    setDeleteProfileId(null)
    setModal('profiles')
  }

  function selectProfile(profileId: string) {
    if (screen === 'quiz') {
      setSavedWorkouts((current) => {
        const saved = current[activeProfile.id]
        return saved ? { ...current, [activeProfile.id]: { ...saved, elapsed } } : current
      })
    }
    setProfileStore((current) => ({ ...current, activeProfileId: profileId }))
    setScreen('home')
    setAppPage('home')
    setModal(null)
  }

  function addProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = newProfileName.trim()
    if (!name) return
    const profile: Profile = {
      id: createProfileId(),
      name: name.slice(0, 24),
      stats: { ...defaultStats },
      preferences: { ...defaultPreferences },
      tipIndex: 0,
      flaggedQuestionIds: [],
    }
    if (screen === 'quiz') {
      setSavedWorkouts((current) => {
        const saved = current[activeProfile.id]
        return saved ? { ...current, [activeProfile.id]: { ...saved, elapsed } } : current
      })
    }
    setProfileStore((current) => ({
      activeProfileId: profile.id,
      profiles: [...current.profiles, profile],
    }))
    setNewProfileName('')
    setScreen('home')
    setAppPage('home')
    setModal(null)
  }

  function startRenamingProfile(profile: Profile) {
    setEditingProfileId(profile.id)
    setEditingProfileName(profile.name)
    setDeleteProfileId(null)
  }

  function saveProfileName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = editingProfileName.trim()
    if (!editingProfileId || !name) return
    setProfileStore((current) => ({
      ...current,
      profiles: current.profiles.map((profile) =>
        profile.id === editingProfileId ? { ...profile, name: name.slice(0, 24) } : profile,
      ),
    }))
    setEditingProfileId(null)
  }

  function deleteProfile(profileId: string) {
    setProfileStore((current) => {
      if (current.profiles.length === 1) return current
      const profiles = current.profiles.filter((profile) => profile.id !== profileId)
      const activeProfileId =
        current.activeProfileId === profileId ? profiles[0].id : current.activeProfileId
      return { activeProfileId, profiles }
    })
    setSavedWorkouts((current) => {
      const next = { ...current }
      delete next[profileId]
      return next
    })
    setDeleteProfileId(null)
    setEditingProfileId(null)
    setScreen('home')
    setAppPage('home')
  }

  const themeLabel =
    preferences.theme === 'system'
      ? 'System'
      : preferences.theme === 'light'
        ? 'Light'
        : 'Dark'

  return (
    <div className={`app-shell ${appMode ? 'product-mode' : 'website-mode'}`}>
      <header className={`app-header ${appMode ? 'product-header' : ''}`}>
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
          <button className="brand" type="button" onClick={exitWorkout}>
            <span className="brand-mark" aria-hidden="true"><Globe2 size={25} /></span>
            <strong>Geography Gym</strong>
          </button>
        </div>
        <div className="header-actions">
          {!appMode && (
            <nav className="header-nav" aria-label="Primary navigation">
              <button
                className={`header-link ${screen === 'home' ? 'active' : ''}`}
                type="button"
                onClick={exitWorkout}
              >
                Home
              </button>
              <button className="header-link open-app-link" type="button" onClick={enterApp}>
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
          )}
          <button
            className="icon-button tips-button"
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
                : <SystemThemeIcon />}
            <span>{themeLabel}</span>
          </button>
          <button
            className="profile-menu-button"
            type="button"
            onClick={openProfiles}
            aria-label={`Profile: ${activeProfile.name}. Manage profiles`}
            title={`Profile: ${activeProfile.name}`}
          >
            {profileInitial(activeProfile.name)}
          </button>
        </div>
      </header>

      {screen === 'home' && !appMode && (
        <Home
          stats={stats}
          accuracy={accuracy}
          flaggedCount={flaggedCount}
          savedWorkout={savedWorkout}
          openWorkoutSetup={openWorkoutSetup}
          openFlaggedReview={openFlaggedReview}
          onResumeWorkout={resumeWorkout}
          onDismissWorkout={dismissSavedWorkout}
          onResetStats={() => setModal('reset-stats')}
        />
      )}

      {screen === 'home' && appMode && (
        <AppDashboard
          stats={stats}
          accuracy={accuracy}
          flaggedCount={flaggedCount}
          savedWorkout={savedWorkout}
          page={appPage}
          selectedCategory={appSelectedCategory}
          pendingPractice={pendingPractice}
          preferences={preferences}
          setupQuestionCount={appSelectedCategory ? setupQuestionCount : 0}
          profileName={activeProfile.name}
          onSelectCategory={selectAppCategory}
          onOpenBuilder={() => setAppPage('builder')}
          onAppHome={() => setAppPage('home')}
          onSelectPractice={setPendingPractice}
          onRoundSizeChange={(size) => updatePreference('roundSize', size)}
          onTimerChange={(checked) => updatePreference('timer', checked)}
          onlyFlagged={onlyFlagged}
          onOnlyFlaggedChange={(checked) => {
            setOnlyFlagged(checked)
            setAllFlaggedModes(false)
          }}
          onStart={startWorkout}
          onResumeWorkout={resumeWorkout}
          onDismissWorkout={dismissSavedWorkout}
          onFlaggedReview={openFlaggedReview}
          onResetStats={() => setModal('reset-stats')}
          onTipsStartupChange={(checked) => updatePreference('tipsStartup', checked)}
        />
      )}

      {screen === 'quiz' && currentQuestion && (
        <main className="quiz-shell">
          <div className="quiz-toolbar">
            <div className="quiz-nav-actions">
              <button className="back-button" type="button" onClick={exitWorkout}>
                <ArrowLeft size={18} /> Exit
              </button>
              {questionIndex > 0 && (
                <button className="back-button" type="button" onClick={previousQuestion}>
                  <ChevronLeft size={18} /> Previous
                </button>
              )}
            </div>
            <div className="progress-copy">
              <span>{categoryDetails[category].label}</span>
              <strong>{questionIndex + 1} / {questions.length}</strong>
            </div>
            <div className="quiz-status">
              {workoutTimerEnabled && (
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
            reviewOnly={reviewingAnswer}
            onAnswer={recordAnswer}
            onFeedback={(kind) => playFeedbackSound(kind, preferences.sound)}
            flagged={activeProfile.flaggedQuestionIds.includes(currentQuestion.id)}
            onFlagChange={(flagged) => setQuestionFlag(currentQuestion.id, flagged)}
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
          timerEnabled={workoutTimerEnabled}
          category={category}
          practice={practice}
          onReplay={replayWorkout}
          onHome={() => {
            setScreen('home')
            if (appMode) setAppPage('home')
          }}
        />
      )}

      {screen === 'home' && !appMode && <AppFooter />}

      {modal === 'setup' && (
        <ModalShell
          title={allFlaggedModes ? 'Set up Flagged Review' : 'Choose how to study'}
          eyebrow={allFlaggedModes ? 'Profile review' : `Step 2 of 2 · ${categoryDetails[pendingCategory].label}`}
          onClose={() => {
            setModal(null)
            if (allFlaggedModes) {
              setOnlyFlagged(false)
              setAllFlaggedModes(false)
            }
          }}
        >
          <p className="modal-lead">
            {onlyFlagged
              ? `${setupPoolCount.toLocaleString()} flagged ${setupPoolCount === 1 ? 'question is' : 'questions are'} available for this workout.`
              : `You chose ${categoryDetails[pendingCategory].label}. Select a practice style, then choose your workout length.`}
          </p>
          {!allFlaggedModes && (
            <fieldset className="choice-fieldset">
              <legend>Practice style</legend>
              <div className="practice-options">
                {practiceModes.map((mode) => {
                  const available = practiceAvailable(pendingCategory, mode)
                  return (
                    <label
                      key={mode}
                      className={[
                        pendingPractice === mode ? 'selected-option' : '',
                        !available ? 'disabled-option' : '',
                      ].join(' ')}
                    >
                      <input
                        type="radio"
                        name="practice-mode"
                        value={mode}
                        checked={pendingPractice === mode}
                        disabled={!available}
                        onChange={() => setPendingPractice(mode)}
                      />
                      <span>
                        <strong>{practiceDetails[mode].label}</strong>
                        <small>{practiceDetails[mode].description}</small>
                        <em>{practiceScope(pendingCategory, mode)}</em>
                      </span>
                    </label>
                  )
                })}
              </div>
            </fieldset>
          )}
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
          <ToggleRow
            checked={onlyFlagged}
            onChange={(checked) => {
              setOnlyFlagged(checked)
              if (!checked) setAllFlaggedModes(false)
            }}
            icon={<Flag />}
            title="Only use flagged questions"
            description={
              flaggedCount > 0
                ? `${flaggedCount} ${flaggedCount === 1 ? 'question is' : 'questions are'} flagged in ${activeProfile.name}'s profile.`
                : 'Flag questions during a workout to build a personal review list.'
            }
            disabled={flaggedCount === 0 || allFlaggedModes}
          />
          <button
            className="primary-button modal-primary"
            type="button"
            onClick={startWorkout}
            disabled={setupQuestionCount === 0}
          >
            {setupQuestionCount > 0
              ? `Start ${setupQuestionCount}-question workout`
              : 'No flagged questions available'}
          </button>
        </ModalShell>
      )}

      {modal === 'settings' && (
        <ModalShell title="Settings" eyebrow={`${activeProfile.name}'s profile`} onClose={() => setModal(null)}>
          <div className="profile-settings-banner">
            <span className="profile-avatar" aria-hidden="true">{profileInitial(activeProfile.name)}</span>
            <div>
              <strong>{activeProfile.name}</strong>
              <small>These settings apply only to this profile.</small>
            </div>
          </div>
          <fieldset className="choice-fieldset appearance-fieldset">
            <legend>Appearance</legend>
            <div className="appearance-row">
              <span>Theme</span>
              <div className="theme-options">
                {(['system', 'light', 'dark'] as ThemeMode[]).map((theme) => (
                  <label key={theme} className={preferences.theme === theme ? 'selected-option' : ''}>
                    <input
                      type="radio"
                      name="profile-theme"
                      checked={preferences.theme === theme}
                      onChange={() => updatePreference('theme', theme)}
                    />
                    {theme.charAt(0).toUpperCase() + theme.slice(1)}
                  </label>
                ))}
              </div>
            </div>
            <div className="appearance-row accent-row">
              <span>Accent color</span>
              <div className="accent-options">
                {accentColors.map((color) => (
                  <button
                    key={color.id}
                    className="accent-option"
                    data-accent-option={color.id}
                    type="button"
                    aria-label={color.label}
                    aria-pressed={preferences.accent === color.id}
                    title={color.label}
                    onClick={() => updatePreference('accent', color.id)}
                  >
                    {preferences.accent === color.id && <Check size={17} />}
                  </button>
                ))}
              </div>
            </div>
          </fieldset>
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
          <section className="settings-resource-card">
            <p className="eyebrow">Feedback</p>
            <p>Found a problem or have an idea? Share feedback or report an issue on GitHub.</p>
            <a
              className="primary-button settings-feedback-button"
              href="https://github.com/LurieJoe/geography-gym/issues/new/choose"
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink size={17} /> Send Feedback
            </a>
          </section>
          <section className="settings-resource-card">
            <p className="eyebrow">Geography Gym website</p>
            <p>Visit the website for product information, help, and policies.</p>
            <nav className="support-links" aria-label="Geography Gym website">
              <a href="./" target="_blank" rel="noreferrer"><Globe2 /> Home</a>
              <a href="./faq/" target="_blank" rel="noreferrer"><HelpCircle /> FAQ</a>
              <a href="./help/" target="_blank" rel="noreferrer"><HelpCircle /> Help Center</a>
              <a href="./privacy/" target="_blank" rel="noreferrer"><ExternalLink /> Privacy</a>
            </nav>
          </section>
          <p className="version-label">Geography Gym {APP_VERSION}</p>
        </ModalShell>
      )}

      {modal === 'profiles' && (
        <ModalShell title="Profiles" eyebrow="Choose who is learning" onClose={() => setModal(null)}>
          <div className="profile-list">
            {profileStore.profiles.map((profile) => {
              const isActive = profile.id === activeProfile.id
              const isEditing = profile.id === editingProfileId
              const isDeleting = profile.id === deleteProfileId

              if (isEditing) {
                return (
                  <form className="profile-edit-form" key={profile.id} onSubmit={saveProfileName}>
                    <span className="profile-avatar" aria-hidden="true">{profileInitial(editingProfileName)}</span>
                    <input
                      value={editingProfileName}
                      maxLength={24}
                      aria-label="Profile name"
                      onChange={(event) => setEditingProfileName(event.target.value)}
                      autoFocus
                    />
                    <button className="icon-button" type="submit" aria-label="Save profile name" disabled={!editingProfileName.trim()}>
                      <Check size={18} />
                    </button>
                    <button className="icon-button" type="button" aria-label="Cancel rename" onClick={() => setEditingProfileId(null)}>
                      <X size={18} />
                    </button>
                  </form>
                )
              }

              return (
                <div className="profile-row" key={profile.id}>
                  <button
                    className={`profile-select ${isActive ? 'active' : ''}`}
                    type="button"
                    onClick={() => selectProfile(profile.id)}
                  >
                    <span className="profile-avatar" aria-hidden="true">{profileInitial(profile.name)}</span>
                    <span>{profile.name}</span>
                    {isActive && <Check size={18} />}
                  </button>
                  <button className="icon-button" type="button" aria-label={`Rename ${profile.name}`} onClick={() => startRenamingProfile(profile)}>
                    <Pencil size={17} />
                  </button>
                  <button
                    className="icon-button"
                    type="button"
                    aria-label={`Delete ${profile.name}`}
                    disabled={profileStore.profiles.length === 1}
                    onClick={() => {
                      setDeleteProfileId(profile.id)
                      setEditingProfileId(null)
                    }}
                  >
                    <Trash2 size={17} />
                  </button>
                  {isDeleting && (
                    <div className="profile-delete-confirm">
                      <span>Delete {profile.name} and all of this profile's progress?</span>
                      <button className="danger-button" type="button" onClick={() => deleteProfile(profile.id)}>Delete</button>
                      <button className="quiet-button" type="button" onClick={() => setDeleteProfileId(null)}>Cancel</button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <form className="profile-add-form" onSubmit={addProfile}>
            <UserRound aria-hidden="true" />
            <input
              value={newProfileName}
              maxLength={24}
              placeholder="New profile name"
              aria-label="New profile name"
              onChange={(event) => setNewProfileName(event.target.value)}
            />
            <button className="primary-button" type="submit" disabled={!newProfileName.trim()}>
              <Plus size={17} /> Add profile
            </button>
          </form>
          <p className="profile-privacy-note">
            Each profile keeps its own progress, theme, accent color, sounds, timer, tips, and
            workout defaults on this device. No accounts or passwords are used.
          </p>
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
        <ModalShell title="Reset learning progress?" eyebrow={`${activeProfile.name}'s counters`} onClose={() => setModal(null)}>
          <p className="modal-lead">
            This resets Workouts completed, Lifetime accuracy, and Best streak for
            {' '}{activeProfile.name}. Other profiles and this profile's settings will not change.
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

function AppDashboard({
  stats,
  accuracy,
  flaggedCount,
  savedWorkout,
  page,
  selectedCategory,
  pendingPractice,
  preferences,
  setupQuestionCount,
  profileName,
  onSelectCategory,
  onOpenBuilder,
  onAppHome,
  onSelectPractice,
  onRoundSizeChange,
  onTimerChange,
  onlyFlagged,
  onOnlyFlaggedChange,
  onStart,
  onResumeWorkout,
  onDismissWorkout,
  onFlaggedReview,
  onResetStats,
  onTipsStartupChange,
}: {
  stats: Stats
  accuracy: number
  flaggedCount: number
  savedWorkout?: SavedWorkout
  page: AppPage
  selectedCategory: Category | null
  pendingPractice: PracticeMode
  preferences: Preferences
  setupQuestionCount: number
  profileName: string
  onSelectCategory: (category: Category) => void
  onOpenBuilder: () => void
  onAppHome: () => void
  onSelectPractice: (practice: PracticeMode) => void
  onRoundSizeChange: (size: RoundSize) => void
  onTimerChange: (checked: boolean) => void
  onlyFlagged: boolean
  onOnlyFlaggedChange: (checked: boolean) => void
  onStart: () => void
  onResumeWorkout: () => void
  onDismissWorkout: () => void
  onFlaggedReview: () => void
  onResetStats: () => void
  onTipsStartupChange: (checked: boolean) => void
}) {
  const subjects: Array<{
    category: Category
    icon: ReactNode
    description: string
  }> = [
    { category: 'us', icon: <Map />, description: 'States, capitals, locations, and neighbors' },
    { category: 'world', icon: <Globe2 />, description: 'Countries, capitals, regions, and maps' },
    { category: 'landmarks', icon: <Landmark />, description: 'Famous places, distances, and locations' },
    { category: 'mixed', icon: <Sparkles />, description: 'A combination of all three subjects' },
  ]

  if (page === 'home') {
    return (
      <main className="app-home">
        <section className="app-home-welcome">
          <div className="app-home-globe" aria-hidden="true">
            <span className="app-home-orbit" />
            <Globe2 />
          </div>
          <p className="eyebrow">Learn the world by playing it</p>
          <h1>Welcome to Geography Gym</h1>
          <p className="app-home-description">
            Strengthen your sense of place with quick exercises covering states,
            countries, capitals, directions, locations, and landmarks.
          </p>
          <div className="app-home-actions">
            <button className="primary-button" type="button" onClick={onOpenBuilder}>
              <Sparkles size={19} /> Start an exercise
            </button>
            {savedWorkout && (
              <button className="quiet-button" type="button" onClick={onResumeWorkout}>
                <RotateCcw size={18} /> Resume workout
              </button>
            )}
            <button
              className="quiet-button"
              type="button"
              onClick={onFlaggedReview}
              disabled={flaggedCount === 0}
            >
              <Flag size={18} /> Review flagged questions ({flaggedCount})
            </button>
          </div>
          <label className="simple-check app-startup-tip-check">
            <input
              type="checkbox"
              checked={preferences.tipsStartup}
              onChange={(event) => onTipsStartupChange(event.target.checked)}
            />
            Show tips at startup
          </label>
        </section>

        <AppProgressCard
          stats={stats}
          accuracy={accuracy}
          flaggedCount={flaggedCount}
          profileName={profileName}
          onFlaggedReview={onFlaggedReview}
          onResetStats={onResetStats}
        />
      </main>
    )
  }

  return (
    <main className="app-dashboard">
      <section className="app-welcome">
        <div className="app-welcome-mark" aria-hidden="true"><Globe2 /></div>
        <div>
          <button className="app-back-link" type="button" onClick={onAppHome}>
            <ChevronLeft size={17} /> App home
          </button>
          <h1>Build an exercise</h1>
          <p>Choose what to study, then choose how to study it.</p>
        </div>
      </section>

      {savedWorkout && (
        <section className="resume-workout app-resume" aria-label="Saved workout">
          <div className="resume-icon"><RotateCcw /></div>
          <div>
            <p className="eyebrow">Continue where you stopped</p>
            <h2>Resume your workout</h2>
            <p>
              {categoryDetails[savedWorkout.category].label}
              {' · '}
              {practiceDetails[savedWorkout.practice].label}
              {' · Question '}
              {savedWorkout.questionIndex + 1} of {savedWorkout.questionIds.length}
            </p>
          </div>
          <div className="resume-actions">
            <button className="primary-button" type="button" onClick={onResumeWorkout}>Resume</button>
            <button className="quiet-button" type="button" onClick={onDismissWorkout}>Dismiss</button>
          </div>
        </section>
      )}

      <section className="app-builder" aria-label="Build an exercise">
        <div className="app-step-heading">
          <span>1</span>
          <div>
            <p className="eyebrow">Step 1</p>
            <h2>Choose what to study</h2>
          </div>
        </div>
        <div className="app-subject-options">
          {subjects.map((subject) => (
            <button
              key={subject.category}
              className={selectedCategory === subject.category ? 'selected-option' : ''}
              type="button"
              aria-pressed={selectedCategory === subject.category}
              onClick={() => onSelectCategory(subject.category)}
            >
              <span className="app-option-icon">{subject.icon}</span>
              <span>
                <strong>{categoryDetails[subject.category].label}</strong>
                <small>{subject.description}</small>
              </span>
              {selectedCategory === subject.category && <Check size={19} />}
            </button>
          ))}
        </div>

        <div className="app-step-divider" />

        <div className="app-step-heading">
          <span>2</span>
          <div>
            <p className="eyebrow">Step 2</p>
            <h2>Choose how to study</h2>
          </div>
        </div>
        {!selectedCategory && (
          <p className="app-step-prompt"><MapPin size={18} /> Choose a subject above to see its available exercises.</p>
        )}
        <div className="practice-options app-practice-options">
          {practiceModes.map((mode) => {
            const available = selectedCategory ? practiceAvailable(selectedCategory, mode) : false
            return (
              <label
                key={mode}
                className={[
                  selectedCategory && pendingPractice === mode ? 'selected-option' : '',
                  !available ? 'disabled-option' : '',
                ].join(' ')}
              >
                <input
                  type="radio"
                  name="app-practice-mode"
                  value={mode}
                  checked={selectedCategory !== null && pendingPractice === mode}
                  disabled={!available}
                  onChange={() => onSelectPractice(mode)}
                />
                <span>
                  <strong>{practiceDetails[mode].label}</strong>
                  <small>{practiceDetails[mode].description}</small>
                  <em>
                    {selectedCategory
                      ? practiceScope(selectedCategory, mode)
                      : 'Choose a subject first'}
                  </em>
                </span>
              </label>
            )
          })}
        </div>

        <div className="app-workout-options">
          <fieldset className="choice-fieldset">
            <legend>Questions this round</legend>
            <div className="segmented-options">
              {([10, 25, 50] as RoundSize[]).map((size) => (
                <label key={size} className={preferences.roundSize === size ? 'selected-option' : ''}>
                  <input
                    type="radio"
                    name="app-round-size"
                    value={size}
                    checked={preferences.roundSize === size}
                    onChange={() => onRoundSizeChange(size)}
                  />
                  <strong>{size}</strong>
                  <span>questions</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="app-toggle-options">
            <ToggleRow
              checked={preferences.timer}
              onChange={onTimerChange}
              icon={<Clock3 />}
              title="Show workout timer"
              description="Use a stopwatch without adding a deadline."
            />
            <ToggleRow
              checked={onlyFlagged}
              onChange={onOnlyFlaggedChange}
              icon={<Flag />}
              title="Only use flagged questions"
              description={
                flaggedCount > 0
                  ? `${flaggedCount} flagged ${flaggedCount === 1 ? 'question' : 'questions'} in this profile.`
                  : 'Flag questions during workouts to build a review list.'
              }
              disabled={flaggedCount === 0}
            />
          </div>
        </div>

        <button
          className="primary-button app-start-button"
          type="button"
          onClick={onStart}
          disabled={!selectedCategory || setupQuestionCount === 0}
        >
          {selectedCategory
            ? `Start ${setupQuestionCount}-question exercise`
            : 'Choose a subject to continue'}
        </button>
      </section>

      <AppProgressCard
        stats={stats}
        accuracy={accuracy}
        flaggedCount={flaggedCount}
        profileName={profileName}
        onFlaggedReview={onFlaggedReview}
        onResetStats={onResetStats}
      />
    </main>
  )
}

function AppProgressCard({
  stats,
  accuracy,
  flaggedCount,
  profileName,
  onFlaggedReview,
  onResetStats,
}: {
  stats: Stats
  accuracy: number
  flaggedCount: number
  profileName: string
  onFlaggedReview: () => void
  onResetStats: () => void
}) {
  return (
    <section className="app-progress-card" aria-label="Learning progress">
      <div className="app-progress-heading">
        <div>
          <p className="eyebrow">{profileName}'s progress</p>
          <h2>Keep building your mental map</h2>
        </div>
        <button className="quiet-button" type="button" onClick={onResetStats}>
          <RotateCcw size={16} /> Reset
        </button>
      </div>
      <div className="app-progress-stats">
        <div><strong>{stats.games}</strong><span>Workouts</span></div>
        <div><strong>{accuracy}%</strong><span>Accuracy</span></div>
        <div><strong>{stats.bestStreak}</strong><span>Best streak</span></div>
      </div>
      <button
        className="quiet-button app-review-button"
        type="button"
        onClick={onFlaggedReview}
        disabled={flaggedCount === 0}
      >
        <Flag size={17} /> Review flagged questions ({flaggedCount})
      </button>
    </section>
  )
}

function Home({
  stats,
  accuracy,
  flaggedCount,
  savedWorkout,
  openWorkoutSetup,
  openFlaggedReview,
  onResumeWorkout,
  onDismissWorkout,
  onResetStats,
}: {
  stats: Stats
  accuracy: number
  flaggedCount: number
  savedWorkout?: SavedWorkout
  openWorkoutSetup: (category: Category) => void
  openFlaggedReview: () => void
  onResumeWorkout: () => void
  onDismissWorkout: () => void
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
            <button
              className="primary-button large"
              type="button"
              onClick={() => document.getElementById('subjects')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Sparkles size={19} /> Choose a subject
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

      {savedWorkout && (
        <section className="resume-workout" aria-label="Saved workout">
          <div className="resume-icon"><RotateCcw /></div>
          <div>
            <p className="eyebrow">Continue where you stopped</p>
            <h2>Resume your workout</h2>
            <p>
              {categoryDetails[savedWorkout.category].label}
              {' · '}
              {practiceDetails[savedWorkout.practice].label}
              {' · Question '}
              {savedWorkout.questionIndex + 1} of {savedWorkout.questionIds.length}
              {savedWorkout.timerEnabled || savedWorkout.elapsed > 0
                ? ` · ${formatTime(savedWorkout.elapsed)}`
                : ''}
            </p>
          </div>
          <div className="resume-actions">
            <button className="primary-button" type="button" onClick={onResumeWorkout}>
              Resume workout
            </button>
            <button className="quiet-button" type="button" onClick={onDismissWorkout}>
              Dismiss
            </button>
          </div>
        </section>
      )}

      <section className="stats-strip" aria-label="Learning progress">
        <div><strong>{stats.games}</strong><span>Workouts completed</span></div>
        <div><strong>{accuracy}%</strong><span>Lifetime accuracy</span></div>
        <div><strong>{stats.bestStreak}</strong><span>Best streak</span></div>
        <button
          className="review-stats-button"
          type="button"
          onClick={openFlaggedReview}
          disabled={flaggedCount === 0}
          title="Practice flagged questions"
        >
          <Flag size={17} /> Review flagged ({flaggedCount})
        </button>
        <button className="reset-stats-button" type="button" onClick={onResetStats} title="Reset lifetime counters">
          <RotateCcw size={17} /> Reset
        </button>
      </section>

      <section className="tracks-section" id="subjects">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Start your workout</p>
            <h2>Choose your geography exercise</h2>
          </div>
          <div className="workout-steps" aria-label="Two steps to build a workout">
            <div>
              <span>1</span>
              <strong>Choose what to study</strong>
            </div>
            <b aria-hidden="true">→</b>
            <div>
              <span>2</span>
              <strong>Choose how to study</strong>
            </div>
          </div>
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
          <TrackCard
            icon={<Sparkles />}
            category="mixed"
            title="Mixed Geography"
            description="Combine U.S. geography, world geography, and landmarks in one workout."
            games={['All three subjects', 'Varied question styles', 'Clue practice', 'Broader review']}
            count={questionPoolCounts.mixed}
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
        Choose this exercise <span aria-hidden="true">→</span>
      </button>
    </article>
  )
}

function QuestionCard({
  question,
  answered,
  reviewOnly,
  onAnswer,
  onFeedback,
  flagged,
  onFlagChange,
}: {
  question: Question
  answered: boolean
  reviewOnly: boolean
  onAnswer: (correct: boolean) => void
  onFeedback: (kind: FeedbackKind) => void
  flagged: boolean
  onFlagChange: (flagged: boolean) => void
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
        {question.kind === 'locate-us' || question.kind === 'locate-world' || question.kind === 'pinpoint'
          ? <MapPin size={17} />
          : question.kind === 'clue'
            ? <Lightbulb size={17} />
          : question.kind === 'matching'
            ? <Route size={17} />
            : question.kind === 'order'
              ? <Compass size={17} />
              : <Flag size={17} />}
        {question.label}
      </div>
      <h2>{question.prompt}</h2>
      {question.hint && <p className="question-hint">{question.hint}</p>}

      {reviewOnly && <QuestionReview question={question} />}

      {!reviewOnly && question.kind === 'choice' && (
        <AnswerChoices
          options={question.options}
          answer={question.answer}
          answered={answered}
          wrongAnswers={wrongAnswers}
          shakingAnswer={shakingAnswer}
          onSelect={(value) => attemptAnswer(value, question.answer)}
        />
      )}

      {!reviewOnly && question.kind === 'clue' && (
        <ClueLadder
          question={question}
          answered={answered}
          wrongAnswers={wrongAnswers}
          shakingAnswer={shakingAnswer}
          onSelect={(value) => attemptAnswer(value, question.answer)}
        />
      )}

      {!reviewOnly && question.kind === 'locate-us' && (
        <UsMap
          answer={question.answer}
          wrongAnswers={wrongAnswers}
          correctAnswer={correctAnswer}
          shakingAnswer={shakingAnswer}
          answered={answered}
          onSelect={(value) => attemptAnswer(value, question.answer)}
        />
      )}

      {!reviewOnly && question.kind === 'locate-world' && (
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

      {!reviewOnly && question.kind === 'matching' && (
        <MatchingGame
          question={question}
          answered={answered}
          onComplete={onAnswer}
          onFeedback={onFeedback}
        />
      )}

      {!reviewOnly && question.kind === 'order' && (
        <OrderGame
          question={question}
          answered={answered}
          onComplete={onAnswer}
          onFeedback={onFeedback}
        />
      )}

      {!reviewOnly && question.kind === 'pinpoint' && (
        <PinpointMap
          question={question}
          answered={answered}
          onComplete={onAnswer}
          onFeedback={onFeedback}
        />
      )}

      {!answered && wrongAnswers.length === 1 && (
        <p className="try-again-message" role="status">Try once more. The correct answer is still hidden.</p>
      )}

      <label className="question-flag">
        <input
          type="checkbox"
          checked={flagged}
          onChange={(event) => onFlagChange(event.target.checked)}
        />
        <Flag size={17} />
        <span>Flag this question for review</span>
      </label>
    </section>
  )
}

function QuestionReview({ question }: { question: Question }) {
  return (
    <div className="question-review" aria-label="Previous answer review">
      <strong>Correct answer</strong>
      {question.kind === 'matching' ? (
        <ul>
          {question.pairs.map((pair) => (
            <li key={`${pair.left}-${pair.right}`}>{pair.left} — {pair.right}</li>
          ))}
        </ul>
      ) : question.kind === 'order' ? (
        <p>{question.answer.join(' → ')}</p>
      ) : (
        <p>{question.answer}</p>
      )}
    </div>
  )
}

function AnswerChoices({
  options,
  answer,
  answered,
  wrongAnswers,
  shakingAnswer,
  onSelect,
}: {
  options: string[]
  answer: string
  answered: boolean
  wrongAnswers: string[]
  shakingAnswer: string | null
  onSelect: (value: string) => void
}) {
  return (
    <div className="answer-grid">
      {options.map((option) => {
        const isCorrect = option === answer
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
            onClick={() => onSelect(option)}
          >
            <span>{option}</span>
            {answered && isCorrect && <Check size={19} />}
            {isWrong && <X size={19} />}
          </button>
        )
      })}
    </div>
  )
}

function ClueLadder({
  question,
  answered,
  wrongAnswers,
  shakingAnswer,
  onSelect,
}: {
  question: ClueQuestion
  answered: boolean
  wrongAnswers: string[]
  shakingAnswer: string | null
  onSelect: (value: string) => void
}) {
  const [revealedClues, setRevealedClues] = useState(1)
  const randomizedClues = useMemo(() => shuffle(question.clues), [question.clues])

  return (
    <div className="clue-ladder">
      <ol>
        {randomizedClues.slice(0, revealedClues).map((clue, index) => (
          <li key={clue}><span>{index + 1}</span>{clue}</li>
        ))}
      </ol>
      {revealedClues < randomizedClues.length && !answered && (
        <button
          className="quiet-button reveal-clue-button"
          type="button"
          onClick={() => setRevealedClues((count) => count + 1)}
        >
          <Lightbulb size={17} /> Reveal another clue
        </button>
      )}
      <AnswerChoices
        options={question.options}
        answer={question.answer}
        answered={answered}
        wrongAnswers={wrongAnswers}
        shakingAnswer={shakingAnswer}
        onSelect={onSelect}
      />
    </div>
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

function mapPoint(lat: number, lon: number) {
  return {
    x: ((lon + 180) / 360) * 900,
    y: ((90 - lat) / 180) * 440,
  }
}

function mapDistanceKm(
  first: { lat: number; lon: number },
  second: { lat: number; lon: number },
) {
  const radians = (degrees: number) => degrees * Math.PI / 180
  const latitudeDelta = radians(second.lat - first.lat)
  const longitudeDelta = radians(second.lon - first.lon)
  const firstLatitude = radians(first.lat)
  const secondLatitude = radians(second.lat)
  const value =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(firstLatitude) * Math.cos(secondLatitude) * Math.sin(longitudeDelta / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value))
}

function PinpointMap({
  question,
  answered,
  onComplete,
  onFeedback,
}: {
  question: PinpointQuestion
  answered: boolean
  onComplete: (correct: boolean) => void
  onFeedback: (kind: FeedbackKind) => void
}) {
  const [attempts, setAttempts] = useState<{ x: number; y: number; distance: number }[]>([])
  const target = mapPoint(question.target.lat, question.target.lon)

  function choosePoint(event: React.MouseEvent<SVGSVGElement>) {
    if (answered || attempts.length >= 2) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - bounds.left) / bounds.width) * 900
    const y = ((event.clientY - bounds.top) / bounds.height) * 440
    const selected = {
      lat: 90 - (y / 440) * 180,
      lon: (x / 900) * 360 - 180,
    }
    const distance = mapDistanceKm(selected, question.target)
    const nextAttempts = [...attempts, { x, y, distance }]
    const correct = distance <= 750
    setAttempts(nextAttempts)
    onFeedback(correct ? 'correct' : 'incorrect')
    if (correct || nextAttempts.length >= 2) onComplete(correct)
  }

  const latestAttempt = attempts.at(-1)

  return (
    <div className="world-map pinpoint-map">
      <svg
        viewBox="0 0 900 440"
        role="button"
        aria-label={`World map. Place ${question.answer}.`}
        className={answered ? 'pinpoint-complete' : ''}
        onClick={choosePoint}
      >
        <path className="continent" d="M70 70 L145 38 250 62 300 118 270 165 218 172 190 220 140 205 110 150 55 125Z" />
        <path className="continent" d="M245 220 L300 245 325 325 292 405 250 360 228 280Z" />
        <path className="continent" d="M390 85 L455 65 500 92 475 125 432 132 400 112Z" />
        <path className="continent" d="M430 145 L505 138 555 205 530 322 480 360 445 292 420 205Z" />
        <path className="continent" d="M505 78 L650 58 785 105 820 180 755 215 675 185 625 230 550 190 500 130Z" />
        <path className="continent" d="M700 285 L790 275 835 330 785 380 710 350Z" />
        {attempts.map((attempt, index) => (
          <g className="pinpoint-attempt" key={`${attempt.x}-${attempt.y}`}>
            <circle cx={attempt.x} cy={attempt.y} r="13" />
            <text x={attempt.x} y={attempt.y + 5}>{index + 1}</text>
          </g>
        ))}
        {answered && (
          <g className="pinpoint-target">
            <circle cx={target.x} cy={target.y} r="15" />
            <path d={`M${target.x - 7} ${target.y} L${target.x - 2} ${target.y + 6} L${target.x + 9} ${target.y - 7}`} />
          </g>
        )}
      </svg>
      {!answered && attempts.length === 0 && <p className="map-answer">Tap anywhere on the map to place your first marker.</p>}
      {!answered && latestAttempt && (
        <p className="try-again-message" role="status">
          About {Math.round(latestAttempt.distance).toLocaleString()} km away. Try once more—the exact location is still hidden.
        </p>
      )}
      {answered && latestAttempt && (
        <p className="map-answer">
          Your final marker was about {Math.round(latestAttempt.distance).toLocaleString()} km from {question.place}.
        </p>
      )}
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
  practice,
  onReplay,
  onHome,
}: {
  score: number
  total: number
  bestStreak: number
  elapsed: number
  timerEnabled: boolean
  category: Category
  practice: PracticeMode
  onReplay: () => void
  onHome: () => void
}) {
  const percent = Math.round((score / total) * 100)
  return (
    <main className="results-shell">
      <section className="results-card">
        <div className="result-medal">{percent >= 80 ? <Trophy /> : <Award />}</div>
        <p className="eyebrow">
          {practice === 'variety'
            ? `${categoryDetails[category].label} complete`
            : `${practiceDetails[practice].label} complete`}
        </p>
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
          <button className="quiet-button" type="button" onClick={onHome}>Build another workout</button>
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
  disabled = false,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  icon: React.ReactNode
  title: string
  description: string
  disabled?: boolean
}) {
  return (
    <label className={`toggle-row ${disabled ? 'disabled' : ''}`}>
      <span className="setting-icon">{icon}</span>
      <span className="setting-copy"><strong>{title}</strong><small>{description}</small></span>
      <span className="switch">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
        />
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
