import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prisma = new PrismaClient();
const data = JSON.parse(readFileSync(join(__dirname, "seed-data.json"), "utf-8"));

async function main() {
  console.log(`Seeding ${data.length} horses…`);
  let created = 0;
  let skipped = 0;

  for (const horse of data) {
    try {
      await prisma.horse.upsert({
        where: { name: horse.name },
        create: { ...horse, dob: horse.dob ? new Date(horse.dob) : null },
        update: { ...horse, dob: horse.dob ? new Date(horse.dob) : null },
      });
      created++;
    } catch {
      skipped++;
    }
  }

  console.log(`Done. Created/updated: ${created}, skipped: ${skipped}`);
}

main().finally(() => prisma.$disconnect());
