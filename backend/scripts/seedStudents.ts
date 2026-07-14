/**
 * Seed script: Populates the database with sample student data
 * from .context/STUDENT_DATA.md
 *
 * Usage:  npx ts-node scripts/seedStudents.ts
 */

import { PrismaClient, Role, Gender } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = 'Student@123';
const SALT_ROUNDS = 12;

// ── Hostel definitions (derived from STUDENT_DATA.md) ──────────────
const HOSTELS = [
  { name: 'Boys Hostel A', code: 'BHA', blocks: ['A'], floors: 5 },
  { name: 'Boys Hostel B', code: 'BHB', blocks: ['B'], floors: 5 },
  { name: 'Boys Hostel C', code: 'BHC', blocks: ['C'], floors: 5 },
  { name: 'Boys Hostel D', code: 'BHD', blocks: ['D'], floors: 5 },
];

// ── Room definitions ────────────────────────────────────────────────
interface RoomDef {
  roomNumber: string;
  floor: number;
  block: string;
  capacity: number;        // 1=Single, 2=Double, 3=Triple
  hostelCode: string;      // maps to HOSTELS[].code
}

const ROOMS: RoomDef[] = [
  { roomNumber: 'A101', floor: 1, block: 'A', capacity: 2, hostelCode: 'BHA' },
  { roomNumber: 'A102', floor: 1, block: 'A', capacity: 2, hostelCode: 'BHA' },
  { roomNumber: 'A205', floor: 2, block: 'A', capacity: 3, hostelCode: 'BHA' },
  { roomNumber: 'A410', floor: 4, block: 'A', capacity: 1, hostelCode: 'BHA' },
  { roomNumber: 'B308', floor: 3, block: 'B', capacity: 1, hostelCode: 'BHB' },
  { roomNumber: 'B210', floor: 2, block: 'B', capacity: 2, hostelCode: 'BHB' },
  { roomNumber: 'C110', floor: 1, block: 'C', capacity: 3, hostelCode: 'BHC' },
  { roomNumber: 'C208', floor: 2, block: 'C', capacity: 2, hostelCode: 'BHC' },
  { roomNumber: 'D112', floor: 1, block: 'D', capacity: 3, hostelCode: 'BHD' },
  { roomNumber: 'D220', floor: 2, block: 'D', capacity: 2, hostelCode: 'BHD' },
];

// ── Student definitions (from .context/STUDENT_DATA.md) ─────────────
interface StudentDef {
  studentId: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  department: string;
  year: number;
  collegeEmail: string;
  personalEmail: string;
  phone: string;
  hostelCode: string;
  roomNumber: string;
}

const STUDENTS: StudentDef[] = [
  {
    studentId: 'SEC24CS001',
    firstName: 'Aarav',
    lastName: 'Sharma',
    gender: Gender.MALE,
    department: 'CSE',
    year: 2,
    collegeEmail: 'aarav.sharma@saveetha.ac.in',
    personalEmail: 'aarav@gmail.com',
    phone: '+919876543210',
    hostelCode: 'BHA',
    roomNumber: 'A101',
  },
  {
    studentId: 'SEC24CS002',
    firstName: 'Rahul',
    lastName: 'Verma',
    gender: Gender.MALE,
    department: 'CSE',
    year: 2,
    collegeEmail: 'rahul@gmail.com',
    personalEmail: 'rahul@gmail.com',
    phone: '+919876543211',
    hostelCode: 'BHA',
    roomNumber: 'A102',
  },
  {
    studentId: 'SEC24CS003',
    firstName: 'Aditya',
    lastName: 'Kumar',
    gender: Gender.MALE,
    department: 'CSE',
    year: 2,
    collegeEmail: 'aditya.kumar@saveetha.ac.in',
    personalEmail: 'aditya@gmail.com',
    phone: '+919876543212',
    hostelCode: 'BHA',
    roomNumber: 'A205',
  },
  {
    studentId: 'SEC24CS004',
    firstName: 'Praveen',
    lastName: 'Raj G',
    gender: Gender.MALE,
    department: 'CSE',
    year: 3,
    collegeEmail: 'praveen.raj@saveetha.ac.in',
    personalEmail: 'praveen@gmail.com',
    phone: '+919876543213',
    hostelCode: 'BHB',
    roomNumber: 'B308',
  },
  {
    studentId: 'SEC24CS005',
    firstName: 'Karthik',
    lastName: 'R',
    gender: Gender.MALE,
    department: 'AI & DS',
    year: 2,
    collegeEmail: 'karthik.r@saveetha.ac.in',
    personalEmail: 'karthik@gmail.com',
    phone: '+919876543214',
    hostelCode: 'BHB',
    roomNumber: 'B210',
  },
  {
    studentId: 'SEC24CS006',
    firstName: 'Naveen',
    lastName: 'Kumar',
    gender: Gender.MALE,
    department: 'IT',
    year: 1,
    collegeEmail: 'naveen.kumar@saveetha.ac.in',
    personalEmail: 'naveen@gmail.com',
    phone: '+919876543215',
    hostelCode: 'BHC',
    roomNumber: 'C110',
  },
  {
    studentId: 'SEC24CS007',
    firstName: 'Arjun',
    lastName: 'S',
    gender: Gender.MALE,
    department: 'ECE',
    year: 2,
    collegeEmail: 'arjun.s@saveetha.ac.in',
    personalEmail: 'arjun@gmail.com',
    phone: '+919876543216',
    hostelCode: 'BHC',
    roomNumber: 'C208',
  },
  {
    studentId: 'SEC24CS008',
    firstName: 'Vishal',
    lastName: 'M',
    gender: Gender.MALE,
    department: 'Mechanical',
    year: 3,
    collegeEmail: 'vishal.m@saveetha.ac.in',
    personalEmail: 'vishal@gmail.com',
    phone: '+919876543217',
    hostelCode: 'BHA',
    roomNumber: 'A410',
  },
  {
    studentId: 'SEC24CS009',
    firstName: 'Rohit',
    lastName: 'Singh',
    gender: Gender.MALE,
    department: 'Civil',
    year: 1,
    collegeEmail: 'rohit.singh@saveetha.ac.in',
    personalEmail: 'rohit@gmail.com',
    phone: '+919876543218',
    hostelCode: 'BHD',
    roomNumber: 'D112',
  },
  {
    studentId: 'SEC24CS010',
    firstName: 'Harish',
    lastName: 'Kumar',
    gender: Gender.MALE,
    department: 'Biotechnology',
    year: 2,
    collegeEmail: 'harish.kumar@saveetha.ac.in',
    personalEmail: 'harish@gmail.com',
    phone: '+919876543219',
    hostelCode: 'BHD',
    roomNumber: 'D220',
  },
];

