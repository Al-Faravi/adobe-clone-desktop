import React, { useRef } from 'react';
import {
  FileUp, Download, Type, Minimize2, FilePlus2,
  RotateCw, Files, PenTool, FileText, Stamp, Home, Layers
} from 'lucide-react';

export default function TopToolbar({
  fileName,
  activeTool,
  setActiveTool,
  onUploadPdf,
  onDownloadPdf,
  onAddBlankPage,
  onRotatePage,
  onOpenCompressModal,
  onOpenBulkCompressModal,
  onConvertWord,
  onMergeFiles,
  onCloseFile,
  isProcessing
}) {
  const fileInputRef = useRef(null);
  const mergeInputRef = useRef(null);

  const tools = [
    { id: 'view', label: 'View / Select', icon: null },
    { id: 'edit-text', label: 'Click & Edit Text', icon: Type },
    { id: 'signature', label: 'Drag Sign / Stamp', icon: PenTool },
    { id: 'watermark', label: 'Watermark & Page No.', icon: Stamp },
  ];

  return (
    <header className="h-14 bg-[#1E2229] text-white flex items-center justify-between px-4 border-b border-black/50 select-none shadow-md z-20">
      {/* Left: Brand Logo + File Controls */}
      <div className="flex items-center gap-3">
        <div
          onClick={onCloseFile}
          className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition"
          title="Back to Home Dashboard"
        >
          <img
            src="/alfaravi logo.png"
            alt="Al-Faravi Logo"
            className="h-8 w-8 object-contain rounded bg-white p-0.5 shadow-sm"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div className="leading-tight">
            <div className="font-bold text-sm tracking-wide text-white flex items-center gap-1.5">
              <span>Al-Faravi PDF Pro</span>
              <span className="text-[10px] bg-[#1473E6] px-1.5 py-0.2 rounded font-semibold">OFFICE</span>
            </div>
            <div className="text-[10px] text-gray-400">Commercial & Document Suite</div>
          </div>
        </div>

        <div className="h-6 w-[1px] bg-white/15 mx-1" />

        {fileName && (
          <button
            onClick={onCloseFile}
            className="flex items-center gap-1 bg-white/10 hover:bg-white/20 px-2.5 py-1.5 rounded text-xs transition"
            title="Home Dashboard"
          >
            <Home size={14} /> Home
          </button>
        )}

        <button
          onClick={() => fileInputRef.current.click()}
          className="flex items-center gap-1.5 bg-[#1473E6] hover:bg-[#0D66D0] px-3 py-1.5 rounded text-xs font-medium transition shadow-sm"
        >
          <FileUp size={14} /> Open PDF
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => e.target.files[0] && onUploadPdf(e.target.files[0])}
        />

        <button
          onClick={onOpenBulkCompressModal}
          className="flex items-center gap-1.5 bg-emerald-600/90 hover:bg-emerald-600 px-3 py-1.5 rounded text-xs font-medium transition"
        >
          <Layers size={14} /> Bulk Compress
        </button>
      </div>

      {/* Center: Active Document Tools */}
      {fileName && (
        <div className="flex items-center gap-1 bg-black/35 p-1 rounded-lg border border-white/10">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition ${
                  activeTool === tool.id
                    ? 'bg-[#1473E6] text-white shadow'
                    : 'text-gray-300 hover:bg-white/10'
                }`}
              >
                {Icon && <Icon size={13} />}
                {tool.label}
              </button>
            );
          })}

          <div className="h-4 w-[1px] bg-white/20 mx-1" />

          <button
            onClick={onAddBlankPage}
            disabled={isProcessing}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-200 hover:bg-white/10"
            title="Insert Blank Page After Current"
          >
            <FilePlus2 size={13} /> +Page
          </button>

          <button
            onClick={onRotatePage}
            disabled={isProcessing}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-200 hover:bg-white/10"
            title="Rotate 90° Clockwise (Repeatable)"
          >
            <RotateCw size={13} /> Rotate 90°
          </button>

          <button
            onClick={() => mergeInputRef.current.click()}
            disabled={isProcessing}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-200 hover:bg-white/10"
            title="Merge PDFs"
          >
            <Files size={13} /> Merge
          </button>
          <input
            ref={mergeInputRef}
            type="file"
            accept="application/pdf"
            multiple
            className="hidden"
            onChange={(e) => e.target.files.length > 0 && onMergeFiles(Array.from(e.target.files))}
          />

          <button
            onClick={onOpenCompressModal}
            disabled={isProcessing}
            className="flex items-center gap-1 px-2.5 py-1 rounded text-xs bg-amber-600 hover:bg-amber-500 text-white font-medium"
          >
            <Minimize2 size={13} /> Smart Compress
          </button>

          <button
            onClick={onConvertWord}
            disabled={isProcessing}
            className="flex items-center gap-1 px-2.5 py-1 rounded text-xs bg-sky-600 hover:bg-sky-500 text-white font-medium"
          >
            <FileText size={13} /> To Word
          </button>
        </div>
      )}

      {/* Right: Save Button */}
      <div className="flex items-center gap-2">
        {fileName && (
          <button
            onClick={onDownloadPdf}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 rounded text-xs font-semibold transition shadow"
          >
            <Download size={14} /> Save PDF
          </button>
        )}
      </div>
    </header>
  );
}