import create from "zustand";
import { BusInfo } from "../components/TypeCollection";
  
interface BusSelectState {
    busSelected: BusInfo;
    setBusSelected: (term: BusInfo) => void;
    clearBusSelected: () => void;
  }

  export const useBusSelectedStore = create<BusSelectState>((set)=>({
    busSelected:<BusInfo>{},
    setBusSelected:(BusNumber: BusInfo) => set({busSelected: BusNumber}),
    clearBusSelected:()=>set({busSelected: <BusInfo>{}}),
  }))
  
  export interface BusSearch {
    searchNumber: string;
  }