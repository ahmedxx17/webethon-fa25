import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { assignTask } from "@/lib/services/task-service";

type Params = {
  params: { id: string };
};

export async function PATCH(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user || session.user.role !== "Guild Master") {
    return NextResponse.json({ message: "Only Guild Masters can assign quests" }, { status: 403 });
  }

  const payload = await request.json();
  const assigneeEmail = payload?.assigneeEmail?.toString().toLowerCase();
  if (!assigneeEmail) {
    return NextResponse.json({ message: "Assignee email required" }, { status: 400 });
  }

  try {
    const task = await assignTask({ taskId: params.id, assigneeEmail });
    return NextResponse.json({ task });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to assign quest" },
      { status: 400 }
    );
  }
}
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { assignTask } from "@/lib/services/task-service";

type Params = {
  params: { id: string };
};

export async function PATCH(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user || session.user.role !== "Guild Master") {
    return NextResponse.json({ message: "Only Guild Masters can assign tasks" }, { status: 403 });
  }

  const payload = await request.json();
  const assigneeEmail = payload?.assigneeEmail?.toString().toLowerCase();

  if (!assigneeEmail) {
    return NextResponse.json({ message: "Assignee email required" }, { status: 400 });
  }

  try {
    const task = await assignTask({ taskId: params.id, assigneeEmail });
    return NextResponse.json({ task });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to assign task" },
      { status: 400 }
    );
  }
}

