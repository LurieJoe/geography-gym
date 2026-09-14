export type Category = 'us' | 'world' | 'landmarks' | 'mixed'

type BaseQuestion = {
  id: string
  category: Exclude<Category, 'mixed'>
  label: string
  prompt: string
  hint?: string
  explanation: string
}

export type ChoiceQuestion = BaseQuestion & {
  kind: 'choice'
  options: string[]
  answer: string
}

export type LocateUsQuestion = BaseQuestion & {
  kind: 'locate-us'
  answer: string
}

export type LocateWorldQuestion = BaseQuestion & {
  kind: 'locate-world'
  answer: string
  points: { name: string; x: number; y: number }[]
}

export type MatchingQuestion = BaseQuestion & {
  kind: 'matching'
  pairs: { left: string; right: string }[]
}

export type OrderQuestion = BaseQuestion & {
  kind: 'order'
  items: string[]
  answer: string[]
  startLabel: string
  endLabel: string
}

export type Question =
  | ChoiceQuestion
  | LocateUsQuestion
  | LocateWorldQuestion
  | MatchingQuestion
  | OrderQuestion

export const categoryDetails: Record<Category, { label: string }> = {
  us: { label: 'U.S. Geography' },
  world: { label: 'World Geography' },
  landmarks: { label: 'Landmarks' },
  mixed: { label: 'Mixed Workout' },
}

const states = [
  ['Alabama', 'AL', 'Montgomery'], ['Alaska', 'AK', 'Juneau'],
  ['Arizona', 'AZ', 'Phoenix'], ['Arkansas', 'AR', 'Little Rock'],
  ['California', 'CA', 'Sacramento'], ['Colorado', 'CO', 'Denver'],
  ['Connecticut', 'CT', 'Hartford'], ['Delaware', 'DE', 'Dover'],
  ['Florida', 'FL', 'Tallahassee'], ['Georgia', 'GA', 'Atlanta'],
  ['Hawaii', 'HI', 'Honolulu'], ['Idaho', 'ID', 'Boise'],
  ['Illinois', 'IL', 'Springfield'], ['Indiana', 'IN', 'Indianapolis'],
  ['Iowa', 'IA', 'Des Moines'], ['Kansas', 'KS', 'Topeka'],
  ['Kentucky', 'KY', 'Frankfort'], ['Louisiana', 'LA', 'Baton Rouge'],
  ['Maine', 'ME', 'Augusta'], ['Maryland', 'MD', 'Annapolis'],
  ['Massachusetts', 'MA', 'Boston'], ['Michigan', 'MI', 'Lansing'],
  ['Minnesota', 'MN', 'Saint Paul'], ['Mississippi', 'MS', 'Jackson'],
  ['Missouri', 'MO', 'Jefferson City'], ['Montana', 'MT', 'Helena'],
  ['Nebraska', 'NE', 'Lincoln'], ['Nevada', 'NV', 'Carson City'],
  ['New Hampshire', 'NH', 'Concord'], ['New Jersey', 'NJ', 'Trenton'],
  ['New Mexico', 'NM', 'Santa Fe'], ['New York', 'NY', 'Albany'],
  ['North Carolina', 'NC', 'Raleigh'], ['North Dakota', 'ND', 'Bismarck'],
  ['Ohio', 'OH', 'Columbus'], ['Oklahoma', 'OK', 'Oklahoma City'],
  ['Oregon', 'OR', 'Salem'], ['Pennsylvania', 'PA', 'Harrisburg'],
  ['Rhode Island', 'RI', 'Providence'], ['South Carolina', 'SC', 'Columbia'],
  ['South Dakota', 'SD', 'Pierre'], ['Tennessee', 'TN', 'Nashville'],
  ['Texas', 'TX', 'Austin'], ['Utah', 'UT', 'Salt Lake City'],
  ['Vermont', 'VT', 'Montpelier'], ['Virginia', 'VA', 'Richmond'],
  ['Washington', 'WA', 'Olympia'], ['West Virginia', 'WV', 'Charleston'],
  ['Wisconsin', 'WI', 'Madison'], ['Wyoming', 'WY', 'Cheyenne'],
] as const

