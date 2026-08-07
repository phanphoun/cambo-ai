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
  useSendMessageMutation,
  useAskOnceMutation,
  useClearSessionMutation,
  useCheckHealthQuery,
  useListDocumentsQuery,
  useUploadDocumentMutation,
  useIngestUrlMutation,
  useDeleteDocumentMutation,
  useListToolsQuery,
} = chatApi;
