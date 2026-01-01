# LLM Basic Chatbot

A minimal web-based chatbot that proxies user messages to an LLM (OpenAI Responses API), stores conversations in a local SQLite database, and serves a simple frontend. Use this repository as a starting point for building or experimenting with LLM-powered chat interfaces.

## Features

- Express backend with endpoints for chat, loading conversations, recent chats, and clearing sessions.
- Session-safe in-memory conversation state with optional SQLite persistence (`chat.db`).
- Minimal static frontend served from `public/index.html`.
- Uses the OpenAI Responses API (requires `OPENAI_API_KEY`).

## Prerequisites

- Node.js v18+ (or a recent Node 18/20 runtime)
- npm (comes with Node.js)
- An OpenAI API key with access to the Responses API

## Quick Start

1. Clone the repo and change into the project directory:

```bash
git clone https://github.com/<your-username>/llm-basic-chatbot.git
cd llm-basic-chatbot
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the project root with your OpenAI API key:

```text
OPENAI_API_KEY=sk-REPLACE_ME
```

4. Start the server:

```bash
npm start
# or during development (auto-restarts)
npm run dev
```

5. Open the frontend in your browser:

http://localhost:3000

The server uses port `3000` by default.

## Configuration

- `OPENAI_API_KEY` (required) — place in a local `.env` file. Never commit real API keys.
- `chat.db` — SQLite database file created automatically to persist messages. You can remove it to reset stored conversations.

## API Endpoints

All endpoints are implemented in `server.js`.

- `POST /chat`
	- Request JSON: `{ "message": "your message" }`
	- Optional header: `x-session-id` — use to continue an existing session. The server returns `x-session-id` in the response headers when a new session is created.
	- Response JSON: `{ "reply": "assistant reply text" }`

- `GET /load-all`
	- Returns the full conversation for the session as a JSON array. If `x-session-id` is missing or unknown, returns `[]`.

- `GET /recent-chats`
	- Returns a short list of recent user messages for quick previews (requires `x-session-id`).

- `POST /clear`
	- Clears the in-memory conversation and deletes persisted messages for the provided `x-session-id`.

Example `curl` request:

```bash
curl -X POST http://localhost:3000/chat \
	-H "Content-Type: application/json" \
	-d '{"message":"Hello"}'
```

## Project Structure

- `server.js` — main Express server and endpoint handlers
- `db.js` — SQLite database initialization and export
- `public/` — static frontend files (`index.html`)
- `chat.db` — SQLite database file (auto-created)
- `package.json` — npm scripts and dependencies

## Development

- Start with `npm run dev` for automatic reloads via `nodemon`.
- Keep your `.env` file local and use `.env.example` in the repo (do not commit `.env`).

## Security & Privacy

- Do not commit your `.env` or any API keys to source control. Add `.env` to `.gitignore`.
- The app stores conversation content in `chat.db`. Treat this file as sensitive if it may contain private data.

## Troubleshooting

- If the server cannot reach the OpenAI API, ensure `OPENAI_API_KEY` is set and network access is available.
- If you see `fetch` errors in `server.js`, confirm your Node version supports the global `fetch` API or install a fetch polyfill.

## Tests

This project currently has no automated tests. Add tests around `server.js` handlers and DB interactions as needed.

## Contributing

Contributions are welcome. Please open issues or PRs for bug fixes, improvements, or feature requests.

## License

Add a `LICENSE` file to declare how you want to license this project. No license is included by default.

## Contact

If you need help, open an issue in this repository.
