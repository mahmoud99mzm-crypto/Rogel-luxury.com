import crypto from 'crypto';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  const configuredPassword = process.env.ADMIN_PASSWORD;
  if (!configuredPassword || !configuredPassword.trim()) {
    return res.status(503).json({
      ok: false,
      error: 'لم يتم ضبط كلمة سر المشرف (ADMIN_PASSWORD) في متغيرات البيئة على Vercel.'
    });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ ok: false, error: 'Invalid JSON body' });
    }
  }

  const submittedPassword = typeof body?.password === 'string' ? body.password : '';
  if (!submittedPassword) {
    return res.status(400).json({ ok: false, error: 'يرجى إدخال كلمة السر' });
  }

  const a = Buffer.from(submittedPassword, 'utf8');
  const b = Buffer.from(configuredPassword, 'utf8');

  let isMatch = false;
  if (a.length === b.length && a.length > 0) {
    isMatch = crypto.timingSafeEqual(a, b);
  }

  if (!isMatch) {
    return res.status(401).json({ ok: false, error: 'كلمة سر المشرف غير صحيحة' });
  }

  const secret = process.env.ADMIN_SESSION_SECRET || configuredPassword;
  const exp = Date.now() + 1000 * 60 * 60 * 24; // 24 hours
  const sig = crypto.createHmac('sha256', secret).update(`bareeq-admin:${exp}`).digest('hex');
  const token = Buffer.from(JSON.stringify({ exp, sig })).toString('base64url');

  return res.status(200).json({
    ok: true,
    token,
    expiresAt: exp
  });
}
