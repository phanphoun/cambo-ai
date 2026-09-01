import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
  createdAt: number;
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  authModalOpen: boolean;
  authMode: "signin" | "signup";
}

const TOKEN_KEY = "sastra_auth_token";
const USER_KEY = "sastra_auth_user";

function loadInitialState(): { token: string | null; user: UserProfile | null } {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const userJson = localStorage.getItem(USER_KEY);
    const user = userJson ? JSON.parse(userJson) : null;
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
}

const initialAuth = loadInitialState();

const initialState: AuthState = {
  token: initialAuth.token,
  user: initialAuth.user,
  isAuthenticated: !!initialAuth.token,
  isGuest: initialAuth.user?.role === "guest",
  authModalOpen: false,
  authMode: "signin",
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthCredentials(
      state,
      action: PayloadAction<{ user: UserProfile; token: string; isGuest?: boolean }>,
    ) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.isGuest = !!action.payload.isGuest || action.payload.user.role === "guest";
      state.authModalOpen = false;

      try {
        localStorage.setItem(TOKEN_KEY, action.payload.token);
        localStorage.setItem(USER_KEY, JSON.stringify(action.payload.user));
      } catch {
        /* noop */
      }
    },
    updateUserProfile(state, action: PayloadAction<Partial<UserProfile>>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        try {
          localStorage.setItem(USER_KEY, JSON.stringify(state.user));
        } catch {
          /* noop */
        }
      }
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isGuest = false;
      state.authModalOpen = true;
      state.authMode = "signin";

      try {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      } catch {
        /* noop */
      }
    },
    setAuthModalOpen(state, action: PayloadAction<boolean>) {
      state.authModalOpen = action.payload;
    },
    setAuthMode(state, action: PayloadAction<"signin" | "signup">) {
      state.authMode = action.payload;
    },
  },
});

export const {
  setAuthCredentials,
  updateUserProfile,
  logout,
  setAuthModalOpen,
  setAuthMode,
} = authSlice.actions;
export default authSlice.reducer;
