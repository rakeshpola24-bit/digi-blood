# Digi Blood (Vizag Volunteers)
Free stack: GitHub Pages + Firebase Spark (Firestore, Auth). Vite + React.

- Demo mode: while `src/firebase-config.js` has no apiKey, sample data is shown and nothing is stored.
- Live mode: public sees only records staff approved. New donor/request/camp forms are saved as `pending`.
- Staff screen: `<site>/#admin` (Firebase email+password users, created in the Firebase console).
- Blood availability: `scripts/fetch-availability.mjs` pulls eRaktKosh hourly in GitHub Actions into `availability.json`.
- Rules: `firestore.rules`. Embed: `embed-snippet.html`.
- Dev: `npm i && npm run dev`, build: `npm run build`.
