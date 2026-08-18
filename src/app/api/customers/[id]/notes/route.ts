import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";
import { getConversationDetail } from "@/lib/data/chat";
import { getCustomerProfile } from "@/lib/data/customers";
import { recordActivity } from "@/lib/activity";

const noteSchema = z.object({
  content: z.string().trim().min(1, "Note cannot be empty").max(2000),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { user, response } = await requireUser();
  if (response || !user) return response;

  const { id } = await context.params;
  const parsed = noteSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid note" },
      { status: 400 },
    );
  }

  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const note = await prisma.note.create({
    data: {
      customerId: id,
      authorId: user.id,
      content: parsed.data.content,
    },
  });

  await recordActivity({
    customerId: id,
    actorId: user.id,
    type: "note.added",
    title: "Note added",
    message: parsed.data.content.slice(0, 140),
    href: `/customers/${id}`,
  });

  const conversationId = new URL(request.url).searchParams.get("conversationId");
  if (conversationId) {
    const conversation = await getConversationDetail(conversationId);
    return NextResponse.json({ conversation, note });
  }

  return NextResponse.json({ customer: await getCustomerProfile(id), note });
}
