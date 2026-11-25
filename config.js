export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  const googleClientId = process.env.GOOGLE_CLIENT_ID || '';
  const hasAdminPassword = Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.trim().length > 0);

  const payload = {
    googleClientId: googleClientId.trim(),
    hasAdminPassword
  };

  res.status(200).send(`window.__BAREEQ_CONFIG__ = ${JSON.stringify(payload)};`);
}
