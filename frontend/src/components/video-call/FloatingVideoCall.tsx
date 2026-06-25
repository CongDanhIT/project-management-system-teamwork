"use client";

import React, { useEffect, useRef } from 'react';
import { Rnd } from 'react-rnd';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { useCallStore } from '@/stores/useCallStore';
import { useAuthStore } from '@/stores/auth.store';
import { X, Minus, Maximize2, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWorkspaceRole } from '@/hooks/useWorkspaceRole';
import { workspaceService } from '@/services/workspace.service';

export const FloatingVideoCall = () => {
    const { isCallActive, roomName, isDraggableWindowOpen, toggleWindow, endCall } = useCallStore();
    const { user } = useAuthStore();
    const { workspaceId } = useWorkspaceRole();
    
    const handleEndCall = async () => {
        if (workspaceId) {
            try {
                await workspaceService.endVideoCall(workspaceId);
            } catch (err) {
                console.error("Failed to end video call on server", err);
            }
        }
        endCall();
    };

    if (!isCallActive || !roomName) return null;

    if (!isDraggableWindowOpen) {
        return (
            <div className="fixed bottom-8 right-8 z-[9999] animate-in slide-in-from-bottom-5 fade-in duration-500">
                <Button 
                    onClick={toggleWindow}
                    className="rounded-full shadow-[0_8px_30px_-12px_rgba(199,249,100,0.5)] dark:shadow-[0_8px_30px_-12px_rgba(199,249,100,0.3)] h-14 bg-brand-primary hover:bg-[#b0df57] text-[#04100E] px-6 flex items-center gap-3 transition-all hover:scale-105 border border-white/20"
                >
                    <div className="relative flex items-center justify-center">
                        <Video size={20} className="relative z-10" />
                        <div className="absolute inset-0 bg-white/50 rounded-full blur-md animate-ping" />
                    </div>
                    <span className="font-black text-[14px] tracking-wide uppercase">Trở lại cuộc gọi</span>
                </Button>
            </div>
        );
    }

    return (
        <Rnd 
            default={{ 
                x: typeof window !== 'undefined' ? window.innerWidth - 700 : 0, 
                y: typeof window !== 'undefined' ? window.innerHeight - 550 : 0, 
                width: 650, 
                height: 480 
            }}
            minWidth={400}
            minHeight={300}
            bounds="window"
            dragHandleClassName="drag-handle"
            className="z-[9999] overflow-hidden rounded-[28px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)] border border-slate-200 dark:border-white/5 bg-[#191C1E] transition-opacity"
        >
            <div className="flex flex-col w-full h-full relative">
                {/* Header (Drag Handle) */}
                <div className="drag-handle bg-gradient-to-r from-slate-50 to-white dark:from-[#191C1E] dark:to-[#22272B] flex items-center justify-between px-5 py-3.5 cursor-move border-b border-slate-200 dark:border-white/5 relative z-20">
                    <div className="flex items-center gap-3">
                        <div className="relative flex items-center justify-center">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-[#C7F964] animate-pulse relative z-10"></div>
                            <div className="absolute inset-0 bg-emerald-500/40 dark:bg-[#C7F964]/40 rounded-full blur-sm animate-ping"></div>
                        </div>
                        <span className="font-extrabold text-[15px] text-slate-800 dark:text-white tracking-wide">TeamFlow Meet</span>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={toggleWindow} 
                            className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white rounded-full transition-all"
                            title="Thu nhỏ"
                        >
                            <Minus size={14} strokeWidth={3} />
                        </button>
                        <button 
                            onClick={handleEndCall} 
                            className="w-8 h-8 flex items-center justify-center bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-500 hover:text-red-600 dark:hover:text-red-400 rounded-full transition-all"
                            title="Kết thúc"
                        >
                            <X size={14} strokeWidth={3} />
                        </button>
                    </div>
                </div>

                {/* Jitsi Content */}
                <div className="w-full relative flex-1 bg-[#121418] rounded-b-[28px] overflow-hidden z-10">
                    <JitsiMeeting
                        domain="meet.jit.si"
                        roomName={roomName}
                        userInfo={{
                            displayName: user?.name || "Người dùng",
                            email: user?.email || ""
                        }}
                        configOverwrite={{ 
                            startWithAudioMuted: true,
                            startWithVideoMuted: false,
                            prejoinPageEnabled: false, // Bỏ qua màn hình chờ nếu có thể
                            disableDeepLinking: true,
                        }}
                        interfaceConfigOverwrite={{
                            DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
                            TOOLBAR_BUTTONS: [
                                'microphone', 'camera', 'desktop', 'fullscreen',
                                'fodeviceselection', 'hangup', 'chat',
                                'settings', 'videoquality', 'tileview'
                            ],
                            SHOW_JITSI_WATERMARK: false,
                            SHOW_WATERMARK_FOR_GUESTS: false,
                        }}
                        getIFrameRef={(iframeRef) => {
                            iframeRef.style.height = '100%';
                            iframeRef.style.width = '100%';
                            iframeRef.style.border = 'none';
                            iframeRef.style.background = '#121418';
                        }}
                    />
                    
                    {/* Góc Resize (Trực quan hóa) */}
                    <div className="absolute bottom-2 right-2 w-4 h-4 cursor-nwse-resize opacity-50 hover:opacity-100 pointer-events-none transition-opacity z-50">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white drop-shadow-md">
                            <polyline points="21 15 21 21 15 21"></polyline>
                            <line x1="21" y1="21" x2="15" y2="15"></line>
                        </svg>
                    </div>
                </div>
            </div>
        </Rnd>
    );
};
