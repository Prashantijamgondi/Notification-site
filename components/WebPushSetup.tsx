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

export async function subscribeBrowser(userId: string) {
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
      user_id: userId,
      subscription,
    }),
  });

  if (!saveRes.ok) {
    const text = await saveRes.text();
    throw new Error(text || 'Failed to save subscription');
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
      const subscription = await subscribeBrowser(userId);
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
