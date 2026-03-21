"use client";

import { create } from "zustand";

interface ExecutionLogState {
  selectedRunId?: string;
  selectRun: (id?: string) => void;
}

export const useExecutionLogStore = create<ExecutionLogState>((set) => ({
  selectedRunId: undefined,
  selectRun: (id) => set({ selectedRunId: id }),
}));
