export function urlBase64ToUint8Array(base64String: string) {
  const input = base64String.trim().replace(/-/g, '+').replace(/_/g, '/');
  const padded = input + '='.repeat((4 - (input.length % 4)) % 4);
  const raw = window.atob(padded);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service workers are not supported in this browser.');
  }
  return await navigator.serviceWorker.register('/sw.js');
}

export async function askNotificationPermission() {
  if (!('Notification' in window)) {
    throw new Error('Notifications are not supported in this browser.');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission was not granted.');
  }
  return permission;
}

export async function subscribeBrowser() {
  const res = await fetch(`${API_BASE}/webpush/public-key`);
  if (!res.ok) {
    throw new Error('Failed to load public key from backend');
  }

  const data = await res.json();
  const publicKey = String(data.publicKey ?? '').trim();

  if (!publicKey) {
    throw new Error('Backend did not return publicKey');
  }

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  const saveRes = await fetch(`${API_BASE}/webpush/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: '9480772811',
      subscription,
    }),
  });

  if (!saveRes.ok) {
    const text = await saveRes.text();
    throw new Error(text || 'Failed to save subscription');
  }

  return subscription;
}