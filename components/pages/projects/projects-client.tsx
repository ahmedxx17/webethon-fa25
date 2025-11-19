"use client";

import { useMemo, useState } from "react";
import type { Role } from "@/types/roles";

type ProjectStatus = "Ideation" | "Active Sprint" | "Review" | "Launched";

type ProjectResponse = {
  _id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  client: { name: string; role: string };
  manager?: { name: string };
  metrics: {
    total: number;
    done: number;
    inProgress: number;
    review: number;
  };
  progress: number;
};

type SessionUser = {
  name?: string | null;
  role?: Role;
  email?: string | null;
};

const statusStyles: Record<ProjectStatus, string> = {
  Ideation: "status-pill amber",
  "Active Sprint": "status-pill violet",
  Review: "status-pill teal",
  Launched: "status-pill emerald",
};

type FormState = {
  title: string;
  description: string;
};

type Props = {
  initialProjects: ProjectResponse[];
  sessionUser: SessionUser | null;
};

export default function ProjectsClient({ initialProjects, sessionUser }: Props) {
  const [projects, setProjects] = useState<ProjectResponse[]>(initialProjects);
  const [filter, setFilter] = useState<ProjectStatus | "All">("All");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; variant: "success" | "error" } | null>(
    null
  );
  const [form, setForm] = useState<FormState>({ title: "", description: "" });

  const canCreate = sessionUser?.role === "Quest Giver";
  const canAccept = sessionUser?.role === "Guild Master";

  const filteredProjects = useMemo(() => {
    if (filter === "All") return projects;
    return projects.filter((project) => project.status === filter);
  }, [filter, projects]);

  const refreshProjects = async () => {
    const response = await fetch("/api/projects");
    const payload = await response.json();
    setProjects(payload.projects || []);
  };

  const handleCreateProject = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    setLoading(true);
    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const payload = await response.json();
    if (!response.ok) {
      setFeedback({ text: payload.message || "Unable to create project", variant: "error" });
      setLoading(false);
      return;
    }
    setForm({ title: "", description: "" });
    await refreshProjects();
    setFeedback({ text: "Quest published!", variant: "success" });
    setLoading(false);
  };

  const handleAccept = async (projectId: string) => {
    setFeedback(null);
    setLoading(true);
    const response = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "accept" }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setFeedback({ text: payload.message || "Unable to accept quest", variant: "error" });
      setLoading(false);
      return;
    }
    setFeedback({
      text: `You are now the Guild Master for ${payload.project.title}`,
      variant: "success",
    });
    await refreshProjects();
    setLoading(false);
  };

  return (
    <main className="page-shell">
      <section className="hero slim">
        <p className="eyebrow">Projects · DevQuest</p>
        <h1>
          Track every quest arc <span>from pitch to launch.</span>
        </h1>
        <p className="story">
          See which role owns the next milestone, how much XP remains in the sprint, and how many
          tasks are close to review.
        </p>

        <div className="filter-row">
          <select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)}>
            <option>All</option>
            <option>Ideation</option>
            <option>Active Sprint</option>
            <option>Review</option>
            <option>Launched</option>
          </select>
          {sessionUser && (
            <p>
              Signed in as <strong>{sessionUser.name}</strong> · {sessionUser.role}
            </p>
          )}
        </div>
      </section>

      {feedback && <p className={`message ${feedback.variant}`}>{feedback.text}</p>}

      {canCreate && (
        <section className="form-card">
          <h2>Post a new quest</h2>
          <form className="auth-form" onSubmit={handleCreateProject}>
            <label className="field">
              <span>Title</span>
              <input
                name="title"
                value={form.title}
                placeholder="Launch Kanban Oracle"
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, title: event.target.value }))
                }
                required
              />
            </label>
            <label className="field">
              <span>Description</span>
              <input
                name="description"
                value={form.description}
                placeholder="Describe the quest goals"
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, description: event.target.value }))
                }
                required
              />
            </label>
            <button className="primary" type="submit" disabled={loading}>
              {loading ? "Publishing..." : "Publish Quest"}
            </button>
          </form>
        </section>
      )}

      <section className="grid-list">
        {filteredProjects.map((project) => (
          <article key={project._id} className="project-card">
            <header>
              <div>
                <p className="eyebrow">
                  Client · {project.client?.name ?? "Unknown"} ({project.client?.role})
                </p>
                <h2>{project.title}</h2>
              </div>
              <span className={statusStyles[project.status]}>{project.status}</span>
            </header>

            <p className="story">{project.description}</p>

            <div className="project-meta">
              <span>
                Guild Master · {project.manager?.name ?? "Unassigned"}
              </span>
              <span>{project.progress}% complete</span>
            </div>

            <div className="stats-row">
              <p>{project.metrics.total} total tasks</p>
              <p>{project.metrics.review} in review</p>
              <p>{project.metrics.done} shipped</p>
            </div>

            <div className="xp-track compact">
              <div className="xp-bar" style={{ width: `${project.progress}%` }} />
            </div>

            {canAccept && !project.manager && (
              <button className="ghost" onClick={() => handleAccept(project._id)} disabled={loading}>
                {loading ? "Assigning..." : "Accept Quest"}
              </button>
            )}
          </article>
        ))}
      </section>
    </main>
  );
}

