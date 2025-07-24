import { PrismaClient } from '../../prisma/generated/prisma/index.js'; // Adjust the path as necessary

const prisma = new PrismaClient();

// Connect to the PostgreSQL database
export async function connectDB() {
    try {
        // Establish the connection to the database
        await prisma.$connect();
        console.log('Connected to PostgreSQL database');
    } catch (err) {
        // Log the error and exit the process if the connection fails
        console.error('Failed to connect to PostgreSQL database', err);
        process.exit(1); // Exit the application
    }
}

// Export the Prisma Client instance to be used elsewhere
export { prisma };
