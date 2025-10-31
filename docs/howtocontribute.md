# How to Contribute

Thank you for wanting to contribute to AREA-51. This document explains the project's structure, how to get the code running locally, branch & PR workflow, coding style, testing and how to add new services (server-side). Follow these guidelines to make your contributions easier to review and merge.

## Quick start

- Clone the repository:

```bash
git clone git@github.com:Jocelyn-JE/AREA-51.git
cd AREA-51
```

- Install dependencies and run the different parts (see below for per-component instructions).

## Repository layout (relevant folders)

- `server/` — Node/TypeScript backend (Express + services). Environment config in `server/.env`.
- `web_client/` — Frontend (React / Vite / TypeScript).
- `mobile_client/` — Flutter mobile app.
- `docs/` — Documentation, including this file.
- `pocs/` — Proof-of-concept client code for quick experiments.

There are also `build/` and `tests/` folders which contain build artifacts and integration/unit tests.

## Local setup

Prerequisites

- Node.js (v18+ recommended) and npm
- Git
- For mobile changes: Flutter SDK
- MongoDB (local or a dev instance)

Server

1. Copy or review `server/.env` and set the required environment variables (client IDs, secrets, DB credentials). A working `.env` is required for OAuth flows and DB access.
2. Install and run:

```bash
cd server
npm install
# Start the server (dev)
npm start
```

The server logs show Swagger docs at `http://localhost:3000/api-docs` by default.

Web client

```bash
cd web_client
npm install
# start the dev server (Vite)
npm run dev
```

Mobile client (Flutter)

```bash
cd mobile_client
flutter pub get
# run on an emulator or device
flutter run
```

---

## Branching & pull request workflow

- Branch naming: prefer `feature/<short-descriptor>`, `fix/<issue>`, or `chore/<task>`.
- Open a PR against `main`. Add a descriptive title + short summary of what changed and why.
- Assign reviewers and link relevant issue or ticket.
- Use the repository's PR template (if available).

## Commit messages and style

- The project commonly uses emoji prefixes in commits (see history). Use short, descriptive commit messages.
- Keep commit messages in the imperative mood (e.g., `Add Outlook service`).

## Merging

- Changes are merged via PRs after at least one approval and a green CI (if applicable).

---

## Code style and linting

- Follow existing TypeScript style in the codebase. If ESLint/Prettier configs are present, run them locally before opening PRs.
- Format code and run TypeScript checks where appropriate.

## Testing

- Unit and integration tests live in `server/tests` and other package-specific test folders. Run `npm test` in the package you changed if tests are configured.
- For Flutter changes run `flutter test` in `mobile_client`.

## How to add or update a service (server-side)

Services live under `server/src/services`. The project exposes a service registry in `server/src/services/index.ts` where each service is registered and exported.

To add a new service:

1. Create a new file `server/src/services/<your-service>.ts`.
2. Implement a class extending `BaseService` and provide a name, actions and reactions. Actions should be small polling/trigger checks, reactions implement side effects.
3. Export and register the new service in `server/src/services/index.ts` by adding it to the `serviceRegistry` map.

Example skeleton (high-level):

```ts
export class MyService extends BaseService {
 constructor() {
  const actions = [ /* Action[] */ ];
  const reactions = [ /* Reaction[] */ ];
  super("My Service", actions, reactions);
 }
 async initialize() { /* optional */ }
}

// register in services/index.ts:
// ["My Service", new MyService()] 
```

See existing services such as `GmailService` and `OutlookService` for examples of actions/reactions and how OAuth tokens are consumed via `ServiceExecutionContext`.

## Pull request checklist

- [ ] Code builds and runs locally
- [ ] Tests added/updated or an explanation provided if not applicable
- [ ] Linted / formatted
- [ ] PR description includes testing instructions

## Debugging & common tasks

- If an OAuth flow returns `401` or token exchange errors, confirm your app registration settings (redirect URI, client id/secret, scopes) and that the token exchange body is `application/x-www-form-urlencoded`.
- If builds fail due to signing (Android), check `mobile_client/android/app/key.properties` and `mykeystore.jks`. The repo currently signs debug/profile with the release keystore — use separate debug signing when developing locally.

---
Last updated: 2025-10-31
