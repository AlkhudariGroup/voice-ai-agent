/**
 * SMTP Quotation Email
 */

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  tls: boolean;
  fromEmail: string;
  fromName: string;
}

export interface QuotationEmailPayload {
  to: string;
  subject: string;
  body: string;
  storeName: string;
}

export async function sendQuotationEmail(
  smtp: SmtpConfig,
  payload: QuotationEmailPayload
): Promise<{ ok: boolean; error?: string }> {
  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.default.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.tls,
    auth: {
      user: smtp.user,
      pass: smtp.password,
    },
  });

  try {
    await transporter.sendMail({
      from: `"${smtp.fromName}" <${smtp.fromEmail}>`,
      to: payload.to,
      subject: payload.subject || `Quotation from ${payload.storeName}`,
      html: payload.body,
      text: payload.body.replace(/<[^>]*>/g, ""),
    });
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
