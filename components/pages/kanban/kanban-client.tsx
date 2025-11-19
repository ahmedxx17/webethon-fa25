"use client";

import { useMemo, useState } from "react";
import type { Role } from "@/types/roles";

type Stage = "To-Do" | "In-Progress" | "Review" | "Done";

type TaskResponse = {
  _id: string;
  title: string;
  description: string;
  status: Stage;
  xp: number;
  badges: string[];
  assignee: { name: string; email: string; role: string };
  project: { _id: string; title: string };
};

type SlimProject = {
  _id: string;
  title: string;
};

type SessionUser = {
  name?: string | null;
  role?: Role;
  email?: string | null;
};

const stages: Stage[] = ["To-Do", "In-Progress", "Review", "Done"];

const riskColor: Record<string, string> = {
  "In-Progress": "risk medium",
  Review: "risk medium",
  Done: "risk low",
};

const initialTaskForm = {
  projectId: "",
  title: "",
  description: "",
  assigneeEmail: "",
  xp: 50,
  badges: "",
};

type Props = {
  initialTasks: TaskResponse[];
  initialProjects: SlimProject[];
  sessionUser: SessionUser | null;
};

export default function KanbanClient({
  initialTasks,
  initialProjects,
  sessionUser,
}: Props) {
  const [tasks, setTasks] = useState<TaskResponse[]>(initialTasks);
  const [projects, setProjects] = useState<SlimProject[]>(initialProjects);
  const [view, setView] = useState<"all" | "mine">("all");
  const [taskForm, setTaskForm] = useState({
    ...initialTaskForm,
    projectId: initialProjects[0]?._id ?? "",
  });
  const [feedback, setFeedback] = useState<{ text: string; variant: "success" | "error" } | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  const canCreateTask = sessionUser?.role === "Guild Master";
  const isDeveloper = sessionUser?.role === "Adventurer";

  const visibleTasks = useMemo(() => {
    const email = sessionUser?.email;
    if (view === "mine" && email) {
      return tasks.filter((task) => task.assignee?.email === email);
    }
    return tasks;
  }, [tasks, view, sessionUser?.email]);

  const grouped = stages.map((stage) => ({
    stage,
    tasks: visibleTasks.filter((task) => task.status === stage),
  }));

  const refreshBoard = async () => {
    const [taskRes, projectRes] = await Promise.all([
      fetch("/api/tasks"),
      fetch("/api/projects"),
    ]);
    const taskPayload = await taskRes.json();
    const projectPayload = await projectRes.json();
    setTasks(taskPayload.tasks || []);
    const slimProjects = (projectPayload.projects || []).map(
      (project: SlimProject) => ({
        _id: project._id,
        title: project.title,
      })
    );
    setProjects(slimProjects);
    if (slimProjects.length) {
      setTaskForm((prev) => ({
        ...prev,
        projectId: prev.projectId || slimProjects[0]._id,
      }));
    }
  };

  const handleTaskSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    setLoading(true);
    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(taskForm),
    });
    const payload = await response.json();
    if (!response.ok) {
      setFeedback({ text: payload.message || "Unable to create task", variant: "error" });
      setLoading(false);
      return;
    }
    setTaskForm({
      ...initialTaskForm,
      projectId: projects[0]?._id ?? "",
    });
    await refreshBoard();
    setFeedback({ text: "Task added to the quest log", variant: "success" });
    setLoading(false);
  };

  const handleStatusChange = async (taskId: string, status: Stage) => {
    setFeedback(null);
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setFeedback({ text: payload.message || "Unable to update card", variant: "error" });
      return;
    }
    await refreshBoard();
    if (status === "Done") {
      setFeedback({
        text: `Quest complete! ${payload.task.assignee.name} earned ${payload.task.xp} XP.`,
        variant: "success",
      });
    }
  };

  return (
    <main className="page-shell">
      <section className="hero slim">
        <p className="eyebrow">Kanban · DevQuest</p>
        <h1>
          Visualize the quest log <span>with XP-rich swimlanes.</span>
        </h1>
        <p className="story">
          Every card tracks XP payout, assignee, risk level, and badges so PMs can keep the guild
          aligned without leaving the board.
        </p>
        <div className="filter-row">
          <select value={view} onChange={(event) => setView(event.target.value as typeof view)}>
            <option value="all">All cards</option>
            {sessionUser && <option value="mine">My cards</option>}
          </select>
          {sessionUser && (
            <p>
              Viewing as <strong>{sessionUser.role}</strong>
            </p>
          )}
        </div>
      </section>

      {feedback && <p className={`message ${feedback.variant}`}>{feedback.text}</p>}

      {canCreateTask && (
        <section className="form-card">
          <h2>Create a quest card</h2>
          <form className="auth-form" onSubmit={handleTaskSubmit}>
            <label className="field">
              <span>Project</span>
              <select
                value={taskForm.projectId}
                onChange={(event) =>
                  setTaskForm((prev) => ({ ...prev, projectId: event.target.value }))
                }
                required
              >
                <option value="" disabled>
                  Select project
                </option>
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Title</span>
              <input
                value={taskForm.title}
                onChange={(event) =>
                  setTaskForm((prev) => ({ ...prev, title: event.target.value }))
                }
                required
                placeholder="Summon AI quest generator"
              />
            </label>

            <label className="field">
              <span>Description</span>
              <input
                value={taskForm.description}
                onChange={(event) =>
                  setTaskForm((prev) => ({ ...prev, description: event.target.value }))
                }
                required
                placeholder="Describe the acceptance criteria"
              />
            </label>

            <label className="field">
              <span>Assignee email</span>
              <input
                type="email"
                value={taskForm.assigneeEmail}
                onChange={(event) =>
                  setTaskForm((prev) => ({ ...prev, assigneeEmail: event.target.value }))
                }
                required
                placeholder="dev@devquest.io"
              />
            </label>

            <label className="field">
              <span>XP Reward</span>
              <input
                type="number"
                min={10}
                value={taskForm.xp}
                onChange={(event) =>
                  setTaskForm((prev) => ({ ...prev, xp: Number(event.target.value) }))
                }
              />
            </label>

            <label className="field">
              <span>Badges (comma separated)</span>
              <input
                value={taskForm.badges}
                onChange={(event) =>
                  setTaskForm((prev) => ({ ...prev, badges: event.target.value }))
                }
                placeholder="Arcane Engineer, Systems Thinker"
              />
            </label>

            <button className="primary" type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Card"}
            </button>
          </form>
        </section>
      )}

      <section className="board-grid">
        {grouped.map((column) => (
          <article key={column.stage} className="board-column">
            <header>
              <h2>{column.stage}</h2>
              <span>{column.tasks.length} cards</span>
            </header>
            <div className="column-content">
              {column.tasks.map((task) => (
                <div key={task._id} className="task-card">
                  <p className="eyebrow">{task.project?.title}</p>
                  <h3>{task.title}</h3>
                  <p className="assignee">{task.assignee?.name}</p>
                  <p className="xp-callout">{task.xp} XP</p>
                  <ul className="badge-row">
                    {task.badges.map((badge) => (
                      <li key={badge}>{badge}</li>
                    ))}
                  </ul>
                  {(isDeveloper || canCreateTask) && (
                    <label className="field">
                      <span>Update stage</span>
                      <select
                        value={task.status}
                        onChange={(event) =>
                          handleStatusChange(task._id, event.target.value as Stage)
                        }
                      >
                        {stages.map((stage) => (
                          <option key={stage} value={stage}>
                            {stage}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  {task.status !== "To-Do" && (
                    <span className={riskColor[task.status] || "risk low"}>
                      Stage · {task.status}
                    </span>
                  )}
                </div>
              ))}

              {column.tasks.length === 0 && (
                <p className="empty-state">No quests here yet. Drop a card to begin.</p>
              )}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

