import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { email } = await req.json();

  console.log(`Password reset requested for: ${email}`);
  return NextResponse.json({ message: `Mock reset link sent to ${email}` });
}
