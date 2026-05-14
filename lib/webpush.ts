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
