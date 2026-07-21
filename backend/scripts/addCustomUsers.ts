import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const customUsers = [
    { email: '24010690', password: 'p', firstName: 'Custom', lastName: 'Student1' },
    { email: '23014193', password: '2313', firstName: 'Custom', lastName: 'Student2' }
  ];

  console.log('Creating custom users...');
  
  // Find a hostel and room for the students
  const hostel = await prisma.hostel.findFirst();
  const room = await prisma.room.findFirst({ where: { hostelId: hostel?.id } });

  if (!hostel || !room) {
    console.error('No hostel or room found in DB');
    return;
  }

  for (const cu of customUsers) {
    const hashedPassword = await bcrypt.hash(cu.password, 12);
    await prisma.user.upsert({
      where: { email: cu.email },
      update: {
        password: hashedPassword,
      },
      create: {
        email: cu.email,
        password: hashedPassword,
        role: Role.STUDENT,
        isEmailVerified: true,
        student: {
          create: {
            firstName: cu.firstName,
            lastName: cu.lastName,
            studentId: cu.email,
            phone: `+91 9999999999`,
            hostelId: hostel.id,
            roomId: room.id,
            department: 'CSE',
            year: 1,
          },
        },
      },
    });
    console.log(`✅ Created custom user: ${cu.email}`);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
