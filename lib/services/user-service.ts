import bcrypt from "bcryptjs";
import User from "@/models/User";
import { initDatabase } from "@/lib/mongodb";
import type { Role } from "@/types/roles";

// Helper function to serialize MongoDB documents
function serializeDoc(doc: any): any {
  if (!doc) return null;
  if (Array.isArray(doc)) return doc.map(serializeDoc);
  if (typeof doc !== "object" || doc instanceof Date) return doc;

  const serialized: any = {};
  for (const [key, value] of Object.entries(doc)) {
    if (value === null || value === undefined) {
      serialized[key] = value;
    } else if (value instanceof Date) {
      serialized[key] = value.toISOString();
    } else if (typeof value === "object") {
      if ((value as any)?._id) {
        // It's a populated reference, serialize it
        serialized[key] = { ...value, _id: (value as any)._id.toString() };
      } else if (Array.isArray(value)) {
        serialized[key] = value.map((v) =>
          (v as any)?._id ? { ...v, _id: (v as any)._id.toString() } : v
        );
      } else {
        // Recursively serialize nested objects
        serialized[key] = serializeDoc(value);
      }
    } else {
      serialized[key] = value;
    }
  }
  // Ensure _id is converted to string
  if ((doc as any)._id) serialized._id = (doc as any)._id.toString();
  return serialized;
}

export async function getUserByEmail(email: string, withPassword = false) {
  await initDatabase();
  const query = User.findOne({ email: email.toLowerCase() });
  if (withPassword) {
    query.select("+passwordHash");
  }
  const user = await query;
  return user ? JSON.parse(JSON.stringify(user)) : null;
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

  return JSON.parse(JSON.stringify(user));
}

export async function verifyPassword(email: string, password: string) {
  const user = await getUserByEmail(email, true);
  if (!user || !user.passwordHash) return false;
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return false;
  const result = await User.findById(user._id).select("-passwordHash").lean();
  return result ? JSON.parse(JSON.stringify(result)) : null;
}

export async function getLeaderboard(limit = 5) {
  await initDatabase();
  const players = await User.find({}, { passwordHash: 0 })
    .sort({ xp: -1 })
    .limit(limit)
    .lean();
  return players.map(player => JSON.parse(JSON.stringify(player)));
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

  const result = await User.findByIdAndUpdate(userId, update, {
    new: true,
  }).select("-passwordHash");
  
  return result ? JSON.parse(JSON.stringify(result)) : null;
}

export async function listDevelopers() {
  await initDatabase();
  const developers = await User.find({ role: "Adventurer" })
    .select("name email xp badges")
    .sort({ xp: -1 })
    .lean();
  return developers.map(dev => JSON.parse(JSON.stringify(dev)));
}

