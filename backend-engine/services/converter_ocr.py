from pdf2docx import Converter
import fitz
import os

def convert_pdf_to_word(input_path: str, output_docx: str):
    """PDF-কে এডিটেবল Word (.docx) ফাইলে রূপান্তর করে"""
    cv = Converter(input_path)
    cv.convert(output_docx, start=0, end=None)
    cv.close()

def export_pdf_to_images(input_path: str, output_dir: str, dpi: int = 150):
    """প্রতিটি পেজকে হাই-রেজোলিউশন PNG ছবি হিসেবে সেভ করে"""
    os.makedirs(output_dir, exist_ok=True)
    doc = fitz.open(input_path)
    saved_files = []
    for i, page in enumerate(doc):
        pix = page.get_pixmap(dpi=dpi)
        img_path = os.path.join(output_dir, f"page_{i+1}.png")
        pix.save(img_path)
        saved_files.append(img_path)
    doc.close()
    return saved_files