"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type AppErrorBoundaryState = {
  hasError: boolean;
};

export class AppErrorBoundary extends Component<{ children: ReactNode }, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ScoreCare] render error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-dvh items-center justify-center bg-background px-6 text-center text-foreground">
          <div>
            <h1 className="text-2xl font-bold">Something went wrong.</h1>
            <p className="mt-3 text-sm text-muted-foreground">Please restart the app.</p>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
