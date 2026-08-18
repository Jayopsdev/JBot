import { NextResponse } from "next/server";
import { requireUser } from "@/lib/require-user";
import { listConversations } from "@/lib/data/chat";

export async function GET() {
  const { response } = await requireUser();
  if (response) return response;

  const conversations = await listConversations();
  return NextResponse.json({ conversations });
}
