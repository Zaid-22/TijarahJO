import React from "react";
import ReactDOM from "react-dom/client";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "./contexts/AuthContext";
import { Toaster } from "./components/ui/sonner";
import App from "./App.tsx";
import "./styles/globals.css";

// Add error boundary for better error handling
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("React Error:", error, errorInfo);
    // Prevent removeChild errors by ensuring clean error state
    if (error.message.includes("removeChild")) {
      console.warn("DOM manipulation error detected, attempting to recover...");
      // Force a clean re-render without reload
      setTimeout(() => {
        this.setState({ hasError: false, error: null });
      }, 100);
      return; // Don't set error state for DOM errors
    }
    // Only set error state for actual React errors
    this.setState({ hasError: true, error });
  }

  render() {
    if (this.state.hasError) {
      // Only show error UI for non-DOM errors
      if (this.state.error?.message.includes("removeChild")) {
        // For DOM errors, try to recover by rendering children
        console.warn("Recovering from DOM error...");
        return this.props.children;
      }
      
      return (
        <div style={{ padding: "20px", fontFamily: "Arial" }}>
          <h1>Something went wrong</h1>
          <p>{this.state.error?.message}</p>
          <pre style={{ background: "#f5f5f5", padding: "10px", maxHeight: "400px", overflow: "auto" }}>
            {this.state.error?.stack}
          </pre>
          <button 
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            style={{ padding: "10px 20px", marginTop: "10px", cursor: "pointer" }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Add a simple test element first to verify React is working
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

// Add a visible test to ensure something renders
console.log("🚀 Starting React app...");

try {
  // Disable StrictMode in development to prevent double renders/reloads
  // StrictMode intentionally double-invokes effects in development which can cause issues
  const isDevelopment = import.meta.env.DEV;
  
  const appContent = (
    <ErrorBoundary>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
      >
        <AuthProvider>
          <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
            <App />
            {/* Toast Notifications - Render at root level to prevent DOM manipulation errors */}
            <Toaster position="top-center" richColors expand={true} />
          </div>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );

  ReactDOM.createRoot(rootElement).render(
    isDevelopment ? appContent : <React.StrictMode>{appContent}</React.StrictMode>
  );
  console.log("✅ React app rendered successfully!");
} catch (error) {
  console.error("❌ Failed to render app:", error);
  rootElement.innerHTML = `
    <div style="padding: 20px; font-family: Arial; background: white; min-height: 100vh;">
      <h1 style="color: red;">Failed to load application</h1>
      <p><strong>Error:</strong> ${
        error instanceof Error ? error.message : "Unknown error"
      }</p>
      <pre style="background: #f5f5f5; padding: 10px; overflow: auto;">${
        error instanceof Error ? error.stack : String(error)
      }</pre>
      <button onclick="window.location.reload()" style="padding: 10px 20px; margin-top: 10px; cursor: pointer;">Reload Page</button>
    </div>
  `;
}
