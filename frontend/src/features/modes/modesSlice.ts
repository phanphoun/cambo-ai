import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type AiMode = "chat" | "translate" | "search" | "code";

interface ModesState {
  current: AiMode;
}

const initialState: ModesState = {
  current: "chat",
};

const modesSlice = createSlice({
  name: "modes",
  initialState,
  reducers: {
    setMode(state, action: PayloadAction<AiMode>) {
      state.current = action.payload;
    },
  },
});

export const { setMode } = modesSlice.actions;
export default modesSlice.reducer;
