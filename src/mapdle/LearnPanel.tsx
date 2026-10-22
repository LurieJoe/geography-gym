import { useEffect, useState } from 'react'
import { PUZZLE_FACTS, type PracticeKey } from './puzzleFacts'
import type { MapdlePuzzle } from './puzzles'
import { track } from './analytics'

const PRACTICE: Record<PracticeKey, { href: string; label: string }> = {
  us: { href: '../us-states-and-capitals/', label: 'Practice U.S. states and capitals' },
  world: { href: '../world-countries-and-capitals/', label: 'Practice world countries and capitals' },
  landmarks: { href: '../famous-landmarks/', label: 'Explore famous landmarks' },
  waterways: { href: '../waterways/', label: 'Explore rivers, lakes, and seas' },
}

function formatCoords(lat: number, lon: number): string {
  return `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lon).toFixed(2)}° ${lon >= 0 ? 'E' : 'W'}`
}

function mapUrl(puzzle: MapdlePuzzle): string {
  const zoom = puzzle.subject === 'Landmarks' ? 12 : puzzle.subject === 'Waterways' ? 6 : 5
  return `https://www.openstreetmap.org/?mlat=${puzzle.lat}&mlon=${puzzle.lon}#map=${zoom}/${puzzle.lat}/${puzzle.lon}`
}

function wikiUrl(title: string): string {
  return `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(title)}&go=Go`
}

function useOnline(): boolean {
  const [online, setOnline] = useState(() => typeof navigator === 'undefined' || navigator.onLine !== false)
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])
  return online
}

/** Content of the "Learn more" pop-up, shown after a puzzle is finished. */
export function LearnPanel({ puzzle, day }: { puzzle: MapdlePuzzle; day: number }) {
  const entry = PUZZLE_FACTS[puzzle.id]
  const practiceKey: PracticeKey = entry?.practice ?? (puzzle.subject === 'Landmarks' ? 'landmarks' : puzzle.subject === 'Waterways' ? 'waterways' : 'world')
  const practice = PRACTICE[practiceKey]
  const online = useOnline()
  const base = { puzzle: day, phase: day >= 1 ? 'live' : 'preview' }
  return (
    <>
      <h2>{puzzle.answer}</h2>
      <p className="mapdle-learn-sub">{puzzle.subject}</p>
      {entry && <p className="mapdle-fact"><strong>Did you know?</strong> {entry.fact}</p>}
      <div className="mapdle-learn-where">
        <strong>Approximate location</strong>
        <span>{formatCoords(puzzle.lat, puzzle.lon)}</span>
      </div>
      {online ? (
        <>
          <div className="mapdle-learn-links">
            <a href={mapUrl(puzzle)} target="_blank" rel="noreferrer" onClick={() => track('learn_map_clicked', base)}>See it on a map</a>
            <a href={wikiUrl(entry?.wiki ?? puzzle.answer)} target="_blank" rel="noreferrer" onClick={() => track('learn_wiki_clicked', base)}>Read more on Wikipedia</a>
          </div>
          <p className="mapdle-note">
            Wikipedia and OpenStreetMap are independent websites. Geography Gym is not affiliated with them and has not verified their pages.
          </p>
        </>
      ) : (
        <p className="mapdle-note">You are offline. The map and Wikipedia links need an internet connection.</p>
      )}
      <a className="mapdle-learn-cta" href={practice.href} onClick={() => track('learn_practice_clicked', { ...base, practice: practiceKey })}>{practice.label}</a>
    </>
  )
}
