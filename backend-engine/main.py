from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from typing import List
import shutil, os, uuid

from services.compressor import smart_compress_pdf, bulk_compress_pdfs
from services.editor import replace_text_preserve_style, add_signature_or_stamp, add_watermark_and_page_numbers
from services.page_ops import remove_pages, insert_blank_or_pdf_pages, rotate_page_incremental, reorder_pages, merge_pdfs
from services.converter_ocr import convert_pdf_to_word

app = FastAPI(title="Al-Faravi Acrobat Pro Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Stats"],
)

TEMP_DIR = "temp_workspace"
os.makedirs(TEMP_DIR, exist_ok=True)

def save_temp(upload: UploadFile) -> str:
    path = os.path.join(TEMP_DIR, f"{uuid.uuid4()}_{upload.filename}")
    with open(path, "wb") as f:
        shutil.copyfileobj(upload.file, f)
    return path

@app.post("/api/compress")
async def api_compress(file: UploadFile = File(...), max_kb: float = Form(500.0)):
    in_path = save_temp(file)
    out_path = os.path.join(TEMP_DIR, f"compressed_{file.filename}")
    stats = smart_compress_pdf(in_path, out_path, max_kb)
    return FileResponse(out_path, filename=f"compressed_{file.filename}", headers={"X-Stats": stats["message"]})

@app.post("/api/bulk-compress")
async def api_bulk_compress(files: List[UploadFile] = File(...), max_kb: float = Form(500.0)):
    saved_list = [(f.filename, save_temp(f)) for f in files]
    zip_path = os.path.join(TEMP_DIR, f"bulk_compressed_{uuid.uuid4().hex[:6]}.zip")
    bulk_compress_pdfs(saved_list, zip_path, max_kb)
    return FileResponse(zip_path, filename="Compressed_PDFs_Bundle.zip")

@app.post("/api/edit-text")
async def api_edit_text(
    file: UploadFile = File(...),
    page_num: int = Form(0),
    old_text: str = Form(...),
    new_text: str = Form(...)
):
    in_path = save_temp(file)
    out_path = os.path.join(TEMP_DIR, f"edited_{file.filename}")
    res = replace_text_preserve_style(in_path, out_path, page_num, old_text, new_text)
    return FileResponse(out_path, filename=f"edited_{file.filename}", headers={"X-Stats": f"Updated (Font: {res['size']}pt)"})

@app.post("/api/add-signature")
async def api_add_signature(
    file: UploadFile = File(...),
    signature: UploadFile = File(...),
    page_num: int = Form(0),
    x: float = Form(100),
    y: float = Form(650),
    width: float = Form(120),
    height: float = Form(50)
):
    in_path = save_temp(file)
    sig_path = save_temp(signature)
    out_path = os.path.join(TEMP_DIR, f"signed_{file.filename}")
    add_signature_or_stamp(in_path, out_path, page_num, sig_path, x, y, width, height)
    return FileResponse(out_path, filename=f"signed_{file.filename}")

@app.post("/api/watermark")
async def api_watermark(
    file: UploadFile = File(...),
    watermark_text: str = Form(""),
    add_page_num: bool = Form(True)
):
    in_path = save_temp(file)
    out_path = os.path.join(TEMP_DIR, f"marked_{file.filename}")
    add_watermark_and_page_numbers(in_path, out_path, watermark_text, add_page_num)
    return FileResponse(out_path, filename=f"marked_{file.filename}")

@app.post("/api/remove-pages")
async def api_remove_pages(file: UploadFile = File(...), pages: str = Form(...)):
    in_path = save_temp(file)
    out_path = os.path.join(TEMP_DIR, f"trimmed_{file.filename}")
    page_list = [int(p.strip()) for p in pages.split(",") if p.strip().isdigit()]
    remove_pages(in_path, out_path, page_list)
    return FileResponse(out_path, filename=f"trimmed_{file.filename}")

@app.post("/api/reorder-pages")
async def api_reorder_pages(file: UploadFile = File(...), order: str = Form(...)):
    in_path = save_temp(file)
    out_path = os.path.join(TEMP_DIR, f"reordered_{file.filename}")
    new_order = [int(p.strip()) for p in order.split(",") if p.strip().isdigit()]
    reorder_pages(in_path, out_path, new_order)
    return FileResponse(out_path, filename=f"reordered_{file.filename}")

@app.post("/api/add-blank-page")
async def api_add_blank_page(file: UploadFile = File(...), insert_at: int = Form(0)):
    in_path = save_temp(file)
    out_path = os.path.join(TEMP_DIR, f"added_{file.filename}")
    insert_blank_or_pdf_pages(in_path, out_path, insert_at)
    return FileResponse(out_path, filename=f"added_{file.filename}")

@app.post("/api/rotate-page")
async def api_rotate_page(file: UploadFile = File(...), page_num: int = Form(0), angle: int = Form(90)):
    in_path = save_temp(file)
    out_path = os.path.join(TEMP_DIR, f"rotated_{file.filename}")
    rotate_page_incremental(in_path, out_path, page_num, angle)
    return FileResponse(out_path, filename=f"rotated_{file.filename}")

@app.post("/api/merge")
async def api_merge(files: List[UploadFile] = File(...)):
    saved_paths = [save_temp(f) for f in files]
    out_path = os.path.join(TEMP_DIR, f"merged_{uuid.uuid4().hex[:6]}.pdf")
    merge_pdfs(saved_paths, out_path)
    return FileResponse(out_path, filename="merged_document.pdf")

@app.post("/api/pdf-to-word")
async def api_pdf_to_word(file: UploadFile = File(...)):
    in_path = save_temp(file)
    docx_name = file.filename.rsplit(".", 1)[0] + ".docx"
    out_path = os.path.join(TEMP_DIR, docx_name)
    convert_pdf_to_word(in_path, out_path)
    return FileResponse(out_path, filename=docx_name)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8765)