import create from "zustand";
  
interface BusSearchState {
    searchText: string;
    setSearchText: (term: string) => void;
    clearSearch: () => void;
  }

  export const useStore = create<BusSearchState>((set)=>({
    searchText:"",
    setSearchText:(BusNumber: string) => set({searchText: BusNumber}),
    clearSearch:()=>set({searchText: ""}),
  }))
  
  export interface BusSearch {
    searchNumber: string;
  }