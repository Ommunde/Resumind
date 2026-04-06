import { create } from "zustand";
import { AUTH_TOKEN_KEY } from "./api";

export const useAuthStore = create((set) => ({
  token: null,
  user: null,
  _hydrated: false,
  hydrate: () => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const raw = localStorage.getItem("resumind_user");
    let user = null;
    if (raw) {
      try {
        user = JSON.parse(raw);
      } catch {
        /* ignore */
      }
    }
    set({ token, user, _hydrated: true });
  },
  setAuth: (token, user) => {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem("resumind_user", JSON.stringify(user));
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem("resumind_user");
    set({ token: null, user: null });
  },
}));
