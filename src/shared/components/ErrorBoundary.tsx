import React, { ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen w-screen bg-paper text-ink p-8 font-sans">
          <div className="max-w-lg w-full border border-ink/10 rounded-3xl p-10 shadow-2xl shadow-ink/5">
            <h1 className="font-serif text-3xl mb-4">Application Error</h1>
            <p className="text-accent mb-6 font-mono text-sm">
              Lumina encountered an unexpected error.
            </p>
            <div className="bg-ink/5 p-4 rounded-xl mb-8 overflow-auto text-xs font-mono max-h-48 text-ink/70">
              {this.state.error?.message}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-ink text-paper py-4 rounded-full font-mono text-[10px] uppercase tracking-widest hover:opacity-80 transition-all"
            >
              Restart System
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
