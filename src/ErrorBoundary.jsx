import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Outfit',sans-serif", background: "#fefaf2", color: "#111827", padding: "24px" }}>
        <div style={{ maxWidth: "420px", textAlign: "center" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }} aria-hidden="true">⚠️</div>
          <h1 style={{ fontSize: "20px", marginBottom: "8px" }}>Something went wrong</h1>
          <p style={{ fontSize: "14px", color: "#6b7280", lineHeight: 1.6, marginBottom: "20px" }}>
            SolarSizer hit an unexpected error. Your inputs are not saved — reload the page to start again.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: "12px 24px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "#fff", fontSize: "14px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }
}
