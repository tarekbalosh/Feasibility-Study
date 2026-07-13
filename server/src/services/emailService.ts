import { env } from "../config/env";
import { logger } from "../utils/logger";

/**
 * Helper to send email via Google Apps Script Webhook (100% Free)
 * This bypasses Render's SMTP port blocks on the free tier.
 */
async function sendGoogleScriptEmail(toEmail: string, subject: string, htmlContent: string) {
  if (!env.GOOGLE_SCRIPT_URL) {
    logger.warn("GOOGLE_SCRIPT_URL is not set. Email sending will fail.");
    return false;
  }

  const payload = {
    to: toEmail,
    subject: subject,
    html: htmlContent,
  };

  try {
    // We send a POST request with redirect: 'follow' because Google Apps Script
    // Web apps reply with a 302 redirect.
    const response = await fetch(env.GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8", // GAS sometimes prefers text/plain to avoid CORS preflight
      },
      body: JSON.stringify(payload),
      redirect: "follow"
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`Google Script API Error: ${response.status} ${errorText}`);
      return false;
    }

    logger.info(`Email sent successfully to ${toEmail} via Google Apps Script`);
    return true;
  } catch (error) {
    logger.error(`Failed to send email to ${toEmail} via Google Script:`, error);
    return false;
  }
}

export async function sendVerificationEmail(email: string, name: string, token: string) {
  const verificationUrl = `${env.FRONTEND_URL}/auth/verify-email?token=${token}`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #4f46e5; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">توثيق حسابك</h1>
      </div>
      <div style="padding: 30px;">
        <p style="font-size: 16px;">مرحباً <strong>${name}</strong>،</p>
        <p style="font-size: 16px;">شكراً لتسجيلك في منصتنا. الرجاء الضغط على الزر أدناه لتوثيق بريدك الإلكتروني وتفعيل حسابك:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #4f46e5; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 16px; font-weight: bold; display: inline-block;">توثيق الحساب</a>
        </div>
        <p style="font-size: 14px; color: #666; margin-top: 20px;">
          أو يمكنك نسخ الرابط التالي ولصقه في متصفحك:<br>
          <a href="${verificationUrl}" style="color: #4f46e5; word-break: break-all;">${verificationUrl}</a>
        </p>
        <p style="font-size: 14px; color: #999; margin-top: 30px;">هذا الرابط صالح لمدة 24 ساعة فقط.</p>
      </div>
      <div style="background-color: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #666;">
        &copy; ${new Date().getFullYear()} Feasibility Suite. جميع الحقوق محفوظة.
      </div>
    </div>
  `;

  return await sendGoogleScriptEmail(email, "توثيق حسابك - Feasibility Suite", htmlContent);
}

export async function sendWelcomeEmail(email: string, name: string) {
  const dashboardUrl = `${env.FRONTEND_URL}/dashboard`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #4f46e5; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">أهلاً بك في Feasibility Suite</h1>
      </div>
      <div style="padding: 30px;">
        <p style="font-size: 16px;">مرحباً <strong>${name}</strong>،</p>
        <p style="font-size: 16px;">شكراً لإنشاء حسابك وتوثيق بريدك الإلكتروني. نحن سعداء بانضمامك إلينا!</p>
        <p style="font-size: 16px;">يمكنك الآن البدء في إنشاء دراسات الجدوى لمشاريعك باستخدام الذكاء الاصطناعي بكل سهولة.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${dashboardUrl}" style="background-color: #4f46e5; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 16px; font-weight: bold; display: inline-block;">الانتقال إلى لوحة التحكم</a>
        </div>
        <p style="font-size: 14px; color: #666; margin-top: 30px;">نتمنى لك تجربة ممتعة!</p>
      </div>
      <div style="background-color: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #666;">
        &copy; ${new Date().getFullYear()} Feasibility Suite. جميع الحقوق محفوظة.
      </div>
    </div>
  `;

  return await sendGoogleScriptEmail(email, "شكراً لإنشاء حسابك 🎉", htmlContent);
}
