"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { AppThemeName } from "@/lib/types";

type ThemeContextType = {
  theme: AppThemeName;
  setTheme: (theme: AppThemeName) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: "default",
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AppThemeName>("default");

  useEffect(() => {
    function applyGlobalTheme(idx: number) {
      const isDark = idx === 1 || (idx === 2 && window.matchMedia("(prefers-color-scheme: dark)").matches);
      document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    }

    const storedApp = window.localStorage.getItem("chess-heaven-app-theme") as AppThemeName | null;
    const storedGlobal = window.localStorage.getItem("chess-heaven-global-theme");
    if (storedApp) setThemeState(storedApp);
    if (storedGlobal) {
      applyGlobalTheme(Number(storedGlobal));
    } else {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    }

    const handler = (e: StorageEvent) => {
      if (e.key === "chess-heaven-global-theme" && e.newValue) {
        applyGlobalTheme(Number(e.newValue));
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  useEffect(() => {
    document.documentElement.classList.forEach((className) => {
      if (className.startsWith("theme-")) {
        document.documentElement.classList.remove(className);
      }
    });
    document.documentElement.classList.add(`theme-${theme}`);
    window.localStorage.setItem("chess-heaven-app-theme", theme);
  }, [theme]);

  function setTheme(newTheme: AppThemeName) {
    setThemeState(newTheme);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
