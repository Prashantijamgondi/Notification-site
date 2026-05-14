'use client';

import { useState } from 'react';
import {
  askNotificationPermission,
  registerServiceWorker,
  subscribeBrowser,
} from '@/lib/webpush';

type Props = {
  userId: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

export default function WebPushSetup({ userId }: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [subscriptionJson, setSubscriptionJson] = useState<string>('');

  const handleEnableNotifications = async () => {
    try {
      setLoading(true);
      setMessage('Starting notification setup...');

      if (!VAPID_PUBLIC_KEY) {
        throw new Error('Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY');
      }

      await registerServiceWorker();
      setMessage('Service worker registered.');

      await askNotificationPermission();
      setMessage('Permission granted. Creating subscription...');

      const subscription = await subscribeBrowser();
      setSubscriptionJson(JSON.stringify(subscription, null, 2));

      const res = await fetch(`${API_BASE}/webpush/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          subscription,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.detail || data?.message || 'Failed to save subscription');
      }

      setMessage('Browser subscribed successfully. Backend saved the subscription.');
    } catch (error: any) {
      setMessage(error?.message || 'Something went wrong during setup.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 760, margin: '40px auto', padding: 24, fontFamily: 'Arial, sans-serif' }}>
      <h2>Enable browser notifications</h2>
      <p>
        Click the button once on the device/browser where you want to receive appointment notifications.
      </p>

      <button
        onClick={handleEnableNotifications}
        disabled={loading}
        style={{
          padding: '12px 18px',
          borderRadius: 8,
          border: 'none',
          cursor: 'pointer',
          background: '#111827',
          color: '#fff',
          fontSize: 16,
        }}
      >
        {loading ? 'Setting up...' : 'Enable notifications'}
      </button>

      {message ? (
        <div style={{ marginTop: 16, padding: 12, background: '#f3f4f6', borderRadius: 8 }}>
          {message}
        </div>
      ) : null}

      {subscriptionJson ? (
        <>
          <h3 style={{ marginTop: 24 }}>Saved subscription preview</h3>
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              background: '#0b1020',
              color: '#d1d5db',
              padding: 16,
              borderRadius: 10,
              overflowX: 'auto',
            }}
          >
            {subscriptionJson}
          </pre>
        </>
      ) : null}
    </div>
  );
}
