import type { NextApiRequest, NextApiResponse } from 'next';


export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Clear cookie manually
  const isProd = process.env.NODE_ENV === 'production';
  const cookieString = `admin_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${isProd ? '; Secure' : ''}`;

  res.setHeader('Set-Cookie', cookieString);
  return res.status(200).json({ success: true, message: 'تم تسجيل الخروج بنجاح.' });
}
