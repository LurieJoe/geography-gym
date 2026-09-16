export type Category = 'us' | 'world' | 'landmarks' | 'waterways'
export type PracticeMode = 'variety' | 'clue-ladder' | 'neighbors' | 'closer' | 'pinpoint'

type BaseQuestion = {
  id: string
  category: Category
  practice?: PracticeMode
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

export type ClueQuestion = BaseQuestion & {
  kind: 'clue'
  clues: string[]
  options: string[]
  answer: string
}

export type PinpointQuestion = BaseQuestion & {
  kind: 'pinpoint'
  answer: string
  target: { lat: number; lon: number }
  place: string
}

export type Question =
  | ChoiceQuestion
  | LocateUsQuestion
  | LocateWorldQuestion
  | MatchingQuestion
  | OrderQuestion
  | ClueQuestion
  | PinpointQuestion

export const categoryDetails: Record<Category, { label: string }> = {
  us: { label: 'U.S. Geography' },
  world: { label: 'World Geography' },
  landmarks: { label: 'Landmarks' },
  waterways: { label: 'Waterways' },
}

export const practiceDetails: Record<PracticeMode, { label: string; description: string }> = {
  variety: {
    label: 'Variety',
    description: 'A rotating mix of the original question styles.',
  },
  'clue-ladder': {
    label: 'Clue Ladder',
    description: 'Identify a place from progressively more specific clues.',
  },
  neighbors: {
    label: 'Neighbor Challenge',
    description: 'Build a mental map by identifying shared land borders.',
  },
  closer: {
    label: 'Which Is Closer?',
    description: 'Compare real distances between landmarks and waterways.',
  },
  pinpoint: {
    label: 'Map Pinpoint',
    description: 'Place a landmark or waterway on the world map and see how close you were.',
  },
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

type WaterwayRecord = {
  name: string
  type: 'Ocean' | 'Sea' | 'River' | 'Strait' | 'Lake' | 'Waterfall' | 'Canal'
  place: string
  lat: number
  lon: number
}

const waterways: WaterwayRecord[] = [
  { name: 'Pacific Ocean', type: 'Ocean', place: 'between Asia, Oceania, and the Americas', lat: 0, lon: -160 },
  { name: 'Atlantic Ocean', type: 'Ocean', place: 'between the Americas and Europe and Africa', lat: 0, lon: -30 },
  { name: 'Indian Ocean', type: 'Ocean', place: 'between Africa, Asia, Australia, and Antarctica', lat: -20, lon: 80 },
  { name: 'Southern Ocean', type: 'Ocean', place: 'around Antarctica', lat: -65, lon: 0 },
  { name: 'Arctic Ocean', type: 'Ocean', place: 'around the North Pole', lat: 80, lon: 0 },
  { name: 'Mediterranean Sea', type: 'Sea', place: 'between southern Europe, northern Africa, and western Asia', lat: 35, lon: 18 },
  { name: 'Caribbean Sea', type: 'Sea', place: 'between Central America, northern South America, and the Antilles', lat: 15, lon: -75 },
  { name: 'Red Sea', type: 'Sea', place: 'between northeastern Africa and the Arabian Peninsula', lat: 20, lon: 38 },
  { name: 'Black Sea', type: 'Sea', place: 'between southeastern Europe and western Asia', lat: 43, lon: 35 },
  { name: 'Baltic Sea', type: 'Sea', place: 'between Scandinavia and mainland northern Europe', lat: 58, lon: 20 },
  { name: 'Arabian Sea', type: 'Sea', place: 'between the Arabian Peninsula and India', lat: 15, lon: 65 },
  { name: 'South China Sea', type: 'Sea', place: 'between Southeast Asia, China, and the Philippines', lat: 15, lon: 115 },
  { name: 'Nile River', type: 'River', place: 'in northeastern Africa, flowing north through Egypt', lat: 30, lon: 31 },
  { name: 'Amazon River', type: 'River', place: 'across northern South America, chiefly Brazil', lat: -3, lon: -60 },
  { name: 'Mississippi River', type: 'River', place: 'in the central United States', lat: 35, lon: -90 },
  { name: 'Yangtze River', type: 'River', place: 'across central China', lat: 30, lon: 112 },
  { name: 'Danube River', type: 'River', place: 'across central and southeastern Europe', lat: 47, lon: 19 },
  { name: 'Ganges River', type: 'River', place: 'across northern India and Bangladesh', lat: 25, lon: 88 },
  { name: 'Mekong River', type: 'River', place: 'across mainland Southeast Asia', lat: 15, lon: 105 },
  { name: 'Congo River', type: 'River', place: 'in central Africa', lat: -3, lon: 18 },
  { name: 'Rhine River', type: 'River', place: 'from the Swiss Alps through western Europe to the North Sea', lat: 50, lon: 7 },
  { name: 'Strait of Gibraltar', type: 'Strait', place: 'between Spain and Morocco', lat: 36, lon: -5.5 },
  { name: 'Bering Strait', type: 'Strait', place: 'between Alaska and eastern Russia', lat: 66, lon: -169 },
  { name: 'Bosporus', type: 'Strait', place: 'through Istanbul between European and Asian Türkiye', lat: 41, lon: 29 },
  { name: 'Strait of Malacca', type: 'Strait', place: 'between the Malay Peninsula and Sumatra', lat: 3, lon: 101 },
  { name: 'Strait of Hormuz', type: 'Strait', place: 'between Iran and the Musandam Peninsula', lat: 26.5, lon: 56.5 },
  { name: 'Strait of Dover', type: 'Strait', place: 'between England and France', lat: 51, lon: 1.5 },
  { name: 'Lake Superior', type: 'Lake', place: 'between the United States and Canada', lat: 47.7, lon: -87.5 },
  { name: 'Lake Victoria', type: 'Lake', place: 'between Tanzania, Uganda, and Kenya', lat: -1, lon: 33 },
  { name: 'Lake Baikal', type: 'Lake', place: 'in southern Siberia, Russia', lat: 53, lon: 108 },
  { name: 'Lake Tanganyika', type: 'Lake', place: 'in East Africa along four national borders', lat: -6.3, lon: 29.5 },
  { name: 'Lake Titicaca', type: 'Lake', place: 'between Peru and Bolivia', lat: -15.8, lon: -69.4 },
  { name: 'Great Bear Lake', type: 'Lake', place: 'in the Northwest Territories of Canada', lat: 66, lon: -121 },
  { name: 'Niagara Falls', type: 'Waterfall', place: 'between New York and Ontario', lat: 43.08, lon: -79.07 },
  { name: 'Victoria Falls', type: 'Waterfall', place: 'between Zambia and Zimbabwe', lat: -17.92, lon: 25.86 },
  { name: 'Angel Falls', type: 'Waterfall', place: 'in southeastern Venezuela', lat: 5.97, lon: -62.54 },
  { name: 'Iguazu Falls', type: 'Waterfall', place: 'between Argentina and Brazil', lat: -25.69, lon: -54.44 },
  { name: 'Panama Canal', type: 'Canal', place: 'across Panama between the Atlantic and Pacific oceans', lat: 9.08, lon: -79.68 },
  { name: 'Suez Canal', type: 'Canal', place: 'in Egypt between the Mediterranean and Red seas', lat: 30.5, lon: 32.3 },
  { name: 'Kiel Canal', type: 'Canal', place: 'across northern Germany between the North and Baltic seas', lat: 54.3, lon: 9.9 },
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
    explanation: `${name} is outlined on the map and labeled ${abbreviation}.`,
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

const waterwayNames = waterways.map((waterway) => waterway.name)
const waterwayTypes = [...new Set(waterways.map((waterway) => waterway.type))]
const waterwayPlaces = waterways.map((waterway) => waterway.place)

const waterwayChoiceQuestions: ChoiceQuestion[] = waterways.flatMap((waterway, index) => [
  {
    id: `waterway-type-${index}`,
    category: 'waterways',
    kind: 'choice',
    label: 'Name that feature',
    prompt: `What type of water feature is ${waterway.name}?`,
    options: uniqueOptions(waterway.type, waterwayTypes, index),
    answer: waterway.type,
    explanation: `${waterway.name} is a ${waterway.type.toLowerCase()}.`,
  },
  {
    id: `waterway-place-${index}`,
    category: 'waterways',
    kind: 'choice',
    label: 'Where is it?',
    prompt: `Where would you find ${waterway.name}?`,
    options: uniqueOptions(waterway.place, waterwayPlaces, index + 17),
    answer: waterway.place,
    explanation: `${waterway.name} is ${waterway.place}.`,
  },
])

const waterwayMatchingQuestions: MatchingQuestion[] = []
const waterwayOrderQuestions: OrderQuestion[] = []
for (let index = 0; index + 3 < waterways.length; index += 4) {
  const group = waterways.slice(index, index + 4)
  const northSouth = [...group].sort((a, b) => b.lat - a.lat)
  const westEast = [...group].sort((a, b) => a.lon - b.lon)
  waterwayMatchingQuestions.push({
    id: `waterway-match-${index / 4}`,
    category: 'waterways',
    kind: 'matching',
    label: 'Matching pairs',
    prompt: 'Match each waterway to its location.',
    hint: 'Choose one item from each column.',
    pairs: group.map((waterway) => ({ left: waterway.name, right: waterway.place })),
    explanation: 'Each waterway is now connected to its place on your mental map.',
  })
  waterwayOrderQuestions.push({
    id: `waterway-north-south-${index / 4}`,
    category: 'waterways',
    kind: 'order',
    label: 'North to south',
    prompt: 'Put these waterways in order from north to south.',
    items: group.map((waterway) => waterway.name),
    answer: northSouth.map((waterway) => waterway.name),
    startLabel: 'North',
    endLabel: 'South',
    explanation: `From north to south: ${northSouth.map((waterway) => waterway.name).join(', ')}.`,
  })
  waterwayOrderQuestions.push({
    id: `waterway-west-east-${index / 4}`,
    category: 'waterways',
    kind: 'order',
    label: 'West to east',
    prompt: 'Put these waterways in order from west to east.',
    items: group.map((waterway) => waterway.name),
    answer: westEast.map((waterway) => waterway.name),
    startLabel: 'West',
    endLabel: 'East',
    explanation: `From west to east: ${westEast.map((waterway) => waterway.name).join(', ')}.`,
  })
}

const waterwayQuestions: Question[] = [
  ...waterwayChoiceQuestions,
  ...waterwayMatchingQuestions,
  ...waterwayOrderQuestions,
]

const stateNeighbors: Record<string, string[]> = {
  AL: ['FL', 'GA', 'MS', 'TN'],
  AZ: ['CA', 'NV', 'NM', 'UT'],
  AR: ['LA', 'MS', 'MO', 'OK', 'TN', 'TX'],
  CA: ['AZ', 'NV', 'OR'],
  CO: ['KS', 'NE', 'NM', 'OK', 'UT', 'WY'],
  CT: ['MA', 'NY', 'RI'],
  DE: ['MD', 'NJ', 'PA'],
  FL: ['AL', 'GA'],
  GA: ['AL', 'FL', 'NC', 'SC', 'TN'],
  ID: ['MT', 'NV', 'OR', 'UT', 'WA', 'WY'],
  IL: ['IN', 'IA', 'KY', 'MO', 'WI'],
  IN: ['IL', 'KY', 'MI', 'OH'],
  IA: ['IL', 'MN', 'MO', 'NE', 'SD', 'WI'],
  KS: ['CO', 'MO', 'NE', 'OK'],
  KY: ['IL', 'IN', 'MO', 'OH', 'TN', 'VA', 'WV'],
  LA: ['AR', 'MS', 'TX'],
  ME: ['NH'],
  MD: ['DE', 'PA', 'VA', 'WV'],
  MA: ['CT', 'NH', 'NY', 'RI', 'VT'],
  MI: ['IN', 'OH', 'WI'],
  MN: ['IA', 'ND', 'SD', 'WI'],
  MS: ['AL', 'AR', 'LA', 'TN'],
  MO: ['AR', 'IA', 'IL', 'KS', 'KY', 'NE', 'OK', 'TN'],
  MT: ['ID', 'ND', 'SD', 'WY'],
  NE: ['CO', 'IA', 'KS', 'MO', 'SD', 'WY'],
  NV: ['AZ', 'CA', 'ID', 'OR', 'UT'],
  NH: ['ME', 'MA', 'VT'],
  NJ: ['DE', 'NY', 'PA'],
  NM: ['AZ', 'CO', 'OK', 'TX'],
  NY: ['CT', 'MA', 'NJ', 'PA', 'VT'],
  NC: ['GA', 'SC', 'TN', 'VA'],
  ND: ['MN', 'MT', 'SD'],
  OH: ['IN', 'KY', 'MI', 'PA', 'WV'],
  OK: ['AR', 'CO', 'KS', 'MO', 'NM', 'TX'],
  OR: ['CA', 'ID', 'NV', 'WA'],
  PA: ['DE', 'MD', 'NJ', 'NY', 'OH', 'WV'],
  RI: ['CT', 'MA'],
  SC: ['GA', 'NC'],
  SD: ['IA', 'MN', 'MT', 'ND', 'NE', 'WY'],
  TN: ['AL', 'AR', 'GA', 'KY', 'MS', 'MO', 'NC', 'VA'],
  TX: ['AR', 'LA', 'NM', 'OK'],
  UT: ['AZ', 'CO', 'ID', 'NV', 'WY'],
  VT: ['MA', 'NH', 'NY'],
  VA: ['KY', 'MD', 'NC', 'TN', 'WV'],
  WA: ['ID', 'OR'],
  WV: ['KY', 'MD', 'OH', 'PA', 'VA'],
  WI: ['IA', 'IL', 'MI', 'MN'],
  WY: ['CO', 'ID', 'MT', 'NE', 'SD', 'UT'],
}

const stateByAbbreviation = Object.fromEntries(
  states.map(([name, abbreviation]) => [abbreviation, name]),
) as Record<string, string>

const worldNeighbors: Record<string, string[]> = {
  Austria: ['Czechia', 'Germany', 'Hungary', 'Italy', 'Liechtenstein', 'Slovakia', 'Slovenia', 'Switzerland'],
  Belgium: ['France', 'Germany', 'Luxembourg', 'Netherlands'],
  Brazil: ['Argentina', 'Bolivia', 'Colombia', 'Guyana', 'Paraguay', 'Peru', 'Suriname', 'Uruguay', 'Venezuela'],
  Chile: ['Argentina', 'Bolivia', 'Peru'],
  China: ['Afghanistan', 'Bhutan', 'India', 'Kazakhstan', 'Kyrgyzstan', 'Laos', 'Mongolia', 'Myanmar', 'Nepal', 'North Korea', 'Pakistan', 'Russia', 'Tajikistan', 'Vietnam'],
  Colombia: ['Brazil', 'Ecuador', 'Panama', 'Peru', 'Venezuela'],
  Czechia: ['Austria', 'Germany', 'Poland', 'Slovakia'],
  Denmark: ['Germany'],
  Ecuador: ['Colombia', 'Peru'],
  Finland: ['Norway', 'Russia', 'Sweden'],
  Germany: ['Austria', 'Belgium', 'Czechia', 'Denmark', 'France', 'Luxembourg', 'Netherlands', 'Poland', 'Switzerland'],
  Hungary: ['Austria', 'Croatia', 'Romania', 'Serbia', 'Slovakia', 'Slovenia', 'Ukraine'],
  India: ['Bangladesh', 'Bhutan', 'China', 'Myanmar', 'Nepal', 'Pakistan'],
  Ireland: ['United Kingdom'],
  Italy: ['Austria', 'France', 'San Marino', 'Slovenia', 'Switzerland', 'Vatican City'],
  Netherlands: ['Belgium', 'Germany'],
  Norway: ['Finland', 'Russia', 'Sweden'],
  Pakistan: ['Afghanistan', 'China', 'India', 'Iran'],
  Peru: ['Bolivia', 'Brazil', 'Chile', 'Colombia', 'Ecuador'],
  Poland: ['Belarus', 'Czechia', 'Germany', 'Lithuania', 'Russia', 'Slovakia', 'Ukraine'],
  Portugal: ['Spain'],
  Romania: ['Bulgaria', 'Hungary', 'Moldova', 'Serbia', 'Ukraine'],
  Spain: ['Andorra', 'France', 'Portugal'],
  Sweden: ['Finland', 'Norway'],
  Switzerland: ['Austria', 'France', 'Germany', 'Italy', 'Liechtenstein'],
  Thailand: ['Cambodia', 'Laos', 'Malaysia', 'Myanmar'],
  Türkiye: ['Armenia', 'Azerbaijan', 'Bulgaria', 'Georgia', 'Greece', 'Iran', 'Iraq', 'Syria'],
  Vietnam: ['Cambodia', 'China', 'Laos'],
}

function hemisphereClue(lat: number, lon: number) {
  const northSouth = lat >= 0 ? 'Northern' : 'Southern'
  const eastWest = lon >= 0 ? 'Eastern' : 'Western'
  return `It is in the ${northSouth} and ${eastWest} Hemispheres.`
}

const usClueQuestions: ClueQuestion[] = states.map(([name, abbreviation, capital], index) => ({
  id: `clue-us-${abbreviation}`,
  category: 'us',
  practice: 'clue-ladder',
  kind: 'clue',
  label: 'Clue Ladder',
  prompt: 'Which U.S. state matches these clues?',
  clues: [
    `Its capital is ${capital}.`,
    stateNeighbors[abbreviation]
      ? `It shares a land border with ${stateByAbbreviation[stateNeighbors[abbreviation][index % stateNeighbors[abbreviation].length]]}.`
      : 'It does not share a land border with another U.S. state.',
    `Its postal abbreviation is ${abbreviation}.`,
  ],
  options: uniqueOptions(name, stateNames, index + 31),
  answer: name,
  explanation: `${name} has the capital ${capital} and uses the abbreviation ${abbreviation}.`,
}))

const worldClueQuestions: ClueQuestion[] = countries.map(([country, capital, continent], index) => ({
  id: `clue-world-${index}`,
  category: 'world',
  practice: 'clue-ladder',
  kind: 'clue',
  label: 'Clue Ladder',
  prompt: 'Which country matches these clues?',
  clues: [
    `It is in ${continent}.`,
    `Its capital is ${capital}.`,
    `Its name begins with ${country[0]} and contains ${[...country].length} characters.`,
  ],
  options: uniqueOptions(country, countries.map(([name]) => name), index + 43),
  answer: country,
  explanation: `${country} is in ${continent}, and its capital is ${capital}.`,
}))

const landmarkNames = landmarks.map((landmark) => landmark.name)
const landmarkClueQuestions: ClueQuestion[] = landmarks.map((landmark, index) => ({
  id: `clue-landmark-${index}`,
  category: 'landmarks',
  practice: 'clue-ladder',
  kind: 'clue',
  label: 'Clue Ladder',
  prompt: 'Which landmark matches these clues?',
  clues: [
    hemisphereClue(landmark.lat, landmark.lon),
    `It is in ${landmark.region}.`,
    `Look for it in or near ${landmark.place}.`,
  ],
  options: uniqueOptions(landmark.name, landmarkNames, index + 59),
  answer: landmark.name,
  explanation: `${landmark.name} is in ${landmark.place}, ${landmark.region}.`,
}))

const waterwayClueQuestions: ClueQuestion[] = waterways.map((waterway, index) => ({
  id: `clue-waterway-${index}`,
  category: 'waterways',
  practice: 'clue-ladder',
  kind: 'clue',
  label: 'Clue Ladder',
  prompt: 'Which waterway matches these clues?',
  clues: [
    hemisphereClue(waterway.lat, waterway.lon),
    `It is a ${waterway.type.toLowerCase()}.`,
    `It is located ${waterway.place}.`,
  ],
  options: uniqueOptions(waterway.name, waterwayNames, index + 71),
  answer: waterway.name,
  explanation: `${waterway.name} is a ${waterway.type.toLowerCase()} located ${waterway.place}.`,
}))

const usNeighborQuestions: ChoiceQuestion[] = Object.entries(stateNeighbors).flatMap(
  ([abbreviation, neighbors], stateIndex) =>
    neighbors.map((answerAbbreviation, neighborIndex) => {
      const answer = stateByAbbreviation[answerAbbreviation]
      const target = stateByAbbreviation[abbreviation]
      const nonNeighbors = stateNames.filter(
        (name) =>
          name !== target &&
          !neighbors.some((neighbor) => stateByAbbreviation[neighbor] === name),
      )
      return {
        id: `neighbor-us-${abbreviation}-${answerAbbreviation}`,
        category: 'us' as const,
        practice: 'neighbors' as const,
        kind: 'choice' as const,
        label: 'Neighbor Challenge',
        prompt: `Which state shares a land border with ${target}?`,
        options: uniqueOptions(answer, nonNeighbors, stateIndex * 7 + neighborIndex),
        answer,
        explanation: `${target} borders ${neighbors.map((neighbor) => stateByAbbreviation[neighbor]).join(', ')}.`,
      }
    }),
)

const worldNeighborDistractors = [
  ...new Set([
    ...countries.map(([name]) => name),
    ...Object.values(worldNeighbors).flat(),
  ]),
]
const worldNeighborQuestions: ChoiceQuestion[] = Object.entries(worldNeighbors).flatMap(
  ([target, neighbors], countryIndex) =>
    neighbors.map((answer, neighborIndex) => ({
      id: `neighbor-world-${countryIndex}-${neighborIndex}`,
      category: 'world' as const,
      practice: 'neighbors' as const,
      kind: 'choice' as const,
      label: 'Neighbor Challenge',
      prompt: `Which country shares a land border with ${target}?`,
      options: uniqueOptions(
        answer,
        worldNeighborDistractors.filter((country) => country !== target && !neighbors.includes(country)),
        countryIndex * 11 + neighborIndex,
      ),
      answer,
      explanation: `${target} shares land borders with ${neighbors.join(', ')}.`,
    })),
)

function distanceKm(
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

const closerQuestions: ChoiceQuestion[] = landmarks.map((anchor, index) => {
  const first = landmarks[(index + 7) % landmarks.length]
  const second = landmarks[(index + 19) % landmarks.length]
  const firstDistance = distanceKm(anchor, first)
  const secondDistance = distanceKm(anchor, second)
  const answer = firstDistance < secondDistance ? first.name : second.name
  return {
    id: `closer-landmark-${index}`,
    category: 'landmarks',
    practice: 'closer',
    kind: 'choice',
    label: 'Which Is Closer?',
    prompt: `Which landmark is closer to ${anchor.name}?`,
    options: [first.name, second.name],
    answer,
    explanation: `By straight-line distance, ${first.name} is about ${Math.round(firstDistance).toLocaleString()} km away; ${second.name} is about ${Math.round(secondDistance).toLocaleString()} km away.`,
  }
})

const waterwayCloserQuestions: ChoiceQuestion[] = waterways.map((anchor, index) => {
  const first = waterways[(index + 7) % waterways.length]
  const second = waterways[(index + 17) % waterways.length]
  const firstDistance = distanceKm(anchor, first)
  const secondDistance = distanceKm(anchor, second)
  const answer = firstDistance < secondDistance ? first.name : second.name
  return {
    id: `closer-waterway-${index}`,
    category: 'waterways',
    practice: 'closer',
    kind: 'choice',
    label: 'Which Is Closer?',
    prompt: `Which waterway is closer to ${anchor.name}?`,
    options: [first.name, second.name],
    answer,
    explanation: `Using representative map points, ${first.name} is about ${Math.round(firstDistance).toLocaleString()} km away; ${second.name} is about ${Math.round(secondDistance).toLocaleString()} km away.`,
  }
})

const pinpointQuestions: PinpointQuestion[] = landmarks.map((landmark, index) => ({
  id: `pinpoint-landmark-${index}`,
  category: 'landmarks',
  practice: 'pinpoint',
  kind: 'pinpoint',
  label: 'Map Pinpoint',
  prompt: `Place ${landmark.name} on the world map.`,
  hint: `It is in ${landmark.region}. Tap as close as you can.`,
  answer: landmark.name,
  target: { lat: landmark.lat, lon: landmark.lon },
  place: `${landmark.place}, ${landmark.region}`,
  explanation: `${landmark.name} is in ${landmark.place}, ${landmark.region}.`,
}))

const waterwayPinpointQuestions: PinpointQuestion[] = waterways.map((waterway, index) => ({
  id: `pinpoint-waterway-${index}`,
  category: 'waterways',
  practice: 'pinpoint',
  kind: 'pinpoint',
  label: 'Map Pinpoint',
  prompt: `Place ${waterway.name} on the world map.`,
  hint: `It is ${waterway.place}. Tap as close as you can.`,
  answer: waterway.name,
  target: { lat: waterway.lat, lon: waterway.lon },
  place: waterway.place,
  explanation: `${waterway.name} is ${waterway.place}.`,
}))

const varietyBanks = {
  us: usQuestions,
  world: worldQuestions,
  landmarks: landmarkQuestions,
  waterways: waterwayQuestions,
}
const clueBanks = {
  us: usClueQuestions,
  world: worldClueQuestions,
  landmarks: landmarkClueQuestions,
  waterways: waterwayClueQuestions,
}
const neighborBanks = {
  us: usNeighborQuestions,
  world: worldNeighborQuestions,
  landmarks: [] as Question[],
  waterways: [] as Question[],
}
const closerBanks = {
  us: [] as Question[],
  world: [] as Question[],
  landmarks: closerQuestions,
  waterways: waterwayCloserQuestions,
}
const pinpointBanks = {
  us: [] as Question[],
  world: [] as Question[],
  landmarks: pinpointQuestions,
  waterways: waterwayPinpointQuestions,
}
const practiceBanks: Record<
  PracticeMode,
  Record<Category, Question[]>
> = {
  variety: varietyBanks,
  'clue-ladder': clueBanks,
  neighbors: neighborBanks,
  closer: closerBanks,
  pinpoint: pinpointBanks,
}

const allQuestions = Object.values(practiceBanks).flatMap((bank) => [
  ...bank.us,
  ...bank.world,
  ...bank.landmarks,
  ...bank.waterways,
])
const questionsById = new Map(allQuestions.map((question) => [question.id, question]))

export const questionPoolCounts = {
  us: usQuestions.length,
  world: worldQuestions.length,
  landmarks: landmarkQuestions.length,
  waterways: waterwayQuestions.length,
}

export function shuffled<T>(items: readonly T[]) {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[result[index], result[swapIndex]] = [result[swapIndex], result[index]]
  }
  return result
}

function questionsFor(categories: readonly Category[], practice: PracticeMode) {
  const bank = practiceBanks[practice]
  return categories.flatMap((category) => bank[category])
}

export function getQuestionPoolCount(
  categories: readonly Category[],
  practice: PracticeMode,
  flaggedIds: string[] = [],
  onlyFlagged = false,
  allFlaggedModes = false,
) {
  const selected = new Set(categories)
  const source = allFlaggedModes
    ? allQuestions.filter((question) => selected.has(question.category))
    : questionsFor(categories, practice)
  if (!onlyFlagged) return source.length
  const flagged = new Set(flaggedIds)
  return source.filter((question) => flagged.has(question.id)).length
}

export function getQuestionsByIds(ids: string[]) {
  return ids
    .map((id) => questionsById.get(id))
    .filter((question): question is Question => Boolean(question))
}

export function buildQuestions(
  categories: readonly Category[],
  count: number,
  practice: PracticeMode = 'variety',
  flaggedIds: string[] = [],
  onlyFlagged = false,
  allFlaggedModes = false,
) {
  const flagged = new Set(flaggedIds)
  const selected = new Set(categories)
  const completeSource = allFlaggedModes
    ? allQuestions.filter((question) => selected.has(question.category))
    : questionsFor(categories, practice)
  const source = onlyFlagged
    ? completeSource.filter((question) => flagged.has(question.id))
    : completeSource

  if (onlyFlagged || practice !== 'variety') {
    return shuffled(source).slice(0, count)
  }

  const guaranteed = categories.flatMap((category) => {
    if (category === 'us') return [shuffled(usQuestions)[0]]
    if (category === 'world') return [shuffled(worldQuestions)[0]]
    if (category === 'landmarks') {
      return [shuffled(landmarkMatchingQuestions)[0], shuffled(landmarkOrderQuestions)[0]]
    }
    return [shuffled(waterwayMatchingQuestions)[0], shuffled(waterwayOrderQuestions)[0]]
  })
  const rest = shuffled(source).filter((question) => !guaranteed.some((item) => item.id === question.id))
  return shuffled([...guaranteed, ...rest.slice(0, Math.max(0, count - guaranteed.length))])
}
