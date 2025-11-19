import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { Role } from "@/types/roles";

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  role: Role;
  xp: number;
  passwordHash: string;
};

export type PublicUser = Omit<UserRecord, "passwordHash">;

const demoRoster: Array<
  Omit<UserRecord, "id" | "passwordHash"> & { password: string }
> = [
  {
    name: "Lyra Solaris",
    email: "client@devquest.io",
    role: "Quest Giver",
    xp: 420,
    password: "summon2025",
  },
  {
    name: "Ava Storm",
    email: "pm@devquest.io",
    role: "Guild Master",
    xp: 680,
    password: "guildmaster",
  },
  {
    name: "Kai Ember",
    email: "dev@devquest.io",
    role: "Adventurer",
    xp: 310,
    password: "adventure",
  },
];

const userStore: UserRecord[] = demoRoster.map((user) => ({
  id: randomUUID(),
  name: user.name,
  email: user.email.toLowerCase(),
  role: user.role,
  xp: user.xp,
  passwordHash: bcrypt.hashSync(user.password, 10),
}));

const sanitizeUser = (user: UserRecord): PublicUser => {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
};

export const getLeaderboard = (limit = 5): PublicUser[] => {
  return [...userStore]
    .sort((a, b) => b.xp - a.xp)
    .slice(0, limit)
    .map(sanitizeUser);
};

export const findUserByEmail = (email: string): UserRecord | undefined => {
  return userStore.find((user) => user.email === email.toLowerCase());
};

export const verifyPassword = (user: UserRecord, password: string) => {
  return bcrypt.compare(password, user.passwordHash);
};

type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  role: Role;
};

export const registerUser = async ({
  name,
  email,
  password,
  role,
}: RegisterPayload): Promise<PublicUser> => {
  const normalisedEmail = email.toLowerCase();
  if (findUserByEmail(normalisedEmail)) {
    throw new Error("Email already in use");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser: UserRecord = {
    id: randomUUID(),
    name,
    email: normalisedEmail,
    role,
    xp: 150,
    passwordHash,
  };

  userStore.push(newUser);
  return sanitizeUser(newUser);
};

