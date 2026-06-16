# iKiguy server

Bun + Fastify backend for the iKiguy AI app. It handles:

- **Email-only auth** — upserts a user in Convex by email.
- **Live transcription** — receives ~5s audio chunks, transcribes each with
  **Gemini**, and accumulates the transcript in Convex.
- **Note generation** — on session finalize, structures the full transcript into
  a clinical note (chief complaint, history, risks, advice, prescription) and
  saves it to Convex.

The mobile app only ever talks to this server. The server talks to Gemini +
Convex.

```
App (Expo)  ──►  Fastify  ──►  Gemini (transcribe + structure)
                    │
                    └────────►  Convex (users, sessions, chunks, notes)
```

## Setup

```bash
cd server
bun install
cp .env.example .env        # fill in GEMINI_API_KEY (and CONVEX_URL after step 2)
```

Requires **ffmpeg** on the host (`brew install ffmpeg`). Phones can't record mp3
natively, so the server transcodes each chunk (m4a → mp3) before sending it to
Gemini. If ffmpeg is missing it falls back to the original audio.

### 1. Gemini key

Create a key at https://aistudio.google.com/apikey and put it in `.env` as
`GEMINI_API_KEY`. Optionally set `GEMINI_MODEL` (default `gemini-2.5-flash`).

### 2. Convex (one-time, interactive login)

```bash
cd server
bunx convex dev          # opens a browser to log in, provisions a deployment,
                         # generates convex/_generated, and prints your URL
```

Copy the printed deployment URL (e.g. `https://xxxx.convex.cloud`) into `.env`
as `CONVEX_URL`. Leave `bunx convex dev` running while developing (it pushes
schema/function changes live).

### 3. Run the API

```bash
bun run dev              # http://localhost:3000 (hot reload)
```

> Note: keep `convex dev` and `bun run dev` running in separate terminals.

## Endpoints

| Method | Path                            | Description                                   |
| ------ | ------------------------------- | --------------------------------------------- |
| GET    | `/health`                       | Service health check                          |
| POST   | `/api/auth/login`               | `{ email }` → upsert user, returns `userId`   |
| POST   | `/api/sessions`                 | `{ userId }` → start a session                |
| POST   | `/api/sessions/:id/chunk?index=N` | multipart `audio` → transcribe + append     |
| POST   | `/api/sessions/:id/finalize`    | `{ durationSec }` → structure + save note     |
| GET    | `/api/sessions/:id`             | Session state                                 |
| GET    | `/api/sessions/:id/note`        | The generated note for a session              |
| GET    | `/api/users/:id/notes`          | A user's notes                                |
| GET    | `/api/visits` … `/api/family`   | Mock content for the other screens            |

## Data model (`convex/`)

- `users` — `{ email, name?, createdAt }`
- `sessions` — `{ userId, status, startedAt, endedAt?, durationSec?, transcript }`
- `chunks` — `{ sessionId, index, text, createdAt }`
- `notes` — structured clinical note linked to a session + user
