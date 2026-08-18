import { z } from "zod";
import { NextResponse } from "next/server";
import { DEMO_AGENTS, DEMO_PASSWORD } from "@/lib/constants";
import { createSessionToken, setSessionCookie } from "@/lib/session";

const loginSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid credentials" },
        { status: 400 },
      );
    }

    const email = parsed.data.email.toLowerCase();
    const agent = DEMO_AGENTS.find((item) => item.email === email);

    if (!agent || parsed.data.password !== DEMO_PASSWORD) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    const token = await createSessionToken({
      sub: agent.id,
      email: agent.email,
      name: agent.name,
      role: agent.role,
    });

    await setSessionCookie(token);

    return NextResponse.json({
      user: {
        id: agent.id,
        name: agent.name,
        email: agent.email,
        role: agent.role,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to sign in right now" },
      { status: 500 },
    );
  }
}
