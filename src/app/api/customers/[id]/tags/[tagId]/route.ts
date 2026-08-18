import { NextResponse } from "next/server";
import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";
import { getCustomerProfile } from "@/lib/data/customers";
import { recordActivity } from "@/lib/activity";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; tagId: string }> },
) {
  const { user, response } = await requireUser();
  if (response || !user) return response;
  const { id, tagId } = await context.params;

  const existing = await prisma.customerTag.findUnique({
    where: { customerId_tagId: { customerId: id, tagId } },
    include: { tag: true, customer: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Tag not found on this customer" }, { status: 404 });
  }

  await prisma.customerTag.delete({
    where: { customerId_tagId: { customerId: id, tagId } },
  });

  await recordActivity({
    customerId: id,
    actorId: user.id,
    type: "tag.removed",
    title: "Tag removed",
    message: `${existing.tag.name} was removed from ${existing.customer.name}.`,
    href: `/customers/${id}`,
  });

  return NextResponse.json({ customer: await getCustomerProfile(id) });
}
