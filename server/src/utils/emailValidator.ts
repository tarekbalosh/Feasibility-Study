import dns from 'dns/promises';
import disposableDomains from 'disposable-email-domains';
import { ApiError } from './ApiError';
import { verifyMailboxSmtp } from './smtpVerifier';
import { logger } from './logger';

/**
 * Validates an email address against:
 * 1. Format (RFC-compliant regex)
 * 2. Disposable email domains (maintained package)
 * 3. MX records (domain can receive mail)
 * 4. SMTP RCPT TO (mailbox actually exists — best-effort)
 *
 * Returns the normalized email if valid, throws an ApiError if invalid.
 */
export async function validateEmail(email: string): Promise<string> {
  // Run quick checks first (format, disposable, MX)
  const { normalizedEmail, domain } = await runQuickChecks(email);

  // 4. SMTP Mailbox Verification (best-effort)
  try {
    const smtpResult = await verifyMailboxSmtp(normalizedEmail, domain);
    if (smtpResult === 'invalid') {
      throw ApiError.badRequest(
        'البريد الإلكتروني غير موجود. تأكد من كتابة العنوان بشكل صحيح.'
      );
    }
    // 'valid' or 'unknown' → proceed
    if (smtpResult === 'unknown') {
      logger.info(`[EmailValidator] SMTP check inconclusive for ${normalizedEmail}, proceeding with verification flow.`);
    }
  } catch (error: any) {
    // If it's our own ApiError, re-throw it
    if (error instanceof ApiError) throw error;
    // Otherwise, log and continue (don't block registration on SMTP failures)
    logger.warn(`[EmailValidator] SMTP verification failed for ${normalizedEmail}: ${error.message}`);
  }

  return normalizedEmail;
}

/**
 * Quick email validation (format + disposable + MX) — used by the real-time
 * validate-email API endpoint. Skips SMTP check for speed.
 *
 * Returns { valid: boolean, message: string, normalizedEmail: string }
 */
export async function validateEmailQuick(email: string): Promise<{
  valid: boolean;
  message: string;
  normalizedEmail: string;
}> {
  try {
    const { normalizedEmail } = await runQuickChecks(email);
    return {
      valid: true,
      message: 'البريد الإلكتروني صالح.',
      normalizedEmail,
    };
  } catch (error: any) {
    return {
      valid: false,
      message: error instanceof ApiError ? error.message : 'فشل التحقق من البريد الإلكتروني.',
      normalizedEmail: email.trim().toLowerCase(),
    };
  }
}

/**
 * Internal: Run format, disposable, and MX checks.
 */
async function runQuickChecks(email: string): Promise<{
  normalizedEmail: string;
  domain: string;
}> {
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

  if (!domain) {
    throw ApiError.badRequest('صيغة البريد الإلكتروني غير صحيحة.');
  }

  // 2. Disposable Email Check
  if (disposableDomains.includes(domain)) {
    throw ApiError.badRequest(
      'لا يمكن استخدام بريد إلكتروني مؤقت. يرجى استخدام بريد إلكتروني دائم.'
    );
  }

  // 3. MX Record Check (Verify Domain can receive emails)
  try {
    const mxRecords = await dns.resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) {
      throw ApiError.badRequest(
        'نطاق البريد الإلكتروني غير صالح أو لا يمكنه استقبال رسائل.'
      );
    }
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    // DNS query failures
    if (error.code === 'ENOTFOUND' || error.code === 'ENODATA') {
      throw ApiError.badRequest('نطاق البريد الإلكتروني غير موجود.');
    }
    throw ApiError.badRequest('فشل التحقق من نطاق البريد الإلكتروني.');
  }

  return { normalizedEmail, domain };
}
