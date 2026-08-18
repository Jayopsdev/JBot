import { NextResponse } from "next/server";
import { requireUser } from "@/lib/require-user";
import { listAgents } from "@/lib/data/tickets";

export async function GET() {
  const { response } = await requireUser();
  if (response) return response;
  const agents = await listAgents();
  return NextResponse.json({ agents });
}
