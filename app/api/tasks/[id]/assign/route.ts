import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/auth";
import { assignTask } from "@/lib/services/task-service";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth() as any;
  if (!session?.user || session.user.role !== "Guild Master") {
    return NextResponse.json({ message: "Only Guild Masters can assign tasks" }, { status: 403 });
  }

  const payload = await request.json();
  const assigneeEmail = payload?.assigneeEmail?.toString().toLowerCase();

  if (!assigneeEmail) {
    return NextResponse.json({ message: "Assignee email required" }, { status: 400 });
  }

  try {
    const task = await assignTask({ taskId: id, assigneeEmail });
    return NextResponse.json({ task });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to assign task" },
      { status: 400 }
    );
  }
}

