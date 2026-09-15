# 🚀 SASTRA AI (CAMBO AI) — Free Deployment Guide & Project Review

This document contains a comprehensive architectural review of the **SASTRA AI (CAMBO AI)** ecosystem and detailed step-by-step guides for deploying the complete full-stack platform at **$0 cost** using modern free-tier services.

---

## 🔍 Part 1: Project Architecture & Code Review

### 1. Structure & Tech Stack
* **Backend (`backend/`)**:
  * **Framework**: FastAPI (Python 3.11+) with Uvicorn ASGI server.
  * **Database**: SQLAlchemy 2.0 async engine with `asyncpg` for PostgreSQL, featuring automatic fallback to SQLite (`sqlite+aiosqlite`).
  * **AI Engines**: Multi-provider architecture supporting Google Gemini (via `google-genai`), MiniMax M3 Cloud, local Ollama, and OpenAI-compatible endpoints.
  * **Embeddings & RAG**: Local document chunking and vector search powered by `sentence-transformers/all-MiniLM-L6-v2`.
  * **Export Suite**: ReportLab (PDF generator), `python-docx` (Microsoft Word exporter), Markdown, and CSV tables.
  * **Localization**: `khmerdate` for Khmer lunar calendar and date conversion.
* **Frontends**:
  * **User Chat Portal (`frontend/`)**: React 19, Vite, Redux Toolkit, Tailwind CSS, KaTeX (math formatting), and Lucide icons.
  * **Admin Telemetry Cockpit (`admin-site/`)**: React 19, Vite, real-time analytics, user access management, and AI provider testing.
  * **Public Showcase (`public-sastra/`)**: React 19, Vite, landing and demonstration interface.
* **Test Suite**:
  * Passing 19/19 test cases across architecture, Khmer calendar utilities, RAG services, and tool functions.

### 2. Strengths
* **Sovereign Cambodian Focus**: Dedicated prompt engineering, Khmer lunar calendar calculations, and a built-in Cambodia tech/business sector knowledge base.
* **Resilient Multi-Provider AI Routing**: Failover between Gemini, MiniMax cloud, local Ollama, and registered custom endpoints.
* **Self-Healing Database Initialization**: Automatic table generation and SQLite fallback if PostgreSQL is temporarily unreachable.

### 3. Critical Production Considerations
1. **Memory Footprint for Local RAG**:
   * `sentence-transformers` and PyTorch require ~500MB–800MB RAM.
   * Free host tiers capped at 512MB RAM (such as Render Free) may trigger Out-Of-Memory (OOM) errors during startup.
   * *Mitigation*: Host the backend on platforms with generous free memory (such as **Hugging Face Spaces** with 16 GB RAM), or swap local PyTorch embeddings for the cloud-based **Gemini Embeddings API** (`text-embedding-004`).
2. **Dynamic Configuration Persistence**:
   * In containerized cloud hosts, the local filesystem is ephemeral. Runtime modifications to `.env` will reset upon container restart. Production configurations should be defined as persistent environment variables in your hosting dashboard.
3. **CORS Configuration**:
   * `ALLOWED_ORIGINS` defaults to local ports (`localhost:5173`, `localhost:5174`). Production frontend URLs must be appended.
4. **Ollama Cloud Availability**:
   * Local Ollama (`localhost:11434`) requires local GPU/compute. For cloud deployments, set `DEFAULT_PROVIDER=gemini` or use an external hosted endpoint.

---

## 🛠️ Part 2: Best Free Tools & Hosting Platforms

