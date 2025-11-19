import { auth } from "@/auth";
import { fetchTasks, fetchPendingTasks } from "@/lib/services/task-service";
import { fetchProjectSummaries } from "@/lib/services/project-service";
import { listDevelopers } from "@/lib/services/user-service";
import KanbanClient from "@/components/pages/kanban/kanban-client";
import { redirect } from "next/navigation";

export default async function KanbanBoardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/?login=required");
  }

  const [tasks, projects, developers, pending] = await Promise.all([
    fetchTasks(),
    fetchProjectSummaries(),
    listDevelopers(),
    fetchPendingTasks(),
  ]);

  return (
    <KanbanClient
      initialTasks={tasks}
      initialProjects={projects}
      developers={developers}
      initialPending={pending}
      sessionUser={session.user}
    />
  );
}

