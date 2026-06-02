"use client";

import React, { useEffect, useRef } from 'react';
import { Rnd } from 'react-rnd';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { useCallStore } from '@/stores/useCallStore';
import { useAuthStore } from '@/stores/auth.store';
import { X, Minus, Maximize2 } from 'lucide-react';
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

    // Tự động đóng call khi component unmount? Không cần vì store giữ state
    if (!isCallActive || !roomName) return null;

    if (!isDraggableWindowOpen) {
        return (
            <div className="fixed bottom-6 right-6 z-[9999]">
                <Button 
                    onClick={toggleWindow}
                    className="rounded-full shadow-2xl h-14 bg-indigo-600 hover:bg-indigo-700 text-white animate-bounce px-6 flex items-center gap-2"
                >
                    <Maximize2 size={20} /> 
                    <span className="font-semibold">Đang trong cuộc gọi...</span>
                </Button>
            </div>
        );
    }

    return (
        <Rnd 
            default={{ 
                x: typeof window !== 'undefined' ? window.innerWidth - 650 : 0, 
                y: typeof window !== 'undefined' ? window.innerHeight - 550 : 0, 
                width: 600, 
                height: 450 
            }}
            minWidth={350}
            minHeight={250}
            bounds="window"
            dragHandleClassName="drag-handle"
            className="z-[9999] overflow-hidden rounded-xl shadow-2xl border border-border bg-background"
        >
            <div className="flex flex-col w-full h-full">
                {/* Header (Drag Handle) */}
                <div className="drag-handle bg-secondary/80 backdrop-blur flex items-center justify-between px-4 py-3 cursor-move border-b border-border">
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="font-semibold text-sm">TeamFlow Video Call</span>
                    </div>
                    <div className="flex gap-1">
                        <button 
                            onClick={toggleWindow} 
                            className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-md transition-colors"
                            title="Thu nhỏ"
                        >
                            <Minus size={16} />
                        </button>
                        <button 
                            onClick={handleEndCall} 
                            className="p-1.5 hover:bg-red-500/20 text-red-500 rounded-md transition-colors"
                            title="Kết thúc"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Jitsi Content */}
                <div className="w-full relative bg-black/95" style={{ height: 'calc(100% - 45px)' }}>
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
                            prejoinPageEnabled: false // Vào thẳng luôn không qua màn hình chờ
                        }}
                        interfaceConfigOverwrite={{
                            DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
                            TOOLBAR_BUTTONS: [
                                'microphone', 'camera', 'desktop', 'fullscreen',
                                'fodeviceselection', 'hangup', 'profile', 'chat',
                                'settings', 'videoquality', 'filmstrip', 'tileview'
                            ]
                        }}
                        getIFrameRef={(iframeRef) => {
                            iframeRef.style.height = '100%';
                            iframeRef.style.width = '100%';
                            iframeRef.style.border = 'none';
                        }}
                    />
                    
                    {/* Góc Resize (Trực quan hóa) */}
                    <div className="absolute bottom-1 right-1 w-3 h-3 cursor-nwse-resize opacity-50 pointer-events-none">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                            <polyline points="21 15 21 21 15 21"></polyline>
                            <line x1="21" y1="21" x2="15" y2="15"></line>
                        </svg>
                    </div>
                </div>
            </div>
        </Rnd>
    );
};
