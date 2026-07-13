import nodemailer from "nodemailer";
import { env } from "../config/env";
import { logger } from "../utils/logger";

// Initialize transporter lazily
let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    if (!env.SMTP_USER || !env.SMTP_PASS) {
      logger.warn("SMTP credentials not provided in environment variables. Email sending may fail.");
    }
    
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465, // true for 465, false for other ports
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
      connectionTimeout: 10000, // 10 seconds max to wait for connection
      greetingTimeout: 10000,   // 10 seconds max to wait for greeting
      socketTimeout: 15000,     // 15 seconds max for inactivity
    });
  }
  return transporter;
}

export async function sendVerificationEmail(email: string, name: string, token: string) {
  try {
    const mailer = getTransporter();
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

    const info = await mailer.sendMail({
      from: `"Feasibility Suite" <${env.SMTP_USER}>`,
      to: email,
      subject: "توثيق حسابك - Feasibility Suite",
      html: htmlContent,
    });

    logger.info(`Verification email sent to ${email} (Message ID: ${info.messageId})`);
    return true;
  } catch (error) {
    logger.error(`Failed to send verification email to ${email}:`, error);
    return false;
  }
}

export async function sendWelcomeEmail(email: string, name: string) {
  try {
    const mailer = getTransporter();
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

    const info = await mailer.sendMail({
      from: `"Feasibility Suite" <${env.SMTP_USER}>`,
      to: email,
      subject: "شكراً لإنشاء حسابك 🎉",
      html: htmlContent,
    });

    logger.info(`Welcome email sent to ${email} (Message ID: ${info.messageId})`);
    return true;
  } catch (error) {
    logger.error(`Failed to send welcome email to ${email}:`, error);
    return false;
  }
}
