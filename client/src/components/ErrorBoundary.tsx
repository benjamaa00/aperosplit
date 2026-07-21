import { Component, type ReactNode } from "react";
import { RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center h-[80dvh] px-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-6">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-lg font-bold mb-2">Une erreur est survenue</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">
            Quelque chose ne s'est pas bien passe. Vous pouvez reessayer ou revenir en arriere.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2"
            >
              <RefreshCw size={14} />
              Reessayer
            </button>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.history.back();
              }}
              className="px-5 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-semibold"
            >
              Retour
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
