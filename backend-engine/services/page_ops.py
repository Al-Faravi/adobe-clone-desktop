import pymupdf as fitz

def remove_pages(input_path: str, output_path: str, pages_to_remove: list[int]):
    doc = fitz.open(input_path)
    doc.delete_pages(pages_to_remove)
    doc.save(output_path)
    doc.close()

def insert_blank_or_pdf_pages(main_pdf: str, output_path: str, insert_at: int, extra_pdf: str = None):
    doc = fitz.open(main_pdf)
    if extra_pdf:
        src = fitz.open(extra_pdf)
        doc.insert_pdf(src, start_at=insert_at)
        src.close()
    else:
        doc.new_page(pno=insert_at)
    doc.save(output_path)
    doc.close()

def rotate_page_incremental(input_path: str, output_path: str, page_num: int, angle: int = 90):
    """বর্তমান রোটেশনের সাথে আরও ৯০° যোগ করে—ফলে যতবার ইচ্ছা ঘোরানো যাবে"""
    doc = fitz.open(input_path)
    page = doc[page_num]
    new_rotation = (page.rotation + angle) % 360
    page.set_rotation(new_rotation)
    doc.save(output_path)
    doc.close()

def reorder_pages(input_path: str, output_path: str, new_order: list[int]):
    """নতুন সিরিয়াল অনুযায়ী (যেমন [1, 0, 2]) পেজগুলো সাজায়"""
    doc = fitz.open(input_path)
    doc.select(new_order)
    doc.save(output_path)
    doc.close()

def merge_pdfs(pdf_paths: list[str], output_path: str):
    merged = fitz.open()
    for path in pdf_paths:
        with fitz.open(path) as doc:
            merged.insert_pdf(doc)
    merged.save(output_path)
    merged.close()