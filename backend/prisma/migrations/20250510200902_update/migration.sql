/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `AccountEmail` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "AccountEmail_email_key" ON "AccountEmail"("email");
