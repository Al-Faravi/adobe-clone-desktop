import React, { useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import TopToolbar from './components/TopToolbar';
import SidebarThumbnails from './components/SidebarThumbnails';
import PdfCanvasViewer from './components/PdfCanvasViewer';
import { X, Minimize2, Layers } from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const API_BASE = 'http://127.0.0.1:8765/api';

export default function App() {
  const [pdfFile, setPdfFile] = useState(null);
  const [fileSizeKb, setFileSizeKb] = useState(0);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTool, setActiveTool] = useState('view');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Smart Compress & Bulk Compress Modals
  const [showCompressModal, setShowCompressModal] = useState(false);
  const [targetMaxKb, setTargetMaxKb] = useState(500);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkFiles, setBulkFiles] = useState([]);

  const loadPdfFromBlob = async (blob, name) => {
    const file = new File([blob], name, { type: 'application/pdf' });
    setPdfFile(file);
    setFileSizeKb((file.size / 1024).toFixed(1));
    const arrayBuffer = await file.arrayBuffer();
    const loadedPdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    setPdfDoc(loadedPdf);
    setNumPages(loadedPdf.numPages);
    setCurrentPage((prev) => Math.min(prev, loadedPdf.numPages) || 1);
  };

  const handleCloseFile = () => {
    setPdfFile(null);
    setPdfDoc(null);
    setNumPages(0);
    setActiveTool('view');
    setStatusMsg('Ready');
  };

  const callPdfApi = async (endpoint, formData, successLabel) => {
    setIsProcessing(true);
    setStatusMsg('Processing...');
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Operation failed');
      const stats = res.headers.get('X-Stats');
      const blob = await res.blob();
      await loadPdfFromBlob(blob, pdfFile.name);
      setStatusMsg(stats ? `${successLabel} (${stats})` : successLabel);
    } catch (err) {
      setStatusMsg(`Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSmartCompress = async () => {
    setShowCompressModal(false);
    const fd = new FormData();
    fd.append('file', pdfFile);
    fd.append('max_kb', targetMaxKb);
    await callPdfApi('/compress', fd, 'Smart Compress');
  };

  const handleBulkCompress = async () => {
    if (bulkFiles.length === 0) return;
    setIsProcessing(true);
    setStatusMsg(`Compressing ${bulkFiles.length} PDFs under ${targetMaxKb} KB...`);
    try {
      const fd = new FormData();
      bulkFiles.forEach((f) => fd.append('files', f));
      fd.append('max_kb', targetMaxKb);
      const res = await fetch(`${API_BASE}/bulk-compress`, { method: 'POST', body: fd });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Compressed_PDFs_Max_${targetMaxKb}KB.zip`;
      a.click();
      setStatusMsg(`Bulk Compressed ${bulkFiles.length} files! Downloaded ZIP.`);
      setShowBulkModal(false);
      setBulkFiles([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditText = (pageNum, oldText, newText) => {
    const fd = new FormData();
    fd.append('file', pdfFile);
    fd.append('page_num', pageNum);
    fd.append('old_text', oldText);
    fd.append('new_text', newText);
    callPdfApi('/edit-text', fd, 'Text Replaced');
  };

  const handleDeletePage = (pageIndex) => {
    const fd = new FormData();
    fd.append('file', pdfFile);
    fd.append('pages', String(pageIndex));
    callPdfApi('/remove-pages', fd, `Deleted Page ${pageIndex + 1}`);
  };

  const handleReorderPages = (newOrder) => {
    const fd = new FormData();
    fd.append('file', pdfFile);
    fd.append('order', newOrder.join(','));
    callPdfApi('/reorder-pages', fd, 'Pages Reordered');
  };

  const handleAddBlankPage = () => {
    const fd = new FormData();
    fd.append('file', pdfFile);
    fd.append('insert_at', currentPage);
    callPdfApi('/add-blank-page', fd, 'Blank Page Added');
  };

  const handleRotatePage = () => {
    const fd = new FormData();
    fd.append('file', pdfFile);
    fd.append('page_num', currentPage - 1);
    fd.append('angle', 90);
    callPdfApi('/rotate-page', fd, 'Rotated +90°');
  };

  const handleMergeFiles = (extraFiles) => {
    const fd = new FormData();
    fd.append('files', pdfFile);
    extraFiles.forEach((f) => fd.append('files', f));
    callPdfApi('/merge', fd, 'Merged PDFs Successfully');
  };

  const handleAddSignature = (pageNum, sigFile, x, y, width, height) => {
    const fd = new FormData();
    fd.append('file', pdfFile);
    fd.append('signature', sigFile);
    fd.append('page_num', pageNum);
    fd.append('x', x);
    fd.append('y', y);
    fd.append('width', width);
    fd.append('height', height);
    callPdfApi('/add-signature', fd, 'Signature Stamped!');
  };

  const handleAddWatermark = (watermarkText, addPageNum) => {
    const fd = new FormData();
    fd.append('file', pdfFile);
    fd.append('watermark_text', watermarkText);
    fd.append('add_page_num', addPageNum);
    callPdfApi('/watermark', fd, 'Watermark Applied');
  };

  const handleConvertWord = async () => {
    setIsProcessing(true);
    setStatusMsg('Converting to Word (.docx)...');
    try {
      const fd = new FormData();
      fd.append('file', pdfFile);
      const res = await fetch(`${API_BASE}/pdf-to-word`, { method: 'POST', body: fd });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = pdfFile.name.replace(/\.pdf$/i, '.docx');
      a.click();
      setStatusMsg('Exported Word Document!');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!pdfFile) return;
    const url = URL.createObjectURL(pdfFile);
    const a = document.createElement('a');
    a.href = url;
    a.download = `edited_${pdfFile.name}`;
    a.click();
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden font-sans">
      <TopToolbar
        fileName={pdfFile?.name}
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        onUploadPdf={(file) => loadPdfFromBlob(file, file.name)}
        onDownloadPdf={handleDownloadPdf}
        onAddBlankPage={handleAddBlankPage}
        onRotatePage={handleRotatePage}
        onOpenCompressModal={() => setShowCompressModal(true)}
        onOpenBulkCompressModal={() => setShowBulkModal(true)}
        onConvertWord={handleConvertWord}
        onMergeFiles={handleMergeFiles}
        onCloseFile={handleCloseFile}
        isProcessing={isProcessing}
      />

      <div className="flex-1 flex overflow-hidden">
        <SidebarThumbnails
          pdfDoc={pdfDoc}
          numPages={numPages}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          onDeletePage={handleDeletePage}
          onReorderPages={handleReorderPages}
        />

        <PdfCanvasViewer
          pdfDoc={pdfDoc}
          fileSizeKb={fileSizeKb}
          currentPage={currentPage}
          activeTool={activeTool}
          onUploadPdf={(file) => loadPdfFromBlob(file, file.name)}
          onOpenBulkCompressModal={() => setShowBulkModal(true)}
          onEditText={handleEditText}
          onAddSignature={handleAddSignature}
          onAddWatermark={handleAddWatermark}
          isProcessing={isProcessing}
        />
      </div>

      {/* Single File Smart Compress Modal */}
      {showCompressModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Minimize2 size={18} className="text-amber-600" /> Smart Quality-Safe Compression
              </h3>
              <button onClick={() => setShowCompressModal(false)}><X size={18} /></button>
            </div>
            <p className="text-xs text-gray-600 mt-3">
              বর্তমান ফাইল সাইজ: <strong>{fileSizeKb} KB</strong>। ফাইলটি আপনার দেওয়া Max Size-এর কম হলে কোনো পরিবর্তন ছাড়াই অরিজিনাল কোয়ালিটি রাখা হবে।
            </p>
            <div className="mt-4">
              <label className="text-xs font-bold text-gray-700">Target Maximum Size (KB)</label>
              <input
                type="number"
                value={targetMaxKb}
                onChange={(e) => setTargetMaxKb(Number(e.target.value))}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm font-semibold"
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setShowCompressModal(false)} className="px-4 py-2 text-xs rounded-lg border">Cancel</button>
              <button onClick={handleSmartCompress} className="px-4 py-2 text-xs rounded-lg bg-[#1473E6] text-white font-semibold">
                Compress Safely
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Compress Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Layers size={18} className="text-emerald-600" /> Bulk PDF Size Reducer
              </h3>
              <button onClick={() => setShowBulkModal(false)}><X size={18} /></button>
            </div>
            <div className="mt-4 flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700">Select Multiple PDF Files</label>
                <input
                  type="file"
                  accept="application/pdf"
                  multiple
                  onChange={(e) => setBulkFiles(Array.from(e.target.files))}
                  className="mt-1 w-full border rounded-lg p-2 text-xs"
                />
                {bulkFiles.length > 0 && (
                  <p className="text-[11px] text-emerald-700 mt-1 font-medium">{bulkFiles.length} files selected</p>
                )}
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700">Target Max Size Per File (KB)</label>
                <input
                  type="number"
                  value={targetMaxKb}
                  onChange={(e) => setTargetMaxKb(Number(e.target.value))}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm font-semibold"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setShowBulkModal(false)} className="px-4 py-2 text-xs rounded-lg border">Cancel</button>
              <button
                disabled={isProcessing || bulkFiles.length === 0}
                onClick={handleBulkCompress}
                className="px-4 py-2 text-xs rounded-lg bg-emerald-600 text-white font-semibold disabled:opacity-50"
              >
                {isProcessing ? 'Processing Bulk...' : 'Compress All & Download ZIP'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Status Bar */}
      <footer className="h-7 bg-[#1E2229] text-gray-300 text-[11px] px-4 flex items-center justify-between border-t border-black/50">
        <span>{statusMsg || 'Ready'}</span>
        {numPages > 0 && <span>Page {currentPage} of {numPages} | File Size: {fileSizeKb} KB</span>}
      </footer>
    </div>
  );
}