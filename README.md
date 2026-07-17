# 🌐 PolyGlot — PDF Translation System

A full-stack web application that translates PDF documents from one language to another while preserving the original document's formatting, fonts, layout design, and visual structure.

---

## ✨ Features

- **35+ supported languages** with auto-detection
- **Preserve formatting** — fonts, sizes, colors, layout
- **Preserve images, tables & charts** positions
- **Mixed-language handling** — detect German PDF with Latin citations, etc.
- **Citation preservation** — keep quoted text in its original language
- **Batch processing** — translate multiple PDFs at once
- **Translation history** — view all past jobs with download links
- **Upload progress bar** with real-time status polling
- **Pluggable translation providers** — DeepL, OpenAI, or built-in mock
- **Automatic fallback** — if no API key is set, the mock provider is used
- **Docker-ready** — one command to run the entire stack
- **Privacy-first** — uploaded files are deleted after processing

---

## 🖥 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Backend | Node.js 20 + Express + TypeScript |
| PDF Extract | pdf-parse |
| PDF Generate | pdf-lib |
| Translation | DeepL API / OpenAI API / Mock |
| HTTP Client | Axios |
| Styling | Pure CSS (no framework) |
| Containerisation | Docker + Docker Compose |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 20+** and **npm 10+**
- (Optional) A [DeepL API key](https://www.deepl.com/pro-api) or [OpenAI API key](https://platform.openai.com/api-keys)

### 1. Clone the repository

```bash
git clone https://github.com/jeffersonmello/PolyGlot.git
cd PolyGlot
```

### 2. Configure the backend

```bash
cp backend/.env.example backend/.env
# Open backend/.env and fill in your API keys (optional)
```

### 3. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 4. Run in development mode

Open **two terminals**:

```bash
# Terminal 1 – backend
cd backend
npm run dev
# → http://localhost:3001

# Terminal 2 – frontend
cd frontend
npm run dev
# → http://localhost:5173
```

Navigate to **http://localhost:5173** and start translating!

---

## 🐳 Docker Deployment

```bash
# Copy and configure the backend environment file
cp backend/.env.example backend/.env
# (edit backend/.env with your API keys if desired)

# Build and start all services
docker compose up --build

# The application will be available at http://localhost
```

To stop:

```bash
docker compose down
```

---

## ⚙️ Configuration

### Backend (`backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Backend HTTP port |
| `NODE_ENV` | `development` | Environment |
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

The backend tries providers in this order:

1. **DeepL** — if `DEEPL_API_KEY` is set
2. **OpenAI** (GPT-4o mini) — if `OPENAI_API_KEY` is set
3. **Mock** — always available; prefixes translated text with `[XX]` for easy identification

---

## 📡 API Reference

### Health Check

```
GET /health
```

### List Languages

```
GET /api/languages
```

### Translate a Single PDF

```
POST /api/translate
Content-Type: multipart/form-data

Fields:
  pdf         File       Required. PDF file (max 50 MB)
  sourceLang  string     Language code or "auto" (default: "auto")
  targetLang  string     Required. Target language code (e.g. "es")
  options     JSON string Translation options (see below)
```

Returns `202 Accepted` with `{ jobId }`.

### Check Job Status

```
GET /api/translate/status/:jobId
```

### Download Translated PDF

```
GET /api/translate/download/:jobId
```

### Translation History

```
GET /api/translate/history
```

### Delete a Job

```
DELETE /api/translate/:jobId
```

### Batch Translation

```
POST /api/translate/batch
Content-Type: multipart/form-data

Fields:
  pdfs[]      File[]     Up to 10 PDF files
  sourceLang  string     Language code or "auto"
  targetLang  string     Target language code
  options     JSON string Translation options
```

### Translation Options Object

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

## 🧪 Testing

### Backend tests

```bash
cd backend
npm test
```

Runs Jest unit tests for:
- `TranslationService` (mock provider, citations, proper names, etc.)
- `TranslationStore` (CRUD, ordering)

### Frontend type-check

```bash
cd frontend
npx tsc --noEmit
```

---

## 📁 Project Structure

```
PolyGlot/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   └── translationController.ts   # Route handlers
│   │   ├── middleware/
│   │   │   ├── errorHandler.ts
│   │   │   └── upload.ts                  # Multer config
│   │   ├── routes/
│   │   │   └── index.ts
│   │   ├── services/
│   │   │   ├── pdfExtractor.ts            # PDF → TextBlocks
│   │   │   ├── pdfGenerator.ts            # TextBlocks → PDF
│   │   │   ├── translationService.ts      # Provider pattern
│   │   │   └── translationStore.ts        # In-memory job store
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   └── logger.ts
│   │   └── index.ts                       # Express app entry
│   ├── Dockerfile
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── FileUploadZone.tsx
│   │   │   ├── HistoryTable.tsx
│   │   │   ├── LanguageSelector.tsx
│   │   │   ├── TranslationOptionsPanel.tsx
│   │   │   └── TranslationStatus.tsx
│   │   ├── hooks/
│   │   │   └── useJobPolling.ts
│   │   ├── pages/
│   │   │   ├── HistoryPage.tsx
│   │   │   └── TranslatorPage.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   ├── App.css
│   │   └── main.tsx
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── .env.example
│   ├── package.json
│   └── vite.config.ts
│
├── samples/
│   ├── sample-english.pdf       # English test document (2 pages)
│   └── sample-multilingual.pdf  # Mixed-language test document
│
├── docker-compose.yml
└── README.md
```

---

## 🔒 Privacy & Security

- **Temporary storage**: uploaded files are deleted immediately after processing
- **Rate limiting**: 100 requests / 15 minutes per IP
- **File type validation**: only PDF files are accepted
- **File size limit**: 50 MB per file
- **CORS**: restricted to the configured `FRONTEND_URL`

---

## 🗺 Roadmap

- [ ] Persistent database (PostgreSQL)
- [ ] User authentication and per-user history
- [ ] True coordinate-based layout preservation (using pdf-lib text positions)
- [ ] OCR for text in images
- [ ] Export as Word (.docx) or HTML
- [ ] Password-protected PDF support
- [ ] WebSocket progress updates (instead of polling)
- [ ] Preview side-by-side (original vs translated)

---

## 📄 License

MIT — see [LICENSE](./LICENSE).
