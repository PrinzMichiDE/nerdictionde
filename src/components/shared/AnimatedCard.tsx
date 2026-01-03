"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { cn } from "@/lib/utils";

interface AnimatedCardProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  index?: number;
}

export function AnimatedCard({
  children,
  delay = 0,
  className = "",
  index = 0,
}: AnimatedCardProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 40, scale: 0.95 }}
      transition={{
        duration: 0.5,
        delay: delay + index * 0.1,
        ease: [0.21, 1.11, 0.81, 0.99],
      }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
