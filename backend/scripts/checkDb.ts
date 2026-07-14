import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: {
      student: true,
      worker: true,
      admin: true,
    }
  });

  console.log("--- DATABASE USERS & PROFILES ---");
  for (const u of users) {
    const profile = u.student || u.worker || u.admin;
    const name = profile ? `${profile.firstName} ${profile.lastName}` : 'No Profile';
    console.log(`User ID: ${u.id} | Email: ${u.email} | Role: ${u.role} | Profile Name: ${name} | StudentId: ${u.student?.studentId || 'N/A'}`);
  }
}

main().finally(() => prisma.$disconnect());
