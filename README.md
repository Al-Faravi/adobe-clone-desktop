# Al-Faravi PDF Pro Studio

An offline, native Windows desktop PDF editor and document management suite built with **Electron**, **React**, **Tailwind CSS**, and **Python (FastAPI + PyMuPDF)**.

## Core Features
- **Click & Edit Text:** Inline click-to-edit text replacement preserving original font size and color.
- **Smart Quality-Safe Compression:** Reduces heavy PDFs under a custom target size (KB) while retaining maximum clarity; skips files already below the target limit.
- **Bulk PDF Size Reducer:** Compresses multiple PDFs simultaneously and bundles them into a single ZIP archive.
- **Interactive Sign & Stamp:** Drag-and-drop and resize PNG signatures or office seals directly on the PDF canvas.
- **Page Management:** Add blank pages, delete, rotate (+90° repeatable), reorder pages, and merge multiple PDFs.
- **Watermark & Page Numbering:** Apply document-wide watermarks and automated `Page X of Y` footers.
- **PDF to Word Export:** Convert PDF documents into editable `.docx` files offline.

## Local Development Setup

### 1. Backend Engine (Python)
```bash
cd backend-engine
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python main.py