import { PrismaClient } from "@prisma/client";
import data from "./seed-data.json";

const prisma = new PrismaClient();

async function main() {
  console.log(`Seeding ${data.length} horses…`);
  let created = 0;
  let skipped = 0;

  for (const horse of data as any[]) {
    try {
      await prisma.horse.upsert({
        where: { name: horse.name },
        create: {
          ...horse,
          dob: horse.dob ? new Date(horse.dob) : null,
        },
        update: {
          ...horse,
          dob: horse.dob ? new Date(horse.dob) : null,
        },
      });
      created++;
    } catch (e) {
      skipped++;
    }
  }

  console.log(`Done. Created/updated: ${created}, skipped: ${skipped}`);
}

main().finally(() => prisma.$disconnect());
