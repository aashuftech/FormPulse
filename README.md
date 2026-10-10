# FormPulse

FormPulse is a workout app that uses your camera to track supported exercises and show real-time form feedback.

## Screenshots and demo

Add verified app screenshots and a live demo link here when they are ready.

## Features

- Browser-based pose detection with MediaPipe.
- Rep counting for Squats, Push-Ups, Lunges, and Jumping Jacks.
- Valid hold-time tracking for Plank.
- Visual form feedback and optional browser voice guidance.
- Saved workouts, history, progress, and personal challenges.
- Profile settings and account session management.
- Estimated workout calories based on exercise duration and profile weight.

## How pose tracking works

1. The browser camera provides video to MediaPipe Pose Landmarker.
2. MediaPipe returns body landmarks. Video frames and landmarks stay in the browser.
3. Exercise-specific detectors check whether landmarks are reliable, then track movement phases.
4. A rep is counted after a complete movement cycle. Plank time is counted only while the detected pose is valid.
5. Detectors provide form feedback to the workout screen. Completed workout data is saved through the backend API.

The coaching score and calorie values are estimates. FormPulse is not a medical or injury-prevention tool.

## Built with

- **React** — builds the pages and interactive UI.
- **TypeScript** — adds types to frontend and backend code.
- **Vite** — runs the frontend locally and builds it for production.
- **Tailwind CSS** — styles the interface.
- **MediaPipe Tasks Vision** — detects pose landmarks in the browser.
- **Node.js and Express** — provide the backend API.
- **MongoDB and Mongoose** — store accounts, workouts, progress, and challenges.
- **Zod** — validates API input.
- **JWT and HttpOnly cookies** — manage authenticated sessions.

## Project structure

```text
src/
  pages/       Frontend pages
  hooks/       Authentication, workout, and camera hooks
  services/    API clients and exercise detectors

server/
  src/
    config/       Environment and database setup
    controllers/  API request handlers
    middleware/   Authentication, validation, and security
    models/       MongoDB models
    routes/       API routes
    services/     Workout, challenge, and authentication logic
```

## Run locally

You will need Node.js with npm and access to a MongoDB database.

### 1. Install dependencies

Run these commands from the repository root:

```bash
npm ci
npm --prefix server ci
```

### 2. Configure the backend

Copy the example file:

**Windows PowerShell**

```powershell
Copy-Item server/.env.example server/.env
```

**macOS or Linux**

```bash
cp server/.env.example server/.env
```

Set at least these values in `server/.env`:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/formpulse
CLIENT_URL=http://localhost:5173
JWT_SECRET=replace-with-a-random-secret-of-at-least-32-characters
```

Configure the `SMTP_*` and `EMAIL_FROM` values to enable verification and password reset emails. Keep `.env` files and secrets private; do not commit them.

### 3. Start the backend

In one terminal:

```bash
npm --prefix server run dev
```

The backend uses port `5000` by default.

### 4. Start the frontend

In a second terminal:

```bash
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`. During development, Vite proxies `/api` requests to the backend.

## Checks and tests

```bash
# Frontend lint
npm run lint

# Frontend TypeScript check and production build
npm run build

# Backend TypeScript build
npm --prefix server run build

# All five exercise detector test suites
node --test src/services/squatDetector.test.mjs src/services/pushUpDetector.test.mjs src/services/lungeDetector.test.mjs src/services/jumpingJackDetector.test.mjs src/services/plankDetector.test.mjs
```

The detector suites currently contain 48 tests. Backend integration tests that use MongoDB need a configured test database.

## Render deployment

FormPulse can run as one Render Web Service: Express serves the built frontend and the `/api` routes.

**Build Command**

```bash
npm ci --include=dev && npm --prefix server ci --include=dev && npm run build:render
```

**Start Command**

```bash
npm start
```

**Health Check Path**

```text
/api/health
```

Set `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`, and SMTP settings in the Render environment. Render supplies `PORT`. For a single service serving both the frontend and API, leave `VITE_API_URL` unset so the frontend uses the same origin.

## Authentication and privacy

- Access and refresh tokens use HttpOnly cookies; frontend JavaScript does not store them in `localStorage` or `sessionStorage`.
- Production cookies use the `Secure` setting.
- The backend checks the configured frontend origin and protects API routes with authentication and input validation.
- Camera video is processed in the browser and is not uploaded to the backend.

## Known limitations

- Camera access requires browser permission and a supported browser/device.
- Voice guidance depends on browser speech support.
- Form scores and calorie values are estimates, not medical measurements.
- Add verified screenshots and a working public demo link before presenting this README as a live demo.
