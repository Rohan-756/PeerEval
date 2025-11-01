// my-app/lib/auth.ts
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

/**
 * Retrieves the authenticated user based on the JWT token stored in cookies.
 * Returns the user record from Prisma or null if not authenticated.
 */
export async function getUser() {
  try {
    // ✅ Await cookies() to correctly access the cookie store
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return null;

    // ✅ Verify the token and extract the user ID
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as { id: string };

    if (!decoded?.id) return null;

    // ✅ Fetch the corresponding user from the database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    return user;
  } catch (err) {
    console.error("getUser error:", err);
    return null;
  }
}