const countries = [
  ['Argentina', 'Buenos Aires', 'South America'], ['Australia', 'Canberra', 'Oceania'],
  ['Austria', 'Vienna', 'Europe'], ['Belgium', 'Brussels', 'Europe'],
  ['Brazil', 'Brasília', 'South America'], ['Canada', 'Ottawa', 'North America'],
  ['Chile', 'Santiago', 'South America'], ['China', 'Beijing', 'Asia'],
  ['Colombia', 'Bogotá', 'South America'], ['Czechia', 'Prague', 'Europe'],
  ['Denmark', 'Copenhagen', 'Europe'], ['Ecuador', 'Quito', 'South America'],
  ['Egypt', 'Cairo', 'Africa'], ['Ethiopia', 'Addis Ababa', 'Africa'],
  ['Finland', 'Helsinki', 'Europe'], ['France', 'Paris', 'Europe'],
  ['Germany', 'Berlin', 'Europe'], ['Ghana', 'Accra', 'Africa'],
  ['Greece', 'Athens', 'Europe'], ['Hungary', 'Budapest', 'Europe'],
  ['Iceland', 'Reykjavík', 'Europe'], ['India', 'New Delhi', 'Asia'],
  ['Indonesia', 'Jakarta', 'Asia'], ['Ireland', 'Dublin', 'Europe'],
  ['Italy', 'Rome', 'Europe'], ['Japan', 'Tokyo', 'Asia'],
  ['Kenya', 'Nairobi', 'Africa'], ['Mexico', 'Mexico City', 'North America'],
  ['Morocco', 'Rabat', 'Africa'], ['Netherlands', 'Amsterdam', 'Europe'],
  ['New Zealand', 'Wellington', 'Oceania'], ['Nigeria', 'Abuja', 'Africa'],
  ['Norway', 'Oslo', 'Europe'], ['Pakistan', 'Islamabad', 'Asia'],
  ['Peru', 'Lima', 'South America'], ['Philippines', 'Manila', 'Asia'],
  ['Poland', 'Warsaw', 'Europe'], ['Portugal', 'Lisbon', 'Europe'],
  ['Romania', 'Bucharest', 'Europe'], ['Saudi Arabia', 'Riyadh', 'Asia'],
  ['Singapore', 'Singapore', 'Asia'], ['South Korea', 'Seoul', 'Asia'],
  ['Spain', 'Madrid', 'Europe'], ['Sweden', 'Stockholm', 'Europe'],
  ['Switzerland', 'Bern', 'Europe'], ['Thailand', 'Bangkok', 'Asia'],
  ['Türkiye', 'Ankara', 'Asia'], ['Ukraine', 'Kyiv', 'Europe'],
  ['United Kingdom', 'London', 'Europe'], ['Vietnam', 'Hanoi', 'Asia'],
] as const

const worldLocateGroups = [
  [
    { name: 'Canada', x: 175, y: 90 }, { name: 'Brazil', x: 285, y: 295 },
    { name: 'Egypt', x: 500, y: 190 }, { name: 'Japan', x: 770, y: 155 },
  ],
  [
    { name: 'Mexico', x: 175, y: 180 }, { name: 'Argentina', x: 285, y: 365 },
    { name: 'France', x: 445, y: 120 }, { name: 'India', x: 650, y: 200 },
  ],
  [
    { name: 'United Kingdom', x: 430, y: 100 }, { name: 'Nigeria', x: 475, y: 245 },
    { name: 'China', x: 685, y: 145 }, { name: 'Australia', x: 765, y: 325 },
  ],
  [
    { name: 'Colombia', x: 245, y: 230 }, { name: 'Spain', x: 425, y: 145 },
    { name: 'Kenya', x: 535, y: 270 }, { name: 'Indonesia', x: 715, y: 270 },
  ],
  [
    { name: 'Chile', x: 255, y: 335 }, { name: 'Morocco', x: 425, y: 185 },
    { name: 'Saudi Arabia', x: 565, y: 205 }, { name: 'New Zealand', x: 835, y: 360 },
  ],
] as const

type LandmarkRecord = {
  name: string
  place: string
  region: string
  lat: number
  lon: number
}

