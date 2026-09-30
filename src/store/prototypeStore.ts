import { create } from 'zustand'

type PrototypeState = {
  debugMode: boolean
  setDebugMode: (value: boolean) => void
}

export const usePrototypeStore = create<PrototypeState>((set) => ({
  debugMode: false,
  setDebugMode: (debugMode) => set({ debugMode }),
}))
