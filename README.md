# Forge — Gym Tracker

A mobile-first, installable (PWA) gym tracker with split-based daily workout suggestions, set logging with a rest timer, progressive-overload suggestions, accurate BMI / calorie / macro targets, and progress charts.

**Stack:** React 18 + TypeScript + Vite · Tailwind CSS · Firebase Auth + Cloud Firestore (offline-first) · Recharts · vite-plugin-pwa · Vitest

Hosting and database are both free on the Vercel Hobby / Netlify Starter and Firebase Spark plans.

---

## Features

- **Accounts:** Google sign-in and email/password with password reset. Each user's data is private (Firestore security rules).
- **Onboarding:** sex, date of birth, height, weight, optional body fat %, activity level, experience, training days, and goal (lose / maintain / gain with weekly pace). Metric or imperial.
- **BMI:** WHO categories, healthy weight range for your height, BMI-over-time chart.
- **Calories & macros:**
  - BMR uses **Mifflin-St Jeor** by default, or **Katch-McArdle** when body fat % is entered.
  - TDEE = BMR × activity multiplier (1.2 / 1.375 / 1.55 / 1.725 / 1.9).
  - Goal adjustment = weekly rate × 7700 kcal ÷ 7 (0.5 kg/week = 550 kcal/day).
  - **Safety floor:** never below max(1500 men / 1200 women, BMR) when cutting, and never above maintenance for a cut. Warnings for underweight users, aggressive paces, and under-18s.
  - Protein is 2.2 g/kg when cutting and 1.8 g/kg otherwise (based on BMI-25 weight if BMI ≥ 30). Fat is 25% of calories (at least 0.6 g/kg). Carbs fill the rest.
