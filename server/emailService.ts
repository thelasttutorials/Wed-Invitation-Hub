import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!resend) {
    console.log(`[EmailService] To: ${to} | Subject: ${subject} (RESEND_API_KEY not set)`);
    return;
  }

  try {
    await resend.emails.send({
      from: "WedSaas <noreply@wedsaas.id>",
      to: [to],
      subject,
      html,
    });
  } catch (err) {
    console.error("[EmailService] Failed to send email:", err);
  }
}

export async function sendPaymentReceivedEmail(email: string, orderNumber: string) {
  await sendEmail({
    to: email,
    subject: "Bukti Transfer Diterima - WedSaas",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
        <h2 style="color:#1e293b;margin-bottom:8px;">Bukti Transfer Diterima</h2>
        <p style="color:#64748b;margin-bottom:24px;">
          Halo, kami telah menerima bukti transfer untuk pesanan <strong>${orderNumber}</strong>. 
          Tim kami akan segera melakukan pengecekan dalam waktu maksimal 1x24 jam.
        </p>
        <p style="color:#94a3b8;font-size:13px;margin-top:20px;">
          Terima kasih telah mempercayakan momen bahagia Anda kepada WedSaas.
        </p>
      </div>
    `,
  });
}

export async function sendPaymentApprovedEmail(email: string, orderNumber: string) {
  await sendEmail({
    to: email,
    subject: "Pembayaran Disetujui - WedSaas",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
        <h2 style="color:#1e293b;margin-bottom:8px;">Pembayaran Disetujui</h2>
        <p style="color:#64748b;margin-bottom:24px;">
          Kabar gembira! Pembayaran untuk pesanan <strong>${orderNumber}</strong> telah kami setujui. 
          Fitur premium Anda kini telah aktif. Silakan login ke dashboard untuk mulai menggunakannya.
        </p>
        <div style="text-align:center;margin-top:32px;">
          <a href="https://wedsaas.id/dashboard" style="background:#2563eb;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Buka Dashboard</a>
        </div>
      </div>
    `,
  });
}

export async function sendPaymentRejectedEmail(email: string, orderNumber: string, reason?: string) {
  await sendEmail({
    to: email,
    subject: "Pembayaran Ditolak - WedSaas",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
        <h2 style="color:#e11d48;margin-bottom:8px;">Pembayaran Ditolak</h2>
        <p style="color:#64748b;margin-bottom:24px;">
          Mohon maaf, pembayaran untuk pesanan <strong>${orderNumber}</strong> belum dapat kami setujui.
        </p>
        ${reason ? `
        <div style="background:#fff1f2;border-left:4px solid #e11d48;padding:16px;margin-bottom:24px;">
          <p style="color:#9f1239;margin:0;font-size:14px;"><strong>Alasan:</strong> ${reason}</p>
        </div>
        ` : ""}
        <p style="color:#64748b;">
          Silakan periksa kembali bukti transfer Anda atau hubungi kami jika menurut Anda ini adalah kesalahan.
        </p>
      </div>
    `,
  });
}
