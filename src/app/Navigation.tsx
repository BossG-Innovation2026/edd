// FR-UX-08: role-based menu items. Only show menu items the user can access.

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createPrismaClient } from "@/lib/db";
import Link from "next/link";

export async function Navigation() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const db = createPrismaClient(process.env.DATABASE_URL!);
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { roles: { select: { role: true } } },
  });

  if (!user) return null;

  const roles = new Set(user.roles.map((r) => r.role));
  const isSchoolHead = roles.has("SCHOOL_HEAD");
  const isDRRMCoordinator = roles.has("DRRM_COORDINATOR");
  const isSchoolPersonnel = roles.has("SCHOOL_PERSONNEL");
  const isCommunityUser = roles.has("COMMUNITY_USER");

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link href="/" className="nav-brand">
          School Safety
        </Link>

        <ul className="nav-menu">
          {/* All roles can submit reports */}
          <li>
            <Link href="/report">Report Hazard</Link>
          </li>

          {/* School Head & DRRM can verify */}
          {(isSchoolHead || isDRRMCoordinator) && (
            <li>
              <Link href="/verify">Verify Hazards</Link>
            </li>
          )}

          {/* DRRM can manage assets */}
          {isDRRMCoordinator && (
            <li>
              <Link href="/assets">Assets</Link>
            </li>
          )}

          {/* School Head gets their dashboard */}
          {isSchoolHead && (
            <li>
              <Link href="/school-head-dashboard">Dashboard</Link>
            </li>
          )}

          {/* DRRM gets coordinator dashboard */}
          {isDRRMCoordinator && (
            <li>
              <Link href="/coordinator-dashboard">Coordinator</Link>
            </li>
          )}

          {/* Community users see their submissions */}
          {isCommunityUser && (
            <li>
              <Link href="/my-submissions">My Reports</Link>
            </li>
          )}

          {/* Sign out link */}
          <li className="nav-user">
            <a href="/api/auth/signout">{user.name || "Sign out"}</a>
          </li>
        </ul>
      </div>
    </nav>
  );
}
