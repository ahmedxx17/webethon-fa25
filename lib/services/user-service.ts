import bcrypt from "bcryptjs";
import User from "@/models/User";
import { initDatabase } from "@/lib/mongodb";
import type { Role } from "@/types/roles";

export async function getUserByEmail(email: string, withPassword = false) {
  await initDatabase();
  const query = User.findOne({ email: email.toLowerCase() });
  if (withPassword) {
    query.select("+passwordHash");
  }
  return query;
}

export async function createUser({
  name,
  email,
  password,
  role,
}: {
  name: string;
  email: string;
  password: string;
  role: Role;
}) {
  await initDatabase();

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new Error("Email already in use");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    role,
    xp: role === "Adventurer" ? 150 : 0,
    badges: [],
    passwordHash,
  });

  return user;
}

export async function verifyPassword(email: string, password: string) {
  const user = await getUserByEmail(email, true);
  if (!user || !user.passwordHash) return false;
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return false;
  return User.findById(user._id).select("-passwordHash").lean();
}

export async function getLeaderboard(limit = 5) {
  await initDatabase();
  const players = await User.find({}, { passwordHash: 0 })
    .sort({ xp: -1 })
    .limit(limit)
    .lean();
  return players;
}

export async function awardXpToUser(
  userId: string,
  xp: number,
  badges: string[] = []
) {
  await initDatabase();

  const update: Record<string, unknown> = { $inc: { xp } };
  if (badges.length) {
    update.$addToSet = { badges: { $each: badges } };
  }

  return User.findByIdAndUpdate(userId, update, {
    new: true,
  }).select("-passwordHash");
}

export async function listDevelopers() {
  await initDatabase();
  return User.find({ role: "Adventurer" })
    .select("name email xp badges")
    .sort({ xp: -1 })
    .lean();
}