const landmarks: LandmarkRecord[] = [
  { name: 'Statue of Liberty', place: 'New York City', region: 'United States', lat: 40.69, lon: -74.04 },
  { name: 'Golden Gate Bridge', place: 'San Francisco', region: 'United States', lat: 37.82, lon: -122.48 },
  { name: 'Gateway Arch', place: 'St. Louis', region: 'United States', lat: 38.62, lon: -90.19 },
  { name: 'Space Needle', place: 'Seattle', region: 'United States', lat: 47.62, lon: -122.35 },
  { name: 'Mount Rushmore', place: 'South Dakota', region: 'United States', lat: 43.88, lon: -103.46 },
  { name: 'Grand Canyon', place: 'Arizona', region: 'United States', lat: 36.11, lon: -112.11 },
  { name: 'Liberty Bell', place: 'Philadelphia', region: 'United States', lat: 39.95, lon: -75.15 },
  { name: 'French Quarter', place: 'New Orleans', region: 'United States', lat: 29.96, lon: -90.06 },
  { name: 'Alamo', place: 'San Antonio', region: 'United States', lat: 29.43, lon: -98.49 },
  { name: 'Hollywood Sign', place: 'Los Angeles', region: 'United States', lat: 34.13, lon: -118.32 },
  { name: 'Eiffel Tower', place: 'Paris', region: 'France', lat: 48.86, lon: 2.29 },
  { name: 'Colosseum', place: 'Rome', region: 'Italy', lat: 41.89, lon: 12.49 },
  { name: 'Big Ben', place: 'London', region: 'United Kingdom', lat: 51.50, lon: -0.12 },
  { name: 'Sagrada Família', place: 'Barcelona', region: 'Spain', lat: 41.40, lon: 2.17 },
  { name: 'Acropolis', place: 'Athens', region: 'Greece', lat: 37.97, lon: 23.73 },
  { name: 'Brandenburg Gate', place: 'Berlin', region: 'Germany', lat: 52.52, lon: 13.38 },
  { name: 'Leaning Tower of Pisa', place: 'Pisa', region: 'Italy', lat: 43.72, lon: 10.40 },
  { name: 'Stonehenge', place: 'Wiltshire', region: 'United Kingdom', lat: 51.18, lon: -1.83 },
  { name: 'Neuschwanstein Castle', place: 'Bavaria', region: 'Germany', lat: 47.56, lon: 10.75 },
  { name: 'Charles Bridge', place: 'Prague', region: 'Czechia', lat: 50.09, lon: 14.41 },
  { name: 'Great Pyramid of Giza', place: 'Giza', region: 'Egypt', lat: 29.98, lon: 31.13 },
  { name: 'Petra', place: 'Ma’an', region: 'Jordan', lat: 30.33, lon: 35.44 },
  { name: 'Burj Khalifa', place: 'Dubai', region: 'United Arab Emirates', lat: 25.20, lon: 55.27 },
  { name: 'Taj Mahal', place: 'Agra', region: 'India', lat: 27.18, lon: 78.04 },
  { name: 'Great Wall of China', place: 'Northern China', region: 'China', lat: 40.43, lon: 116.57 },
  { name: 'Forbidden City', place: 'Beijing', region: 'China', lat: 39.92, lon: 116.39 },
  { name: 'Angkor Wat', place: 'Siem Reap', region: 'Cambodia', lat: 13.41, lon: 103.87 },
  { name: 'Mount Fuji', place: 'Honshu', region: 'Japan', lat: 35.36, lon: 138.73 },
  { name: 'Marina Bay Sands', place: 'Singapore', region: 'Singapore', lat: 1.28, lon: 103.86 },
  { name: 'Temple of Heaven', place: 'Beijing', region: 'China', lat: 39.88, lon: 116.41 },
  { name: 'Sydney Opera House', place: 'Sydney', region: 'Australia', lat: -33.86, lon: 151.22 },
  { name: 'Uluru', place: 'Northern Territory', region: 'Australia', lat: -25.34, lon: 131.04 },
  { name: 'Sky Tower', place: 'Auckland', region: 'New Zealand', lat: -36.85, lon: 174.76 },
  { name: 'Christ the Redeemer', place: 'Rio de Janeiro', region: 'Brazil', lat: -22.95, lon: -43.21 },
  { name: 'Machu Picchu', place: 'Cusco Region', region: 'Peru', lat: -13.16, lon: -72.55 },
  { name: 'Chichén Itzá', place: 'Yucatán', region: 'Mexico', lat: 20.68, lon: -88.57 },
  { name: 'Moai of Easter Island', place: 'Easter Island', region: 'Chile', lat: -27.12, lon: -109.35 },
  { name: 'Teotihuacan', place: 'State of Mexico', region: 'Mexico', lat: 19.69, lon: -98.84 },
  { name: 'CN Tower', place: 'Toronto', region: 'Canada', lat: 43.64, lon: -79.39 },
  { name: 'Panama Canal', place: 'Panama', region: 'Panama', lat: 9.08, lon: -79.68 },
  { name: 'Table Mountain', place: 'Cape Town', region: 'South Africa', lat: -33.96, lon: 18.41 },
  { name: 'Serengeti National Park', place: 'Northern Tanzania', region: 'Tanzania', lat: -2.33, lon: 34.83 },
  { name: 'Victoria Falls', place: 'Zambia–Zimbabwe border', region: 'Africa', lat: -17.92, lon: 25.86 },
  { name: 'Hassan II Mosque', place: 'Casablanca', region: 'Morocco', lat: 33.61, lon: -7.63 },
  { name: 'Kilimanjaro', place: 'Kilimanjaro Region', region: 'Tanzania', lat: -3.07, lon: 37.36 },
  { name: 'Notre-Dame Basilica', place: 'Montréal', region: 'Canada', lat: 45.50, lon: -73.56 },
  { name: 'Blue Mosque', place: 'Istanbul', region: 'Türkiye', lat: 41.01, lon: 28.98 },
  { name: 'Hallgrímskirkja', place: 'Reykjavík', region: 'Iceland', lat: 64.14, lon: -21.93 },
  { name: 'Palace of Westminster', place: 'London', region: 'United Kingdom', lat: 51.50, lon: -0.12 },
  { name: 'Atomium', place: 'Brussels', region: 'Belgium', lat: 50.89, lon: 4.34 },
]

