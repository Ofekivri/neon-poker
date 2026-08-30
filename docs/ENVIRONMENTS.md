# Environments

The app runs in three environments. Each one talks to **its own Firebase
project**, so testing in QA can never touch real game data.

| Environment | Git branch | URL | Firebase project |
| --- | --- | --- | --- |
| Production | `main` | https://neon-poker.vercel.app | `neon-poker-45a0b` |
| QA | `qa` | `neon-poker-git-qa-<team>.vercel.app` | *(create — see below)* |
| Local | — | `localhost:5173` | QA project |

Feature branches also get their own Vercel preview URL. Those use whatever
env vars are set for Vercel's **Preview** scope, which should be the QA
project — so previews are safe to click through too.

## How config reaches the app

`src/lib/firebase.ts` reads the Firebase config from `VITE_FIREBASE_*`
environment variables. There is **no fallback**: if a variable is missing the
app throws on startup with a message naming what's absent.

That is deliberate. A fallback would mean a misconfigured QA deploy silently
writes to the production database — the exact failure this setup exists to
prevent. A loud crash is recoverable in a minute; corrupted production data
is not.

`VITE_APP_ENV` drives the banner at the top of the screen. Anything other
than `production` shows an amber bar naming the environment and the Firebase
project it is connected to.

## Setup

### 1. Create the QA Firebase project

In the [Firebase Console](https://console.firebase.google.com):

1. **Add project** — name it something like `neon-poker-qa`.
2. **Build > Firestore Database > Create database.** Pick the same region as
   production.
3. **Build > Authentication > Get started**, and enable the same sign-in
   providers production uses (Email/Password).
4. **Project settings > General > Your apps > Add app > Web.** Copy the
   config object it shows you — those are the values for step 2.

If production has Firestore security rules, apply the same ones to QA.
Otherwise QA will behave differently from production in ways that hide bugs.

### 2. Set the Vercel environment variables

In **Vercel > neon-poker > Settings > Environment Variables**, add each
variable below. Vercel lets you scope a variable to Production, Preview,
and Development independently — that scoping is what separates the
environments.

| Variable | Production scope | Preview scope |
| --- | --- | --- |
| `VITE_FIREBASE_API_KEY` | prod project | QA project |
| `VITE_FIREBASE_AUTH_DOMAIN` | prod project | QA project |
| `VITE_FIREBASE_PROJECT_ID` | `neon-poker-45a0b` | `neon-poker-qa` |
| `VITE_FIREBASE_STORAGE_BUCKET` | prod project | QA project |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | prod project | QA project |
| `VITE_FIREBASE_APP_ID` | prod project | QA project |
| `VITE_APP_ENV` | `production` | `qa` |

The production values are the ones that used to be hardcoded in
`src/lib/firebase.ts` — recover them from git history if needed:

```
git show 25ce069:src/lib/firebase.ts
```

> **Order matters.** Set the Production-scoped variables *before* merging
> this change to `main`. The app now requires them, so merging first would
> take production down until they exist.

### 3. Authorise the QA domain for sign-in

In the QA Firebase project: **Authentication > Settings > Authorized
domains**, add the QA deploy domain
(`neon-poker-git-qa-<team>.vercel.app`). Without this, sign-in fails on QA
with an `auth/unauthorized-domain` error.

### 4. Local development

```bash
cp .env.example .env
# fill in with the QA project's values
npm run dev
```

`.env` is gitignored. Use QA values locally — never production's.

## Workflow

```
feature branch  ──PR──>  qa  ──PR──>  main
   preview URL           QA URL       production
```

1. Branch off `qa`, open a PR into `qa`. Vercel builds a preview.
2. Merge to `qa`, verify on the QA URL against QA data.
3. Open a PR from `qa` into `main` to release.

The `qa` branch is long-lived — never delete it, and never force-push it.
