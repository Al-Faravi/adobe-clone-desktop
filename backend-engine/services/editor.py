import pymupdf as fitz

def int_color_to_rgb(color_int: int):
    """PyMuPDF-এর ইন্টিজার কালারকে (r, g, b) ফ্লোটে রূপান্তর"""
    r = ((color_int >> 16) & 255) / 255.0
    g = ((color_int >> 8) & 255) / 255.0
    b = (color_int & 255) / 255.0
    return (r, g, b)

def replace_text_preserve_style(input_path: str, output_path: str, page_num: int, old_text: str, new_text: str):
    """আগের শব্দের আসল ফন্ট সাইজ ও কালার ধরে রেখে নতুন লেখা বসায়"""
    doc = fitz.open(input_path)
    page = doc[page_num]
    
    # পেজের সব টেক্সট স্প্যান থেকে অরিজিনাল ফন্ট সাইজ ও কালার বের করা
    detected_size = 11.0
    detected_color = (0, 0, 0)
    text_dict = page.get_text("dict")
    for block in text_dict.get("blocks", []):
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                if old_text.strip() in span.get("text", ""):
                    detected_size = round(span.get("size", 11.0), 1)
                    detected_color = int_color_to_rgb(span.get("color", 0))
                    break

    areas = page.search_for(old_text)
    for rect in areas:
        page.add_redact_annot(rect, fill=(1, 1, 1))
    page.apply_redactions()

    for rect in areas:
        # বেসলাইন অ্যালাইনমেন্ট ঠিক রেখে অরিজিনাল সাইজ ও কালারে ইনসার্ট
        baseline_y = rect.y1 - (detected_size * 0.18)
        page.insert_text(
            (rect.x0, baseline_y),
            new_text,
            fontsize=detected_size,
            fontname="helv",
            color=detected_color
        )

    doc.save(output_path, garbage=4, deflate=True)
    doc.close()
    return {"edited": len(areas), "size": detected_size}

def add_signature_or_stamp(input_path: str, output_path: str, page_num: int, image_path: str, x: float, y: float, width: float, height: float):
    doc = fitz.open(input_path)
    page = doc[page_num]
    rect = fitz.Rect(x, y, x + width, y + height)
    page.insert_image(rect, filename=image_path, overlay=True)
    doc.save(output_path)
    doc.close()

def add_watermark_and_page_numbers(input_path: str, output_path: str, watermark_text: str = "", add_page_num: bool = True):
    doc = fitz.open(input_path)
    total_pages = len(doc)

    for idx, page in enumerate(doc):
        w, h = page.rect.width, page.rect.height
        if watermark_text:
            page.insert_text(
                (w * 0.22, h * 0.5),
                watermark_text,
                fontsize=44,
                color=(0.82, 0.82, 0.82),
                rotate=0
            )
        if add_page_num:
            footer_text = f"Page {idx + 1} of {total_pages}"
            page.insert_text((w / 2 - 30, h - 20), footer_text, fontsize=9, color=(0.3, 0.3, 0.3))

    doc.save(output_path)
    doc.close()