import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// --- Create a single transporter at module load ---
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, // true only for port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS, // Gmail App Password
  },
});

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: "No account found with that email" }, { status: 404 });

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3600 * 1000);

    await prisma.user.update({
      where: { email },
      data: { passwordResetToken: token, tokenExpiry: expiry },
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${token}`;

    await transporter.sendMail({
      from: `"PeerEval" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Password Reset Request",
      html: `<p>You requested a password reset. Click <a href="${resetUrl}">here</a> to reset your password.</p>`,
    });

    return NextResponse.json({ message: "Password reset email sent. Check your inbox." });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