// ── Main ─────────────────────────────────────────────────────────────
async function main() {
  console.log('🌱 Seeding student data from .context/STUDENT_DATA.md ...\n');

  const hashedPwd = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

  // 1. Upsert Hostels
  console.log('🏠 Upserting hostels...');
  const hostelMap: Record<string, string> = {};
  for (const h of HOSTELS) {
    const hostel = await prisma.hostel.upsert({
      where: { code: h.code },
      update: { name: h.name, blocks: h.blocks, floors: h.floors },
      create: { name: h.name, code: h.code, blocks: h.blocks, floors: h.floors },
    });
    hostelMap[h.code] = hostel.id;
    console.log(`   ✅ ${h.name} (${h.code})`);
  }

  // 2. Upsert Rooms
  console.log('\n🚪 Upserting rooms...');
  const roomMap: Record<string, string> = {};
  for (const r of ROOMS) {
    const hostelId = hostelMap[r.hostelCode];
    const existing = await prisma.room.findFirst({
      where: { hostelId, roomNumber: r.roomNumber, block: r.block },
    });
    let room;
    if (existing) {
      room = await prisma.room.update({
        where: { id: existing.id },
        data: { floor: r.floor, capacity: r.capacity },
      });
    } else {
      room = await prisma.room.create({
        data: {
          hostelId,
          roomNumber: r.roomNumber,
          floor: r.floor,
          block: r.block,
          capacity: r.capacity,
        },
      });
    }
    roomMap[r.roomNumber] = room.id;
    console.log(`   ✅ ${r.roomNumber} (${r.block}, Floor ${r.floor}, ${r.capacity}-sharing)`);
  }

  // 3. Upsert Users + Students
  console.log('\n👤 Upserting student accounts...');
  for (const s of STUDENTS) {
    const hostelId = hostelMap[s.hostelCode];
    const roomId = roomMap[s.roomNumber];

    // Check if a user with this email already exists
    let user = await prisma.user.findUnique({ where: { email: s.collegeEmail } });

    if (user) {
      // Update existing user's student record
      await prisma.student.update({
        where: { userId: user.id },
        data: {
          firstName: s.firstName,
          lastName: s.lastName,
          studentId: s.studentId,
          phone: s.phone,
          gender: s.gender,
          personalEmail: s.personalEmail,
          department: s.department,
          year: s.year,
          hostelId,
          roomId,
        },
      });
      console.log(`   🔄 Updated: ${s.firstName} ${s.lastName} (${s.studentId})`);
    } else {
      // Create user + student together
      user = await prisma.user.create({
        data: {
          email: s.collegeEmail,
          password: hashedPwd,
          role: Role.STUDENT,
          isActive: true,
          isEmailVerified: true,
          student: {
            create: {
              firstName: s.firstName,
              lastName: s.lastName,
              studentId: s.studentId,
              phone: s.phone,
              gender: s.gender,
              personalEmail: s.personalEmail,
              department: s.department,
              year: s.year,
              hostelId,
              roomId,
            },
          },
        },
      });
      console.log(`   ✅ Created: ${s.firstName} ${s.lastName} (${s.studentId}) — ${s.collegeEmail}`);
    }
  }

  console.log('\n🎉 Seeding complete! All 10 students are ready.');
  console.log(`\n📋 Login with any college email + password: ${DEFAULT_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
