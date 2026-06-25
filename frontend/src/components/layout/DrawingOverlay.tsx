'use client';

import React, { useRef } from 'react';
import dynamic from 'next/dynamic';
import { useUiStore } from '@/stores/ui.store';
import { createPortal } from 'react-dom';
import { Loader } from 'lucide-react';
import '@excalidraw/excalidraw/index.css';
import { cn } from '@/lib/utils';

const Excalidraw = dynamic(
  async () => (await import('@excalidraw/excalidraw')).Excalidraw,
  { 
    ssr: false, 
    loading: () => (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/5 backdrop-blur-sm z-[99]">
        <Loader className="w-8 h-8 text-brand-primary animate-spin" />
      </div>
    ) 
  }
);

export function DrawingOverlay() {
  const { isDrawingMode } = useUiStore();
  const excalidrawAPI = useRef<any>(null);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div 
      className={cn(
        "fixed inset-0 z-[90] transition-all duration-300",
        !isDrawingMode && "hidden"
      )}
    >
      {/* Cảnh báo chế độ vẽ đang bật */}
      {isDrawingMode && (
        <div className="absolute bottom-[88px] left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-emerald-500 text-white text-[13px] font-bold rounded-full shadow-lg pointer-events-none animate-in fade-in slide-in-from-bottom-4">
          Chế độ vẽ đang bật. Không thể click vào các nút bên dưới.
        </div>
      )}

      {/* 
        Sử dụng Excalidraw 
        - theme="light" (có thể đổi theo hệ thống nhưng overlay thì nên để sáng màu hoặc trong suốt)
        - zenModeEnabled = false để hiện toolbars
        - viewModeEnabled = !isDrawingMode
      */}
      <div className="w-full h-full [&_.excalidraw]:bg-transparent [&_.App-menu_bottom]:hidden [&_.layer-ui__wrapper]:bg-transparent">
        <Excalidraw
          excalidrawAPI={(api) => { excalidrawAPI.current = api; }}
          theme="light"
          langCode="vi-VN"
          viewModeEnabled={!isDrawingMode}
          // Khởi tạo bảng với background trong suốt
          initialData={{
            appState: {
              viewBackgroundColor: "transparent",
              currentItemStrokeColor: "#ef4444", // Bút đỏ mặc định
            }
          }}
          UIOptions={{
            canvasActions: {
              loadScene: false,
              export: { saveFileToDisk: true },
              saveToActiveFile: false,
              saveAsImage: true,
              clearCanvas: true,
              changeViewBackgroundColor: false, // Ẩn chọn màu nền
            },
            tools: {
              image: false, // Ẩn nút thêm ảnh theo yêu cầu
            }
          }}
        />
      </div>
    </div>,
    document.body
  );
}
