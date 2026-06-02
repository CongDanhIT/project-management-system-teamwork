import { create } from 'zustand';

interface CallState {
    isCallActive: boolean;
    roomName: string | null;
    isDraggableWindowOpen: boolean;
    isIncomingCall: boolean;
    activeCallData: any | null;
    
    startCall: (roomName: string, callData?: any) => void;
    endCall: () => void;
    toggleWindow: () => void;
    setIncomingCall: (isIncoming: boolean, callData?: any) => void;
    joinCall: () => void;
}

export const useCallStore = create<CallState>((set) => ({
    isCallActive: false,
    roomName: null,
    isDraggableWindowOpen: false,
    isIncomingCall: false,
    activeCallData: null,

    startCall: (roomName, callData) => set({
        isCallActive: true,
        roomName,
        isDraggableWindowOpen: true,
        isIncomingCall: false,
        activeCallData: callData || null
    }),

    endCall: () => set({
        isCallActive: false,
        roomName: null,
        isDraggableWindowOpen: false,
        isIncomingCall: false,
        activeCallData: null
    }),

    toggleWindow: () => set((state) => ({
        isDraggableWindowOpen: !state.isDraggableWindowOpen
    })),

    setIncomingCall: (isIncoming, callData) => set({
        isIncomingCall: isIncoming,
        activeCallData: callData || null
    }),

    joinCall: () => set((state) => {
        if (!state.activeCallData) return state;
        return {
            isCallActive: true,
            roomName: state.activeCallData.roomName,
            isDraggableWindowOpen: true,
            isIncomingCall: false
        };
    })
}));
