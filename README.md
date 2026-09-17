# Geography Gym

Geography Gym is an installable geography learning PWA for teens and adults. Its
learning paths use varied games to build spatial intuition rather than relying only
on memorization.

## Learning paths

- **U.S. Geography:** the 50 states, Washington, D.C., and the five inhabited
  U.S. territories: Puerto Rico, the U.S. Virgin Islands, Guam, the Northern
  Mariana Islands, and American Samoa. Activities cover place type, postal
  abbreviation, capital, region, flags, major islands and rivers, nearby places,
  clues, matching, geographic ordering, and map placement. State location
  practice uses U.S. Census Bureau geometry.
- **World Geography:** countries and places outside the United States, including
  capitals, map locations, directions, continents, latitude, and distance
  comparisons.
- **Landmarks:** multiple choice, matching pairs, and geographic ordering from north
  to south or west to east.
- **Waterways:** oceans, seas, gulfs, rivers, straits, lakes, waterfalls, and canals
  through multiple choice, matching, ordering, clues, distance comparisons, and
  map placement.

The current question banks include:

- 189 U.S. geography questions and activities
- 120 world geography questions
- 136 landmark questions
- 114 waterway questions and activities

Together, these four core banks provide 559 questions and activities.

Additional practice modes reuse and extend those subjects:

- **Clue Ladder:** 198 U.S. jurisdiction, country, landmark, and waterway identification questions
- **Neighbor Challenge:** 346 U.S. and world-country border questions
- **Which Is Closer?:** 92 straight-line landmark and waterway distance comparisons
- **Map Pinpoint:** 98 two-attempt U.S. jurisdiction, landmark, and waterway placement challenges
- **Flagged Review:** a profile-specific workout assembled from questions the learner
  flags during any activity

Across the core banks and additional practice modes, Geography Gym provides
1,293 unique questions and activities.

The home page uses a two-step workout path: first select one or more subjects
(U.S., World, Landmarks, or Waterways), then choose how to study them with a
compatible practice style. Selecting multiple subjects creates a custom mixed
workout from exactly those choices. Practice styles use the compatible portion
of the selection and remain disabled when none of the selected subjects apply.
When exactly one geographic scope is selected, U.S. Geography or World Geography
also filters every Landmark and Waterways question, distractor, matching group,
ordering activity, comparison, and pinpoint target to that scope. Selecting both
geographic scopes restores the complete content collections.
Flagged Review remains available as a profile-specific shortcut beside the
progress counters.

The public root remains a full product website. **Open app** and installed PWA
shortcuts launch a separate app home under `/app/?app=1`. The installed PWA's
navigation scope is limited to `/app/`, keeping the website, FAQ, Help Center,
and Privacy Policy outside the app window. The app home welcomes the active
profile with a large globe and clear actions to start, resume, or review.
**Start an exercise** opens the compact builder, where Step 1 and Step 2 appear
together inline.

Settings and Tips remain available throughout the app. Settings includes
prominent feedback controls and links that open the public Geography Gym
website, FAQ, Help Center, and Privacy Policy in the browser.

Players can choose 10-, 25-, or 50-question workouts. Multiple-choice, location, and
ordering questions allow two attempts. Matching Pairs provides immediate animated
feedback. Optional answer sounds, an elapsed timer, rotating startup tips, High Contrast,
Small/Default/Large/XL font sizes, Miles or Kilometers for distance activities, and local
progress are available from Settings.

World-location and Map Pinpoint activities use a bundled orthographic globe with real
geographic outlines. Players can drag or swipe to rotate it, use visible rotation
controls, or operate it with the keyboard. Keyboard-only location choices and the
Map Pinpoint center marker stay hidden until keyboard interaction. Map Pinpoint accepts
answers within 750 kilometers (about 466 miles); after a first miss, the globe presents
a larger view near the correct region without revealing the exact target.

Multiple local profiles can share one device without accounts or passwords. Each
profile has independent progress, theme, contrast, font size, accent color, sounds, timer,
startup tips, tip rotation, distance units, default workout length, and flagged-question review list. Existing
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
