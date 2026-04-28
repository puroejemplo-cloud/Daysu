"use client";
import { useEffect } from "react";

export default function NotificationPermission() {
  useEffect(() => {
    // Pedir permiso al admin cuando entra al panel
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);
  return null;
}

// Helper: mostrar notificación del sistema cuando llega una reserva
export function notifyNewBooking(clientName: string, eventName: string) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  new Notification("🎉 Nueva reserva — Aura Producciones", {
    body: `${clientName} ha reservado: ${eventName}`,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-72.png",
  });
}
