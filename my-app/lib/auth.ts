// my-app/lib/auth.ts
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function getUser() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return null;
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    if (!decoded?.id) return null;
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    return user;
  } catch (err) {
    console.error("getUser error", err);
    return null;
  }
}
