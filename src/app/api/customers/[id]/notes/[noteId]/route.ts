import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";
import { getCustomerProfile } from "@/lib/data/customers";
import { recordActivity } from "@/lib/activity";

const noteSchema = z.object({
  content: z.string().trim().min(1, "Note cannot be empty").max(2000),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; noteId: string }> },
) {
  const { user, response } = await requireUser();
  if (response || !user) return response;
  const { id, noteId } = await context.params;
  const parsed = noteSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid note" }, { status: 400 });
  }

  const note = await prisma.note.findUnique({ where: { id: noteId } });
  if (!note || note.customerId !== id) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  await prisma.note.update({
    where: { id: noteId },
    data: { content: parsed.data.content },
  });

  await recordActivity({
    customerId: id,
    actorId: user.id,
    type: "note.updated",
    title: "Note updated",
    message: parsed.data.content.slice(0, 140),
    href: `/customers/${id}`,
  });

  return NextResponse.json({ customer: await getCustomerProfile(id) });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; noteId: string }> },
) {
  const { user, response } = await requireUser();
  if (response || !user) return response;
  const { id, noteId } = await context.params;
  const note = await prisma.note.findUnique({ where: { id: noteId } });
  if (!note || note.customerId !== id) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  await prisma.note.delete({ where: { id: noteId } });
  return NextResponse.json({ customer: await getCustomerProfile(id) });
}
