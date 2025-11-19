import { initDatabase } from "@/lib/mongodb";
import Task from "@/models/Task";
import Project from "@/models/Project";
import User from "@/models/User";
import { awardXpToUser } from "./user-service";

export async function fetchTasks(projectId?: string) {
  await initDatabase();
  const query = Task.find(projectId ? { project: projectId } : {})
    .populate("assignee", "name email role xp badges")
    .populate("project", "title status");
  return query.sort({ createdAt: -1 }).lean();
}

export async function createTask({
  title,
  description,
  projectId,
  assigneeEmail,
  xp,
  badges,
}: {
  title: string;
  description: string;
  projectId: string;
  assigneeEmail: string;
  xp: number;
  badges: string[];
}) {
  await initDatabase();
  const project = await Project.findById(projectId);
  if (!project) throw new Error("Project not found");

  const assignee = await User.findOne({ email: assigneeEmail.toLowerCase() });
  if (!assignee) throw new Error("Assignee not found");

  const task = await Task.create({
    title,
    description,
    project: project._id,
    assignee: assignee._id,
    xp,
    badges,
  });

  return task.populate([
    { path: "assignee", select: "name email role xp badges" },
    { path: "project", select: "title status" },
  ]);
}

export async function updateTaskStatus({
  taskId,
  status,
}: {
  taskId: string;
  status: "To-Do" | "In-Progress" | "Review" | "Done";
}) {
  await initDatabase();
  const task = await Task.findById(taskId);
  if (!task) throw new Error("Task not found");

  const originalStatus = task.status;
  task.status = status;
  await task.save();

  if (status === "Done" && originalStatus !== "Done") {
    await awardXpToUser(task.assignee.toString(), task.xp, task.badges);
  }

  return task
    .populate("assignee", "name email role xp badges")
    .populate("project", "title status");
}

