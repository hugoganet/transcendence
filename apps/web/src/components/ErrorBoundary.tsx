import { Component, type ReactNode } from "react";
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
              <svg
                className="mx-auto mb-4 h-12 w-12 text-gray-300"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                />
              </svg>
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
