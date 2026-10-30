// Writes src/mapdle/version.ts before every build, so the How to Play pop-up can show which version is running.
// The number comes from the cache version in public/mapdle/sw.js. Do not edit version.ts by hand.
import { readFileSync, writeFileSync } from 'node:fs'
const sw = readFileSync('public/mapdle/sw.js', 'utf8')
const number = (sw.match(/mapdle-v(\d+)/) || [])[1] || '?'
writeFileSync('src/mapdle/version.ts', `// Written by scripts/stamp-version.mjs on every build. Do not edit by hand.\nexport const MAPDLE_VERSION = '${number}'\n`)
