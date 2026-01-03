"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { cn } from "@/lib/utils";

interface AnimatedTextProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  variant?: "h1" | "h2" | "h3" | "p" | "span";
  stagger?: boolean;
}

export function AnimatedText({
  children,
  delay = 0,
  className = "",
  variant = "span",
  stagger = false,
}: AnimatedTextProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const text = typeof children === "string" ? children : children?.toString() || "";
  const words = stagger ? text.split(" ") : [text];

  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: {
        staggerChildren: stagger ? 0.05 : 0,
        delayChildren: delay,
      },
    }),
  };

  const child = {
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
    hidden: {
      opacity: 0,
      y: 20,
    },
  };

  const Component = variant;

  if (stagger && words.length > 1) {
    return (
      <Component ref={ref} className={className}>
        <motion.span
          style={{ display: "inline-block" }}
          variants={container}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {words.map((word, index) => (
            <motion.span
              key={index}
              variants={child}
              style={{ display: "inline-block", marginRight: "0.25em" }}
            >
              {word}
            </motion.span>
          ))}
        </motion.span>
      </Component>
    );
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.21, 1.11, 0.81, 0.99],
      }}
    >
      <Component className={className}>{children}</Component>
    </motion.div>
  );
}
