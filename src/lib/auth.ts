// Minimal login for Module 3.1 (Section 2 subset): email and password, roles carried in the session.
// Not built yet: School Head approval of new accounts (FR-UR-03), learner consent (FR-UR-04),
// lockout and idle timeout (NFR-SE-03).
import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { Role } from "@/generated/prisma/enums";
import { getDb } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        if (!email || !credentials?.password) return null;
        const user = await getDb().user.findUnique({ where: { email }, include: { roles: true } });
        // NFR-SE-01: compare against the stored hash only.
        if (!user || !(await bcrypt.compare(credentials.password, user.passwordHash))) return null;
        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.userId = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token.userId) session.user.id = token.userId as string;
      return session;
    },
  },
};

export type CurrentUser = { id: string; name: string; active: boolean; roles: Role[] };

// Reads active status and roles from the database on every request, so a deactivated
// account or a changed role takes effect at once (FR-HL-01, NFR-SE-02).
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getServerSession(authOptions);
  const id = session?.user?.id;
  if (!id) return null;
  const user = await getDb().user.findUnique({ where: { id }, include: { roles: true } });
  if (!user) return null;
  return { id: user.id, name: user.name, active: user.active, roles: user.roles.map((r) => r.role) };
}
