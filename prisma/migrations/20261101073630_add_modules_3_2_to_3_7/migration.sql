-- CreateTable
CREATE TABLE "AssetCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "dateAcquired" DATETIME,
    "lastInspectionAt" DATETIME,
    "nextServiceAt" DATETIME,
    "safeguardsInPlace" TEXT,
    "responsiblePerson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Asset_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "AssetCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Asset_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AssetRating" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assetId" TEXT NOT NULL,
    "physicalCondition" INTEGER NOT NULL,
    "exposure" INTEGER NOT NULL,
    "criticality" INTEGER NOT NULL,
    "adaptiveCapacityGap" INTEGER NOT NULL,
    "maintenanceStatus" INTEGER NOT NULL,
    "vulnerabilityIndex" REAL NOT NULL,
    "ratedBy" TEXT NOT NULL,
    "ratedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AssetRating_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AssetPhoto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assetId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AssetPhoto_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RiskScore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hazardId" TEXT NOT NULL,
    "likelihood" INTEGER NOT NULL,
    "impact" REAL NOT NULL,
    "impactType" TEXT NOT NULL,
    "score" REAL NOT NULL,
    "band" TEXT NOT NULL,
    "computedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "computedBy" TEXT NOT NULL,
    CONSTRAINT "RiskScore_hazardId_fkey" FOREIGN KEY ("hazardId") REFERENCES "HazardReport" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Survey" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "items" TEXT NOT NULL,
    "scheduledFor" DATETIME NOT NULL,
    "closedAt" DATETIME,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SurveyResponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "surveyId" TEXT NOT NULL,
    "respondentId" TEXT,
    "answers" TEXT NOT NULL,
    "respondedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SurveyResponse_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SurveyComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "surveyId" TEXT,
    "hazardId" TEXT,
    "text" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "detectedSentiment" TEXT,
    "detectedFeeling" TEXT,
    "confirmedSentiment" TEXT,
    "confirmedFeeling" TEXT,
    "confirmedBy" TEXT,
    "confirmedAt" DATETIME,
    "inManualReview" BOOLEAN NOT NULL DEFAULT false,
    "reviewedAt" DATETIME,
    "reviewedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SurveyComment_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SurveyComment_hazardId_fkey" FOREIGN KEY ("hazardId") REFERENCES "HazardReport" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SurveyMetrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "surveyId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "spi" REAL,
    "nss" REAL,
    "positiveCount" INTEGER NOT NULL,
    "neutralCount" INTEGER NOT NULL,
    "negativeCount" INTEGER NOT NULL,
    "computedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SurveyMetrics_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IncidentReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "incidentNumber" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "occurredAt" DATETIME NOT NULL,
    "zones" TEXT NOT NULL,
    "classroomsTotallyDamaged" INTEGER,
    "classroomsWithMajorDamage" INTEGER,
    "classroomsWithMinorDamage" INTEGER,
    "temporaryLearningSpacesNeeded" BOOLEAN,
    "personnelDeceased" INTEGER,
    "personnelInjured" INTEGER,
    "personnelMissing" INTEGER,
    "personnelDisplaced" INTEGER,
    "classroomsUsedForEvacuation" INTEGER,
    "evacueesRemainingAfterThreeDays" INTEGER,
    "damagedArmchairs" INTEGER,
    "damagedLearningMaterials" INTEGER,
    "damagedComputerSets" INTEGER,
    "actionsTaken" TEXT,
    "nature" TEXT,
    "learnersInvolved" INTEGER,
    "setting" TEXT,
    "preventiveMeasures" TEXT,
    "caseStatus" TEXT,
    "dateReferredToDisciplining" DATETIME,
    "dateFactFinding" DATETIME,
    "dateReportToSdsAndRd" DATETIME,
    "linkedHazards" TEXT NOT NULL,
    "isLearnerProtection" BOOLEAN NOT NULL DEFAULT false,
    "reportedBy" TEXT NOT NULL,
    "reportedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "IncidentDeadline" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "incidentId" TEXT NOT NULL,
    "deadlineType" TEXT NOT NULL,
    "dueAt" DATETIME NOT NULL,
    "isOverdue" BOOLEAN NOT NULL DEFAULT false,
    "alertSentAt" DATETIME,
    "completedAt" DATETIME,
    CONSTRAINT "IncidentDeadline_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "IncidentReport" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReportTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalBasis" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "deadline" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "GeneratedReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportType" TEXT NOT NULL,
    "sourceData" TEXT NOT NULL,
    "isDraft" BOOLEAN NOT NULL DEFAULT true,
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "submittedAt" DATETIME,
    "exportedAt" DATETIME,
    "exportFormat" TEXT,
    "exportPath" TEXT,
    "dueAt" DATETIME,
    "alertedAt24h" DATETIME,
    "alertedAtDeadline" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "_ScoreFedBy" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ScoreFedBy_A_fkey" FOREIGN KEY ("A") REFERENCES "Asset" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ScoreFedBy_B_fkey" FOREIGN KEY ("B") REFERENCES "RiskScore" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "AssetCategory_code_key" ON "AssetCategory"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AssetCategory_name_key" ON "AssetCategory"("name");

-- CreateIndex
CREATE INDEX "Asset_categoryId_idx" ON "Asset"("categoryId");

-- CreateIndex
CREATE INDEX "Asset_zoneId_idx" ON "Asset"("zoneId");

-- CreateIndex
CREATE INDEX "AssetRating_assetId_idx" ON "AssetRating"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "RiskScore_hazardId_key" ON "RiskScore"("hazardId");

-- CreateIndex
CREATE INDEX "RiskScore_hazardId_idx" ON "RiskScore"("hazardId");

-- CreateIndex
CREATE INDEX "RiskScore_band_idx" ON "RiskScore"("band");

-- CreateIndex
CREATE INDEX "SurveyResponse_surveyId_idx" ON "SurveyResponse"("surveyId");

-- CreateIndex
CREATE UNIQUE INDEX "SurveyMetrics_surveyId_key" ON "SurveyMetrics"("surveyId");

-- CreateIndex
CREATE UNIQUE INDEX "IncidentReport_incidentNumber_key" ON "IncidentReport"("incidentNumber");

-- CreateIndex
CREATE INDEX "IncidentReport_type_idx" ON "IncidentReport"("type");

-- CreateIndex
CREATE INDEX "IncidentReport_isLearnerProtection_idx" ON "IncidentReport"("isLearnerProtection");

-- CreateIndex
CREATE INDEX "IncidentDeadline_incidentId_idx" ON "IncidentDeadline"("incidentId");

-- CreateIndex
CREATE INDEX "IncidentDeadline_isOverdue_idx" ON "IncidentDeadline"("isOverdue");

-- CreateIndex
CREATE UNIQUE INDEX "ReportTemplate_reportType_key" ON "ReportTemplate"("reportType");

-- CreateIndex
CREATE INDEX "GeneratedReport_reportType_idx" ON "GeneratedReport"("reportType");

-- CreateIndex
CREATE INDEX "GeneratedReport_isDraft_idx" ON "GeneratedReport"("isDraft");

-- CreateIndex
CREATE INDEX "GeneratedReport_approvedBy_idx" ON "GeneratedReport"("approvedBy");

-- CreateIndex
CREATE UNIQUE INDEX "_ScoreFedBy_AB_unique" ON "_ScoreFedBy"("A", "B");

-- CreateIndex
CREATE INDEX "_ScoreFedBy_B_index" ON "_ScoreFedBy"("B");