function uniqueOptions(answer: string, pool: readonly string[], seed: number) {
  const others = [...new Set(pool)].filter((item) => item !== answer)
  const options = [answer]
  let cursor = (seed * 7) % others.length
  while (options.length < 4) {
    const candidate = others[cursor % others.length]
    if (!options.includes(candidate)) options.push(candidate)
    cursor += 1
  }
  const offset = seed % options.length
  return [...options.slice(offset), ...options.slice(0, offset)]
}

const stateNames = states.map(([name]) => name)
const stateCapitals = states.map(([, , capital]) => capital)

const usQuestions: Question[] = states.flatMap(([name, abbreviation, capital], index) => [
  {
    id: `us-abbreviation-${abbreviation}`,
    category: 'us',
    kind: 'choice',
    label: 'State shorthand',
    prompt: `Which state uses the abbreviation ${abbreviation}?`,
    options: uniqueOptions(name, stateNames, index),
    answer: name,
    explanation: `${abbreviation} is the postal abbreviation for ${name}.`,
  },
  {
    id: `us-capital-${abbreviation}`,
    category: 'us',
    kind: 'choice',
    label: 'State capitals',
    prompt: `What is the capital of ${name}?`,
    options: uniqueOptions(capital, stateCapitals, index + 11),
    answer: capital,
    explanation: `${capital} is the capital of ${name}.`,
  },
  {
    id: `us-locate-${abbreviation}`,
    category: 'us',
    kind: 'locate-us',
    label: 'Locate it',
    prompt: `Tap ${name} on the map.`,
    answer: abbreviation,
    explanation: `${name} is shown by the ${abbreviation} tile on this simplified map.`,
  },
])

const capitals = countries.map(([, capital]) => capital)
const continents = ['Africa', 'Asia', 'Europe', 'North America', 'Oceania', 'South America']

const worldKnowledgeQuestions: Question[] = countries.flatMap(([country, capital, continent], index) => [
  {
    id: `world-capital-${index}`,
    category: 'world',
    kind: 'choice',
    label: 'Capital call',
    prompt: `What is the capital of ${country}?`,
    options: uniqueOptions(capital, capitals, index),
    answer: capital,
    explanation: `${capital} is the capital of ${country}.`,
  },
  {
    id: `world-continent-${index}`,
    category: 'world',
    kind: 'choice',
    label: 'World regions',
    prompt: `On which continent is ${country}?`,
    options: uniqueOptions(continent, continents, index + 3),
    answer: continent,
    explanation: `${country} is in ${continent}.`,
  },
])

const worldLocateQuestions: Question[] = worldLocateGroups.flatMap((points, groupIndex) =>
  points.map((point, pointIndex) => ({
    id: `world-locate-${groupIndex}-${pointIndex}`,
    category: 'world' as const,
    kind: 'locate-world' as const,
    label: 'Find the country',
    prompt: `Which numbered point marks ${point.name}?`,
    answer: point.name,
    points: [...points],
    explanation: `${point.name} is highlighted on the simplified world map.`,
  })),
)

const worldQuestions = [...worldKnowledgeQuestions, ...worldLocateQuestions]
const landmarkPlaces = landmarks.map((landmark) => landmark.place)
const landmarkRegions = landmarks.map((landmark) => landmark.region)

