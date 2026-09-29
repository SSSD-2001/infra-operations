# Email Group Manager — webapp

Lightweight React + Vite webapp for managing email groups (subscribe/unsubscribe, browse public/private/default groups, and user group management).

**Status:** Work-in-progress — webapp UI and state management implemented with TypeScript and Redux Toolkit.

**Tech stack**

- **Framework:** Vite + React (TypeScript)
- **UI:** MUI (Material UI), Emotion
- **State:** Redux Toolkit + react-redux
- **Forms & Validation:** Formik + Yup
- **HTTP / Retry:** Axios + retry-axios
- **Routing:** react-router-dom
- **Build tools:** Vite, TypeScript, ESLint, Prettier

**Key features**

- Browse and search email groups (public, private, default, all groups)
- Subscribe / unsubscribe actions
- Auth integration via Asgardeo (`@asgardeo/auth-react`) and session handling
- Responsive admin-style layout with sidebar, header, and panels

**Repository layout (important paths)**

- `src/` — application source
  - `app/` — top-level app handler and assets
  - `component/` — reusable UI pieces and layout components
  - `slices/` — Redux slices (store and domain slices)
  - `view/` — page views and feature panels (email groups, help)
  - `utils/` — helper functions and `apiService.ts`
- `public/` — static assets and `config.js.example` (copy to `config.js` for local config)
- `vite.config.ts`, `tsconfig.json`, `package.json` — tooling and scripts

## Getting started

**Prerequisites**

- Node.js (recommended v18+) and npm or Yarn

**Local setup**

1. Clone the repo and change into the webapp folder:

```bash
cd apps/email-group-manager/webapp
npm install
```

2. Copy the example config and edit as needed:

```bash
cp public/config.js.example public/config.js
# (On Windows PowerShell)
Copy-Item public/config.js.example public/config.js
```

3. Start the dev server:

```bash
npm run dev
```

Open http://localhost:5173 (or the port shown) to view the app.

Scripts (from `package.json`)

- `npm run dev` — start Vite dev server
- `npm run build` — build production bundle
- `npm run preview` — preview production build locally
- `npm run type-check` — run TypeScript type check
- `npm run lint` — run ESLint
- `npm run format` — run Prettier to format code

Environment & configuration

- The app reads runtime values from `public/config.js` — copy `public/config.js.example` and fill in API base URLs and Asgardeo auth settings.
- `public/config.js` is served to the browser. Do **not** place secrets (client secrets, private keys, tokens) in this file.
- If your backend requires CORS or auth tokens, configure those values before running the app.

Development notes

- The app uses `@reduxjs/toolkit` slices under `src/slices/` — add new slices for additional domain data.
- API calls go through `src/utils/apiService.ts` which centralizes Axios configuration and retry logic.
- UI components use MUI; theme customization can be found in `src/theme.ts`.

Linting & formatting

- ESLint is configured — run `npm run lint` to check issues.
- Prettier with sorting plugin is used; run `npm run format` to auto-format code.

Building and deployment

- Run `npm run build` to produce a `dist/` folder.
- Serve the built files from any static host or integrate into the backend server.

Troubleshooting

- If the app fails to load config, ensure `public/config.js` exists and exports the expected shape.
- Verify backend API endpoints and CORS settings if requests fail.
