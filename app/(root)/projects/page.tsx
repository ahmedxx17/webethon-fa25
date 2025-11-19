import { auth } from "@/auth";
import { fetchProjects } from "@/lib/services/project-service";
import ProjectsClient from "@/components/pages/projects/projects-client";
import { redirect } from "next/navigation";

export default async function ProjectsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/?login=required");
  }

  const projects = await fetchProjects();

  return (
    <ProjectsClient
      initialProjects={projects}
      sessionUser={session.user}
    />
  );
}

