export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Restore the DB from R2 BEFORE anything opens it — Render's free
    // filesystem is wiped on every deploy and idle spin-down.
    try {
      const { restoreFromBackupIfMissing } = await import('@/lib/backup');
      await restoreFromBackupIfMissing();
    } catch (err) {
      console.error('[backup] restore hook failed:', err);
    }

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
