import { create } from 'zustand';
import type { SolutionStep } from '../types/solve';

/** Một VERSION của canvas — 1 bản trình bày lời giải tại một thời điểm. */
export interface CanvasVersion {
  id?: string;
  label: string;
  steps: SolutionStep[];
  answerSummary: string;
  createdAt: number;
  noteSaved?: boolean;
}

interface CanvasState {
  isOpen: boolean;
  sessionId: string | null;
  versions: CanvasVersion[];
  current: number;
  width: number;

  open: (sessionId: string) => void;
  close: () => void;
  pushVersion: (sessionId: string, version: Omit<CanvasVersion, 'createdAt'>, autoOpen?: boolean) => void;
  goToVersion: (i: number) => void;
  setWidth: (px: number) => void;
  reset: () => void;
}

const MIN_WIDTH = 380;
const MAX_WIDTH = 900;
const DEFAULT_WIDTH = 560;

export const useCanvasStore = create<CanvasState>((set, get) => ({
  isOpen: false,
  sessionId: null,
  versions: [],
  current: 0,
  width: DEFAULT_WIDTH,

  open: (sessionId) => {
    const changed = get().sessionId !== sessionId;
    set({
      isOpen: true,
      sessionId,
      ...(changed ? { versions: [], current: 0 } : {}),
    });
  },

  close: () => set({ isOpen: false }),

  pushVersion: (sessionId, version, autoOpen = true) =>
    set((s) => {
      // Đổi phiên -> canvas mới hoàn toàn. Cùng phiên -> nối version, giữ lịch sử.
      const base = s.sessionId === sessionId ? s.versions : [];
      const versions = [...base, { ...version, createdAt: Date.now() }];
      // autoOpen: giải bài mới -> bung panel. Rebuild history -> giữ trạng thái mở hiện tại.
      return { sessionId, versions, current: versions.length - 1, isOpen: autoOpen || s.isOpen };
    }),

  goToVersion: (i) => set((s) => ({ current: Math.max(0, Math.min(i, s.versions.length - 1)) })),

  setWidth: (px) => set({ width: Math.max(MIN_WIDTH, Math.min(px, MAX_WIDTH)) }),

  // Reset khi đổi phiên/bài mới — nhưng GIỮ width (thói quen người dùng).
  reset: () => set({ isOpen: false, sessionId: null, versions: [], current: 0 }),
}));
