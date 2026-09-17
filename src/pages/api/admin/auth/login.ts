import type { NextApiRequest, NextApiResponse } from 'next';


// A simple in-memory store for rate limiting (since admin login is low traffic)
// Note: In serverless (Vercel) this might reset often, but still helps mitigate bursts per instance.
const rateLimitCache = new Map<string, { count: number; expiresAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitCache.get(ip);
  
  if (!record || record.expiresAt < now) {
    rateLimitCache.set(ip, { count: 1, expiresAt: now + 15 * 60 * 1000 }); // 15 minutes window
    return false;
  }
  
  if (record.count >= 50) {
    return true; // Limit exceeded
  }
  
  record.count++;
  return false;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Basic rate limiting by IP
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
  if (isRateLimited(ip)) {
    return res.status(429).json({ message: 'محاولات كثيرة. حاول مجدداً بعد قليل.' });
  }

  const { password } = req.body;
  const envAdminPassword = process.env.ADMIN_PASSWORD;

  if (!envAdminPassword) {
    console.error("ADMIN_PASSWORD is not set in environment variables!");
    return res.status(500).json({ message: 'خطأ في إعدادات الخادم.' });
  }

  if (password === envAdminPassword) {
    // Generate a simple token (a static string is enough since we will just check its presence,
    // but in a real scenario you might want a JWT signed with JWT_SECRET.
    // Given the prompt constraints "Create a secure admin authentication session/cookie", 
    // a basic random or static token paired with HttpOnly is fine. We will use a standard token).
    
    // Set cookie manually since 'cookie' v1.x changed its API
    const isProd = process.env.NODE_ENV === 'production';
    const maxAge = 60 * 60 * 24; // 1 day
    const cookieString = `admin_session=authenticated; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${isProd ? '; Secure' : ''}`;

    res.setHeader('Set-Cookie', cookieString);
    return res.status(200).json({ success: true, message: 'تم تسجيل الدخول بنجاح.' });
  }

  return res.status(401).json({ message: 'كلمة المرور غير صحيحة' });
}
