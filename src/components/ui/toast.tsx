"use client";

import { toast as baseToast } from "@/hooks/use-toast";

// Thin wrapper exposing .success() / .error() / .info() for imperative use.
export const toast = {
  success: (message: string) => baseToast({ title: message, variant: "default" }),
  error: (message: string) => baseToast({ title: message, variant: "destructive" }),
  info: (message: string) => baseToast({ title: message, variant: "default" }),
};
