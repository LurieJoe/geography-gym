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
  mixed: { label: 'Mixed Expedition' },
}

const usQuestions: Question[] = [
  {
    id: 'us-abbr-az', category: 'us', kind: 'choice', label: 'State shorthand',
    prompt: 'Which state uses the abbreviation AZ?', options: ['Arkansas', 'Arizona', 'Alaska', 'Alabama'], answer: 'Arizona',
    explanation: 'AZ is Arizona. Arkansas is AR, Alaska is AK, and Alabama is AL.',
  },
  {
    id: 'us-abbr-me', category: 'us', kind: 'choice', label: 'State shorthand',
    prompt: 'What is the postal abbreviation for Maine?', options: ['MN', 'MA', 'ME', 'MI'], answer: 'ME',
    explanation: 'Maine uses ME. MA belongs to Massachusetts.',
  },
  {
    id: 'us-abbr-mo', category: 'us', kind: 'choice', label: 'State shorthand',
    prompt: 'Which abbreviation belongs to Missouri?', options: ['MS', 'MO', 'MI', 'MT'], answer: 'MO',
    explanation: 'Missouri is MO; Mississippi is MS.',
  },
  {
    id: 'us-direction-ok', category: 'us', kind: 'choice', label: 'Compass check',
    prompt: 'Which state is directly north of Texas?', options: ['Oklahoma', 'Kansas', 'New Mexico', 'Arkansas'], answer: 'Oklahoma',
    explanation: 'Oklahoma shares most of Texas’s northern border.',
  },
  {
    id: 'us-direction-or', category: 'us', kind: 'choice', label: 'Compass check',
    prompt: 'Which state is directly north of California?', options: ['Washington', 'Oregon', 'Nevada', 'Idaho'], answer: 'Oregon',
    explanation: 'Oregon sits directly above California on the Pacific coast.',
  },
  {
    id: 'us-direction-nj', category: 'us', kind: 'choice', label: 'Compass check',
    prompt: 'New Jersey is primarily in which direction from Pennsylvania?', options: ['East', 'West', 'North', 'South'], answer: 'East',
    explanation: 'New Jersey lies east of Pennsylvania, across the Delaware River.',
  },
  {
    id: 'us-locate-co', category: 'us', kind: 'locate-us', label: 'Locate it',
    prompt: 'Tap Colorado on the map.', answer: 'CO',
    explanation: 'Colorado is the rectangular Mountain West state south of Wyoming.',
  },
  {
    id: 'us-locate-fl', category: 'us', kind: 'locate-us', label: 'Locate it',
    prompt: 'Tap Florida on the map.', answer: 'FL',
    explanation: 'Florida is the peninsula extending southeast into the Atlantic and Gulf of Mexico.',
  },
  {
    id: 'us-locate-pa', category: 'us', kind: 'locate-us', label: 'Locate it',
    prompt: 'Tap Pennsylvania on the map.', answer: 'PA',
    explanation: 'Pennsylvania is in the Mid-Atlantic, west of New Jersey and south of New York.',
  },
  {
    id: 'us-distance', category: 'us', kind: 'choice', label: 'Near or far',
    prompt: 'About how far apart are New York City and Los Angeles by air?', hint: 'Choose the closest estimate.',
    options: ['750 miles', '1,400 miles', '2,450 miles', '4,100 miles'], answer: '2,450 miles',
    explanation: 'The direct air distance is roughly 2,450 miles (3,940 km).',
  },
  {
    id: 'us-landmark', category: 'us', kind: 'choice', label: 'American landmark',
    prompt: 'In which state would you visit Mount Rushmore?', options: ['North Dakota', 'South Dakota', 'Wyoming', 'Montana'], answer: 'South Dakota',
    explanation: 'Mount Rushmore is in the Black Hills of South Dakota.',
  },
]

