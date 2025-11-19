"use client";

import { useEffect, useMemo, useState } from "react";
import type { Role } from "@/types/roles";

type Stage = "To-Do" | "In-Progress" | "Review" | "Done";

type TaskResponse = {
  _id: string;
  title: string;
  description: string;
  status: Stage;
  xp: number;
  badges: string[];
  assignee?: { name: string; email: string; role: string };
  project: { _id: string; title: string };
  submittedBy?: { name: string };
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

type Developer = {
  name: string;
  email: string;
};

type PendingTask = {
  _id: string;
  title: string;
  description: string;
  project?: { title: string };
  submittedBy?: { name: string };
};

type Props = {
  initialTasks: TaskResponse[];
  initialProjects: SlimProject[];
  developers: Developer[];
  initialPending: PendingTask[];
  sessionUser: SessionUser | null;
};

export default function KanbanClient({
  initialTasks,
  initialProjects,
  developers,
  initialPending,
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
  const [pendingTasks, setPendingTasks] = useState<PendingTask[]>(initialPending);
  const [pendingAssignments, setPendingAssignments] = useState<Record<string, string>>({});

  const isGuildMaster = sessionUser?.role === "Guild Master";
  const canCreateTask = isGuildMaster;
  const canProgressTask = isGuildMaster || sessionUser?.role === "Adventurer";
  const canAssign = isGuildMaster;
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
    if (isGuildMaster) {
      await refreshPending();
    }
  };

  const refreshPending = async () => {
    if (!isGuildMaster) return;
    const response = await fetch("/api/tasks/pending");
    if (response.ok) {
      const payload = await response.json();
      setPendingTasks(payload.tasks || []);
    }
  };

  useEffect(() => {
    setTaskForm((prev) => ({
      ...prev,
      assigneeEmail: prev.assigneeEmail || developers[0]?.email || "",
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [developers.length]);

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

  const handleApprove = async (taskId: string) => {
    const assigneeEmail = pendingAssignments[taskId];
    if (!assigneeEmail) {
      setFeedback({ text: "Select an adventurer before approving", variant: "error" });
      return;
    }

    const response = await fetch(`/api/tasks/${taskId}/approve`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assigneeEmail }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setFeedback({ text: payload.message || "Unable to approve quest", variant: "error" });
      return;
    }
    setFeedback({ text: "Quest approved and added to the board!", variant: "success" });
    setPendingAssignments((prev) => ({ ...prev, [taskId]: "" }));
    await Promise.all([refreshPending(), refreshBoard()]);
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

      {isGuildMaster && (
        <section className="form-card">
          <h2>Awaiting approval</h2>
          {pendingTasks.length === 0 ? (
            <p>No quests waiting in the queue.</p>
          ) : (
            <ul className="submitted-list">
              {pendingTasks.map((task) => (
                <li key={task._id}>
                  <strong>{task.title}</strong> · {task.project?.title ?? "Unknown"} <br />
                  <small>Requested by {task.submittedBy?.name ?? "Quest Giver"}</small>
                  <div className="field" style={{ marginTop: "0.5rem" }}>
                    <span>Assign adventurer</span>
                    <select
                      value={pendingAssignments[task._id] ?? ""}
                      onChange={(event) =>
                        setPendingAssignments((prev) => ({
                          ...prev,
                          [task._id]: event.target.value,
                        }))
                      }
                    >
                      <option value="">Select teammate</option>
                      {developers.map((developer) => (
                        <option key={developer.email} value={developer.email}>
                          {developer.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    className="primary"
                    style={{ marginTop: "0.75rem" }}
                    onClick={() => handleApprove(task._id)}
                  >
                    Approve & Assign
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

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

            {canAssign && (
              <label className="field">
                <span>Assignee</span>
                <select
                  value={taskForm.assigneeEmail}
                  onChange={(event) =>
                    setTaskForm((prev) => ({ ...prev, assigneeEmail: event.target.value }))
                  }
                  required
                >
                  <option value="" disabled>
                    Select adventurer
                  </option>
                  {developers.map((developer) => (
                    <option key={developer.email} value={developer.email}>
                      {developer.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

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
                  <p className="assignee">{task.assignee?.name ?? "Unassigned"}</p>
                  <p className="xp-callout">{task.xp} XP</p>
                  <ul className="badge-row">
                    {task.badges.map((badge) => (
                      <li key={badge}>{badge}</li>
                    ))}
                  </ul>
                  {canAssign && !task.assignee && (
                    <label className="field">
                      <span>Assign adventurer</span>
                      <select
                        defaultValue=""
                        onChange={async (event) => {
                          const email = event.target.value;
                          if (!email) return;
                          setFeedback(null);
                          const response = await fetch(`/api/tasks/${task._id}/assign`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ assigneeEmail: email }),
                          });
                          const payload = await response.json();
                          if (!response.ok) {
                            setFeedback({
                              text: payload.message || "Unable to assign adventurer",
                              variant: "error",
                            });
                            event.target.value = "";
                            return;
                          }
                          await refreshBoard();
                          setFeedback({
                            text: `${payload.task.assignee.name} is now on this quest`,
                            variant: "success",
                          });
                          event.target.value = "";
                        }}
                      >
                        <option value="">Select teammate</option>
                        {developers.map((developer) => (
                          <option key={developer.email} value={developer.email}>
                            {developer.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  {canProgressTask && task.assignee && (
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

