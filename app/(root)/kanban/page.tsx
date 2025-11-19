import { auth } from "@/auth";
import { fetchTasks } from "@/lib/services/task-service";
import { fetchProjectSummaries } from "@/lib/services/project-service";
import KanbanClient from "@/components/pages/kanban/kanban-client";

export default async function KanbanBoardPage() {
  const session = await auth();
  const tasks = await fetchTasks();
  const projects = await fetchProjectSummaries();

  return (
    <KanbanClient
      initialTasks={tasks}
      initialProjects={projects}
      sessionUser={session?.user ?? null}
    />
  );
}

