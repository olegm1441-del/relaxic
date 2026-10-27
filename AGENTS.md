# Relaxic landing

This branch intentionally contains only the low-cost landing page. The full
store is preserved in `archive/full-site-2026-10-27`.

- Use the existing checkout; do not create a worktree unless explicitly asked.
- The app has no npm dependencies and no build step.
- Run `npm run check` for tests and `npm start` for local development.
- Verify `/`, `/landing.js`, and `/api/health` after changes.
- Every landing-page link is intentionally intercepted by `public/landing.js`.
- The Yandex Metrika JavaScript goal is `landing_link_click`.
