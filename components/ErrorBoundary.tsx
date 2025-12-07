import React, { ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-slate-900 rounded-xl border border-red-500/20">
          <div className="p-4 bg-red-500/10 rounded-full mb-4">
            <AlertTriangle className="text-red-400" size={48} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Algo deu errado</h2>
          <p className="text-slate-400 mb-6 max-w-md">
            O sistema encontrou um erro inesperado. Tente recarregar o componente.
          </p>
          <pre className="text-xs text-red-300/50 mb-6 bg-black/30 p-2 rounded">
             {this.state.error?.message}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
          >
            <RefreshCw size={16} /> Reiniciar Sistema
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}