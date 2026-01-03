"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const root = document.documentElement;
    const currentTheme = root.classList.contains("dark") ? "dark" : "light";
    setTheme(currentTheme);
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    const newTheme = theme === "dark" ? "light" : "dark";
    
    if (newTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="size-9"
        aria-label="Toggle theme"
        disabled
      >
        <Sun className="size-4" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-9"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? (
        <Sun className="size-4 transition-transform hover:rotate-90" />
      ) : (
        <Moon className="size-4 transition-transform hover:-rotate-12" />
      )}
    </Button>
  );
}