const londonTokyoSydneyCairo = [
  { name: 'United Kingdom', x: 440, y: 105 },
  { name: 'Japan', x: 770, y: 155 },
  { name: 'Australia', x: 765, y: 325 },
  { name: 'Egypt', x: 500, y: 190 },
]

const worldQuestions: Question[] = [
  {
    id: 'world-capital-ca', category: 'world', kind: 'choice', label: 'Capital call',
    prompt: 'What is the capital of Canada?', options: ['Toronto', 'Vancouver', 'Ottawa', 'Montréal'], answer: 'Ottawa',
    explanation: 'Ottawa, in Ontario, is Canada’s capital.',
  },
  {
    id: 'world-capital-au', category: 'world', kind: 'choice', label: 'Capital call',
    prompt: 'What is the capital of Australia?', options: ['Sydney', 'Canberra', 'Melbourne', 'Perth'], answer: 'Canberra',
    explanation: 'Canberra is Australia’s capital; Sydney is its largest city.',
  },
  {
    id: 'world-direction', category: 'world', kind: 'choice', label: 'Compass check',
    prompt: 'Which country lies directly south of the United States?', options: ['Brazil', 'Mexico', 'Cuba', 'Colombia'], answer: 'Mexico',
    explanation: 'Mexico shares the southern land border of the continental United States.',
  },
  {
    id: 'world-equator', category: 'world', kind: 'choice', label: 'Latitude',
    prompt: 'Which city is closest to the Equator?', options: ['Quito', 'Madrid', 'Tokyo', 'Cape Town'], answer: 'Quito',
    explanation: 'Quito, Ecuador sits just south of the Equator.',
  },
  {
    id: 'world-distance', category: 'world', kind: 'choice', label: 'Near or far',
    prompt: 'Which pair of cities is farther apart?', options: ['Paris–London', 'Tokyo–Seoul', 'New York–London', 'Rome–Athens'], answer: 'New York–London',
    explanation: 'New York and London are about 3,460 miles apart, much farther than the other pairs.',
  },
  {
    id: 'world-locate-japan', category: 'world', kind: 'locate-world', label: 'Find the country',
    prompt: 'Which numbered point marks Japan?', answer: 'Japan', points: londonTokyoSydneyCairo,
    explanation: 'Japan is the island nation east of the Korean Peninsula in the northwest Pacific.',
  },
  {
    id: 'world-locate-egypt', category: 'world', kind: 'locate-world', label: 'Find the country',
    prompt: 'Which numbered point marks Egypt?', answer: 'Egypt', points: londonTokyoSydneyCairo,
    explanation: 'Egypt is in northeast Africa, where Africa meets Asia.',
  },
  {
    id: 'world-continent', category: 'world', kind: 'choice', label: 'World regions',
    prompt: 'The Andes Mountains run along the western edge of which continent?', options: ['Asia', 'South America', 'Africa', 'Europe'], answer: 'South America',
    explanation: 'The Andes extend along western South America from Venezuela toward Chile and Argentina.',
  },
]

