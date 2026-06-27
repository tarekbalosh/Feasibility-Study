-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "subscriptionTier" TEXT NOT NULL DEFAULT 'free',
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'none',
    "stripeCustomerId" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "resetToken" TEXT,
    "resetTokenExpiry" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "targetCapital" REAL NOT NULL,
    "durationYears" INTEGER NOT NULL DEFAULT 3,
    "description" TEXT NOT NULL,
    "financialInputs" TEXT NOT NULL,
    "aiOutput" TEXT,
    "financialOutput" TEXT,
    "isShared" BOOLEAN NOT NULL DEFAULT false,
    "shareToken" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "stripeSessionId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserLimit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "generationsUsed" INTEGER NOT NULL DEFAULT 0,
    "generationsLimit" INTEGER NOT NULL DEFAULT 1,
    "resetAt" DATETIME NOT NULL,
    CONSTRAINT "UserLimit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FeasibilityStudy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sector" TEXT NOT NULL,
    "detectedSector" TEXT,
    "rawData" TEXT NOT NULL,
    "resultData" TEXT NOT NULL,
    "reportHtml" TEXT,
    "reportPdf" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Project_shareToken_key" ON "Project"("shareToken");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripeSessionId_key" ON "Payment"("stripeSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "UserLimit_userId_key" ON "UserLimit"("userId");
