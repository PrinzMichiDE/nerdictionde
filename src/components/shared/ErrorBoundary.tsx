"use client";

import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to error reporting service in production
    if (process.env.NODE_ENV === "production") {
      console.error("ErrorBoundary caught an error:", {
        error,
        errorInfo,
      });
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-destructive/20 bg-destructive/5 p-8 text-center">
          <div className="space-y-4">
            <div className="flex justify-center">
              <AlertCircle className="size-8 text-destructive" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Etwas ist schiefgelaufen</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {process.env.NODE_ENV === "development" && this.state.error
                  ? this.state.error.message
                  : "Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut."}
              </p>
            </div>
            <Button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="mr-2 size-4" aria-hidden="true" />
              Neu laden
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
