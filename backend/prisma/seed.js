import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@gmail.com";

  const adminExists = await prisma.admin.findUnique({
    where: {
      email,
    },
  });

  if (adminExists) {
    console.log("✅ Admin already exists");
    return;
  }

  const hashedPassword = await bcrypt.hash("Admin@123", 10);

  await prisma.admin.create({
    data: {
      name: "Super Admin",
      email,
      password: hashedPassword,
    },
  });

  console.log("✅ Admin created successfully");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });