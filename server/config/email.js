const nodemailer = require('nodemailer');

// Gmail SMTP transport — uses App Password (not your regular password)
// force IPv4 (family:4) because Render blocks outbound IPv6
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: { rejectUnauthorized: false },
  family: 4,
});

/**
 * Send a QR ticket email to the attendee.
 * Fire-and-forget — errors are logged but never break registration.
 */
const sendTicketEmail = async ({ to, name, eventTitle, eventDate, venue, ticketCode, qrData }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email not configured — skipping ticket email');
    return;
  }

  const dateStr = new Date(eventDate).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  // Convert base64 data URL to buffer for attachment
  const qrBase64 = qrData.replace(/^data:image\/png;base64,/, '');

  const mailOptions = {
    from: `"EventHub" <${process.env.EMAIL_USER}>`,
    to,
    subject: `🎟️ Your Ticket for ${eventTitle}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#fafafa;border-radius:12px;">
        <h2 style="color:#1a1a2e;margin-bottom:4px;">Hi ${name} 👋</h2>
        <p style="color:#555;font-size:15px;">You're registered for:</p>
        <div style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin:16px 0;">
          <h3 style="margin:0 0 8px;color:#1a1a2e;">${eventTitle}</h3>
          <p style="margin:4px 0;color:#666;font-size:14px;">📅 ${dateStr}</p>
          <p style="margin:4px 0;color:#666;font-size:14px;">📍 ${venue}</p>
          <p style="margin:4px 0;color:#666;font-size:14px;">🎫 Ticket: <strong>${ticketCode}</strong></p>
        </div>
        <div style="text-align:center;margin:20px 0;">
          <p style="color:#555;font-size:14px;margin-bottom:8px;">Show this QR code at the venue:</p>
          <img src="cid:qrticket" alt="QR Ticket" style="width:200px;height:200px;" />
        </div>
        <p style="color:#999;font-size:12px;text-align:center;">This is an automated email from EventHub. Do not reply.</p>
      </div>
    `,
    attachments: [{
      filename: 'ticket-qr.png',
      content: Buffer.from(qrBase64, 'base64'),
      cid: 'qrticket', // referenced in the img src above
    }],
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Ticket email sent to ${to}`);
  } catch (err) {
    console.error(`Failed to send ticket email to ${to}:`, err.message);
  }
};

module.exports = { sendTicketEmail };
