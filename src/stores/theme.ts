import { create } from "zustand";
import { persist } from "zustand/middleware";

type ThemeState = {
  isDark: boolean;
  toggle: () => void;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      isDark: true,
      toggle: () => {
        const next = !get().isDark;
        set({ isDark: next });
        document.documentElement.classList.toggle("dark", next);
      },
    }),
    { name: "theme-v2" }
  )
);
