import { auth } from "@/auth";
import { fetchProjects } from "@/lib/services/project-service";
import ProjectsClient from "@/components/pages/projects/projects-client";

export default async function ProjectsPage() {
  const session = await auth();
  const projects = await fetchProjects();

  return (
    <ProjectsClient
      initialProjects={projects}
      sessionUser={session?.user ?? null}
    />
  );
}

