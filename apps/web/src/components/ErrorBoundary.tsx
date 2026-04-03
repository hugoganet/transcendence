/**
 * @file ErrorBoundary — catches React rendering errors and displays a fallback UI.
 * FR: ErrorBoundary — capture les erreurs de rendu React et affiche une interface de secours.
 */
import { Component, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Card } from "./ui/Card.js";
import { Button } from "./ui/Button.js";
import i18n from "../i18n.js";

/** Props for ErrorBoundary. / FR: Props pour ErrorBoundary. */
interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * React class component that catches child errors and renders a retry-able fallback.
 * FR: Composant classe React qui capture les erreurs enfants et affiche un fallback avec option de réessai.
 */
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
                {i18n.t("errors.serverError")}
              </h2>
              <p className="mb-4 text-sm text-gray-500">
                {i18n.t("errors.unexpectedError")}
              </p>
              <Button onClick={this.handleRetry}>{i18n.t("labels.tryAgain")}</Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
