import { initDatabase } from "@/lib/mongodb";
import Project from "@/models/Project";
import Task from "@/models/Task";

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
    return {
      ...project,
      metrics,
      progress,
    };
  });
}

export async function fetchProjectSummaries() {
  await initDatabase();
  return Project.find()
    .select("title status")
    .sort({ title: 1 })
    .lean();
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
  return project;
}

export async function acceptProject({
  projectId,
  managerId,
}: {
  projectId: string;
  managerId: string;
}) {
  await initDatabase();
  return Project.findByIdAndUpdate(
    projectId,
    {
      manager: managerId,
      status: "Active Sprint",
    },
    { new: true }
  )
    .populate("client", "name role email")
    .populate("manager", "name role email");
}