- **Splits:** PPL (3-day), PPL ×2 (6-day), Bro Split, Upper/Lower/Arms, Upper/Lower, Full Body. Every split's workouts can be customised (exercises, sets, rep range, rest).
- **Today's workout:** works out where you are in the rotation. Missed days never skip a workout, planned rest days are respected, and you can swap the suggested day.
- **Logging:** pre-filled sets, previous-session column (tap to copy), warm-up sets, auto rest timer with beep and vibration, notes. An in-progress workout survives page reloads.
- **Progressive overload:** double progression. When every set hits the top of the rep range, add 2.5 kg (upper) or 5 kg (lower-body compounds). Otherwise add reps, repeat the weight, or deload 10% after a clear miss.
- **Progress:** weight trend (7-day moving average), e1RM / top-set / volume per lift (Epley), weekly workouts and volume, hard sets per muscle (10–20 target), PR detection with a celebration screen, and a PR timeline.
- **Food tracker:** log meals by photo, by text ("2 eggs, 2 slices toast") or manually. Photos and descriptions are sent to Google Gemini, which returns calories and macros for each item. You can edit them before saving. Shows daily intake against your target and a Monday–Sunday weekly total.
- **Cardio finisher:** every workout ends with a zone-2 session on the treadmill (incline walk), bike or StairMaster, with speed, incline, resistance and heart-rate settings. Leg days get 10 easy minutes instead (flat walk or recovery spin, never the StairMaster). Duration follows your goal: 20 min when cutting, 15 at maintenance, 10 when bulking.
- **Library:** 88 exercises with muscles, equipment and form cues, plus custom exercises.
- **Other:** dark and light themes, JSON data export, a flag for muscles not trained in 7+ days, and a week streak.
- **Tests:** 46 unit tests covering every formula and the training logic (`npm test`).

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests
```

Without Firebase keys, the app runs in **demo mode**: data is saved only in the browser and a banner says so. That's handy for trying the UI.

---

## 1. Set up Firebase (free)

You can reuse the Firebase project you already created for Replit.

1. Go to <https://console.firebase.google.com> and open your project (or **Add project**).
2. **Build → Authentication → Get started.** Enable **Google** and **Email/Password**.
3. **Build → Firestore Database → Create database.** Choose a region close to your users, e.g. `asia-south1` (Mumbai), and start in **production mode**.
4. **Firestore → Rules:** replace the rules with the contents of `firestore.rules` from this repo and click **Publish**. This is what keeps each user's data private.
5. **Project settings (gear icon) → General → Your apps → Web app (</>).** Register it and copy the config values.
6. Copy `.env.example` to `.env` and fill in the values (for local dev).

## 2. Deploy on Vercel (free)

1. Push this folder to a new GitHub repository:
   ```bash
   git init && git add . && git commit -m "Forge gym tracker"
   git branch -M main
   git remote add origin https://github.com/<you>/forge-gym-tracker.git
   git push -u origin main
   ```
2. Go to <https://vercel.com/new> → **Import** the repo. Vercel detects Vite automatically (build: `npm run build`, output: `dist`).
3. Under **Environment Variables**, add the six `VITE_FIREBASE_*` values.
4. Click **Deploy**.
5. Back in Firebase: **Authentication → Settings → Authorized domains → Add domain** with your Vercel domain (e.g. `forge-gym-tracker.vercel.app`). Google sign-in won't work until you do this.

`vercel.json` already handles client-side routing, so refreshing `/progress` works.

## Or deploy on Netlify (free)

1. Push to GitHub as above.
2. Go to <https://app.netlify.com> → **Add new site → Import an existing project** → pick the repo. `netlify.toml` sets the build command and redirects.
3. **Site configuration → Environment variables:** add the six `VITE_FIREBASE_*` values, then trigger a deploy.
4. Add the Netlify domain to Firebase **Authorized domains**.

## Food photo / text estimates

Estimates use Google Gemini (`gemini-3.8-flash`), which has a free tier. There are two ways to provide a key:

- **Each user brings their own key (default).** In the app, open **Profile → Food AI**, paste a free key from <https://aistudio.google.com/app/apikey>, and tap **Save & test key**. The key is stored on that device only, and the browser calls Gemini directly.
- **One shared key for everyone (optional).** Set `GEMINI_API_KEY` in `.env` for local dev, or as a Vercel / Netlify environment variable. Don't use a `VITE_` prefix. Users without their own key then go through `/api/food` (`api/food.ts` on Vercel, `netlify/functions/food.ts` on Netlify), and you pay for their usage once it goes past the free tier.

Without any key, the food tracker still works for manual entries. On the free tier, Google may use prompts (including meal photos) to improve its products.

## Install on a phone

Open the deployed URL. On Android, use Chrome **⋮ → Install app**. On iPhone, use Safari **Share → Add to Home Screen**.

---

## Before you ship to the public

- [ ] Firestore rules published (step 1.4). Test that one account can't read another's data.
- [ ] Authorized domains include your production domain.
- [ ] Add a privacy policy page. You store health-adjacent data (weight, body fat), and app stores and many regions (GDPR, India's DPDP Act) expect one.
- [ ] Consider an "Delete my account & data" button (a Cloud Function or client-side batch delete).
- [ ] In Firebase, enable **App Check** to limit abuse of your free quota.
- [ ] If you set a shared `GEMINI_API_KEY`, also set `VITE_FIREBASE_PROJECT_ID` on the host. `/api/food` only serves signed-in users of your Firebase project, and it refuses every request if that project ID is missing.
- [ ] Spot-check the calorie numbers against a second calculator for a few profiles.

## Project structure

```
src/
  lib/calc.ts         BMI, BMR, TDEE, calorie floor, macros, e1RM, unit conversion, validation
  lib/training.ts     rotation / today's suggestion, progressive overload, PRs, stats
  lib/backend.ts      Firebase (and local demo) data layer
  lib/store.tsx       app state (React context)
  data/exercises.ts   exercise library
  data/splits.ts      split templates
  pages/              Auth, Onboarding, Home, Workout, Progress, Library, Profile
  components/         UI kit, workout editor, rest timer, nutrition cards
firestore.rules       per-user security rules
```
