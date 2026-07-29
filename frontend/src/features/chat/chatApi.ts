import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { ChatRequest, ChatResponse, AskResponse } from "../../types/chat";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

export const chatApi = createApi({
  reducerPath: "chatApi",
  baseQuery: fetchBaseQuery({ baseUrl: API_BASE }),
  tagTypes: ["Health"],
  endpoints: (builder) => ({
    sendMessage: builder.mutation<ChatResponse, ChatRequest>({
      query: (body) => ({
        url: "/api/chat",
        method: "POST",
        body,
      }),
    }),
    askOnce: builder.mutation<AskResponse, { question: string }>({
      query: (body) => ({
        url: "/api/ask",
        method: "POST",
        body,
      }),
    }),
    clearSession: builder.mutation<{ message: string }, string>({
      query: (sessionId) => ({
        url: `/api/chat/${sessionId}`,
        method: "DELETE",
      }),
    }),
    checkHealth: builder.query<{ status: string; ok: boolean }, void>({
      query: () => "/health",
      providesTags: ["Health"],
    }),
  }),
});

export const {
  useSendMessageMutation,
  useAskOnceMutation,
  useClearSessionMutation,
  useCheckHealthQuery,
} = chatApi;
