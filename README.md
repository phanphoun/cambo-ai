# 🇰🇭 SASTRA AI (CAMBO AI) — Cambodia's Sovereign Intelligence Platform

A production-ready, full-stack sovereign AI intelligence ecosystem powered by **Google Gemini 3.7 Flash**, **MiniMax M3 Cloud**, and **Local Ollama Engines**. Features a FastAPI backend with **PostgreSQL**, **JWT Authentication**, a **React 19 User Chat Portal**, and a standalone **Enterprise Admin Telemetry & Model Management Portal**.

![Status](https://img.shields.io/badge/status-active-success)
![Python](https://img.shields.io/badge/python-3.11+-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.141+-green)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)
![React](https://img.shields.io/badge/React-19-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-6+-3178c6)
![Docker](https://img.shields.io/badge/Docker-compose-2496ed)
![License](https://img.shields.io/badge/license-MIT-purple)

---

## 🏛️ System Architecture

```
                                  ┌─────────────────────────────────────────┐
                                  │           SASTRA AI CLIENTS             │
                                  └────────────────────┬────────────────────┘
                                                       │
                           ┌───────────────────────────┴───────────────────────────┐
                           ▼                                                       ▼
        ┌─────────────────────────────────────┐                 ┌─────────────────────────────────────┐
        │       User Chat Workspace           │                 │      Admin Telemetry Cockpit        │
        │   (frontend/ — Port 5173)           │                 │   (admin-site/ — Port 5174)         │
        │  React 19 + Redux + Khmer Theme     │                 │  React 19 + Real-Time Telemetry     │
        └──────────────────┬──────────────────┘                 └──────────────────┬──────────────────┘
                           │                                                       │
                           └───────────────────────────┬───────────────────────────┘
                                                       ▼
                                        ┌─────────────────────────────┐
                                        │       FastAPI Backend       │
                                        │   (backend/ — Port 8001)    │
                                        │  Auth + Telemetry + RAG     │
                                        └──────────────┬──────────────┘
                                                       │
                ┌──────────────────────────────────────┼──────────────────────────────────────┐
                ▼                                      ▼                                      ▼
┌─────────────────────────────┐        ┌─────────────────────────────┐        ┌─────────────────────────────┐
│    PostgreSQL 16 Database   │        │     AI Model Provider Hub   │        │    Vector Store & RAG       │
│  (Docker — Port 5432)       │        │  • Gemini 3.7 Flash         │        │  • 384-dim Embeddings       │
│  • Users & RBAC             │        │  • MiniMax M3 Cloud         │        │  • Document Chunking        │
│  • Custom AI Endpoints      │        │  • Ollama Local Engine      │        │  • Web Search Grounding     │
│  • Audit & Telemetry Logs   │        │  • Custom LLMs (OpenAI/etc) │        │  • Cambodia Sector DB       │
└─────────────────────────────┘        └─────────────────────────────┘        └─────────────────────────────┘
```

---

## ✨ Core Highlights & Features

### 1. 🤖 Sovereign AI Multi-Provider Engine
- **Google Gemini 3.7 Flash**: High-speed reasoning with multimodal vision & Google Web Grounding.
- **MiniMax M3 / Cloud AI**: High-throughput reasoning cluster for deep technical code generation.
- **Ollama Local Engine**: 100% offline, zero cloud egress running open-source weights (`localhost:11434`).
- **Custom Provider Registration**: Add OpenAI, DeepSeek, Claude, or custom self-hosted inference servers on the fly.

### 2. 🔐 Authentication & Role-Based Access (RBAC)
- **PBKDF2-HMAC-SHA256** salted password hashing (100,000 rounds).
- **HMAC-SHA256 JSON Web Tokens (JWT)** with 7-day session validity.
- **1-Click Demo Guest Mode** for instant access without registration friction.
- Roles: `admin`, `member`, `guest`.

### 3. 👥 Standalone Admin Telemetry Cockpit (`admin-site/`)
- **User Management**: Search user accounts, promote/demote roles, delete accounts, or create new users.
- **AI Model Hub**: Manage AI engines, add custom API endpoints, and execute live **Connection Ping Tests** with real-time latency (`ms`) feedback.
- **Live Telemetry & Workload Distribution**: Real-time charts of invocations, average latency, tokens processed, error rate, and provider workload share.
- **Activity Audit Trail**: Filterable event log tracing all user actions, endpoints, status codes, and latencies.

### 4. 📄 AI Document Generation Engine
- **Multi-Format Export**: Generate professional **PDF** reports with Sastra branding & page numbering, formatted Microsoft Word (**`.docx`**) proposals, **Markdown** briefs, and **CSV** data tables.
- **Natural Language Triggering**: Simply prompt the AI: *"Generate a PDF report on Cambodia tech startups"* or *"Create a Word document proposal for my app"* — the AI invokes the `generate_document` tool and renders an interactive Download Card directly in chat.
- **1-Click Message Export**: Export any assistant response to PDF, DOCX, or Markdown using the **Export** menu on each message bubble.

### 5. 💬 User Chat Experience (`frontend/`)
- **Khmer Sanctuary Theme**: Dark Basalt & Sacred Gold aesthetics with Khmer Lotus medallions and Kbach corners.
- **Slash Commands (`/`)**: Type `/` to open an autocomplete command palette for sectors (`/techstartups`, `/fintech`, `/ecommerce`), verified companies (`/skai`, `/koompi`, `/bakong`), and AI modes.
- **Keyboard Shortcuts**: <kbd>Ctrl + B</kbd> / <kbd>Cmd + B</kbd> to toggle the sidebar smoothly with global capture.
- **RAG & Multimodal**: Upload PDFs, documents, or drop images for instant OCR and grounded answers.

---

## 🚀 Quick Start Guide

### 1. Start Database & pgAdmin (Docker)

```bash
# Start PostgreSQL 16, pgAdmin 4, and Adminer in background
docker compose up -d
```

| Service | URL / Port | Credentials |
| :--- | :--- | :--- |
| **PostgreSQL 16** | `localhost:5432` | User: `postgres` / Pass: `password123` / DB: `cambo_ai` |
| **pgAdmin 4** | [http://localhost:5050](http://localhost:5050) | Email: `admin@sastra.ai` / Pass: `admin` |
| **Adminer UI** | [http://localhost:8088](http://localhost:8088) | Server: `postgres` / Pass: `password123` |

---

### 2. Start FastAPI Backend

```bash
cd backend

# Install dependencies with uv (or pip)
uv pip install -r requirements.txt

# Start backend server with auto-reload (port 8001)
uv run uvicorn app:app --reload --port 8001
```

> **API Documentation (Swagger)**: [http://localhost:8001/docs](http://localhost:8001/docs)

---

### 3. Start User Chat Portal (Frontend)

```bash
cd frontend

# Install dependencies (if not already installed)
npm install

# Start Vite dev server (port 5173)
npm run dev
```

> **User Chat Portal**: [http://localhost:5173](http://localhost:5173)

---

### 4. Start Standalone Admin Portal (`admin-site`)

```bash
cd admin-site

# Start Admin Vite dev server (port 5174)
npm run dev
```

> **Admin Portal**: [http://localhost:5174](http://localhost:5174)

---

## 🗄️ PostgreSQL Database Schema

```sql
-- Users & Credentials
CREATE TABLE users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(128) UNIQUE NOT NULL,
    name VARCHAR(128) NOT NULL,
    password_hash VARCHAR(256) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'member', -- 'admin', 'member', 'guest'
    avatar VARCHAR(512),
    created_at DOUBLE PRECISION NOT NULL,
    updated_at DOUBLE PRECISION NOT NULL
);

-- Custom AI Providers & Endpoints
CREATE TABLE custom_providers (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    type VARCHAR(32) NOT NULL DEFAULT 'custom',
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    base_url VARCHAR(512) NOT NULL,
    model VARCHAR(128) NOT NULL,
    api_key VARCHAR(512),
    latency_ms DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    description TEXT,
    created_at DOUBLE PRECISION NOT NULL
);

-- Real-Time Telemetry & Audit Logs
CREATE TABLE activity_logs (
    id VARCHAR(64) PRIMARY KEY,
    timestamp DOUBLE PRECISION NOT NULL,
    action VARCHAR(128) NOT NULL,
    user_email VARCHAR(128) NOT NULL,
    provider VARCHAR(64) NOT NULL DEFAULT 'gemini',
    status_code INTEGER NOT NULL DEFAULT 200,
    latency_ms DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    tokens_est INTEGER NOT NULL DEFAULT 0,
    details TEXT
);
```

---

## 🛠️ Environment Configuration (`backend/.env`)

```env
APP_NAME=SASTRA AI Assistant
APP_VERSION=1.0.0
DEBUG=True
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174

# --- PostgreSQL Connection ---
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/cambo_ai

# --- AI Providers & API Keys ---
DEFAULT_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here

# Ollama Local Engine
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=gemma4:latest

# Ollama Cloud / MiniMax
OLLAMA_CLOUD_BASE_URL=http://localhost:11434
OLLAMA_CLOUD_MODEL=minimax-m3:cloud

# Web Grounding (Tavily)
TAVILY_API_KEY=your_tavily_api_key_here
TAVILY_SEARCH_DEPTH=basic
TAVILY_MAX_RESULTS=5
```

---

## 📂 Project Repository Structure

```
cambo-ai/
├── docker-compose.yml             # PostgreSQL 16 + pgAdmin 4 + Adminer
├── README.md                      # Complete system documentation
│
├── backend/                       # FastAPI Backend
│   ├── app.py                     # App entry point & telemetry middleware
│   ├── config.py                  # Pydantic environment configuration
│   ├── .env                       # Active backend environment variables
│   ├── .env.example               # Template environment configuration
│   ├── requirements.txt           # Python dependencies
│   ├── database/
│   │   ├── models.py              # SQLAlchemy 2.0 async ORM models
│   │   └── session.py             # PostgreSQL session factory & auto-migration
│   ├── models/
│   │   └── schemas.py             # Pydantic request/response schemas
│   ├── providers/
│   │   ├── base.py                # Abstract provider interface
│   │   ├── factory.py             # Provider registry & instantiation
│   │   ├── gemini_provider.py     # Google Gemini implementation
│   │   └── ollama_provider.py     # Ollama local/cloud implementation
│   ├── prompts/
│   │   ├── builder.py             # System prompt assembly
│   │   ├── cultural_rules.py      # Khmer cultural enrichment rules
│   │   └── mode_prompts.py        # Per-mode prompt templates
│   ├── routes/
│   │   ├── auth.py                # Register, login, guest, profile endpoints
│   │   ├── admin.py               # Admin user CRUD, provider management, telemetry
│   │   ├── chat.py                # Streaming chat completions & tools
│   │   ├── documents.py           # Document uploads & RAG queries
│   │   ├── tools.py               # Function-calling tool definitions
│   │   └── health.py              # System health check
│   ├── services/
│   │   ├── auth_service.py        # PBKDF2 hashing & JWT tokens
│   │   ├── chat_service.py        # Chat orchestration & intent classification
│   │   ├── chat_history.py        # Conversation persistence
│   │   ├── doc_generator.py       # PDF/DOCX/Markdown generation
│   │   ├── embeddings.py          # Sentence-transformer embedding engine
│   │   ├── gemini_service.py      # Gemini API streaming client
│   │   ├── image_service.py       # Image generation & OCR
│   │   ├── ollama_service.py      # Ollama API streaming client
│   │   ├── provider_manager.py    # Multi-provider routing (Gemini/Ollama)
│   │   ├── rag_service.py         # Vector similarity search
│   │   ├── rag_context.py         # RAG context assembly
│   │   ├── rag_store.py           # Chunk storage & index
│   │   ├── telemetry_service.py   # In-memory & DB telemetry tracker
│   │   ├── tool_runner.py         # Tool execution engine
│   │   ├── tools.py               # Tool implementations
│   │   └── user_chat_store.py     # Per-user chat persistence
│   └── tests/
│       ├── test_architecture.py   # Prompt builder & provider tests
│       ├── test_rag.py            # RAG pipeline tests
│       └── test_tools.py          # Tool definition & execution tests
│
├── frontend/                      # User Chat Application (Port 5173)
│   ├── src/
│   │   ├── components/            # ChatContainer, ChatInput, Topbar, Sidebar
│   │   │   ├── ChatContainer.tsx  # Message bubbles, lightbox, code blocks
│   │   │   ├── ChatInput.tsx      # Input composer with slash commands
│   │   │   ├── SettingsModal.tsx  # Profile, provider, privacy settings
│   │   │   ├── Sidebar.tsx        # Conversation history & navigation
│   │   │   ├── Topbar.tsx         # Top header bar
│   │   │   └── ui/               # Reusable UI primitives (Button, etc.)
│   │   ├── features/
│   │   │   ├── auth/              # Auth slice, RTK Query api, AuthModal
│   │   │   ├── chat/              # Chat API & state
│   │   │   ├── conversations/     # Saved conversation history
│   │   │   ├── directory/         # Cambodia 58-company sector directory
│   │   │   ├── documents/         # RAG document uploads & management
│   │   │   ├── modes/             # AI mode switching (chat/translate/code/search)
│   │   │   ├── pin/               # Message pinning & bookmarks
│   │   │   ├── provider/          # AI provider state & model selection
│   │   │   ├── share/             # Conversation sharing
│   │   │   └── theme/            # Theme persistence
│   │   ├── App.tsx                # Main app orchestration
│   │   └── store.ts               # Redux store
│   └── package.json
│
└── admin-site/                    # Standalone Admin Portal (Port 5174)
    ├── src/
    │   ├── components/
    │   │   ├── AdminAuthGate.tsx  # Admin login & auth guard
    │   │   ├── TelemetryView.tsx  # Workload charts & performance stats
    │   │   ├── UsersView.tsx      # User management & role control
    │   │   ├── ProvidersView.tsx  # AI model endpoints & connection test
    │   │   ├── LogsView.tsx       # Live audit activity trace
    │   │   ├── Sidebar.tsx        # Admin navigation sidebar
    │   │   └── Topbar.tsx         # Admin header bar
    │   ├── services/api.ts        # Admin REST API client
    │   └── App.tsx                # Admin cockpit layout & navigation
    └── package.json
```

---

## 📜 License

Distributed under the **MIT License**. Built with pride for Cambodia's sovereign technology ecosystem.
