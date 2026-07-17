# 🌐 PolyGlot — PDF Translation System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Last Commit](https://img.shields.io/github/last-commit/jeffersonmello/PolyGlot)](https://github.com/jeffersonmello/PolyGlot/commits)
[![Issues](https://img.shields.io/github/issues/jeffersonmello/PolyGlot)](https://github.com/jeffersonmello/PolyGlot/issues)
[![Stars](https://img.shields.io/github/stars/jeffersonmello/PolyGlot?style=social)](https://github.com/jeffersonmello/PolyGlot/stargazers)

A full-stack web application that translates PDF documents from one language to another while preserving layout, formatting, and visual structure.

## 📚 Table of Contents

- [✨ Features](#-features)
- [🖥 Tech Stack](#-tech-stack)
- [🚀 Quick Start](#-quick-start)
- [🐳 Docker Deployment](#-docker-deployment)
- [⚙️ Configuration](#️-configuration)
- [🔌 Translation Provider Priority](#-translation-provider-priority)
- [📡 API Reference](#-api-reference)
- [🧪 Testing and Validation](#-testing-and-validation)
- [📁 Project Structure](#-project-structure)
- [🔒 Privacy & Security](#-privacy--security)
- [🗺 Roadmap](#-roadmap)
- [📄 License](#-license)

---

## ✨ Features

- **35+ supported languages** with auto-detection
- **Preserve formatting** — fonts, sizes, colors, and layout
- **Preserve images, tables & charts** positions
- **Mixed-language handling** for multilingual documents
- **Citation preservation** options
- **Batch processing** for multiple PDFs
- **Translation history** with download links
- **Real-time upload progress** with status polling
- **Provider fallback chain** — DeepL → OpenAI → Mock
- **Docker-ready** deployment
- **Privacy-first** processing with cleanup

---

## 🖥 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Vite |
| Backend | Node.js 20 + Express + TypeScript |
| PDF Extract | pdf-parse |
| PDF Generate | pdf-lib |
| Translation | DeepL API / OpenAI API / Mock |
| HTTP Client | Axios |
| Styling | Pure CSS |
| Containerisation | Docker + Docker Compose |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 20+** and **npm 10+**
- (Optional) [DeepL API key](https://www.deepl.com/pro-api) or [OpenAI API key](https://platform.openai.com/api-keys)

### 1) Clone

```bash
git clone https://github.com/jeffersonmello/PolyGlot.git
cd PolyGlot
```

### 2) Configure backend environment

```bash
cp backend/.env.example backend/.env
# Optional: add DEEPL_API_KEY and/or OPENAI_API_KEY
```

### 3) Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 4) Run in development mode

Open two terminals:

```bash
# Terminal 1: backend
cd backend
npm run dev
# http://localhost:3001

# Terminal 2: frontend
cd frontend
npm run dev
# http://localhost:5173
```

Open **http://localhost:5173**.

---

## 🐳 Docker Deployment

```bash
cp backend/.env.example backend/.env
# Optional: add API keys

docker compose up --build
```

App URL: **http://localhost**

Stop services:

```bash
docker compose down
```

---

## ⚙️ Configuration

### Backend (`backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Backend HTTP port |
| `NODE_ENV` | `development` | Runtime environment |
| `FRONTEND_URL` | `http://localhost:5173` | Allowed CORS origin |
| `UPLOAD_DIR` | `./uploads` | Temporary upload directory |
| `OUTPUT_DIR` | `./outputs` | Translated PDF output directory |
| `MAX_FILE_SIZE` | `52428800` (50 MB) | Maximum upload size in bytes |
| `LOG_LEVEL` | `info` | Winston log level |
| `DEEPL_API_KEY` | _(empty)_ | DeepL API key |
| `DEEPL_API_URL` | `https://api-free.deepl.com/v2` | DeepL endpoint |
| `OPENAI_API_KEY` | _(empty)_ | OpenAI API key |

### Frontend (`frontend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:3001/api` | Backend API URL |

---

## 🔌 Translation Provider Priority

Provider order:

1. **DeepL** (`DEEPL_API_KEY` set)
2. **OpenAI** (`OPENAI_API_KEY` set)
3. **Mock** (always available, prefixes output with `[XX]`)

---

## 📡 API Reference

### Health Check

```http
GET /health
```

### List Languages

```http
GET /api/languages
```

### Translate a Single PDF

```http
POST /api/translate
Content-Type: multipart/form-data
```

Fields:
- `pdf` (File, required, max 50 MB)
- `sourceLang` (string, optional, default `auto`)
- `targetLang` (string, required)
- `options` (JSON string, optional)

Response: `202 Accepted` with `{ jobId }`

### Check Job Status

```http
GET /api/translate/status/:jobId
```

### Download Translated PDF

```http
GET /api/translate/download/:jobId
```

### Translation History

```http
GET /api/translate/history
```

### Delete a Job

```http
DELETE /api/translate/:jobId
```

### Batch Translation

```http
POST /api/translate/batch
Content-Type: multipart/form-data
```

Fields:
- `pdfs[]` (File[], up to 10)
- `sourceLang` (string)
- `targetLang` (string)
- `options` (JSON string)

Translation options example:

```json
{
  "preserveFormatting": true,
  "preserveImages": true,
  "preserveTables": true,
  "translateImagesText": false,
  "maintainCharacterStyles": true,
  "translateProperNames": false,
  "keepProperNamesUntranslated": false,
  "detectMixedLanguage": true,
  "preserveCitations": false
}
```

---

## 🧪 Testing and Validation

### Backend

```bash
cd backend
npm run lint   # currently requires ESLint in the backend environment
npm run build
npm test
```

### Frontend

```bash
cd frontend
npm run lint
npm run build
```

---

## 📁 Project Structure

```text
PolyGlot/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   └── index.ts
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   └── types/
│   ├── Dockerfile
│   └── package.json
├── samples/
├── docker-compose.yml
└── README.md
```

---

## 🔒 Privacy & Security

- Uploaded files are temporary and deleted after processing
- Rate limiting: `100 requests / 15 minutes / IP`
- Only PDF files are accepted
- Per-file upload size limit: `50 MB`
- CORS restricted to configured `FRONTEND_URL`

---

## 🗺 Roadmap

- [ ] Persistent database (PostgreSQL)
- [ ] User authentication and per-user history
- [ ] Better coordinate-based layout preservation
- [ ] OCR for image text
- [ ] Export to `.docx` or HTML
- [ ] Password-protected PDF support
- [ ] WebSocket progress updates
- [ ] Side-by-side preview (original vs translated)

---

## 📄 License

MIT — see [LICENSE](./LICENSE).
