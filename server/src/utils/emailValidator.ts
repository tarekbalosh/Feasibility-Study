import dns from 'dns/promises';
import disposableDomains from 'disposable-email-domains';
import { ApiError } from './ApiError';

/**
 * Validates an email address against disposable domains and MX records.
 * Returns the normalized email if valid, throws an ApiError if invalid.
 */
export async function validateEmail(email: string): Promise<string> {
  if (!email || typeof email !== 'string') {
    throw ApiError.badRequest('البريد الإلكتروني غير صالح.');
  }

  // 1. Format and Normalize
  const normalizedEmail = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    throw ApiError.badRequest('صيغة البريد الإلكتروني غير صحيحة.');
  }

  const [_, domain] = normalizedEmail.split('@');

  // 2. Disposable Email Check
  if (disposableDomains.includes(domain)) {
    throw ApiError.badRequest('لا يمكن استخدام بريد إلكتروني مؤقت.');
  }

  // 3. MX Record Check (Verify Domain can receive emails)
  try {
    const mxRecords = await dns.resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) {
      throw ApiError.badRequest('نطاق البريد الإلكتروني غير صالح أو لا يمكنه استقبال رسائل.');
    }
  } catch (error: any) {
    // If the DNS query fails (e.g. ENOTFOUND, ENODATA), the domain likely doesn't exist
    if (error.code === 'ENOTFOUND' || error.code === 'ENODATA') {
      throw ApiError.badRequest('نطاق البريد الإلكتروني غير موجود.');
    }
    // If there is another type of error (e.g. timeout), we might choose to let it pass or fail
    // In strict mode, we'll fail it.
    throw ApiError.badRequest('فشل التحقق من نطاق البريد الإلكتروني.');
  }

  return normalizedEmail;
}
