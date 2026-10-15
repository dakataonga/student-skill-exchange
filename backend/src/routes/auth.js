import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { query } from "../db.js";

const router = Router();

// Email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Generate 6-digit code
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send verification email
async function sendVerificationEmail(email, code) {
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: "Your verification code – Student Skill Exchange",
    text: `Your verification code is: ${code}\n\nThis code expires in 10 minutes.`,
    html: `
      <h2>Email Verification</h2>
      <p>Your verification code is:</p>
      <h1 style="letter-spacing:4px">${code}</h1>
      <p>This code expires in <strong>10 minutes</strong>.</p>
    `,
  });

  // This line shows the Ethereal preview link in the terminal
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
}

// ─────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────
router.post("/register", async (req, res) => {
  const { name, email, password, student_id } = req.body;
  if (!name || !email || !password || !student_id) {
    return res.status(400).json({ error: "name, email, password, student_id are required" });
  }

  try {
    const existing = await query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const code = generateCode();
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    const result = await query(
      `INSERT INTO users (name, email, password_hash, student_id, email_code, email_code_expires, email_verified)
       VALUES ($1, $2, $3, $4, $5, $6, FALSE)
       RETURNING id, name, email, role, verified, student_id, email_verified`,
      [name, email, password_hash, student_id, code, expires]
    );

    try {
      await sendVerificationEmail(email, code);
    } catch (mailErr) {
      console.error("Failed to send verification email:", mailErr.message);
    }

    res.status(201).json({
      message: "Registered successfully. Please check your email for the verification code.",
      user: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// ─────────────────────────────────────────
// POST /api/auth/verify-email
// ─────────────────────────────────────────
router.post("/verify-email", async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: "email and code are required" });
  }

  try {
    const result = await query(
      `SELECT id, email_code, email_code_expires, email_verified FROM users WHERE email = $1`,
      [email]
    );
    const user = result.rows[0];

    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.email_verified) return res.json({ message: "Email is already verified" });
    if (!user.email_code || user.email_code !== code) {
      return res.status(400).json({ error: "Invalid verification code" });
    }
    if (new Date() > new Date(user.email_code_expires)) {
      return res.status(400).json({ error: "Verification code has expired" });
    }

    await query(
      `UPDATE users SET email_verified = TRUE, email_code = NULL, email_code_expires = NULL WHERE id = $1`,
      [user.id]
    );

    res.json({ message: "Email verified successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Verification failed" });
  }
});

// ─────────────────────────────────────────
// POST /api/auth/resend-code
// ─────────────────────────────────────────
router.post("/resend-code", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "email is required" });

  try {
    const result = await query(
      `SELECT id, email_verified FROM users WHERE email = $1`,
      [email]
    );
    const user = result.rows[0];

    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.email_verified) return res.json({ message: "Email is already verified" });

    const code = generateCode();
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    await query(
      `UPDATE users SET email_code = $1, email_code_expires = $2 WHERE id = $3`,
      [code, expires, user.id]
    );

    await sendVerificationEmail(email, code);

    res.json({ message: "A new verification code has been sent to your email" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to resend code" });
  }
});

// ─────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  try {
    const result = await query("SELECT * FROM users WHERE email = $1", [email]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, role: user.role, verified: user.verified },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        verified: user.verified,
        email_verified: user.email_verified,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

export default router;