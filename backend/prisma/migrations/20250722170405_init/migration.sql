/*
  Warnings:

  - You are about to drop the `Cluster` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `announcements` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `audit_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `blocks` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `events` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `forum_categories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `forum_comments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `forum_posts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `help_articles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `help_categories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `help_requests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `house_types` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `houses` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ipl_bills` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ipl_rate_groups` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ipl_rates` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `notifications` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `payments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `residents` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `security_reports` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "announcements" DROP CONSTRAINT "announcements_author_id_fkey";

-- DropForeignKey
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_user_id_fkey";

-- DropForeignKey
ALTER TABLE "blocks" DROP CONSTRAINT "blocks_cluster_id_fkey";

-- DropForeignKey
ALTER TABLE "events" DROP CONSTRAINT "events_organizer_id_fkey";

-- DropForeignKey
ALTER TABLE "forum_comments" DROP CONSTRAINT "forum_comments_author_id_fkey";

-- DropForeignKey
ALTER TABLE "forum_comments" DROP CONSTRAINT "forum_comments_post_id_fkey";

-- DropForeignKey
ALTER TABLE "forum_posts" DROP CONSTRAINT "forum_posts_author_id_fkey";

-- DropForeignKey
ALTER TABLE "forum_posts" DROP CONSTRAINT "forum_posts_category_id_fkey";

-- DropForeignKey
ALTER TABLE "help_articles" DROP CONSTRAINT "help_articles_category_id_fkey";

-- DropForeignKey
ALTER TABLE "help_requests" DROP CONSTRAINT "help_requests_user_id_fkey";

-- DropForeignKey
ALTER TABLE "houses" DROP CONSTRAINT "houses_block_id_fkey";

-- DropForeignKey
ALTER TABLE "houses" DROP CONSTRAINT "houses_type_id_fkey";

-- DropForeignKey
ALTER TABLE "ipl_bills" DROP CONSTRAINT "ipl_bills_house_id_fkey";

-- DropForeignKey
ALTER TABLE "ipl_bills" DROP CONSTRAINT "ipl_bills_rate_id_fkey";

-- DropForeignKey
ALTER TABLE "ipl_rates" DROP CONSTRAINT "ipl_rates_created_by_id_fkey";

-- DropForeignKey
ALTER TABLE "ipl_rates" DROP CONSTRAINT "ipl_rates_group_id_fkey";

-- DropForeignKey
ALTER TABLE "ipl_rates" DROP CONSTRAINT "ipl_rates_house_type_id_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_user_id_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_bill_id_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_user_id_fkey";

-- DropForeignKey
ALTER TABLE "residents" DROP CONSTRAINT "residents_house_id_fkey";

-- DropForeignKey
ALTER TABLE "residents" DROP CONSTRAINT "residents_user_id_fkey";

-- DropForeignKey
ALTER TABLE "security_reports" DROP CONSTRAINT "security_reports_reporter_id_fkey";

-- DropTable
DROP TABLE "Cluster";

-- DropTable
DROP TABLE "announcements";

-- DropTable
DROP TABLE "audit_logs";

-- DropTable
DROP TABLE "blocks";

-- DropTable
DROP TABLE "events";

-- DropTable
DROP TABLE "forum_categories";

-- DropTable
DROP TABLE "forum_comments";

-- DropTable
DROP TABLE "forum_posts";

-- DropTable
DROP TABLE "help_articles";

-- DropTable
DROP TABLE "help_categories";

-- DropTable
DROP TABLE "help_requests";

-- DropTable
DROP TABLE "house_types";

-- DropTable
DROP TABLE "houses";

-- DropTable
DROP TABLE "ipl_bills";

-- DropTable
DROP TABLE "ipl_rate_groups";

-- DropTable
DROP TABLE "ipl_rates";

-- DropTable
DROP TABLE "notifications";

-- DropTable
DROP TABLE "payments";

-- DropTable
DROP TABLE "residents";

-- DropTable
DROP TABLE "security_reports";
