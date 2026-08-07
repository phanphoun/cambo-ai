import { configureStore } from "@reduxjs/toolkit";
import { chatApi } from "./features/chat/chatApi";
import chatReducer from "./features/chat/chatSlice";
import modesReducer from "./features/modes/modesSlice";
import pinReducer from "./features/pin/pinSlice";
import directoryReducer from "./features/directory/directorySlice";
import providerReducer from "./features/provider/providerSlice";
import themeReducer from "./features/theme/themeSlice";
import conversationsReducer from "./features/conversations/conversationsSlice";
import documentsReducer from "./features/documents/documentsSlice";

export const store = configureStore({
  reducer: {
    chat: chatReducer,
    modes: modesReducer,
    pin: pinReducer,
    directory: directoryReducer,
    provider: providerReducer,
    theme: themeReducer,
    conversations: conversationsReducer,
    documents: documentsReducer,
    [chatApi.reducerPath]: chatApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(chatApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