const landmarkChoiceQuestions: Question[] = landmarks.flatMap((landmark, index) => [
  {
    id: `landmark-place-${index}`,
    category: 'landmarks',
    kind: 'choice',
    label: 'Where is it?',
    prompt: `Where would you find ${landmark.name}?`,
    options: uniqueOptions(landmark.place, landmarkPlaces, index),
    answer: landmark.place,
    explanation: `${landmark.name} is in ${landmark.place}, ${landmark.region}.`,
  },
  {
    id: `landmark-region-${index}`,
    category: 'landmarks',
    kind: 'choice',
    label: 'Country or region',
    prompt: `Which country or region is home to ${landmark.name}?`,
    options: uniqueOptions(landmark.region, landmarkRegions, index + 9),
    answer: landmark.region,
    explanation: `${landmark.name} is located in ${landmark.region}.`,
  },
])

const landmarkMatchingQuestions: MatchingQuestion[] = []
for (let index = 0; index + 3 < landmarks.length; index += 4) {
  const group = landmarks.slice(index, index + 4)
  landmarkMatchingQuestions.push({
    id: `landmark-match-${index / 4}`,
    category: 'landmarks',
    kind: 'matching',
    label: 'Matching pairs',
    prompt: 'Match each landmark to its location.',
    hint: 'Choose one item from each column.',
    pairs: group.map((landmark) => ({ left: landmark.name, right: landmark.place })),
    explanation: 'Each landmark is now connected to its place on your mental map.',
  })
}

const landmarkOrderQuestions: OrderQuestion[] = []
for (let index = 0; index + 3 < landmarks.length; index += 4) {
  const group = landmarks.slice(index, index + 4)
  const northSouth = [...group].sort((a, b) => b.lat - a.lat)
  const westEast = [...group].sort((a, b) => a.lon - b.lon)
  landmarkOrderQuestions.push({
    id: `landmark-north-south-${index / 4}`,
    category: 'landmarks',
    kind: 'order',
    label: 'North to south',
    prompt: 'Put these landmarks in order from north to south.',
    items: group.map((landmark) => landmark.name),
    answer: northSouth.map((landmark) => landmark.name),
    startLabel: 'North',
    endLabel: 'South',
    explanation: `From north to south: ${northSouth.map((landmark) => landmark.name).join(', ')}.`,
  })
  landmarkOrderQuestions.push({
    id: `landmark-west-east-${index / 4}`,
    category: 'landmarks',
    kind: 'order',
    label: 'West to east',
    prompt: 'Put these landmarks in order from west to east.',
    items: group.map((landmark) => landmark.name),
    answer: westEast.map((landmark) => landmark.name),
    startLabel: 'West',
    endLabel: 'East',
    explanation: `From west to east: ${westEast.map((landmark) => landmark.name).join(', ')}.`,
  })
}

const landmarkQuestions: Question[] = [
  ...landmarkChoiceQuestions,
  ...landmarkMatchingQuestions,
  ...landmarkOrderQuestions,
]

const banks = { us: usQuestions, world: worldQuestions, landmarks: landmarkQuestions }

export const questionPoolCounts = {
  us: usQuestions.length,
  world: worldQuestions.length,
  landmarks: landmarkQuestions.length,
  mixed: usQuestions.length + worldQuestions.length + landmarkQuestions.length,
}

function shuffled<T>(items: readonly T[]) {
  return [...items].sort(() => Math.random() - 0.5)
}

export function buildQuestions(category: Category, count: number) {
  if (category !== 'mixed') {
    const source = banks[category]
    const guaranteed = category === 'landmarks'
      ? [
          shuffled(landmarkMatchingQuestions)[0],
          shuffled(landmarkOrderQuestions)[0],
        ]
      : []
    const rest = shuffled(source).filter((question) => !guaranteed.some((item) => item.id === question.id))
    return shuffled([...guaranteed, ...rest.slice(0, Math.max(0, count - guaranteed.length))])
  }

  const guaranteed = [
    shuffled(usQuestions)[0],
    shuffled(worldQuestions)[0],
    shuffled(landmarkMatchingQuestions)[0],
    shuffled(landmarkOrderQuestions)[0],
  ]
  const all = [...usQuestions, ...worldQuestions, ...landmarkQuestions]
  const rest = shuffled(all).filter((question) => !guaranteed.some((item) => item.id === question.id))
  return shuffled([...guaranteed, ...rest.slice(0, Math.max(0, count - guaranteed.length))])
}
