"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const root = document.documentElement;
    setTheme(root.classList.contains("dark") ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    const newTheme = theme === "dark" ? "light" : "dark";

    root.classList.toggle("dark", newTheme === "dark");
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="size-10"
        aria-label="Theme wechseln"
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
      className="size-10"
      onClick={toggleTheme}
      aria-label={`Zu ${theme === "dark" ? "hellem" : "dunklem"} Modus wechseln`}
    >
      {theme === "dark" ? (
        <Sun className="size-4 transition-transform duration-200 hover:rotate-90" />
      ) : (
        <Moon className="size-4 transition-transform duration-200 hover:-rotate-12" />
      )}
    </Button>
  );
}
