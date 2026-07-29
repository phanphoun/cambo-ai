# 🇰🇭 CAMBO AI — Cambodia's First AI Assistant

A production-ready, full-stack AI chatbot powered by **Google Gemini 2.0 Flash**. Built with a FastAPI backend and a modern React + TypeScript frontend — designed to demonstrate clean architecture, conversational memory, and a focus on Cambodia's tech ecosystem.

![Status](https://img.shields.io/badge/status-active-success)
![Python](https://img.shields.io/badge/python-3.10+-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green)
![React](https://img.shields.io/badge/React-19-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6)
![License](https://img.shields.io/badge/license-MIT-purple)

---

## ✨ Features

- 🤖 **AI Chat** — Powered by Google Gemini 2.0 Flash
- 🇰🇭 **Cambodia-First** — System prompt prioritizes Khmer tech companies, hubs, and ecosystem
- 💬 **Conversational Memory** — Server-side session history with `/api/chat/{id}` lifecycle
- ⚡ **Smart UX** — Animated typing cursor, auto-scroll, Enter-to-send, Shift+Enter for newline
- 🎨 **Modern UI** — Dark-themed, fully responsive, Tailwind + shadcn/ui components
- 🔌 **RESTful API** — Auto-generated Swagger docs at `/docs`
- 🛡️ **Type-safe** — Pydantic on the backend, TypeScript on the frontend
- 📦 **Clean Architecture** — Services, routes, models separated
- 🚀 **Deploy Anywhere** — Vercel/Netlify (frontend) + Render/Railway (backend)

---

## 🖼️ Demo

> 🎥 *Coming soon — deploy and add your screenshots here*

```
┌─────────────────────────────────────────────┐
│  ⚡ CAMBO AI Assistant          ● Online     │
├─────────────────────────────────────────────┤
│                                             │
│  👤 What is RAG in AI?                      │
│  ┌────────────────────────────────────┐     │
│  │ RAG stands for Retrieval-Augmented │     │
│  │ Generation. It's a technique where │     │
│  │ we retrieve relevant documents...  │     │
│  └────────────────────────────────────┘     │
│                                             │
│  ⚡ Explain it like I'm 5                   │
│  ┌────────────────────────────────────┐     │
│  │ Imagine you have an open-book      │     │
│  │ exam...                            │     │
│  └────────────────────────────────────┘     │
│                                             │
│  [ Message CAMBO AI...                📤 ] │
└─────────────────────────────────────────────┘
```

---

## 🏗️ Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│                 │   HTTP   │                  │   API   │                 │
│  React Frontend │ ◄─────► │  FastAPI Backend │ ◄─────► │  Google Gemini  │
│  (Vite + TS)    │   JSON  │  (Python)        │         │  2.0 Flash      │
│  Redux Toolkit  │         │                  │         │                 │
└─────────────────┘         └──────────────────┘         └─────────────────┘
        │                            │
        │                            │
   Port 5173                    Port 8000
                            (Swagger /docs)
```

### Frontend Structure (`frontend/`)

```
src/
├── components/             # React UI components
│   ├── ui/                 # shadcn/ui primitives (Button, …)
│   ├── ChatInput.tsx       # Auto-resizing textarea + send
│   ├── ChatContainer.tsx   # Message list + typing cursor
│   ├── Sidebar.tsx         # Brand + New Chat + footer
│   ├── Topbar.tsx          # Title + status indicator
│   └── WelcomeScreen.tsx   # Greeting + suggestion chips
├── features/
│   └── chat/
│       ├── chatApi.ts      # RTK Query API (endpoints, hooks)
│       └── chatSlice.ts    # Redux slice (session, messages)
├── lib/utils.ts            # cn() + formatTime() helpers
├── store.ts                # Redux store configuration
├── types/chat.ts           # Shared TS types (Message, ChatRequest…)
├── App.tsx                 # Root component, state orchestration
├── main.tsx                # React entry + Redux Provider
└── index.css               # Tailwind base + design tokens
```

### Backend Structure

```
backend/
├── app.py                  # Main FastAPI app + lifespan
├── config.py               # Environment settings
├── models/
│   └── schemas.py          # Pydantic request/response models
├── services/
│   ├── gemini_service.py   # All Gemini API logic (SRP)
│   └── chat_history.py     # Session memory
├── routes/
│   ├── chat.py             # /api/ask, /api/chat, /api/ask/stream
│   └── health.py           # /, /health
├── requirements.txt
└── .env.example
```

### Why this structure?

- **Separation of concerns** — Routes handle HTTP, services handle business logic
- **React 19** | UI library |
| **TypeScript 5** | Type safety |
| **Vite 8** | Dev server + build tool |
| **Tailwind CSS v3** | Utility-first styling |
| **shadcn/ui** | Accessible component primitives |
| **Redux Toolkit** | State management |
| **RTK Query** | Data fetching + caching |
| **lucide-react** | Icon setteams organize code

---

## 🛠️ Tech Stack

### Backend

| Tool | Purpose |
|---|---|
| **Python 3.10+** | Core language |
| **FastAPI** | Web framework (async, fast, typed) |
| **Pydantic v2** | Data validation & settings |
| **google-genai** | Official Google Gemini SDK |
| **uvicorn** | ASGI server |
| **python-dotenv** | Environment variable management |

### Frontend

| Tool | Purpose |
|---|---|
| **HTML5** | Structure |
| **CSS3** | Styling (custom variables, no framework) |
| **Vanilla JavaScript** | Logic (ES6+, fetch API) |
| **Inter Font** | Typography |

---

## 🚀 Quick Start

### Prerequisites

- Python 3.10 or higher
- A free Google Gemini API key — get one at [aistudio.google.com](https://aistudio.google.com/app/apikey)

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/cambo-ai-assistant.git
cd cambo-ai-assistant
```

### 2. Backend setup

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate        # macOS/Linux
# .venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

Your `.env` should look like:

```env
GEMINI_API_KEY=AIzaSy...your_key_here
APP_NAME=CAMBO AI Assistant
APP_VERSION=1.0.0
DEBUG=True
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

### 3. Run the backend

```bash
uvicorn app:app --reload --port 8000
```

✅ Backend running at: **http://localhost:8000**
📚 API docs at: **http://localhost:8000/docs**

### 4. Frontend setup
npm install
npm run dev
```

✅ Frontend running at: **http://localhost:5173**

Open **http://localhost:5173** in your browser and start chatting! 🎉

To build for production:

```bash
npm run build      # outputs to dist/
npm run preview    # preview the production build
```
```

✅ Frontend running at: **http://localhost:5500**

Open **http://localhost:5500** in your browser and start chatting! 🎉

---

## 📡 API Reference

Base URL: `http://localhost:8000`

### Health & Meta

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Service info |
| `GET` | `/health` | Health check |
| `GET` | `/docs` | Interactive Swagger UI |

### Chat Endpoints

#### `POST /api/ask` — Single Q&A (no memory)

**Request:**

```json
{
  "question": "What is RAG in AI?"
}
```

**Response:**

```json
{
  "answer": "RAG stands for Retrieval-Augmented Generation...",
  "model": "gemini-2.0-flash",
  "tokens_used": 87
}
```

#### `POST /api/chat` — Conversational (with memory)

**Request:**

```json
{
  "message": "What is FastAPI?",
  "session_id": null
}
```

**Response:**

```json
{
  "reply": "FastAPI is a modern Python web framework...",
  "model": "gemini-2.0-flash",
  "session_id": "a3f2b1c4-...",
  "tokens_used": 124
}
```

Send the same `session_id` back on follow-up messages to maintain context.

#### `POST /api/ask/stream` — Streaming (Server-Sent Events)

Streams the response chunk-by-chunk for real-time UX.

#### `DELETE /api/chat/{session_id}` — Clear session

Clears a chat session's history.

---

## 🧪 Testing the API

### Using cURL

```bash
# Single Q&A
curl -X POST http://localhost:8000/api/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "What is Python?"}'

# Conversational
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hi! My name is Phan.", "session_id": null}'
```

### Using the Swagger UI

Visit **http://localhost:8000/docs** and click "Try it out" on any endpoint.

### Using Python

```python
import requests

r = requests.post(
    "http://localhost:8000/api/ask",
    json={"question": "What is FastAPI?"}
)
print(r.json()["answer"])
```

---

## 🌐 Deployment

### Backend → Render (Free)

1. Push your code to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your repo
4. Settings:
   - **Root directory:** `backend`
   - **Build command:** `pip install -r requirements.txt`
   - **Start command:** `uvicorn app:app --host 0.0.0.0 --port $PORT`
5. Add environment variable: `GEMINI_API_KEY = your_key`
6. Click **Deploy** → get a public URL like `https://cambo-ai.onrender.com`

### Frontend → Vercel or Netlify (Free)

**Vercel:**

```bash
cd frontend
npm i -g vercel
vercel
```

**Netlify:**

Drag and drop the `frontend` folder to [netlify.com/drop](https://app.netlify.com/drop)

⚠️ **Important:** After deploying, update `API_BASE` in `frontend/js/app.js` to your backend URL:

```javascript
const API_BASE = 'https://cambo-ai.onrender.com';
```

Then redeploy the frontend.

---

## 🔐 Environment Variables

| Variable | Default | Description |
|---|---|---|
| `GEMINI_API_KEY` | *(required)* | Your Google Gemini API key |
| `GEMINI_MODEL` | `gemini-2.0-flash` | Gemini model to use |
| `GEMINI_TEMPERATURE` | `0.3` | Response creativity (0.0 = focused, 1.0 = creative) |
| `GEMINI_MAX_TOKENS` | `500` | Max response length |
| `ALLOWED_ORIGINS` | `http://localhost:5500,...` | Comma-separated CORS origins |
| `DEBUG` | `True` | Enable auto-reload & debug mode |

---

## 🧠 How It Works

### 1. Conversational Memory

Each chat session gets a unique UUID stored in-memory. When you send a message:

1. Backend retrieves the last 10 turns of history for that session
2. Builds a prompt with: `system + history + new_message`
3. Sends to Gemini
4. Saves the AI's response back to history

> 💡 In production, replace the in-memory dict with **Redis** or a database.

### 2. Streaming

The `/api/ask/stream` endpoint uses Server-Sent Events (SSE) to send chunks of the response as Gemini generates them. This feels **3-5x faster** to users than waiting for the full response.

### 3. System Prompting

The `SYSTEM_PROMPT` in `services/gemini_service.py` defines the AI's:

- **Persona** — "helpful AI assistant for CAMBO"
- **Scope** — web dev, AI, Cambodia-related questions
- **Style** — concise, friendly, EN/Khmer bilingual
- **Constraints** — honest about uncertainty

---

## 🛣️ Roadmap

- [ ] Add **RAG endpoint** — upload PDFs, ask questions about them
- [ ] Add **Redis** for persistent chat history
- [ ] Add **user authentication** (JWT)
- [ ] Add **rate limiting** to prevent abuse
- [ ] Add **Docker** support
- [ ] Add **unit + integration tests**
- [ ] Add **WebSocket** support for true real-time bi-directional streaming
- [ ] Add **multimodal** support (image uploads for Gemini Vision)
- [ ] Add **voice input/output**

---

## 🤝 Contributing

This is a portfolio/interview project, but suggestions are welcome! Feel free to:

1. Fork the project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 👤 Author

**Phan Phoun**

- 🌐 Portfolio: [camdev.site](https://camdev.site)
- 📧 Email: phanphoun855@gmail.com
- 📱 Phone: +855 71 326 6899
- 📍 Phnom Penh, Cambodia

Built with ❤️ as a portfolio project showcasing modern AI engineering skills — featuring FastAPI, Google Gemini, conversational memory, and a production-ready frontend.

---

## 🙏 Acknowledgments

- **Google Gemini** — the AI model powering the assistant
- **FastAPI** — amazing Python web framework
- **Passerelles Numériques Cambodia** — where I learned to code
- The open-source community — for the tools that made this possible

---

<p align="center">
  Made with ⚡ in Phnom Penh, Cambodia 🇰🇭
</p>
