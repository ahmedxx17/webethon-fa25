"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import type { Role } from "@/types/roles";

type Mode = "login" | "signup";

const roles: Role[] = ["Quest Giver", "Guild Master", "Adventurer"];

type Message = { variant: "success" | "error"; text: string } | null;

type LeaderboardEntry = {
  id: string;
  name: string;
  role: Role;
  xp: number;
  email: string;
};

export default function Home() {
  const { data: session, status } = useSession();
  const [mode, setMode] = useState<Mode>("login");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<Message>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: roles[2],
  });

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((res) => res.json())
      .then((payload) => setLeaderboard(payload.leaderboard))
      .catch(() => setLeaderboard([]));
  }, [session]);

  const handleInput = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    if (name === "role") {
      setForm((prev) => ({ ...prev, role: value as Role }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const result = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    if (result?.error) {
      setMessage({ variant: "error", text: result.error });
    } else {
      setMessage({ variant: "success", text: "Welcome back to the guild hall!" });
      setForm((prev) => ({ ...prev, password: "" }));
    }

    setIsSubmitting(false);
  };

  const handleSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || "Unable to create account");
      }

      await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      setMessage({
        variant: "success",
        text: "Account created! XP ledger initialized.",
      });
      setForm({ name: "", email: "", password: "", role: roles[2] });
    } catch (error) {
      setMessage({
        variant: "error",
        text: error instanceof Error ? error.message : "Signup failed",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setMessage(null);
    await signOut({ redirect: false });
  };

  const xp = session?.user?.xp ?? 0;
  const level = Math.floor(xp / 100) + 1;
  const progress = xp % 100;

  return (
    <main className="grid-shell">
      <section className="hero">
        <p className="eyebrow">DevQuest • Web-A-Thon</p>
        <h1>
          Turn project management into an <span>RPG adventure</span>
        </h1>
        <p className="story">
          Traditional PM suites drain morale. DevQuest fixes motivation, clarity, and
          transparency by rewarding every update with XP, badges, and an RPG-inspired sense
          of progress. Clients become Quest Givers, PMs lead as Guild Masters, and
          Developers ship features as fearless Adventurers.
        </p>

        <ul className="pill-grid">
          <li>Role-based login and guild dashboards</li>
          <li>Kanban with XP + leveling</li>
          <li>Task assignment + badges</li>
          <li>Optional boosts: AI quests, chat, PWA, Vercel deploy</li>
        </ul>

        <div className="leaderboard">
          <p className="eyebrow">Live Leaderboard</p>
          <ul>
            {leaderboard.map((entry, index) => (
              <li key={entry.email}>
                #{index + 1} {entry.name} · {entry.role} · {entry.xp} XP
              </li>
            ))}
            {leaderboard.length === 0 && <li>No adventurers tracked yet.</li>}
          </ul>
        </div>

        <div className="link-row">
          <Link className="primary link-button" href="/projects">
            View Project Deck
          </Link>
          <Link className="ghost link-button" href="/kanban">
            Open Kanban Board
          </Link>
        </div>
      </section>

      <section className="panel">
        <div className="tabs">
          <button
            className={mode === "login" ? "active" : ""}
            onClick={() => {
              setMessage(null);
              setMode("login");
            }}
            type="button"
          >
            Login
          </button>
          <button
            className={mode === "signup" ? "active" : ""}
            onClick={() => {
              setMessage(null);
              setMode("signup");
            }}
            type="button"
          >
            Sign Up
          </button>
        </div>

        {mode === "login" && (
          <form className="auth-form" onSubmit={handleLogin}>
            <label className="field">
              <span>Email</span>
              <input
                name="email"
                type="email"
                placeholder="you@devquest.io"
                value={form.email}
                onChange={handleInput}
                required
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                name="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleInput}
                required
              />
            </label>

            {message && <p className={`message ${message.variant}`}>{message.text}</p>}

            <button className="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Verifying..." : "Enter the Guild"}
            </button>
          </form>
        )}

        {mode === "signup" && (
          <form className="auth-form" onSubmit={handleSignup}>
            <label className="field">
              <span>Display name</span>
              <input
                name="name"
                type="text"
                placeholder="Aelin the Bold"
                value={form.name}
                onChange={handleInput}
                required
              />
            </label>
            <label className="field">
              <span>Email</span>
              <input
                name="email"
                type="email"
                placeholder="you@devquest.io"
                value={form.email}
                onChange={handleInput}
                required
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                name="password"
                type="password"
                placeholder="Minimum 6 characters"
                value={form.password}
                onChange={handleInput}
                required
              />
            </label>
            <label className="field">
              <span>Role</span>
              <select name="role" value={form.role} onChange={handleInput}>
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>

            {message && <p className={`message ${message.variant}`}>{message.text}</p>}

            <button className="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Summoning..." : "Forge Account"}
            </button>
          </form>
        )}

        <div className="session-card">
          <p className="eyebrow">Session</p>
          {status === "loading" && <p>Checking guild credentials…</p>}
          {!session && status !== "loading" && (
            <p>No active adventurer. Login to sync your quest log.</p>
          )}
          {session && session.user && (
            <>
              <h2>{session.user.name}</h2>
              <p className="role-chip">{session.user.role}</p>
              <div className="xp-track">
                <div className="xp-bar" style={{ width: `${progress}%` }} />
              </div>
              <p>
                Level {level} · {xp} XP total · {100 - progress} XP to next level
              </p>
              <div className="session-actions">
                <button className="ghost" type="button" onClick={() => setMode("signup")}>
                  Invite teammate
                </button>
                <button className="danger" type="button" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
