import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { updateTaskStatus } from "@/lib/services/task-service";

type Params = {
  params: { id: string };
};

const allowedStatuses = ["To-Do", "In-Progress", "Review", "Done"];

export async function PATCH(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const status = payload?.status?.toString();

  if (!status || !allowedStatuses.includes(status)) {
    return NextResponse.json({ message: "Invalid status" }, { status: 400 });
  }

  try {
    const task = await updateTaskStatus({ taskId: params.id, status });
    return NextResponse.json({ task });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to update task" },
      { status: 400 }
    );
  }
}

