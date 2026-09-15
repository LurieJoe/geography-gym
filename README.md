# Geography Gym

Geography Gym is an installable geography learning PWA for teens and adults. Its
learning paths use varied games to build spatial intuition rather than relying only
on memorization.

## Learning paths

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

Additional practice modes reuse and extend those subjects:

- **Clue Ladder:** 150 state, country, and landmark identification questions
- **Neighbor Challenge:** 344 U.S. state and world-country border questions
- **Which Is Closer?:** 50 straight-line landmark distance comparisons
- **Map Pinpoint:** 50 two-attempt landmark placement challenges
- **Flagged Review:** a profile-specific workout assembled from questions the learner
  flags during any activity

The home page uses a two-step workout path: first choose what to study (U.S.,
World, Landmarks, or Mixed), then choose how to study it with a compatible
practice style. Practice
styles that do not apply to the selected subject remain visible but disabled so
their scope is clear. Flagged Review remains available as a profile-specific
shortcut beside the progress counters.

The public root remains a full product website. **Open app** enters a separate,
compact app dashboard at `?app=1`, where Step 1 and Step 2 appear together
inline. Installed PWA shortcuts launch this dashboard directly instead of the
marketing homepage.

Players can choose 10-, 25-, or 50-question workouts. Multiple-choice, location, and
ordering questions allow two attempts. Matching Pairs provides immediate animated
feedback. Optional answer sounds, an elapsed timer, rotating startup tips, and local
progress are available from Settings.

Multiple local profiles can share one device without accounts or passwords. Each
profile has independent progress, theme, accent color, sounds, timer, startup tips,
tip rotation, default workout length, and flagged-question review list. Existing
single-profile progress and preferences migrate into an initial **Me** profile. A
profile's home-page progress counters can be reset without changing its preferences,
flags, or other profiles.

An unfinished workout is also saved separately for each profile. Returning to the
home page or reopening the app displays a Resume workout panel with the saved subject,
practice style, question position, score, streak, order, and paused elapsed time.
During a workout, **Previous** returns to an answered question in review-only mode,
showing the correct answer without changing the score or streak.

Clue Ladder randomizes its three clues for each question instead of consistently
leading with the broadest location clue.

No account or analytics service is used. Profiles, progress, and preferences are
stored locally, and no network connection is required after the app has been cached.

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
