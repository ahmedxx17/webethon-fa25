import { getServerSession } from "next-auth";
import { authConfig } from "./auth.config";

export function auth() {
  return getServerSession(authConfig);
}

