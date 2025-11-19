import { initDatabase } from "@/lib/mongodb";
import Project from "@/models/Project";
import Task from "@/models/Task";

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

export async function fetchProjects() {
  await initDatabase();

  const projects = await Project.find()
    .populate("client", "name role email")
    .populate("manager", "name role email")
    .sort({ createdAt: -1 })
    .lean();

  const stats = await Task.aggregate([
    {
      $group: {
        _id: "$project",
        total: { $sum: 1 },
        done: {
          $sum: {
            $cond: [{ $eq: ["$status", "Done"] }, 1, 0],
          },
        },
        inProgress: {
          $sum: {
            $cond: [{ $eq: ["$status", "In-Progress"] }, 1, 0],
          },
        },
        review: {
          $sum: {
            $cond: [{ $eq: ["$status", "Review"] }, 1, 0],
          },
        },
      },
    },
  ]);

  const statMap = new Map(
    stats.map((entry) => [
      entry._id?.toString(),
      {
        total: entry.total,
        done: entry.done,
        inProgress: entry.inProgress,
        review: entry.review,
      },
    ])
  );

  return projects.map((project) => {
    const metrics = statMap.get(project._id.toString()) || {
      total: 0,
      done: 0,
      inProgress: 0,
      review: 0,
    };
    const progress =
      metrics.total === 0 ? 0 : Math.round((metrics.done / metrics.total) * 100);
    
    // Convert to plain object and serialize all fields
    const plainProject = JSON.parse(JSON.stringify(project));
    return {
      ...plainProject,
      metrics,
      progress,
    };
  });
}

export async function fetchProjectSummaries() {
  await initDatabase();
  const projects = await Project.find()
    .select("title status")
    .sort({ title: 1 })
    .lean();
  return projects.map(project => JSON.parse(JSON.stringify(project)));
}

export async function createProject({
  title,
  description,
  clientId,
}: {
  title: string;
  description: string;
  clientId: string;
}) {
  await initDatabase();
  const project = await Project.create({
    title,
    description,
    client: clientId,
  });
  return JSON.parse(JSON.stringify(project));
}

export async function acceptProject({
  projectId,
  managerId,
}: {
  projectId: string;
  managerId: string;
}) {
  await initDatabase();
  const project = await Project.findByIdAndUpdate(
    projectId,
    {
      manager: managerId,
      status: "Active Sprint",
    },
    { new: true }
  )
    .populate("client", "name role email")
    .populate("manager", "name role email");
  
  return project ? JSON.parse(JSON.stringify(project)) : null;
}

