import { create } from 'zustand';
import { ViewMode } from '../types';

export type FocusState = 'idle' | 'entering' | 'focused' | 'exiting';
export type CeremonyState = 'idle' | 'entering' | 'ritual' | 'sealed';

interface UIState {
  viewMode: ViewMode;
  focusState: FocusState;
  ceremonyState: CeremonyState;
  focusedTaskId: string | null;
  toast: {
    isOpen: boolean;
    title: string;
    message: string;
  };
  setViewMode: (mode: ViewMode) => void;
  setFocusState: (state: FocusState, taskId?: string | null) => void;
  setCeremonyState: (state: CeremonyState) => void;
  setToast: (toast: { isOpen: boolean; title: string; message: string }) => void;
  closeToast: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  viewMode: 'today',
  focusState: 'idle',
  ceremonyState: 'idle',
  focusedTaskId: null,
  toast: {
    isOpen: false,
    title: '',
    message: '',
  },
  setViewMode: (viewMode) => set({ viewMode }),
  setFocusState: (focusState, taskId) =>
    set((state) => ({
      focusState,
      // Only update taskId if explicitly provided, otherwise keep current to prevent sudden unmounting
      focusedTaskId: taskId !== undefined ? taskId : state.focusedTaskId,
    })),
  setCeremonyState: (ceremonyState) => set({ ceremonyState }),
  setToast: (toast) => set({ toast }),
  closeToast: () => set((state) => ({ toast: { ...state.toast, isOpen: false } })),
}));
