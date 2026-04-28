"use client";
import { Component, ReactNode } from "react";

interface Props { children: ReactNode }
interface State { hasError: boolean; message: string }

export default class BookingWizardErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="aura-card p-6 text-center" style={{ borderColor: "rgba(239,68,68,.3)" }}>
          <p style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>⚠️</p>
          <p className="font-black text-white mb-2">No se pudo cargar el formulario</p>
          <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
            {this.state.message || "Ocurrió un error inesperado. Por favor recarga la página."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-gold text-sm px-6 py-2">
            Recargar página
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
