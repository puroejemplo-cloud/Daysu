"use client";
import { useEffect } from "react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64: string): ArrayBuffer {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + pad).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const buf = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i);
  return buf;
}

async function subscribeToPush() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
  if (!VAPID_PUBLIC_KEY) return;

  const registration = await navigator.serviceWorker.ready;
  const existing     = await registration.pushManager.getSubscription();
  if (existing) return; // ya suscrito

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly:      true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  await fetch("/api/push/subscribe", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(subscription.toJSON()),
  });
}

export default function NotificationPermission() {
  useEffect(() => {
    if (!("Notification" in window)) return;

    if (Notification.permission === "granted") {
      subscribeToPush();
    } else if (Notification.permission === "default") {
      Notification.requestPermission().then((perm) => {
        if (perm === "granted") subscribeToPush();
      });
    }
  }, []);

  return null;
}

// Helper: notificación local inmediata (sin push)
export function notifyNewBooking(clientName: string, eventName: string) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  new Notification("Nueva reserva — Daysu.vip", {
    body:  `${clientName} ha reservado: ${eventName}`,
    icon:  "/api/icon?size=192",
    badge: "/api/icon?size=96",
  });
}
