import React, { useEffect, useRef, useState } from 'react';
import {
  ZoomIn, ZoomOut, FileUp, Layers, Type, PenTool,
  FileText, Minimize2, CheckCircle2, Move
} from 'lucide-react';

export default function PdfCanvasViewer({
  pdfDoc,
  fileSizeKb,
  currentPage,
  activeTool,
  onUploadPdf,
  onOpenBulkCompressModal,
  onEditText,
  onAddSignature,
  onAddWatermark,
  isProcessing
}) {
  const canvasRef = useRef(null);
  const homeInputRef = useRef(null);
  const [scale, setScale] = useState(1.25);
  const [pageViewport, setPageViewport] = useState({ width: 595, height: 842 });

  // Click-to-Edit Text States
  const [textItems, setTextItems] = useState([]);
  const [oldText, setOldText] = useState('');
  const [newText, setNewText] = useState('');

  // Interactive Signature Drag & Resize States
  const [sigFile, setSigFile] = useState(null);
  const [sigPreview, setSigPreview] = useState(null);
  const [sigBox, setSigBox] = useState({ x: 120, y: 150, w: 140, h: 60 });
  const [dragMode, setDragMode] = useState(null); // 'move' | 'resize'
  const [dragStart, setDragStart] = useState({ mx: 0, my: 0, bx: 0, by: 0, bw: 0, bh: 0 });

  // Watermark States
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [addPageNum, setAddPageNum] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function renderPage() {
      if (!pdfDoc || !canvasRef.current) return;
      const page = await pdfDoc.getPage(currentPage);
      const viewport = page.getViewport({ scale });
      setPageViewport({ width: viewport.width, height: viewport.height, origW: page.view[2], origH: page.view[3] });

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      if (!cancelled) {
        await page.render({ canvasContext: ctx, viewport }).promise;

        // Click-to-Edit এর জন্য টেক্সট কো-অর্ডিনেট এক্সট্র্যাক্ট করা
        const textContent = await page.getTextContent();
        const items = textContent.items.map((item) => {
          const tx = item.transform;
          const fontHeight = Math.hypot(tx[2], tx[3]) * scale;
          const x = tx[4] * scale;
          const y = viewport.height - tx[5] * scale - fontHeight;
          return {
            str: item.str,
            x,
            y,
            width: item.width * scale,
            height: fontHeight * 1.2
          };
        }).filter((i) => i.str.trim().length > 0);
        setTextItems(items);
      }
    }
    renderPage();
    return () => { cancelled = true; };
  }, [pdfDoc, currentPage, scale]);

  // Signature Image Upload Preview
  const handleSigFileChange = (file) => {
    if (!file) return;
    setSigFile(file);
    setSigPreview(URL.createObjectURL(file));
  };

  // Mouse Drag / Resize Handlers for Signature
  const startDrag = (e, mode) => {
    e.stopPropagation();
    setDragMode(mode);
    setDragStart({
      mx: e.clientX,
      my: e.clientY,
      bx: sigBox.x,
      by: sigBox.y,
      bw: sigBox.w,
      bh: sigBox.h
    });
  };

  const handleMouseMove = (e) => {
    if (!dragMode) return;
    const dx = e.clientX - dragStart.mx;
    const dy = e.clientY - dragStart.my;

    if (dragMode === 'move') {
      setSigBox((prev) => ({
        ...prev,
        x: Math.max(0, Math.min(pageViewport.width - prev.w, dragStart.bx + dx)),
        y: Math.max(0, Math.min(pageViewport.height - prev.h, dragStart.by + dy))
      }));
    } else if (dragMode === 'resize') {
      setSigBox((prev) => ({
        ...prev,
        w: Math.max(40, dragStart.bw + dx),
        h: Math.max(25, dragStart.bh + dy)
      }));
    }
  };

  const stopDrag = () => setDragMode(null);

  // ব্রাউজার স্ক্রিন কো-অর্ডিনেটকে আসল PDF পয়েন্ট কো-অর্ডিনেটে কনভার্ট করে সেভ
  const applySignatureToPdf = () => {
    if (!sigFile) return;
    const pdfX = sigBox.x / scale;
    const pdfY = sigBox.y / scale;
    const pdfW = sigBox.w / scale;
    const pdfH = sigBox.h / scale;
    onAddSignature(currentPage - 1, sigFile, pdfX, pdfY, pdfW, pdfH);
  };

  // RICH OFFICE DASHBOARD (যখন কোনো ফাইল ওপেন নেই)
  if (!pdfDoc) {
    return (
      <div className="flex-1 bg-gradient-to-br from-[#F0F2F5] via-[#E6E9EF] to-[#DCE1E9] overflow-y-auto p-8 flex flex-col items-center justify-center">
        <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl border border-gray-200/80 overflow-hidden">
          {/* Hero Header with Logo */}
          <div className="bg-[#1E2229] text-white p-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src="/alfaravi logo.png"
                alt="Al-Faravi Logo"
                className="h-16 w-16 object-contain bg-white rounded-xl p-1.5 shadow-md"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-blue-400">
                  Enterprise Commercial & Document Suite
                </span>
                <h1 className="text-2xl font-bold mt-0.5">Al-Faravi PDF Pro Studio</h1>
                <p className="text-xs text-gray-300 mt-1">
                  Offline High-Speed PDF Editor, Smart Size Reducer, Merger & Signer
                </p>
              </div>
            </div>

            <button
              onClick={() => homeInputRef.current.click()}
              className="flex items-center gap-2 bg-[#1473E6] hover:bg-[#0D66D0] px-5 py-3 rounded-xl text-sm font-semibold shadow-lg transition cursor-pointer"
            >
              <FileUp size={18} /> Open PDF Document
            </button>
            <input
              ref={homeInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => e.target.files[0] && onUploadPdf(e.target.files[0])}
            />
          </div>

          {/* Quick Action Cards */}
          <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-5">
            <div
              onClick={() => homeInputRef.current.click()}
              className="p-5 rounded-xl border border-gray-200 hover:border-blue-500 hover:shadow-md transition cursor-pointer bg-gray-50/60"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                <Type size={20} />
              </div>
              <h3 className="font-bold text-sm text-gray-800">Click & Edit Text</h3>
              <p className="text-xs text-gray-500 mt-1">
                যেকোনো লেখায় সরাসরি ক্লিক করে অরিজিনাল ফন্ট সাইজ ও কালার ঠিক রেখে এডিট করুন।
              </p>
            </div>

            <div
              onClick={onOpenBulkCompressModal}
              className="p-5 rounded-xl border border-gray-200 hover:border-emerald-500 hover:shadow-md transition cursor-pointer bg-gray-50/60"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
                <Layers size={20} />
              </div>
              <h3 className="font-bold text-sm text-gray-800">Bulk Smart Compress</h3>
              <p className="text-xs text-gray-500 mt-1">
                কোয়ালিটি নষ্ট না করে একসাথে একাধিক PDF-কে নির্ধারিত Max KB-এর নিচে নামিয়ে আনুন।
              </p>
            </div>

            <div
              onClick={() => homeInputRef.current.click()}
              className="p-5 rounded-xl border border-gray-200 hover:border-purple-500 hover:shadow-md transition cursor-pointer bg-gray-50/60"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center mb-3">
                <PenTool size={20} />
              </div>
              <h3 className="font-bold text-sm text-gray-800">Drag & Resize Sign / Seal</h3>
              <p className="text-xs text-gray-500 mt-1">
                মাউস দিয়ে ড্র্যাগ করে স্বাক্ষর বা অফিসিয়াল সিল বসান এবং ইচ্ছেমতো ছোট-বড় করুন।
              </p>
            </div>
          </div>

          <div className="bg-gray-50 px-8 py-3.5 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
            <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
              <CheckCircle2 size={14} /> 100% Offline & Secure Local Processing
            </span>
            <span>Supports: Direct Edit • Smart Compression • Page Reorder • DOCX Export</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseUp={stopDrag}
      className="flex-1 flex overflow-hidden bg-[#4A4E54]"
    >
      {/* Main Interactive PDF Canvas */}
      <div className="flex-1 overflow-auto flex flex-col items-center py-6 relative">
        {/* Top Floating Info & Zoom Pill */}
        <div className="sticky top-2 z-20 mb-4 flex items-center gap-3 bg-[#1E2229]/95 text-white px-4 py-1.5 rounded-full shadow-lg text-xs border border-white/10">
          <span className="text-amber-400 font-semibold">Size: {fileSizeKb} KB</span>
          <span className="text-white/30">|</span>
          <button onClick={() => setScale((s) => Math.max(0.6, s - 0.15))} className="hover:text-blue-400">
            <ZoomOut size={15} />
          </button>
          <span className="w-12 text-center font-mono">{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale((s) => Math.min(2.4, s + 0.15))} className="hover:text-blue-400">
            <ZoomIn size={15} />
          </button>
        </div>

        {/* Page Container with Interactive Overlays */}
        <div className="relative bg-white shadow-2xl" style={{ width: pageViewport.width, height: pageViewport.height }}>
          <canvas ref={canvasRef} className="block" />

          {/* OVERLAY 1: Click-to-Edit Text Boxes */}
          {activeTool === 'edit-text' && (
            <div className="absolute inset-0 z-10">
              {textItems.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setOldText(item.str);
                    setNewText(item.str);
                  }}
                  style={{
                    left: item.x,
                    top: item.y,
                    width: Math.max(item.width, 15),
                    height: Math.max(item.height, 14)
                  }}
                  title={`Click to edit: "${item.str}"`}
                  className={`absolute cursor-pointer transition border ${
                    oldText === item.str
                      ? 'border-blue-600 bg-blue-500/20 ring-2 ring-blue-400'
                      : 'border-transparent hover:border-blue-400 hover:bg-blue-400/15'
                  }`}
                />
              ))}
            </div>
          )}

          {/* OVERLAY 2: Interactive Drag & Resize Signature / Seal */}
          {activeTool === 'signature' && sigPreview && (
            <div
              onMouseDown={(e) => startDrag(e, 'move')}
              style={{
                left: sigBox.x,
                top: sigBox.y,
                width: sigBox.w,
                height: sigBox.h
              }}
              className="absolute z-20 border-2 border-dashed border-blue-600 bg-blue-500/10 cursor-move select-none group"
            >
              <img src={sigPreview} alt="Signature" className="w-full h-full object-contain pointer-events-none" />
              <div className="absolute -top-5 left-0 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
                <Move size={10} /> Drag to place
              </div>
              {/* Bottom-Right Resize Handle */}
              <div
                onMouseDown={(e) => startDrag(e, 'resize')}
                className="w-3.5 h-3.5 bg-blue-600 border-2 border-white rounded-full absolute -bottom-1.5 -right-1.5 cursor-nwse-resize shadow"
                title="Drag to resize"
              />
            </div>
          )}
        </div>
      </div>

      {/* Right Context Properties Panel */}
      {activeTool !== 'view' && (
        <aside className="w-80 bg-white border-l border-gray-300 p-4 flex flex-col gap-4 overflow-y-auto shadow-lg z-10">
          {activeTool === 'edit-text' && (
            <div className="flex flex-col gap-3">
              <div className="border-b pb-2">
                <h3 className="font-bold text-sm text-gray-800">Click & Edit Text (Page {currentPage})</h3>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  পেজের যেকোনো লেখার ওপর ক্লিক করুন অথবা নিচে লিখুন। অরিজিনাল ফন্ট সাইজ ও কালার অটোমেটিক সেভ হবে।
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700">Selected / Exact Text</label>
                <input
                  type="text"
                  value={oldText}
                  onChange={(e) => setOldText(e.target.value)}
                  placeholder="Click any word on page..."
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700">Replace With New Text</label>
                <input
                  type="text"
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="Type new text..."
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <button
                disabled={isProcessing || !oldText}
                onClick={() => onEditText(currentPage - 1, oldText, newText)}
                className="mt-2 bg-[#1473E6] hover:bg-[#0D66D0] text-white py-2.5 rounded-lg text-xs font-semibold disabled:opacity-50 transition shadow"
              >
                {isProcessing ? 'Updating Text...' : 'Apply Text Change'}
              </button>
            </div>
          )}

          {activeTool === 'signature' && (
            <div className="flex flex-col gap-3">
              <div className="border-b pb-2">
                <h3 className="font-bold text-sm text-gray-800">Interactive Sign & Seal</h3>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  ছবি আপলোড করে পেজের ওপর মাউস দিয়ে ড্র্যাগ করুন এবং কোণা টেনে ছোট-বড় করুন।
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700">Upload PNG Signature / Seal</label>
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={(e) => handleSigFileChange(e.target.files[0])}
                  className="mt-1.5 w-full text-xs border border-gray-300 rounded-lg p-1.5"
                />
              </div>
              {sigPreview && (
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-800">
                  পেজের ওপর নীল বক্সটি মাউস দিয়ে টেনে সঠিক জায়গায় বসান, তারপর নিচের বাটনে ক্লিক করুন।
                </div>
              )}
              <button
                disabled={isProcessing || !sigFile}
                onClick={applySignatureToPdf}
                className="mt-2 bg-[#1473E6] hover:bg-[#0D66D0] text-white py-2.5 rounded-lg text-xs font-semibold disabled:opacity-50 transition shadow"
              >
                {isProcessing ? 'Embedding...' : 'Stamp Permanently on PDF'}
              </button>
            </div>
          )}

          {activeTool === 'watermark' && (
            <div className="flex flex-col gap-3">
              <h3 className="font-bold text-sm text-gray-800 border-b pb-2">Watermark & Page Numbers</h3>
              <div>
                <label className="text-xs font-semibold text-gray-700">Watermark Text</label>
                <input
                  type="text"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>
              <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addPageNum}
                  onChange={(e) => setAddPageNum(e.target.checked)}
                />
                Add "Page X of Y" footer on all pages
              </label>
              <button
                disabled={isProcessing}
                onClick={() => onAddWatermark(watermarkText, addPageNum)}
                className="mt-2 bg-[#1473E6] hover:bg-[#0D66D0] text-white py-2.5 rounded-lg text-xs font-semibold disabled:opacity-50 transition shadow"
              >
                {isProcessing ? 'Applying...' : 'Apply to All Pages'}
              </button>
            </div>
          )}
        </aside>
      )}
    </div>
  );
}