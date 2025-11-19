import bcrypt from "bcryptjs";
import User from "@/models/User";
import Project from "@/models/Project";
import Task from "@/models/Task";

let seeded = false;

export async function seedDatabase() {
  if (seeded) return;

  const existing = await User.countDocuments();
  if (existing > 0) {
    seeded = true;
    return;
  }

  const [client, manager, developer] = await User.create([
    {
      name: "Lyra Solaris",
      email: "client@devquest.io",
      role: "Quest Giver",
      xp: 450,
      badges: ["Visionary", "Early Adopter"],
      passwordHash: await bcrypt.hash("summon2025", 10),
    },
    {
      name: "Ava Storm",
      email: "pm@devquest.io",
      role: "Guild Master",
      xp: 680,
      badges: ["Strategist", "Crowd Favorite"],
      passwordHash: await bcrypt.hash("guildmaster", 10),
    },
    {
      name: "Kai Ember",
      email: "dev@devquest.io",
      role: "Adventurer",
      xp: 320,
      badges: ["Bug Slayer", "Night Owl"],
      passwordHash: await bcrypt.hash("adventure", 10),
    },
  ]);

  const projects = await Project.create([
    {
      title: "Forge Daily Quests",
      description:
        "Design micro challenges that PMs can assign for bonus XP and morale boosts.",
      status: "Active Sprint",
      client: client._id,
      manager: manager._id,
    },
    {
      title: "Client Portal",
      description:
        "Give Quest Givers real-time snapshots of Kanban state, XP wins, and risk flags.",
      status: "Review",
      client: client._id,
      manager: manager._id,
    },
    {
      title: "Adventurer Gear Shop",
      description:
        "Reward devs with cosmetic badges and profile flair as they level up.",
      status: "Ideation",
      client: client._id,
    },
  ]);

  await Task.create([
    {
      title: "Wire onboarding narrative",
      description: "Set the storyline for new guild members.",
      status: "To-Do",
      project: projects[0]._id,
      assignee: developer._id,
      xp: 50,
      badges: ["Narrator"],
    },
    {
      title: "Hook XP gain to Kanban events",
      description: "Every stage change should reward XP.",
      status: "In-Progress",
      project: projects[0]._id,
      assignee: developer._id,
      xp: 90,
      badges: ["Systems Thinker"],
    },
    {
      title: "Summon AI quest generator",
      description: "Generate themed tasks when boards look empty.",
      status: "Review",
      project: projects[1]._id,
      assignee: developer._id,
      xp: 120,
      badges: ["Arcane Engineer"],
    },
    {
      title: "Client portal smoke tests",
      description: "Nightly runs to keep regressions out.",
      status: "Done",
      project: projects[1]._id,
      assignee: developer._id,
      xp: 60,
      badges: ["Guardian"],
    },
  ]);

  seeded = true;
}

