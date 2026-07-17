# PolyGlot Frontend

React + TypeScript + Vite application for uploading PDFs, configuring translation options, tracking translation jobs, and downloading translated files.

## Requirements

- Node.js 20+
- npm 10+

## Environment

Create `frontend/.env` from `frontend/.env.example`.

```env
VITE_API_URL=http://localhost:3001/api
```

## Scripts

```bash
npm run dev    # start Vite dev server
npm run lint   # run Oxlint
npm run build  # type-check + production build
npm run preview
```

Default dev URL: `http://localhost:5173`

## Main folders

- `src/components` — upload UI, status, options, history table
- `src/pages` — translator and history pages
- `src/services` — API client wrappers
- `src/hooks` — polling and side-effect hooks
- `src/types` — shared frontend types

## Backend dependency

The frontend expects the backend API to be available at `VITE_API_URL`.
For local development with default settings, start backend on `http://localhost:3001`.
