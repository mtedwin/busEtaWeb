import create from "zustand";
  
interface FontSizeState {
    fontSizeSelected: number;
    setFontSize: (term: number) => void;
    clearBusSelected: () => void;
  }

  export const useFontSelectedStore = create<FontSizeState>((set)=>({

    fontSizeSelected:20,
    setFontSize:(fontSize: number) => set({fontSizeSelected: fontSize}),
    clearBusSelected:()=>set({fontSizeSelected: 20}),
  }))
  
  export interface BusSearch {
    searchNumber: string;
  }
