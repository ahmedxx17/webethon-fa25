import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { acceptProject } from "@/lib/services/project-service";

type Params = {
  params: { id: string };
};

export async function PATCH(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const action = body?.action;

  if (action === "accept") {
    if (session.user.role !== "Guild Master") {
      return NextResponse.json(
        { message: "Only Guild Masters can accept quests" },
        { status: 403 }
      );
    }

    try {
      const project = await acceptProject({
        projectId: params.id,
        managerId: session.user.id!,
      });

      return NextResponse.json({ project });
    } catch (error) {
      return NextResponse.json(
        { message: error instanceof Error ? error.message : "Unable to update project" },
        { status: 400 }
      );
    }
  }

  return NextResponse.json(
    { message: "Unsupported action" },
    { status: 400 }
  );
}

