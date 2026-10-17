import { json } from '../_lib';

// Catch-all for /api/* paths that are not real endpoints: a JSON 404 instead of the SPA's index.html (a soft 404).
export const onRequest = () => json({ error: 'Not found' }, 404, { 'Cache-Control': 'public, max-age=300' });