| Component | Platform | Free Tier Specifications | Why It's Recommended |
| :--- | :--- | :--- | :--- |
| **PostgreSQL Database** | **[Neon.tech](https://neon.tech)** *(Alternative: [Supabase](https://supabase.com))* | 0.5 GB storage, serverless autoscaling, branchable databases. | Native PostgreSQL, zero idle pauses on Neon, fully compatible with `asyncpg`. |
| **Backend API (Option 1 - Best for RAG)** | **[Hugging Face Spaces](https://huggingface.co/spaces)** | **16 GB RAM**, 2 vCPUs, Docker support, HTTPS URL. | Handles PyTorch, sentence-transformers, and document processing without OOM crashes. |
| **Backend API (Option 2 - Standard Web)** | **[Render](https://render.com)** or **[Koyeb](https://koyeb.com)** | 512 MB RAM, 0.1 CPU, automatic Git deployment. | Easy setup directly from GitHub (spins down after 15 minutes of inactivity). |
| **User Frontend (`frontend`)** | **[Vercel](https://vercel.com)** | 100 GB bandwidth/month, Global Edge Network, automatic SSL. | Optimized for Vite/React SPA builds with preview URLs for pull requests. |
| **Admin Site (`admin-site`)** | **[Cloudflare Pages](https://pages.cloudflare.com)** | Unlimited bandwidth, 500 builds/month, instant CDN caching. | Extremely fast global delivery and isolated admin subdomains. |
| **All-in-One Self-Hosted** | **[Oracle Cloud Always Free](https://www.oracle.com/cloud/free/)** + **[Coolify](https://coolify.io)** | Up to 4 ARM vCPUs, 24 GB RAM, 200 GB NVMe disk. | Run your full `docker-compose.yml` (PostgreSQL + FastAPI + All Frontends + Ollama) on a dedicated VM. |

---

## 🚀 Part 3: Step-by-Step Free Deployment Guide

### Architecture Overview

```
                               ┌────────────────────────┐
                               │  Vercel / Cloudflare   │
                               │  (Frontends: 5173/74)  │
                               └───────────┬────────────┘
                                           │ HTTPS API Calls
                                           ▼
                               ┌────────────────────────┐
                               │  Hugging Face / Render │
                               │  (FastAPI Backend)     │
                               └───────────┬────────────┘
                                           │ asyncpg Connection
                                           ▼
                               ┌────────────────────────┐
                               │       Neon.tech        │
                               │  (Serverless Postgres) │
                               └────────────────────────┘
```

---

### Step 1: Provision Managed PostgreSQL on Neon

1. Navigate to [Neon.tech](https://neon.tech) and create a free account.
2. Create a project named `cambo-ai` and select the nearest region (e.g., Singapore `ap-southeast-1` for Southeast Asia).
3. Copy your connection URI from the dashboard:
   ```text
   postgresql://username:password@ep-xyz-123456.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```
4. Update the protocol prefix for SQLAlchemy's async driver:
   ```text
   postgresql+asyncpg://username:password@ep-xyz-123456.ap-southeast-1.aws.neon.tech/neondb
   ```

---

### Step 2: Deploy the FastAPI Backend

#### Method A: Hugging Face Spaces (Recommended for RAG & ML)

1. Go to [Hugging Face Spaces](https://huggingface.co/new-space).
2. Enter a Space name (e.g., `sastra-ai-backend`), set License to `MIT`, and choose **Docker** (Blank).
3. In Space Settings -> **Variables and Secrets**, define:
   * `DATABASE_URL`: Your `postgresql+asyncpg://...` Neon connection string.
   * `GEMINI_API_KEY`: Your Google Gemini API key.
   * `JWT_SECRET`: A secure random key (e.g. run `openssl rand -hex 32`).
   * `ALLOWED_ORIGINS`: `https://your-frontend.vercel.app,https://your-admin.pages.dev`
   * `DEFAULT_PROVIDER`: `gemini`
4. Create a `Dockerfile` in the root of your space (or push the `backend/` folder contents):
   ```dockerfile
   FROM python:3.11-slim
   WORKDIR /app
   COPY requirements.txt .
   RUN pip install --no-cache-dir -r requirements.txt
   COPY . .
   EXPOSE 7860
   CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]
   ```
5. Your backend will be accessible at: `https://<your-username>-sastra-ai-backend.hf.space`

#### Method B: Render (Standard Web Service)

1. Connect your GitHub repository on [Render](https://dashboard.render.com).
2. Create a **Web Service**:
   * **Root Directory**: `backend`
   * **Environment**: `Python 3`
   * **Build Command**: `pip install -r requirements.txt`
   * **Start Command**: `uvicorn app:app --host 0.0.0.0 --port $PORT`
3. Add your Environment Variables (`DATABASE_URL`, `GEMINI_API_KEY`, `JWT_SECRET`, `ALLOWED_ORIGINS`).

---

### Step 3: Deploy the Frontends

#### 1. User Portal (`frontend/`) on Vercel
1. Log in to [Vercel](https://vercel.com) and click **Add New Project**.
2. Select your repository and configure:
   * **Framework Preset**: Vite
   * **Root Directory**: `frontend`
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
3. Under **Environment Variables**, add:
   * `VITE_API_BASE`: Your deployed backend URL (e.g., `https://<your-username>-sastra-ai-backend.hf.space` without a trailing slash).
4. Click **Deploy**.

#### 2. Admin Portal (`admin-site/`) on Cloudflare Pages
1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com) and go to **Workers & Pages**.
2. Click **Create Application** -> **Pages** -> **Connect to Git**.
3. Select your repository and configure:
   * **Project Name**: `sastra-ai-admin`
   * **Framework Preset**: Vite
   * **Root Directory**: `admin-site`
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
4. Add the Environment Variable:
   * `VITE_API_BASE`: Your deployed backend URL.
5. Save and Deploy.

---

### Step 4: Final Verification Checklist

- [ ] **Backend Health Check**: Open `https://<backend-url>/api/health` and verify `{"status": "ok"}` response.
- [ ] **Database Migration**: Verify that users and provider tables are automatically created on Neon upon first startup.
- [ ] **CORS Settings**: Confirm `ALLOWED_ORIGINS` in backend includes your production Vercel and Cloudflare Pages URLs.
- [ ] **AI Assistant Test**: Log in through the Vercel frontend, send a query, and verify streaming output from Gemini.
- [ ] **Document Generation**: Test PDF/DOCX export commands (`/techstartups`, or document generation prompts) to verify file compilation in the cloud environment.
