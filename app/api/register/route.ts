import { NextResponse } from "next/server";
import { registerUser } from "@/lib/users";
import { Role } from "@/types/roles";

export async function POST(request: Request) {
  const payload = await request.json();
  const name = payload?.name?.toString().trim();
  const email = payload?.email?.toString().toLowerCase().trim();
  const password = payload?.password?.toString();
  const role = payload?.role as Role | undefined;

  if (!name || !email || !password || !role) {
    return NextResponse.json(
      { message: "Missing name, email, password, or role" },
      { status: 400 },
    );
  }

  if (!email.includes("@")) {
    return NextResponse.json(
      { message: "Please enter a valid email" },
      { status: 400 },
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { message: "Password must be at least 6 characters" },
      { status: 400 },
    );
  }

  try {
    const user = await registerUser({ name, email, password, role });
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Unable to create user",
      },
      { status: 400 },
    );
  }
}

