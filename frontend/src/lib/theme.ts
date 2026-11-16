"use client";

import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "data-theme"],
  });
  return () => observer.disconnect();
}

/**
 * Returns true when <html> carries the .dark class.
 * Defaults to true for dark mode first-load.
 */
export function useIsDark(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => {
      if (typeof document === "undefined") return true;
      return document.documentElement.classList.contains("dark");
    },
    () => true
  );
}

export function setTheme(dark: boolean) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  document.documentElement.setAttribute("data-tone", dark ? "dark" : "light");
  try {
    localStorage.setItem("napier-theme", dark ? "dark" : "light");
  } catch {
    /* ignore storage access restrictions */
  }
}

export function toggleTheme() {
  if (typeof document === "undefined") return;
  const isDark = document.documentElement.classList.contains("dark");
  setTheme(!isDark);
}
