import React, { useEffect, useRef } from 'react';
import { Trash2, ArrowUp, ArrowDown } from 'lucide-react';

function ThumbnailItem({
  pdfDoc,
  pageNum,
  totalPages,
  isActive,
  onSelect,
  onDelete,
  onMoveUp,
  onMoveDown
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    async function renderThumb() {
      if (!pdfDoc || !canvasRef.current) return;
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 0.22 });
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      if (!cancelled) {
        await page.render({ canvasContext: ctx, viewport }).promise;
      }
    }
    renderThumb();
    return () => { cancelled = true; };
  }, [pdfDoc, pageNum]);

  return (
    <div
      onClick={() => onSelect(pageNum)}
      className={`group relative flex flex-col items-center p-2 rounded-lg cursor-pointer transition ${
        isActive ? 'bg-blue-50 ring-2 ring-[#1473E6] shadow-sm' : 'hover:bg-gray-200/70'
      }`}
    >
      <div className="relative bg-white shadow border border-gray-300">
        <canvas ref={canvasRef} className="block" />
        
        {/* Reorder & Delete Controls on Hover */}
        <div className="opacity-0 group-hover:opacity-100 absolute top-1 right-1 flex flex-col gap-1 transition">
          {pageNum > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); onMoveUp(pageNum - 1); }}
              className="bg-gray-800/85 text-white p-1 rounded hover:bg-black"
              title="Move Page Up"
            >
              <ArrowUp size={11} />
            </button>
          )}
          {pageNum < totalPages && (
            <button
              onClick={(e) => { e.stopPropagation(); onMoveDown(pageNum - 1); }}
              className="bg-gray-800/85 text-white p-1 rounded hover:bg-black"
              title="Move Page Down"
            >
              <ArrowDown size={11} />
            </button>
          )}
          {totalPages > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(pageNum - 1); }}
              className="bg-red-600 text-white p-1 rounded hover:bg-red-700"
              title="Remove Page"
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>
      </div>
      <span className="mt-1.5 text-[11px] font-semibold text-gray-700">Page {pageNum}</span>
    </div>
  );
}

export default function SidebarThumbnails({
  pdfDoc,
  numPages,
  currentPage,
  setCurrentPage,
  onDeletePage,
  onReorderPages
}) {
  if (!pdfDoc) return null;

  const movePage = (index, direction) => {
    const order = Array.from({ length: numPages }, (_, i) => i);
    const target = index + direction;
    if (target < 0 || target >= numPages) return;
    [order[index], order[target]] = [order[target], order[index]];
    onReorderPages(order);
  };

  return (
    <aside className="w-52 bg-[#F4F5F7] border-r border-gray-300 overflow-y-auto p-3 flex flex-col gap-3 select-none">
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
          Pages ({numPages})
        </span>
        <span className="text-[10px] text-gray-400">Hover to reorder</span>
      </div>

      {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
        <ThumbnailItem
          key={`${pageNum}-${numPages}`}
          pdfDoc={pdfDoc}
          pageNum={pageNum}
          totalPages={numPages}
          isActive={currentPage === pageNum}
          onSelect={setCurrentPage}
          onDelete={onDeletePage}
          onMoveUp={(idx) => movePage(idx, -1)}
          onMoveDown={(idx) => movePage(idx, 1)}
        />
      ))}
    </aside>
  );
}