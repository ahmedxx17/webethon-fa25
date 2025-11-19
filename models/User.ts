import { Schema, model, models } from "mongoose";
import type { Role } from "@/types/roles";

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["Quest Giver", "Guild Master", "Adventurer"],
      required: true,
    },
    passwordHash: { type: String, required: true, select: false },
    xp: { type: Number, default: 0 },
    badges: { type: [String], default: [] },
  },
  { timestamps: true }
);

export type UserDocument = {
  _id: string;
  name: string;
  email: string;
  role: Role;
  xp: number;
  badges: string[];
  passwordHash?: string;
};

const User = models.User || model("User", UserSchema);

export default User;

