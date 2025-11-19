"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import type { Role } from "@/types/roles";

type ProjectStatus = "Ideation" | "Active Sprint" | "Review" | "Launched";

type Project = {
  id: string;
  name: string;
  summary: string;
  owner: Role;
  status: ProjectStatus;
  progress: number;
  badges: string[];
};

const roster: Project[] = [
  {
    id: "dq-001",
    name: "Forge Daily Quests",
    summary:
      "Design micro challenges that PMs can assign for bonus XP and morale boosts.",
    owner: "Guild Master",
    status: "Active Sprint",
    progress: 62,
    badges: ["XP Boost", "Repeatable"],
  },
  {
    id: "dq-002",
    name: "Client Portal",
    summary:
      "Give Quest Givers real-time snapshots of Kanban state, XP wins, and risk flags.",
    owner: "Quest Giver",
    status: "Review",
    progress: 88,
    badges: ["Transparency", "Reporting"],
  },
  {
    id: "dq-003",
    name: "Adventurer Gear Shop",
    summary:
      "Reward devs with cosmetic badges and profile flair as they level up.",
    owner: "Adventurer",
    status: "Ideation",
    progress: 18,
    badges: ["Avatar", "Cosmetics"],
  },
  {
    id: "dq-004",
    name: "Kanban Oracle",
    summary:
      "Ship AI summaries that explain stuck cards and recommend unblocking steps.",
    owner: "Guild Master",
    status: "Active Sprint",
    progress: 47,
    badges: ["AI Assist", "Insights"],
  },
  {
    id: "dq-005",
    name: "Vercel Launch Pad",
    summary:
      "Automate preview deploys and nightly smoke checks so releases stay fearless.",
    owner: "Quest Giver",
    status: "Launched",
    progress: 100,
    badges: ["Deployment", "Automation"],
  },
];

const statusStyles: Record<ProjectStatus, string> = {
  Ideation: "status-pill amber",
  "Active Sprint": "status-pill violet",
  Review: "status-pill teal",
  Launched: "status-pill emerald",
};

const ProjectCard = ({ project }: { project: Project }) => {
  return (
    <article className="project-card">
      <header>
        <div>
          <p className="eyebrow">{project.id}</p>
          <h2>{project.name}</h2>
        </div>
        <span className={statusStyles[project.status]}>{project.status}</span>
      </header>

      <p className="story">{project.summary}</p>

      <ul className="badge-row">
        {project.badges.map((badge) => (
          <li key={badge}>{badge}</li>
        ))}
      </ul>

      <div className="project-meta">
        <span>Owner · {project.owner}</span>
        <span>{project.progress}% complete</span>
      </div>

      <div className="xp-track compact">
        <div className="xp-bar" style={{ width: `${project.progress}%` }} />
      </div>
    </article>
  );
};

export default function ProjectsPage() {
  const { data: session } = useSession();
  const [filter, setFilter] = useState<ProjectStatus | "All">("All");

  const filteredProjects = useMemo(() => {
    if (filter === "All") return roster;
    return roster.filter((project) => project.status === filter);
  }, [filter]);

  return (
    <main className="page-shell">
      <section className="hero slim">
        <p className="eyebrow">Projects · DevQuest</p>
        <h1>
          Track every quest arc <span>from pitch to launch.</span>
        </h1>
        <p className="story">
          See which guild role owns the next milestone, how much XP remains in the
          sprint, and what badges the feature will unlock for the team.
        </p>

        <div className="filter-row">
          <select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)}>
            <option>All</option>
            <option>Ideation</option>
            <option>Active Sprint</option>
            <option>Review</option>
            <option>Launched</option>
          </select>
          {session?.user && (
            <p>
              Signed in as <strong>{session.user.name}</strong> · {session.user.role}
            </p>
          )}
        </div>
      </section>

      <section className="grid-list">
        {filteredProjects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </section>
    </main>
  );
}

