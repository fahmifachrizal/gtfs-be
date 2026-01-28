const { PrismaClient } = require('../generated');

const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
});

module.exports = { prisma };
