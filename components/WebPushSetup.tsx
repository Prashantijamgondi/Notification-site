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

      setMessage('Browser subscribed successfully.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return (
    <div>
      <button onClick={handleEnable}>Enable notifications</button>

      {message ? <p>{message}</p> : null}

      {subscriptionJson ? <pre>{subscriptionJson}</pre> : null}
    </div>
  );
}