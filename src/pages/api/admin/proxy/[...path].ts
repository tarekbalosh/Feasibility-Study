import type { NextApiRequest, NextApiResponse } from 'next';

// This handles the proxying of admin requests to the Express backend.
// It verifies the HttpOnly cookie first.

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. Verify admin session cookie
  const { admin_session } = req.cookies;
  if (!admin_session || admin_session !== 'authenticated') {
    return res.status(401).json({ message: 'غير مصرح بالدخول' });
  }

  // 2. Prepare backend request
  const { path } = req.query;
  const pathString = Array.isArray(path) ? path.join('/') : path;
  
  // Create URL for backend (Ensure it's an absolute URL because fetch in Node requires it)
  const explicit = process.env.BACKEND_API_URL;
  const publicUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  
  let backendBaseUrl = '';
  if (explicit) {
    backendBaseUrl = explicit.replace(/\/$/, '');
  } else if (!/^https?:\/\//i.test(publicUrl)) {
    backendBaseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://feasibility-study.onrender.com/api' 
      : 'http://localhost:8080/api';
  } else {
    backendBaseUrl = publicUrl.replace(/\/$/, '');
  }
  
  // Forward query params (excluding the dynamically captured 'path')
  const queryParams = new URLSearchParams();
  for (const [key, value] of Object.entries(req.query)) {
    if (key !== 'path') {
      if (Array.isArray(value)) {
        value.forEach(v => queryParams.append(key, v));
      } else if (value) {
        queryParams.append(key, value);
      }
    }
  }
  
  const queryString = queryParams.toString();
  const url = `${backendBaseUrl}/admin/${pathString}${queryString ? `?${queryString}` : ''}`;

  // 3. Inject x-admin-secret header
  const headers = new Headers();
  headers.append('x-admin-secret', process.env.ADMIN_PASSWORD || '');
  
  if (req.headers['content-type']) {
    headers.append('content-type', req.headers['content-type']);
  }

  try {
    const backendRes = await fetch(url, {
      method: req.method,
      headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    });

    const data = await backendRes.text();
    
    // Pass status back
    res.status(backendRes.status);
    
    // Pass headers back (content-type)
    const contentType = backendRes.headers.get('content-type');
    if (contentType) {
      res.setHeader('content-type', contentType);
    }

    try {
      res.json(JSON.parse(data));
    } catch {
      res.send(data);
    }
  } catch (error) {
    console.error('Admin proxy error:', error);
    res.status(500).json({ message: 'خطأ في الاتصال بالخادم.' });
  }
}
