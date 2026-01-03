"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  asChild?: boolean;
}

export function AnimatedButton({
  children,
  className = "",
  onClick,
  variant = "default",
  size = "md",
  asChild = false,
}: AnimatedButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 17,
      }}
      className={cn(className)}
    >
      {children}
    </motion.button>
  );
}
