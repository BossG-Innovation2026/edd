// Gives each test file its own copy of the migrated, seeded database, so files can run in parallel.
import { randomUUID } from "node:crypto";
import { copyFileSync } from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import type { Role } from "@/generated/prisma/enums";
import { createPrismaClient, type Db } from "@/lib/db";
import type { Reporter } from "@/modules/hazard-logging/service";
import { seedCatalogAndZones } from "../../prisma/seed";
import { TEMPLATE_DB, TEST_DB_DIR } from "./global-setup";

export async function createTestDb(): Promise<Db> {
  const file = path.join(TEST_DB_DIR, `${randomUUID()}.db`);
  copyFileSync(TEMPLATE_DB, file);
  const db = createPrismaClient(`file:${file}`);
  await seedCatalogAndZones(db);
  return db;
}

export async function createUser(db: Db, roles: Role[], active = true): Promise<Reporter> {
  const user = await db.user.create({
    data: {
      email: `${randomUUID()}@test.local`,
      name: `Test ${roles.join("+")}`,
      active,
      passwordHash: await bcrypt.hash("unused-in-these-tests", 4),
      roles: { create: roles.map((role) => ({ role })) },
    },
  });
  return { id: user.id, active, roles };
}

export async function findType(db: Db, categoryName: string, typeName: string) {
  return db.hazardType.findFirstOrThrow({
    where: { name: typeName, category: { name: categoryName } },
  });
}

export async function firstZone(db: Db) {
  return db.zone.findFirstOrThrow({ orderBy: { sortOrder: "asc" } });
}

// A complete, valid report input for the given type and zone.
export function validInput(type: { id: string; categoryId: string }, zoneId: string, overrides: Record<string, unknown> = {}) {
  return {
    zoneId,
    locationDescription: "Beside the back door of Room 102",
    categoryId: type.categoryId,
    typeId: type.id,
    description: "Long crack in the wall near the window.",
    observedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    initialSeverity: "MODERATE",
    ...overrides,
  };
}
