import bcrypt from "bcrypt";
import { prisma } from "../config/db.js";
import { generateToken } from "../utils/jwt.js";

export const loginService = async (email, password) => {
  const admin = await prisma.admin.findUnique({
    where: {
      email,
    },
  });

  if (!admin) {
    throw new Error("Invalid Email or Password");
  }

  const isMatch = await bcrypt.compare(password, admin.password);

  if (!isMatch) {
    throw new Error("Invalid Email or Password");
  }

  const token = generateToken(admin);

  return {
    admin: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
    },
    token,
  };
};