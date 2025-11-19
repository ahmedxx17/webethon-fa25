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
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role;
  if (role !== "Quest Giver" && role !== "Guild Master") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const payload = await request.json();
  const title = payload?.title?.toString().trim();
  const description = payload?.description?.toString().trim();
  const projectId = payload?.projectId?.toString();
  const requestedAssignee = payload?.assigneeEmail?.toString().toLowerCase();
  const xp = Number(payload?.xp || 50);
  const badges: string[] =
    typeof payload?.badges === "string"
      ? payload.badges
          .split(",")
          .map((item: string) => item.trim())
          .filter(Boolean)
      : Array.isArray(payload?.badges)
      ? payload.badges
      : [];

  if (!title || !description || !projectId) {
    return NextResponse.json({ message: "Missing fields" }, { status: 400 });
  }

  const assigneeEmail = role === "Guild Master" ? requestedAssignee : undefined;

  try {
    const task = await createTask({
      title,
      description,
      projectId,
      submittedById: session.user.id!,
      assigneeEmail,
      xp,
      badges,
    });
    return NextResponse.json(
      {
        task,
        message:
          role === "Quest Giver"
            ? "Quest submitted! Guild Masters will review and accept it."
            : "Quest added to the board.",
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to create task" },
      { status: 400 }
    );
  }
}

