# Al-Faravi PDF Pro Studio

An offline, native Windows desktop PDF editor, smart size optimizer, and commercial document management suite built with **Electron**, **React**, **Tailwind CSS**, and **Python (FastAPI + PyMuPDF)**.

Designed for high-speed, zero-cloud office and enterprise workflows—allowing teams to edit text, compress heavy scanned documents without quality loss, sign/stamp files interactively, manage pages, and convert PDFs to Word completely locally.

---

## Core Features

- **Click & Edit Text (Style-Preserving):** Click directly on any text element on the PDF canvas to edit or replace words/lines while automatically detecting and preserving the original font size and color.
- **Smart Quality-Safe Compression:** Uses an adaptive iterative DPI/JPEG optimization profile to shrink heavy PDFs (e.g., 8 MB+ scans) under a custom user-defined target limit (e.g., less than 500 KB) while retaining maximum legibility. Automatically skips files that are already below the target threshold.
- **Bulk PDF Size Reducer:** Select and compress multiple PDF files simultaneously under a specified maximum KB limit and download them bundled in a single `.zip` archive.
- **Interactive Drag & Resize Sign / Stamp:** Upload transparent PNG signatures or official company seals, drag them anywhere on the PDF page, and resize dynamically using corner handles before permanently embedding them.
- **Complete Page Management:**
  - Insert blank pages at any position.
  - Delete unwanted pages directly from the thumbnail sidebar.
  - Reorder pages effortlessly using Up/Down controls.
  - Repeatable `+90°` clockwise page rotation.
  - Merge multiple PDF documents into a single file.
- **Watermark & Automated Page Numbering:** Apply custom document-wide watermarks and automated `Page X of Y` footers across all pages in one click.
- **Offline PDF to Word (`.docx`) Converter:** Convert static PDF documents into editable Microsoft Word files offline.
- **100% Local & Private:** All file processing occurs locally on the host machine—no files are ever uploaded to external cloud servers.

---

## System Architecture

    +-----------------------------------------------------------------------+
    |                    Electron Desktop Shell (.exe)                      |
    |                                                                       |
    |  +-------------------------------+   +-----------------------------+  |
    |  |   React + Tailwind + PDF.js   |   |   Python FastAPI Sidecar    |  |
    |  |   (Interactive UI & Canvas)   |-->|   (acrobat-engine.exe)      |  |
    |  |                               |<--|                             |  |
    |  |  • Thumbnail Sidebar          |   |  • PyMuPDF (Edit, Pages)    |  |
    |  |  • Click-to-Edit Overlays     |   |  • Pillow (Smart Compress)  |  |
    |  |  • Drag/Resize Sign Box       |   |  • pdf2docx (Word Export)   |  |
    |  +-------------------------------+   +-----------------------------+  |
    |                    Local HTTP REST API (127.0.0.1:8765)               |
    +-----------------------------------------------------------------------+

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Desktop Wrapper & Packaging** | Electron, Electron Builder (NSIS Windows Installer) |
| **Frontend UI & PDF Rendering** | React 19, Vite, Tailwind CSS, PDF.js (`pdfjs-dist`), Lucide Icons |
| **Backend Processing Engine** | Python 3.11+, FastAPI, Uvicorn, PyInstaller |
| **PDF & Document Libraries** | PyMuPDF (`pymupdf`), Pillow (`PIL`), `pdf2docx`, `pypdf` |

---

## Project Structure

    adobe-clone-desktop/
    ├── backend-engine/
    │   ├── main.py                     # FastAPI local server & REST endpoints
    │   ├── requirements.txt            # Python dependencies
    │   └── services/
    │       ├── compressor.py           # Adaptive smart compression & bulk ZIP packer
    │       ├── converter_ocr.py        # PDF to DOCX & image export utilities
    │       ├── editor.py               # Style-preserving text replace, signature, watermark
    │       └── page_ops.py             # Page insert, delete, reorder, rotate, merge
    ├── frontend/
    │   ├── public/
    │   │   └── alfaravi logo.png       # Application branding & desktop icon
    │   ├── src/
    │   │   ├── App.jsx                 # Main state management & API integration
    │   │   └── components/
    │   │       ├── TopToolbar.jsx      # Pro action bar & tool switcher
    │   │       ├── SidebarThumbnails.jsx # Live page previews, reorder & delete controls
    │   │       └── PdfCanvasViewer.jsx # Interactive PDF canvas, text overlays & drag-sign box
    │   └── vite.config.js
    ├── electron-main.js                # Electron main process & Python sidecar lifecycle manager
    ├── package.json                    # Root scripts & electron-builder configuration
    └── README.md

---

## Local Development Setup

### Prerequisites
- **Node.js** (v18 or higher)
- **Python** (v3.11 or higher)

### 1. Start the Backend Engine (Python)
Open a terminal in the project root and run:

    cd backend-engine
    python -m venv venv
    venv\Scripts\activate
    pip install -r requirements.txt
    python main.py

The local API engine will start at `http://127.0.0.1:8765` (Interactive API docs available at `http://127.0.0.1:8765/docs`).

### 2. Start the Frontend UI (React)
Open a second terminal and run:

    cd frontend
    npm install
    npm run dev

The web interface will run at `http://localhost:5173`.

### 3. Run in Electron Desktop Mode (Development)
With both backend and frontend running, open a third terminal in the root folder:

    npm install
    npm start

---

## Building the Standalone Windows Installer (`.exe`)

To package the entire application (including the Python engine) into a self-contained Windows `.exe` installer that requires **no Python or Node.js** on target office PCs:

### Step 1: Bundle the Python Engine

    cd backend-engine
    venv\Scripts\activate
    pip install pyinstaller
    pyinstaller --onefile --noconsole --name acrobat-engine main.py

Verify that `backend-engine/dist/acrobat-engine.exe` is generated.

### Step 2: Build the Frontend & Windows NSIS Installer
Return to the root directory and run:

    cd ..
    npm run build:exe

Once complete, the standalone installer will be available at:
`dist/Al-Faravi PDF Pro Studio Setup 1.0.0.exe`

---

## Local API Endpoints Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/compress` | `POST` | Compresses a single PDF below `max_kb` while preserving clarity |
| `/api/bulk-compress` | `POST` | Compresses multiple PDFs and returns a `.zip` archive |
| `/api/edit-text` | `POST` | Replaces target text on a page using original font size & color |
| `/api/add-signature` | `POST` | Embeds a signature/stamp image at exact `(x, y, width, height)` coordinates |
| `/api/watermark` | `POST` | Adds watermark text and/or `Page X of Y` footers |
| `/api/remove-pages` | `POST` | Deletes specified 0-indexed pages |
| `/api/reorder-pages` | `POST` | Reorders pages based on a comma-separated index list |
| `/api/add-blank-page` | `POST` | Inserts a blank page at the specified index |
| `/api/rotate-page` | `POST` | Rotates a page incrementally by `+90°` |
| `/api/merge` | `POST` | Merges multiple uploaded PDFs into one document |
| `/api/pdf-to-word` | `POST` | Converts a PDF file into an editable `.docx` document |

---

## License

Developed by **MD. Shakawat Hossain Faravi (Al-Faravi)**. Built for internal commercial productivity and open-source desktop document engineering.