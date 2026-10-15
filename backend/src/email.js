import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = process.env.EMAIL_USER
  ? nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })
  : null;

export async function sendVerificationCode(email, code) {
  // Always print in terminal so you can test without real email
  console.log(`\n========================================`);
  console.log(`  VERIFICATION CODE for ${email}`);
  console.log(`  CODE:  ${code}`);
  console.log(`========================================\n`);

  if (!transporter) {
    console.log("(Email not configured – using terminal code only)");
    return;
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: "Your Skill Exchange verification code",
    text: `Your verification code is: ${code}\n\nIt expires in 15 minutes.`,
    html: `
      <div style="font-family: sans-serif; max-width: 400px; margin: auto;">
        <h2>Skill Exchange</h2>
        <p>Your verification code is:</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 4px;">${code}</p>
        <p style="color: #666;">This code expires in 15 minutes.</p>
      </div>
    `,
  });
}