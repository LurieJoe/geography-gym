# Geography Gym

Geography Gym is an installable geography learning PWA for teens and adults. Its
learning paths use varied games to build spatial intuition rather than relying only
on memorization.

## MVP learning tracks

- **U.S. Geography:** state abbreviations, capitals, and two-stage location
  practice. Players choose a map section, then tap the state's approximate
  location on a zoomed silhouette. State boundaries appear after the answer,
  using U.S. Census Bureau geometry.
- **World Geography:** countries, capitals, map locations, directions, continents,
  latitude, and distance comparisons.
- **Landmarks:** multiple choice, matching pairs, and geographic ordering from north
  to south or west to east.

The current question banks include:

- 150 U.S. geography questions
- 120 world geography questions
- 136 landmark questions

Players can choose 10-, 25-, or 50-question workouts. Multiple-choice, location, and
ordering questions allow two attempts. Matching Pairs provides immediate animated
feedback. Optional answer sounds, an elapsed timer, rotating startup tips, and local
progress are available from Settings.

No account or analytics service is used. Progress and preferences are stored locally,
and no network connection is required after the app has been cached.

The production site also includes an FAQ, Help Center, feedback link, and privacy policy.

## Development

```powershell
npm install
npm run dev
```

Create a production build with:

```powershell
npm run build
```
