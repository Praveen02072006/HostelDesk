import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Fetching all workers...');
  const workers = await prisma.worker.findMany({
    include: {
      user: true,
    },
  });

  console.log(`Found ${workers.length} workers. Updating emails...`);

  for (const worker of workers) {
    const firstName = worker.firstName.toLowerCase().replace(/\s+/g, '');
    const lastName = worker.lastName.toLowerCase().replace(/\s+/g, '');
    const newEmail = `${firstName}.${lastName}@hosteldesk.com`;

    // Check if another user already has this email
    const existingUser = await prisma.user.findUnique({
      where: { email: newEmail },
    });

    if (existingUser && existingUser.id !== worker.userId) {
      // If duplicate, append employee ID suffix
      const suffixEmail = `${firstName}.${lastName}.${worker.employeeId.toLowerCase()}@hosteldesk.com`;
      console.log(`Email collision for ${newEmail}. Using ${suffixEmail} instead.`);
      await prisma.user.update({
        where: { id: worker.userId },
        data: { email: suffixEmail },
      });
    } else {
      console.log(`Updating ${worker.user.email} -> ${newEmail}`);
      await prisma.user.update({
        where: { id: worker.userId },
        data: { email: newEmail },
      });
    }
  }

  console.log('Worker emails update complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
