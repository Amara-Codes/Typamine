import { create } from "zustand";

interface ThemeState {
  theme: "dark" | "light";
  toggleTheme: () => void;
  setTheme: (theme: "dark" | "light") => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: "dark", // default
  toggleTheme: () =>
    set((state) => {
      const nextTheme = state.theme === "dark" ? "light" : "dark";
      if (typeof window !== "undefined") {
        document.documentElement.classList.remove("dark", "light");
        document.documentElement.classList.add(nextTheme);
        localStorage.setItem("typamine-theme", nextTheme);
      }
      return { theme: nextTheme };
    }),
  setTheme: (theme) =>
    set(() => {
      if (typeof window !== "undefined") {
        document.documentElement.classList.remove("dark", "light");
        document.documentElement.classList.add(theme);
        localStorage.setItem("typamine-theme", theme);
      }
      return { theme };
    }),
}));
