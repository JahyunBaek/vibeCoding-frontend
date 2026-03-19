import { create } from "zustand";

export type UserSummary = {
  userId: number;
  username: string;
  name: string;
  roleKey: "ADMIN" | "USER" | string;
  orgId: number | null;
};

type AuthState = {
  accessToken: string | null;
  user: UserSummary | null;
  initialized: boolean;
  permissions: Record<string, string[]>;
  setAuth: (token: string, user: UserSummary) => void;
  clear: () => void;
  setInitialized: (v: boolean) => void;
  setPermissions: (perms: Record<string, string[]>) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  initialized: false,
  permissions: {},
  setAuth: (token, user) => set({ accessToken: token, user }),
  clear: () => set({ accessToken: null, user: null, permissions: {} }),
  setInitialized: (v) => set({ initialized: v }),
  setPermissions: (perms) => set({ permissions: perms }),
}));
