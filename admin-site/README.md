# Sastra AI Admin Portal

Standalone enterprise administration and telemetry cockpit for **Cambo AI (Sastra AI)**.

## Features
- 📊 **Telemetry & Health**: Live query volumes, latency distributions, model workload breakdown, and system health status.
- 👥 **User Management**: Search registered users, create new user accounts, update system roles (`admin`, `member`, `guest`), and delete users.
- ⚡ **AI Model Engine Hub**: Manage providers (Google Gemini 3.7 Flash, MiniMax M3, Ollama Local), add custom AI model endpoints with API keys, and test live connection latency with instant ping feedback.
- 📜 **Activity Audit Trail**: Real-time trace of user requests, endpoint response times, and HTTP status codes with filtering and export/clear controls.

## Getting Started

```bash
# Run dev server (default port 5174)
npm run dev

# Build for production
npm run build
```
