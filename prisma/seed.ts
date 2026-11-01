// Seeds the hazard catalog (FR-HL-02), SAMPLE school zones (stand-in until FR-HL-03 map setup),
// and TEST accounts, one per role (FR-UR-01). Safe to run more than once.
import "dotenv/config";
import bcrypt from "bcryptjs";
import type { Role } from "../src/generated/prisma/enums.ts";
import { createPrismaClient, type Db } from "../src/lib/db.ts";
import { HAZARD_CATALOG, OTHER_TYPE_NAME } from "../src/modules/hazard-logging/catalog.ts";

// SAMPLE zones only. The real list comes from the DRRM Coordinator's site plan (FR-HL-03).
export const SAMPLE_ZONES: { building: string; floor: string; name: string }[] = [
  { building: "Building A", floor: "Ground floor", name: "Classrooms 101-104" },
  { building: "Building A", floor: "Ground floor", name: "Stairway and main exit" },
  { building: "Building A", floor: "Second floor", name: "Classrooms 201-204" },
  { building: "Building B", floor: "Ground floor", name: "Science laboratory" },
  { building: "Building B", floor: "Ground floor", name: "Canteen" },
  { building: "Building B", floor: "Second floor", name: "ICT room" },
  { building: "School grounds", floor: "Outdoor", name: "Covered court" },
  { building: "School grounds", floor: "Outdoor", name: "Main gate and perimeter fence" },
  { building: "School grounds", floor: "Outdoor", name: "Comfort rooms block" },
];

export const TEST_ACCOUNTS: { email: string; name: string; roles: Role[]; active: boolean }[] = [
  { email: "head@test.local", name: "Test School Head", roles: ["SCHOOL_HEAD"], active: true },
  { email: "drrm@test.local", name: "Test DRRM Coordinator", roles: ["DRRM_COORDINATOR"], active: true },
  { email: "staff@test.local", name: "Test School Personnel", roles: ["SCHOOL_PERSONNEL"], active: true },
  { email: "community@test.local", name: "Test Community User", roles: ["COMMUNITY_USER"], active: true },
  { email: "admin@test.local", name: "Test System Administrator", roles: ["SYSTEM_ADMINISTRATOR"], active: true },
  // FR-HL-01 / FR-UR-03: an account awaiting approval, used to show inactive users cannot report.
  { email: "pending@test.local", name: "Test Pending User", roles: ["COMMUNITY_USER"], active: false },
];

export async function seedCatalogAndZones(db: Db): Promise<void> {
  for (const [c, category] of HAZARD_CATALOG.entries()) {
    const saved = await db.hazardCategory.upsert({
      where: { code: category.code },
      update: { name: category.name, sortOrder: c },
      create: { code: category.code, name: category.name, sortOrder: c },
    });
    for (const [t, typeName] of category.types.entries()) {
      const isOther = typeName === OTHER_TYPE_NAME;
      await db.hazardType.upsert({
        where: { categoryId_name: { categoryId: saved.id, name: typeName } },
        update: { isOther, sortOrder: t },
        create: { categoryId: saved.id, name: typeName, isOther, sortOrder: t },
      });
    }
  }
  for (const [i, zone] of SAMPLE_ZONES.entries()) {
    await db.zone.upsert({
      where: { building_floor_name: zone },
      update: { sortOrder: i },
      create: { ...zone, sortOrder: i },
    });
  }
}

export async function seedTestAccounts(db: Db, password: string): Promise<void> {
  const passwordHash = await bcrypt.hash(password, 10);
  for (const account of TEST_ACCOUNTS) {
    await db.user.upsert({
      where: { email: account.email },
      update: { name: account.name, active: account.active, passwordHash },
      create: {
        email: account.email,
        name: account.name,
        active: account.active,
        passwordHash,
        roles: { create: account.roles.map((role) => ({ role })) },
      },
    });
  }
}

async function main() {
  const url = process.env.DATABASE_URL;
  const password = process.env.SEED_PASSWORD;
  if (!url) throw new Error("DATABASE_URL is not set (see .env.example)");
  if (!password) throw new Error("SEED_PASSWORD is not set (see .env.example)");
  const db = createPrismaClient(url);
  try {
    await seedCatalogAndZones(db);
    await seedTestAccounts(db, password);
    console.log(`Seeded ${HAZARD_CATALOG.length} categories, ${SAMPLE_ZONES.length} sample zones, ${TEST_ACCOUNTS.length} test accounts.`);
  } finally {
    await db.$disconnect();
  }
}

// Run only when executed directly (tests import the functions above).
if (process.argv[1]?.replace(/\\/g, "/").endsWith("prisma/seed.ts")) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
