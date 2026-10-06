import React from 'react';
import { ErrorPage } from './ErrorPage';

/**
 * ErrorBoundary Component
 * Captures uncaught React render tree errors and displays the clinical 500 fault screen.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Captured in Clinical ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorPage
          initialErrorCode="500"
          errorDetails={this.state.error?.message || 'Component render tree interruption'}
          onNavigateHome={() => {
            this.setState({ hasError: false, error: null });
            window.location.href = '/';
          }}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
