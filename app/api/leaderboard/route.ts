import { NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/services/user-service";

export async function GET() {
  const leaderboard = await getLeaderboard();
  return NextResponse.json({ leaderboard });
}

