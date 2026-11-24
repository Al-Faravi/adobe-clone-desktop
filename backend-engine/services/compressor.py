import pymupdf as fitz
from PIL import Image
import io
import os
import zipfile

def smart_compress_pdf(input_path: str, output_path: str, max_size_kb: float = 500.0):
    """
    ১. ফাইল আগে থেকেই max_size_kb এর কম হলে টাচ করবে না।
    ২. বেশি হলে সর্বোচ্চ কোয়ালিটি (DPI + Quality) বজায় রেখে টার্গেট সাইজের নিচে নামাবে।
    """
    orig_size_kb = round(os.path.getsize(input_path) / 1024, 2)
    
    if orig_size_kb <= max_size_kb:
        with open(input_path, "rb") as f_in, open(output_path, "wb") as f_out:
            f_out.write(f_in.read())
        return {
            "status": "skipped",
            "message": f"Already {orig_size_kb} KB (Under {max_size_kb} KB limit)",
            "original_kb": orig_size_kb,
            "final_kb": orig_size_kb
        }

    # হাই থেকে লো কোয়ালিটি প্রোফাইল (সবচেয়ে ভালো কোয়ালিটি আগে চেষ্টা করবে)
    profiles = [
        {"dpi": 180, "quality": 85},
        {"dpi": 150, "quality": 78},
        {"dpi": 130, "quality": 70},
        {"dpi": 115, "quality": 62},
        {"dpi": 100, "quality": 55},
        {"dpi": 90,  "quality": 48},
        {"dpi": 80,  "quality": 40},
        {"dpi": 72,  "quality": 32},
    ]

    src_doc = fitz.open(input_path)
    best_bytes = None
    best_size_kb = orig_size_kb

    for prof in profiles:
        out_doc = fitz.open()
        zoom = prof["dpi"] / 72.0
        mat = fitz.Matrix(zoom, zoom)

        for page in src_doc:
            pix = page.get_pixmap(matrix=mat, colorspace=fitz.csRGB, alpha=False)
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            img_buf = io.BytesIO()
            img.save(img_buf, format="JPEG", quality=prof["quality"], optimize=True)
            
            new_page = out_doc.new_page(width=page.rect.width, height=page.rect.height)
            new_page.insert_image(new_page.rect, stream=img_buf.getvalue())

        pdf_bytes = out_doc.tobytes(garbage=4, deflate=True, clean=True)
        out_doc.close()
        
        current_kb = round(len(pdf_bytes) / 1024, 2)
        best_bytes = pdf_bytes
        best_size_kb = current_kb

        # টার্গেট সাইজের নিচে নামামাত্রই লুপ থামিয়ে দেব যাতে সর্বোচ্চ কোয়ালিটি থাকে!
        if current_kb <= max_size_kb:
            break

    src_doc.close()
    with open(output_path, "wb") as f:
        f.write(best_bytes)

    return {
        "status": "compressed",
        "message": f"{orig_size_kb} KB -> {best_size_kb} KB (Target: {max_size_kb} KB)",
        "original_kb": orig_size_kb,
        "final_kb": best_size_kb
    }

def bulk_compress_pdfs(file_list: list[tuple[str, str]], zip_output_path: str, max_size_kb: float = 500.0):
    """একাধিক PDF একসাথে কম্প্রেস করে একটি ZIP ফাইলে প্যাক করে"""
    temp_outputs = []
    for orig_name, in_path in file_list:
        out_path = in_path + "_opt.pdf"
        smart_compress_pdf(in_path, out_path, max_size_kb)
        temp_outputs.append((orig_name, out_path))

    with zipfile.ZipFile(zip_output_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for orig_name, out_path in temp_outputs:
            zf.write(out_path, arcname=f"compressed_{orig_name}")