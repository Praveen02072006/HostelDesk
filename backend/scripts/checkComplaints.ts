import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkComplaints() {
  const complaints = await prisma.complaint.findMany({
    include: { student: { include: { user: true } } }
  });
  console.log('Total complaints:', complaints.length);
  if (complaints.length > 0) {
    console.log(complaints.map(c => ({
      id: c.id,
      ticket: c.ticketNumber,
      title: c.title,
      studentId: c.student?.studentId,
      email: c.student?.user?.email,
      roomId: c.roomId
    })));
  }
}
checkComplaints().finally(() => prisma.$disconnect());
