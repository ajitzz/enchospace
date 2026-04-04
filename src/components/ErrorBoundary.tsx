import { Component, ErrorInfo, ReactNode } from "react";
import { motion } from "motion/react";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public readonly state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center"
          >
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
            <p className="text-zinc-400 mb-8">
              We encountered an unexpected error. Our team has been notified.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center justify-center gap-2 w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-zinc-200 transition-colors"
              >
                <RefreshCcw className="w-4 h-4" />
                Try Again
              </button>
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 w-full bg-zinc-800 text-white font-semibold py-3 rounded-xl hover:bg-zinc-700 transition-colors"
              >
                <Home className="w-4 h-4" />
                Go to Home
              </button>
            </div>
            {process.env.NODE_ENV === "development" && (
              <div className="mt-8 text-left">
                <p className="text-xs font-mono text-red-400 bg-red-400/5 p-4 rounded-lg overflow-auto max-h-40">
                  {this.state.error?.toString()}
                </p>
              </div>
            )}
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
