'use client';

import { useState } from 'react';
import WebPushSetup from '@/components/WebPushSetup';

export default function HomePage() {
  const [userId, setUserId] = useState('9480772811');

  return (
    <div style={{ padding: 24 }}>
      <label htmlFor="userId">User ID</label>
      <input
        id="userId"
        type="text"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        style={{ display: 'block', marginTop: 8, marginBottom: 16 }}
      />

      <WebPushSetup userId={userId} />
    </div>
  );
}