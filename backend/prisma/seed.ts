import { PrismaClient, ComplaintStatus, Priority, Role, JobStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;
const DEFAULT_PASSWORD = 'Password123';

// ============================================================
// DATA GENERATORS
// ============================================================
const firstNames = ['Arjun', 'Priya', 'Rahul', 'Neha', 'Vikram', 'Anita', 'Sanjay', 'Meera', 'Rajesh', 'Kavya',
  'Aditya', 'Sneha', 'Kiran', 'Divya', 'Suresh', 'Pooja', 'Manish', 'Lakshmi', 'Ravi', 'Sunita',
  'Ashwin', 'Deepa', 'Harish', 'Anjali', 'Vinod', 'Rekha', 'Ganesh', 'Swathi', 'Praveen', 'Nandini',
  'Arun', 'Shwetha', 'Mohan', 'Preethi', 'Kumar', 'Bhavana', 'Naveen', 'Varsha', 'Sunil', 'Usha'];

const lastNames = ['Kumar', 'Sharma', 'Patel', 'Singh', 'Reddy', 'Naidu', 'Rao', 'Gupta', 'Nair', 'Pillai',
  'Verma', 'Joshi', 'Mehta', 'Iyer', 'Krishnan', 'Menon', 'Bhat', 'Shetty', 'Hegde', 'Kamath'];

const departments = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Chemical', 'Biotechnology', 'Mathematics', 'Physics'];

const complaintTitles = {
  Electrical: ['Lights not working in room', 'Power outlet not functioning', 'Fan making noise', 'AC not cooling', 'Short circuit issue', 'Tube light flickering'],
  Plumbing: ['Water leakage from pipe', 'Tap not working', 'Blocked drain', 'Toilet flush broken', 'Water supply interrupted', 'Hot water not available'],
  Furniture: ['Chair leg broken', 'Table damaged', 'Bed frame loose', 'Cupboard door won\'t close', 'Drawer broken', 'Study table wobbly'],
  Cleaning: ['Room not cleaned', 'Bathroom dirty', 'Garbage not collected', 'Common area messy', 'Pest infestation', 'Washroom not hygienic'],
  Internet: ['No WiFi connectivity', 'Internet very slow', 'WiFi password not working', 'LAN cable issue', 'Router not working', 'Network drops frequently'],
  Appliances: ['Water heater not working', 'Washing machine broken', 'Refrigerator not cooling', 'TV not turning on', 'Microwave damaged', 'Induction plate broken'],
  Others: ['Room lock broken', 'Window glass cracked', 'Wall paint peeling', 'Floor tiles cracked', 'Ceiling leak during rain', 'Door not closing properly'],
};

const getRandomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomDate = (daysBack: number): Date => new Date(Date.now() - Math.random() * daysBack * 24 * 60 * 60 * 1000);

async function main() {
  console.log('🌱 Starting HostelDesk seed...');

  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

  // ============================================================
  // HOSTELS
  // ============================================================
  console.log('Creating hostels...');
  const hostelData = [
    { name: 'Ganga Hostel', code: 'GH', address: 'North Campus Block A', blocks: ['A', 'B', 'C', 'D'], floors: 5 },
    { name: 'Kaveri Hostel', code: 'KH', address: 'South Campus Block B', blocks: ['A', 'B', 'C'], floors: 4 },
    { name: 'Yamuna Hostel', code: 'YH', address: 'East Campus Block C', blocks: ['A', 'B'], floors: 6 },
  ];

  const hostels = await Promise.all(
    hostelData.map(h => prisma.hostel.upsert({
      where: { code: h.code },
      update: {},
      create: h,
    }))
  );
  console.log(`✅ Created ${hostels.length} hostels`);

  // ============================================================
  // ROOMS (50+ rooms per hostel)
  // ============================================================
  console.log('Creating rooms...');
  const rooms: { id: string; hostelId: string; block: string; floor: number; roomNumber: string }[] = [];

  for (const hostel of hostels) {
    for (const block of hostel.blocks) {
      for (let floor = 1; floor <= hostel.floors; floor++) {
        for (let roomNum = 1; roomNum <= 8; roomNum++) {
          const roomNumber = `${block}${floor}0${roomNum}`;
          const qrCode = `${hostel.code}-${block}-${floor}-${roomNumber}`.toLowerCase();

          const room = await prisma.room.upsert({
            where: { hostelId_roomNumber_block: { hostelId: hostel.id, roomNumber, block } },
            update: {},
            create: { hostelId: hostel.id, roomNumber, floor, block, capacity: 4, qrCode },
          });
          rooms.push({ id: room.id, hostelId: hostel.id, block, floor, roomNumber });
        }
      }
    }
  }
  console.log(`✅ Created ${rooms.length} rooms`);

  // ============================================================
  // CATEGORIES & SUBCATEGORIES
  // ============================================================
  console.log('Creating categories...');
  const categoryData = [
    { name: 'Electrical', icon: '⚡', color: '#F59E0B', subcategories: ['Light not working', 'Power outlet issue', 'Short circuit', 'Fan not working', 'AC issue', 'Switchboard damaged'] },
    { name: 'Plumbing', icon: '🔧', color: '#3B82F6', subcategories: ['Water leakage', 'Tap not working', 'Drain blocked', 'Toilet issue', 'Water supply', 'Pipe burst'] },
    { name: 'Furniture', icon: '🪑', color: '#8B5CF6', subcategories: ['Broken chair', 'Damaged table', 'Bed issue', 'Cupboard damage', 'Drawer broken', 'Door hinge'] },
    { name: 'Cleaning', icon: '🧹', color: '#10B981', subcategories: ['Room cleaning', 'Bathroom cleaning', 'Common area', 'Garbage removal', 'Pest control', 'Washroom hygiene'] },
    { name: 'Internet', icon: '📶', color: '#6366F1', subcategories: ['No connectivity', 'Slow speed', 'WiFi not working', 'Cable issue', 'Router problem', 'LAN port'] },
    { name: 'Appliances', icon: '🔌', color: '#EF4444', subcategories: ['Water heater', 'Washing machine', 'Refrigerator', 'TV', 'Microwave', 'Induction'] },
    { name: 'Others', icon: '📋', color: '#6B7280', subcategories: ['Lock issue', 'Window broken', 'Wall damage', 'Flooring', 'Ceiling crack', 'General maintenance'] },
  ];

  const categories: { id: string; name: string }[] = [];
  const subcategories: { id: string; categoryId: string; name: string }[] = [];

  for (const cat of categoryData) {
    const category = await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: { name: cat.name, icon: cat.icon, color: cat.color },
    });
    categories.push(category);

    for (const subName of cat.subcategories) {
      const sub = await prisma.subcategory.upsert({
        where: { categoryId_name: { categoryId: category.id, name: subName } },
        update: {},
        create: { categoryId: category.id, name: subName },
      });
      subcategories.push(sub);
    }
  }
  console.log(`✅ Created ${categories.length} categories, ${subcategories.length} subcategories`);

  // ============================================================
  // MANAGEMENT USERS (2)
  // ============================================================
  console.log('Creating management users...');
  const managementData = [
    { email: 'coo@hosteldesk.com', firstName: 'Ramesh', lastName: 'Acharya' },
    { email: 'director@hosteldesk.com', firstName: 'Sunanda', lastName: 'Krishnan' },
  ];

  for (const m of managementData) {
    const user = await prisma.user.upsert({
      where: { email: m.email },
      update: {},
      create: {
        email: m.email,
        password: hashedPassword,
        role: Role.MANAGEMENT,
        isEmailVerified: true,
        management: { create: { firstName: m.firstName, lastName: m.lastName, phone: `+91 9${getRandomInt(100000000, 999999999)}` } },
      },
    });
    console.log(`  Management: ${m.email}`);
  }

  // ============================================================
  // SUPERVISORS (3)
  // ============================================================
  console.log('Creating supervisors...');
  for (let i = 0; i < 3; i++) {
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);
    const email = `supervisor${i + 1}@hosteldesk.com`;
    const hostel = hostels[i % hostels.length];

    await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        password: hashedPassword,
        role: Role.SUPERVISOR,
        isEmailVerified: true,
        supervisor: {
          create: {
            firstName,
            lastName,
            phone: `+91 9${getRandomInt(100000000, 999999999)}`,
            hostelId: hostel.id,
          },
        },
      },
    });
    console.log(`  Supervisor: ${email}`);
  }

  // ============================================================
  // ADMINS (5)
  // ============================================================
  console.log('Creating admins...');
  for (let i = 0; i < 5; i++) {
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);
    const email = `admin${i + 1}@hosteldesk.com`;
    const hostel = hostels[i % hostels.length];

    await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        password: hashedPassword,
        role: Role.ADMIN,
        isEmailVerified: true,
        admin: {
          create: {
            firstName,
            lastName,
            phone: `+91 9${getRandomInt(100000000, 999999999)}`,
            hostelId: hostel.id,
          },
        },
      },
    });
    console.log(`  Admin: ${email}`);
  }

  // ============================================================
  // WORKERS (20)
  // ============================================================
  console.log('Creating workers...');
  const specializations = [
    ['Electrical', 'Appliances'],
    ['Plumbing', 'Cleaning'],
    ['Furniture', 'Others'],
    ['Internet', 'Electrical'],
    ['Cleaning', 'Others'],
  ];
  const workerIds: string[] = [];

  for (let i = 0; i < 20; i++) {
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);
    const email = `worker${i + 1}@hosteldesk.com`;
    const hostel = hostels[i % hostels.length];

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        password: hashedPassword,
        role: Role.WORKER,
        isEmailVerified: true,
        worker: {
          create: {
            firstName,
            lastName,
            employeeId: `EMP${String(i + 1).padStart(3, '0')}`,
            phone: `+91 9${getRandomInt(100000000, 999999999)}`,
            hostelId: hostel.id,
            specialization: specializations[i % specializations.length],
            isAvailable: Math.random() > 0.2,
            rating: Math.round((3 + Math.random() * 2) * 10) / 10,
          },
        },
      },
      include: { worker: true },
    });

    if (user.worker) workerIds.push(user.worker.id);
  }
  console.log(`✅ Created 20 workers`);

  // ============================================================
  // STUDENTS (100)
  // ============================================================
  console.log('Creating students...');
  const studentIds: string[] = [];

  for (let i = 0; i < 100; i++) {
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);
    const email = `student${i + 1}@hosteldesk.com`;
    const hostel = hostels[i % hostels.length];
    const room = rooms.filter(r => r.hostelId === hostel.id)[i % rooms.filter(r => r.hostelId === hostel.id).length];

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        password: hashedPassword,
        role: Role.STUDENT,
        isEmailVerified: true,
        student: {
          create: {
            firstName,
            lastName,
            studentId: `STU${String(2024000 + i + 1)}`,
            phone: `+91 9${getRandomInt(100000000, 999999999)}`,
            hostelId: hostel.id,
            roomId: room.id,
            department: getRandomElement(departments),
            year: getRandomInt(1, 4),
          },
        },
      },
      include: { student: true },
    });

    if (user.student) studentIds.push(user.student.id);
  }
  console.log(`✅ Created 100 students`);

  // ============================================================
  // COMPLAINTS (500)
  // ============================================================
  console.log('Creating 500 complaints...');
  const statuses = [
    ComplaintStatus.RAISED,
    ComplaintStatus.VERIFIED,
    ComplaintStatus.ASSIGNED,
    ComplaintStatus.ACCEPTED,
    ComplaintStatus.IN_PROGRESS,
    ComplaintStatus.COMPLETED,
    ComplaintStatus.CLOSED,
    ComplaintStatus.CANCELLED,
  ];
  const priorities = [Priority.CRITICAL, Priority.HIGH, Priority.MEDIUM, Priority.LOW];
  const priorityWeights = [0.05, 0.2, 0.5, 0.25]; // probability weights

  const getWeightedPriority = (): Priority => {
    const rand = Math.random();
    let cumulative = 0;
    for (let i = 0; i < priorities.length; i++) {
      cumulative += priorityWeights[i];
      if (rand <= cumulative) return priorities[i];
    }
    return Priority.MEDIUM;
  };

  let complaintCount = 0;
  for (let i = 0; i < 500; i++) {
    const student = await prisma.student.findFirst({
      where: { id: studentIds[i % studentIds.length] },
      include: { hostel: true, room: true },
    });
    if (!student || !student.hostelId) continue;

    const category = categories[i % categories.length];
    const categorySubcategories = subcategories.filter(s => s.categoryId === category.id);
    const subcategory = getRandomElement(categorySubcategories);
    const priority = getWeightedPriority();
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const createdAt = getRandomDate(180); // last 6 months

    const slaHours = { CRITICAL: 4, HIGH: 24, MEDIUM: 72, LOW: 168 };
    const slaDeadline = new Date(createdAt.getTime() + slaHours[priority] * 60 * 60 * 1000);
    const slaBreached = status !== ComplaintStatus.COMPLETED && status !== ComplaintStatus.CLOSED && slaDeadline < new Date();

    const titleList = complaintTitles[category.name as keyof typeof complaintTitles] || ['General issue'];
    const title = getRandomElement(titleList);

    const complaint = await prisma.complaint.create({
      data: {
        ticketNumber: `HD${String(createdAt.getFullYear()).slice(-2)}${String(createdAt.getMonth() + 1).padStart(2, '0')}${String(i + 1000).padStart(4, '0')}`,
        title,
        description: `${title}. This needs urgent attention. The issue has been persisting for ${getRandomInt(1, 30)} days. Please fix it as soon as possible.`,
        status,
        priority,
        categoryId: category.id,
        subcategoryId: subcategory.id,
        studentId: student.id,
        hostelId: student.hostelId,
        roomId: student.roomId,
        floor: student.room?.floor,
        block: student.room?.block,
        roomNumber: student.room?.roomNumber,
        slaDeadline,
        slaBreached,
        isRecurring: Math.random() < 0.1,
        createdAt,
        updatedAt: new Date(),
        ...(status === ComplaintStatus.COMPLETED || status === ComplaintStatus.CLOSED ? {
          completedAt: new Date(createdAt.getTime() + getRandomInt(1, slaHours[priority]) * 60 * 60 * 1000),
        } : {}),
        ...(status === ComplaintStatus.CLOSED ? { closedAt: new Date() } : {}),
        ...(status === ComplaintStatus.CANCELLED ? {
          cancelledAt: new Date(),
          cancelReason: 'Issue resolved on its own',
        } : {}),
        statusHistory: {
          create: {
            toStatus: ComplaintStatus.RAISED,
            changedBy: student.userId,
            note: 'Complaint raised',
            createdAt,
          },
        },
      },
    });

    // Assign workers to appropriate complaints
    if (([ComplaintStatus.ASSIGNED, ComplaintStatus.ACCEPTED, ComplaintStatus.IN_PROGRESS, ComplaintStatus.COMPLETED, ComplaintStatus.CLOSED] as ComplaintStatus[]).includes(status)) {
      const workerId = workerIds[i % workerIds.length];
      const assignmentStatus: JobStatus =
        status === ComplaintStatus.COMPLETED || status === ComplaintStatus.CLOSED ? JobStatus.COMPLETED :
        status === ComplaintStatus.IN_PROGRESS ? JobStatus.IN_PROGRESS :
        status === ComplaintStatus.ACCEPTED ? JobStatus.ACCEPTED : JobStatus.PENDING;

      await prisma.assignment.create({
        data: {
          complaintId: complaint.id,
          workerId,
          assignedBy: 'system',
          status: assignmentStatus,
          acceptedAt: status !== ComplaintStatus.ASSIGNED ? new Date(createdAt.getTime() + 2 * 60 * 60 * 1000) : undefined,
          startedAt: ([ComplaintStatus.IN_PROGRESS, ComplaintStatus.COMPLETED, ComplaintStatus.CLOSED] as ComplaintStatus[]).includes(status)
            ? new Date(createdAt.getTime() + 4 * 60 * 60 * 1000) : undefined,
          completedAt: ([ComplaintStatus.COMPLETED, ComplaintStatus.CLOSED] as ComplaintStatus[]).includes(status)
            ? new Date(createdAt.getTime() + 8 * 60 * 60 * 1000) : undefined,
          createdAt,
        },
      });
    }

    // Add feedback for completed complaints
    if ((status === ComplaintStatus.COMPLETED || status === ComplaintStatus.CLOSED) && Math.random() > 0.4) {
      const rating = getRandomInt(3, 5);
      const comments = ['Excellent work!', 'Fixed quickly, thank you', 'Good job', 'Satisfied with the repair', 'Could be faster but good work'];

      await prisma.feedback.upsert({
        where: { complaintId: complaint.id },
        update: {},
        create: {
          complaintId: complaint.id,
          studentId: student.id,
          workerId: workerIds[i % workerIds.length],
          rating,
          comment: getRandomElement(comments),
        },
      });
    }

    complaintCount++;
    if (complaintCount % 50 === 0) console.log(`  Created ${complaintCount} complaints...`);
  }
  console.log(`✅ Created ${complaintCount} complaints`);

  // ============================================================
  // UPDATE WORKER RATINGS
  // ============================================================
  console.log('Updating worker ratings...');
  const allWorkers = await prisma.worker.findMany();
  for (const worker of allWorkers) {
    const avg = await prisma.feedback.aggregate({
      where: { workerId: worker.id },
      _avg: { rating: true },
      _count: { rating: true },
    });

    if (avg._avg.rating) {
      await prisma.worker.update({
        where: { id: worker.id },
        data: {
          rating: Math.round((avg._avg.rating || 4.0) * 10) / 10,
          totalJobs: avg._count.rating + getRandomInt(5, 20),
          completedJobs: avg._count.rating,
        },
      });
    }
  }

  console.log('\n✅ Seed completed successfully!');
  console.log('\n📋 Test Credentials:');
  console.log('  Management: director@hosteldesk.com / Password123');
  console.log('  Admin: admin1@hosteldesk.com / Password123');
  console.log('  Supervisor: supervisor1@hosteldesk.com / Password123');
  console.log('  Worker: worker1@hosteldesk.com / Password123');
  console.log('  Student: student1@hosteldesk.com / Password123');
}

main()
  .catch(e => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
