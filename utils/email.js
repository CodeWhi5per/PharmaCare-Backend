const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendOtpEmail = async (to, otp, purpose) => {
  const subject =
    purpose === 'register'
      ? 'PharmaCare – Verify Your Email'
      : 'PharmaCare – Password Reset OTP';

  const heading =
    purpose === 'register' ? 'Email Verification' : 'Password Reset';

  const body =
    purpose === 'register'
      ? 'Thank you for registering. Use the OTP below to verify your email address.'
      : 'We received a request to reset your password. Use the OTP below to proceed.';

  await transporter.sendMail({
    from: `"PharmaCare" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px;">
        <h2 style="color:#2EBE76;margin-bottom:8px;">PharmaCare</h2>
        <h3 style="color:#1A1A1A;">${heading}</h3>
        <p style="color:#6C757D;">${body}</p>
        <div style="background:#F7FDFC;border:2px dashed #2EBE76;border-radius:10px;padding:20px;text-align:center;margin:24px 0;">
          <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#0BAF8C;">${otp}</span>
        </div>
        <p style="color:#6C757D;font-size:13px;">This OTP expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
      </div>
    `,
  });
};

module.exports = { generateOtp, sendOtpEmail };

