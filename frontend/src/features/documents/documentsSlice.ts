import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RagDocument } from "../../types/chat";

interface DocumentsState {
  panelOpen: boolean;
  // document IDs used to ground the next chat turn
  selected: string[];
  list: RagDocument[];
}

const initialState: DocumentsState = {
  panelOpen: false,
  selected: [],
  list: [],
};

const documentsSlice = createSlice({
  name: "documents",
  initialState,
  reducers: {
    setDocumentsOpen(state, action: PayloadAction<boolean>) {
      state.panelOpen = action.payload;
    },
    setDocumentList(state, action: PayloadAction<RagDocument[]>) {
      state.list = action.payload;
      // drop any selected ids that no longer exist
      state.selected = state.selected.filter((id) => action.payload.some((d) => d.id === id));
    },
    toggleDocumentSelected(state, action: PayloadAction<string>) {
      const id = action.payload;
      if (state.selected.includes(id)) {
        state.selected = state.selected.filter((x) => x !== id);
      } else {
        state.selected = [...state.selected, id];
      }
    },
    clearSelected(state) {
      state.selected = [];
    },
  },
});

export const {
  setDocumentsOpen,
  setDocumentList,
  toggleDocumentSelected,
  clearSelected,
} = documentsSlice.actions;

export default documentsSlice.reducer;
