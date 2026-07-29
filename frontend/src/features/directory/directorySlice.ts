import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface DirectoryState {
  open: boolean;
  search: string;
}

const initialState: DirectoryState = {
  open: false,
  search: "",
};

const directorySlice = createSlice({
  name: "directory",
  initialState,
  reducers: {
    setDirectoryOpen(state, action: PayloadAction<boolean>) {
      state.open = action.payload;
    },
    setDirectorySearch(state, action: PayloadAction<string>) {
      state.search = action.payload;
    },
  },
});

export const { setDirectoryOpen, setDirectorySearch } = directorySlice.actions;
export default directorySlice.reducer;
