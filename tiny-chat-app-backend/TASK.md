# Live-Coding Assignment (Interview Session)

## Goal
Build a **tiny chat application** in two parts—backend (NestJS) and frontend (React)—that lets a user send a message and receive an automated reply.

---

## Part A – Backend (NestJS)

| Requirement | Details |
| :--- | :--- |
| **Route** | `POST /chat` |
| **Request body** | `{ "message": "string" }` (JSON) |
| **Validation** | Reject empty or missing `message` with **400 Bad Request**. |
| **Response** | `{ "reply": "string" }`
For now, use any deterministic reply (e.g., echo the message in uppercase or prefix `"Bot: "`). |
| **Tech constraints** | • **TypeScript only**
• Use NestJS controllers, services, DTOs & `ValidationPipe`.
• No database—everything in memory. |
| **Bonus** | • Simple rate-limit guard (≤ 5 req/min per IP).
• Lightweight `Dockerfile` exposing port `3000`. |

### What we’ll evaluate
1. Project structure (`app.module.ts`, `chat.controller.ts`, `chat.service.ts`).
2. Correct HTTP status codes and DTO validation.
3. Code readability & running commentary while you code.
4. *(Bonus)* Containerization quality.

---

## Part B – Frontend (React)

| Requirement | Details |
| :--- | :--- |
| **Component** | `ChatBox` (React 18+, hooks, TypeScript). |
| **UI** | • Text input + **Send** button.
• Scrollable message area (user on right, bot on left is fine). |
| **Behaviour** | 1. `POST /chat` with the user message.
2. Show “Typing…” while waiting.
3. Append bot reply to conversation.
4. Clear & refocus the input. |
   | **Error handling** | Inline error for 400 (*“Message cannot be empty”*) & network failures (*“Connection lost, please retry”*). |
   | **Styling** | Minimal CSS or Tailwind—no external UI kits needed. |
   | **Bonus** | • Auto-scroll to newest message.
   • Disable **Send** when input is empty.
   • Submit with **Enter** key. |

### What we’ll evaluate
1. Clean state management (`useState`, `useEffect`).
2. Type safety for request/response shapes.
3. Smooth UX & graceful error handling.
4. Code clarity and naming.

⏱ **Suggested time:** 15 min backend + 15 min frontend.

---

# Take-Home Assignment: LLM Integration

> **Objective:** Extend your chat app by connecting it to an LLM service (Google Gemini is free) so users can ask domain-specific questions and get meaningful answers.

### 1. Choose an LLM Provider
* **Google Gemini** preferred.
* OpenAI, Cohere, etc., are fine if you have access.

### 2. Backend Changes (NestJS)
* Create an `LlmService` that forwards the user’s **message** to the LLM and retrieves the answer.
* Use **env vars** (`LLM_API_KEY`, `LLM_MODEL`, etc.)—do **not** hard-code secrets.
* Return the LLM’s reply as `{ "reply": "..." }`.
* Keep existing DTO validation.

### 3. Domain Focus
Prompt the model to act as an **expert in a single topic** of your choice.
* *Examples:* Argentine/Brazilian/Dominican cuisine, front-end testing, classic movies.
* **Constraint:** Off-topic questions should trigger a polite refusal or redirection.

### 4. Frontend Changes (React)
No UI overhaul needed—just display the richer reply and keep the loading indicator.

### 5. Testing
* Supply **three sample questions** (with expected answer snippets) in your README.
* *(Optional)* A Jest test mocking the LLM call.

### 6. Delivery
* Push to a public repo or share a zip.
* Include a concise **README** with setup steps:
    ```bash
    npm install
    docker compose up
    # copy .env.example to .env
    ```

### 7. Bonus Points
* Stream tokens to the client for a “typing” effect.
* Rate-limit to protect your free quota.

🕒 **Deadline:** 48 hours (let us know if you need an extension).

**Good luck—and have fun exploring LLMs!**
 