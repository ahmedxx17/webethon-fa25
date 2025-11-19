import { initDatabase } from "@/lib/mongodb";
import Task from "@/models/Task";
import Project from "@/models/Project";
import User from "@/models/User";
import { awardXpToUser } from "./user-service";

// Helper function to serialize MongoDB documents
function serializeDoc(doc: any): any {
  if (!doc) return null;
  if (Array.isArray(doc)) return doc.map(serializeDoc);
  if (typeof doc !== "object" || doc instanceof Date) return doc;

  const serialized: any = {};
  for (const [key, value] of Object.entries(doc)) {
    if (value === null || value === undefined) {
      serialized[key] = value;
    } else if (value instanceof Date) {
      serialized[key] = value.toISOString();
    } else if (typeof value === "object") {
      if ((value as any)?._id) {
        // It's a populated reference, serialize it
        serialized[key] = { ...value, _id: (value as any)._id.toString() };
      } else if (Array.isArray(value)) {
        serialized[key] = value.map((v) =>
          (v as any)?._id ? { ...v, _id: (v as any)._id.toString() } : v
        );
      } else {
        // Recursively serialize nested objects
        serialized[key] = serializeDoc(value);
      }
    } else {
      serialized[key] = value;
    }
  }
  // Ensure _id is converted to string
  if ((doc as any)._id) serialized._id = (doc as any)._id.toString();
  return serialized;
}

export async function fetchTasks(projectId?: string) {
  await initDatabase();
  const filter: Record<string, unknown> = { approved: true };
  if (projectId) {
    filter.project = projectId;
  }

  const query = Task.find(filter)
    .populate("assignee", "name email role xp badges")
    .populate("project", "title status")
    .populate("submittedBy", "name role email");
  const tasks = await query.sort({ createdAt: -1 }).lean();
  return tasks.map(task => JSON.parse(JSON.stringify(task)));
}

export async function fetchPendingTasks() {
  await initDatabase();
  const tasks = await Task.find({ approved: false })
    .populate("submittedBy", "name email role")
    .populate("project", "title status")
    .sort({ createdAt: 1 })
    .lean();
  return tasks.map(task => JSON.parse(JSON.stringify(task)));
}

export async function createTask({
  title,
  description,
  projectId,
  submittedById,
  assigneeEmail,
  xp,
  badges,
}: {
  title: string;
  description: string;
  projectId: string;
  submittedById: string;
  assigneeEmail?: string;
  xp: number;
  badges: string[];
}) {
  await initDatabase();
  const project = await Project.findById(projectId);
  if (!project) throw new Error("Project not found");

  let assigneeId;
  if (assigneeEmail) {
    const assignee = await User.findOne({ email: assigneeEmail.toLowerCase() });
    if (!assignee) throw new Error("Assignee not found");
    assigneeId = assignee._id;
  }

  const task = await Task.create({
    title,
    description,
    project: project._id,
    assignee: assigneeId,
    submittedBy: submittedById,
    approved: Boolean(assigneeId),
    xp,
    badges,
  });

  return task.populate([
    { path: "assignee", select: "name email role xp badges" },
    { path: "project", select: "title status" },
    { path: "submittedBy", select: "name role email" },
  ]);
}

export async function fetchSubmittedTasks(userId: string) {
  await initDatabase();
  const tasks = await Task.find({ submittedBy: userId })
    .populate("project", "title status")
    .populate("assignee", "name email role")
    .sort({ createdAt: -1 })
    .lean();
  return tasks.map(task => JSON.parse(JSON.stringify(task)));
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

  if (status === "Done" && originalStatus !== "Done" && task.assignee) {
    await awardXpToUser(task.assignee.toString(), task.xp, task.badges);
  }

  const populated = await task
    .populate("assignee", "name email role xp badges")
    .populate("project", "title status")
    .populate("submittedBy", "name role email");
  
  return JSON.parse(JSON.stringify(populated));
}

export async function assignTask({
  taskId,
  assigneeEmail,
}: {
  taskId: string;
  assigneeEmail: string;
}) {
  await initDatabase();
  const task = await Task.findById(taskId);
  if (!task) throw new Error("Task not found");
  const assignee = await User.findOne({ email: assigneeEmail.toLowerCase() });
  if (!assignee) throw new Error("Assignee not found");

  task.assignee = assignee._id;
  await task.save();

  const populated = await task
    .populate("assignee", "name email role xp badges")
    .populate("project", "title status")
    .populate("submittedBy", "name role email");
  
  return JSON.parse(JSON.stringify(populated));
}

export async function approveTask({
  taskId,
  managerId,
  assigneeEmail,
}: {
  taskId: string;
  managerId: string;
  assigneeEmail?: string;
}) {
  await initDatabase();
  const task = await Task.findById(taskId);
  if (!task) throw new Error("Task not found");

  task.approved = true;
  task.status = "To-Do";

  if (assigneeEmail) {
    const assignee = await User.findOne({ email: assigneeEmail.toLowerCase() });
    if (!assignee) throw new Error("Assignee not found");
    task.assignee = assignee._id;
  }

  await task.save();

  const populated = await task
    .populate("assignee", "name email role xp badges")
    .populate("project", "title status")
    .populate("submittedBy", "name role email");
  
  return JSON.parse(JSON.stringify(populated));
}

