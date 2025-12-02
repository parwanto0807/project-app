-- AlterTable
ALTER TABLE "UserSession" ALTER COLUMN "sessionToken" DROP NOT NULL,
ALTER COLUMN "refreshToken" DROP NOT NULL;
