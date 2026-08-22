import nodemailer from "nodemailer";

const isDev = process.env.NODE_ENV !== "production";

let _transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (_transporter) return _transporter;

  if (isDev && !process.env.SMTP_HOST) {
    _transporter = nodemailer.createTransport({ jsonTransport: true });
  } else {
    _transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: Number(process.env.SMTP_PORT ?? 587) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  return _transporter;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  const transporter = getTransporter();
  const from = options.from ?? process.env.SMTP_FROM ?? "Teranga Business <no-reply@terangabusiness.sn>";

  const result = await transporter.sendMail({
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });

  if (isDev) {
    console.log("\n📧 ── EMAIL DEV ─────────────────────────");
    console.log(`   To: ${options.to}`);
    console.log(`   Subject: ${options.subject}`);
    console.log("   ── HTML ──");
    console.log(options.html);
    console.log("─────────────────────────────────────────\n");
  }
}
