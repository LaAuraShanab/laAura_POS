import bcrypt from "bcrypt";
import { prisma } from "../../lib/prisma";
import { NotFoundError } from "../../errors/AppError";
import { Role, UserStatus } from "../../generated/prisma/client";

const SALT_ROUNDS = 12;

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
};

export function listUsers() {
  return prisma.user.findMany({ select: userSelect, orderBy: { createdAt: "desc" } });
}

export async function getUser(id: string) {
  const user = await prisma.user.findUnique({ where: { id }, select: userSelect });
  if (!user) throw new NotFoundError("User not found");
  return user;
}

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
  role: Role;
}) {
  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  return prisma.user.create({
    data: { name: input.name, email: input.email, passwordHash, role: input.role },
    select: userSelect,
  });
}

export async function updateUser(
  id: string,
  input: { name?: string; email?: string; role?: Role; status?: UserStatus; password?: string }
) {
  const data: Record<string, unknown> = {
    name: input.name,
    email: input.email,
    role: input.role,
    status: input.status,
  };

  if (input.password) {
    data.passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  }

  await getUser(id);

  return prisma.user.update({ where: { id }, data, select: userSelect });
}

export async function deactivateUser(id: string) {
  await getUser(id);
  return prisma.user.update({
    where: { id },
    data: { status: "INACTIVE" },
    select: userSelect,
  });
}