const landmarkQuestions: Question[] = [
  {
    id: 'landmark-eiffel', category: 'landmarks', kind: 'choice', label: 'Where is it?',
    prompt: 'Where would you find the Eiffel Tower?', options: ['Paris, France', 'Brussels, Belgium', 'Rome, Italy', 'Vienna, Austria'], answer: 'Paris, France',
    explanation: 'The Eiffel Tower stands beside the Seine in Paris, France.',
  },
  {
    id: 'landmark-gateway', category: 'landmarks', kind: 'choice', label: 'Where is it?',
    prompt: 'Which U.S. city is home to the Gateway Arch?', options: ['St. Louis', 'Chicago', 'Kansas City', 'Memphis'], answer: 'St. Louis',
    explanation: 'The Gateway Arch overlooks the Mississippi River in St. Louis, Missouri.',
  },
  {
    id: 'landmark-petra', category: 'landmarks', kind: 'choice', label: 'Where is it?',
    prompt: 'In which country is the ancient city of Petra?', options: ['Jordan', 'Egypt', 'Greece', 'Türkiye'], answer: 'Jordan',
    explanation: 'Petra is an ancient rock-cut city in southern Jordan.',
  },
  {
    id: 'landmark-match-1', category: 'landmarks', kind: 'matching', label: 'Matching pairs',
    prompt: 'Match each landmark to its city or country.', hint: 'Choose one item from each column.',
    pairs: [
      { left: 'Golden Gate Bridge', right: 'San Francisco' },
      { left: 'Sydney Opera House', right: 'Australia' },
      { left: 'Colosseum', right: 'Rome' },
      { left: 'Christ the Redeemer', right: 'Rio de Janeiro' },
    ],
    explanation: 'Each landmark is now connected to its place on your mental map.',
  },
  {
    id: 'landmark-match-2', category: 'landmarks', kind: 'matching', label: 'Matching pairs',
    prompt: 'Match these U.S. landmarks to their states.', hint: 'Choose one item from each column.',
    pairs: [
      { left: 'Grand Canyon', right: 'Arizona' },
      { left: 'Space Needle', right: 'Washington' },
      { left: 'Liberty Bell', right: 'Pennsylvania' },
      { left: 'French Quarter', right: 'Louisiana' },
    ],
    explanation: 'These landmarks span the Southwest, Pacific Northwest, Mid-Atlantic, and Gulf Coast.',
  },
  {
    id: 'landmark-order-ns', category: 'landmarks', kind: 'order', label: 'North to south',
    prompt: 'Put these cities in order from north to south.',
    items: ['Seattle', 'New York City', 'Atlanta', 'Miami'],
    answer: ['Seattle', 'New York City', 'Atlanta', 'Miami'],
    startLabel: 'North', endLabel: 'South',
    explanation: 'Seattle is farthest north, followed by New York City, Atlanta, and Miami.',
  },
  {
    id: 'landmark-order-ew', category: 'landmarks', kind: 'order', label: 'West to east',
    prompt: 'Put these landmarks in order from west to east.',
    items: ['Golden Gate Bridge', 'Mount Rushmore', 'Gateway Arch', 'Statue of Liberty'],
    answer: ['Golden Gate Bridge', 'Mount Rushmore', 'Gateway Arch', 'Statue of Liberty'],
    startLabel: 'West', endLabel: 'East',
    explanation: 'The route runs from San Francisco through South Dakota and St. Louis to New York.',
  },
  {
    id: 'landmark-order-world', category: 'landmarks', kind: 'order', label: 'West to east',
    prompt: 'Put these world landmarks in order from west to east.',
    items: ['Machu Picchu', 'Statue of Liberty', 'Eiffel Tower', 'Taj Mahal'],
    answer: ['Machu Picchu', 'Statue of Liberty', 'Eiffel Tower', 'Taj Mahal'],
    startLabel: 'West', endLabel: 'East',
    explanation: 'From Peru, the sequence crosses North America and Europe before reaching India.',
  },
]

const banks = { us: usQuestions, world: worldQuestions, landmarks: landmarkQuestions }

export function buildQuestions(category: Category, count: number) {
  const source = category === 'mixed'
    ? [...usQuestions, ...worldQuestions, ...landmarkQuestions]
    : banks[category]

  const shuffled = [...source].sort(() => Math.random() - 0.5)
  if (category !== 'mixed') return shuffled.slice(0, count)

  const guaranteed = [
    usQuestions[Math.floor(Math.random() * usQuestions.length)],
    worldQuestions[Math.floor(Math.random() * worldQuestions.length)],
    landmarkQuestions[Math.floor(Math.random() * landmarkQuestions.length)],
  ]
  const remaining = shuffled.filter((question) => !guaranteed.some((item) => item.id === question.id))
  return [...guaranteed, ...remaining.slice(0, count - guaranteed.length)].sort(() => Math.random() - 0.5)
}
