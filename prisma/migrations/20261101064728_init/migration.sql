-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "UserRole" (
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,

    PRIMARY KEY ("userId", "role"),
    CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Zone" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "building" TEXT NOT NULL,
    "floor" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "HazardCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "HazardType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isOther" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "HazardType_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "HazardCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HazardReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL,
    "typeId" TEXT NOT NULL,
    "otherTypeSpecified" TEXT,
    "zoneId" TEXT NOT NULL,
    "locationDescription" TEXT NOT NULL,
    "observedAt" DATETIME NOT NULL,
    "description" TEXT NOT NULL,
    "initialSeverity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "reporterId" TEXT NOT NULL,
    "verifiedById" TEXT,
    "verifiedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "HazardReport_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "HazardType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "HazardReport_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "HazardReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "HazardReport_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HazardPhoto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hazardId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HazardPhoto_hazardId_fkey" FOREIGN KEY ("hazardId") REFERENCES "HazardReport" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReportCounter" (
    "year" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "last" INTEGER NOT NULL DEFAULT 0
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Zone_building_floor_name_key" ON "Zone"("building", "floor", "name");

-- CreateIndex
CREATE UNIQUE INDEX "HazardCategory_code_key" ON "HazardCategory"("code");

-- CreateIndex
CREATE UNIQUE INDEX "HazardCategory_name_key" ON "HazardCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "HazardType_categoryId_name_key" ON "HazardType"("categoryId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "HazardReport_reportId_key" ON "HazardReport"("reportId");

-- CreateIndex
CREATE INDEX "HazardReport_status_idx" ON "HazardReport"("status");

-- CreateIndex
CREATE INDEX "HazardReport_zoneId_idx" ON "HazardReport"("zoneId");
