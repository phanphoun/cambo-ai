import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { UserProfile } from "./authSlice";

import { API_BASE } from "../../config/api";

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: UserProfile;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_BASE}/api/auth`,
    prepareHeaders: (headers) => {
      try {
        const token = localStorage.getItem("sastra_auth_token");
        if (token) {
          headers.set("Authorization", `Bearer ${token}`);
        }
      } catch {
        /* noop */
      }
      return headers;
    },
  }),
  tagTypes: ["User"],
  endpoints: (builder) => ({
    register: builder.mutation<AuthResponse, RegisterPayload>({
      query: (body) => ({
        url: "/register",
        method: "POST",
        body,
      }),
      invalidatesTags: ["User"],
    }),
    login: builder.mutation<AuthResponse, LoginPayload>({
      query: (body) => ({
        url: "/login",
        method: "POST",
        body,
      }),
      invalidatesTags: ["User"],
    }),
    guestLogin: builder.mutation<AuthResponse, void>({
      query: () => ({
        url: "/guest",
        method: "POST",
      }),
      invalidatesTags: ["User"],
    }),
    getMe: builder.query<UserProfile, void>({
      query: () => "/me",
      providesTags: ["User"],
    }),
    updateProfile: builder.mutation<UserProfile, { name?: string; avatar?: string }>({
      query: (body) => ({
        url: "/profile",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["User"],
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useGuestLoginMutation,
  useGetMeQuery,
  useUpdateProfileMutation,
} = authApi;
