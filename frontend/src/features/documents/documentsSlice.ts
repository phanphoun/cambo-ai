import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface DocumentsState {
  // document IDs used to ground the next chat turn
  selected: string[];
}

const initialState: DocumentsState = {
  selected: [],
};

const documentsSlice = createSlice({
  name: "documents",
  initialState,
  reducers: {
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
  toggleDocumentSelected,
  clearSelected,
} = documentsSlice.actions;

export default documentsSlice.reducer;
