// ==============================================================================
// Dịch vụ Gửi Email & Xác thực OTP (Email & OTP Service)
// Hệ thống: ThuTra TNCN
// ==============================================================================

import nodemailer from 'nodemailer';
import { env } from '../config/env.config';

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  public initTransporter(): void {
    if (env.SMTP.host && env.SMTP.user) {
      try {
        this.transporter = nodemailer.createTransport({
          host: env.SMTP.host,
          port: env.SMTP.port,
          secure: env.SMTP.secure,
          auth: {
            user: env.SMTP.user,
            pass: env.SMTP.pass,
          },
          tls: {
            rejectUnauthorized: false,
          },
        });
      } catch (err) {
        console.warn('[EmailService]: Không thể khởi tạo SMTP Transporter:', err);
      }
    }
  }

  /**
   * Sinh mã OTP ngẫu nhiên gồm đúng 6 chữ số
   */
  public generateOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Gửi mã OTP xác thực đăng ký tài khoản
   */
  public async sendRegisterOtp(toEmail: string, otpCode: string): Promise<boolean> {
    // 1. Luôn in mã OTP ra Terminal Server trong môi trường phát triển / kiểm thử
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`[ThuTra OTP] 📬 Email: ${toEmail}`);
    console.log(`[ThuTra OTP] 🔑 MÃ XÁC THỰC OTP: >>> ${otpCode} <<<`);
    console.log(`[ThuTra OTP] ⏳ Hiệu lực: 5 phút kể từ thời điểm gửi.`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // 2. Gửi email thực tế qua SMTP nếu được cấu hình
    if (this.transporter) {
      try {
        const htmlContent = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
            <div style="background-color: #046a4e; padding: 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;">ThuTra TNCN</h1>
              <p style="color: #a7f3d0; margin: 4px 0 0; font-size: 13px;">Hệ Thống Hỗ Trợ Quyết Toán Thuế TNCN Độc Lập</p>
            </div>
            <div style="padding: 32px 24px; text-align: center;">
              <h2 style="color: #0f172a; font-size: 18px; margin-top: 0; font-weight: 600;">Xác thực tài khoản người nộp thuế</h2>
              <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 12px 0 24px;">
                Cảm ơn bạn đã lựa chọn sử dụng ThuTra TNCN. Dưới đây là mã xác thực OTP dùng để hoàn tất đăng ký tài khoản của bạn:
              </p>
              <div style="background-color: #f0fdf4; border: 2px dashed #059669; border-radius: 12px; padding: 18px; margin: 0 auto 24px; display: inline-block;">
                <span style="font-family: 'Courier New', monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #046a4e;">
                  ${otpCode}
                </span>
              </div>
              <p style="color: #64748b; font-size: 13px; margin: 0 0 16px;">
                Mã này có hiệu lực trong vòng <strong>5 phút</strong>. Vì lý do bảo mật, vui lòng không chia sẻ mã này cho bất kỳ ai.
              </p>
            </div>
            <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px; text-align: center;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                Đây là email tự động từ hệ thống ThuTra TNCN. Vui lòng không trả lời thư này.
              </p>
            </div>
          </div>
        `;

        const info = await this.transporter.sendMail({
          from: env.SMTP.from,
          to: toEmail,
          subject: `[ThuTra TNCN] Mã xác thực OTP đăng ký tài khoản: ${otpCode}`,
          html: htmlContent,
        });

        console.log(`[EmailService]: ✅ Đã gửi thành công email OTP tới ${toEmail} | MessageID: ${info.messageId} | Response: ${info.response}`);
        return true;
      } catch (err) {
        console.warn(`[EmailService]: Không thể gửi email qua SMTP (${err instanceof Error ? err.message : err}), sử dụng mã Dev OTP trên Terminal.`);
        return true;
      }
    }

    return true;
  }
}

export const emailService = new EmailService();

