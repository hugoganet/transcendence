import { Component, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Card } from "./ui/Card.js";
import { Button } from "./ui/Button.js";

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

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center px-4 py-12">
          <Card>
            <div className="py-6 text-center">
              <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-gray-300" />
              <h2 className="mb-2 text-lg font-semibold text-gray-900">
                Something went wrong
              </h2>
              <p className="mb-4 text-sm text-gray-500">
                An unexpected error occurred. Please try again.
              </p>
              <Button onClick={this.handleRetry}>Try Again</Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
