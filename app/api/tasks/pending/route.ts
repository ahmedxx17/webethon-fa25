import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { fetchPendingTasks } from "@/lib/services/task-service";

export async function GET() {
  const session = await auth() as any;
  if (!session?.user || session.user.role !== "Guild Master") {
    return NextResponse.json({ message: "Only Guild Masters can view queue" }, { status: 403 });
  }

  const tasks = await fetchPendingTasks();
  return NextResponse.json({ tasks });
}

