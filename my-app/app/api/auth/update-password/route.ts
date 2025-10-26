import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, newPassword } = body;

    if (!token || !newPassword) {
      console.error("Missing token or password:", body);
      return NextResponse.json(
        { error: "Missing token or password" },
        { status: 400 }
      );
    }

    // Step 1: Find the user by token
    let user;
    try {
      user = await prisma.user.findFirst({ where: { passwordResetToken: token } });
    } catch (err) {
      console.error("Database error in findFirst:", err);
      return NextResponse.json(
        { error: "Database error when looking up token" },
        { status: 500 }
      );
    }

    if (!user) {
      console.warn("Invalid password reset token:", token);
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    // Step 2: Check token expiry
    if (!user.tokenExpiry || user.tokenExpiry < new Date()) {
      console.warn("Token expired for user:", user.id);
      return NextResponse.json({ error: "Token expired" }, { status: 400 });
    }

    // Step 3: Hash new password
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(newPassword, 10);
    } catch (err) {
      console.error("Error hashing password:", err);
      return NextResponse.json({ error: "Failed to hash password" }, { status: 500 });
    }

    // Step 4: Update user password and clear token fields
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          passwordResetToken: null,
          tokenExpiry: null,
        },
      });
    } catch (err) {
      console.error("Database error in update:", err);
      return NextResponse.json(
        { error: "Failed to update password in database" },
        { status: 500 }
      );
    }

    console.log("Password successfully updated for user:", user.id);
    return NextResponse.json({ message: "Password successfully updated" });

  } catch (err) {
    console.error("Unexpected error in update-password route:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
