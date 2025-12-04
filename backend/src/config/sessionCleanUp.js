// config/sessionCleanUp.js
import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const sessionCleanupJob = () => {
  console.log('🔄 Setting up session cleanup job...');
  
  const job = cron.schedule('0 2 * * *', async () => {
    console.log('🔄 Running session cleanup job...');
    
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const now = new Date();
      
      const deleted = await prisma.userSession.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: now } },
            { 
              AND: [
                { isRevoked: true },
                { revokedAt: { lt: sevenDaysAgo } }
              ]
            }
          ],
        },
      });
      
      console.log(`✅ Cleanup completed: Deleted ${deleted.count} sessions`);
    } catch (error) {
      console.error('❌ Cleanup job failed:', error);
    }
  });

  job.start();
  console.log('✅ Session cleanup job scheduled (daily at 2 AM)');
  
  return job;
};

// Export sebagai default
export default sessionCleanupJob;