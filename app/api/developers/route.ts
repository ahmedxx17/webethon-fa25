import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { listDevelopers } from "@/lib/services/user-service";

export async function GET() {
  const session = await auth() as any;
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const devs = await listDevelopers();
  return NextResponse.json({ developers: devs });
}

