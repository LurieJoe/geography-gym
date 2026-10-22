import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { geoDistance, geoGraticule10, geoOrthographic, geoPath, type GeoPermissibleObjects } from 'd3-geo'
import { ChevronLeft, ChevronRight, Minus, Plus, RotateCcw } from 'lucide-react'
import { feature } from 'topojson-client'
import type { GeometryCollection, Topology } from 'topojson-specification'
import landTopology from 'world-atlas/land-110m.json'

export type GlobeCoordinate = {
  lat: number
  lon: number
}

export type GlobePoint = GlobeCoordinate & {
  id: string
  label: string
  state?: 'default' | 'correct' | 'wrong'
  shaking?: boolean
}

type Rotation = {
  lat: number
  lon: number
}

type DragState = {
  pointerId: number
  x: number
  y: number
  rotation: Rotation
  moved: boolean
}

const GLOBE_SIZE = 520
const DEFAULT_SCALE = 238
const ASSISTED_SCALE = 292
const ROTATION_STEP = 18
const MIN_SCALE = 180
const MAX_SCALE = 1600
const ZOOM_STEP = 1.35
// Borders fade in between these globe sizes. The detailed country lines load only when zoomed in a lot.
const COUNTRY_BORDER_START = 330
const COUNTRY_BORDER_FULL = 470
const STATE_BORDER_START = 480
const STATE_BORDER_FULL = 640
const DETAIL_BORDER_SCALE = 620
function clampScale(value: number) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, value))
}
const topology = landTopology as unknown as Topology<{ land: GeometryCollection }>
const land = feature(topology, topology.objects.land) as GeoPermissibleObjects
const graticule = geoGraticule10()
const sphere = { type: 'Sphere' } as const

function clampLatitude(latitude: number) {
  return Math.min(80, Math.max(-80, latitude))
}

function normalizeLongitude(longitude: number) {
  return ((longitude + 540) % 360) - 180
}

function initialRotation(focus?: GlobeCoordinate): Rotation {
  if (!focus) return { lat: 10, lon: 10 }
  return {
    lon: normalizeLongitude(focus.lon + 18),
    lat: clampLatitude(focus.lat - (focus.lat >= 0 ? 9 : -9)),
  }
}

function focusVisible(element: Element) {
  try {
    return element.matches(':focus-visible')
  } catch {
    return false
  }
}

