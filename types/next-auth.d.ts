import "next-auth";
import "next-auth/jwt";
import { Role } from "@/types/roles";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      role?: Role;
      xp?: number;
      badges?: string[];
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    role: Role;
    xp: number;
    badges?: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
    xp?: number;
    badges?: string[];
  }
}

