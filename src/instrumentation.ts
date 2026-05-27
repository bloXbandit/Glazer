export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) return;

    const PING_INTERVAL_MS = 14 * 60 * 1000; // 14 minutes

    setInterval(async () => {
      try {
        await fetch(`${appUrl}/api/health`);
      } catch {
        // silently ignore — network may be briefly unavailable
      }
    }, PING_INTERVAL_MS);

    console.log(`[KeepAlive] Self-ping scheduled every 14 min → ${appUrl}/api/health`);
  }
}