export function InteractiveGlobe({
  ariaLabel,
  points = [],
  answered = false,
  target,
  attempts = [],
  focusTarget,
  onPointSelect,
  onPlace,
  zoom,
  onZoomChange,
  borders = false,
}: {
  ariaLabel: string
  points?: GlobePoint[]
  answered?: boolean
  target?: GlobeCoordinate
  attempts?: Array<GlobeCoordinate & { index: number; band?: string }>
  focusTarget?: GlobeCoordinate
  onPointSelect?: (id: string) => void
  onPlace?: (coordinate: GlobeCoordinate) => void
  /** Optional starting zoom (the globe radius), so a parent can keep the zoom when the globe is recreated. */
  zoom?: number
  /** Called when the zoom changes. Undefined means the default zoom. */
  onZoomChange?: (scale: number | undefined) => void
  /** Draw country borders and U.S. state lines as the globe is zoomed in, and always once `answered` is true. */
  borders?: boolean
}) {
  const [rotation, setRotation] = useState<Rotation>(() => initialRotation(focusTarget))
  const baseScale = focusTarget ? ASSISTED_SCALE : DEFAULT_SCALE
  const [scale, setScaleState] = useState(() => clampScale(zoom ?? baseScale))
  const svgRef = useRef<SVGSVGElement | null>(null)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const pinch = useRef<{ distance: number; scale: number } | null>(null)
  const scaleRef = useRef(scale)
  scaleRef.current = scale
  function setScale(next: number) {
    const clamped = clampScale(next)
    setScaleState(clamped)
    onZoomChange?.(clamped === baseScale ? undefined : clamped)
  }
  const setScaleRef = useRef(setScale)
  setScaleRef.current = setScale
  useEffect(() => {
    const element = svgRef.current
    if (!element) return
    const onWheel = (event: WheelEvent) => {
      // Plain scrolling still scrolls the page. A trackpad pinch (or Ctrl + scroll) zooms the globe instead of the page.
      if (!event.ctrlKey) return
      event.preventDefault()
      setScaleRef.current(scaleRef.current * Math.min(1.25, Math.max(0.8, Math.exp(-event.deltaY * 0.005))))
    }
    element.addEventListener('wheel', onWheel, { passive: false })
    return () => element.removeEventListener('wheel', onWheel)
  }, [])
  const [keyboardMode, setKeyboardMode] = useState(false)
  const [dragging, setDragging] = useState(false)
  const drag = useRef<DragState | null>(null)

  const [borderData, setBorderData] = useState<{ countries?: GeoPermissibleObjects; detail?: GeoPermissibleObjects; states?: GeoPermissibleObjects }>({})
  const wantCountries = borders && (answered || scale >= COUNTRY_BORDER_START)
  const wantStates = borders && (answered || scale >= STATE_BORDER_START)
  const wantDetail = borders && scale >= DETAIL_BORDER_SCALE
  useEffect(() => {
    if (!wantCountries || borderData.countries) return
    let live = true
    import('./globeBorders').then((m) => m.loadCountryBorders(false)).then((countries) => {
      if (live) setBorderData((current) => ({ ...current, countries }))
    }).catch(() => { /* borders are optional */ })
    return () => { live = false }
  }, [wantCountries, borderData.countries])
  useEffect(() => {
    if (!wantStates || borderData.states) return
    let live = true
    import('./globeBorders').then((m) => m.loadStateBorders()).then((states) => {
      if (live) setBorderData((current) => ({ ...current, states }))
    }).catch(() => { /* borders are optional */ })
    return () => { live = false }
  }, [wantStates, borderData.states])
  useEffect(() => {
    if (!wantDetail || borderData.detail) return
    let live = true
    import('./globeBorders').then((m) => m.loadCountryBorders(true)).then((detail) => {
      if (live) setBorderData((current) => ({ ...current, detail }))
    }).catch(() => { /* borders are optional */ })
    return () => { live = false }
  }, [wantDetail, borderData.detail])

  const projection = useMemo(
    () => geoOrthographic()
      .translate([GLOBE_SIZE / 2, GLOBE_SIZE / 2])
      .scale(scale)
      .clipAngle(90)
      .precision(0.4)
      .rotate([-rotation.lon, -rotation.lat]),
    [rotation, scale],
  )
  const path = useMemo(() => geoPath(projection), [projection])
  const ramp = (from: number, to: number) => (answered ? 1 : Math.min(1, Math.max(0, (scale - from) / (to - from))))
  const countryOpacity = wantCountries ? ramp(COUNTRY_BORDER_START, COUNTRY_BORDER_FULL) : 0
  const stateOpacity = wantStates ? ramp(STATE_BORDER_START, STATE_BORDER_FULL) : 0
  // While dragging, keep to the lighter country lines so turning the globe stays smooth.
  const countryLines = wantDetail && !dragging && borderData.detail ? borderData.detail : borderData.countries
  const center: [number, number] = [rotation.lon, rotation.lat]
  const projectedPoints = points.map((point) => ({
    ...point,
    projected: projection([point.lon, point.lat]),
    visible: geoDistance(center, [point.lon, point.lat]) <= Math.PI / 2,
  }))
  const projectedAttempts = attempts.map((attempt) => ({
    ...attempt,
    projected: projection([attempt.lon, attempt.lat]),
    visible: geoDistance(center, [attempt.lon, attempt.lat]) <= Math.PI / 2,
  }))
  const projectedTarget = target
    ? {
        projected: projection([target.lon, target.lat]),
        visible: geoDistance(center, [target.lon, target.lat]) <= Math.PI / 2,
      }
    : null

  function rotate(deltaLon: number, deltaLat = 0) {
    setRotation((current) => ({
      lon: normalizeLongitude(current.lon + deltaLon),
      lat: clampLatitude(current.lat + deltaLat),
    }))
  }

  function zoomBy(factor: number) {
    setScale(scaleRef.current * factor)
  }

  function reset() {
    setRotation(initialRotation(focusTarget))
    setScale(focusTarget ? ASSISTED_SCALE : DEFAULT_SCALE)
  }

  function placeAtCenter() {
    if (!answered && onPlace) onPlace({ lon: rotation.lon, lat: rotation.lat })
  }

  function handleKeyboard(event: KeyboardEvent<SVGSVGElement>) {
    setKeyboardMode(true)
    const movement: Partial<Record<string, [number, number]>> = {
      ArrowLeft: [-ROTATION_STEP, 0],
      ArrowRight: [ROTATION_STEP, 0],
      ArrowUp: [0, ROTATION_STEP],
      ArrowDown: [0, -ROTATION_STEP],
    }
    const delta = movement[event.key]
    if (delta) {
      event.preventDefault()
      rotate(delta[0], delta[1])
      return
    }
    if (event.key === '+' || event.key === '=') {
      event.preventDefault()
      zoomBy(ZOOM_STEP)
      return
    }
    if (event.key === '-' || event.key === '_') {
      event.preventDefault()
      zoomBy(1 / ZOOM_STEP)
      return
    }
    if (event.key === 'Home') {
      event.preventDefault()
      reset()
      return
    }
    if (onPlace && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault()
      placeAtCenter()
    }
  }

  function handlePointerDown(event: PointerEvent<SVGSVGElement>) {
    if (answered) return
    setKeyboardMode(false)
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      pinch.current = { distance: Math.hypot(a.x - b.x, a.y - b.y) || 1, scale: scaleRef.current }
      drag.current = null
      setDragging(false)
      try { event.currentTarget.setPointerCapture(event.pointerId) } catch { /* the pinch still works without capture */ }
      return
    }
    drag.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      rotation,
      moved: false,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    if (pointers.current.has(event.pointerId)) pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    if (pinch.current && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()]
      setScale(pinch.current.scale * (Math.hypot(a.x - b.x, a.y - b.y) / pinch.current.distance))
      return
    }
    const currentDrag = drag.current
    if (!currentDrag || currentDrag.pointerId !== event.pointerId) return
    const deltaX = event.clientX - currentDrag.x
    const deltaY = event.clientY - currentDrag.y
    if (Math.abs(deltaX) + Math.abs(deltaY) > 5) {
      currentDrag.moved = true
      setDragging(true)
    }
    setRotation({
      lon: normalizeLongitude(currentDrag.rotation.lon - deltaX * 0.35),
      lat: clampLatitude(currentDrag.rotation.lat + deltaY * 0.28),
    })
  }

  function handlePointerUp(event: PointerEvent<SVGSVGElement>) {
    pointers.current.delete(event.pointerId)
    if (pinch.current) {
      if (pointers.current.size < 2) pinch.current = null
      return
    }
    const currentDrag = drag.current
    if (!currentDrag || currentDrag.pointerId !== event.pointerId) return
    event.currentTarget.releasePointerCapture(event.pointerId)
    drag.current = null
    setDragging(false)
    if (currentDrag.moved || !onPlace || answered) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - bounds.left) / bounds.width) * GLOBE_SIZE
    const y = ((event.clientY - bounds.top) / bounds.height) * GLOBE_SIZE
    const radius = Math.hypot(x - GLOBE_SIZE / 2, y - GLOBE_SIZE / 2)
    if (radius > scale) return
    const coordinate = projection.invert?.([x, y])
    if (coordinate) onPlace({ lon: coordinate[0], lat: coordinate[1] })
  }

  const visiblePointCount = projectedPoints.filter((point) => point.visible).length

  return (
    <div
      className={`interactive-globe ${dragging ? 'is-dragging' : ''}`}
      onFocusCapture={(event) => {
        if (focusVisible(event.target)) setKeyboardMode(true)
      }}
      onPointerDownCapture={() => setKeyboardMode(false)}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${GLOBE_SIZE} ${GLOBE_SIZE}`}
        role="application"
        tabIndex={answered ? -1 : 0}
        aria-label={ariaLabel}
        onKeyDown={handleKeyboard}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          pointers.current.clear()
          pinch.current = null
          drag.current = null
          setDragging(false)
        }}
      >
        <path className="globe-ocean" d={path(sphere) ?? undefined} />
        <path className="globe-graticule" d={path(graticule) ?? undefined} />
        <path className="globe-land" d={path(land) ?? undefined} />
        {countryLines && countryOpacity > 0 && (
          <path className="globe-borders" style={{ opacity: countryOpacity }} d={path(countryLines) ?? undefined} />
        )}
        {borderData.states && stateOpacity > 0 && (
          <path className="globe-borders globe-borders-states" style={{ opacity: stateOpacity }} d={path(borderData.states) ?? undefined} />
        )}
        {projectedPoints.map((point, index) => {
          if (!point.visible || !point.projected) return null
          return (
            <g
              className={`globe-point globe-point-${point.state ?? 'default'} ${point.shaking ? 'shake' : ''}`}
              key={point.id}
              transform={`translate(${point.projected[0]} ${point.projected[1]})`}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => !answered && onPointSelect?.(point.id)}
              onKeyDown={(event) => {
                if (!answered && (event.key === 'Enter' || event.key === ' ')) {
                  event.preventDefault()
                  onPointSelect?.(point.id)
                }
              }}
              role="button"
              tabIndex={answered ? -1 : 0}
              aria-label={`Location ${index + 1}`}
            >
              <circle r="17" />
              <text y="5">{index + 1}</text>
            </g>
          )
        })}
        {projectedAttempts.map((attempt) => {
          if (!attempt.visible || !attempt.projected) return null
          return (
            <g
              className={`globe-attempt${attempt.band ? ` globe-attempt-${attempt.band}` : ''}`}
              key={`${attempt.index}-${attempt.lat}-${attempt.lon}`}
              transform={`translate(${attempt.projected[0]} ${attempt.projected[1]})`}
            >
              <circle r="13" />
              <text y="5">{attempt.index}</text>
            </g>
          )
        })}
        {answered && projectedTarget?.visible && projectedTarget.projected && (
          <g
            className="globe-target"
            transform={`translate(${projectedTarget.projected[0]} ${projectedTarget.projected[1]})`}
          >
            <circle r="15" />
            <path d="M-7 0 L-2 6 L9 -7" />
          </g>
        )}
        {keyboardMode && onPlace && !answered && (
          <g className="globe-keyboard-cursor" aria-hidden="true" transform={`translate(${GLOBE_SIZE / 2} ${GLOBE_SIZE / 2})`}>
            <circle r="17" />
            <path d="M-24 0 H24 M0 -24 V24" />
          </g>
        )}
      </svg>

      <div className="globe-zoom" role="group" aria-label="Globe zoom controls">
        <button type="button" onClick={() => zoomBy(ZOOM_STEP)} disabled={scale >= MAX_SCALE} aria-label="Zoom in">
          <Plus aria-hidden="true" />
        </button>
        <button type="button" onClick={() => zoomBy(1 / ZOOM_STEP)} disabled={scale <= MIN_SCALE} aria-label="Zoom out">
          <Minus aria-hidden="true" />
        </button>
      </div>

      <div className="globe-controls" aria-label="Globe rotation controls">
        <button type="button" onClick={() => rotate(-ROTATION_STEP)} disabled={answered} aria-label="Rotate globe left">
          <ChevronLeft aria-hidden="true" />
          <span>Rotate</span>
        </button>
        <button type="button" onClick={reset} disabled={answered} aria-label="Reset globe view">
          <RotateCcw aria-hidden="true" />
          <span>Reset</span>
        </button>
        <button type="button" onClick={() => rotate(ROTATION_STEP)} disabled={answered} aria-label="Rotate globe right">
          <span>Rotate</span>
          <ChevronRight aria-hidden="true" />
        </button>
      </div>

      {!answered && (
        <p className="globe-guidance">
          Drag or swipe to rotate the globe. Pinch or use the + and − buttons to zoom. Use the other buttons for smaller turns.
          {points.length > 0 && ` ${visiblePointCount} of ${points.length} numbered points are currently visible.`}
        </p>
      )}

      {keyboardMode && points.length > 0 && !answered && (
        <div className="globe-keyboard-locations" aria-label="Keyboard location choices">
          <span>Keyboard choices:</span>
          {points.map((point, index) => (
            <button
              type="button"
              key={point.id}
              onClick={() => onPointSelect?.(point.id)}
              disabled={point.state === 'wrong'}
              className={`globe-keyboard-${point.state ?? 'default'}`}
            >
              {index + 1}
              <span className="sr-only">Location {index + 1}</span>
            </button>
          ))}
        </div>
      )}

      {keyboardMode && onPlace && !answered && (
        <p className="globe-keyboard-help">
          Arrow keys rotate the globe beneath the center marker. Press Enter or Space to place it. Plus and minus zoom. Home resets the view.
        </p>
      )}
    </div>
  )
}
