import { PrismaClient } from '@prisma/client';
import { seedCategories } from '../src/controllers/category.controller';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting category reseeding...');

  // Delete all complaints to avoid foreign key constraints
  console.log('Deleting existing complaints...');
  await prisma.complaintImage.deleteMany();
  await prisma.statusHistory.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.inventoryUsage.deleteMany();
  await prisma.notification.deleteMany(); 
  await prisma.complaint.deleteMany();
  
  console.log('Deleting existing subcategories and categories...');
  await prisma.subcategory.deleteMany();
  await prisma.category.deleteMany();

  console.log('Seeding new categories...');
  await seedCategories();

  console.log('Category reseeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
