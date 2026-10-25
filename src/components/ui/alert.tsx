"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "destructive" | "warning" | "info";
  }
>(({ className, variant = "default", ...props }, ref) => {
  return (
    <div
      ref={ref}
      role="alert"
      className={cn(
        "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
        {
          "bg-background text-foreground": variant === "default",
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive":
            variant === "destructive",
          "border-warning/50 text-warning dark:border-warning [&>svg]:text-warning":
            variant === "warning",
          "border-primary/50 text-primary dark:border-primary [&>svg]:text-primary": variant === "info",
        },
        className
      )}
      {...props}
    />
  );
});
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

interface AlertActionProps extends React.HTMLAttributes<HTMLButtonElement> {
  onClick: () => void;
}

const AlertAction = React.forwardRef<HTMLButtonElement, AlertActionProps>(
  ({ className, onClick, children, ...props }, ref) => (
    <Button
      ref={ref}
      variant="link"
      className={cn("text-foreground", className)}
      onClick={onClick}
      {...props}
    >
      {children}
    </Button>
  )
);
AlertAction.displayName = "AlertAction";

export { Alert, AlertTitle, AlertDescription, AlertAction };