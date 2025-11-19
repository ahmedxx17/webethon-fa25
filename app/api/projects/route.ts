import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  fetchProjects,
  createProject,
} from "@/lib/services/project-service";

export async function GET() {
  const projects = await fetchProjects();
  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "Quest Giver") {
    return NextResponse.json({ message: "Only clients can create quests" }, { status: 403 });
  }

  const payload = await request.json();
  const title = payload?.title?.toString().trim();
  const description = payload?.description?.toString().trim();

  if (!title || !description) {
    return NextResponse.json({ message: "Title and description are required" }, { status: 400 });
  }

  try {
    const project = await createProject({
      title,
      description,
      clientId: session.user.id!,
    });
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to create project" },
      { status: 400 }
    );
  }
}

