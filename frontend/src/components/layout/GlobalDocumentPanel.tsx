'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, X, Bold, Italic, Underline as UnderlineIcon, 
  Strikethrough, Heading1, Heading2, Heading3, List, ListOrdered, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify, Save, Trash2,
  Download, FileDown
} from 'lucide-react';
import { useUiStore } from '@/stores/ui.store';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';

export function GlobalDocumentPanel() {
  const { isDocPanelOpen, toggleDocPanel } = useUiStore();
  const editorRef = useRef<HTMLDivElement>(null);
  const [docTitle, setDocTitle] = useState('Tai_lieu_khong_ten');
  const [content, setContent] = useState('');

  // Load saved content from localStorage on mount (for auto-save recovery)
  useEffect(() => {
    if (isDocPanelOpen) {
      const saved = localStorage.getItem('teamflow_global_doc_auto');
      if (saved && editorRef.current) {
        editorRef.current.innerHTML = saved;
        setContent(saved);
      }
    }
  }, [isDocPanelOpen]);

  // Auto-save to localStorage every time it changes (just to prevent data loss if accidentally closed)
  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const html = e.currentTarget.innerHTML;
    setContent(html);
    localStorage.setItem('teamflow_global_doc_auto', html);
  };

  const handleCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  // Export to .doc (HTML-based Word document)
  const handleExportWord = () => {
    if (!editorRef.current) return;
    
    const htmlContent = editorRef.current.innerHTML;
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Document</title></head><body>";
    const footer = "</body></html>";
    const sourceHTML = header + htmlContent + footer;
    
    const blob = new Blob(['\ufeff', sourceHTML], {
        type: 'application/msword'
    });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${docTitle || 'Tai_lieu'}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Đã tải xuống máy tính file Word (.doc)');
  };

  // Export to .html
  const handleExportHtml = () => {
    if (!editorRef.current) return;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${docTitle}</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 40px; }
          h1 { color: #1e293b; }
          h2 { color: #334155; }
        </style>
      </head>
      <body>
        ${editorRef.current.innerHTML}
      </body>
      </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${docTitle || 'Tai_lieu'}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Đã tải xuống máy tính file Web (.html)');
  };

  const handleClear = () => {
    if (confirm('Bạn có chắc chắn muốn xóa toàn bộ vùng làm việc này?')) {
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
        localStorage.removeItem('teamflow_global_doc_auto');
        setContent('');
        toast.info('Đã xóa trắng vùng làm việc.');
      }
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isDocPanelOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleDocPanel}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110]"
          />

          {/* Panel - Chiếm gần hết màn hình như 1 Workspace thực thụ */}
          <motion.div
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0.5 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-[95vw] h-[95vh] bg-[#F3F4F6] dark:bg-slate-950 rounded-t-[32px] shadow-2xl z-[120] border border-slate-300/50 dark:border-white/10 flex flex-col overflow-hidden"
          >
            {/* Header: Chứa Tiêu đề tài liệu & Nút tải về */}
            <div className="bg-white dark:bg-surface-secondary border-b border-slate-200 dark:border-white/5 shrink-0 px-6 py-3 flex items-center justify-between z-10 shadow-sm">
              <div className="flex items-center gap-4 flex-1">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trình soạn thảo văn bản</span>
                  <input 
                    type="text" 
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    placeholder="Nhập tên tài liệu..."
                    className="text-lg font-black text-slate-800 dark:text-white bg-transparent border-none outline-none focus:ring-0 p-0 placeholder:text-slate-300 w-[300px]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-black/20 p-1 rounded-xl border border-slate-100 dark:border-white/5">
                  <button
                    onClick={handleExportWord}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-[13px] font-bold hover:bg-blue-700 transition-colors shadow-sm"
                    title="Tải về dưới dạng file Word (.doc)"
                  >
                    <Download className="w-4 h-4" /> Tải về (.doc)
                  </button>
                  <button
                    onClick={handleExportHtml}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[13px] font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                    title="Tải về dưới dạng trang Web (.html)"
                  >
                    <FileDown className="w-4 h-4" /> (.html)
                  </button>
                </div>
                
                <div className="w-[1px] h-8 bg-slate-200 dark:bg-slate-700 mx-2" />
                
                <button
                  onClick={handleClear}
                  className="p-2.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  title="Xóa trắng vùng làm việc"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button
                  onClick={toggleDocPanel}
                  className="p-2.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-white/10 transition-colors ml-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Comprehensive Toolbar - Nằm ngay dưới header giống Word */}
            <div className="bg-slate-50 dark:bg-surface-tertiary border-b border-slate-200 dark:border-white/5 shrink-0 px-6 py-2 flex flex-wrap items-center gap-4 z-10">
              
              {/* Group: Headings */}
              <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200/50 dark:border-white/5 shadow-sm">
                <ToolbarButton icon={<Heading1 />} onClick={() => handleCommand('formatBlock', 'H1')} title="Tiêu đề 1" />
                <ToolbarButton icon={<Heading2 />} onClick={() => handleCommand('formatBlock', 'H2')} title="Tiêu đề 2" />
                <ToolbarButton icon={<Heading3 />} onClick={() => handleCommand('formatBlock', 'H3')} title="Tiêu đề 3" />
              </div>

              {/* Group: Font Styles */}
              <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200/50 dark:border-white/5 shadow-sm">
                <ToolbarButton icon={<Bold />} onClick={() => handleCommand('bold')} title="In đậm (Ctrl+B)" />
                <ToolbarButton icon={<Italic />} onClick={() => handleCommand('italic')} title="In nghiêng (Ctrl+I)" />
                <ToolbarButton icon={<UnderlineIcon />} onClick={() => handleCommand('underline')} title="Gạch dưới (Ctrl+U)" />
                <ToolbarButton icon={<Strikethrough />} onClick={() => handleCommand('strikeThrough')} title="Gạch ngang" />
              </div>

              {/* Group: Lists */}
              <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200/50 dark:border-white/5 shadow-sm">
                <ToolbarButton icon={<List />} onClick={() => handleCommand('insertUnorderedList')} title="Danh sách chấm tròn" />
                <ToolbarButton icon={<ListOrdered />} onClick={() => handleCommand('insertOrderedList')} title="Danh sách đánh số" />
              </div>

              {/* Group: Alignment */}
              <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200/50 dark:border-white/5 shadow-sm">
                <ToolbarButton icon={<AlignLeft />} onClick={() => handleCommand('justifyLeft')} title="Căn trái" />
                <ToolbarButton icon={<AlignCenter />} onClick={() => handleCommand('justifyCenter')} title="Căn giữa" />
                <ToolbarButton icon={<AlignRight />} onClick={() => handleCommand('justifyRight')} title="Căn phải" />
                <ToolbarButton icon={<AlignJustify />} onClick={() => handleCommand('justifyFull')} title="Căn đều 2 bên" />
              </div>
            </div>

            {/* Workspace Area - Cảm giác tờ giấy A4 */}
            <div className="flex-1 overflow-y-auto p-8 lg:p-12 bg-[#F3F4F6] dark:bg-slate-950 flex justify-center">
              <div 
                className="w-[210mm] min-h-[297mm] bg-white dark:bg-slate-900 rounded-sm shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-slate-200 dark:border-white/5 p-[25.4mm] outline-none prose prose-slate dark:prose-invert prose-h1:text-3xl prose-h1:font-black prose-h2:text-2xl prose-h2:font-bold prose-p:text-slate-700 dark:prose-p:text-slate-300 focus:ring-4 ring-brand-primary/10 transition-all origin-top shrink-0 empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400"
                contentEditable
                suppressContentEditableWarning
                ref={editorRef}
                onInput={handleInput}
                data-placeholder="Bắt đầu soạn thảo tài liệu..."
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

function ToolbarButton({ icon, onClick, title }: { icon: React.ReactNode, onClick: () => void, title: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="p-2 rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
    >
      {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-4 h-4' })}
    </button>
  );
}
