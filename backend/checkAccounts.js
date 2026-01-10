import { prisma } from "./src/config/db";

async function main() {
  const accounts = await prisma.systemAccount.findMany();
  console.log(JSON.stringify(accounts, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
