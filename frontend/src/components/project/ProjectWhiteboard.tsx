'use client';
import '@excalidraw/excalidraw/index.css';
import React, { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { projectService } from '@/services/project.service';
import Loader from '@/components/ui/Loader';
import { toast } from 'sonner';

// Dynamically import Excalidraw to prevent SSR issues
const Excalidraw = dynamic(
  async () => (await import('@excalidraw/excalidraw')).Excalidraw,
  { ssr: false, loading: () => <div className="flex items-center justify-center h-full w-full"><Loader size="lg" /></div> }
);

interface ProjectWhiteboardProps {
  workspaceId: string;
  projectId: string;
}

export const ProjectWhiteboard: React.FC<ProjectWhiteboardProps> = ({ workspaceId, projectId }) => {
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);
  const excalidrawAPI = useRef<any>(null);
  
  // Track previous state to avoid saving when nothing changes during init
  const isFirstRender = useRef(true);

  useEffect(() => {
    const fetchWhiteboard = async () => {
      try {
        const data = await projectService.getProjectWhiteboard(workspaceId, projectId);
        if (data && data.elements) {
          setInitialData({
            elements: data.elements,
            appState: data.appState || {},
            files: data.files || {}
          });
        } else {
          setInitialData({ elements: [], appState: {}, files: {} });
        }
      } catch (error) {
        console.error("Failed to fetch whiteboard", error);
        toast.error('Lỗi khi tải dữ liệu bảng vẽ.');
        setInitialData({ elements: [], appState: {}, files: {} });
      } finally {
        setLoading(false);
      }
    };
    fetchWhiteboard();
  }, [workspaceId, projectId]);

  const saveWhiteboard = (elements: readonly any[], appState: any, files: any) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    
    saveTimeout.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        await projectService.saveProjectWhiteboard(workspaceId, projectId, elements as any[], appState, files);
      } catch (error) {
        console.error("Failed to save whiteboard", error);
        toast.error('Lỗi khi tự động lưu bảng vẽ.');
      } finally {
        setIsSaving(false);
      }
    }, 5000); // Debounce 5 seconds
  };

  const handleChange = (elements: readonly any[], appState: any, files: any) => {
    if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
    }
    saveWhiteboard(elements, appState, files);
  };

  if (loading) return <div className="flex items-center justify-center h-[500px] w-full"><Loader size="lg" /></div>;

  return (
    <div className="w-full h-[70vh] min-h-[600px] bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200/60 dark:border-white/5 overflow-hidden shadow-sm relative">
      {isSaving && (
        <div className="absolute top-4 right-4 z-50 bg-slate-800/80 text-white px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 backdrop-blur-md">
          <Loader size="sm" className="w-3 h-3 text-white border-white" />
          Đang lưu...
        </div>
      )}
      <Excalidraw
        excalidrawAPI={(api) => { excalidrawAPI.current = api; }}
        initialData={initialData}
        onChange={handleChange}
        theme="light"
        langCode="vi-VN"
        UIOptions={{
          canvasActions: {
            loadScene: false,
            export: { saveFileToDisk: true },
          }
        }}
      />
    </div>
  );
};
