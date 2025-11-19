"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";

type Stage = "To-Do" | "In-Progress" | "Review" | "Done";

type Task = {
  id: string;
  title: string;
  stage: Stage;
  assignee: string;
  xp: number;
  tags: string[];
  risk?: "Low" | "Medium" | "High";
};

const backlog: Task[] = [
  {
    id: "T-101",
    title: "Wire onboarding narrative",
    stage: "To-Do",
    assignee: "Lyra Solaris",
    xp: 50,
    tags: ["Story", "Client"],
  },
  {
    id: "T-102",
    title: "Hook XP gain to Kanban events",
    stage: "In-Progress",
    assignee: "Kai Ember",
    xp: 80,
    tags: ["XP", "Automation"],
    risk: "Medium",
  },
  {
    id: "T-103",
    title: "Summon AI quest generator",
    stage: "Review",
    assignee: "Ava Storm",
    xp: 120,
    tags: ["AI", "Boost"],
    risk: "High",
  },
  {
    id: "T-104",
    title: "Leaderboard polish & animations",
    stage: "In-Progress",
    assignee: "Kai Ember",
    xp: 40,
    tags: ["UI"],
  },
  {
    id: "T-105",
    title: "Client portal smoke tests",
    stage: "Done",
    assignee: "Lyra Solaris",
    xp: 60,
    tags: ["QA"],
  },
];

const stages: Stage[] = ["To-Do", "In-Progress", "Review", "Done"];

const riskColor: Record<NonNullable<Task["risk"]>, string> = {
  Low: "risk low",
  Medium: "risk medium",
  High: "risk high",
};

export default function KanbanBoardPage() {
  const { data: session } = useSession();
  const [focus, setFocus] = useState<string>("All guilds");

  const grouped = useMemo(() => {
    return stages.map((stage) => ({
      stage,
      tasks: backlog.filter((task) => task.stage === stage),
    }));
  }, []);

  return (
    <main className="page-shell">
      <section className="hero slim">
        <p className="eyebrow">Kanban · DevQuest</p>
        <h1>
          Visualize the quest log <span>with XP-rich swimlanes.</span>
        </h1>
        <p className="story">
          Every card tracks XP payout, assignee, risk level, and tags so PMs can keep
          the guild aligned without leaving the board.
        </p>
        <div className="filter-row">
          <select value={focus} onChange={(event) => setFocus(event.target.value)}>
            <option>All guilds</option>
            <option>Quest Giver</option>
            <option>Guild Master</option>
            <option>Adventurer</option>
          </select>
          {session?.user && (
            <p>
              Viewing as <strong>{session.user.role}</strong>
            </p>
          )}
        </div>
      </section>

      <section className="board-grid">
        {grouped.map((column) => (
          <article key={column.stage} className="board-column">
            <header>
              <h2>{column.stage}</h2>
              <span>{column.tasks.length} cards</span>
            </header>
            <div className="column-content">
              {column.tasks.map((task) => (
                <div key={task.id} className="task-card">
                  <p className="eyebrow">{task.id}</p>
                  <h3>{task.title}</h3>
                  <p className="assignee">{task.assignee}</p>
                  <p className="xp-callout">{task.xp} XP</p>
                  <ul className="badge-row">
                    {task.tags.map((tag) => (
                      <li key={tag}>{tag}</li>
                    ))}
                  </ul>
                  {task.risk && <span className={riskColor[task.risk]}>Risk · {task.risk}</span>}
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

