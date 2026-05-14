// import WebPushSetup from '@/components/WebPushSetup';

// export default function HomePage() {
//   return(
//     <input type="text" value=user_id
//     <WebPushSetup userId="9480772811" />
//   );
// }
'use client';

import { useState } from 'react';
import WebPushSetup from '@/components/WebPushSetup';

export default function HomePage() {
  const [userId, setUserId] = useState('9480772811');

  return (
    <div style={{ padding: 24, maxWidth: 500 }}>
      <label htmlFor="userId" style={{ display: 'block', marginBottom: 8 }}>
        User ID
      </label>

      <input
        id="userId"
        type="text"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        placeholder="Enter user ID"
        style={{
          width: '100%',
          padding: '10px 12px',
          border: '1px solid #ccc',
          borderRadius: 8,
          marginBottom: 16,
        }}
      />

      <WebPushSetup userId={userId} />
    </div>
  );
}
