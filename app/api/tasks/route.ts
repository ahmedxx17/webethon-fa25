import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createTask, fetchTasks } from "@/lib/services/task-service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId") || undefined;
  const tasks = await fetchTasks(projectId ?? undefined);
  return NextResponse.json({ tasks });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "Guild Master") {
    return NextResponse.json({ message: "Only Guild Masters can create tasks" }, { status: 403 });
  }

  const payload = await request.json();
  const title = payload?.title?.toString().trim();
  const description = payload?.description?.toString().trim();
  const projectId = payload?.projectId?.toString();
  const assigneeEmail = payload?.assigneeEmail?.toString().toLowerCase();
  const xp = Number(payload?.xp || 50);
  const badges =
    typeof payload?.badges === "string"
      ? payload.badges
          .split(",")
          .map((item: string) => item.trim())
          .filter(Boolean)
      : Array.isArray(payload?.badges)
      ? payload.badges
      : [];

  if (!title || !description || !projectId || !assigneeEmail) {
    return NextResponse.json({ message: "Missing fields" }, { status: 400 });
  }

  try {
    const task = await createTask({
      title,
      description,
      projectId,
      assigneeEmail,
      xp,
      badges,
    });
    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to create task" },
      { status: 400 }
    );
  }
}

