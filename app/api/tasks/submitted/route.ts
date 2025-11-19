import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { fetchSubmittedTasks } from "@/lib/services/task-service";

export async function GET() {
  const session = await auth() as any;
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const tasks = await fetchSubmittedTasks(session.user.id!);
  return NextResponse.json({ tasks });
}

