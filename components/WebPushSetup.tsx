'use client';

import { useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service workers are not supported in this browser.');
  }
  return navigator.serviceWorker.register('/sw.js');
}

async function askNotificationPermission() {
  if (!('Notification' in window)) {
    throw new Error('Notifications are not supported in this browser.');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission was not granted.');
  }
  return permission;
}

async function subscribeBrowser() {
  const res = await fetch(`${API_BASE}/webpush/public-key`);
  if (!res.ok) {
    throw new Error('Failed to load public key');
  }

  const data = await res.json();
  const publicKey = String(data.publicKey ?? '').trim();

  if (!publicKey) {
    throw new Error('Public key missing');
  }

  const input = publicKey.replace(/-/g, '+').replace(/_/g, '/');
  const padded = input + '='.repeat((4 - (input.length % 4)) % 4);
  const raw = window.atob(padded);
  const key = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) key[i] = raw.charCodeAt(i);

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: key,
    });
  }

  return subscription;
}

type Props = {
  userId: string;
};

export default function WebPushSetup({ userId }: Props) {
  const [message, setMessage] = useState('');
  const [subscriptionJson, setSubscriptionJson] = useState('');

  const handleEnable = async () => {
    try {
      setMessage('Registering service worker...');
      await registerServiceWorker();

      setMessage('Requesting notification permission...');
      await askNotificationPermission();

      setMessage('Creating browser subscription...');
      const subscription = await subscribeBrowser();
      setSubscriptionJson(JSON.stringify(subscription, null, 2));

      const res = await fetch(`${API_BASE}/webpush/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          subscription,
        }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      setMessage('Browser subscribed successfully. Backend saved the subscription.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleTest = async () => {
    try {
      setMessage('Sending test notification...');
      const res = await fetch(`${API_BASE}/webpush/test-send?user_id=${encodeURIComponent(userId)}`, {
        method: 'POST',
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      setMessage('Test push sent. Check the browser notification.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return (
    <div>
      <button onClick={handleEnable}>Enable notifications</button>
      <button onClick={handleTest} style={{ marginLeft: 8 }}>Send test push</button>

      {message ? <p>{message}</p> : null}

      {subscriptionJson ? (
        <pre style={{ whiteSpace: 'pre-wrap' }}>{subscriptionJson}</pre>
      ) : null}
    </div>
  );
}
