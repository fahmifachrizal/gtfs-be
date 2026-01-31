
import { prisma } from '../src/utils/prisma.js';
import { hashPassword } from '../src/utils/auth.js';

async function main() {
    console.log('Seeding database...');

    const passwordHash = await hashPassword('Password123!');

    const user = await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: {
            email: 'admin@example.com',
            username: 'admin',
            password_hash: passwordHash,
            first_name: 'Admin',
            last_name: 'User',
            is_active: true,
            is_verified: true,
            preferences: {
                create: {
                    theme: 'system',
                    language: 'en',
                    timezone: 'UTC',
                }
            }
        },
    });

    console.log({ user });
    console.log('Database seeded successfully.');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
