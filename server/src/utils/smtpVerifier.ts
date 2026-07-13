import net from 'net';
import dns from 'dns/promises';
import { logger } from './logger';

/**
 * SMTP RCPT TO Verification
 * يتحقق من وجود صندوق البريد فعلياً عبر الاتصال بسيرفر البريد.
 *
 * يعمل مع معظم النطاقات (شركات، جامعات، نطاقات خاصة).
 * لا يعمل مع Gmail/Yahoo/Outlook لأنها تقبل كل RCPT TO لأسباب أمنية.
 *
 * @returns 'valid' | 'invalid' | 'unknown' (unknown = can't determine, treat as valid)
 */

// النطاقات الكبيرة اللي لا تدعم RCPT TO verification
const CATCH_ALL_DOMAINS = [
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'yahoo.co.uk',
  'yahoo.fr',
  'yahoo.de',
  'ymail.com',
  'outlook.com',
  'hotmail.com',
  'hotmail.co.uk',
  'hotmail.fr',
  'live.com',
  'live.co.uk',
  'msn.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  'protonmail.com',
  'proton.me',
  'zoho.com',
  'zohomail.com',
];

const SMTP_TIMEOUT = 10000; // 10 seconds

export type SmtpVerifyResult = 'valid' | 'invalid' | 'unknown';

/**
 * Verify if a mailbox exists via SMTP RCPT TO handshake.
 */
export async function verifyMailboxSmtp(
  email: string,
  domain: string
): Promise<SmtpVerifyResult> {
  // Skip for catch-all domains (they always accept)
  if (CATCH_ALL_DOMAINS.includes(domain.toLowerCase())) {
    logger.info(`[SMTP] Skipping SMTP verification for catch-all domain: ${domain}`);
    return 'unknown';
  }

  // Resolve MX records to get the mail server
  let mxHost: string;
  try {
    const mxRecords = await dns.resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) {
      return 'invalid';
    }
    // Sort by priority (lowest = highest priority)
    mxRecords.sort((a, b) => a.priority - b.priority);
    mxHost = mxRecords[0].exchange;
  } catch {
    return 'unknown'; // DNS failure, don't block
  }

  // Perform SMTP handshake
  return new Promise<SmtpVerifyResult>((resolve) => {
    const socket = new net.Socket();
    let step = 0;
    let resolved = false;

    const finish = (result: SmtpVerifyResult) => {
      if (!resolved) {
        resolved = true;
        try {
          socket.write('QUIT\r\n');
        } catch {
          // ignore write errors on closing
        }
        socket.destroy();
        resolve(result);
      }
    };

    socket.setTimeout(SMTP_TIMEOUT);

    socket.on('timeout', () => {
      logger.warn(`[SMTP] Timeout verifying ${email} via ${mxHost}`);
      finish('unknown');
    });

    socket.on('error', (err) => {
      logger.warn(`[SMTP] Error verifying ${email} via ${mxHost}: ${err.message}`);
      finish('unknown');
    });

    socket.on('close', () => {
      finish('unknown');
    });

    socket.on('data', (data) => {
      const response = data.toString().trim();

      try {
        switch (step) {
          case 0: {
            // Server greeting — expect 220
            if (response.startsWith('220')) {
              socket.write('EHLO verify.feasibility-suite.com\r\n');
              step++;
            } else {
              finish('unknown');
            }
            break;
          }
          case 1: {
            // EHLO response — expect 250
            if (response.includes('250')) {
              socket.write('MAIL FROM:<noreply@feasibility-suite.com>\r\n');
              step++;
            } else {
              finish('unknown');
            }
            break;
          }
          case 2: {
            // MAIL FROM response — expect 250
            if (response.startsWith('250')) {
              socket.write(`RCPT TO:<${email}>\r\n`);
              step++;
            } else {
              finish('unknown');
            }
            break;
          }
          case 3: {
            // RCPT TO response — THIS is what tells us if the mailbox exists
            if (response.startsWith('250') || response.startsWith('251')) {
              logger.info(`[SMTP] Mailbox verified: ${email}`);
              finish('valid');
            } else if (
              response.startsWith('550') ||
              response.startsWith('551') ||
              response.startsWith('552') ||
              response.startsWith('553') ||
              response.startsWith('554')
            ) {
              logger.info(`[SMTP] Mailbox does not exist: ${email} — Response: ${response}`);
              finish('invalid');
            } else {
              // Other responses (e.g., 450 temporary failure, 452 too many recipients)
              logger.info(`[SMTP] Uncertain response for ${email}: ${response}`);
              finish('unknown');
            }
            break;
          }
          default:
            finish('unknown');
        }
      } catch {
        finish('unknown');
      }
    });

    // Connect to the MX server on port 25
    try {
      socket.connect(25, mxHost);
    } catch {
      finish('unknown');
    }
  });
}
