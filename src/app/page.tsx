import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createPrismaClient } from "@/lib/db";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return redirect("/login");
  }

  const db = createPrismaClient(process.env.DATABASE_URL!);
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { roles: { select: { role: true } } },
  });

  if (!user?.active) {
    return redirect("/report"); // Show "not active" message
  }

  const roles = user.roles.map((r) => r.role);

  // Route to appropriate dashboard based on role
  if (roles.includes("DRRM_COORDINATOR")) {
    return redirect("/coordinator-dashboard");
  }
  if (roles.includes("SCHOOL_HEAD")) {
    return redirect("/coordinator-dashboard"); // Shared School Head view
  }

  // Default to report form for other roles
  return redirect("/report");
}
