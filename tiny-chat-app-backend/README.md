# Tiny Chat App Backend (NestJS)

Minimal backend chat API built with NestJS + TypeScript.

## Features

- `POST /chat` endpoint with DTO validation
- Global `ValidationPipe` with whitelist/forbid options
- Global rate limiting (`@nestjs/throttler`)
- Basic hardening and runtime middleware (`helmet`, `compression`, JSON body limit)
- Swagger UI at a root path (`/`)
- Health/info endpoints:
  - `GET /ping`
  - `GET /version`

## Tech Stack

- Node.js
- NestJS 11
- TypeScript
- Jest (unit/e2e test setup)
- ESLint + Prettier

## Prerequisites

- Node.js 20+ (recommended)
- npm 10+ (recommended)

## 1. Install Dependencies

```bash
npm install
```

## 2. Environment Configuration

The app requires environment variables at startup.

Required variables:

- `ENV` (`dev`, `test`, `prod`)
- `PORT` (example: `3000`)
- `VERSION` (example: `1.0`)
- `THROTTLE_TTL` in milliseconds (example: `60000`)
- `THROTTLE_LIMIT` max requests per window (example: `5`)

Optional AI variables (OpenAI-compatible):

- `AI_ENABLED` (`true`/`false`, default `false`)
- `AI_API_BASE_URL` (default `https://router.huggingface.co/v1/chat/completions`)
- `AI_API_KEY` (required if `AI_ENABLED=true`)

How to generate `AI_API_KEY` (Hugging Face token):

1. Go to `https://huggingface.co` and sign in (or create an account).
2. Open your profile menu and go to `Settings`.
3. Enter `Access Tokens`.
4. Click `New token`.
5. Set a name (for example: `tiny-chat-app-local`) and grant the READ permission for inference usage.
6. Create the token and copy it immediately.
7. Paste it into `.env`:

```env
AI_API_KEY=hf_xxxxxxxxxxxxxxxxx
```

Hardcoded AI defaults (in code):

- `model`: `Qwen/Qwen2.5-7B-Instruct`
- `timeoutMs`: `20000`
- `maxTokens`: `512`
- `temperature`: `0.7`
- `maxHistoryMessages`: `20`
- `enableRag`: `true`
- `enableWebSearch`: `true`
- `ragTopK`: `3`
- `webSearchTopK`: `3`
- `ragMaxFileBytes`: `120000`

This repository includes sample files:

- `.env`
- `.env.dev`
- `.env.test`
- `.env.prod`

Use one of these approaches:

### Option A: Use existing `.env`

If `.env` is already configured, no extra step is needed.

### Option B: Copy from an environment file

```bash
cp .env.dev .env
```

PowerShell:

```powershell
Copy-Item .env.dev .env
```

## 3. Run the Project

Development mode:

```bash
npm run start:dev
```

Production build + run:

```bash
npm run build
npm run start:prod
```

Default URL (from `.env`): `http://localhost:3000`

Swagger UI: `http://localhost:3000/`

## RAG folder

- Put your knowledge files inside `rag/`
- Nested folders are supported
- Supported by current logic: plain text parsing by lines

## API Usage

### `POST /chat`

Send a message to the bot.

Request body:

```json
{
  "sessionId": "user-1",
  "message": "Hello",
  "systemInstruction": "Answer in short bullets",
  "useRag": true,
  "useWebSearch": false
}
```

Fields:

- `sessionId` string optional. Identifies the conversation thread in memory:
  requests with the same `sessionId` keep context/history, and a different `sessionId`
  starts an independent conversation. If omitted, `"default"` is used.
- `message` string required
- `systemInstruction` string optional
- `useRag` boolean optional (default from code: `true`)
- `useWebSearch` boolean optional (default from code: `true`)

Flag behavior:

- `useRag`: when `true`, the API searches local files in `rag/` and injects relevant context into the prompt.
- `useWebSearch`: when `true`, the API performs web search and injects external snippets into the prompt.
- Both flags can be combined. If both are `false`, the model answers only from conversation context and its base knowledge.

Expected output by flag:

- `useRag: true`, `useWebSearch: false`: response may include `ragSources`, `webSources` should be empty.
- `useRag: false`, `useWebSearch: true`: response may include `webSources`, `ragSources` should be empty.
- `useRag: true`, `useWebSearch: true`: response may include both `ragSources` and `webSources`.

Response:

```json
{
  "sessionId": "user-1",
  "model": "Qwen/Qwen2.5-7B-Instruct",
  "reply": "...",
  "messagesInMemory": 2,
  "ragSources": [
    { "source": "rag/soups/lentil-soup.txt", "line": 1 }
  ],
  "webSources": [
    { "title": "...", "link": "...", "snippet": "..." }
  ]
}
```

To enable real AI replies, set `AI_ENABLED=true` and provide `AI_API_KEY`.

Validation rules:

- `message` is required
- must be a string
- length must be between `3` and `4096`

Example with `curl`:

```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"user-1\",\"message\":\"Hello\",\"systemInstruction\":\"Answer in short bullets\",\"useRag\":true,\"useWebSearch\":false}"
```

PowerShell:

```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:3000/chat" `
  -ContentType "application/json" `
  -Body '{"sessionId":"user-1","message":"Hello","systemInstruction":"Answer in short bullets","useRag":true,"useWebSearch":false}'
```

## Quick tests

Chat request (RAG only):

```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"test-1\",\"message\":\"Give me a pancake recipe\",\"useRag\":true,\"useWebSearch\":false}"
```

Expected:

- Uses local context from `rag/`
- `ragSources` may have entries
- `webSources` should be empty

Chat request (Web search only):

```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"test-2\",\"message\":\"Latest Node.js LTS version\",\"useRag\":false,\"useWebSearch\":true}"
```

Expected:

- Uses web snippets as context
- `webSources` may have entries
- `ragSources` should be empty

Chat request (RAG + Web search):

```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"test-3\",\"message\":\"Compare our internal lentil soup notes with online tips\",\"useRag\":true,\"useWebSearch\":true}"
```

Expected:

- Combines local `rag/` context plus web snippets
- Both `ragSources` and `webSources` may have entries

### `DELETE /chat/:sessionId`

Clear one conversation session from memory.

```bash
curl -X DELETE http://localhost:3000/chat/test-1
```

### `GET /ping`

Returns `pong`.

### `GET /version`

Returns the value of `VERSION` from environment config.

## Available Scripts

- `npm run start` - start app
- `npm run start:dev` - start with watch mode
- `npm run start:debug` - debug + watch mode
- `npm run build` - compile to `dist/`
- `npm run start:prod` - run compiled app
- `npm run lint` - lint and auto-fix
- `npm run format` - format `src` and `test`
- `npm run test` - run unit tests
- `npm run test:watch` - watch tests
- `npm run test:cov` - coverage
- `npm run test:e2e` - e2e tests

## Notes

- Rate limiting applies globally except endpoints decorated with `@SkipThrottle()` (`/ping`, `/version`).
- Swagger is mounted at `/`, so opening the base URL shows the docs UI.
- There is currently no Dockerfile or docker-compose file in this repository.

## Troubleshooting

- App fails at startup with missing env var:
  - ensure `.env` exists and includes all required keys listed above.
- `POST /chat` returns `400`:
  - verify `message` is a string and has at least 3 characters.
