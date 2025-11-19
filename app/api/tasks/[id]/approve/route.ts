import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { approveTask } from "@/lib/services/task-service";

type Params = {
  params: { id: string };
};

export async function PATCH(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user || session.user.role !== "Guild Master") {
    return NextResponse.json({ message: "Only Guild Masters can approve quests" }, { status: 403 });
  }

  const payload = await request.json();
  const assigneeEmail = payload?.assigneeEmail?.toString().toLowerCase();

  try {
    const task = await approveTask({
      taskId: params.id,
      managerId: session.user.id!,
      assigneeEmail,
    });
    return NextResponse.json({ task });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to approve task" },
      { status: 400 }
    );
  }
}

