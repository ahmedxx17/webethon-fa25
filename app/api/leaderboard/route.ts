import { NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/users";

export async function GET() {
  const leaderboard = getLeaderboard();
  return NextResponse.json({ leaderboard });
}

