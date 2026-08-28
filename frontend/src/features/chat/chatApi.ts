import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  ChatRequest,
  ChatResponse,
  AskResponse,
  RagDocument,
  ToolDescriptor,
} from "../../types/chat";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

export const chatApi = createApi({
  reducerPath: "chatApi",
  baseQuery: fetchBaseQuery({ baseUrl: API_BASE }),
  tagTypes: ["Health", "Documents"],
  endpoints: (builder) => ({
    sendMessage: builder.mutation<ChatResponse, ChatRequest>({
      query: (body) => ({
        url: "/api/chat/stream",
        method: "POST",
        body,
        responseHandler: async (res) => {
          if (!res.ok || !res.body) {
            const text = await res.text().catch(() => "");
            throw new Error(text || `HTTP ${res.status}`);
          }

          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let full = "";
          let lastEmit = performance.now();

          const flush = () => {
            if (full && performance.now() - lastEmit >= 12) {
              const slice = full;
              full = "";
              lastEmit = performance.now();
              return slice;
            }
            return null;
          };

          while (true) {
            const { value, done } = await reader.read();
            if (done) {
              const slice = flush();
              if (slice) return { reply: slice, _flush: slice };
              return { reply: "", _flush: "" };
            }
            const text = decoder.decode(value, { stream: true });
            for (const line of text.split("\n")) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith("data:")) continue;
              const payload = trimmed.slice(5).trim();
              if (payload === "[DONE]") continue;
              if (payload.startsWith("Error:")) {
                throw new Error(payload.replace(/^Error:\s*/, ""));
              }
              full += payload;
            }
            const slice = flush();
            if (slice) return { reply: slice, _flush: slice };
          }
        },
        transformResponse: (res: any) => ({
          reply: res.reply ?? "",
          ...(res._flush ? { _flush: res._flush } : {}),
        }),
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

    // --- RAG documents ---
    listDocuments: builder.query<RagDocument[], void>({
      query: () => "/api/documents",
      transformResponse: (res: { documents: RagDocument[] }) => res.documents,
      providesTags: ["Documents"],
    }),
    uploadDocument: builder.mutation<RagDocument, { file: File; name?: string }>({
      query: ({ file, name }) => {
        const fd = new FormData();
        fd.append("file", file);
        if (name) fd.append("name", name);
        return { url: "/api/documents/upload", method: "POST", body: fd };
      },
      invalidatesTags: ["Documents"],
    }),
    ingestUrl: builder.mutation<RagDocument, { url: string; name?: string }>({
      query: (body) => ({
        url: "/api/documents/url",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Documents"],
    }),
    deleteDocument: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/api/documents/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Documents"],
    }),

    // --- Tools ---
    listTools: builder.query<ToolDescriptor[], void>({
      query: () => "/api/tools",
      transformResponse: (res: { tools: ToolDescriptor[] }) => res.tools,
    }),
  }),
});

export const {
  useAskOnceMutation,
  useClearSessionMutation,
  useCheckHealthQuery,
  useListDocumentsQuery,
  useUploadDocumentMutation,
  useIngestUrlMutation,
  useDeleteDocumentMutation,
  useListToolsQuery,
} = chatApi;
